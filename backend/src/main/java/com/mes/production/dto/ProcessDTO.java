package com.mes.production.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class ProcessDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long processId;
        private Long orderLineId;
        private String stageName;
        private Integer stageSequence;
        private String status;
        private String usageDecision;
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
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateRequest {
        @NotNull(message = "Process ID is required")
        private Long processId;

        @NotBlank(message = "New status is required")
        private String newStatus;

        private String reason;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QualityDecisionRequest {
        @NotNull(message = "Process ID is required")
        private Long processId;

        @NotBlank(message = "Decision is required (ACCEPT/REJECT)")
        private String decision;

        private String reason;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateResponse {
        private Long processId;
        private String stageName;
        private String previousStatus;
        private String newStatus;
        private String usageDecision;
        private String updatedBy;
        private LocalDateTime updatedOn;
        private String message;
    }
}
