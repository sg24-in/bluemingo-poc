package com.mes.production.repository;

import com.mes.production.entity.Operation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Operation entity.
 *
 * Per MES Consolidated Specification:
 * - Operations link to Process via ProcessID (design-time reference)
 * - Operations link to OrderLineItem via OrderLineID (runtime tracking)
 * - Relationship: Orders → OrderLineItems → Operations (direct)
 */
@Repository
public interface OperationRepository extends JpaRepository<Operation, Long> {

    /**
     * Find operations by status
     */
    List<Operation> findByStatus(String status);

    /**
     * Find ready operations with full details (via OrderLineItem)
     */
    @Query("SELECT op FROM Operation op " +
           "LEFT JOIN FETCH op.process p " +
           "LEFT JOIN FETCH op.orderLineItem oli " +
           "LEFT JOIN FETCH oli.order o " +
           "WHERE op.status = 'READY'")
    List<Operation> findReadyOperationsWithDetails();

    /**
     * Find operations by process ID ordered by sequence
     */
    @Query("SELECT op FROM Operation op WHERE op.process.processId = :processId ORDER BY op.sequenceNumber")
    List<Operation> findByProcessIdOrderBySequence(@Param("processId") Long processId);

    /**
     * Find next operation in the same order line item (scoped by orderLineId, not processId,
     * to avoid NonUniqueResultException when multiple line items share the same process)
     */
    @Query("SELECT op FROM Operation op WHERE op.orderLineItem.orderLineId = :orderLineId AND op.sequenceNumber > :currentSequence ORDER BY op.sequenceNumber ASC LIMIT 1")
    Optional<Operation> findNextOperation(@Param("orderLineId") Long orderLineId, @Param("currentSequence") Integer currentSequence);

    /**
     * Find operation by ID with full details
     */
    @Query("SELECT op FROM Operation op " +
           "LEFT JOIN FETCH op.process p " +
           "LEFT JOIN FETCH op.orderLineItem oli " +
           "LEFT JOIN FETCH oli.order o " +
           "WHERE op.operationId = :operationId")
    Optional<Operation> findByIdWithDetails(@Param("operationId") Long operationId);

    /**
     * Find operations by order line item ID
     */
    List<Operation> findByOrderLineItem_OrderLineId(Long orderLineId);

    /**
     * Find operations by order line item ID ordered by sequence
     */
    @Query("SELECT op FROM Operation op WHERE op.orderLineItem.orderLineId = :orderLineId ORDER BY op.sequenceNumber")
    List<Operation> findByOrderLineIdOrderBySequence(@Param("orderLineId") Long orderLineId);

    /**
     * Count operations by status
     */
    Long countByStatus(String status);

    /**
     * Find operations by order line item ID ordered by sequence number
     */
    List<Operation> findByOrderLineItem_OrderLineIdOrderBySequenceNumberAsc(Long orderLineId);

    /**
     * Find operations by routing step ID (for checking if routing is locked)
     */
    List<Operation> findByRoutingStepId(Long routingStepId);

    /**
     * Find operations by operation template ID
     */
    List<Operation> findByOperationTemplateId(Long operationTemplateId);

    /**
     * TASK-P1: Paginated operations with filters
     * Supports filtering by status, operation type, and search term
     */
    @Query("SELECT op FROM Operation op " +
           "LEFT JOIN op.process p " +
           "LEFT JOIN op.orderLineItem oli " +
           "LEFT JOIN oli.order o " +
           "WHERE (:status IS NULL OR op.status = :status) " +
           "AND (:operationType IS NULL OR op.operationType = :operationType) " +
           "AND (:search IS NULL OR " +
           "     LOWER(op.operationName) LIKE :search OR " +
           "     LOWER(op.operationCode) LIKE :search OR " +
           "     LOWER(p.processName) LIKE :search OR " +
           "     LOWER(o.orderNumber) LIKE :search)")
    Page<Operation> findByFilters(@Param("status") String status,
                                   @Param("operationType") String operationType,
                                   @Param("search") String search,
                                   Pageable pageable);

    /**
     * TASK-P1: Count operations by status for dashboard
     */
    @Query("SELECT op.status, COUNT(op) FROM Operation op GROUP BY op.status")
    List<Object[]> countByStatusGrouped();
}
