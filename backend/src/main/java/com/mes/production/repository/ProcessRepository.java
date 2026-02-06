package com.mes.production.repository;

import com.mes.production.entity.Process;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Process entity (runtime process execution).
 *
 * Per MES Consolidated Specification:
 * - Process is the runtime entity tracking execution for OrderLineItems
 * - ProcessTemplate handles design-time definitions
 */
@Repository
public interface ProcessRepository extends JpaRepository<Process, Long> {

    /**
     * Find processes by order line item ID
     */
    List<Process> findByOrderLineItem_OrderLineId(Long orderLineId);

    /**
     * Find processes by order line item ID (alternative naming)
     */
    default List<Process> findByLineItemId(Long lineItemId) {
        return findByOrderLineItem_OrderLineId(lineItemId);
    }

    /**
     * Find processes by order line ID ordered by sequence
     */
    @Query("SELECT p FROM Process p WHERE p.orderLineItem.orderLineId = :orderLineId ORDER BY p.stageSequence")
    List<Process> findByOrderLineIdOrderBySequence(@Param("orderLineId") Long orderLineId);

    /**
     * Find process by ID with operations eagerly loaded
     */
    @Query("SELECT p FROM Process p " +
           "JOIN FETCH p.operations " +
           "WHERE p.processId = :processId")
    Optional<Process> findByIdWithOperations(@Param("processId") Long processId);

    /**
     * Find processes by status
     */
    List<Process> findByStatus(String status);

    /**
     * Find processes with QUALITY_PENDING status
     */
    @Query("SELECT p FROM Process p WHERE p.status = 'QUALITY_PENDING'")
    List<Process> findQualityPending();

    /**
     * Find processes for an order (via order line items)
     */
    @Query("SELECT p FROM Process p WHERE p.orderLineItem.order.orderId = :orderId ORDER BY p.stageSequence")
    List<Process> findByOrderId(@Param("orderId") Long orderId);

    /**
     * Count processes by status
     */
    long countByStatus(String status);
}
