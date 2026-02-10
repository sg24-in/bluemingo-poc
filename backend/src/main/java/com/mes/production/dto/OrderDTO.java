package com.mes.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {

    private Long orderId;
    private String orderNumber;
    private String customerId;
    private String customerName;
    private LocalDate orderDate;
    private LocalDate deliveryDate;
    private String notes;
    private Integer priority;
    private String status;
    private List<OrderLineDTO> lineItems;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderLineDTO {
        private Long orderLineId;
        private String productSku;
        private String productName;
        private BigDecimal quantity;
        private String unit;
        private LocalDate deliveryDate;
        private String status;
        // Operations now link directly to OrderLineItem (no Process intermediary)
        private List<OperationDTO> operations;
        private OperationDTO currentOperation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OperationDTO {
        private Long operationId;
        private String operationName;
        private String operationCode;
        private String operationType;
        private Integer sequenceNumber;
        private String status;
        // Reference to design-time Process (optional)
        private Long processId;
        private String processName;
    }
}
