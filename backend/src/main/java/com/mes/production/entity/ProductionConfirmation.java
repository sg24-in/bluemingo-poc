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
import java.util.Map;

@Entity
@Table(name = "production_confirmation")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionConfirmation {

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

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "process_parameters", columnDefinition = "jsonb")
    private Map<String, Object> processParameters;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "rm_consumed", columnDefinition = "jsonb")
    private Map<String, Object> rmConsumed;

    @Column(nullable = false)
    private String status;

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
        if (status == null) status = "CONFIRMED";
        if (scrapQty == null) scrapQty = BigDecimal.ZERO;
        if (delayMinutes == null) delayMinutes = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
