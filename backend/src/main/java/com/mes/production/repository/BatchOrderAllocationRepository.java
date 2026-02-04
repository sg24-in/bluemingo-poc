package com.mes.production.repository;

import com.mes.production.entity.BatchOrderAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface BatchOrderAllocationRepository extends JpaRepository<BatchOrderAllocation, Long> {

    /**
     * Find all allocations for a batch
     */
    List<BatchOrderAllocation> findByBatch_BatchId(Long batchId);

    /**
     * Find all allocations for an order line
     */
    List<BatchOrderAllocation> findByOrderLineItem_OrderLineId(Long orderLineId);

    /**
     * Find allocation by batch and order line
     */
    Optional<BatchOrderAllocation> findByBatch_BatchIdAndOrderLineItem_OrderLineId(Long batchId, Long orderLineId);

    /**
     * Find active allocations for a batch
     */
    List<BatchOrderAllocation> findByBatch_BatchIdAndStatus(Long batchId, String status);

    /**
     * Find active allocations for an order line
     */
    List<BatchOrderAllocation> findByOrderLineItem_OrderLineIdAndStatus(Long orderLineId, String status);

    /**
     * Calculate total allocated quantity for a batch
     */
    @Query("SELECT COALESCE(SUM(a.allocatedQty), 0) FROM BatchOrderAllocation a WHERE a.batch.batchId = :batchId AND a.status = 'ALLOCATED'")
    BigDecimal getTotalAllocatedQtyForBatch(@Param("batchId") Long batchId);

    /**
     * Calculate total allocated quantity for an order line
     */
    @Query("SELECT COALESCE(SUM(a.allocatedQty), 0) FROM BatchOrderAllocation a WHERE a.orderLineItem.orderLineId = :orderLineId AND a.status = 'ALLOCATED'")
    BigDecimal getTotalAllocatedQtyForOrderLine(@Param("orderLineId") Long orderLineId);

    /**
     * Find allocations with batch details
     */
    @Query("SELECT a FROM BatchOrderAllocation a JOIN FETCH a.batch WHERE a.orderLineItem.orderLineId = :orderLineId")
    List<BatchOrderAllocation> findByOrderLineWithBatchDetails(@Param("orderLineId") Long orderLineId);

    /**
     * Find allocations with order line details
     */
    @Query("SELECT a FROM BatchOrderAllocation a JOIN FETCH a.orderLineItem WHERE a.batch.batchId = :batchId")
    List<BatchOrderAllocation> findByBatchWithOrderDetails(@Param("batchId") Long batchId);

    /**
     * Count active allocations for batch
     */
    long countByBatch_BatchIdAndStatus(Long batchId, String status);

    /**
     * Check if batch is fully allocated
     */
    @Query("SELECT CASE WHEN (b.quantity <= COALESCE((SELECT SUM(a.allocatedQty) FROM BatchOrderAllocation a WHERE a.batch.batchId = :batchId AND a.status = 'ALLOCATED'), 0)) THEN true ELSE false END " +
           "FROM Batch b WHERE b.batchId = :batchId")
    boolean isBatchFullyAllocated(@Param("batchId") Long batchId);
}
