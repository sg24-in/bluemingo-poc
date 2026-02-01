package com.mes.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

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
}
