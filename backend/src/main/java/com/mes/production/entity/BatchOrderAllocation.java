package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "batch_order_allocation")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchOrderAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "allocation_id")
    private Long allocationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private Batch batch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_line_id", nullable = false)
    private OrderLineItem orderLineItem;

    @Column(name = "allocated_qty", nullable = false, precision = 15, scale = 4)
    private BigDecimal allocatedQty;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "created_on")
    private LocalDateTime createdOn;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    // Status constants
    public static final String STATUS_ALLOCATED = "ALLOCATED";
    public static final String STATUS_RELEASED = "RELEASED";

    @PrePersist
    protected void onCreate() {
        createdOn = LocalDateTime.now();
        if (timestamp == null) timestamp = LocalDateTime.now();
        if (status == null) status = STATUS_ALLOCATED;
    }
}
