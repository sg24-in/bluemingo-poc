package com.mes.production.dto;

import com.mes.production.entity.Material;
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
public class MaterialDTO {

    private Long materialId;

    @NotBlank(message = "Material code is required")
    @Size(max = 50, message = "Material code must not exceed 50 characters")
    private String materialCode;

    @NotBlank(message = "Material name is required")
    @Size(max = 200, message = "Material name must not exceed 200 characters")
    private String materialName;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotBlank(message = "Material type is required")
    private String materialType;

    @NotBlank(message = "Base unit is required")
    private String baseUnit;

    private String materialGroup;
    private String sku;
    private BigDecimal standardCost;
    private String costCurrency;
    private BigDecimal minStockLevel;
    private BigDecimal maxStockLevel;
    private BigDecimal reorderPoint;
    private Integer leadTimeDays;
    private Integer shelfLifeDays;
    private String storageConditions;
    private String status;

    private LocalDateTime createdOn;
    private String createdBy;
    private LocalDateTime updatedOn;
    private String updatedBy;

    // Convert entity to DTO
    public static MaterialDTO fromEntity(Material material) {
        if (material == null) return null;

        return MaterialDTO.builder()
                .materialId(material.getMaterialId())
                .materialCode(material.getMaterialCode())
                .materialName(material.getMaterialName())
                .description(material.getDescription())
                .materialType(material.getMaterialType())
                .baseUnit(material.getBaseUnit())
                .materialGroup(material.getMaterialGroup())
                .sku(material.getSku())
                .standardCost(material.getStandardCost())
                .costCurrency(material.getCostCurrency())
                .minStockLevel(material.getMinStockLevel())
                .maxStockLevel(material.getMaxStockLevel())
                .reorderPoint(material.getReorderPoint())
                .leadTimeDays(material.getLeadTimeDays())
                .shelfLifeDays(material.getShelfLifeDays())
                .storageConditions(material.getStorageConditions())
                .status(material.getStatus())
                .createdOn(material.getCreatedOn())
                .createdBy(material.getCreatedBy())
                .updatedOn(material.getUpdatedOn())
                .updatedBy(material.getUpdatedBy())
                .build();
    }

    // Convert DTO to entity
    public Material toEntity() {
        return Material.builder()
                .materialId(this.materialId)
                .materialCode(this.materialCode)
                .materialName(this.materialName)
                .description(this.description)
                .materialType(this.materialType)
                .baseUnit(this.baseUnit)
                .materialGroup(this.materialGroup)
                .sku(this.sku)
                .standardCost(this.standardCost)
                .costCurrency(this.costCurrency)
                .minStockLevel(this.minStockLevel)
                .maxStockLevel(this.maxStockLevel)
                .reorderPoint(this.reorderPoint)
                .leadTimeDays(this.leadTimeDays)
                .shelfLifeDays(this.shelfLifeDays)
                .storageConditions(this.storageConditions)
                .status(this.status)
                .build();
    }
}
