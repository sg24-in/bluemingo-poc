package com.mes.production.service;

import com.mes.production.entity.Inventory;
import com.mes.production.entity.InventoryMovement;
import com.mes.production.entity.Operation;
import com.mes.production.repository.InventoryMovementRepository;
import com.mes.production.repository.InventoryRepository;
import com.mes.production.repository.OperationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryMovementService {

    private final InventoryMovementRepository movementRepository;
    private final InventoryRepository inventoryRepository;
    private final OperationRepository operationRepository;
    private final AuditService auditService;

    /**
     * Record a consume movement
     */
    @Transactional
    public InventoryMovement recordConsume(Long inventoryId, Long operationId, BigDecimal quantity, String reason) {
        return recordMovement(inventoryId, operationId, InventoryMovement.TYPE_CONSUME, quantity, reason);
    }

    /**
     * Record a produce movement
     */
    @Transactional
    public InventoryMovement recordProduce(Long inventoryId, Long operationId, BigDecimal quantity, String reason) {
        return recordMovement(inventoryId, operationId, InventoryMovement.TYPE_PRODUCE, quantity, reason);
    }

    /**
     * Record a hold movement
     */
    @Transactional
    public InventoryMovement recordHold(Long inventoryId, BigDecimal quantity, String reason) {
        return recordMovement(inventoryId, null, InventoryMovement.TYPE_HOLD, quantity, reason);
    }

    /**
     * Record a release movement
     */
    @Transactional
    public InventoryMovement recordRelease(Long inventoryId, BigDecimal quantity, String reason) {
        return recordMovement(inventoryId, null, InventoryMovement.TYPE_RELEASE, quantity, reason);
    }

    /**
     * Record a scrap movement
     */
    @Transactional
    public InventoryMovement recordScrap(Long inventoryId, Long operationId, BigDecimal quantity, String reason) {
        return recordMovement(inventoryId, operationId, InventoryMovement.TYPE_SCRAP, quantity, reason);
    }

    /**
     * Generic record movement method
     */
    @Transactional
    public InventoryMovement recordMovement(Long inventoryId, Long operationId, String movementType,
                                             BigDecimal quantity, String reason) {
        Inventory inventory = inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new RuntimeException("Inventory not found: " + inventoryId));

        Operation operation = operationId != null ?
                operationRepository.findById(operationId).orElse(null) : null;

        InventoryMovement movement = InventoryMovement.builder()
                .inventory(inventory)
                .operation(operation)
                .movementType(movementType)
                .quantity(quantity)
                .timestamp(LocalDateTime.now())
                .reason(reason)
                .status(InventoryMovement.STATUS_EXECUTED)
                .createdBy(getCurrentUser())
                .build();

        movement = movementRepository.save(movement);
        log.info("Recorded {} movement for inventory {}: quantity={}", movementType, inventoryId, quantity);

        auditService.logCreate("INVENTORY_MOVEMENT", movement.getMovementId(),
                String.format("Type: %s, Qty: %s, Inventory: %d", movementType, quantity, inventoryId));

        return movement;
    }

    /**
     * Get movement history for an inventory item
     */
    @Transactional(readOnly = true)
    public List<InventoryMovement> getInventoryMovementHistory(Long inventoryId) {
        return movementRepository.findByInventory_InventoryIdOrderByTimestampDesc(inventoryId);
    }

    /**
     * Get movement history for an operation
     */
    @Transactional(readOnly = true)
    public List<InventoryMovement> getOperationMovements(Long operationId) {
        return movementRepository.findByOperation_OperationIdOrderByTimestampDesc(operationId);
    }

    /**
     * Get movements by batch
     */
    @Transactional(readOnly = true)
    public List<InventoryMovement> getBatchMovements(Long batchId) {
        return movementRepository.findByBatchId(batchId);
    }

    /**
     * Get movements in time range
     */
    @Transactional(readOnly = true)
    public List<InventoryMovement> getMovementsInTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        return movementRepository.findByTimeRange(startTime, endTime);
    }

    /**
     * Get recent movements
     */
    @Transactional(readOnly = true)
    public List<InventoryMovement> getRecentMovements(int limit) {
        return movementRepository.findRecentMovements(PageRequest.of(0, limit));
    }

    /**
     * Get pending movements
     */
    @Transactional(readOnly = true)
    public List<InventoryMovement> getPendingMovements() {
        return movementRepository.findByStatus(InventoryMovement.STATUS_PENDING);
    }

    /**
     * Execute a pending movement
     */
    @Transactional
    public InventoryMovement executeMovement(Long movementId) {
        InventoryMovement movement = movementRepository.findById(movementId)
                .orElseThrow(() -> new RuntimeException("Movement not found: " + movementId));

        if (!InventoryMovement.STATUS_PENDING.equals(movement.getStatus())) {
            throw new RuntimeException("Movement is not in PENDING status");
        }

        movement.setStatus(InventoryMovement.STATUS_EXECUTED);
        return movementRepository.save(movement);
    }

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
    }
}
