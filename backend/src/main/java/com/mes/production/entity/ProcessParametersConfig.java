package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "process_parameters_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessParametersConfig {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "config_id")
    private Long configId;

    @Column(name = "operation_type", nullable = false, length = 50)
    private String operationType;

    @Column(name = "product_sku", length = 100)
    private String productSku;

    @Column(name = "parameter_name", nullable = false, length = 100)
    private String parameterName;

    @Column(name = "parameter_type", nullable = false, length = 30)
    private String parameterType;

    @Column(length = 20)
    private String unit;

    @Column(name = "min_value", precision = 15, scale = 4)
    private BigDecimal minValue;

    @Column(name = "max_value", precision = 15, scale = 4)
    private BigDecimal maxValue;

    @Column(name = "default_value", precision = 15, scale = 4)
    private BigDecimal defaultValue;

    @Column(name = "is_required")
    private Boolean isRequired;

    @Column(name = "display_order")
    private Integer displayOrder;

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

    @PrePersist
    protected void onCreate() {
        createdOn = LocalDateTime.now();
        if (status == null) {
            status = STATUS_ACTIVE;
        }
        if (parameterType == null) {
            parameterType = "DECIMAL";
        }
        if (displayOrder == null) {
            displayOrder = 1;
        }
        if (isRequired == null) {
            isRequired = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
