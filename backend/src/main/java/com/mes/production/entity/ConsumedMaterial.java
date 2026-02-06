package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "consumed_materials")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsumedMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "consumption_id")
    private Long consumptionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmation_id", nullable = false)
    private ProductionConfirmation confirmation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id")
    private Inventory inventory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private Batch batch;

    @Column(name = "material_id", nullable = false)
    private String materialId;

    @Column(name = "material_name")
    private String materialName;

    @Column(name = "quantity_consumed", nullable = false, precision = 15, scale = 4)
    private BigDecimal quantityConsumed;

    @Column(nullable = false)
    private String unit;

    @Column(name = "consumed_by")
    private String consumedBy;

    @Column(name = "consumed_on")
    private LocalDateTime consumedOn;

    @Column(name = "created_on")
    private LocalDateTime createdOn;

    @Column(name = "created_by")
    private String createdBy;

    @PrePersist
    protected void onCreate() {
        createdOn = LocalDateTime.now();
        consumedOn = LocalDateTime.now();
    }
}
