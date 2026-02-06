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
        private Long processId;  // Per MES Spec: Routing links to Process
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

    /**
     * Request to create a new routing for a Process
     * Per MES Spec: Routing.ProcessID (FK → Processes)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRoutingRequest {
        private Long processId;  // Process ID per spec
        private String routingName;
        private String routingType;
        private Boolean activateImmediately;
    }

    /**
     * Request to update a routing
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRoutingRequest {
        private String routingName;
        private String routingType;
    }

    /**
     * Routing status summary
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoutingStatus {
        private Long routingId;
        private String status;
        private int totalSteps;
        private int completedSteps;
        private int inProgressSteps;
        private Boolean isComplete;
        private Boolean isLocked;
    }

    /**
     * Request to activate a routing
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivateRoutingRequest {
        private Boolean deactivateOthers;
    }

    /**
     * Request to put routing on hold
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HoldRoutingRequest {
        private String reason;
    }
}
