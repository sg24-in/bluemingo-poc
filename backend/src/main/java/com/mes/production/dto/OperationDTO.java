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
public class OperationDTO {

    private Long operationId;
    private Long processId;
    private String operationName;
    private String operationCode;
    private String operationType;
    private Integer sequenceNumber;
    private String status;
    private BigDecimal targetQty;
    private BigDecimal confirmedQty;

    // Block info
    private String blockReason;
    private String blockedBy;
    private LocalDateTime blockedOn;

    // Process info
    private String processName;
    private String orderNumber;
    private String productSku;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateResponse {
        private Long operationId;
        private String previousStatus;
        private String newStatus;
        private String message;
        private String updatedBy;
        private LocalDateTime updatedOn;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BlockRequest {
        private Long operationId;
        private String reason;
    }
}
