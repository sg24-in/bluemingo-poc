package com.mes.production.dto;

import com.mes.production.entity.ProcessParametersConfig;
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
public class ProcessParametersConfigDTO {

    private Long configId;

    @NotBlank(message = "Operation type is required")
    @Size(max = 50, message = "Operation type must not exceed 50 characters")
    private String operationType;

    @Size(max = 100, message = "Product SKU must not exceed 100 characters")
    private String productSku;

    @NotBlank(message = "Parameter name is required")
    @Size(max = 100, message = "Parameter name must not exceed 100 characters")
    private String parameterName;

    private String parameterType;
    private String unit;
    private BigDecimal minValue;
    private BigDecimal maxValue;
    private BigDecimal defaultValue;
    private Boolean isRequired;
    private Integer displayOrder;
    private String status;

    private LocalDateTime createdOn;
    private String createdBy;
    private LocalDateTime updatedOn;
    private String updatedBy;

    public static ProcessParametersConfigDTO fromEntity(ProcessParametersConfig entity) {
        if (entity == null) return null;

        return ProcessParametersConfigDTO.builder()
                .configId(entity.getConfigId())
                .operationType(entity.getOperationType())
                .productSku(entity.getProductSku())
                .parameterName(entity.getParameterName())
                .parameterType(entity.getParameterType())
                .unit(entity.getUnit())
                .minValue(entity.getMinValue())
                .maxValue(entity.getMaxValue())
                .defaultValue(entity.getDefaultValue())
                .isRequired(entity.getIsRequired())
                .displayOrder(entity.getDisplayOrder())
                .status(entity.getStatus())
                .createdOn(entity.getCreatedOn())
                .createdBy(entity.getCreatedBy())
                .updatedOn(entity.getUpdatedOn())
                .updatedBy(entity.getUpdatedBy())
                .build();
    }

    public ProcessParametersConfig toEntity() {
        return ProcessParametersConfig.builder()
                .configId(this.configId)
                .operationType(this.operationType)
                .productSku(this.productSku)
                .parameterName(this.parameterName)
                .parameterType(this.parameterType)
                .unit(this.unit)
                .minValue(this.minValue)
                .maxValue(this.maxValue)
                .defaultValue(this.defaultValue)
                .isRequired(this.isRequired)
                .displayOrder(this.displayOrder)
                .status(this.status)
                .build();
    }
}
