package com.mes.production.service;

import com.mes.production.entity.AuditTrail;
import com.mes.production.repository.AuditTrailRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditTrailRepository auditTrailRepository;

    /**
     * Log a create action
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logCreate(String entityType, Long entityId, String newValue) {
        createAuditEntry(entityType, entityId, null, null, newValue, AuditTrail.ACTION_CREATE);
    }

    /**
     * Log an update action with field details
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logUpdate(String entityType, Long entityId, String fieldName, String oldValue, String newValue) {
        createAuditEntry(entityType, entityId, fieldName, oldValue, newValue, AuditTrail.ACTION_UPDATE);
    }

    /**
     * Log a status change
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logStatusChange(String entityType, Long entityId, String oldStatus, String newStatus) {
        createAuditEntry(entityType, entityId, "status", oldStatus, newStatus, AuditTrail.ACTION_STATUS_CHANGE);
    }

    /**
     * Log inventory consumption
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logConsume(String entityType, Long entityId, String details) {
        createAuditEntry(entityType, entityId, null, null, details, AuditTrail.ACTION_CONSUME);
    }

    /**
     * Log inventory/batch production
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logProduce(String entityType, Long entityId, String details) {
        createAuditEntry(entityType, entityId, null, null, details, AuditTrail.ACTION_PRODUCE);
    }

    /**
     * Log a hold action
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logHold(String entityType, Long entityId, String reason) {
        createAuditEntry(entityType, entityId, "status", "ACTIVE", "ON_HOLD", AuditTrail.ACTION_HOLD);
    }

    /**
     * Log a release action
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logRelease(String entityType, Long entityId, String details) {
        createAuditEntry(entityType, entityId, "status", "ON_HOLD", "ACTIVE", AuditTrail.ACTION_RELEASE);
    }

    /**
     * Generic audit entry creation
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createAuditEntry(String entityType, Long entityId, String fieldName,
                                  String oldValue, String newValue, String action) {
        try {
            AuditTrail auditEntry = AuditTrail.builder()
                    .entityType(entityType)
                    .entityId(entityId)
                    .fieldName(fieldName)
                    .oldValue(oldValue)
                    .newValue(newValue)
                    .action(action)
                    .changedBy(getCurrentUser())
                    .timestamp(LocalDateTime.now())
                    .build();

            auditTrailRepository.save(auditEntry);
            log.debug("Audit entry created: {} {} on {} #{}", action, fieldName, entityType, entityId);
        } catch (Exception e) {
            log.error("Failed to create audit entry for {} #{}: {}", entityType, entityId, e.getMessage());
        }
    }

    /**
     * Get audit history for an entity
     */
    @Transactional(readOnly = true)
    public List<AuditTrail> getEntityHistory(String entityType, Long entityId) {
        return auditTrailRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
    }

    /**
     * Get recent audit entries
     */
    @Transactional(readOnly = true)
    public List<AuditTrail> getRecentActivity(int limit) {
        return auditTrailRepository.findRecentAuditEntries(PageRequest.of(0, limit));
    }

    /**
     * Get recent production confirmations for dashboard
     */
    @Transactional(readOnly = true)
    public List<AuditTrail> getRecentProductionConfirmations(int limit) {
        return auditTrailRepository.findRecentProductionConfirmations(PageRequest.of(0, limit));
    }

    /**
     * Get audit entries by user
     */
    @Transactional(readOnly = true)
    public List<AuditTrail> getActivityByUser(String username, int limit) {
        return auditTrailRepository.findByChangedByOrderByTimestampDesc(username, PageRequest.of(0, limit));
    }

    /**
     * Get audit entries within a date range
     */
    @Transactional(readOnly = true)
    public List<AuditTrail> getActivityByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return auditTrailRepository.findByDateRange(startDate, endDate);
    }

    /**
     * Count today's audit entries
     */
    @Transactional(readOnly = true)
    public long countTodaysActivity() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        return auditTrailRepository.countTodaysEntries(startOfDay);
    }

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
    }
}
