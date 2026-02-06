package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ProcessTemplate - Design-time process definition.
 *
 * This entity represents a template for processes that can be instantiated
 * at runtime when an order is created. It separates design-time configuration
 * from runtime execution.
 *
 * Per MES Routing/Process/Operation specification:
 * - Templates define the structure and operations for a process
 * - Templates can have versions and effective dates
 * - Templates are linked to products via productSku
 */
@Entity
@Table(name = "process_templates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "process_template_id")
    private Long processTemplateId;

    @Column(name = "template_name", nullable = false, length = 100)
    private String templateName;

    @Column(name = "template_code", unique = true, length = 50)
    private String templateCode;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "product_sku", length = 50)
    private String productSku;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "version", length = 20)
    private String version;

    @Column(name = "effective_from")
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "created_on")
    private LocalDateTime createdOn;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_on")
    private LocalDateTime updatedOn;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    // Status constants
    public static final String STATUS_DRAFT = "DRAFT";
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";
    public static final String STATUS_SUPERSEDED = "SUPERSEDED";

    @PrePersist
    protected void onCreate() {
        createdOn = LocalDateTime.now();
        if (status == null) status = STATUS_DRAFT;
        if (version == null) version = "V1";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }

    /**
     * Check if this template is currently effective
     */
    public boolean isEffective() {
        LocalDate today = LocalDate.now();
        boolean afterStart = (effectiveFrom == null) || !today.isBefore(effectiveFrom);
        boolean beforeEnd = (effectiveTo == null) || !today.isAfter(effectiveTo);
        return STATUS_ACTIVE.equals(status) && afterStart && beforeEnd;
    }
}
