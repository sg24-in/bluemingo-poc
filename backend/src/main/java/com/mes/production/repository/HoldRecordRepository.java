package com.mes.production.repository;

import com.mes.production.entity.HoldRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HoldRecordRepository extends JpaRepository<HoldRecord, Long> {

    List<HoldRecord> findByStatus(String status);

    List<HoldRecord> findByEntityTypeAndEntityId(String entityType, Long entityId);

    Optional<HoldRecord> findByEntityTypeAndEntityIdAndStatus(String entityType, Long entityId, String status);

    @Query("SELECT COUNT(h) FROM HoldRecord h WHERE h.status = :status")
    Long countByStatus(@Param("status") String status);

    @Query("SELECT h FROM HoldRecord h WHERE h.status = 'ACTIVE' ORDER BY h.appliedOn DESC")
    List<HoldRecord> findActiveHoldsOrderByAppliedOnDesc();

    boolean existsByEntityTypeAndEntityIdAndStatus(String entityType, Long entityId, String status);
}
