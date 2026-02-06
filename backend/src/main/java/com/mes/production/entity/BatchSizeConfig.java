package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Configures batch size limits for multi-batch production confirmation.
 * When production quantity exceeds max_batch_size, multiple batches are created.
 */
@Entity
@Table(name = "batch_size_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchSizeConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "config_id")
    private Long configId;

    @Column(name = "material_id", length = 50)
    private String materialId;

    @Column(name = "operation_type", length = 50)
    private String operationType;

    @Column(name = "equipment_type", length = 50)
    private String equipmentType;

    @Column(name = "product_sku", length = 50)
    private String productSku;

    @Column(name = "min_batch_size", precision = 15, scale = 4)
    private BigDecimal minBatchSize;

    @Column(name = "max_batch_size", nullable = false, precision = 15, scale = 4)
    private BigDecimal maxBatchSize;

    @Column(name = "preferred_batch_size", precision = 15, scale = 4)
    private BigDecimal preferredBatchSize;

    @Column(name = "unit", length = 20)
    private String unit;

    @Column(name = "allow_partial_batch")
    private Boolean allowPartialBatch;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "priority")
    private Integer priority;

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
        if (isActive == null) isActive = true;
        if (allowPartialBatch == null) allowPartialBatch = true;
        if (minBatchSize == null) minBatchSize = BigDecimal.ZERO;
        if (unit == null) unit = "T";
        if (priority == null) priority = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
