package com.mes.production.dto;

import com.mes.production.entity.Product;
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
public class ProductDTO {

    private Long productId;

    @NotBlank(message = "SKU is required")
    @Size(max = 50, message = "SKU must not exceed 50 characters")
    private String sku;

    @NotBlank(message = "Product name is required")
    @Size(max = 200, message = "Product name must not exceed 200 characters")
    private String productName;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    private String productCategory;
    private String productGroup;

    @NotBlank(message = "Base unit is required")
    private String baseUnit;

    private BigDecimal weightPerUnit;
    private String weightUnit;
    private BigDecimal standardPrice;
    private String priceCurrency;
    private BigDecimal minOrderQty;
    private Integer leadTimeDays;
    private Long materialId;
    private String status;

    private LocalDateTime createdOn;
    private String createdBy;
    private LocalDateTime updatedOn;
    private String updatedBy;

    // Convert entity to DTO
    public static ProductDTO fromEntity(Product product) {
        if (product == null) return null;

        return ProductDTO.builder()
                .productId(product.getProductId())
                .sku(product.getSku())
                .productName(product.getProductName())
                .description(product.getDescription())
                .productCategory(product.getProductCategory())
                .productGroup(product.getProductGroup())
                .baseUnit(product.getBaseUnit())
                .weightPerUnit(product.getWeightPerUnit())
                .weightUnit(product.getWeightUnit())
                .standardPrice(product.getStandardPrice())
                .priceCurrency(product.getPriceCurrency())
                .minOrderQty(product.getMinOrderQty())
                .leadTimeDays(product.getLeadTimeDays())
                .materialId(product.getMaterialId())
                .status(product.getStatus())
                .createdOn(product.getCreatedOn())
                .createdBy(product.getCreatedBy())
                .updatedOn(product.getUpdatedOn())
                .updatedBy(product.getUpdatedBy())
                .build();
    }

    // Convert DTO to entity
    public Product toEntity() {
        return Product.builder()
                .productId(this.productId)
                .sku(this.sku)
                .productName(this.productName)
                .description(this.description)
                .productCategory(this.productCategory)
                .productGroup(this.productGroup)
                .baseUnit(this.baseUnit)
                .weightPerUnit(this.weightPerUnit)
                .weightUnit(this.weightUnit)
                .standardPrice(this.standardPrice)
                .priceCurrency(this.priceCurrency)
                .minOrderQty(this.minOrderQty)
                .leadTimeDays(this.leadTimeDays)
                .materialId(this.materialId)
                .status(this.status)
                .build();
    }
}
