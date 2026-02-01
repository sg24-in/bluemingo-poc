package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "batch_relations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchRelation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "relation_id")
    private Long relationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_batch_id", nullable = false)
    private Batch parentBatch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "child_batch_id", nullable = false)
    private Batch childBatch;

    @Column(name = "operation_id")
    private Long operationId;

    @Column(name = "relation_type", nullable = false)
    private String relationType;

    @Column(name = "quantity_consumed", nullable = false, precision = 15, scale = 4)
    private BigDecimal quantityConsumed;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_on")
    private LocalDateTime createdOn;

    @Column(name = "created_by")
    private String createdBy;

    @PrePersist
    protected void onCreate() {
        createdOn = LocalDateTime.now();
        if (status == null) status = "ACTIVE";
        if (relationType == null) relationType = "MERGE";
    }
}
