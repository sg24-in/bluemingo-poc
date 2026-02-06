package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "process_parameter_values")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessParameterValue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "value_id")
    private Long valueId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmation_id", nullable = false)
    private ProductionConfirmation confirmation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "config_id")
    private ProcessParametersConfig config;

    @Column(name = "parameter_name", nullable = false)
    private String parameterName;

    @Column(name = "parameter_value", precision = 15, scale = 4)
    private BigDecimal parameterValue;

    @Column(name = "string_value", length = 500)
    private String stringValue;

    private String unit;

    @Column(name = "min_limit", precision = 15, scale = 4)
    private BigDecimal minLimit;

    @Column(name = "max_limit", precision = 15, scale = 4)
    private BigDecimal maxLimit;

    @Column(name = "is_within_spec")
    private Boolean isWithinSpec;

    @Column(name = "deviation_reason", length = 500)
    private String deviationReason;

    @Column(name = "recorded_by")
    private String recordedBy;

    @Column(name = "recorded_on")
    private LocalDateTime recordedOn;

    @Column(name = "created_on")
    private LocalDateTime createdOn;

    @Column(name = "created_by")
    private String createdBy;

    @PrePersist
    protected void onCreate() {
        createdOn = LocalDateTime.now();
        recordedOn = LocalDateTime.now();
        if (isWithinSpec == null) isWithinSpec = true;
    }
}
