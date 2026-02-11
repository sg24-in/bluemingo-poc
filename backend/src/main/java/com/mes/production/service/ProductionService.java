package com.mes.production.service;

import com.mes.production.dto.BomDTO;
import com.mes.production.dto.ProductionConfirmationDTO;
import com.mes.production.entity.*;
import com.mes.production.repository.*;
import com.mes.production.repository.HoldRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
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
    private final OrderRepository orderRepository;
    private final BomValidationService bomValidationService;
    private final ObjectMapper objectMapper;

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

        // R-02: Validate consumed materials against BOM requirements
        String productSku = operation.getOrderLineItem() != null ?
                operation.getOrderLineItem().getProductSku() : null;
        if (productSku != null) {
            List<BomDTO.MaterialConsumption> bomConsumptions = materialsConsumedInfo.stream()
                    .map(m -> BomDTO.MaterialConsumption.builder()
                            .materialId(m.getMaterialId())
                            .quantity(m.getQuantityConsumed())
                            .build())
                    .collect(Collectors.toList());

            BomDTO.BomValidationRequest bomValidationRequest = BomDTO.BomValidationRequest.builder()
                    .productSku(productSku)
                    .targetQuantity(request.getProducedQty())
                    .materialsConsumed(bomConsumptions)
                    .build();

            BomDTO.BomValidationResult bomResult = bomValidationService.validateConsumption(bomValidationRequest);
            if (!bomResult.isValid()) {
                String bomErrors = String.join("; ", bomResult.getErrors());
                log.warn("BOM validation failed for operation {}: {}", operation.getOperationId(), bomErrors);
                // Log warnings but continue (soft enforcement for POC)
                auditService.logCreate("BOM_VALIDATION", operation.getOperationId(),
                        "BOM validation warning: " + bomErrors);
            }
            for (String warning : bomResult.getWarnings()) {
                log.warn("BOM validation warning: {}", warning);
            }
        }

        // 3. Calculate batch splits using BatchSizeService (B13: Multi-batch support)
        String operationType = operation.getOperationType();
        String equipmentType = null; // Could be enhanced to get from request.getEquipmentIds()

        BatchSizeService.BatchSizeResult batchSizeResult = batchSizeService.calculateBatchSizes(
                request.getProducedQty(),
                operationType,
                null, // materialId - not used for output
                productSku,
                equipmentType);

        log.info("Batch size calculation: {} batches for {} qty",
                batchSizeResult.batchCount(), request.getProducedQty());

        // R-12: Validate produced quantity against batch size config (soft enforcement)
        validateBatchSizeConfig(request.getProducedQty(), operationType, productSku, equipmentType, operation.getOperationId());

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
                .rmConsumedJson(serializeToJson(rmConsumed))
                .equipment(equipmentSet)
                .operators(operatorSet)
                .notes(request.getNotes())
                .status(confirmationStatus)
                .createdBy(currentUser)
                .build();

        confirmation = confirmationRepository.save(confirmation);
        log.info("Production confirmation created: {} with status: {}", confirmation.getConfirmationId(), confirmationStatus);

        // R-13: Link output batches to this confirmation for reversal traceability
        for (Batch outputBatch : outputBatches) {
            outputBatch.setConfirmationId(confirmation.getConfirmationId());
            batchRepository.save(outputBatch);
        }

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
            // All operations in this line item are complete
            // Process is design-time only - no runtime status to update
            // Runtime completion is tracked at Operation level
            log.info("All operations completed for process: {}", processName);

            // R-08: Check if all operations across ALL line items in the order are CONFIRMED
            checkAndCompleteOrder(currentOp, currentUser);

            return null;
        }
    }

    /**
     * R-08: Auto-complete order when all operations across all line items are CONFIRMED.
     */
    private void checkAndCompleteOrder(Operation completedOp, String currentUser) {
        try {
            OrderLineItem lineItem = completedOp.getOrderLineItem();
            if (lineItem == null || lineItem.getOrder() == null) return;

            Order order = orderRepository.findById(lineItem.getOrder().getOrderId()).orElse(null);
            if (order == null || "COMPLETED".equals(order.getStatus()) || "CANCELLED".equals(order.getStatus())) return;

            // Check if ALL operations across ALL line items are CONFIRMED
            boolean allConfirmed = true;
            for (OrderLineItem li : order.getLineItems()) {
                if (li.getOperations() != null) {
                    for (Operation op : li.getOperations()) {
                        if (!"CONFIRMED".equals(op.getStatus())) {
                            allConfirmed = false;
                            break;
                        }
                    }
                }
                if (!allConfirmed) break;
            }

            if (allConfirmed) {
                String oldStatus = order.getStatus();
                order.setStatus("COMPLETED");
                order.setUpdatedBy(currentUser);
                orderRepository.save(order);
                log.info("Order {} auto-completed: all operations confirmed", order.getOrderNumber());
                auditService.logStatusChange("ORDER", order.getOrderId(), oldStatus, "COMPLETED");
            }
        } catch (Exception e) {
            log.warn("Could not check order completion: {}", e.getMessage());
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
     * R-12: Validate produced quantity against batch size configuration.
     * This is SOFT enforcement - logs warnings and audit entries but does not block production.
     */
    private void validateBatchSizeConfig(BigDecimal producedQty, String operationType,
                                          String productSku, String equipmentType, Long operationId) {
        try {
            Optional<BatchSizeConfig> configOpt = batchSizeService.findApplicableConfig(
                    operationType, null, productSku, equipmentType);

            if (configOpt.isEmpty()) {
                log.debug("R-12: No batch size config found for operation={}, product={} - skipping validation",
                        operationType, productSku);
                return;
            }

            BatchSizeConfig config = configOpt.get();
            BigDecimal minBatchSize = config.getMinBatchSize();
            BigDecimal maxBatchSize = config.getMaxBatchSize();

            StringBuilder warnings = new StringBuilder();

            if (minBatchSize != null && producedQty.compareTo(minBatchSize) < 0) {
                String warning = String.format("Produced quantity %s is below minimum batch size %s (config=%d)",
                        producedQty, minBatchSize, config.getConfigId());
                warnings.append(warning);
                log.warn("R-12 Batch size validation: {}", warning);
            }

            if (maxBatchSize != null && producedQty.compareTo(maxBatchSize) > 0) {
                String warning = String.format("Produced quantity %s exceeds maximum batch size %s (config=%d)",
                        producedQty, maxBatchSize, config.getConfigId());
                if (warnings.length() > 0) warnings.append("; ");
                warnings.append(warning);
                log.warn("R-12 Batch size validation: {}", warning);
            }

            if (warnings.length() > 0) {
                auditService.logCreate("BATCH_SIZE_VALIDATION", operationId,
                        "Batch size warning: " + warnings);
            }
        } catch (Exception e) {
            // R-12: Never block production due to batch size validation errors
            log.warn("R-12: Error during batch size validation (non-blocking): {}", e.getMessage());
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
                .reversedBy(confirmation.getReversedBy())
                .reversedOn(confirmation.getReversedOn())
                .reversalReason(confirmation.getReversalReason())
                .equipment(equipmentInfo)
                .operators(operatorInfo)
                .build();
    }

    // ===== R-13: Consumption Reversal =====

    /**
     * R-13: Check if a production confirmation can be reversed.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> canReverseConfirmation(Long confirmationId) {
        ProductionConfirmation confirmation = confirmationRepository.findById(confirmationId)
                .orElseThrow(() -> new RuntimeException("Production confirmation not found: " + confirmationId));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("confirmationId", confirmationId);
        result.put("currentStatus", confirmation.getStatus());

        // Check 1: Status must be CONFIRMED or PARTIALLY_CONFIRMED
        boolean statusOk = ProductionConfirmation.STATUS_CONFIRMED.equals(confirmation.getStatus())
                || ProductionConfirmation.STATUS_PARTIALLY_CONFIRMED.equals(confirmation.getStatus());
        result.put("statusAllowsReversal", statusOk);

        if (!statusOk) {
            result.put("canReverse", false);
            result.put("reason", "Status " + confirmation.getStatus() + " cannot be reversed");
            result.put("blockers", List.of("Status " + confirmation.getStatus() + " cannot be reversed"));
            return result;
        }

        // Check 2: Output batches not consumed downstream
        List<Batch> outputBatches = batchRepository.findByConfirmationId(confirmationId);
        List<String> blockers = new ArrayList<>();

        for (Batch batch : outputBatches) {
            List<BatchRelation> childRelations = batchRelationRepository.findChildRelations(batch.getBatchId());
            boolean hasActiveChildren = childRelations.stream()
                    .anyMatch(br -> "ACTIVE".equals(br.getStatus()));
            if (hasActiveChildren) {
                blockers.add("Batch " + batch.getBatchNumber() + " has been consumed in downstream operations");
            }
        }

        boolean canReverse = blockers.isEmpty();
        result.put("canReverse", canReverse);
        result.put("blockers", blockers);
        result.put("outputBatchCount", outputBatches.size());

        return result;
    }

    /**
     * R-13: Reverse a production confirmation (consumption reversal).
     * This undoes all state changes made by confirmProduction().
     */
    @Transactional
    public ProductionConfirmationDTO.ReversalResponse reverseConfirmation(ProductionConfirmationDTO.ReversalRequest request) {
        log.info("Reversing production confirmation: {}", request.getConfirmationId());

        String currentUser = getCurrentUser();

        // Step 1: Load and validate confirmation
        ProductionConfirmation confirmation = confirmationRepository.findById(request.getConfirmationId())
                .orElseThrow(() -> new RuntimeException("Production confirmation not found: " + request.getConfirmationId()));

        String oldStatus = confirmation.getStatus();

        if (!ProductionConfirmation.STATUS_CONFIRMED.equals(oldStatus) &&
            !ProductionConfirmation.STATUS_PARTIALLY_CONFIRMED.equals(oldStatus)) {
            throw new RuntimeException("Cannot reverse confirmation with status: " + oldStatus +
                    ". Only CONFIRMED or PARTIALLY_CONFIRMED confirmations can be reversed.");
        }

        // Step 2: Find output batches created by this confirmation
        List<Batch> outputBatches = batchRepository.findByConfirmationId(confirmation.getConfirmationId());

        // Step 3: Guard against cascading — check if any output batch has been consumed downstream
        for (Batch outputBatch : outputBatches) {
            List<BatchRelation> childRelations = batchRelationRepository.findChildRelations(outputBatch.getBatchId());
            boolean hasActiveChildren = childRelations.stream()
                    .anyMatch(br -> "ACTIVE".equals(br.getStatus()));
            if (hasActiveChildren) {
                throw new RuntimeException("Cannot reverse: Output batch " + outputBatch.getBatchNumber() +
                        " has already been consumed in downstream operations. Reverse those operations first.");
            }
        }

        // Step 4: Parse consumed inputs from rmConsumedJson
        List<Long> restoredInventoryIds = new ArrayList<>();
        List<Long> restoredBatchIds = new ArrayList<>();
        parseAndRestoreConsumedMaterials(confirmation, currentUser, restoredInventoryIds, restoredBatchIds);

        // Step 5-6: Scrap output batches and their inventory
        List<Long> scrappedOutputBatchIds = new ArrayList<>();
        for (Batch outputBatch : outputBatches) {
            String oldBatchStatus = outputBatch.getStatus();
            outputBatch.setStatus(Batch.STATUS_SCRAPPED);
            outputBatch.setRejectionReason("Reversed: " + request.getReason());
            outputBatch.setUpdatedBy(currentUser);
            batchRepository.save(outputBatch);
            scrappedOutputBatchIds.add(outputBatch.getBatchId());
            auditService.logStatusChange("BATCH", outputBatch.getBatchId(), oldBatchStatus, Batch.STATUS_SCRAPPED);

            // Scrap associated output inventory
            List<Inventory> outputInventories = inventoryRepository.findByBatch_BatchId(outputBatch.getBatchId());
            for (Inventory inv : outputInventories) {
                String oldInvState = inv.getState();
                inv.setState("SCRAPPED");
                inv.setUpdatedBy(currentUser);
                inventoryRepository.save(inv);
                auditService.logStatusChange("INVENTORY", inv.getInventoryId(), oldInvState, "SCRAPPED");

                // Record reversal movement for output inventory
                inventoryMovementService.recordMovement(
                        inv.getInventoryId(),
                        confirmation.getOperation().getOperationId(),
                        "REVERSAL",
                        inv.getQuantity(),
                        "Reversed confirmation #" + confirmation.getConfirmationId());
            }
        }

        // Step 7: Deactivate batch relations (ACTIVE → REVERSED)
        for (Batch outputBatch : outputBatches) {
            // Find relations where this output batch is the child (parent→child)
            List<BatchRelation> relations = batchRelationRepository.findParentRelations(outputBatch.getBatchId());
            for (BatchRelation rel : relations) {
                if ("ACTIVE".equals(rel.getStatus())) {
                    rel.setStatus("REVERSED");
                    batchRelationRepository.save(rel);
                    auditService.logStatusChange("BATCH_RELATION", rel.getRelationId(), "ACTIVE", "REVERSED");
                }
            }
        }

        // Step 8: Revert operation status and confirmed qty
        Operation operation = confirmation.getOperation();
        String oldOpStatus = operation.getStatus();
        BigDecimal previousConfirmedQty = operation.getConfirmedQty() != null
                ? operation.getConfirmedQty() : BigDecimal.ZERO;
        BigDecimal newConfirmedQty = previousConfirmedQty.subtract(confirmation.getProducedQty());
        if (newConfirmedQty.compareTo(BigDecimal.ZERO) < 0) {
            newConfirmedQty = BigDecimal.ZERO;
        }
        operation.setConfirmedQty(newConfirmedQty);

        String newOpStatus;
        if (newConfirmedQty.compareTo(BigDecimal.ZERO) == 0) {
            newOpStatus = "READY";
        } else {
            newOpStatus = "IN_PROGRESS";
        }
        operation.setStatus(newOpStatus);
        operation.setUpdatedBy(currentUser);
        operationRepository.save(operation);
        if (!oldOpStatus.equals(newOpStatus)) {
            auditService.logStatusChange("OPERATION", operation.getOperationId(), oldOpStatus, newOpStatus);
        }

        // Step 9: Revert next operation if this was a full confirmation
        Long nextOperationId = null;
        String nextOperationNewStatus = null;
        if (ProductionConfirmation.STATUS_CONFIRMED.equals(oldStatus)) {
            Optional<Operation> nextOp = operationRepository.findNextOperation(
                    operation.getOrderLineItem().getOrderLineId(), operation.getSequenceNumber());
            if (nextOp.isPresent() && "READY".equals(nextOp.get().getStatus())) {
                Operation next = nextOp.get();
                next.setStatus("NOT_STARTED");
                next.setUpdatedBy(currentUser);
                operationRepository.save(next);
                auditService.logStatusChange("OPERATION", next.getOperationId(), "READY", "NOT_STARTED");
                nextOperationId = next.getOperationId();
                nextOperationNewStatus = "NOT_STARTED";
            }

            // Revert order completion if applicable
            revertOrderCompletionIfNeeded(operation, currentUser);
        }

        // Step 10: Mark confirmation as REVERSED
        confirmation.setStatus(ProductionConfirmation.STATUS_REVERSED);
        confirmation.setReversalReason(request.getReason());
        confirmation.setReversedBy(currentUser);
        confirmation.setReversedOn(LocalDateTime.now());
        confirmation.setUpdatedBy(currentUser);
        confirmationRepository.save(confirmation);

        auditService.logStatusChange("PRODUCTION_CONFIRMATION",
                confirmation.getConfirmationId(), oldStatus, ProductionConfirmation.STATUS_REVERSED);

        log.info("Production confirmation {} reversed by {}", request.getConfirmationId(), currentUser);

        return ProductionConfirmationDTO.ReversalResponse.builder()
                .confirmationId(confirmation.getConfirmationId())
                .previousStatus(oldStatus)
                .newStatus(ProductionConfirmation.STATUS_REVERSED)
                .message("Production confirmation reversed successfully. Reason: " + request.getReason())
                .reversedBy(currentUser)
                .reversedOn(confirmation.getReversedOn())
                .restoredInventoryIds(restoredInventoryIds)
                .restoredBatchIds(restoredBatchIds)
                .scrappedOutputBatchIds(scrappedOutputBatchIds)
                .operationId(operation.getOperationId())
                .operationNewStatus(newOpStatus)
                .nextOperationId(nextOperationId)
                .nextOperationNewStatus(nextOperationNewStatus)
                .build();
    }

    /**
     * R-13: Parse consumed materials from rmConsumedJson and restore them.
     */
    private void parseAndRestoreConsumedMaterials(ProductionConfirmation confirmation, String currentUser,
                                                   List<Long> restoredInventoryIds, List<Long> restoredBatchIds) {
        String rmJson = confirmation.getRmConsumedJson();
        if (rmJson == null || rmJson.isEmpty()) {
            log.warn("No rmConsumedJson found for confirmation {}", confirmation.getConfirmationId());
            return;
        }

        try {
            // Try parsing as proper JSON first (new format)
            Map<String, Map<String, Object>> consumed = objectMapper.readValue(rmJson,
                    new TypeReference<Map<String, Map<String, Object>>>() {});

            for (Map.Entry<String, Map<String, Object>> entry : consumed.entrySet()) {
                Long batchId = Long.parseLong(entry.getKey());
                Map<String, Object> details = entry.getValue();
                Long inventoryId = ((Number) details.get("inventoryId")).longValue();

                restoreInventoryAndBatch(inventoryId, batchId, confirmation, currentUser,
                        restoredInventoryIds, restoredBatchIds);
            }
        } catch (Exception jsonEx) {
            // Fallback: try parsing old Map.toString() format
            log.warn("Could not parse rmConsumedJson as JSON for confirmation {}, trying legacy format",
                    confirmation.getConfirmationId());
            parseLegacyRmConsumed(rmJson, confirmation, currentUser, restoredInventoryIds, restoredBatchIds);
        }
    }

    /**
     * R-13: Fallback parser for legacy Map.toString() format.
     * Format: {1={inventoryId=5, quantity=10.0, materialId=RM-001}, 2={...}}
     */
    private void parseLegacyRmConsumed(String rmJson, ProductionConfirmation confirmation, String currentUser,
                                        List<Long> restoredInventoryIds, List<Long> restoredBatchIds) {
        try {
            // Extract batchId=inventoryId pairs using regex
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                    "(\\d+)=\\{[^}]*inventoryId=(\\d+)");
            java.util.regex.Matcher matcher = pattern.matcher(rmJson);

            while (matcher.find()) {
                Long batchId = Long.parseLong(matcher.group(1));
                Long inventoryId = Long.parseLong(matcher.group(2));

                restoreInventoryAndBatch(inventoryId, batchId, confirmation, currentUser,
                        restoredInventoryIds, restoredBatchIds);
            }
        } catch (Exception e) {
            log.error("Failed to parse legacy rmConsumedJson for confirmation {}: {}",
                    confirmation.getConfirmationId(), e.getMessage());
            throw new RuntimeException("Cannot reverse: unable to parse consumed materials data. " +
                    "This confirmation may predate the reversal feature.");
        }
    }

    /**
     * R-13: Restore a single inventory item and its batch.
     */
    private void restoreInventoryAndBatch(Long inventoryId, Long batchId,
                                           ProductionConfirmation confirmation, String currentUser,
                                           List<Long> restoredInventoryIds, List<Long> restoredBatchIds) {
        // Restore inventory: CONSUMED → AVAILABLE
        inventoryRepository.findById(inventoryId).ifPresent(inv -> {
            if ("CONSUMED".equals(inv.getState())) {
                String oldState = inv.getState();
                inv.setState("AVAILABLE");
                inv.setUpdatedBy(currentUser);
                inventoryRepository.save(inv);
                auditService.logStatusChange("INVENTORY", inv.getInventoryId(), oldState, "AVAILABLE");
                restoredInventoryIds.add(inv.getInventoryId());

                // Record reversal movement
                inventoryMovementService.recordMovement(
                        inv.getInventoryId(),
                        confirmation.getOperation().getOperationId(),
                        "REVERSAL",
                        inv.getQuantity(),
                        "Reversed confirmation #" + confirmation.getConfirmationId());
            }
        });

        // Restore batch: CONSUMED → AVAILABLE
        if (!restoredBatchIds.contains(batchId)) {
            batchRepository.findById(batchId).ifPresent(batch -> {
                if ("CONSUMED".equals(batch.getStatus())) {
                    String oldStatus = batch.getStatus();
                    batch.setStatus(Batch.STATUS_AVAILABLE);
                    batch.setUpdatedBy(currentUser);
                    batchRepository.save(batch);
                    auditService.logStatusChange("BATCH", batch.getBatchId(), oldStatus, Batch.STATUS_AVAILABLE);
                    restoredBatchIds.add(batch.getBatchId());
                }
            });
        }
    }

    /**
     * R-13: Revert order from COMPLETED to IN_PROGRESS if it was auto-completed.
     */
    private void revertOrderCompletionIfNeeded(Operation op, String currentUser) {
        try {
            OrderLineItem lineItem = op.getOrderLineItem();
            if (lineItem == null || lineItem.getOrder() == null) return;

            Order order = orderRepository.findById(lineItem.getOrder().getOrderId()).orElse(null);
            if (order == null || !"COMPLETED".equals(order.getStatus())) return;

            String oldOrderStatus = order.getStatus();
            order.setStatus("IN_PROGRESS");
            order.setUpdatedBy(currentUser);
            orderRepository.save(order);
            log.info("Order {} reverted from COMPLETED to IN_PROGRESS due to reversal", order.getOrderNumber());
            auditService.logStatusChange("ORDER", order.getOrderId(), oldOrderStatus, "IN_PROGRESS");
        } catch (Exception e) {
            log.warn("Could not revert order completion: {}", e.getMessage());
        }
    }

    /**
     * R-13: Serialize a map to proper JSON string.
     */
    private String serializeToJson(Map<String, Object> map) {
        try {
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            log.warn("Failed to serialize to JSON, falling back to toString(): {}", e.getMessage());
            return map.toString();
        }
    }
}
