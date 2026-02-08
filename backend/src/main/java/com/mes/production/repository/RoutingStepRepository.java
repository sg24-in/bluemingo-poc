package com.mes.production.repository;

import com.mes.production.entity.RoutingStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for RoutingStep - Design-time routing step definitions.
 *
 * IMPORTANT: RoutingStep is a TEMPLATE entity. It does NOT reference runtime Operations.
 * Operations reference RoutingSteps for genealogy tracking (one-way relationship).
 */
@Repository
public interface RoutingStepRepository extends JpaRepository<RoutingStep, Long> {

    /**
     * Find all steps for a routing ordered by sequence
     */
    List<RoutingStep> findByRouting_RoutingIdOrderBySequenceNumberAsc(Long routingId);

    /**
     * Find step by routing and sequence number
     */
    Optional<RoutingStep> findByRouting_RoutingIdAndSequenceNumber(Long routingId, Integer sequenceNumber);

    /**
     * Find next step in routing
     */
    @Query("SELECT rs FROM RoutingStep rs WHERE rs.routing.routingId = :routingId AND rs.sequenceNumber > :currentSequence ORDER BY rs.sequenceNumber ASC")
    List<RoutingStep> findNextSteps(@Param("routingId") Long routingId, @Param("currentSequence") Integer currentSequence);

    /**
     * Find parallel steps at same sequence level
     */
    @Query("SELECT rs FROM RoutingStep rs WHERE rs.routing.routingId = :routingId AND rs.sequenceNumber = :sequenceNumber AND rs.isParallel = true")
    List<RoutingStep> findParallelSteps(@Param("routingId") Long routingId, @Param("sequenceNumber") Integer sequenceNumber);

    /**
     * Count steps by routing and status
     */
    long countByRouting_RoutingIdAndStatus(Long routingId, String status);

    /**
     * Find active mandatory steps (for instantiation)
     */
    @Query("SELECT rs FROM RoutingStep rs WHERE rs.routing.routingId = :routingId AND rs.mandatoryFlag = true AND rs.status = 'ACTIVE'")
    List<RoutingStep> findActiveMandatorySteps(@Param("routingId") Long routingId);

    /**
     * Find steps by operation template
     */
    List<RoutingStep> findByOperationTemplate_OperationTemplateId(Long operationTemplateId);

    /**
     * Find active steps for a routing
     */
    @Query("SELECT rs FROM RoutingStep rs WHERE rs.routing.routingId = :routingId AND rs.status = 'ACTIVE' ORDER BY rs.sequenceNumber ASC")
    List<RoutingStep> findActiveSteps(@Param("routingId") Long routingId);
}
