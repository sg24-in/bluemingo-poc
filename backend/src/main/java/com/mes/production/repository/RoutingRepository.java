package com.mes.production.repository;

import com.mes.production.entity.Routing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoutingRepository extends JpaRepository<Routing, Long> {

    /**
     * Find routing by process ID
     */
    Optional<Routing> findByProcess_ProcessId(Long processId);

    /**
     * Find all routings for a process
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
     * Find routing by process with steps
     */
    @Query("SELECT r FROM Routing r LEFT JOIN FETCH r.routingSteps WHERE r.process.processId = :processId AND r.status = 'ACTIVE'")
    Optional<Routing> findActiveRoutingByProcessWithSteps(@Param("processId") Long processId);

    /**
     * Count routings by status
     */
    long countByStatus(String status);
}
