package com.mes.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

public class BomDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BomRequirement {
        private Long bomId;
        private String productSku;
        private String materialId;
        private String materialName;
        private BigDecimal quantityRequired;
        private String unit;
        private BigDecimal yieldLossRatio;
        private Integer sequenceLevel;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BomValidationRequest {
        private String productSku;
        private BigDecimal targetQuantity;
        private List<MaterialConsumption> materialsConsumed;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MaterialConsumption {
        private String materialId;
        private BigDecimal quantity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BomValidationResult {
        private boolean valid;
        private String productSku;
        private List<RequirementCheck> requirementChecks;
        private List<String> warnings;
        private List<String> errors;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RequirementCheck {
        private String materialId;
        private String materialName;
        private BigDecimal requiredQuantity;
        private BigDecimal actualQuantity;
        private BigDecimal variancePercent;
        private String status; // MET, WARNING, INSUFFICIENT
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BomTreeResponse {
        private String productSku;
        private List<BomRequirement> requirements;
        private List<Integer> levels;
    }

    /**
     * Suggested consumption for an operation - pre-populated from BOM
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuggestedConsumptionResponse {
        private Long operationId;
        private String operationName;
        private String productSku;
        private BigDecimal targetQuantity;
        private List<SuggestedMaterial> suggestedMaterials;
        private BigDecimal totalRequiredQuantity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuggestedMaterial {
        private String materialId;
        private String materialName;
        private BigDecimal requiredQuantity;
        private String unit;
        private BigDecimal yieldLossRatio;
        private BigDecimal availableQuantity;
        private List<AvailableBatch> availableBatches;
        private boolean sufficientStock;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvailableBatch {
        private Long inventoryId;
        private Long batchId;
        private String batchNumber;
        private BigDecimal availableQuantity;
        private BigDecimal suggestedConsumption;
        private String location;
    }

    // =====================================================
    // BOM Tree CRUD DTOs
    // =====================================================

    /**
     * BOM Tree Node - represents a single node in the BOM tree hierarchy
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BomTreeNode {
        private Long bomId;
        private String productSku;
        private String bomVersion;
        private String materialId;
        private String materialName;
        private BigDecimal quantityRequired;
        private String unit;
        private BigDecimal yieldLossRatio;
        private Integer sequenceLevel;
        private Long parentBomId;
        private String status;
        private List<BomTreeNode> children;
    }

    /**
     * Full BOM Tree Response with root nodes
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BomTreeFullResponse {
        private String productSku;
        private String bomVersion;
        private List<BomTreeNode> tree;
        private int totalNodes;
        private int maxDepth;
    }

    /**
     * Request to create a new BOM node
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateBomNodeRequest {
        private String productSku;
        private String bomVersion;
        private String materialId;
        private String materialName;
        private BigDecimal quantityRequired;
        private String unit;
        private BigDecimal yieldLossRatio;
        private Integer sequenceLevel;
        private Long parentBomId;
    }

    /**
     * Request to create a full BOM tree (multiple nodes at once)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateBomTreeRequest {
        private String productSku;
        private String bomVersion;
        private List<CreateBomNodeRequest> nodes;
    }

    /**
     * Request to update an existing BOM node
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateBomNodeRequest {
        private String materialId;
        private String materialName;
        private BigDecimal quantityRequired;
        private String unit;
        private BigDecimal yieldLossRatio;
        private Integer sequenceLevel;
        private Long parentBomId;
        private String status;
    }

    /**
     * Request to move a BOM node to a new parent
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MoveBomNodeRequest {
        private Long newParentBomId;
        private Integer newSequenceLevel;
    }

    /**
     * BOM List Response for paginated listing
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BomListResponse {
        private Long bomId;
        private String productSku;
        private String bomVersion;
        private String materialId;
        private String materialName;
        private BigDecimal quantityRequired;
        private String unit;
        private Integer sequenceLevel;
        private Long parentBomId;
        private String status;
        private int childCount;
    }

    /**
     * Summary of all BOMs grouped by product
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BomProductSummary {
        private String productSku;
        private String bomVersion;
        private int totalNodes;
        private int maxLevel;
        private String status;
    }

    /**
     * Request to update top-level BOM settings (product, version, status) for all nodes
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateBomSettingsRequest {
        private String newProductSku;  // Optional: change the product SKU
        private String bomVersion;
        private String status;
    }

    /**
     * Response after updating BOM settings
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateBomSettingsResponse {
        private String productSku;
        private String bomVersion;
        private String status;
        private int nodesUpdated;
    }
}
