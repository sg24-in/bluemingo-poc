package com.mes.production.dto;

import com.mes.production.entity.BatchNumberConfig;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchNumberConfigDTO {

    private Long configId;

    @NotBlank(message = "Config name is required")
    @Size(max = 100, message = "Config name must not exceed 100 characters")
    private String configName;

    @Size(max = 50, message = "Operation type must not exceed 50 characters")
    private String operationType;

    @Size(max = 100, message = "Product SKU must not exceed 100 characters")
    private String productSku;

    private String prefix;
    private Boolean includeOperationCode;
    private Integer operationCodeLength;
    private String separator;
    private String dateFormat;
    private Boolean includeDate;
    private Integer sequenceLength;
    private String sequenceReset;
    private Integer priority;
    private String status;

    private LocalDateTime createdOn;
    private String createdBy;
    private LocalDateTime updatedOn;
    private String updatedBy;

    public static BatchNumberConfigDTO fromEntity(BatchNumberConfig entity) {
        if (entity == null) return null;

        return BatchNumberConfigDTO.builder()
                .configId(entity.getConfigId())
                .configName(entity.getConfigName())
                .operationType(entity.getOperationType())
                .productSku(entity.getProductSku())
                .prefix(entity.getPrefix())
                .includeOperationCode(entity.getIncludeOperationCode())
                .operationCodeLength(entity.getOperationCodeLength())
                .separator(entity.getSeparator())
                .dateFormat(entity.getDateFormat())
                .includeDate(entity.getIncludeDate())
                .sequenceLength(entity.getSequenceLength())
                .sequenceReset(entity.getSequenceReset())
                .priority(entity.getPriority())
                .status(entity.getStatus())
                .createdOn(entity.getCreatedOn())
                .createdBy(entity.getCreatedBy())
                .updatedOn(entity.getUpdatedOn())
                .updatedBy(entity.getUpdatedBy())
                .build();
    }

    public BatchNumberConfig toEntity() {
        return BatchNumberConfig.builder()
                .configId(this.configId)
                .configName(this.configName)
                .operationType(this.operationType)
                .productSku(this.productSku)
                .prefix(this.prefix)
                .includeOperationCode(this.includeOperationCode)
                .operationCodeLength(this.operationCodeLength)
                .separator(this.separator)
                .dateFormat(this.dateFormat)
                .includeDate(this.includeDate)
                .sequenceLength(this.sequenceLength)
                .sequenceReset(this.sequenceReset)
                .priority(this.priority)
                .status(this.status)
                .build();
    }
}
