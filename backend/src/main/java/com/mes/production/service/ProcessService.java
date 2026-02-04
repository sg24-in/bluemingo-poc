package com.mes.production.service;

import com.mes.production.dto.ProcessDTO;
import com.mes.production.entity.Operation;
import com.mes.production.entity.Process;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class ProcessService {

    private final ProcessRepository processRepository;
    private final OperationRepository operationRepository;
    private final HoldRecordRepository holdRecordRepository;
    private final AuditService auditService;

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
     * Transition process to QUALITY_PENDING status
     * This is called when all operations are confirmed and quality inspection is needed
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
                .stageName(process.getStageName())
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
     * ACCEPT -> COMPLETED, REJECT -> REJECTED
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

        String message = Process.DECISION_ACCEPT.equals(decision)
                ? "Process accepted and marked as completed"
                : "Process rejected. Reason: " + (request.getReason() != null ? request.getReason() : "Not specified");

        return ProcessDTO.StatusUpdateResponse.builder()
                .processId(request.getProcessId())
                .stageName(process.getStageName())
                .previousStatus(oldStatus)
                .newStatus(newStatus)
                .usageDecision(decision)
                .updatedBy(currentUser)
                .updatedOn(process.getUpdatedOn())
                .message(message)
                .build();
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
                .stageName(process.getStageName())
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
                            .build())
                    .collect(Collectors.toList());
        }

        return ProcessDTO.Response.builder()
                .processId(process.getProcessId())
                .orderLineId(process.getOrderLineItem() != null ? process.getOrderLineItem().getOrderLineId() : null)
                .stageName(process.getStageName())
                .stageSequence(process.getStageSequence())
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
