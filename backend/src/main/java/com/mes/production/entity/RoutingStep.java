package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "routing_steps")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoutingStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "routing_step_id")
    private Long routingStepId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "routing_id", nullable = false)
    private Routing routing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operation_id")
    private Operation operation;

    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber;

    @Column(name = "is_parallel")
    private Boolean isParallel;

    @Column(name = "mandatory_flag")
    private Boolean mandatoryFlag;

    @Column(nullable = false, length = 20)
    private String status;

    // Batch behavior flags (R02)
    // These declare what batch operations are allowed at this step
    @Column(name = "produces_output_batch")
    private Boolean producesOutputBatch;

    @Column(name = "allows_split")
    private Boolean allowsSplit;

    @Column(name = "allows_merge")
    private Boolean allowsMerge;

    // Operation template fields (R03)
    // These define the operation that will be created when routing is instantiated
    @Column(name = "operation_name", length = 100)
    private String operationName;

    @Column(name = "operation_type", length = 50)
    private String operationType;

    @Column(name = "operation_code", length = 50)
    private String operationCode;

    @Column(name = "target_qty", precision = 15, scale = 4)
    private java.math.BigDecimal targetQty;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "estimated_duration_minutes")
    private Integer estimatedDurationMinutes;

    @Column(name = "created_on")
    private LocalDateTime createdOn;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_on")
    private LocalDateTime updatedOn;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    // Status constants
    public static final String STATUS_READY = "READY";
    public static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_ON_HOLD = "ON_HOLD";

    @PrePersist
    protected void onCreate() {
        createdOn = LocalDateTime.now();
        if (status == null) status = STATUS_READY;
        if (isParallel == null) isParallel = false;
        if (mandatoryFlag == null) mandatoryFlag = true;
        // Batch behavior defaults
        if (producesOutputBatch == null) producesOutputBatch = true;
        if (allowsSplit == null) allowsSplit = false;
        if (allowsMerge == null) allowsMerge = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
