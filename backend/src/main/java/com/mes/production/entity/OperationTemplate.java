package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * OperationTemplate - Design-time operation definition per MES Consolidated Specification.
 *
 * This is a DESIGN-TIME entity only. It defines reusable operation templates that are:
 * - Referenced by RoutingSteps to define what operation will be created
 * - Used to instantiate runtime Operations when an OrderLineItem is created
 *
 * Fields per spec:
 * - OperationTemplateID (PK)
 * - OperationName
 * - OperationType (FURNACE, CASTER, ROLLING, etc.)
 * - QuantityType (DISCRETE, BATCH, CONTINUOUS)
 * - DefaultEquipmentType
 * - Status (ACTIVE, INACTIVE)
 *
 * Relationship:
 * - RoutingStep → OperationTemplate (design-time)
 * - Operation → OperationTemplate (genealogy reference)
 */
@Entity
@Table(name = "operation_templates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationTemplate {

    // Status constants
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";

    // Quantity type constants
    public static final String QTY_TYPE_DISCRETE = "DISCRETE";
    public static final String QTY_TYPE_BATCH = "BATCH";
    public static final String QTY_TYPE_CONTINUOUS = "CONTINUOUS";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "operation_template_id")
    private Long operationTemplateId;

    @Column(name = "operation_name", nullable = false, length = 100)
    private String operationName;

    @Column(name = "operation_code", length = 50)
    private String operationCode;

    @Column(name = "operation_type", nullable = false, length = 50)
    private String operationType;

    @Column(name = "quantity_type", length = 20)
    private String quantityType;

    @Column(name = "default_equipment_type", length = 50)
    private String defaultEquipmentType;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "estimated_duration_minutes")
    private Integer estimatedDurationMinutes;

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
        if (quantityType == null) quantityType = QTY_TYPE_DISCRETE;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
