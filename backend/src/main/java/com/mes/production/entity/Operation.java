package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.EqualsAndHashCode.Exclude;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Operation - Runtime operation entity per MES Consolidated Specification.
 *
 * Fields per spec:
 * - OperationID (PK)
 * - ProcessID (FK) - Links to the parent Process
 * - OperationName
 * - OperationType
 * - Status
 *
 * Relationship: Processes → Operations
 */
@Entity
@Table(name = "operations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Operation {

    // Status constants
    public static final String STATUS_NOT_STARTED = "NOT_STARTED";
    public static final String STATUS_READY = "READY";
    public static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    public static final String STATUS_CONFIRMED = "CONFIRMED";
    public static final String STATUS_PARTIALLY_CONFIRMED = "PARTIALLY_CONFIRMED";
    public static final String STATUS_ON_HOLD = "ON_HOLD";
    public static final String STATUS_BLOCKED = "BLOCKED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "operation_id")
    private Long operationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_id", nullable = false)
    @ToString.Exclude
    @Exclude
    private Process process;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_line_id")
    @ToString.Exclude
    @Exclude
    private OrderLineItem orderLineItem;

    @Column(name = "routing_step_id")
    private Long routingStepId;

    @Column(name = "operation_name", nullable = false)
    private String operationName;

    @Column(name = "operation_code")
    private String operationCode;

    @Column(name = "operation_type")
    private String operationType;

    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber;

    @Column(nullable = false)
    private String status;

    @Column(name = "target_qty", precision = 15, scale = 4)
    private java.math.BigDecimal targetQty;

    @Column(name = "confirmed_qty", precision = 15, scale = 4)
    private java.math.BigDecimal confirmedQty;

    // Block tracking
    @Column(name = "block_reason", length = 500)
    private String blockReason;

    @Column(name = "blocked_by")
    private String blockedBy;

    @Column(name = "blocked_on")
    private LocalDateTime blockedOn;

    @Column(name = "created_on")
    private LocalDateTime createdOn;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_on")
    private LocalDateTime updatedOn;

    @Column(name = "updated_by")
    private String updatedBy;

    @OneToMany(mappedBy = "operation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @Exclude
    private List<ProductionConfirmation> confirmations;

    @PrePersist
    protected void onCreate() {
        createdOn = LocalDateTime.now();
        if (status == null) status = STATUS_NOT_STARTED;
        if (sequenceNumber == null) sequenceNumber = 1;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
