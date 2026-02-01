package com.mes.production.repository;

import com.mes.production.entity.Process;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProcessRepository extends JpaRepository<Process, Long> {

    List<Process> findByOrderLineItem_OrderLineId(Long orderLineId);

    @Query("SELECT p FROM Process p WHERE p.orderLineItem.orderLineId = :orderLineId ORDER BY p.stageSequence")
    List<Process> findByOrderLineIdOrderBySequence(@Param("orderLineId") Long orderLineId);

    @Query("SELECT p FROM Process p " +
           "JOIN FETCH p.operations " +
           "WHERE p.processId = :processId")
    Optional<Process> findByIdWithOperations(@Param("processId") Long processId);

    List<Process> findByStatus(String status);
}
