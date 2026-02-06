package com.mes.production.dto;

import com.mes.production.entity.QuantityTypeConfig;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class QuantityTypeConfigDTO {

    private Long configId;

    @NotBlank(message = "Config name is required")
    @Size(max = 100, message = "Config name must not exceed 100 characters")
    private String configName;

    @Size(max = 50, message = "Material code must not exceed 50 characters")
    private String materialCode;

    @Size(max = 50, message = "Operation type must not exceed 50 characters")
    private String operationType;

    @Size(max = 50, message = "Equipment type must not exceed 50 characters")
    private String equipmentType;

    private String quantityType;
    private Integer decimalPrecision;
    private String roundingRule;
    private BigDecimal minQuantity;
    private BigDecimal maxQuantity;
    private String unit;
    private String status;

    private LocalDateTime createdOn;
    private String createdBy;
    private LocalDateTime updatedOn;
    private String updatedBy;

    public static QuantityTypeConfigDTO fromEntity(QuantityTypeConfig entity) {
        if (entity == null) return null;

        return QuantityTypeConfigDTO.builder()
                .configId(entity.getConfigId())
                .configName(entity.getConfigName())
                .materialCode(entity.getMaterialCode())
                .operationType(entity.getOperationType())
                .equipmentType(entity.getEquipmentType())
                .quantityType(entity.getQuantityType())
                .decimalPrecision(entity.getDecimalPrecision())
                .roundingRule(entity.getRoundingRule())
                .minQuantity(entity.getMinQuantity())
                .maxQuantity(entity.getMaxQuantity())
                .unit(entity.getUnit())
                .status(entity.getStatus())
                .createdOn(entity.getCreatedOn())
                .createdBy(entity.getCreatedBy())
                .updatedOn(entity.getUpdatedOn())
                .updatedBy(entity.getUpdatedBy())
                .build();
    }

    public QuantityTypeConfig toEntity() {
        return QuantityTypeConfig.builder()
                .configId(this.configId)
                .configName(this.configName)
                .materialCode(this.materialCode)
                .operationType(this.operationType)
                .equipmentType(this.equipmentType)
                .quantityType(this.quantityType)
                .decimalPrecision(this.decimalPrecision)
                .roundingRule(this.roundingRule)
                .minQuantity(this.minQuantity)
                .maxQuantity(this.maxQuantity)
                .unit(this.unit)
                .status(this.status)
                .build();
    }
}
