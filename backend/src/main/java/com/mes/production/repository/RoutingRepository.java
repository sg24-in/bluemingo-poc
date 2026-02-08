package com.mes.production.repository;

import com.mes.production.entity.Routing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Routing entity.
 *
 * Per MES Consolidated Specification:
 * - Routing has ProcessID (FK → Processes)
 * - Operation sequence is derived from Routing
 */
@Repository
public interface RoutingRepository extends JpaRepository<Routing, Long> {

    /**
     * Find single routing by process ID (returns first match)
     */
    Optional<Routing> findFirstByProcess_ProcessId(Long processId);

    /**
     * Find all routings for a process
     */
    List<Routing> findByProcess_ProcessId(Long processId);

    /**
     * Find all routings for a process by status
     */
    List<Routing> findByProcess_ProcessIdAndStatus(Long processId, String status);

    /**
     * Find routing with steps eagerly loaded
     */
    @Query("SELECT r FROM Routing r LEFT JOIN FETCH r.routingSteps WHERE r.routingId = :routingId")
    Optional<Routing> findByIdWithSteps(@Param("routingId") Long routingId);

    /**
     * Find active routings by type
     */
    List<Routing> findByRoutingTypeAndStatus(String routingType, String status);

    /**
     * Find active routing by process with steps
     */
    @Query("SELECT r FROM Routing r LEFT JOIN FETCH r.routingSteps WHERE r.process.processId = :processId AND r.status = 'ACTIVE'")
    Optional<Routing> findActiveRoutingByProcessWithSteps(@Param("processId") Long processId);

    /**
     * Count routings by status
     */
    long countByStatus(String status);

    /**
     * TASK-P2: Find routings with filters and pagination.
     * Supports: status, routingType, and search (by routing name or process name)
     */
    @Query("SELECT r FROM Routing r " +
           "LEFT JOIN r.process p " +
           "WHERE (:status IS NULL OR r.status = :status) " +
           "AND (:routingType IS NULL OR r.routingType = :routingType) " +
           "AND (:search IS NULL OR " +
           "     LOWER(r.routingName) LIKE :search OR " +
           "     LOWER(p.processName) LIKE :search)")
    Page<Routing> findByFilters(@Param("status") String status,
                                 @Param("routingType") String routingType,
                                 @Param("search") String search,
                                 Pageable pageable);
}
