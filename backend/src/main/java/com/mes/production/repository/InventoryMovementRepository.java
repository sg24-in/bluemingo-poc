package com.mes.production.repository;

import com.mes.production.entity.InventoryMovement;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {

    /**
     * Find all movements for an inventory item
     */
    List<InventoryMovement> findByInventory_InventoryIdOrderByTimestampDesc(Long inventoryId);

    /**
     * Find all movements for an operation
     */
    List<InventoryMovement> findByOperation_OperationIdOrderByTimestampDesc(Long operationId);

    /**
     * Find movements by type
     */
    List<InventoryMovement> findByMovementTypeOrderByTimestampDesc(String movementType);

    /**
     * Find movements by inventory and type
     */
    List<InventoryMovement> findByInventory_InventoryIdAndMovementType(Long inventoryId, String movementType);

    /**
     * Find movements in a time range
     */
    @Query("SELECT m FROM InventoryMovement m WHERE m.timestamp BETWEEN :startTime AND :endTime ORDER BY m.timestamp DESC")
    List<InventoryMovement> findByTimeRange(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    /**
     * Find recent movements with limit
     */
    @Query("SELECT m FROM InventoryMovement m ORDER BY m.timestamp DESC")
    List<InventoryMovement> findRecentMovements(Pageable pageable);

    /**
     * Find movements by batch (via inventory)
     */
    @Query("SELECT m FROM InventoryMovement m WHERE m.inventory.batch.batchId = :batchId ORDER BY m.timestamp DESC")
    List<InventoryMovement> findByBatchId(@Param("batchId") Long batchId);

    /**
     * Count movements by type
     */
    long countByMovementType(String movementType);

    /**
     * Count movements for inventory
     */
    long countByInventory_InventoryId(Long inventoryId);

    /**
     * Find pending movements
     */
    List<InventoryMovement> findByStatus(String status);

    /**
     * Find movements with inventory details
     */
    @Query("SELECT m FROM InventoryMovement m JOIN FETCH m.inventory WHERE m.operation.operationId = :operationId")
    List<InventoryMovement> findByOperationWithInventory(@Param("operationId") Long operationId);
}
