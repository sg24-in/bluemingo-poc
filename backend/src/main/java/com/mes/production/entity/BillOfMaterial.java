package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bill_of_material")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillOfMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bom_id")
    private Long bomId;

    @Column(name = "product_sku", nullable = false)
    private String productSku;

    @Column(name = "bom_version")
    private String bomVersion;

    @Column(name = "material_id", nullable = false)
    private String materialId;

    @Column(name = "material_name")
    private String materialName;

    @Column(name = "quantity_required", nullable = false, precision = 15, scale = 4)
    private BigDecimal quantityRequired;

    @Column(nullable = false)
    private String unit;

    @Column(name = "yield_loss_ratio", precision = 10, scale = 4)
    private BigDecimal yieldLossRatio;

    @Column(name = "sequence_level", nullable = false)
    private Integer sequenceLevel;

    @Column(name = "parent_bom_id")
    private Long parentBomId;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_on")
    private LocalDateTime createdOn;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_on")
    private LocalDateTime updatedOn;

    @Column(name = "updated_by")
    private String updatedBy;

    @PrePersist
    protected void onCreate() {
        createdOn = LocalDateTime.now();
        if (status == null) status = "ACTIVE";
        if (bomVersion == null) bomVersion = "V1";
        if (unit == null) unit = "T";
        if (yieldLossRatio == null) yieldLossRatio = BigDecimal.ONE;
        if (sequenceLevel == null) sequenceLevel = 1;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
