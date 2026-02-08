package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * RoutingStep - Design-time routing step definition per MES Consolidated Specification.
 *
 * This is a DESIGN-TIME entity only. It defines:
 * - The sequence of operations in a Routing
 * - Which OperationTemplate to use at each step
 * - Batch behavior flags (split/merge allowed)
 *
 * IMPORTANT: RoutingSteps do NOT reference runtime Operations.
 * Operations reference RoutingSteps (for genealogy) - this is a one-way relationship.
 *
 * Relationship:
 * - Routing → RoutingSteps (parent template)
 * - RoutingStep → OperationTemplate (design-time operation definition)
 */
@Entity
@Table(name = "routing_steps")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoutingStep {

    // Status constants - TEMPLATE lifecycle, not runtime execution
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "routing_step_id")
    private Long routingStepId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "routing_id", nullable = false)
    private Routing routing;

    // Design-time reference to OperationTemplate (NEW)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operation_template_id")
    private OperationTemplate operationTemplate;

    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber;

    @Column(name = "is_parallel")
    private Boolean isParallel;

    @Column(name = "mandatory_flag")
    private Boolean mandatoryFlag;

    // Status is now template-appropriate: ACTIVE/INACTIVE
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

    // Legacy operation template fields - kept for backward compatibility
    // Prefer using OperationTemplate reference for new data
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

    @PrePersist
    protected void onCreate() {
        createdOn = LocalDateTime.now();
        if (status == null) status = STATUS_ACTIVE;
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

    /**
     * Get the effective operation name - from OperationTemplate if available,
     * otherwise from legacy fields.
     */
    public String getEffectiveOperationName() {
        if (operationTemplate != null) {
            return operationTemplate.getOperationName();
        }
        return operationName;
    }

    /**
     * Get the effective operation type - from OperationTemplate if available,
     * otherwise from legacy fields.
     */
    public String getEffectiveOperationType() {
        if (operationTemplate != null) {
            return operationTemplate.getOperationType();
        }
        return operationType;
    }

    /**
     * Get the effective operation code - from OperationTemplate if available,
     * otherwise from legacy fields.
     */
    public String getEffectiveOperationCode() {
        if (operationTemplate != null) {
            return operationTemplate.getOperationCode();
        }
        return operationCode;
    }
}
