package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "hold_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HoldRecord {

    // Entity type constants
    public static final String ENTITY_TYPE_OPERATION = "OPERATION";
    public static final String ENTITY_TYPE_PROCESS = "PROCESS";
    public static final String ENTITY_TYPE_ORDER_LINE = "ORDER_LINE";
    public static final String ENTITY_TYPE_INVENTORY = "INVENTORY";
    public static final String ENTITY_TYPE_BATCH = "BATCH";
    public static final String ENTITY_TYPE_EQUIPMENT = "EQUIPMENT";

    // Status constants
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_RELEASED = "RELEASED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "hold_id")
    private Long holdId;

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(nullable = false)
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "applied_by", nullable = false)
    private String appliedBy;

    @Column(name = "applied_on", nullable = false)
    private LocalDateTime appliedOn;

    @Column(name = "released_by")
    private String releasedBy;

    @Column(name = "released_on")
    private LocalDateTime releasedOn;

    @Column(name = "release_comments", columnDefinition = "TEXT")
    private String releaseComments;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_on")
    private LocalDateTime createdOn;

    @Transient
    private String previousStatus;

    @PrePersist
    protected void onCreate() {
        createdOn = LocalDateTime.now();
        appliedOn = LocalDateTime.now();
        if (status == null) status = "ACTIVE";
    }
}
