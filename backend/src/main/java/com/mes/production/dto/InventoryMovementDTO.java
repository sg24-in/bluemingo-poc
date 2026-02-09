package com.mes.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class InventoryMovementDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MovementInfo {
        private Long movementId;
        private Long inventoryId;
        private String materialId;
        private String materialName;
        private Long operationId;
        private String operationName;
        private String movementType;
        private BigDecimal quantity;
        private String unit;
        private LocalDateTime timestamp;
        private String reason;
        private String status;
        private String createdBy;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecordMovementRequest {
        private Long inventoryId;
        private Long operationId;
        private String movementType;
        private BigDecimal quantity;
        private String reason;
    }
}
