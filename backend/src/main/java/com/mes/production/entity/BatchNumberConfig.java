package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "batch_number_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchNumberConfig {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "config_id")
    private Long configId;

    @Column(name = "config_name", nullable = false, unique = true, length = 100)
    private String configName;

    @Column(name = "operation_type", length = 50)
    private String operationType;

    @Column(name = "product_sku", length = 100)
    private String productSku;

    @Column(nullable = false, length = 50)
    private String prefix;

    @Column(name = "include_operation_code")
    private Boolean includeOperationCode;

    @Column(name = "operation_code_length")
    private Integer operationCodeLength;

    @Column(nullable = false, length = 5)
    private String separator;

    @Column(name = "date_format", length = 20)
    private String dateFormat;

    @Column(name = "include_date")
    private Boolean includeDate;

    @Column(name = "sequence_length", nullable = false)
    private Integer sequenceLength;

    @Column(name = "sequence_reset", length = 20)
    private String sequenceReset;

    @Column
    private Integer priority;

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
        if (prefix == null) {
            prefix = "BATCH";
        }
        if (separator == null) {
            separator = "-";
        }
        if (sequenceLength == null) {
            sequenceLength = 3;
        }
        if (priority == null) {
            priority = 100;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }
}
