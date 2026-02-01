package com.mes.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchDTO {

    private Long batchId;
    private String batchNumber;
    private String materialId;
    private String materialName;
    private BigDecimal quantity;
    private String unit;
    private String status;
    private LocalDateTime createdOn;

    // For genealogy
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Genealogy {
        private BatchDTO batch;
        private List<ParentBatchInfo> parentBatches;
        private List<ChildBatchInfo> childBatches;
        private ProductionInfo productionInfo;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParentBatchInfo {
        private Long batchId;
        private String batchNumber;
        private String materialName;
        private BigDecimal quantityConsumed;
        private String relationType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChildBatchInfo {
        private Long batchId;
        private String batchNumber;
        private String materialName;
        private BigDecimal quantity;
        private String relationType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductionInfo {
        private Long operationId;
        private String operationName;
        private String processName;
        private String orderId;
        private LocalDateTime productionDate;
    }
}
