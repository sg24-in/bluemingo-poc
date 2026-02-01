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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
        private String status;
        private LocalDateTime createdOn;

        // Output batch info
        private BatchInfo outputBatch;

        // Next operation info
        private NextOperationInfo nextOperation;
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
}
