package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_movement")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "movement_id")
    private Long movementId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operation_id")
    private Operation operation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id", nullable = false)
    private Inventory inventory;

    @Column(name = "movement_type", nullable = false, length = 20)
    private String movementType;

    @Column(nullable = false, precision = 15, scale = 4)
    private BigDecimal quantity;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(length = 255)
    private String reason;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "created_on")
    private LocalDateTime createdOn;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    // Movement type constants
    public static final String TYPE_CONSUME = "CONSUME";
    public static final String TYPE_PRODUCE = "PRODUCE";
    public static final String TYPE_HOLD = "HOLD";
    public static final String TYPE_RELEASE = "RELEASE";
    public static final String TYPE_SCRAP = "SCRAP";

    // Status constants
    public static final String STATUS_EXECUTED = "EXECUTED";
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_ON_HOLD = "ON_HOLD";

    @PrePersist
    protected void onCreate() {
        createdOn = LocalDateTime.now();
        if (timestamp == null) timestamp = LocalDateTime.now();
        if (status == null) status = STATUS_EXECUTED;
    }
}
