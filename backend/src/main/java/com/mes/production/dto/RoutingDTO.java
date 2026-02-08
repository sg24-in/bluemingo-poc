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

    /**
     * Routing step info for API responses.
     * References OperationTemplate (design-time), NOT Operation (runtime).
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoutingStepInfo {
        private Long routingStepId;
        private Long routingId;
        private Long operationTemplateId;  // References template, not runtime operation
        private String operationName;      // From OperationTemplate or step override
        private String operationType;      // From OperationTemplate
        private String operationCode;      // From OperationTemplate or step override
        private Integer sequenceNumber;
        private Boolean isParallel;
        private Boolean mandatoryFlag;
        private String status;             // ACTIVE/INACTIVE (template lifecycle)
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

    /**
     * Request to create a routing step.
     * If operationTemplateId is provided, operation details are taken from the template.
     * Otherwise, operationName and operationType are required.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRoutingStepRequest {
        private Long operationTemplateId;  // Optional: reference to OperationTemplate
        private String operationName;      // Required if no template; override if template provided
        private String operationType;      // Required if no template; ignored if template provided
        private String operationCode;      // Optional override
        private Integer sequenceNumber;
        private Boolean isParallel;
        private Boolean mandatoryFlag;
        private java.math.BigDecimal targetQty;
        private String description;
        private Integer estimatedDurationMinutes;  // Override template duration if provided
        private Boolean producesOutputBatch;
        private Boolean allowsSplit;
        private Boolean allowsMerge;
    }

    /**
     * Request to update a routing step.
     * If operationTemplateId is provided, operation details are taken from the template.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRoutingStepRequest {
        private Long operationTemplateId;  // Optional: change template reference
        private String operationName;      // Override if provided
        private String operationType;      // Ignored if template provided
        private String operationCode;      // Override if provided
        private Integer sequenceNumber;
        private Boolean isParallel;
        private Boolean mandatoryFlag;
        private java.math.BigDecimal targetQty;
        private String description;
        private Integer estimatedDurationMinutes;  // Override template duration if provided
        private Boolean producesOutputBatch;
        private Boolean allowsSplit;
        private Boolean allowsMerge;
    }

    /**
     * Request to reorder routing steps
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReorderStepsRequest {
        private List<Long> stepIds;  // Ordered list of step IDs
    }
}
