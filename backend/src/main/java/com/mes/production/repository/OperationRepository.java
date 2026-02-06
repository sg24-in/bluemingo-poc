package com.mes.production.repository;

import com.mes.production.entity.Operation;
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
 * - Operations belong to Process (not ProcessInstance)
 * - Relationship: Orders → OrderLineItems → Processes → Operations
 */
@Repository
public interface OperationRepository extends JpaRepository<Operation, Long> {

    /**
     * Find operations by status
     */
    List<Operation> findByStatus(String status);

    /**
     * Find ready operations with full details
     */
    @Query("SELECT op FROM Operation op " +
           "JOIN FETCH op.process p " +
           "JOIN FETCH p.orderLineItem oli " +
           "JOIN FETCH oli.order o " +
           "WHERE op.status = 'READY'")
    List<Operation> findReadyOperationsWithDetails();

    /**
     * Find operations by process ID ordered by sequence
     */
    @Query("SELECT op FROM Operation op WHERE op.process.processId = :processId ORDER BY op.sequenceNumber")
    List<Operation> findByProcessIdOrderBySequence(@Param("processId") Long processId);

    /**
     * Find next operation in a process
     */
    @Query("SELECT op FROM Operation op WHERE op.process.processId = :processId AND op.sequenceNumber > :currentSequence ORDER BY op.sequenceNumber ASC")
    Optional<Operation> findNextOperation(@Param("processId") Long processId, @Param("currentSequence") Integer currentSequence);

    /**
     * Find operation by ID with full details
     */
    @Query("SELECT op FROM Operation op " +
           "JOIN FETCH op.process p " +
           "JOIN FETCH p.orderLineItem oli " +
           "JOIN FETCH oli.order o " +
           "WHERE op.operationId = :operationId")
    Optional<Operation> findByIdWithDetails(@Param("operationId") Long operationId);

    /**
     * Count operations by status
     */
    Long countByStatus(String status);
}
