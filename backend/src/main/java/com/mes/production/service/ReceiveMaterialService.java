package com.mes.production.service;

import com.mes.production.dto.InventoryDTO;
import com.mes.production.entity.Batch;
import com.mes.production.entity.Inventory;
import com.mes.production.entity.InventoryMovement;
import com.mes.production.repository.BatchRepository;
import com.mes.production.repository.InventoryMovementRepository;
import com.mes.production.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

/**
 * Service for receiving raw materials into inventory.
 * Creates Batch + Inventory + InventoryMovement in a single transaction.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReceiveMaterialService {

    private static final String DEFAULT_WEIGHT_UNIT = "KG";

    private final BatchRepository batchRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryMovementRepository movementRepository;
    private final AuditService auditService;
    private final BatchNumberService batchNumberService;
    private final UnitConversionService unitConversionService;

    /**
     * Receive raw material into inventory.
     *
     * Flow:
     * 1. Generate RM batch number
     * 2. Create Batch (status = QUALITY_PENDING)
     * 3. Create Inventory (state = AVAILABLE after approval, initially tied to batch status)
     * 4. Create InventoryMovement (type = RECEIVE)
     * 5. Audit log
     *
     * @param request Material receipt details
     * @return Response with created batch and inventory IDs
     */
    @Transactional
    public InventoryDTO.ReceiveMaterialResponse receiveMaterial(InventoryDTO.ReceiveMaterialRequest request) {
        log.info("Receiving material: {} qty={}", request.getMaterialId(), request.getQuantity());

        String currentUser = getCurrentUser();
        LocalDate receivedDate = request.getReceivedDate() != null
                ? request.getReceivedDate()
                : LocalDate.now();

        // Validate and normalize unit from system configuration
        String unit = validateAndNormalizeUnit(request.getUnit());
        log.info("Using unit: {}", unit);

        // 1. Generate RM batch number using BatchNumberService
        // Per MES Batch Number Specification: Use configurable generation with optional supplier lot
        String batchNumber = batchNumberService.generateRmBatchNumber(
                request.getMaterialId(),
                receivedDate,
                request.getSupplierBatchNumber()
        );
        log.info("Generated batch number: {}", batchNumber);

        // 2. Create Batch (QUALITY_PENDING per MES spec)
        Batch batch = Batch.builder()
                .batchNumber(batchNumber)
                .materialId(request.getMaterialId())
                .materialName(request.getMaterialName())
                .quantity(request.getQuantity())
                .unit(unit)
                .status(Batch.STATUS_QUALITY_PENDING)
                .createdVia(Batch.CREATED_VIA_RECEIPT)
                .supplierBatchNumber(request.getSupplierBatchNumber())
                .supplierId(request.getSupplierId())
                .receivedDate(receivedDate)
                .receiptNotes(request.getNotes())
                .createdBy(currentUser)
                .build();

        batch = batchRepository.save(batch);
        log.info("Created batch: {} with ID {}", batchNumber, batch.getBatchId());

        // 3. Create Inventory record
        // State is AVAILABLE but batch is QUALITY_PENDING
        // Consumption will check batch status
        Inventory inventory = Inventory.builder()
                .materialId(request.getMaterialId())
                .materialName(request.getMaterialName())
                .inventoryType("RM")  // Raw Material
                .state(Inventory.STATE_AVAILABLE)
                .quantity(request.getQuantity())
                .unit(unit)
                .batch(batch)
                .location(request.getLocation())
                .createdBy(currentUser)
                .build();

        inventory = inventoryRepository.save(inventory);
        log.info("Created inventory: {} with ID {}", request.getMaterialId(), inventory.getInventoryId());

        // 4. Create InventoryMovement (RECEIVE)
        InventoryMovement movement = InventoryMovement.builder()
                .inventory(inventory)
                .movementType("RECEIVE")
                .quantity(request.getQuantity())
                .reason("Goods receipt: " + (request.getNotes() != null ? request.getNotes() : "RM entry"))
                .status(InventoryMovement.STATUS_EXECUTED)
                .createdBy(currentUser)
                .build();

        movementRepository.save(movement);
        log.info("Created inventory movement: RECEIVE for qty {}", request.getQuantity());

        // 5. Audit log
        auditService.logCreate("BATCH", batch.getBatchId(),
                String.format("RM Receipt: %s, Material: %s, Qty: %s %s, Supplier: %s",
                        batchNumber, request.getMaterialId(), request.getQuantity(),
                        request.getUnit(), request.getSupplierId()));

        // Audit: Log batch number generation per MES Batch Number Specification
        String configContext = request.getSupplierBatchNumber() != null
                ? "RM with supplier lot: " + request.getSupplierBatchNumber()
                : "RM internal";
        auditService.logBatchNumberGenerated(
                batch.getBatchId(),
                batchNumber,
                null, // RM receipt has no source operation
                configContext,
                Batch.CREATED_VIA_RECEIPT
        );

        auditService.logCreate("INVENTORY", inventory.getInventoryId(),
                String.format("RM Inventory created for batch %s", batchNumber));

        return InventoryDTO.ReceiveMaterialResponse.builder()
                .batchId(batch.getBatchId())
                .batchNumber(batchNumber)
                .inventoryId(inventory.getInventoryId())
                .batchStatus(batch.getStatus())
                .inventoryState(inventory.getState())
                .quantity(request.getQuantity())
                .unit(batch.getUnit())
                .message("Raw material received successfully. Batch pending quality approval.")
                .build();
    }

    /**
     * Validate and normalize unit code against system-defined units.
     * Falls back to default weight unit (KG) if not specified or invalid.
     */
    private String validateAndNormalizeUnit(String unit) {
        if (unit == null || unit.trim().isEmpty()) {
            log.info("No unit specified, using default: {}", DEFAULT_WEIGHT_UNIT);
            return DEFAULT_WEIGHT_UNIT;
        }

        String normalizedUnit = unit.trim().toUpperCase();

        // Check if unit exists in system
        Optional<Map<String, Object>> unitInfo = unitConversionService.getUnit(normalizedUnit);
        if (unitInfo.isPresent()) {
            return normalizedUnit;
        }

        // Try common aliases
        String aliasedUnit = switch (normalizedUnit) {
            case "T", "TON", "MT" -> "TONS";
            case "KILOGRAM", "KILO" -> "KG";
            case "PIECE", "PC" -> "PCS";
            case "METER" -> "M";
            case "LITER", "LTR" -> "L";
            default -> null;
        };

        if (aliasedUnit != null && unitConversionService.getUnit(aliasedUnit).isPresent()) {
            log.info("Normalized unit {} to {}", unit, aliasedUnit);
            return aliasedUnit;
        }

        // Invalid unit - log warning and use default
        log.warn("Invalid unit '{}', using default: {}", unit, DEFAULT_WEIGHT_UNIT);
        return DEFAULT_WEIGHT_UNIT;
    }

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
    }
}
