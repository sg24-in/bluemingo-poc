package com.mes.production.service;

import com.mes.production.dto.ProcessDTO;
import com.mes.production.entity.Operation;
import com.mes.production.entity.Process;
import com.mes.production.entity.Batch;
import com.mes.production.repository.BatchRepository;
import com.mes.production.repository.HoldRecordRepository;
import com.mes.production.repository.OperationRepository;
import com.mes.production.repository.ProcessRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service for managing Process entities.
 *
 * Per MES Consolidated Specification:
 * - Process is design-time entity (ProcessID, ProcessName, Status)
 * - Operations link to Process via ProcessID
 * - Runtime tracking happens at Operation level via OrderLineItem FK
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProcessService {

    private final ProcessRepository processRepository;
    private final OperationRepository operationRepository;
    private final HoldRecordRepository holdRecordRepository;
    private final AuditService auditService;
    private final BatchRepository batchRepository;

    // Valid status transitions
    private static final Set<String> VALID_STATUSES = Set.of(
            Process.STATUS_READY,
            Process.STATUS_IN_PROGRESS,
            Process.STATUS_QUALITY_PENDING,
            Process.STATUS_COMPLETED,
            Process.STATUS_REJECTED,
            Process.STATUS_ON_HOLD
    );

    /**
     * Get all processes
     */
    @Transactional(readOnly = true)
    public List<ProcessDTO.Response> getAllProcesses() {
        return processRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get process by ID with operations
     */
    @Transactional(readOnly = true)
    public ProcessDTO.Response getProcessById(Long processId) {
        Process process = processRepository.findByIdWithOperations(processId)
                .orElseThrow(() -> new RuntimeException("Process not found: " + processId));
        return toResponse(process);
    }

    /**
     * Get all processes by status
     */
    @Transactional(readOnly = true)
    public List<ProcessDTO.Response> getProcessesByStatus(String status) {
        return processRepository.findByStatus(status).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Create a new process
     */
    @Transactional
    public ProcessDTO.Response createProcess(ProcessDTO.CreateRequest request) {
        String currentUser = getCurrentUser();

        Process process = Process.builder()
                .processName(request.getProcessName())
                .status(request.getStatus() != null ? request.getStatus() : Process.STATUS_READY)
                .createdBy(currentUser)
                .build();

        Process saved = processRepository.save(process);
        log.info("Created process: {} by {}", saved.getProcessId(), currentUser);

        auditService.logCreate("PROCESS", saved.getProcessId(), saved.getProcessName());

        return toResponse(saved);
    }

    /**
     * Update an existing process
     */
    @Transactional
    public ProcessDTO.Response updateProcess(Long processId, ProcessDTO.UpdateRequest request) {
        Process process = getProcessEntity(processId);
        String currentUser = getCurrentUser();
        String oldName = process.getProcessName();

        if (request.getProcessName() != null) {
            process.setProcessName(request.getProcessName());
        }
        if (request.getStatus() != null) {
            process.setStatus(request.getStatus());
        }

        process.setUpdatedBy(currentUser);
        process.setUpdatedOn(LocalDateTime.now());

        Process saved = processRepository.save(process);
        log.info("Updated process: {} by {}", processId, currentUser);

        auditService.logUpdate("PROCESS", processId, "processName", oldName, saved.getProcessName());

        return toResponse(saved);
    }

    /**
     * Transition process to QUALITY_PENDING status
     */
    @Transactional
    public ProcessDTO.StatusUpdateResponse transitionToQualityPending(Long processId, String notes) {
        Process process = getProcessEntity(processId);
        String currentUser = getCurrentUser();
        String oldStatus = process.getStatus();

        // Validate current status
        if (!Process.STATUS_IN_PROGRESS.equals(oldStatus) && !Process.STATUS_COMPLETED.equals(oldStatus)) {
            throw new RuntimeException("Process must be IN_PROGRESS or COMPLETED to transition to QUALITY_PENDING. Current status: " + oldStatus);
        }

        // Check if on hold
        validateNotOnHold(processId);

        // Update status
        process.setStatus(Process.STATUS_QUALITY_PENDING);
        process.setUsageDecision(Process.DECISION_PENDING);
        process.setUpdatedBy(currentUser);
        process.setUpdatedOn(LocalDateTime.now());
        processRepository.save(process);

        log.info("Process {} transitioned to QUALITY_PENDING by {}", processId, currentUser);

        // Audit
        auditService.logStatusChange("PROCESS", processId, oldStatus, Process.STATUS_QUALITY_PENDING);

        return ProcessDTO.StatusUpdateResponse.builder()
                .processId(processId)
                .processName(process.getProcessName())
                .previousStatus(oldStatus)
                .newStatus(Process.STATUS_QUALITY_PENDING)
                .usageDecision(Process.DECISION_PENDING)
                .updatedBy(currentUser)
                .updatedOn(process.getUpdatedOn())
                .message("Process moved to quality pending status")
                .build();
    }

    /**
     * Make quality decision on a process
     */
    @Transactional
    public ProcessDTO.StatusUpdateResponse makeQualityDecision(ProcessDTO.QualityDecisionRequest request) {
        Process process = getProcessEntity(request.getProcessId());
        String currentUser = getCurrentUser();
        String oldStatus = process.getStatus();

        // Validate current status
        if (!Process.STATUS_QUALITY_PENDING.equals(oldStatus)) {
            throw new RuntimeException("Process must be in QUALITY_PENDING status to make quality decision. Current status: " + oldStatus);
        }

        // Check if on hold
        validateNotOnHold(request.getProcessId());

        String newStatus;
        String decision = request.getDecision().toUpperCase();

        if (Process.DECISION_ACCEPT.equals(decision)) {
            newStatus = Process.STATUS_COMPLETED;
            process.setUsageDecision(Process.DECISION_ACCEPT);
        } else if (Process.DECISION_REJECT.equals(decision)) {
            newStatus = Process.STATUS_REJECTED;
            process.setUsageDecision(Process.DECISION_REJECT);
        } else {
            throw new RuntimeException("Invalid decision: " + decision + ". Must be ACCEPT or REJECT");
        }

        // Update status
        process.setStatus(newStatus);
        process.setUpdatedBy(currentUser);
        process.setUpdatedOn(LocalDateTime.now());
        processRepository.save(process);

        log.info("Process {} quality decision: {} -> {} by {}", request.getProcessId(), decision, newStatus, currentUser);

        // Audit
        auditService.logStatusChange("PROCESS", request.getProcessId(), oldStatus, newStatus);

        // Propagate quality decision to batches generated in this process's operations
        propagateQualityToBatches(process, decision, request.getReason(), currentUser);

        String message = Process.DECISION_ACCEPT.equals(decision)
                ? "Process accepted and marked as completed"
                : "Process rejected. Reason: " + (request.getReason() != null ? request.getReason() : "Not specified");

        return ProcessDTO.StatusUpdateResponse.builder()
                .processId(request.getProcessId())
                .processName(process.getProcessName())
                .previousStatus(oldStatus)
                .newStatus(newStatus)
                .usageDecision(decision)
                .updatedBy(currentUser)
                .updatedOn(process.getUpdatedOn())
                .message(message)
                .build();
    }

    /**
     * Propagate quality decision to all batches generated at operations in this process
     */
    private void propagateQualityToBatches(Process process, String decision, String reason, String currentUser) {
        List<Operation> operations = operationRepository.findByProcessIdOrderBySequence(process.getProcessId());
        LocalDateTime now = LocalDateTime.now();

        for (Operation operation : operations) {
            List<Batch> batches = batchRepository.findByGeneratedAtOperation(operation.getOperationId());
            for (Batch batch : batches) {
                String oldBatchStatus = batch.getStatus();
                if (Process.DECISION_ACCEPT.equals(decision)) {
                    batch.setStatus(Batch.STATUS_AVAILABLE);
                    batch.setApprovedBy(currentUser);
                    batch.setApprovedOn(now);
                } else if (Process.DECISION_REJECT.equals(decision)) {
                    batch.setStatus(Batch.STATUS_BLOCKED);
                    batch.setRejectedBy(currentUser);
                    batch.setRejectedOn(now);
                    batch.setRejectionReason(reason != null ? reason : "Quality rejected");
                }
                batchRepository.save(batch);
                log.info("Batch {} quality propagated: {} -> {} (decision: {})",
                    batch.getBatchId(), oldBatchStatus, batch.getStatus(), decision);
                auditService.logStatusChange("BATCH", batch.getBatchId(), oldBatchStatus, batch.getStatus());
            }
        }
    }

    /**
     * Update process status (generic)
     */
    @Transactional
    public ProcessDTO.StatusUpdateResponse updateStatus(ProcessDTO.StatusUpdateRequest request) {
        Process process = getProcessEntity(request.getProcessId());
        String currentUser = getCurrentUser();
        String oldStatus = process.getStatus();
        String newStatus = request.getNewStatus().toUpperCase();

        // Validate new status
        if (!VALID_STATUSES.contains(newStatus)) {
            throw new RuntimeException("Invalid status: " + newStatus + ". Valid statuses: " + VALID_STATUSES);
        }

        // Validate transition
        validateStatusTransition(oldStatus, newStatus);

        // Check if on hold (unless transitioning to ON_HOLD)
        if (!Process.STATUS_ON_HOLD.equals(newStatus)) {
            validateNotOnHold(request.getProcessId());
        }

        // Update status
        process.setStatus(newStatus);
        process.setUpdatedBy(currentUser);
        process.setUpdatedOn(LocalDateTime.now());
        processRepository.save(process);

        log.info("Process {} status updated: {} -> {} by {}", request.getProcessId(), oldStatus, newStatus, currentUser);

        // Audit
        auditService.logStatusChange("PROCESS", request.getProcessId(), oldStatus, newStatus);

        return ProcessDTO.StatusUpdateResponse.builder()
                .processId(request.getProcessId())
                .processName(process.getProcessName())
                .previousStatus(oldStatus)
                .newStatus(newStatus)
                .usageDecision(process.getUsageDecision())
                .updatedBy(currentUser)
                .updatedOn(process.getUpdatedOn())
                .message("Process status updated successfully")
                .build();
    }

    /**
     * Check if all operations in a process are confirmed
     */
    @Transactional(readOnly = true)
    public boolean areAllOperationsConfirmed(Long processId) {
        Process process = processRepository.findByIdWithOperations(processId)
                .orElseThrow(() -> new RuntimeException("Process not found: " + processId));

        if (process.getOperations() == null || process.getOperations().isEmpty()) {
            return false;
        }

        return process.getOperations().stream()
                .allMatch(op -> "CONFIRMED".equals(op.getStatus()));
    }

    /**
     * Get quality pending processes
     */
    @Transactional(readOnly = true)
    public List<ProcessDTO.Response> getQualityPendingProcesses() {
        return processRepository.findQualityPending().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private Process getProcessEntity(Long processId) {
        return processRepository.findById(processId)
                .orElseThrow(() -> new RuntimeException("Process not found: " + processId));
    }

    private void validateNotOnHold(Long processId) {
        if (holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("PROCESS", processId, "ACTIVE")) {
            throw new RuntimeException("Process is on hold and cannot be updated");
        }
    }

    private void validateStatusTransition(String fromStatus, String toStatus) {
        // Define valid transitions
        boolean validTransition = switch (fromStatus) {
            case "READY" -> Set.of("IN_PROGRESS", "ON_HOLD").contains(toStatus);
            case "IN_PROGRESS" -> Set.of("QUALITY_PENDING", "COMPLETED", "ON_HOLD").contains(toStatus);
            case "QUALITY_PENDING" -> Set.of("COMPLETED", "REJECTED", "ON_HOLD").contains(toStatus);
            case "COMPLETED" -> Set.of("QUALITY_PENDING").contains(toStatus); // Can revert if needed
            case "REJECTED" -> Set.of("QUALITY_PENDING", "ON_HOLD").contains(toStatus); // Can retry
            case "ON_HOLD" -> Set.of("READY", "IN_PROGRESS", "QUALITY_PENDING").contains(toStatus);
            default -> false;
        };

        if (!validTransition) {
            throw new RuntimeException("Invalid status transition from " + fromStatus + " to " + toStatus);
        }
    }

    private ProcessDTO.Response toResponse(Process process) {
        List<ProcessDTO.OperationSummary> operations = null;
        if (process.getOperations() != null) {
            operations = process.getOperations().stream()
                    .map(op -> ProcessDTO.OperationSummary.builder()
                            .operationId(op.getOperationId())
                            .operationName(op.getOperationName())
                            .operationCode(op.getOperationCode())
                            .status(op.getStatus())
                            .sequenceNumber(op.getSequenceNumber())
                            .orderLineId(op.getOrderLineItem() != null ? op.getOrderLineItem().getOrderLineId() : null)
                            .build())
                    .collect(Collectors.toList());
        }

        return ProcessDTO.Response.builder()
                .processId(process.getProcessId())
                .processName(process.getProcessName())
                .status(process.getStatus())
                .usageDecision(process.getUsageDecision())
                .createdOn(process.getCreatedOn())
                .createdBy(process.getCreatedBy())
                .updatedOn(process.getUpdatedOn())
                .updatedBy(process.getUpdatedBy())
                .operations(operations)
                .build();
    }

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
    }
}
