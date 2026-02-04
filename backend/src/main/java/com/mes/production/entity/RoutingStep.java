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
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
