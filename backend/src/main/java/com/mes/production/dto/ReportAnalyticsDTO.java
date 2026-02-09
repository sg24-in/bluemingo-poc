package com.mes.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * DTOs for Report Analytics endpoints.
 * Uses nested static classes following the project's DTO pattern (see DashboardDTO).
 */
public class ReportAnalyticsDTO {

    // ========== Production Summary ==========

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductionSummary {
        private LocalDate startDate;
        private LocalDate endDate;
        private BigDecimal totalProduced;
        private BigDecimal totalScrap;
        private BigDecimal yieldPercentage;
        private BigDecimal avgCycleTimeMinutes;
        private Long confirmationCount;
    }

    // ========== Production By Operation ==========

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductionByOperation {
        private LocalDate startDate;
        private LocalDate endDate;
        private List<OperationProductionEntry> entries;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OperationProductionEntry {
        private String operationType;
        private Long confirmationCount;
        private BigDecimal totalProduced;
        private BigDecimal totalScrap;
        private BigDecimal yieldPercentage;
    }

    // ========== Scrap Analysis ==========

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScrapAnalysis {
        private LocalDate startDate;
        private LocalDate endDate;
        private BigDecimal totalScrap;
        private List<ScrapByProductEntry> scrapByProduct;
        private List<ScrapByOperationEntry> scrapByOperation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScrapByProductEntry {
        private String productSku;
        private String productName;
        private BigDecimal scrapQty;
        private BigDecimal producedQty;
        private BigDecimal scrapPercentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScrapByOperationEntry {
        private String operationType;
        private BigDecimal scrapQty;
        private BigDecimal producedQty;
        private BigDecimal scrapPercentage;
    }

    // ========== Order Fulfillment ==========

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderFulfillment {
        private Long totalOrders;
        private Long completedOrders;
        private Long inProgressOrders;
        private Long overdueOrders;
        private BigDecimal completionPercentage;
    }

    // ========== Inventory Balance ==========

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InventoryBalance {
        private List<InventoryByTypeEntry> byType;
        private List<InventoryByStateEntry> byState;
        private BigDecimal totalQuantity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InventoryByTypeEntry {
        private String inventoryType;
        private Long itemCount;
        private BigDecimal totalQuantity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InventoryByStateEntry {
        private String state;
        private Long itemCount;
        private BigDecimal totalQuantity;
    }

    // ========== Operation Cycle Times ==========

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OperationCycleTimes {
        private LocalDate startDate;
        private LocalDate endDate;
        private List<CycleTimeEntry> entries;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CycleTimeEntry {
        private String operationType;
        private Long confirmationCount;
        private BigDecimal avgCycleTimeMinutes;
        private BigDecimal minCycleTimeMinutes;
        private BigDecimal maxCycleTimeMinutes;
    }

    // ========== Hold Analysis ==========

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HoldAnalysis {
        private Long totalActiveHolds;
        private Long totalReleasedHolds;
        private List<HoldByEntityTypeEntry> byEntityType;
        private List<HoldReasonEntry> topReasons;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HoldByEntityTypeEntry {
        private String entityType;
        private Long activeCount;
        private Long releasedCount;
        private Long totalCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HoldReasonEntry {
        private String reason;
        private Long count;
    }

    // ========== Executive Dashboard ==========

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExecutiveDashboard {
        private ProductionSummary productionSummary;
        private OrderFulfillment orderFulfillment;
        private InventoryBalance inventoryBalance;
        private HoldAnalysis holdAnalysis;
        private List<CycleTimeEntry> topCycleTimes;
    }
}
