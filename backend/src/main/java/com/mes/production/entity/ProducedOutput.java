package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "produced_outputs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProducedOutput {

    public static final String OUTPUT_TYPE_GOOD = "GOOD";
    public static final String OUTPUT_TYPE_SCRAP = "SCRAP";
    public static final String OUTPUT_TYPE_REWORK = "REWORK";
    public static final String OUTPUT_TYPE_BYPRODUCT = "BYPRODUCT";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "output_id")
    private Long outputId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmation_id", nullable = false)
    private ProductionConfirmation confirmation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private Batch batch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id")
    private Inventory inventory;

    @Column(name = "material_id", nullable = false)
    private String materialId;

    @Column(name = "material_name")
    private String materialName;

    @Column(name = "quantity_produced", nullable = false, precision = 15, scale = 4)
    private BigDecimal quantityProduced;

    @Column(nullable = false)
    private String unit;

    @Column(name = "is_primary_output")
    private Boolean isPrimaryOutput;

    @Column(name = "output_type")
    private String outputType;

    @Column(name = "produced_by")
    private String producedBy;

    @Column(name = "produced_on")
    private LocalDateTime producedOn;

    @Column(name = "created_on")
    private LocalDateTime createdOn;

    @Column(name = "created_by")
    private String createdBy;

    @PrePersist
    protected void onCreate() {
        createdOn = LocalDateTime.now();
        producedOn = LocalDateTime.now();
        if (isPrimaryOutput == null) isPrimaryOutput = true;
        if (outputType == null) outputType = OUTPUT_TYPE_GOOD;
    }
}
