package com.mes.production.dto;

import com.mes.production.entity.AuditTrail;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class AuditDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditEntryResponse {
        private Long auditId;
        private String entityType;
        private Long entityId;
        private String fieldName;
        private String oldValue;
        private String newValue;
        private String action;
        private String changedBy;
        private LocalDateTime timestamp;

        public static AuditEntryResponse fromEntity(AuditTrail entity) {
            return AuditEntryResponse.builder()
                    .auditId(entity.getAuditId())
                    .entityType(entity.getEntityType())
                    .entityId(entity.getEntityId())
                    .fieldName(entity.getFieldName())
                    .oldValue(entity.getOldValue())
                    .newValue(entity.getNewValue())
                    .action(entity.getAction())
                    .changedBy(entity.getChangedBy())
                    .timestamp(entity.getTimestamp())
                    .build();
        }

        public static List<AuditEntryResponse> fromEntities(List<AuditTrail> entities) {
            return entities.stream()
                    .map(AuditEntryResponse::fromEntity)
                    .toList();
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditHistoryResponse {
        private String entityType;
        private Long entityId;
        private List<AuditEntryResponse> entries;
        private int totalEntries;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DateRangeRequest {
        private LocalDateTime startDate;
        private LocalDateTime endDate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditSummary {
        private long todaysActivityCount;
        private List<AuditEntryResponse> recentActivity;
    }
}
