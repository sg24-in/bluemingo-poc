package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.EqualsAndHashCode.Exclude;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "processes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Process {

    // Status constants
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_line_id", nullable = false)
    @ToString.Exclude
    @Exclude
    private OrderLineItem orderLineItem;

    @Column(name = "bom_id")
    private Long bomId;

    @Column(name = "stage_name", nullable = false)
    private String stageName;

    @Column(name = "stage_sequence", nullable = false)
    private Integer stageSequence;

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
        if (status == null) status = "READY";
        if (stageSequence == null) stageSequence = 1;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
