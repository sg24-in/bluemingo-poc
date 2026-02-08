package com.mes.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTOs for OperationTemplate - Design-time operation definitions.
 */
public class OperationTemplateDTO {

    /**
     * Response DTO for operation template.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long operationTemplateId;
        private String operationName;
        private String operationCode;
        private String operationType;
        private String quantityType;
        private String defaultEquipmentType;
        private String description;
        private Integer estimatedDurationMinutes;
        private String status;
        private LocalDateTime createdOn;
        private String createdBy;
        private LocalDateTime updatedOn;
        private String updatedBy;
    }

    /**
     * Request DTO for creating operation template.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String operationName;
        private String operationCode;
        private String operationType;
        private String quantityType;
        private String defaultEquipmentType;
        private String description;
        private Integer estimatedDurationMinutes;
    }

    /**
     * Request DTO for updating operation template.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String operationName;
        private String operationCode;
        private String operationType;
        private String quantityType;
        private String defaultEquipmentType;
        private String description;
        private Integer estimatedDurationMinutes;
        private String status;
    }

    /**
     * Summary DTO for dropdown/list views.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        private Long operationTemplateId;
        private String operationName;
        private String operationCode;
        private String operationType;
        private String status;
    }
}
