package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Routing - Per MES Consolidated Specification.
 *
 * Routings define the sequence of operations (routing steps) for a Process.
 * Per spec: Routing has ProcessID FK linking to Process entity.
 *
 * Additionally supports optional ProcessTemplate reference for design-time management.
 */
@Entity
@Table(name = "routing")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Routing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "routing_id")
    private Long routingId;

    // Per spec: ProcessID (FK → Processes) - runtime reference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_id")
    private Process process;

    // Design-time template reference (optional, for template management)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_template_id")
    private ProcessTemplate processTemplate;

    @Column(name = "routing_name", nullable = false, length = 100)
    private String routingName;

    @Column(name = "routing_type", nullable = false, length = 20)
    private String routingType;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "created_on")
    private LocalDateTime createdOn;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_on")
    private LocalDateTime updatedOn;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @OneToMany(mappedBy = "routing", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<RoutingStep> routingSteps = new ArrayList<>();

    // Routing type constants
    public static final String TYPE_SEQUENTIAL = "SEQUENTIAL";
    public static final String TYPE_PARALLEL = "PARALLEL";

    // Status constants
    public static final String STATUS_DRAFT = "DRAFT";
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";
    public static final String STATUS_ON_HOLD = "ON_HOLD";

    @PrePersist
    protected void onCreate() {
        createdOn = LocalDateTime.now();
        if (status == null) status = STATUS_ACTIVE;
        if (routingType == null) routingType = TYPE_SEQUENTIAL;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
