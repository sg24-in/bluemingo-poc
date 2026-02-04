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
}
