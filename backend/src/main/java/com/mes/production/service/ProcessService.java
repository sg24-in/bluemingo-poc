package com.mes.production.service;

import com.mes.production.dto.ProcessDTO;
import com.mes.production.entity.Operation;
import com.mes.production.entity.Process;
import com.mes.production.entity.ProcessStatus;
import com.mes.production.repository.OperationRepository;
import com.mes.production.repository.ProcessRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing Process templates (design-time entities).
 *
 * Per MES Consolidated Specification:
 * - Process is a design-time template (ProcessID, ProcessName, Status)
 * - Runtime execution tracking happens at Operation level via OrderLineItem FK
 * - Operations reference Process for template definition only
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProcessService {

    private final ProcessRepository processRepository;
    private final OperationRepository operationRepository;
    private final AuditService auditService;

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
        ProcessStatus processStatus = ProcessStatus.valueOf(status.toUpperCase());
        return processRepository.findByStatus(processStatus).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get active processes only
     */
    @Transactional(readOnly = true)
    public List<ProcessDTO.Response> getActiveProcesses() {
        return processRepository.findByStatus(ProcessStatus.ACTIVE).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Create a new process template
     */
    @Transactional
    public ProcessDTO.Response createProcess(ProcessDTO.CreateRequest request) {
        String currentUser = getCurrentUser();

        ProcessStatus status = ProcessStatus.DRAFT;
        if (request.getStatus() != null) {
            status = ProcessStatus.valueOf(request.getStatus().toUpperCase());
        }

        Process process = Process.builder()
                .processName(request.getProcessName())
                .status(status)
                .createdBy(currentUser)
                .build();

        Process saved = processRepository.save(process);
        log.info("Created process template: {} by {}", saved.getProcessId(), currentUser);

        auditService.logCreate("PROCESS", saved.getProcessId(), saved.getProcessName());

        return toResponse(saved);
    }

    /**
     * Update an existing process template
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
            ProcessStatus newStatus = ProcessStatus.valueOf(request.getStatus().toUpperCase());
            process.setStatus(newStatus);
        }

        process.setUpdatedBy(currentUser);
        process.setUpdatedOn(LocalDateTime.now());

        Process saved = processRepository.save(process);
        log.info("Updated process template: {} by {}", processId, currentUser);

        auditService.logUpdate("PROCESS", processId, "processName", oldName, saved.getProcessName());

        return toResponse(saved);
    }

    /**
     * Delete a process template (soft delete - sets status to INACTIVE)
     */
    @Transactional
    public void deleteProcess(Long processId) {
        Process process = getProcessEntity(processId);
        String currentUser = getCurrentUser();

        // Check if process has operations referencing it
        List<Operation> operations = operationRepository.findByProcessIdOrderBySequence(processId);
        if (!operations.isEmpty()) {
            throw new RuntimeException("Cannot delete process with existing operations. Found " + operations.size() + " operations.");
        }

        process.setStatus(ProcessStatus.INACTIVE);
        process.setUpdatedBy(currentUser);
        process.setUpdatedOn(LocalDateTime.now());
        processRepository.save(process);

        log.info("Deleted (soft) process template: {} by {}", processId, currentUser);
        auditService.logDelete("PROCESS", processId, process.getProcessName());
    }

    /**
     * Activate a process template (DRAFT -> ACTIVE)
     */
    @Transactional
    public ProcessDTO.Response activateProcess(Long processId) {
        Process process = getProcessEntity(processId);
        String currentUser = getCurrentUser();
        ProcessStatus oldStatus = process.getStatus();

        if (oldStatus != ProcessStatus.DRAFT && oldStatus != ProcessStatus.INACTIVE) {
            throw new RuntimeException("Process must be DRAFT or INACTIVE to activate. Current status: " + oldStatus);
        }

        process.setStatus(ProcessStatus.ACTIVE);
        process.setUpdatedBy(currentUser);
        process.setUpdatedOn(LocalDateTime.now());
        processRepository.save(process);

        log.info("Activated process template: {} by {}", processId, currentUser);
        auditService.logStatusChange("PROCESS", processId, oldStatus.name(), ProcessStatus.ACTIVE.name());

        return toResponse(process);
    }

    /**
     * Deactivate a process template (ACTIVE -> INACTIVE)
     */
    @Transactional
    public ProcessDTO.Response deactivateProcess(Long processId) {
        Process process = getProcessEntity(processId);
        String currentUser = getCurrentUser();
        ProcessStatus oldStatus = process.getStatus();

        if (oldStatus != ProcessStatus.ACTIVE) {
            throw new RuntimeException("Process must be ACTIVE to deactivate. Current status: " + oldStatus);
        }

        process.setStatus(ProcessStatus.INACTIVE);
        process.setUpdatedBy(currentUser);
        process.setUpdatedOn(LocalDateTime.now());
        processRepository.save(process);

        log.info("Deactivated process template: {} by {}", processId, currentUser);
        auditService.logStatusChange("PROCESS", processId, oldStatus.name(), ProcessStatus.INACTIVE.name());

        return toResponse(process);
    }

    private Process getProcessEntity(Long processId) {
        return processRepository.findById(processId)
                .orElseThrow(() -> new RuntimeException("Process not found: " + processId));
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
                .status(process.getStatus().name())
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
