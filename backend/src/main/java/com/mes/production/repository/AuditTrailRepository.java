package com.mes.production.repository;

import com.mes.production.entity.AuditTrail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditTrailRepository extends JpaRepository<AuditTrail, Long> {

    /**
     * Find audit entries by entity type and id
     */
    List<AuditTrail> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, Long entityId);

    /**
     * Find audit entries by entity type
     */
    List<AuditTrail> findByEntityTypeOrderByTimestampDesc(String entityType, Pageable pageable);

    /**
     * Find audit entries by user
     */
    List<AuditTrail> findByChangedByOrderByTimestampDesc(String changedBy, Pageable pageable);

    /**
     * Find recent audit entries
     */
    @Query("SELECT a FROM AuditTrail a ORDER BY a.timestamp DESC")
    List<AuditTrail> findRecentAuditEntries(Pageable pageable);

    /**
     * Find audit entries within a date range
     */
    @Query("SELECT a FROM AuditTrail a WHERE a.timestamp BETWEEN :startDate AND :endDate ORDER BY a.timestamp DESC")
    List<AuditTrail> findByDateRange(@Param("startDate") LocalDateTime startDate,
                                      @Param("endDate") LocalDateTime endDate);

    /**
     * Find audit entries by action type
     */
    List<AuditTrail> findByActionOrderByTimestampDesc(String action, Pageable pageable);

    /**
     * Count audit entries for an entity
     */
    long countByEntityTypeAndEntityId(String entityType, Long entityId);

    /**
     * Count today's audit entries
     */
    @Query("SELECT COUNT(a) FROM AuditTrail a WHERE a.timestamp >= :startOfDay")
    long countTodaysEntries(@Param("startOfDay") LocalDateTime startOfDay);

    /**
     * Find audit entries for production confirmations (for dashboard)
     */
    @Query("SELECT a FROM AuditTrail a WHERE a.entityType = 'PRODUCTION_CONFIRMATION' ORDER BY a.timestamp DESC")
    List<AuditTrail> findRecentProductionConfirmations(Pageable pageable);

    /**
     * Find all audit entries with pagination
     */
    Page<AuditTrail> findAllByOrderByTimestampDesc(Pageable pageable);

    /**
     * Find audit entries by filters with pagination
     */
    @Query("SELECT a FROM AuditTrail a WHERE " +
           "(:entityType IS NULL OR a.entityType = :entityType) AND " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:search IS NULL OR LOWER(a.changedBy) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.newValue) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY a.timestamp DESC")
    Page<AuditTrail> findByFilters(
            @Param("entityType") String entityType,
            @Param("action") String action,
            @Param("search") String search,
            Pageable pageable);
}
