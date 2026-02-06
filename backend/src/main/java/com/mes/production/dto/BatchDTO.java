package com.mes.production.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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

    // Per MES Batch Number Specification: Track source operation
    private Long generatedAtOperationId;
    private String createdVia; // PRODUCTION, SPLIT, MERGE, MANUAL, SYSTEM, RECEIPT

    // Supplier/Receipt info for RM batches
    private String supplierBatchNumber;
    private String supplierId;

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
        private String unit;
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
        private String unit;
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

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateBatchRequest {
        @NotBlank(message = "Batch number is required")
        @Size(max = 100, message = "Batch number must not exceed 100 characters")
        private String batchNumber;

        @NotBlank(message = "Material ID is required")
        @Size(max = 100, message = "Material ID must not exceed 100 characters")
        private String materialId;

        @Size(max = 200, message = "Material name must not exceed 200 characters")
        private String materialName;

        @NotNull(message = "Quantity is required")
        private BigDecimal quantity;

        @Size(max = 20, message = "Unit must not exceed 20 characters")
        private String unit;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateBatchRequest {
        @Size(max = 100, message = "Batch number must not exceed 100 characters")
        private String batchNumber;

        @Size(max = 100, message = "Material ID must not exceed 100 characters")
        private String materialId;

        @Size(max = 200, message = "Material name must not exceed 200 characters")
        private String materialName;

        // REMOVED: quantity field - per MES Batch Management Specification
        // Batch quantities must only be changed via adjustQuantity endpoint with mandatory reason
        // private BigDecimal quantity;

        @Size(max = 20, message = "Unit must not exceed 20 characters")
        private String unit;

        private String status;
    }

    /**
     * Request to adjust batch quantity with mandatory reason.
     * Per MES Batch Management Specification: batch quantity is NEVER edited directly.
     * All quantity changes must use this endpoint with proper justification.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdjustQuantityRequest {
        @NotNull(message = "New quantity is required")
        private BigDecimal newQuantity;

        @NotBlank(message = "Adjustment reason is required")
        @Size(min = 10, max = 500, message = "Reason must be between 10 and 500 characters")
        private String reason;

        @NotBlank(message = "Adjustment type is required")
        private String adjustmentType; // CORRECTION, INVENTORY_COUNT, DAMAGE, SCRAP_RECOVERY
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdjustQuantityResponse {
        private Long batchId;
        private String batchNumber;
        private BigDecimal previousQuantity;
        private BigDecimal newQuantity;
        private BigDecimal quantityDifference;
        private String adjustmentType;
        private String reason;
        private String adjustedBy;
        private LocalDateTime adjustedOn;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuantityAdjustmentHistory {
        private Long adjustmentId;
        private BigDecimal oldQuantity;
        private BigDecimal newQuantity;
        private BigDecimal difference;
        private String adjustmentType;
        private String reason;
        private String adjustedBy;
        private LocalDateTime adjustedOn;
    }

    /**
     * P07: Batch number preview response.
     * Shows what the next batch number will be without consuming the sequence.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchNumberPreview {
        private String previewBatchNumber;
        private String operationType;
        private String productSku;
    }
}
