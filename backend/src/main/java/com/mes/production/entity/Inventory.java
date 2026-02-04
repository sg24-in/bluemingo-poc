package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Inventory {

    // State constants
    public static final String STATE_AVAILABLE = "AVAILABLE";
    public static final String STATE_RESERVED = "RESERVED";
    public static final String STATE_CONSUMED = "CONSUMED";
    public static final String STATE_PRODUCED = "PRODUCED";
    public static final String STATE_BLOCKED = "BLOCKED";
    public static final String STATE_SCRAPPED = "SCRAPPED";
    public static final String STATE_ON_HOLD = "ON_HOLD";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inventory_id")
    private Long inventoryId;

    @Column(name = "material_id", nullable = false)
    private String materialId;

    @Column(name = "material_name")
    private String materialName;

    @Column(name = "inventory_type", nullable = false)
    private String inventoryType;

    @Column(name = "inventory_form")
    private String inventoryForm;

    @Column(nullable = false)
    private String state;

    @Column(nullable = false, precision = 15, scale = 4)
    private BigDecimal quantity;

    @Column(nullable = false)
    private String unit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private Batch batch;

    private String location;

    @Column(name = "current_temperature", precision = 10, scale = 2)
    private java.math.BigDecimal currentTemperature;

    @Column(name = "moisture_content", precision = 5, scale = 2)
    private java.math.BigDecimal moistureContent;

    @Column(precision = 10, scale = 4)
    private java.math.BigDecimal density;

    @Column(name = "block_reason", length = 500)
    private String blockReason;

    @Column(name = "blocked_by")
    private String blockedBy;

    @Column(name = "blocked_on")
    private LocalDateTime blockedOn;

    @Column(name = "scrap_reason", length = 500)
    private String scrapReason;

    @Column(name = "scrapped_by")
    private String scrappedBy;

    @Column(name = "scrapped_on")
    private LocalDateTime scrappedOn;

    // Reservation tracking
    @Column(name = "reserved_for_order_id")
    private Long reservedForOrderId;

    @Column(name = "reserved_for_operation_id")
    private Long reservedForOperationId;

    @Column(name = "reserved_by")
    private String reservedBy;

    @Column(name = "reserved_on")
    private LocalDateTime reservedOn;

    @Column(name = "reserved_qty", precision = 15, scale = 4)
    private BigDecimal reservedQty;

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
        if (state == null) state = STATE_AVAILABLE;
        if (unit == null) unit = "T";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
