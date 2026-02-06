package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "attribute_definitions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttributeDefinition {

    public static final String DATA_TYPE_STRING = "STRING";
    public static final String DATA_TYPE_INTEGER = "INTEGER";
    public static final String DATA_TYPE_DECIMAL = "DECIMAL";
    public static final String DATA_TYPE_BOOLEAN = "BOOLEAN";
    public static final String DATA_TYPE_DATE = "DATE";
    public static final String DATA_TYPE_DATETIME = "DATETIME";
    public static final String DATA_TYPE_LIST = "LIST";

    public static final String ENTITY_MATERIAL = "MATERIAL";
    public static final String ENTITY_PRODUCT = "PRODUCT";
    public static final String ENTITY_BATCH = "BATCH";
    public static final String ENTITY_EQUIPMENT = "EQUIPMENT";
    public static final String ENTITY_OPERATION = "OPERATION";
    public static final String ENTITY_INVENTORY = "INVENTORY";

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attribute_id")
    private Long attributeId;

    @Column(name = "attribute_code", nullable = false, unique = true)
    private String attributeCode;

    @Column(name = "attribute_name", nullable = false)
    private String attributeName;

    private String description;

    @Column(name = "data_type", nullable = false)
    private String dataType;

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    private String unit;

    @Column(name = "min_value", precision = 15, scale = 4)
    private BigDecimal minValue;

    @Column(name = "max_value", precision = 15, scale = 4)
    private BigDecimal maxValue;

    @Column(name = "allowed_values", columnDefinition = "TEXT")
    private String allowedValues;

    @Column(name = "is_required")
    private Boolean isRequired;

    @Column(name = "is_searchable")
    private Boolean isSearchable;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(nullable = false)
    private String status;

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
        if (status == null) status = STATUS_ACTIVE;
        if (dataType == null) dataType = DATA_TYPE_STRING;
        if (isRequired == null) isRequired = false;
        if (isSearchable == null) isSearchable = true;
        if (displayOrder == null) displayOrder = 1;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
