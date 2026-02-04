package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "materials")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Material {

    // Material type constants
    public static final String TYPE_RAW_MATERIAL = "RM";
    public static final String TYPE_INTERMEDIATE = "IM";
    public static final String TYPE_FINISHED_GOODS = "FG";
    public static final String TYPE_WIP = "WIP";

    // Status constants
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";
    public static final String STATUS_OBSOLETE = "OBSOLETE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "material_id")
    private Long materialId;

    @Column(name = "material_code", nullable = false, unique = true, length = 50)
    private String materialCode;

    @Column(name = "material_name", nullable = false, length = 200)
    private String materialName;

    @Column(length = 500)
    private String description;

    @Column(name = "material_type", nullable = false, length = 20)
    private String materialType;

    @Column(name = "base_unit", nullable = false, length = 20)
    private String baseUnit;

    @Column(name = "material_group", length = 50)
    private String materialGroup;

    @Column(name = "sku", length = 50)
    private String sku;

    @Column(name = "standard_cost", precision = 15, scale = 4)
    private BigDecimal standardCost;

    @Column(name = "cost_currency", length = 3)
    private String costCurrency;

    @Column(name = "min_stock_level", precision = 15, scale = 4)
    private BigDecimal minStockLevel;

    @Column(name = "max_stock_level", precision = 15, scale = 4)
    private BigDecimal maxStockLevel;

    @Column(name = "reorder_point", precision = 15, scale = 4)
    private BigDecimal reorderPoint;

    @Column(name = "lead_time_days")
    private Integer leadTimeDays;

    @Column(name = "shelf_life_days")
    private Integer shelfLifeDays;

    @Column(name = "storage_conditions", length = 255)
    private String storageConditions;

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
        if (costCurrency == null) {
            costCurrency = "USD";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
