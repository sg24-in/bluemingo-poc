package com.mes.production.service;

import com.mes.production.dto.BomDTO;
import com.mes.production.entity.BillOfMaterial;
import com.mes.production.entity.Inventory;
import com.mes.production.entity.Operation;
import com.mes.production.repository.BomRepository;
import com.mes.production.repository.InventoryRepository;
import com.mes.production.repository.OperationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BomValidationService {

    private final BomRepository bomRepository;
    private final OperationRepository operationRepository;
    private final InventoryRepository inventoryRepository;

    private static final BigDecimal VARIANCE_WARNING_THRESHOLD = new BigDecimal("5.0"); // 5%

    /**
     * Get BOM requirements for a product
     */
    @Transactional(readOnly = true)
    public BomDTO.BomTreeResponse getBomRequirements(String productSku) {
        List<BillOfMaterial> bomList = bomRepository.findActiveByProductSkuOrderByLevel(productSku);
        List<Integer> levels = bomRepository.findDistinctLevelsByProductSku(productSku);

        List<BomDTO.BomRequirement> requirements = bomList.stream()
                .map(this::convertToRequirement)
                .collect(Collectors.toList());

        return BomDTO.BomTreeResponse.builder()
                .productSku(productSku)
                .requirements(requirements)
                .levels(levels)
                .build();
    }

    /**
     * Get BOM requirements for a specific level (e.g., for an operation at that level)
     */
    @Transactional(readOnly = true)
    public List<BomDTO.BomRequirement> getBomRequirementsForLevel(String productSku, Integer level) {
        List<BillOfMaterial> bomList = bomRepository.findByProductSkuAndSequenceLevel(productSku, level);

        return bomList.stream()
                .map(this::convertToRequirement)
                .collect(Collectors.toList());
    }

    /**
     * Validate material consumption against BOM requirements
     */
    @Transactional(readOnly = true)
    public BomDTO.BomValidationResult validateConsumption(BomDTO.BomValidationRequest request) {
        log.info("Validating BOM consumption for product: {}", request.getProductSku());

        List<BillOfMaterial> bomList = bomRepository.findActiveByProductSkuOrderByLevel(request.getProductSku());

        if (bomList.isEmpty()) {
            return BomDTO.BomValidationResult.builder()
                    .valid(true)
                    .productSku(request.getProductSku())
                    .requirementChecks(List.of())
                    .warnings(List.of("No BOM found for product: " + request.getProductSku()))
                    .errors(List.of())
                    .build();
        }

        // Group consumed materials by materialId
        Map<String, BigDecimal> consumedByMaterial = request.getMaterialsConsumed().stream()
                .collect(Collectors.groupingBy(
                        BomDTO.MaterialConsumption::getMaterialId,
                        Collectors.reducing(BigDecimal.ZERO, BomDTO.MaterialConsumption::getQuantity, BigDecimal::add)
                ));

        List<BomDTO.RequirementCheck> checks = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        boolean isValid = true;

        // Check each BOM requirement
        for (BillOfMaterial bom : bomList) {
            BigDecimal required = bom.getQuantityRequired();

            // Adjust for target quantity if provided
            if (request.getTargetQuantity() != null && request.getTargetQuantity().compareTo(BigDecimal.ZERO) > 0) {
                // Scale required quantity based on yield loss ratio: required * targetQty * yieldRatio
                BigDecimal yieldRatio = bom.getYieldLossRatio() != null ? bom.getYieldLossRatio() : BigDecimal.ONE;
                required = required.multiply(request.getTargetQuantity()).multiply(yieldRatio);
            }

            BigDecimal actual = consumedByMaterial.getOrDefault(bom.getMaterialId(), BigDecimal.ZERO);

            // Calculate variance percentage
            BigDecimal variance = BigDecimal.ZERO;
            String status = "MET";

            if (required.compareTo(BigDecimal.ZERO) > 0) {
                variance = actual.subtract(required)
                        .divide(required, 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"));

                if (actual.compareTo(required) < 0) {
                    // Insufficient material
                    status = "INSUFFICIENT";
                    isValid = false;
                    errors.add(String.format("Insufficient %s: required %.2f, provided %.2f",
                            bom.getMaterialName(), required, actual));
                } else if (variance.abs().compareTo(VARIANCE_WARNING_THRESHOLD) > 0) {
                    // Variance exceeds threshold
                    status = "WARNING";
                    warnings.add(String.format("Variance for %s exceeds 5%%: %.2f%%",
                            bom.getMaterialName(), variance));
                }
            }

            checks.add(BomDTO.RequirementCheck.builder()
                    .materialId(bom.getMaterialId())
                    .materialName(bom.getMaterialName())
                    .requiredQuantity(required)
                    .actualQuantity(actual)
                    .variancePercent(variance)
                    .status(status)
                    .build());
        }

        return BomDTO.BomValidationResult.builder()
                .valid(isValid)
                .productSku(request.getProductSku())
                .requirementChecks(checks)
                .warnings(warnings)
                .errors(errors)
                .build();
    }

    /**
     * Get suggested material consumption for an operation based on BOM
     * This pre-populates quantities and shows available batches
     */
    @Transactional(readOnly = true)
    public BomDTO.SuggestedConsumptionResponse getSuggestedConsumption(Long operationId) {
        log.info("Getting suggested consumption for operation: {}", operationId);

        Operation operation = operationRepository.findByIdWithDetails(operationId)
                .orElseThrow(() -> new RuntimeException("Operation not found: " + operationId));

        String productSku = operation.getProcess().getOrderLineItem().getProductSku();
        BigDecimal targetQty = operation.getTargetQty() != null ? operation.getTargetQty() :
                operation.getProcess().getOrderLineItem().getQuantity();

        // Get BOM requirements for the product at the operation's process level
        Integer processLevel = operation.getProcess().getStageSequence();
        List<BillOfMaterial> bomList = bomRepository.findByProductSkuAndSequenceLevel(productSku, processLevel);

        // If no level-specific BOM, get all active BOM entries
        if (bomList.isEmpty()) {
            bomList = bomRepository.findActiveByProductSkuOrderByLevel(productSku);
        }

        List<BomDTO.SuggestedMaterial> suggestedMaterials = new ArrayList<>();
        BigDecimal totalRequired = BigDecimal.ZERO;

        for (BillOfMaterial bom : bomList) {
            BigDecimal yieldRatio = bom.getYieldLossRatio() != null ? bom.getYieldLossRatio() : BigDecimal.ONE;
            BigDecimal requiredQty = bom.getQuantityRequired().multiply(targetQty).multiply(yieldRatio)
                    .setScale(4, RoundingMode.HALF_UP);

            totalRequired = totalRequired.add(requiredQty);

            // Get available inventory for this material
            List<Inventory> availableInventory = inventoryRepository.findAvailableByMaterialId(bom.getMaterialId());

            BigDecimal totalAvailable = availableInventory.stream()
                    .map(Inventory::getQuantity)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Create available batches list with suggested consumption
            List<BomDTO.AvailableBatch> availableBatches = new ArrayList<>();
            BigDecimal remainingRequired = requiredQty;

            for (Inventory inv : availableInventory) {
                BigDecimal suggestedConsumption = BigDecimal.ZERO;
                if (remainingRequired.compareTo(BigDecimal.ZERO) > 0) {
                    suggestedConsumption = inv.getQuantity().min(remainingRequired);
                    remainingRequired = remainingRequired.subtract(suggestedConsumption);
                }

                availableBatches.add(BomDTO.AvailableBatch.builder()
                        .inventoryId(inv.getInventoryId())
                        .batchId(inv.getBatch() != null ? inv.getBatch().getBatchId() : null)
                        .batchNumber(inv.getBatch() != null ? inv.getBatch().getBatchNumber() : null)
                        .availableQuantity(inv.getQuantity())
                        .suggestedConsumption(suggestedConsumption)
                        .location(inv.getLocation())
                        .build());
            }

            suggestedMaterials.add(BomDTO.SuggestedMaterial.builder()
                    .materialId(bom.getMaterialId())
                    .materialName(bom.getMaterialName())
                    .requiredQuantity(requiredQty)
                    .unit(bom.getUnit())
                    .yieldLossRatio(yieldRatio)
                    .availableQuantity(totalAvailable)
                    .availableBatches(availableBatches)
                    .sufficientStock(totalAvailable.compareTo(requiredQty) >= 0)
                    .build());
        }

        return BomDTO.SuggestedConsumptionResponse.builder()
                .operationId(operationId)
                .operationName(operation.getOperationName())
                .productSku(productSku)
                .targetQuantity(targetQty)
                .suggestedMaterials(suggestedMaterials)
                .totalRequiredQuantity(totalRequired)
                .build();
    }

    private BomDTO.BomRequirement convertToRequirement(BillOfMaterial bom) {
        return BomDTO.BomRequirement.builder()
                .bomId(bom.getBomId())
                .productSku(bom.getProductSku())
                .materialId(bom.getMaterialId())
                .materialName(bom.getMaterialName())
                .quantityRequired(bom.getQuantityRequired())
                .unit(bom.getUnit())
                .yieldLossRatio(bom.getYieldLossRatio())
                .sequenceLevel(bom.getSequenceLevel())
                .build();
    }
}
