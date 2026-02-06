package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity for tracking batch quantity adjustments.
 * Per MES Batch Management Specification: batch quantities should never be edited directly.
 * All quantity changes must go through this adjustment mechanism with mandatory reason.
 */
@Entity
@Table(name = "batch_quantity_adjustments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchQuantityAdjustment {

    // Adjustment types
    public static final String TYPE_CORRECTION = "CORRECTION";
    public static final String TYPE_INVENTORY_COUNT = "INVENTORY_COUNT";
    public static final String TYPE_DAMAGE = "DAMAGE";
    public static final String TYPE_SCRAP_RECOVERY = "SCRAP_RECOVERY";
    public static final String TYPE_SYSTEM = "SYSTEM";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "adjustment_id")
    private Long adjustmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private Batch batch;

    @Column(name = "old_quantity", nullable = false, precision = 15, scale = 4)
    private BigDecimal oldQuantity;

    @Column(name = "new_quantity", nullable = false, precision = 15, scale = 4)
    private BigDecimal newQuantity;

    @Column(name = "adjustment_reason", nullable = false, length = 500)
    private String adjustmentReason;

    @Column(name = "adjustment_type", nullable = false, length = 50)
    private String adjustmentType;

    @Column(name = "adjusted_by", nullable = false, length = 100)
    private String adjustedBy;

    @Column(name = "adjusted_on")
    private LocalDateTime adjustedOn;

    @PrePersist
    protected void onCreate() {
        if (adjustedOn == null) {
            adjustedOn = LocalDateTime.now();
        }
    }

    /**
     * Get the quantity difference (new - old)
     */
    public BigDecimal getQuantityDifference() {
        if (newQuantity != null && oldQuantity != null) {
            return newQuantity.subtract(oldQuantity);
        }
        return BigDecimal.ZERO;
    }
}
