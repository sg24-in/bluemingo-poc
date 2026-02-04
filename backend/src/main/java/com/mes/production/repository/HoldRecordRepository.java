package com.mes.production.repository;

import com.mes.production.entity.HoldRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    // Paginated version
    Page<HoldRecord> findByStatus(String status, Pageable pageable);

    // Search with pagination
    @Query("SELECT h FROM HoldRecord h WHERE " +
           "(:status IS NULL OR h.status = :status) AND " +
           "(:entityType IS NULL OR h.entityType = :entityType) AND " +
           "(:search IS NULL OR LOWER(h.reason) LIKE :search OR LOWER(h.comments) LIKE :search)")
    Page<HoldRecord> findByFilters(@Param("status") String status,
                                    @Param("entityType") String entityType,
                                    @Param("search") String search,
                                    Pageable pageable);
}
