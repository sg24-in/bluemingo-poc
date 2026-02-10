package com.mes.production.dto.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrderRequest {

    @NotBlank(message = "Customer ID is required")
    @Size(max = 50, message = "Customer ID must not exceed 50 characters")
    private String customerId;

    @NotBlank(message = "Customer name is required")
    @Size(max = 200, message = "Customer name must not exceed 200 characters")
    private String customerName;

    private LocalDate orderDate;

    private LocalDate deliveryDate;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;

    private Integer priority; // 1=CRITICAL, 2=HIGH, 3=MEDIUM(default), 4=LOW, 5=BACKLOG

    private String status;
}
