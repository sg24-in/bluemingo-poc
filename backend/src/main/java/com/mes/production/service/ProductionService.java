package com.mes.production.service;

import com.mes.production.dto.ProductionConfirmationDTO;
import com.mes.production.entity.*;
import com.mes.production.repository.*;
import com.mes.production.repository.HoldRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductionService {

    private final OperationRepository operationRepository;
    private final ProcessRepository processRepository;
    private final InventoryRepository inventoryRepository;
    private final BatchRepository batchRepository;
    private final BatchRelationRepository batchRelationRepository;
    private final ProductionConfirmationRepository confirmationRepository;
    private final EquipmentRepository equipmentRepository;
    private final OperatorRepository operatorRepository;
    private final HoldRecordRepository holdRecordRepository;
    private final AuditService auditService;
    private final EquipmentUsageService equipmentUsageService;
    private final InventoryMovementService inventoryMovementService;
    private final ProcessParameterService processParameterService;
    private final BatchNumberService batchNumberService;
    private final InventoryStateValidator inventoryStateValidator;
    private final BatchSizeService batchSizeService;

    /**
     * Confirm production for an operation
     */
    @Transactional
    public ProductionConfirmationDTO.Response confirmProduction(ProductionConfirmationDTO.Request request) {
        log.info("Processing production confirmation for operation: {}", request.getOperationId());

        String currentUser = getCurrentUser();

        // 1. Get and validate operation
        Operation operation = operationRepository.findByIdWithDetails(request.getOperationId())
                .orElseThrow(() -> new RuntimeException("Operation not found: " + request.getOperationId()));

        if (!"READY".equals(operation.getStatus()) && !"IN_PROGRESS".equals(operation.getStatus())) {
            throw new RuntimeException("Operation is not in READY or IN_PROGRESS status");
        }

        // Check if operation is on hold
        if (holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("OPERATION", operation.getOperationId(), "ACTIVE")) {
            throw new RuntimeException("Operation is on hold and cannot be confirmed");
        }

        // Check if process is on hold
        com.mes.production.entity.Process process = operation.getProcess();
        if (holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("PROCESS", process.getProcessId(), "ACTIVE")) {
            throw new RuntimeException("Process is on hold and cannot be confirmed");
        }

        // Validate process status - only ACTIVE processes can be used for production confirmation
        if (process.getStatus() != ProcessStatus.ACTIVE) {
            throw new RuntimeException(
                    "Cannot confirm production: Process " + process.getProcessId() +
                    " status is " + process.getStatus() + ", must be ACTIVE");
        }

        // 2. Validate process parameters against configured min/max values
        if (request.getProcessParameters() != null && !request.getProcessParameters().isEmpty()) {
            String operationType = operation.getOperationType();
            // Per MES Consolidated Specification: Operation has OrderLineItem (runtime ref)
            String productSku = operation.getOrderLineItem() != null ?
                    operation.getOrderLineItem().getProductSku() : null;

            ProcessParameterService.ValidationResult paramValidation =
                    processParameterService.validateParameters(operationType, productSku, request.getProcessParameters());

            if (!paramValidation.isValid()) {
                String errors = String.join("; ", paramValidation.getErrors());
                throw new RuntimeException("Process parameter validation failed: " + errors);
            }

            // Log warnings but continue
            for (String warning : paramValidation.getWarnings()) {
                log.warn("Process parameter warning: {}", warning);
            }
        }

        // 3. Process material consumption
        Map<String, Object> rmConsumed = new HashMap<>();
        List<ProductionConfirmationDTO.MaterialConsumedInfo> materialsConsumedInfo = new java.util.ArrayList<>();
        BigDecimal totalConsumed = BigDecimal.ZERO;

        for (ProductionConfirmationDTO.MaterialConsumption consumption : request.getMaterialsConsumed()) {
            // Get inventory and batch
            Inventory inventory = inventoryRepository.findById(consumption.getInventoryId())
                    .orElseThrow(() -> new RuntimeException("Inventory not found: " + consumption.getInventoryId()));

            // Use centralized state validator to check consumption is allowed
            // This validates: state is AVAILABLE or RESERVED (for this order), no active holds on inventory/batch
            // Per MES Consolidated Specification: Operation has OrderLineItem (runtime ref)
            Long orderId = operation.getOrderLineItem() != null && operation.getOrderLineItem().getOrder() != null
                    ? operation.getOrderLineItem().getOrder().getOrderId()
                    : null;
            inventoryStateValidator.validateConsumption(inventory, orderId);

            // Validate quantity
            if (consumption.getQuantity().compareTo(inventory.getQuantity()) > 0) {
                throw new RuntimeException("Consumption quantity exceeds available quantity for inventory: " + consumption.getInventoryId());
            }

            // Update inventory state to CONSUMED
            String oldState = inventory.getState();
            inventory.setState("CONSUMED");
            inventory.setUpdatedBy(currentUser);
            inventoryRepository.save(inventory);

            // Audit: Log inventory consumption
            auditService.logStatusChange("INVENTORY", inventory.getInventoryId(), oldState, "CONSUMED");

            // Record inventory movement
            inventoryMovementService.recordConsume(
                    inventory.getInventoryId(),
                    request.getOperationId(),
                    consumption.getQuantity(),
                    "Production confirmation");

            // Update batch status if fully consumed
            Batch batch = inventory.getBatch();
            if (batch != null) {
                String oldBatchStatus = batch.getStatus();
                batch.setStatus("CONSUMED");
                batch.setUpdatedBy(currentUser);
                batchRepository.save(batch);

                // Audit: Log batch status change
                auditService.logStatusChange("BATCH", batch.getBatchId(), oldBatchStatus, "CONSUMED");
            }

            // Record consumption
            rmConsumed.put(consumption.getBatchId().toString(), Map.of(
                    "inventoryId", consumption.getInventoryId(),
                    "quantity", consumption.getQuantity(),
                    "materialId", inventory.getMaterialId()
            ));

            // Build consumed info for response
            materialsConsumedInfo.add(ProductionConfirmationDTO.MaterialConsumedInfo.builder()
                    .batchId(consumption.getBatchId())
                    .batchNumber(batch != null ? batch.getBatchNumber() : null)
                    .inventoryId(consumption.getInventoryId())
                    .materialId(inventory.getMaterialId())
                    .quantityConsumed(consumption.getQuantity())
                    .build());

            totalConsumed = totalConsumed.add(consumption.getQuantity());
            log.info("Consumed {} from batch {}", consumption.getQuantity(), consumption.getBatchId());
        }

        // 3. Calculate batch splits using BatchSizeService (B13: Multi-batch support)
        String operationType = operation.getOperationType();
        String productSku = operation.getOrderLineItem() != null ?
                operation.getOrderLineItem().getProductSku() : null;
        String equipmentType = null; // Could be enhanced to get from request.getEquipmentIds()

        BatchSizeService.BatchSizeResult batchSizeResult = batchSizeService.calculateBatchSizes(
                request.getProducedQty(),
                operationType,
                null, // materialId - not used for output
                productSku,
                equipmentType);

        log.info("Batch size calculation: {} batches for {} qty",
                batchSizeResult.batchCount(), request.getProducedQty());

        // 4. Generate output batches (may be multiple if quantity exceeds max batch size)
        List<Batch> outputBatches = new java.util.ArrayList<>();
        List<Inventory> outputInventories = new java.util.ArrayList<>();

        for (int i = 0; i < batchSizeResult.batchSizes().size(); i++) {
            BigDecimal batchQty = batchSizeResult.batchSizes().get(i);
            Batch outputBatch = generateOutputBatch(operation, batchQty, currentUser, i + 1, batchSizeResult.batchCount());
            outputBatches.add(outputBatch);

            // Create inventory for each batch
            Inventory outputInventory = createOutputInventory(operation, outputBatch, batchQty, currentUser);
            outputInventories.add(outputInventory);
        }

        // Primary output batch (first one, for backward compatibility)
        Batch primaryOutputBatch = outputBatches.get(0);

        // 5. Create batch relations (link all output batches to consumed inputs)
        for (Batch outputBatch : outputBatches) {
            createBatchRelations(request.getMaterialsConsumed(), outputBatch, operation.getOperationId(), currentUser);
        }

        // 6. Determine confirmation status (partial vs full)
        BigDecimal targetQty = operation.getTargetQty();
        BigDecimal previousConfirmedQty = operation.getConfirmedQty() != null ? operation.getConfirmedQty() : BigDecimal.ZERO;
        BigDecimal newConfirmedQty = previousConfirmedQty.add(request.getProducedQty());

        // Determine if this is a partial or full confirmation
        // P10-P11: Respect explicit saveAsPartial flag
        String confirmationStatus;
        if (Boolean.TRUE.equals(request.getSaveAsPartial())) {
            // User explicitly requested to save as partial
            confirmationStatus = ProductionConfirmation.STATUS_PARTIALLY_CONFIRMED;
            log.info("Explicit partial confirmation (saveAsPartial=true): {} units", request.getProducedQty());
        } else if (targetQty != null && newConfirmedQty.compareTo(targetQty) < 0) {
            confirmationStatus = ProductionConfirmation.STATUS_PARTIALLY_CONFIRMED;
            log.info("Partial confirmation: {}/{} units", newConfirmedQty, targetQty);
        } else {
            confirmationStatus = ProductionConfirmation.STATUS_CONFIRMED;
            log.info("Full confirmation: {} units", newConfirmedQty);
        }

        // Update operation's confirmed quantity
        operation.setConfirmedQty(newConfirmedQty);

        // 6. Create production confirmation record
        // Fetch equipment and operator entities
        Set<Equipment> equipmentSet = request.getEquipmentIds() != null ?
                new HashSet<>(equipmentRepository.findAllById(request.getEquipmentIds())) : new HashSet<>();
        Set<Operator> operatorSet = request.getOperatorIds() != null ?
                new HashSet<>(operatorRepository.findAllById(request.getOperatorIds())) : new HashSet<>();

        ProductionConfirmation confirmation = ProductionConfirmation.builder()
                .operation(operation)
                .producedQty(request.getProducedQty())
                .scrapQty(request.getScrapQty() != null ? request.getScrapQty() : BigDecimal.ZERO)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .delayMinutes(request.getDelayMinutes())
                .delayReason(request.getDelayReason())
                .processParametersJson(request.getProcessParameters() != null ? request.getProcessParameters().toString() : null)
                .rmConsumedJson(rmConsumed.toString())
                .equipment(equipmentSet)
                .operators(operatorSet)
                .notes(request.getNotes())
                .status(confirmationStatus)
                .createdBy(currentUser)
                .build();

        confirmation = confirmationRepository.save(confirmation);
        log.info("Production confirmation created: {} with status: {}", confirmation.getConfirmationId(), confirmationStatus);

        // Audit: Log production confirmation creation
        auditService.logCreate("PRODUCTION_CONFIRMATION", confirmation.getConfirmationId(),
                String.format("Produced: %s, Operation: %s", request.getProducedQty(), operation.getOperationName()));

        // Log equipment usage
        equipmentUsageService.logEquipmentUsagesForConfirmation(
                operation.getOperationId(),
                request.getEquipmentIds(),
                request.getOperatorIds(),
                request.getStartTime(),
                request.getEndTime());

        // Record inventory movement for all produced outputs
        for (Inventory outputInventory : outputInventories) {
            inventoryMovementService.recordProduce(
                    outputInventory.getInventoryId(),
                    operation.getOperationId(),
                    outputInventory.getQuantity(),
                    "Production confirmation output" + (outputBatches.size() > 1 ?
                            " (batch " + (outputInventories.indexOf(outputInventory) + 1) + " of " + outputBatches.size() + ")" : ""));
        }

        // 7. Update operation status based on confirmation type
        String oldOperationStatus = operation.getStatus();
        String newOperationStatus;
        ProductionConfirmationDTO.NextOperationInfo nextOpInfo = null;

        if (ProductionConfirmation.STATUS_PARTIALLY_CONFIRMED.equals(confirmationStatus)) {
            // Partial confirmation - keep operation in IN_PROGRESS
            newOperationStatus = "IN_PROGRESS";
            operation.setStatus(newOperationStatus);
            operation.setUpdatedBy(currentUser);
            operationRepository.save(operation);

            if (!oldOperationStatus.equals(newOperationStatus)) {
                auditService.logStatusChange("OPERATION", operation.getOperationId(), oldOperationStatus, newOperationStatus);
            }
            log.info("Operation remains IN_PROGRESS due to partial confirmation");
        } else {
            // Full confirmation - mark operation as CONFIRMED
            newOperationStatus = "CONFIRMED";
            operation.setStatus(newOperationStatus);
            operation.setUpdatedBy(currentUser);
            operationRepository.save(operation);

            // Audit: Log operation status change
            auditService.logStatusChange("OPERATION", operation.getOperationId(), oldOperationStatus, newOperationStatus);

            // 8. Set next operation to READY (only for full confirmations)
            nextOpInfo = setNextOperationReady(operation, currentUser);
        }

        // 9. Get equipment and operator details
        List<ProductionConfirmationDTO.EquipmentInfo> equipmentInfo = request.getEquipmentIds() != null ?
                equipmentRepository.findAllById(request.getEquipmentIds()).stream()
                        .map(eq -> ProductionConfirmationDTO.EquipmentInfo.builder()
                                .equipmentId(eq.getEquipmentId())
                                .equipmentCode(eq.getEquipmentCode())
                                .name(eq.getName())
                                .build())
                        .collect(Collectors.toList()) : List.of();

        List<ProductionConfirmationDTO.OperatorInfo> operatorInfo = request.getOperatorIds() != null ?
                operatorRepository.findAllById(request.getOperatorIds()).stream()
                        .map(op -> ProductionConfirmationDTO.OperatorInfo.builder()
                                .operatorId(op.getOperatorId())
                                .operatorCode(op.getOperatorCode())
                                .name(op.getName())
                                .build())
                        .collect(Collectors.toList()) : List.of();

        // 10. Build response with multi-batch support
        List<ProductionConfirmationDTO.BatchInfo> outputBatchInfos = outputBatches.stream()
                .map(batch -> ProductionConfirmationDTO.BatchInfo.builder()
                        .batchId(batch.getBatchId())
                        .batchNumber(batch.getBatchNumber())
                        .materialId(batch.getMaterialId())
                        .materialName(batch.getMaterialName())
                        .quantity(batch.getQuantity())
                        .unit(batch.getUnit())
                        .build())
                .collect(Collectors.toList());

        // P12: Calculate remaining quantity for partial confirmations
        boolean isPartialConfirmation = ProductionConfirmation.STATUS_PARTIALLY_CONFIRMED.equals(confirmationStatus);
        BigDecimal remainingQty = null;
        if (isPartialConfirmation && targetQty != null) {
            remainingQty = targetQty.subtract(newConfirmedQty);
        }

        return ProductionConfirmationDTO.Response.builder()
                .confirmationId(confirmation.getConfirmationId())
                .operationId(operation.getOperationId())
                .operationName(operation.getOperationName())
                .producedQty(confirmation.getProducedQty())
                .scrapQty(confirmation.getScrapQty())
                .startTime(confirmation.getStartTime())
                .endTime(confirmation.getEndTime())
                .delayMinutes(confirmation.getDelayMinutes())
                .delayReason(confirmation.getDelayReason())
                .processParameters(null)
                .notes(confirmation.getNotes())
                .status(confirmation.getStatus())
                .createdOn(confirmation.getCreatedOn())
                // P12: Partial confirmation indicator
                .isPartial(isPartialConfirmation)
                .remainingQty(remainingQty)
                // Primary batch (first one, for backward compatibility)
                .outputBatch(outputBatchInfos.get(0))
                // All output batches (for multi-batch production)
                .outputBatches(outputBatchInfos)
                .batchCount(batchSizeResult.batchCount())
                .hasPartialBatch(batchSizeResult.hasPartialBatch())
                .nextOperation(nextOpInfo)
                .equipment(equipmentInfo)
                .operators(operatorInfo)
                .materialsConsumed(materialsConsumedInfo)
                .build();
    }

    private Batch generateOutputBatch(Operation operation, BigDecimal quantity, String currentUser) {
        return generateOutputBatch(operation, quantity, currentUser, 1, 1);
    }

    private Batch generateOutputBatch(Operation operation, BigDecimal quantity, String currentUser,
                                      int sequenceNumber, int totalBatches) {
        // Get product SKU for configuration lookup
        // Per MES Consolidated Specification: Operation has OrderLineItem (runtime ref)
        String productSku = null;
        if (operation.getOrderLineItem() != null) {
            productSku = operation.getOrderLineItem().getProductSku();
        }

        // Generate batch number using configurable service (GAP-005)
        // For multi-batch, append sequence suffix (e.g., -01, -02)
        String batchNumber = batchNumberService.generateBatchNumber(operation.getOperationType(), productSku);
        if (totalBatches > 1) {
            batchNumber = batchNumber + String.format("-%02d", sequenceNumber);
            log.info("Multi-batch: generated batch {} of {} with number {}", sequenceNumber, totalBatches, batchNumber);
        }

        // Determine output material based on operation
        String materialId = "IM-" + operation.getOperationType().toUpperCase();
        String materialName = operation.getOperationName() + " Output";

        // Per MES Batch Management Specification: Batches created during production
        // enter QUALITY_PENDING status and require approval before becoming AVAILABLE
        Batch batch = Batch.builder()
                .batchNumber(batchNumber)
                .materialId(materialId)
                .materialName(materialName)
                .quantity(quantity)
                .unit("T")
                .generatedAtOperationId(operation.getOperationId())
                .status(Batch.STATUS_QUALITY_PENDING)
                .createdVia(Batch.CREATED_VIA_PRODUCTION)
                .createdBy(currentUser)
                .build();

        batch = batchRepository.save(batch);
        log.info("Generated output batch: {}", batchNumber);

        // Audit: Log batch creation
        auditService.logProduce("BATCH", batch.getBatchId(),
                String.format("Batch: %s, Material: %s, Qty: %s", batchNumber, materialId, quantity));

        // Audit: Log batch number generation per MES Batch Number Specification
        auditService.logBatchNumberGenerated(
                batch.getBatchId(),
                batchNumber,
                operation.getOperationId(),
                operation.getOperationType(), // config context
                Batch.CREATED_VIA_PRODUCTION
        );

        return batch;
    }

    private Inventory createOutputInventory(Operation operation, Batch batch, BigDecimal quantity, String currentUser) {
        Inventory inventory = Inventory.builder()
                .materialId(batch.getMaterialId())
                .materialName(batch.getMaterialName())
                .inventoryType("IM")
                .state("AVAILABLE")
                .quantity(quantity)
                .unit("T")
                .batch(batch)
                .location(operation.getOperationType() + " Area")
                .createdBy(currentUser)
                .build();

        inventory = inventoryRepository.save(inventory);
        log.info("Created output inventory: {}", inventory.getInventoryId());

        // Audit: Log inventory creation
        auditService.logProduce("INVENTORY", inventory.getInventoryId(),
                String.format("Material: %s, Qty: %s, Batch: %s", batch.getMaterialId(), quantity, batch.getBatchNumber()));

        return inventory;
    }

    private void createBatchRelations(List<ProductionConfirmationDTO.MaterialConsumption> consumptions,
                                      Batch childBatch, Long operationId, String currentUser) {
        for (ProductionConfirmationDTO.MaterialConsumption consumption : consumptions) {
            Batch parentBatch = batchRepository.findById(consumption.getBatchId())
                    .orElseThrow(() -> new RuntimeException("Parent batch not found: " + consumption.getBatchId()));

            BatchRelation relation = BatchRelation.builder()
                    .parentBatch(parentBatch)
                    .childBatch(childBatch)
                    .operationId(operationId)
                    .relationType("MERGE")
                    .quantityConsumed(consumption.getQuantity())
                    .status("ACTIVE")
                    .createdBy(currentUser)
                    .build();

            relation = batchRelationRepository.save(relation);
            log.info("Created batch relation: {} -> {}", parentBatch.getBatchNumber(), childBatch.getBatchNumber());

            // Audit: Log batch relation creation
            auditService.logCreate("BATCH_RELATION", relation.getRelationId(),
                    String.format("Parent: %s -> Child: %s, Qty: %s",
                            parentBatch.getBatchNumber(), childBatch.getBatchNumber(), consumption.getQuantity()));
        }
    }

    private ProductionConfirmationDTO.NextOperationInfo setNextOperationReady(Operation currentOp, String currentUser) {
        String processName = currentOp.getProcess() != null ? currentOp.getProcess().getProcessName() : "Unknown";

        // Find next operation scoped by orderLineId (not processId) to avoid
        // NonUniqueResultException when multiple line items share the same process
        Optional<Operation> nextOp = operationRepository.findNextOperation(
                currentOp.getOrderLineItem().getOrderLineId(), currentOp.getSequenceNumber());

        if (nextOp.isPresent()) {
            // Set next operation to READY
            Operation next = nextOp.get();
            String oldStatus = next.getStatus();
            next.setStatus("READY");
            next.setUpdatedBy(currentUser);
            operationRepository.save(next);
            log.info("Set next operation to READY: {}", next.getOperationName());

            // Audit: Log next operation status change
            auditService.logStatusChange("OPERATION", next.getOperationId(), oldStatus, "READY");

            return ProductionConfirmationDTO.NextOperationInfo.builder()
                    .operationId(next.getOperationId())
                    .operationName(next.getOperationName())
                    .status("READY")
                    .processName(processName)
                    .build();
        } else {
            // All operations in this process are complete
            // Process is design-time only - no runtime status to update
            // Runtime completion is tracked at Operation level
            log.info("All operations completed for process: {}", processName);

            // Check if there's a next process
            // For POC, we'll return null - can be enhanced later
            return null;
        }
    }

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
    }

    /**
     * Get operation details for production confirmation
     */
    @Transactional(readOnly = true)
    public Operation getOperationDetails(Long operationId) {
        return operationRepository.findByIdWithDetails(operationId)
                .orElseThrow(() -> new RuntimeException("Operation not found: " + operationId));
    }

    /**
     * Reject a production confirmation
     */
    @Transactional
    public ProductionConfirmationDTO.StatusUpdateResponse rejectConfirmation(ProductionConfirmationDTO.RejectionRequest request) {
        log.info("Rejecting production confirmation: {}", request.getConfirmationId());

        String currentUser = getCurrentUser();

        // Get confirmation
        ProductionConfirmation confirmation = confirmationRepository.findById(request.getConfirmationId())
                .orElseThrow(() -> new RuntimeException("Production confirmation not found: " + request.getConfirmationId()));

        String oldStatus = confirmation.getStatus();

        // Validate current status
        if (ProductionConfirmation.STATUS_REJECTED.equals(oldStatus)) {
            throw new RuntimeException("Confirmation is already rejected");
        }

        // Update confirmation
        confirmation.setStatus(ProductionConfirmation.STATUS_REJECTED);
        confirmation.setRejectionReason(request.getReason());
        confirmation.setRejectedBy(currentUser);
        confirmation.setRejectedOn(java.time.LocalDateTime.now());
        confirmation.setUpdatedBy(currentUser);
        confirmationRepository.save(confirmation);

        log.info("Production confirmation {} rejected by {}", request.getConfirmationId(), currentUser);

        // Audit
        auditService.logStatusChange("PRODUCTION_CONFIRMATION", request.getConfirmationId(), oldStatus, ProductionConfirmation.STATUS_REJECTED);

        return ProductionConfirmationDTO.StatusUpdateResponse.builder()
                .confirmationId(request.getConfirmationId())
                .previousStatus(oldStatus)
                .newStatus(ProductionConfirmation.STATUS_REJECTED)
                .message("Production confirmation rejected. Reason: " + request.getReason())
                .updatedBy(currentUser)
                .updatedOn(confirmation.getUpdatedOn())
                .build();
    }

    /**
     * Get production confirmation by ID
     */
    @Transactional(readOnly = true)
    public ProductionConfirmationDTO.Response getConfirmationById(Long confirmationId) {
        ProductionConfirmation confirmation = confirmationRepository.findById(confirmationId)
                .orElseThrow(() -> new RuntimeException("Production confirmation not found: " + confirmationId));

        return toResponse(confirmation);
    }

    /**
     * Get confirmations by status
     */
    @Transactional(readOnly = true)
    public List<ProductionConfirmationDTO.Response> getConfirmationsByStatus(String status) {
        return confirmationRepository.findByStatus(status).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * P13: Get operations that can be continued (have partial progress).
     * Returns operations with status IN_PROGRESS and confirmed quantity less than target.
     */
    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getContinuableOperations() {
        // Find operations that are IN_PROGRESS and have some confirmed quantity
        List<Operation> continuableOps = operationRepository.findByStatus("IN_PROGRESS").stream()
                .filter(op -> op.getConfirmedQty() != null && op.getConfirmedQty().compareTo(java.math.BigDecimal.ZERO) > 0)
                .collect(Collectors.toList());

        return continuableOps.stream()
                .map(op -> {
                    java.util.Map<String, Object> opInfo = new java.util.LinkedHashMap<>();
                    opInfo.put("operationId", op.getOperationId());
                    opInfo.put("operationName", op.getOperationName());
                    opInfo.put("operationCode", op.getOperationCode());
                    opInfo.put("operationType", op.getOperationType());
                    opInfo.put("status", op.getStatus());
                    opInfo.put("confirmedQty", op.getConfirmedQty());
                    opInfo.put("targetQty", op.getTargetQty());

                    // Calculate remaining
                    java.math.BigDecimal remaining = java.math.BigDecimal.ZERO;
                    if (op.getTargetQty() != null && op.getConfirmedQty() != null) {
                        remaining = op.getTargetQty().subtract(op.getConfirmedQty());
                    }
                    opInfo.put("remainingQty", remaining);

                    // Add order/product info
                    if (op.getOrderLineItem() != null) {
                        opInfo.put("productSku", op.getOrderLineItem().getProductSku());
                        opInfo.put("productName", op.getOrderLineItem().getProductName());
                        if (op.getOrderLineItem().getOrder() != null) {
                            opInfo.put("orderId", op.getOrderLineItem().getOrder().getOrderId());
                        }
                    }

                    return opInfo;
                })
                .collect(Collectors.toList());
    }

    private ProductionConfirmationDTO.Response toResponse(ProductionConfirmation confirmation) {
        Operation operation = confirmation.getOperation();

        List<ProductionConfirmationDTO.EquipmentInfo> equipmentInfo = confirmation.getEquipment() != null ?
                confirmation.getEquipment().stream()
                        .map(eq -> ProductionConfirmationDTO.EquipmentInfo.builder()
                                .equipmentId(eq.getEquipmentId())
                                .equipmentCode(eq.getEquipmentCode())
                                .name(eq.getName())
                                .build())
                        .collect(Collectors.toList()) : List.of();

        List<ProductionConfirmationDTO.OperatorInfo> operatorInfo = confirmation.getOperators() != null ?
                confirmation.getOperators().stream()
                        .map(op -> ProductionConfirmationDTO.OperatorInfo.builder()
                                .operatorId(op.getOperatorId())
                                .operatorCode(op.getOperatorCode())
                                .name(op.getName())
                                .build())
                        .collect(Collectors.toList()) : List.of();

        return ProductionConfirmationDTO.Response.builder()
                .confirmationId(confirmation.getConfirmationId())
                .operationId(operation != null ? operation.getOperationId() : null)
                .operationName(operation != null ? operation.getOperationName() : null)
                .producedQty(confirmation.getProducedQty())
                .scrapQty(confirmation.getScrapQty())
                .startTime(confirmation.getStartTime())
                .endTime(confirmation.getEndTime())
                .delayMinutes(confirmation.getDelayMinutes())
                .delayReason(confirmation.getDelayReason())
                .processParameters(null)
                .notes(confirmation.getNotes())
                .status(confirmation.getStatus())
                .createdOn(confirmation.getCreatedOn())
                .rejectionReason(confirmation.getRejectionReason())
                .rejectedBy(confirmation.getRejectedBy())
                .rejectedOn(confirmation.getRejectedOn())
                .equipment(equipmentInfo)
                .operators(operatorInfo)
                .build();
    }
}
