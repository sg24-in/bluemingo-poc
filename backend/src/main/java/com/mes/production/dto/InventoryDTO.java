package com.mes.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
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
}
