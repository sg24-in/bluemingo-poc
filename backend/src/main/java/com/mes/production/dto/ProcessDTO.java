package com.mes.production.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTOs for Process template operations.
 *
 * Per MES Consolidated Specification:
 * - Process is a design-time template (DRAFT/ACTIVE/INACTIVE)
 * - Runtime execution tracking happens at Operation level
 */
public class ProcessDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long processId;
        private String processName;
        private String status;  // DRAFT, ACTIVE, INACTIVE
        private LocalDateTime createdOn;
        private String createdBy;
        private LocalDateTime updatedOn;
        private String updatedBy;
        private List<OperationSummary> operations;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OperationSummary {
        private Long operationId;
        private String operationName;
        private String operationCode;
        private String status;
        private Integer sequenceNumber;
        private Long orderLineId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "Process name is required")
        private String processName;

        private String status;  // Optional, defaults to DRAFT
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String processName;
        private String status;  // DRAFT, ACTIVE, INACTIVE
    }
}
