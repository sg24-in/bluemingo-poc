package com.mes.production.controller;

import com.mes.production.dto.ReportAnalyticsDTO;
import com.mes.production.service.ReportAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * REST controller for report analytics endpoints.
 * Provides aggregated KPIs and metrics for production, orders,
 * inventory, quality, and executive dashboards.
 */
@RestController
@RequestMapping("/api/reports/analytics")
@RequiredArgsConstructor
@Slf4j
public class ReportAnalyticsController {

    private final ReportAnalyticsService reportAnalyticsService;

    /**
     * Get production summary for a date range.
     * Returns total produced, total scrap, yield %, avg cycle time, confirmation count.
     */
    @GetMapping("/production/summary")
    public ResponseEntity<ReportAnalyticsDTO.ProductionSummary> getProductionSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("GET /api/reports/analytics/production/summary?startDate={}&endDate={}", startDate, endDate);
        return ResponseEntity.ok(reportAnalyticsService.getProductionSummary(startDate, endDate));
    }

    /**
     * Get production grouped by operation type for a date range.
     */
    @GetMapping("/production/by-operation")
    public ResponseEntity<ReportAnalyticsDTO.ProductionByOperation> getProductionByOperation(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("GET /api/reports/analytics/production/by-operation?startDate={}&endDate={}", startDate, endDate);
        return ResponseEntity.ok(reportAnalyticsService.getProductionByOperation(startDate, endDate));
    }

    /**
     * Get scrap analysis for a date range.
     * Returns scrap by product and by operation type.
     */
    @GetMapping("/quality/scrap-analysis")
    public ResponseEntity<ReportAnalyticsDTO.ScrapAnalysis> getScrapAnalysis(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("GET /api/reports/analytics/quality/scrap-analysis?startDate={}&endDate={}", startDate, endDate);
        return ResponseEntity.ok(reportAnalyticsService.getScrapAnalysis(startDate, endDate));
    }

    /**
     * Get order fulfillment metrics.
     * Returns completion %, in-progress count, overdue count.
     */
    @GetMapping("/orders/fulfillment")
    public ResponseEntity<ReportAnalyticsDTO.OrderFulfillment> getOrderFulfillment() {
        log.info("GET /api/reports/analytics/orders/fulfillment");
        return ResponseEntity.ok(reportAnalyticsService.getOrderFulfillment());
    }

    /**
     * Get inventory balance grouped by type and state.
     */
    @GetMapping("/inventory/balance")
    public ResponseEntity<ReportAnalyticsDTO.InventoryBalance> getInventoryBalance() {
        log.info("GET /api/reports/analytics/inventory/balance");
        return ResponseEntity.ok(reportAnalyticsService.getInventoryBalance());
    }

    /**
     * Get operation cycle times for a date range.
     * Returns avg, min, max cycle times grouped by operation type.
     */
    @GetMapping("/operations/cycle-times")
    public ResponseEntity<ReportAnalyticsDTO.OperationCycleTimes> getOperationCycleTimes(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("GET /api/reports/analytics/operations/cycle-times?startDate={}&endDate={}", startDate, endDate);
        return ResponseEntity.ok(reportAnalyticsService.getOperationCycleTimes(startDate, endDate));
    }

    /**
     * Get hold analysis.
     * Returns hold counts by entity type and top reasons.
     */
    @GetMapping("/operations/holds")
    public ResponseEntity<ReportAnalyticsDTO.HoldAnalysis> getHoldAnalysis() {
        log.info("GET /api/reports/analytics/operations/holds");
        return ResponseEntity.ok(reportAnalyticsService.getHoldAnalysis());
    }

    /**
     * Get executive dashboard combining all KPIs in a single call.
     * Uses the last 30 days for time-ranged metrics.
     */
    @GetMapping("/executive/dashboard")
    public ResponseEntity<ReportAnalyticsDTO.ExecutiveDashboard> getExecutiveDashboard() {
        log.info("GET /api/reports/analytics/executive/dashboard");
        return ResponseEntity.ok(reportAnalyticsService.getExecutiveDashboard());
    }
}
