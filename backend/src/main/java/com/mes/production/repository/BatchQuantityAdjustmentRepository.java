package com.mes.production.repository;

import com.mes.production.entity.BatchQuantityAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BatchQuantityAdjustmentRepository extends JpaRepository<BatchQuantityAdjustment, Long> {

    /**
     * Find all adjustments for a specific batch
     */
    List<BatchQuantityAdjustment> findByBatchBatchIdOrderByAdjustedOnDesc(Long batchId);

    /**
     * Find adjustments by type
     */
    List<BatchQuantityAdjustment> findByAdjustmentTypeOrderByAdjustedOnDesc(String adjustmentType);

    /**
     * Find adjustments by user
     */
    List<BatchQuantityAdjustment> findByAdjustedByOrderByAdjustedOnDesc(String adjustedBy);

    /**
     * Find adjustments within date range
     */
    @Query("SELECT a FROM BatchQuantityAdjustment a " +
            "WHERE a.adjustedOn BETWEEN :startDate AND :endDate " +
            "ORDER BY a.adjustedOn DESC")
    List<BatchQuantityAdjustment> findByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Count adjustments for a batch
     */
    long countByBatchBatchId(Long batchId);
}
