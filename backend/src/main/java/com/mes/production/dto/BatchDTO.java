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

    // Approval info
    private String approvedBy;
    private LocalDateTime approvedOn;
    private String rejectionReason;
    private String rejectedBy;
    private LocalDateTime rejectedOn;

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

    // Split request - split one batch into multiple
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SplitRequest {
        private Long sourceBatchId;
        private List<SplitPortion> portions;
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SplitPortion {
        private BigDecimal quantity;
        private String batchNumberSuffix; // Optional, e.g., "A", "B"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SplitResponse {
        private Long sourceBatchId;
        private String sourceBatchNumber;
        private BigDecimal originalQuantity;
        private BigDecimal remainingQuantity;
        private List<BatchDTO> newBatches;
        private String status;
    }

    // Merge request - merge multiple batches into one
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MergeRequest {
        private List<Long> sourceBatchIds;
        private String targetBatchNumber; // Optional, auto-generated if not provided
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MergeResponse {
        private List<BatchDTO> sourceBatches;
        private BatchDTO mergedBatch;
        private BigDecimal totalQuantity;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateResponse {
        private Long batchId;
        private String batchNumber;
        private String previousStatus;
        private String newStatus;
        private String message;
        private String updatedBy;
        private LocalDateTime updatedOn;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApprovalRequest {
        private Long batchId;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RejectionRequest {
        private Long batchId;
        private String reason;
    }
}
