package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Entity
@Table(name = "production_confirmation")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionConfirmation {

    // Status constants
    public static final String STATUS_CONFIRMED = "CONFIRMED";
    public static final String STATUS_REJECTED = "REJECTED";
    public static final String STATUS_PARTIALLY_CONFIRMED = "PARTIALLY_CONFIRMED";
    public static final String STATUS_PENDING_REVIEW = "PENDING_REVIEW";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "confirmation_id")
    private Long confirmationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operation_id", nullable = false)
    private Operation operation;

    @Column(name = "produced_qty", nullable = false, precision = 15, scale = 4)
    private BigDecimal producedQty;

    @Column(name = "scrap_qty", precision = 15, scale = 4)
    private BigDecimal scrapQty;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "delay_minutes")
    private Integer delayMinutes;

    @Column(name = "delay_reason")
    private String delayReason;

    @Column(name = "process_parameters", columnDefinition = "CLOB")
    private String processParametersJson;

    @Column(name = "rm_consumed", columnDefinition = "CLOB")
    private String rmConsumedJson;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "confirmation_equipment",
        joinColumns = @JoinColumn(name = "confirmation_id"),
        inverseJoinColumns = @JoinColumn(name = "equipment_id")
    )
    @Builder.Default
    private Set<Equipment> equipment = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "confirmation_operators",
        joinColumns = @JoinColumn(name = "confirmation_id"),
        inverseJoinColumns = @JoinColumn(name = "operator_id")
    )
    @Builder.Default
    private Set<Operator> operators = new HashSet<>();

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(nullable = false)
    private String status;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "rejected_by")
    private String rejectedBy;

    @Column(name = "rejected_on")
    private LocalDateTime rejectedOn;

    @Column(name = "created_on")
    private LocalDateTime createdOn;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_on")
    private LocalDateTime updatedOn;

    @Column(name = "updated_by")
    private String updatedBy;

    @PrePersist
    protected void onCreate() {
        createdOn = LocalDateTime.now();
        if (status == null) status = STATUS_CONFIRMED;
        if (scrapQty == null) scrapQty = BigDecimal.ZERO;
        if (delayMinutes == null) delayMinutes = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
