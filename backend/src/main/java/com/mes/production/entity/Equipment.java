package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipment")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Equipment {

    // Status constants
    public static final String STATUS_AVAILABLE = "AVAILABLE";
    public static final String STATUS_IN_USE = "IN_USE";
    public static final String STATUS_MAINTENANCE = "MAINTENANCE";
    public static final String STATUS_ON_HOLD = "ON_HOLD";
    public static final String STATUS_UNAVAILABLE = "UNAVAILABLE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "equipment_id")
    private Long equipmentId;

    @Column(name = "equipment_code", nullable = false, unique = true)
    private String equipmentCode;

    @Column(nullable = false)
    private String name;

    @Column(name = "equipment_type", nullable = false)
    private String equipmentType;

    @Column(precision = 15, scale = 4)
    private BigDecimal capacity;

    @Column(name = "capacity_unit")
    private String capacityUnit;

    private String location;

    @Column(nullable = false)
    private String status;

    // Maintenance tracking
    @Column(name = "maintenance_reason", length = 500)
    private String maintenanceReason;

    @Column(name = "maintenance_start")
    private LocalDateTime maintenanceStart;

    @Column(name = "maintenance_by")
    private String maintenanceBy;

    @Column(name = "expected_maintenance_end")
    private LocalDateTime expectedMaintenanceEnd;

    // Hold tracking
    @Column(name = "hold_reason", length = 500)
    private String holdReason;

    @Column(name = "hold_start")
    private LocalDateTime holdStart;

    @Column(name = "held_by")
    private String heldBy;

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
        if (status == null) status = "AVAILABLE";
        if (equipmentType == null) equipmentType = "BATCH";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
