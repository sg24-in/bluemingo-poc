package com.mes.production.service;

import com.mes.production.dto.ProductionConfirmationDTO;
import com.mes.production.entity.*;
import com.mes.production.entity.Process;
import com.mes.production.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

        // 2. Process material consumption
        Map<String, Object> rmConsumed = new HashMap<>();
        BigDecimal totalConsumed = BigDecimal.ZERO;

        for (ProductionConfirmationDTO.MaterialConsumption consumption : request.getMaterialsConsumed()) {
            // Get inventory and batch
            Inventory inventory = inventoryRepository.findById(consumption.getInventoryId())
                    .orElseThrow(() -> new RuntimeException("Inventory not found: " + consumption.getInventoryId()));

            if (!"AVAILABLE".equals(inventory.getState())) {
                throw new RuntimeException("Inventory is not available: " + consumption.getInventoryId());
            }

            // Validate quantity
            if (consumption.getQuantity().compareTo(inventory.getQuantity()) > 0) {
                throw new RuntimeException("Consumption quantity exceeds available quantity for inventory: " + consumption.getInventoryId());
            }

            // Update inventory state to CONSUMED
            inventory.setState("CONSUMED");
            inventory.setUpdatedBy(currentUser);
            inventoryRepository.save(inventory);

            // Update batch status if fully consumed
            Batch batch = inventory.getBatch();
            if (batch != null) {
                batch.setStatus("CONSUMED");
                batch.setUpdatedBy(currentUser);
                batchRepository.save(batch);
            }

            // Record consumption
            rmConsumed.put(consumption.getBatchId().toString(), Map.of(
                    "inventoryId", consumption.getInventoryId(),
                    "quantity", consumption.getQuantity(),
                    "materialId", inventory.getMaterialId()
            ));

            totalConsumed = totalConsumed.add(consumption.getQuantity());
            log.info("Consumed {} from batch {}", consumption.getQuantity(), consumption.getBatchId());
        }

        // 3. Generate output batch
        Batch outputBatch = generateOutputBatch(operation, request.getProducedQty(), currentUser);

        // 4. Create inventory for output
        Inventory outputInventory = createOutputInventory(operation, outputBatch, request.getProducedQty(), currentUser);

        // 5. Create batch relations
        createBatchRelations(request.getMaterialsConsumed(), outputBatch, operation.getOperationId(), currentUser);

        // 6. Create production confirmation record
        ProductionConfirmation confirmation = ProductionConfirmation.builder()
                .operation(operation)
                .producedQty(request.getProducedQty())
                .scrapQty(request.getScrapQty() != null ? request.getScrapQty() : BigDecimal.ZERO)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .delayMinutes(request.getDelayMinutes())
                .delayReason(request.getDelayReason())
                .processParameters(request.getProcessParameters())
                .rmConsumed(rmConsumed)
                .status("CONFIRMED")
                .createdBy(currentUser)
                .build();

        confirmation = confirmationRepository.save(confirmation);
        log.info("Production confirmation created: {}", confirmation.getConfirmationId());

        // 7. Update operation status
        operation.setStatus("CONFIRMED");
        operation.setUpdatedBy(currentUser);
        operationRepository.save(operation);

        // 8. Set next operation to READY
        ProductionConfirmationDTO.NextOperationInfo nextOpInfo = setNextOperationReady(operation, currentUser);

        // 9. Build response
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
                .processParameters(confirmation.getProcessParameters())
                .status(confirmation.getStatus())
                .createdOn(confirmation.getCreatedOn())
                .outputBatch(ProductionConfirmationDTO.BatchInfo.builder()
                        .batchId(outputBatch.getBatchId())
                        .batchNumber(outputBatch.getBatchNumber())
                        .materialId(outputBatch.getMaterialId())
                        .materialName(outputBatch.getMaterialName())
                        .quantity(outputBatch.getQuantity())
                        .unit(outputBatch.getUnit())
                        .build())
                .nextOperation(nextOpInfo)
                .build();
    }

    private Batch generateOutputBatch(Operation operation, BigDecimal quantity, String currentUser) {
        // Generate batch number: BATCH-{OP_TYPE}-{DATE}-{SEQ}
        String prefix = "BATCH-" + operation.getOperationType().substring(0, Math.min(2, operation.getOperationType().length())).toUpperCase();
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String batchPrefix = prefix + "-" + dateStr + "-";

        // Get next sequence
        Integer maxSeq = batchRepository.findMaxSequenceByPrefix(batchPrefix).orElse(0);
        String batchNumber = batchPrefix + String.format("%03d", maxSeq + 1);

        // Determine output material based on operation
        String materialId = "IM-" + operation.getOperationType().toUpperCase();
        String materialName = operation.getOperationName() + " Output";

        Batch batch = Batch.builder()
                .batchNumber(batchNumber)
                .materialId(materialId)
                .materialName(materialName)
                .quantity(quantity)
                .unit("T")
                .generatedAtOperationId(operation.getOperationId())
                .status("AVAILABLE")
                .createdBy(currentUser)
                .build();

        batch = batchRepository.save(batch);
        log.info("Generated output batch: {}", batchNumber);

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

            batchRelationRepository.save(relation);
            log.info("Created batch relation: {} -> {}", parentBatch.getBatchNumber(), childBatch.getBatchNumber());
        }
    }

    private ProductionConfirmationDTO.NextOperationInfo setNextOperationReady(Operation currentOp, String currentUser) {
        Process process = currentOp.getProcess();

        // Find next operation in current process
        Optional<Operation> nextOp = operationRepository.findNextOperation(
                process.getProcessId(), currentOp.getSequenceNumber());

        if (nextOp.isPresent()) {
            // Set next operation to READY
            Operation next = nextOp.get();
            next.setStatus("READY");
            next.setUpdatedBy(currentUser);
            operationRepository.save(next);
            log.info("Set next operation to READY: {}", next.getOperationName());

            return ProductionConfirmationDTO.NextOperationInfo.builder()
                    .operationId(next.getOperationId())
                    .operationName(next.getOperationName())
                    .status("READY")
                    .processName(process.getStageName())
                    .build();
        } else {
            // All operations in this process are complete
            process.setStatus("COMPLETED");
            process.setUpdatedBy(currentUser);
            processRepository.save(process);
            log.info("Process completed: {}", process.getStageName());

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
}
