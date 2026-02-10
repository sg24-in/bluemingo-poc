package com.mes.production.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryDTO {

    private Long inventoryId;
    private String materialId;
    private String materialName;
    private String inventoryType;
    private String state;
    private BigDecimal quantity;
    private String unit;
    private String location;

    // Batch info
    private Long batchId;
    private String batchNumber;

    // Block info
    private String blockReason;
    private String blockedBy;
    private LocalDateTime blockedOn;

    // Scrap info
    private String scrapReason;
    private String scrappedBy;
    private LocalDateTime scrappedOn;

    // Reservation info
    private Long reservedForOrderId;
    private Long reservedForOperationId;
    private String reservedBy;
    private LocalDateTime reservedOn;
    private BigDecimal reservedQty;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StateUpdateResponse {
        private Long inventoryId;
        private String previousState;
        private String newState;
        private String message;
        private String updatedBy;
        private LocalDateTime updatedOn;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BlockRequest {
        private Long inventoryId;
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScrapRequest {
        private Long inventoryId;
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReserveRequest {
        private Long inventoryId;
        private Long orderId;
        private Long operationId;
        private BigDecimal quantity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateInventoryRequest {
        @NotBlank(message = "Material ID is required")
        @Size(max = 100, message = "Material ID must not exceed 100 characters")
        private String materialId;

        @Size(max = 200, message = "Material name must not exceed 200 characters")
        private String materialName;

        @NotBlank(message = "Inventory type is required")
        private String inventoryType;

        @NotNull(message = "Quantity is required")
        private BigDecimal quantity;

        @Size(max = 20, message = "Unit must not exceed 20 characters")
        private String unit;

        @Size(max = 200, message = "Location must not exceed 200 characters")
        private String location;

        private Long batchId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateInventoryRequest {
        @Size(max = 100, message = "Material ID must not exceed 100 characters")
        private String materialId;

        @Size(max = 200, message = "Material name must not exceed 200 characters")
        private String materialName;

        private String inventoryType;

        private BigDecimal quantity;

        @Size(max = 20, message = "Unit must not exceed 20 characters")
        private String unit;

        @Size(max = 200, message = "Location must not exceed 200 characters")
        private String location;

        private String state;

        private Long batchId;
    }

    /**
     * Request for receiving raw material into inventory.
     * Creates Batch + Inventory + InventoryMovement (RECEIVE).
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReceiveMaterialRequest {
        @NotBlank(message = "Material ID is required")
        @Size(max = 100, message = "Material ID must not exceed 100 characters")
        private String materialId;

        @Size(max = 200, message = "Material name must not exceed 200 characters")
        private String materialName;

        @NotNull(message = "Quantity is required")
        @Positive(message = "Quantity must be positive")
        private BigDecimal quantity;

        @Size(max = 20, message = "Unit must not exceed 20 characters")
        private String unit;

        @Size(max = 100, message = "Supplier batch number must not exceed 100 characters")
        private String supplierBatchNumber;

        @Size(max = 50, message = "Supplier ID must not exceed 50 characters")
        private String supplierId;

        private LocalDate receivedDate;

        private LocalDate expiryDate;

        @Size(max = 200, message = "Location must not exceed 200 characters")
        private String location;

        @Size(max = 500, message = "Notes must not exceed 500 characters")
        private String notes;
    }

    /**
     * Response after receiving raw material.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReceiveMaterialResponse {
        private Long batchId;
        private String batchNumber;
        private Long inventoryId;
        private String batchStatus;
        private String inventoryState;
        private BigDecimal quantity;
        private String unit;
        private String message;
    }
}
