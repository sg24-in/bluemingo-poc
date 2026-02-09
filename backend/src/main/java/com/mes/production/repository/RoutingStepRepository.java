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

    List<RoutingStep> findByRoutingIdOrderBySequenceNumberAsc(Long routingId);

    Optional<RoutingStep> findByRoutingIdAndSequenceNumber(Long routingId, Integer sequenceNumber);

    @Query("SELECT rs FROM RoutingStep rs WHERE rs.routingId = :routingId AND rs.sequenceNumber > :currentSequence ORDER BY rs.sequenceNumber ASC")
    List<RoutingStep> findNextSteps(@Param("routingId") Long routingId, @Param("currentSequence") Integer currentSequence);

    @Query("SELECT rs FROM RoutingStep rs WHERE rs.routingId = :routingId AND rs.sequenceNumber = :sequenceNumber AND rs.isParallel = true")
    List<RoutingStep> findParallelSteps(@Param("routingId") Long routingId, @Param("sequenceNumber") Integer sequenceNumber);

    long countByRoutingIdAndStatus(Long routingId, String status);

    @Query("SELECT rs FROM RoutingStep rs WHERE rs.routingId = :routingId AND rs.mandatoryFlag = true AND rs.status = 'ACTIVE'")
    List<RoutingStep> findActiveMandatorySteps(@Param("routingId") Long routingId);

    List<RoutingStep> findByOperationTemplateId(Long operationTemplateId);

    @Query("SELECT rs FROM RoutingStep rs WHERE rs.routingId = :routingId AND rs.status = 'ACTIVE' ORDER BY rs.sequenceNumber ASC")
    List<RoutingStep> findActiveSteps(@Param("routingId") Long routingId);
}
