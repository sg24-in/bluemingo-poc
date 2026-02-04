package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    // Status constants
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";
    public static final String STATUS_DISCONTINUED = "DISCONTINUED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Long productId;

    @Column(nullable = false, unique = true, length = 50)
    private String sku;

    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @Column(length = 500)
    private String description;

    @Column(name = "product_category", length = 100)
    private String productCategory;

    @Column(name = "product_group", length = 100)
    private String productGroup;

    @Column(name = "base_unit", nullable = false, length = 20)
    private String baseUnit;

    @Column(name = "weight_per_unit", precision = 15, scale = 4)
    private BigDecimal weightPerUnit;

    @Column(name = "weight_unit", length = 10)
    private String weightUnit;

    @Column(name = "standard_price", precision = 15, scale = 4)
    private BigDecimal standardPrice;

    @Column(name = "price_currency", length = 3)
    private String priceCurrency;

    @Column(name = "min_order_qty", precision = 15, scale = 4)
    private BigDecimal minOrderQty;

    @Column(name = "lead_time_days")
    private Integer leadTimeDays;

    // Reference to material used for this product (if applicable)
    @Column(name = "material_id")
    private Long materialId;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "created_on")
    private LocalDateTime createdOn;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_on")
    private LocalDateTime updatedOn;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @PrePersist
    protected void onCreate() {
        createdOn = LocalDateTime.now();
        if (status == null) {
            status = STATUS_ACTIVE;
        }
        if (baseUnit == null) {
            baseUnit = "T";
        }
        if (priceCurrency == null) {
            priceCurrency = "USD";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
