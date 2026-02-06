package com.mes.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTOs for ProcessTemplate operations.
 */
public class ProcessTemplateDTO {

    /**
     * Request to create a new process template
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String templateName;
        private String templateCode;
        private String description;
        private String productSku;
        private String version;
        private LocalDate effectiveFrom;
        private LocalDate effectiveTo;
        private List<RoutingStepTemplate> routingSteps;
    }

    /**
     * Request to update an existing process template
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String templateName;
        private String description;
        private String productSku;
        private LocalDate effectiveFrom;
        private LocalDate effectiveTo;
    }

    /**
     * Template for a routing step (design-time definition)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoutingStepTemplate {
        private Integer sequenceNumber;
        private String operationName;
        private String operationType;
        private String operationCode;
        private String description;
        private BigDecimal targetQty;
        private Integer estimatedDurationMinutes;
        private Boolean isParallel;
        private Boolean mandatoryFlag;
        private Boolean producesOutputBatch;
        private Boolean allowsSplit;
        private Boolean allowsMerge;
    }

    /**
     * Response with process template details
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TemplateResponse {
        private Long processTemplateId;
        private String templateName;
        private String templateCode;
        private String description;
        private String productSku;
        private String status;
        private String version;
        private LocalDate effectiveFrom;
        private LocalDate effectiveTo;
        private Boolean isEffective;
        private LocalDateTime createdOn;
        private String createdBy;
        private LocalDateTime updatedOn;
        private String updatedBy;
        private List<RoutingStepResponse> routingSteps;
    }

    /**
     * Response for a routing step
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoutingStepResponse {
        private Long routingStepId;
        private Integer sequenceNumber;
        private String operationName;
        private String operationType;
        private String operationCode;
        private String description;
        private BigDecimal targetQty;
        private Integer estimatedDurationMinutes;
        private Boolean isParallel;
        private Boolean mandatoryFlag;
        private Boolean producesOutputBatch;
        private Boolean allowsSplit;
        private Boolean allowsMerge;
        private String status;
    }

    /**
     * Request to activate a template
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivationRequest {
        private Boolean deactivateOthers; // Deactivate other active templates for same product
        private LocalDate effectiveFrom;
    }

    /**
     * Response for version info
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VersionInfo {
        private Long processTemplateId;
        private String templateCode;
        private String version;
        private String status;
        private LocalDate effectiveFrom;
        private LocalDate effectiveTo;
    }

    /**
     * Summary response for list views
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TemplateSummary {
        private Long processTemplateId;
        private String templateName;
        private String templateCode;
        private String productSku;
        private String status;
        private String version;
        private Boolean isEffective;
        private int stepCount;
        private LocalDateTime createdOn;
    }
}
