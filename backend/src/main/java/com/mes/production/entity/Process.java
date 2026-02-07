package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.EqualsAndHashCode.Exclude;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Process - Design-time process template per MES Consolidated Specification.
 *
 * This is a DESIGN-TIME entity only. Runtime execution tracking happens at Operation level.
 * Operations link to OrderLineItem for runtime tracking (not Process).
 *
 * Relationship: Process → Operations (design-time template reference)
 */
@Entity
@Table(name = "processes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Process {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "process_id")
    private Long processId;

    @Column(name = "process_name", nullable = false, length = 100)
    private String processName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProcessStatus status;

    @Column(name = "created_on")
    private LocalDateTime createdOn;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_on")
    private LocalDateTime updatedOn;

    @Column(name = "updated_by")
    private String updatedBy;

    @OneToMany(mappedBy = "process", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("sequenceNumber ASC")
    @ToString.Exclude
    @Exclude
    private List<Operation> operations;

    @PrePersist
    protected void onCreate() {
        createdOn = LocalDateTime.now();
        if (status == null) status = ProcessStatus.DRAFT;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
