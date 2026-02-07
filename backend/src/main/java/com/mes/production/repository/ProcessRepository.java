package com.mes.production.repository;

import com.mes.production.entity.Process;
import com.mes.production.entity.ProcessStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Process entity (design-time process template).
 *
 * Per MES Consolidated Specification:
 * - Process is a design-time template (ProcessID, ProcessName, Status)
 * - Runtime execution tracking happens at Operation level via OrderLineItem FK
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
     * Find processes by status (using enum)
     */
    List<Process> findByStatus(ProcessStatus status);

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
    long countByStatus(ProcessStatus status);

    /**
     * Find processes with pagination and filters
     */
    @Query("SELECT p FROM Process p WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(p.processName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR p.status = :status)")
    Page<Process> findByFilters(
            @Param("search") String search,
            @Param("status") ProcessStatus status,
            Pageable pageable);
}
