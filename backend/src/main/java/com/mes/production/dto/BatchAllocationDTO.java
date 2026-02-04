package com.mes.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class BatchAllocationDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AllocationInfo {
        private Long allocationId;
        private Long batchId;
        private String batchNumber;
        private String materialId;
        private String materialName;
        private Long orderLineId;
        private Long orderId;
        private String productSku;
        private String productName;
        private BigDecimal allocatedQty;
        private String unit;
        private LocalDateTime timestamp;
        private String status;
        private String createdBy;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AllocateRequest {
        private Long batchId;
        private Long orderLineId;
        private BigDecimal quantity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateQuantityRequest {
        private BigDecimal quantity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchAvailability {
        private Long batchId;
        private String batchNumber;
        private BigDecimal totalQuantity;
        private BigDecimal allocatedQuantity;
        private BigDecimal availableQuantity;
        private boolean fullyAllocated;
    }
}
