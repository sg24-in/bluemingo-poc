package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "batches")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Batch {

    // Status constants
    public static final String STATUS_PRODUCED = "PRODUCED";
    public static final String STATUS_AVAILABLE = "AVAILABLE";
    public static final String STATUS_CONSUMED = "CONSUMED";
    public static final String STATUS_BLOCKED = "BLOCKED";
    public static final String STATUS_SCRAPPED = "SCRAPPED";
    public static final String STATUS_ON_HOLD = "ON_HOLD";
    public static final String STATUS_QUALITY_PENDING = "QUALITY_PENDING";

    // Creation source constants (how the batch was created)
    public static final String CREATED_VIA_PRODUCTION = "PRODUCTION";
    public static final String CREATED_VIA_SPLIT = "SPLIT";
    public static final String CREATED_VIA_MERGE = "MERGE";
    public static final String CREATED_VIA_MANUAL = "MANUAL";
    public static final String CREATED_VIA_SYSTEM = "SYSTEM";
    public static final String CREATED_VIA_RECEIPT = "RECEIPT";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "batch_number", nullable = false, unique = true)
    private String batchNumber;

    @Column(name = "material_id", nullable = false)
    private String materialId;

    @Column(name = "material_name")
    private String materialName;

    @Column(nullable = false, precision = 15, scale = 4)
    private BigDecimal quantity;

    @Column(nullable = false)
    private String unit;

    @Column(name = "generated_at_operation_id")
    private Long generatedAtOperationId;

    @Column(nullable = false)
    private String status;

    // Quality approval tracking
    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_on")
    private LocalDateTime approvedOn;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "rejected_by")
    private String rejectedBy;

    @Column(name = "rejected_on")
    private LocalDateTime rejectedOn;

    /**
     * Tracks how the batch was created.
     * Values: PRODUCTION, SPLIT, MERGE, MANUAL, SYSTEM, RECEIPT
     */
    @Column(name = "created_via", length = 50)
    private String createdVia;

    // Supplier/Receipt tracking for RM entry
    @Column(name = "supplier_batch_number", length = 100)
    private String supplierBatchNumber;

    @Column(name = "supplier_id", length = 50)
    private String supplierId;

    @Column(name = "received_date")
    private LocalDate receivedDate;

    @Column(name = "receipt_notes", length = 500)
    private String receiptNotes;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

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
        // Per MES Batch Management Specification: Batches default to QUALITY_PENDING
        // to enforce the approval workflow before becoming AVAILABLE
        if (status == null) status = STATUS_QUALITY_PENDING;
        if (unit == null) unit = "T";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
