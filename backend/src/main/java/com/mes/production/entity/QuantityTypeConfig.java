package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "quantity_type_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuantityTypeConfig {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "config_id")
    private Long configId;

    @Column(name = "config_name", nullable = false, unique = true, length = 100)
    private String configName;

    @Column(name = "material_code", length = 50)
    private String materialCode;

    @Column(name = "operation_type", length = 50)
    private String operationType;

    @Column(name = "equipment_type", length = 50)
    private String equipmentType;

    @Column(name = "quantity_type", nullable = false, length = 20)
    private String quantityType;

    @Column(name = "decimal_precision", nullable = false)
    private Integer decimalPrecision;

    @Column(name = "rounding_rule", nullable = false, length = 20)
    private String roundingRule;

    @Column(name = "min_quantity", precision = 15, scale = 4)
    private BigDecimal minQuantity;

    @Column(name = "max_quantity", precision = 15, scale = 4)
    private BigDecimal maxQuantity;

    @Column(length = 20)
    private String unit;

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
        if (status == null) status = STATUS_ACTIVE;
        if (quantityType == null) quantityType = "DECIMAL";
        if (decimalPrecision == null) decimalPrecision = 4;
        if (roundingRule == null) roundingRule = "HALF_UP";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
