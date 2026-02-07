package com.mes.production.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ProductionConfirmationDTO {

    // Request DTO for creating production confirmation
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {

        @NotNull(message = "Operation ID is required")
        private Long operationId;

        @NotEmpty(message = "At least one material must be consumed")
        private List<MaterialConsumption> materialsConsumed;

        @NotNull(message = "Produced quantity is required")
        @Positive(message = "Produced quantity must be positive")
        private BigDecimal producedQty;

        private BigDecimal scrapQty;

        @NotNull(message = "Start time is required")
        private LocalDateTime startTime;

        @NotNull(message = "End time is required")
        private LocalDateTime endTime;

        @NotEmpty(message = "At least one equipment must be selected")
        private List<Long> equipmentIds;

        @NotEmpty(message = "At least one operator must be selected")
        private List<Long> operatorIds;

        private Integer delayMinutes;
        private String delayReason;

        private Map<String, Object> processParameters;

        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MaterialConsumption {
        @NotNull
        private Long batchId;

        @NotNull
        private Long inventoryId;

        @NotNull
        @Positive
        private BigDecimal quantity;
    }

    // Response DTO
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long confirmationId;
        private Long operationId;
        private String operationName;
        private BigDecimal producedQty;
        private BigDecimal scrapQty;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Integer delayMinutes;
        private String delayReason;
        private Map<String, Object> processParameters;
        private String notes;
        private String status;
        private LocalDateTime createdOn;

        // Rejection fields
        private String rejectionReason;
        private String rejectedBy;
        private LocalDateTime rejectedOn;

        // Output batch info (primary batch for backward compatibility)
        private BatchInfo outputBatch;

        // All output batches (for multi-batch production)
        private List<BatchInfo> outputBatches;

        // Batch split info (if quantity was split into multiple batches)
        private Integer batchCount;
        private Boolean hasPartialBatch;

        // Next operation info
        private NextOperationInfo nextOperation;

        // Equipment and operator info
        private List<EquipmentInfo> equipment;
        private List<OperatorInfo> operators;

        // Materials consumed
        private List<MaterialConsumedInfo> materialsConsumed;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MaterialConsumedInfo {
        private Long batchId;
        private String batchNumber;
        private Long inventoryId;
        private String materialId;
        private BigDecimal quantityConsumed;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EquipmentInfo {
        private Long equipmentId;
        private String equipmentCode;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OperatorInfo {
        private Long operatorId;
        private String operatorCode;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchInfo {
        private Long batchId;
        private String batchNumber;
        private String materialId;
        private String materialName;
        private BigDecimal quantity;
        private String unit;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NextOperationInfo {
        private Long operationId;
        private String operationName;
        private String status;
        private String processName;
    }

    // Rejection request DTO
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RejectionRequest {
        @NotNull(message = "Confirmation ID is required")
        private Long confirmationId;

        @NotNull(message = "Rejection reason is required")
        private String reason;

        private String notes;
    }

    // Status update response DTO
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateResponse {
        private Long confirmationId;
        private String previousStatus;
        private String newStatus;
        private String message;
        private String updatedBy;
        private LocalDateTime updatedOn;
    }
}
