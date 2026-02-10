package com.mes.production.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class CreateOrderRequest {

    @NotBlank(message = "Customer ID is required")
    @Size(max = 50, message = "Customer ID must not exceed 50 characters")
    private String customerId;

    @NotBlank(message = "Customer name is required")
    @Size(max = 200, message = "Customer name must not exceed 200 characters")
    private String customerName;

    @NotNull(message = "Order date is required")
    private LocalDate orderDate;

    private String orderNumber; // Optional - will be auto-generated if not provided

    private LocalDate deliveryDate;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;

    private Integer priority; // 1=CRITICAL, 2=HIGH, 3=MEDIUM(default), 4=LOW, 5=BACKLOG

    @NotEmpty(message = "At least one line item is required")
    @Valid
    private List<LineItemRequest> lineItems;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LineItemRequest {

        @NotBlank(message = "Product SKU is required")
        @Size(max = 50, message = "Product SKU must not exceed 50 characters")
        private String productSku;

        @NotBlank(message = "Product name is required")
        @Size(max = 200, message = "Product name must not exceed 200 characters")
        private String productName;

        @NotNull(message = "Quantity is required")
        private BigDecimal quantity;

        @NotBlank(message = "Unit is required")
        @Size(max = 20, message = "Unit must not exceed 20 characters")
        private String unit;

        private LocalDate deliveryDate;
    }
}
