package com.mes.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class DashboardDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        private Long totalOrders;
        private Long ordersInProgress;
        private Long operationsReady;
        private Long operationsInProgress;
        private Long activeHolds;
        private Long todayConfirmations;
        private Long qualityPendingProcesses;
        private List<RecentActivity> recentActivity;
        private List<AuditActivity> auditActivity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivity {
        private Long confirmationId;
        private String operationName;
        private String productSku;
        private BigDecimal producedQty;
        private String operatorName;
        private LocalDateTime confirmedAt;
        private String batchNumber;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderSummary {
        private Long total;
        private Long created;
        private Long inProgress;
        private Long completed;
        private Long onHold;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OperationSummary {
        private Long total;
        private Long notStarted;
        private Long ready;
        private Long inProgress;
        private Long confirmed;
        private Long onHold;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditActivity {
        private Long auditId;
        private String entityType;
        private Long entityId;
        private String action;
        private String description;
        private String changedBy;
        private LocalDateTime timestamp;
    }
}
