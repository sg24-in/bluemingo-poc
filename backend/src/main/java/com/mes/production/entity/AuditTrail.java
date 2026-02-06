package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_trail")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditTrail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_id")
    private Long auditId;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "field_name", length = 100)
    private String fieldName;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(nullable = false, length = 20)
    private String action;

    @Column(name = "changed_by", nullable = false, length = 100)
    private String changedBy;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }

    // Action constants
    public static final String ACTION_CREATE = "CREATE";
    public static final String ACTION_UPDATE = "UPDATE";
    public static final String ACTION_DELETE = "DELETE";
    public static final String ACTION_STATUS_CHANGE = "STATUS_CHANGE";
    public static final String ACTION_CONSUME = "CONSUME";
    public static final String ACTION_PRODUCE = "PRODUCE";
    public static final String ACTION_HOLD = "HOLD";
    public static final String ACTION_RELEASE = "RELEASE";
    public static final String ACTION_BATCH_NUMBER_GENERATED = "BATCH_NUMBER_GENERATED";

    // Entity type constants
    public static final String ENTITY_PRODUCTION_CONFIRMATION = "PRODUCTION_CONFIRMATION";
    public static final String ENTITY_OPERATION = "OPERATION";
    public static final String ENTITY_PROCESS = "PROCESS";
    public static final String ENTITY_INVENTORY = "INVENTORY";
    public static final String ENTITY_BATCH = "BATCH";
    public static final String ENTITY_BATCH_RELATION = "BATCH_RELATION";
    public static final String ENTITY_ORDER = "ORDER";
    public static final String ENTITY_ORDER_LINE = "ORDER_LINE";
}
