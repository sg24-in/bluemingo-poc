package com.mes.production.service;

import com.mes.production.dto.OperationDTO;
import com.mes.production.entity.Operation;
import com.mes.production.repository.OperationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OperationService {

    private final OperationRepository operationRepository;
    private final AuditService auditService;

    /**
     * Get all operations
     */
    public List<OperationDTO> getAllOperations() {
        return operationRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get operation by ID
     */
    public OperationDTO getOperationById(Long operationId) {
        Operation operation = operationRepository.findByIdWithDetails(operationId)
                .orElseThrow(() -> new RuntimeException("Operation not found: " + operationId));
        return convertToDTOWithDetails(operation);
    }

    /**
     * Get operations by status
     */
    public List<OperationDTO> getOperationsByStatus(String status) {
        return operationRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get blocked operations
     */
    public List<OperationDTO> getBlockedOperations() {
        return operationRepository.findByStatus(Operation.STATUS_BLOCKED).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Block an operation
     */
    @Transactional
    public OperationDTO.StatusUpdateResponse blockOperation(Long operationId, String reason) {
        log.info("Blocking operation: {}", operationId);

        String currentUser = getCurrentUser();
        Operation operation = getOperationEntity(operationId);
        String oldStatus = operation.getStatus();

        // Validate current status - can't block completed or already blocked operations
        if (Operation.STATUS_CONFIRMED.equals(oldStatus)) {
            throw new RuntimeException("Cannot block a confirmed operation");
        }

        if (Operation.STATUS_BLOCKED.equals(oldStatus)) {
            throw new RuntimeException("Operation is already blocked");
        }

        // Update status
        operation.setStatus(Operation.STATUS_BLOCKED);
        operation.setBlockReason(reason);
        operation.setBlockedBy(currentUser);
        operation.setBlockedOn(LocalDateTime.now());
        operation.setUpdatedBy(currentUser);
        operationRepository.save(operation);

        log.info("Operation {} blocked by {}", operationId, currentUser);
        auditService.logStatusChange("OPERATION", operationId, oldStatus, Operation.STATUS_BLOCKED);

        return OperationDTO.StatusUpdateResponse.builder()
                .operationId(operationId)
                .previousStatus(oldStatus)
                .newStatus(Operation.STATUS_BLOCKED)
                .message("Operation blocked. Reason: " + reason)
                .updatedBy(currentUser)
                .updatedOn(operation.getUpdatedOn())
                .build();
    }

    /**
     * Unblock an operation
     */
    @Transactional
    public OperationDTO.StatusUpdateResponse unblockOperation(Long operationId) {
        log.info("Unblocking operation: {}", operationId);

        String currentUser = getCurrentUser();
        Operation operation = getOperationEntity(operationId);
        String oldStatus = operation.getStatus();

        if (!Operation.STATUS_BLOCKED.equals(oldStatus)) {
            throw new RuntimeException("Operation is not blocked. Current status: " + oldStatus);
        }

        // Restore to READY status (unblocking makes it available for work)
        operation.setStatus(Operation.STATUS_READY);
        operation.setBlockReason(null);
        operation.setBlockedBy(null);
        operation.setBlockedOn(null);
        operation.setUpdatedBy(currentUser);
        operationRepository.save(operation);

        log.info("Operation {} unblocked by {}", operationId, currentUser);
        auditService.logStatusChange("OPERATION", operationId, oldStatus, Operation.STATUS_READY);

        return OperationDTO.StatusUpdateResponse.builder()
                .operationId(operationId)
                .previousStatus(oldStatus)
                .newStatus(Operation.STATUS_READY)
                .message("Operation unblocked and ready for processing")
                .updatedBy(currentUser)
                .updatedOn(operation.getUpdatedOn())
                .build();
    }

    private Operation getOperationEntity(Long operationId) {
        return operationRepository.findById(operationId)
                .orElseThrow(() -> new RuntimeException("Operation not found: " + operationId));
    }

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
    }

    private OperationDTO convertToDTO(Operation operation) {
        return OperationDTO.builder()
                .operationId(operation.getOperationId())
                .processId(operation.getProcess() != null ? operation.getProcess().getProcessId() : null)
                .operationName(operation.getOperationName())
                .operationCode(operation.getOperationCode())
                .operationType(operation.getOperationType())
                .sequenceNumber(operation.getSequenceNumber())
                .status(operation.getStatus())
                .targetQty(operation.getTargetQty())
                .confirmedQty(operation.getConfirmedQty())
                .blockReason(operation.getBlockReason())
                .blockedBy(operation.getBlockedBy())
                .blockedOn(operation.getBlockedOn())
                .build();
    }

    private OperationDTO convertToDTOWithDetails(Operation operation) {
        OperationDTO dto = convertToDTO(operation);
        if (operation.getProcess() != null) {
            dto.setProcessName(operation.getProcess().getProcessName());
        }
        // Per MES Consolidated Specification: Operation has OrderLineItem (runtime ref)
        if (operation.getOrderLineItem() != null) {
            dto.setProductSku(operation.getOrderLineItem().getProductSku());
            if (operation.getOrderLineItem().getOrder() != null) {
                dto.setOrderNumber(String.valueOf(operation.getOrderLineItem().getOrder().getOrderId()));
            }
        }
        return dto;
    }
}
