package com.mes.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class RoutingDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoutingInfo {
        private Long routingId;
        private Long processId;
        private String routingName;
        private String routingType;
        private String status;
        private List<RoutingStepInfo> steps;
        private LocalDateTime createdOn;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoutingStepInfo {
        private Long routingStepId;
        private Long routingId;
        private Long operationId;
        private String operationName;
        private Integer sequenceNumber;
        private Boolean isParallel;
        private Boolean mandatoryFlag;
        private String status;
    }
}
