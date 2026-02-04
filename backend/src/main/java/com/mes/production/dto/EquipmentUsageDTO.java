package com.mes.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class EquipmentUsageDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsageInfo {
        private Long usageId;
        private Long operationId;
        private String operationName;
        private Long equipmentId;
        private String equipmentCode;
        private String equipmentName;
        private Long operatorId;
        private String operatorCode;
        private String operatorName;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private String status;
        private LocalDateTime createdOn;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LogUsageRequest {
        private Long operationId;
        private Long equipmentId;
        private Long operatorId;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkLogRequest {
        private Long operationId;
        private List<Long> equipmentIds;
        private List<Long> operatorIds;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
    }
}
