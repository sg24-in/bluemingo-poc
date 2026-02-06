package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.EqualsAndHashCode.Exclude;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Process - Design-time process entity per MES Consolidated Specification.
 *
 * Fields per spec:
 * - ProcessID (PK)
 * - ProcessName
 * - Status (READY / IN_PROGRESS / QUALITY_PENDING / COMPLETED / REJECTED / ON_HOLD)
 *
 * NOTE: This is a DESIGN-TIME entity. Runtime tracking happens at Operation level.
 * Operations link to Process via ProcessID FK.
 *
 * Relationship: Process → Operations (via Operations.processId)
 */
@Entity
@Table(name = "processes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Process {

    // Status constants per spec
    public static final String STATUS_READY = "READY";
    public static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    public static final String STATUS_QUALITY_PENDING = "QUALITY_PENDING";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_REJECTED = "REJECTED";
    public static final String STATUS_ON_HOLD = "ON_HOLD";

    // Usage decision constants
    public static final String DECISION_PENDING = "PENDING";
    public static final String DECISION_ACCEPT = "ACCEPT";
    public static final String DECISION_REJECT = "REJECT";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "process_id")
    private Long processId;

    @Column(name = "process_name", nullable = false, length = 100)
    private String processName;

    @Column(nullable = false)
    private String status;

    @Column(name = "usage_decision")
    private String usageDecision;

    @Column(name = "created_on")
    private LocalDateTime createdOn;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_on")
    private LocalDateTime updatedOn;

    @Column(name = "updated_by")
    private String updatedBy;

    @OneToMany(mappedBy = "process", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("sequenceNumber ASC")
    @ToString.Exclude
    @Exclude
    private List<Operation> operations;

    @PrePersist
    protected void onCreate() {
        createdOn = LocalDateTime.now();
        if (status == null) status = STATUS_READY;
        if (usageDecision == null) usageDecision = DECISION_PENDING;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
