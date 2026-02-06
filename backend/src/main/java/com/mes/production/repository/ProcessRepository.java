package com.mes.production.repository;

import com.mes.production.entity.Process;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Process entity (design-time process definition).
 *
 * Per MES Consolidated Specification:
 * - Process is design-time entity (ProcessID, ProcessName, Status)
 * - Operations link to Process via ProcessID
 * - Runtime tracking happens at Operation level via OrderLineItem FK
 */
@Repository
public interface ProcessRepository extends JpaRepository<Process, Long> {

    /**
     * Find process by ID with operations eagerly loaded
     */
    @Query("SELECT p FROM Process p " +
           "LEFT JOIN FETCH p.operations " +
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
     * Find process by name
     */
    Optional<Process> findByProcessName(String processName);

    /**
     * Check if process name exists
     */
    boolean existsByProcessName(String processName);

    /**
     * Count processes by status
     */
    long countByStatus(String status);
}
