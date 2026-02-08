package com.mes.production.controller;

import com.mes.production.dto.AuditDTO.*;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.entity.AuditTrail;
import com.mes.production.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@Slf4j
public class AuditController {

    private final AuditService auditService;

    /**
     * Get audit history for a specific entity
     * GET /api/audit/entity/{entityType}/{entityId}
     */
    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<AuditHistoryResponse> getEntityHistory(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        log.debug("Getting audit history for {} #{}", entityType, entityId);

        List<AuditTrail> entries = auditService.getEntityHistory(entityType.toUpperCase(), entityId);

        AuditHistoryResponse response = AuditHistoryResponse.builder()
                .entityType(entityType.toUpperCase())
                .entityId(entityId)
                .entries(AuditEntryResponse.fromEntities(entries))
                .totalEntries(entries.size())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Get recent audit activity
     * GET /api/audit/recent?limit=50
     */
    @GetMapping("/recent")
    public ResponseEntity<List<AuditEntryResponse>> getRecentActivity(
            @RequestParam(defaultValue = "50") int limit) {
        log.debug("Getting recent audit activity (limit: {})", limit);

        List<AuditTrail> entries = auditService.getRecentActivity(Math.min(limit, 500));
        return ResponseEntity.ok(AuditEntryResponse.fromEntities(entries));
    }

    /**
     * Get paginated audit entries with optional filters
     * GET /api/audit/paged?page=0&size=20&entityType=ORDER&action=CREATE&search=admin
     */
    @GetMapping("/paged")
    public ResponseEntity<PagedResponseDTO<AuditEntryResponse>> getPagedAudit(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String search) {
        log.debug("Getting paged audit entries (page: {}, size: {}, entityType: {}, action: {}, search: {})",
                page, size, entityType, action, search);

        Page<AuditTrail> auditPage = auditService.getPagedAudit(
                page, size, entityType, action, search);

        PagedResponseDTO<AuditEntryResponse> response = PagedResponseDTO.<AuditEntryResponse>builder()
                .content(AuditEntryResponse.fromEntities(auditPage.getContent()))
                .page(auditPage.getNumber())
                .size(auditPage.getSize())
                .totalElements(auditPage.getTotalElements())
                .totalPages(auditPage.getTotalPages())
                .first(auditPage.isFirst())
                .last(auditPage.isLast())
                .hasNext(auditPage.hasNext())
                .hasPrevious(auditPage.hasPrevious())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Get recent production confirmations for dashboard
     * GET /api/audit/production-confirmations?limit=10
     */
    @GetMapping("/production-confirmations")
    public ResponseEntity<List<AuditEntryResponse>> getRecentProductionConfirmations(
            @RequestParam(defaultValue = "10") int limit) {
        log.debug("Getting recent production confirmations (limit: {})", limit);

        List<AuditTrail> entries = auditService.getRecentProductionConfirmations(Math.min(limit, 100));
        return ResponseEntity.ok(AuditEntryResponse.fromEntities(entries));
    }

    /**
     * Get audit activity by user
     * GET /api/audit/user/{username}?limit=50
     */
    @GetMapping("/user/{username}")
    public ResponseEntity<List<AuditEntryResponse>> getActivityByUser(
            @PathVariable String username,
            @RequestParam(defaultValue = "50") int limit) {
        log.debug("Getting audit activity for user {} (limit: {})", username, limit);

        List<AuditTrail> entries = auditService.getActivityByUser(username, Math.min(limit, 500));
        return ResponseEntity.ok(AuditEntryResponse.fromEntities(entries));
    }

    /**
     * Get audit activity within a date range
     * GET /api/audit/range?startDate=2024-01-01T00:00:00&endDate=2024-01-31T23:59:59
     */
    @GetMapping("/range")
    public ResponseEntity<List<AuditEntryResponse>> getActivityByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        log.debug("Getting audit activity from {} to {}", startDate, endDate);

        List<AuditTrail> entries = auditService.getActivityByDateRange(startDate, endDate);
        return ResponseEntity.ok(AuditEntryResponse.fromEntities(entries));
    }

    /**
     * Get audit summary (today's count + recent activity)
     * GET /api/audit/summary
     */
    @GetMapping("/summary")
    public ResponseEntity<AuditSummary> getAuditSummary() {
        log.debug("Getting audit summary");

        long todaysCount = auditService.countTodaysActivity();
        List<AuditTrail> recentActivity = auditService.getRecentActivity(10);

        AuditSummary summary = AuditSummary.builder()
                .todaysActivityCount(todaysCount)
                .recentActivity(AuditEntryResponse.fromEntities(recentActivity))
                .build();

        return ResponseEntity.ok(summary);
    }

    /**
     * Get all valid entity types for filtering
     * GET /api/audit/entity-types
     */
    @GetMapping("/entity-types")
    public ResponseEntity<List<String>> getEntityTypes() {
        return ResponseEntity.ok(List.of(
                AuditTrail.ENTITY_PRODUCTION_CONFIRMATION,
                AuditTrail.ENTITY_OPERATION,
                AuditTrail.ENTITY_PROCESS,
                AuditTrail.ENTITY_INVENTORY,
                AuditTrail.ENTITY_BATCH,
                AuditTrail.ENTITY_BATCH_RELATION,
                AuditTrail.ENTITY_ORDER,
                AuditTrail.ENTITY_ORDER_LINE
        ));
    }

    /**
     * Get all valid action types for filtering
     * GET /api/audit/action-types
     */
    @GetMapping("/action-types")
    public ResponseEntity<List<String>> getActionTypes() {
        return ResponseEntity.ok(List.of(
                AuditTrail.ACTION_CREATE,
                AuditTrail.ACTION_UPDATE,
                AuditTrail.ACTION_DELETE,
                AuditTrail.ACTION_STATUS_CHANGE,
                AuditTrail.ACTION_CONSUME,
                AuditTrail.ACTION_PRODUCE,
                AuditTrail.ACTION_HOLD,
                AuditTrail.ACTION_RELEASE
        ));
    }
}
