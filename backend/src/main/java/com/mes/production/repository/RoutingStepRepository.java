package com.mes.production.repository;

import com.mes.production.entity.RoutingStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

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
     * Find step by operation
     */
    Optional<RoutingStep> findByOperation_OperationId(Long operationId);

    /**
     * Count completed steps in routing
     */
    long countByRouting_RoutingIdAndStatus(Long routingId, String status);

    /**
     * Find mandatory steps that are not completed
     */
    @Query("SELECT rs FROM RoutingStep rs WHERE rs.routing.routingId = :routingId AND rs.mandatoryFlag = true AND rs.status != 'COMPLETED'")
    List<RoutingStep> findIncompleteMandatorySteps(@Param("routingId") Long routingId);
}
