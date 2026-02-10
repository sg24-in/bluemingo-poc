package com.mes.production.service;

import com.mes.production.dto.BatchDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.entity.Batch;
import com.mes.production.entity.BatchQuantityAdjustment;
import com.mes.production.entity.BatchRelation;
import com.mes.production.entity.Operation;
import com.mes.production.entity.RoutingStep;
import com.mes.production.repository.BatchQuantityAdjustmentRepository;
import com.mes.production.repository.BatchRelationRepository;
import com.mes.production.repository.BatchRepository;
import com.mes.production.repository.OperationRepository;
import com.mes.production.repository.RoutingStepRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class BatchService {

    private final BatchRepository batchRepository;
    private final BatchRelationRepository batchRelationRepository;
    private final BatchQuantityAdjustmentRepository adjustmentRepository;
    private final OperationRepository operationRepository;
    private final RoutingStepRepository routingStepRepository;
    private final AuditService auditService;
    private final BatchNumberService batchNumberService;

    /**
     * Get all batches
     */
    public List<BatchDTO> getAllBatches() {
        log.info("Fetching all batches");

        return batchRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get batches with pagination, sorting, and filtering
     */
    public PagedResponseDTO<BatchDTO> getBatchesPaged(PageRequestDTO pageRequest) {
        log.info("Fetching batches with pagination: page={}, size={}, status={}, search={}",
                pageRequest.getPage(), pageRequest.getSize(),
                pageRequest.getStatus(), pageRequest.getSearch());

        Pageable pageable = pageRequest.toPageable("createdOn");

        Page<Batch> page;
        if (pageRequest.hasFilters()) {
            page = batchRepository.findByFilters(
                    pageRequest.getStatus(),
                    null, // materialId filter
                    pageRequest.getSearchPattern(),
                    pageable);
        } else {
            page = batchRepository.findAll(pageable);
        }

        Page<BatchDTO> dtoPage = page.map(this::convertToDTO);

        return PagedResponseDTO.fromPage(dtoPage,
                pageRequest.getSortBy(),
                pageRequest.getSortDirection(),
                pageRequest.getSearch());
    }

    /**
     * Get batch by ID
     */
    public BatchDTO getBatchById(Long batchId) {
        log.info("Fetching batch by ID: {}", batchId);

        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));

        return convertToDTO(batch);
    }

    /**
     * Get batch genealogy (traceability)
     */
    public BatchDTO.Genealogy getBatchGenealogy(Long batchId) {
        log.info("Fetching genealogy for batch: {}", batchId);

        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));

        // Get parent batches (inputs)
        List<BatchRelation> parentRelations = batchRelationRepository.findParentRelations(batchId);
        List<BatchDTO.ParentBatchInfo> parentBatches = parentRelations.stream()
                .map(rel -> BatchDTO.ParentBatchInfo.builder()
                        .batchId(rel.getParentBatch().getBatchId())
                        .batchNumber(rel.getParentBatch().getBatchNumber())
                        .materialName(rel.getParentBatch().getMaterialName())
                        .quantityConsumed(rel.getQuantityConsumed())
                        .unit(rel.getParentBatch().getUnit())
                        .relationType(rel.getRelationType())
                        .build())
                .collect(Collectors.toList());

        // Get child batches (outputs)
        List<BatchRelation> childRelations = batchRelationRepository.findChildRelations(batchId);
        List<BatchDTO.ChildBatchInfo> childBatches = childRelations.stream()
                .map(rel -> BatchDTO.ChildBatchInfo.builder()
                        .batchId(rel.getChildBatch().getBatchId())
                        .batchNumber(rel.getChildBatch().getBatchNumber())
                        .materialName(rel.getChildBatch().getMaterialName())
                        .quantity(rel.getChildBatch().getQuantity())
                        .unit(rel.getChildBatch().getUnit())
                        .relationType(rel.getRelationType())
                        .build())
                .collect(Collectors.toList());

        // Get production info
        BatchDTO.ProductionInfo productionInfo = null;
        if (batch.getGeneratedAtOperationId() != null) {
            operationRepository.findByIdWithDetails(batch.getGeneratedAtOperationId())
                    .ifPresent(op -> {
                        // Note: productionInfo needs to be set differently due to lambda scope
                    });

            Operation op = operationRepository.findByIdWithDetails(batch.getGeneratedAtOperationId())
                    .orElse(null);
            if (op != null) {
                String orderId = null;
                if (op.getOrderLineItem() != null && op.getOrderLineItem().getOrder() != null) {
                    orderId = op.getOrderLineItem().getOrder().getOrderId().toString();
                }
                productionInfo = BatchDTO.ProductionInfo.builder()
                        .operationId(op.getOperationId())
                        .operationName(op.getOperationName())
                        .processName(op.getProcess() != null ? op.getProcess().getProcessName() : null)
                        .orderId(orderId)
                        .productionDate(batch.getCreatedOn())
                        .build();
            }
        }

        return BatchDTO.Genealogy.builder()
                .batch(convertToDTO(batch))
                .parentBatches(parentBatches)
                .childBatches(childBatches)
                .productionInfo(productionInfo)
                .build();
    }

    /**
     * Get available batches by material ID
     */
    public List<BatchDTO> getAvailableBatchesByMaterial(String materialId) {
        log.info("Fetching available batches for material: {}", materialId);

        return batchRepository.findAvailableByMaterialId(materialId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private BatchDTO convertToDTO(Batch batch) {
        return BatchDTO.builder()
                .batchId(batch.getBatchId())
                .batchNumber(batch.getBatchNumber())
                .materialId(batch.getMaterialId())
                .materialName(batch.getMaterialName())
                .quantity(batch.getQuantity())
                .unit(batch.getUnit())
                .status(batch.getStatus())
                .createdOn(batch.getCreatedOn())
                // Per MES Batch Number Specification
                .generatedAtOperationId(batch.getGeneratedAtOperationId())
                .createdVia(batch.getCreatedVia())
                .supplierBatchNumber(batch.getSupplierBatchNumber())
                .supplierId(batch.getSupplierId())
                .expiryDate(batch.getExpiryDate())
                // Approval info
                .approvedBy(batch.getApprovedBy())
                .approvedOn(batch.getApprovedOn())
                .rejectionReason(batch.getRejectionReason())
                .rejectedBy(batch.getRejectedBy())
                .rejectedOn(batch.getRejectedOn())
                .build();
    }

    // Statuses that allow split operations
    private static final java.util.Set<String> SPLITTABLE_STATUSES = java.util.Set.of(
            "AVAILABLE", "RESERVED", "BLOCKED", "PRODUCED", "QUALITY_PENDING"
    );

    /**
     * R15: Check if a batch can be split based on its source routing step's batch behavior flags.
     */
    private void validateBatchBehaviorForSplit(Batch batch) {
        if (batch.getGeneratedAtOperationId() == null) {
            log.info("Batch {} has no source operation - allowing split by default", batch.getBatchNumber());
            return;
        }

        Operation operation = operationRepository.findById(batch.getGeneratedAtOperationId()).orElse(null);
        if (operation == null || operation.getRoutingStepId() == null) {
            log.info("Batch {} operation has no routing step - allowing split by default", batch.getBatchNumber());
            return;
        }

        RoutingStep routingStep = routingStepRepository.findById(operation.getRoutingStepId()).orElse(null);
        if (routingStep == null) {
            log.info("Routing step not found for operation - allowing split by default");
            return;
        }

        if (routingStep.getAllowsSplit() != null && !routingStep.getAllowsSplit()) {
            throw new RuntimeException("Split not allowed for batch " + batch.getBatchNumber() +
                    ": routing step " + routingStep.getOperationName() + " has allowsSplit=false");
        }

        log.info("Batch {} passed batch behavior validation for split", batch.getBatchNumber());
    }

    /**
     * R15: Check if batches can be merged based on their source routing steps' batch behavior flags.
     */
    private void validateBatchBehaviorForMerge(java.util.List<Batch> batches) {
        for (Batch batch : batches) {
            if (batch.getGeneratedAtOperationId() == null) {
                log.info("Batch {} has no source operation - allowing merge by default", batch.getBatchNumber());
                continue;
            }

            Operation operation = operationRepository.findById(batch.getGeneratedAtOperationId()).orElse(null);
            if (operation == null || operation.getRoutingStepId() == null) {
                log.info("Batch {} operation has no routing step - allowing merge by default", batch.getBatchNumber());
                continue;
            }

            RoutingStep routingStep = routingStepRepository.findById(operation.getRoutingStepId()).orElse(null);
            if (routingStep == null) {
                log.info("Routing step not found for operation - allowing merge by default");
                continue;
            }

            if (routingStep.getAllowsMerge() != null && !routingStep.getAllowsMerge()) {
                throw new RuntimeException("Merge not allowed for batch " + batch.getBatchNumber() +
                        ": routing step " + routingStep.getOperationName() + " has allowsMerge=false");
            }
        }

        log.info("All batches passed batch behavior validation for merge");
    }

    /**
     * Split a batch into multiple smaller batches
     */
    @Transactional
    public BatchDTO.SplitResponse splitBatch(BatchDTO.SplitRequest request, String userId) {
        log.info("Splitting batch: {}", request.getSourceBatchId());

        Batch sourceBatch = batchRepository.findById(request.getSourceBatchId())
                .orElseThrow(() -> new RuntimeException("Batch not found: " + request.getSourceBatchId()));

        // Validate batch status allows split
        if (!SPLITTABLE_STATUSES.contains(sourceBatch.getStatus())) {
            throw new RuntimeException("Batch with status " + sourceBatch.getStatus() + " cannot be split. " +
                    "Only batches with status AVAILABLE, RESERVED, BLOCKED, PRODUCED, or QUALITY_PENDING can be split.");
        }

        // R15: Validate batch behavior flags allow split
        validateBatchBehaviorForSplit(sourceBatch);

        // Validate portions list is not empty
        if (request.getPortions() == null || request.getPortions().isEmpty()) {
            throw new RuntimeException("At least one portion is required for splitting");
        }

        // Validate each portion has positive quantity
        for (BatchDTO.SplitPortion portion : request.getPortions()) {
            if (portion.getQuantity() == null ||
                    portion.getQuantity().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("All split portions must have a positive quantity");
            }
        }

        // Calculate total split quantity
        java.math.BigDecimal totalSplitQty = request.getPortions().stream()
                .map(BatchDTO.SplitPortion::getQuantity)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        // Validate total doesn't exceed source
        if (totalSplitQty.compareTo(sourceBatch.getQuantity()) > 0) {
            throw new RuntimeException("Split quantities exceed available quantity");
        }

        java.util.List<BatchDTO> newBatches = new java.util.ArrayList<>();
        int splitIndex = 1;

        for (BatchDTO.SplitPortion portion : request.getPortions()) {
            // Generate new batch number using configurable service (GAP-005)
            String newBatchNumber;
            if (portion.getBatchNumberSuffix() != null && !portion.getBatchNumberSuffix().isEmpty()) {
                // Use provided suffix
                newBatchNumber = sourceBatch.getBatchNumber() + "-" + portion.getBatchNumberSuffix();
            } else {
                // Use configurable batch number service
                newBatchNumber = batchNumberService.generateSplitBatchNumber(sourceBatch.getBatchNumber(), splitIndex);
            }

            // Create new batch (inherit generatedAtOperationId from parent per MES Batch Number Spec)
            Batch newBatch = Batch.builder()
                    .batchNumber(newBatchNumber)
                    .materialId(sourceBatch.getMaterialId())
                    .materialName(sourceBatch.getMaterialName())
                    .quantity(portion.getQuantity())
                    .unit(sourceBatch.getUnit())
                    .status("AVAILABLE")
                    .generatedAtOperationId(sourceBatch.getGeneratedAtOperationId())
                    .createdVia(Batch.CREATED_VIA_SPLIT)
                    .createdBy(userId)
                    .build();

            newBatch = batchRepository.save(newBatch);

            // Audit: Log batch number generation per MES Batch Number Specification
            auditService.logBatchNumberGenerated(
                    newBatch.getBatchId(),
                    newBatch.getBatchNumber(),
                    sourceBatch.getGeneratedAtOperationId(), // Inherit from parent
                    "SPLIT from " + sourceBatch.getBatchNumber(),
                    Batch.CREATED_VIA_SPLIT
            );

            // Create relation from source to new batch
            BatchRelation relation = BatchRelation.builder()
                    .parentBatch(sourceBatch)
                    .childBatch(newBatch)
                    .relationType("SPLIT")
                    .quantityConsumed(portion.getQuantity())
                    .status("ACTIVE")
                    .createdBy(userId)
                    .build();

            batchRelationRepository.save(relation);

            newBatches.add(convertToDTO(newBatch));
            splitIndex++;
        }

        // Update source batch quantity
        java.math.BigDecimal remainingQty = sourceBatch.getQuantity().subtract(totalSplitQty);
        sourceBatch.setQuantity(remainingQty);

        // If fully split, mark as SPLIT
        if (remainingQty.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            sourceBatch.setStatus("SPLIT");
        }
        sourceBatch.setUpdatedBy(userId);
        batchRepository.save(sourceBatch);

        return BatchDTO.SplitResponse.builder()
                .sourceBatchId(sourceBatch.getBatchId())
                .sourceBatchNumber(sourceBatch.getBatchNumber())
                .originalQuantity(sourceBatch.getQuantity().add(totalSplitQty))
                .remainingQuantity(remainingQty)
                .newBatches(newBatches)
                .status("SUCCESS")
                .build();
    }

    /**
     * Merge multiple batches into a single batch
     */
    @Transactional
    public BatchDTO.MergeResponse mergeBatches(BatchDTO.MergeRequest request, String userId) {
        log.info("Merging batches: {}", request.getSourceBatchIds());

        if (request.getSourceBatchIds() == null || request.getSourceBatchIds().size() < 2) {
            throw new RuntimeException("At least 2 batches are required for merging");
        }

        // Validate no duplicate batch IDs
        java.util.Set<Long> uniqueIds = new java.util.HashSet<>(request.getSourceBatchIds());
        if (uniqueIds.size() != request.getSourceBatchIds().size()) {
            throw new RuntimeException("Duplicate batch IDs are not allowed in merge request");
        }

        // Load source batches
        java.util.List<Batch> sourceBatches = new java.util.ArrayList<>();
        for (Long batchId : request.getSourceBatchIds()) {
            Batch batch = batchRepository.findById(batchId)
                    .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));

            // Validate batch is available
            if (!"AVAILABLE".equals(batch.getStatus())) {
                throw new RuntimeException("Only AVAILABLE batches can be merged. Batch " +
                        batch.getBatchNumber() + " has status: " + batch.getStatus());
            }

            sourceBatches.add(batch);
        }

        // Validate all batches have same material
        String materialId = sourceBatches.get(0).getMaterialId();
        String unit = sourceBatches.get(0).getUnit();
        for (Batch batch : sourceBatches) {
            if (!materialId.equals(batch.getMaterialId())) {
                throw new RuntimeException("All batches must have the same material ID for merging");
            }
            if (!unit.equals(batch.getUnit())) {
                throw new RuntimeException("All batches must have the same unit for merging. " +
                        "Expected: " + unit + ", found: " + batch.getUnit());
            }
        }

        // R15: Validate batch behavior flags allow merge
        validateBatchBehaviorForMerge(sourceBatches);

        // Calculate total quantity
        java.math.BigDecimal totalQuantity = sourceBatches.stream()
                .map(Batch::getQuantity)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        // Generate merged batch number using configurable service (GAP-005)
        String mergedBatchNumber = request.getTargetBatchNumber();
        if (mergedBatchNumber == null || mergedBatchNumber.isEmpty()) {
            mergedBatchNumber = batchNumberService.generateMergeBatchNumber();
        }

        // Create merged batch
        Batch mergedBatch = Batch.builder()
                .batchNumber(mergedBatchNumber)
                .materialId(materialId)
                .materialName(sourceBatches.get(0).getMaterialName())
                .quantity(totalQuantity)
                .unit(unit)
                .status("AVAILABLE")
                .createdVia(Batch.CREATED_VIA_MERGE)
                .createdBy(userId)
                .build();

        mergedBatch = batchRepository.save(mergedBatch);

        // Audit: Log batch number generation per MES Batch Number Specification
        auditService.logBatchNumberGenerated(
                mergedBatch.getBatchId(),
                mergedBatch.getBatchNumber(),
                null, // Merged batches have no single source operation
                "MERGE of " + sourceBatches.size() + " batches",
                Batch.CREATED_VIA_MERGE
        );

        // Create relations and update source batches
        java.util.List<BatchDTO> sourceDTOs = new java.util.ArrayList<>();
        for (Batch sourceBatch : sourceBatches) {
            // Create relation
            BatchRelation relation = BatchRelation.builder()
                    .parentBatch(sourceBatch)
                    .childBatch(mergedBatch)
                    .relationType("MERGE")
                    .quantityConsumed(sourceBatch.getQuantity())
                    .status("ACTIVE")
                    .createdBy(userId)
                    .build();

            batchRelationRepository.save(relation);

            // Mark source batch as MERGED
            sourceBatch.setStatus("MERGED");
            sourceBatch.setQuantity(java.math.BigDecimal.ZERO);
            sourceBatch.setUpdatedBy(userId);
            batchRepository.save(sourceBatch);

            sourceDTOs.add(convertToDTO(sourceBatch));
        }

        return BatchDTO.MergeResponse.builder()
                .sourceBatches(sourceDTOs)
                .mergedBatch(convertToDTO(mergedBatch))
                .totalQuantity(totalQuantity)
                .status("SUCCESS")
                .build();
    }

    /**
     * Get batches with PRODUCED status (pending quality approval)
     */
    public List<BatchDTO> getProducedBatches() {
        log.info("Fetching produced batches pending approval");
        return batchRepository.findByStatus(Batch.STATUS_PRODUCED).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Approve a produced batch - transitions from PRODUCED to AVAILABLE
     */
    @Transactional
    public BatchDTO.StatusUpdateResponse approveBatch(Long batchId) {
        log.info("Approving batch: {}", batchId);

        String currentUser = getCurrentUser();
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));
        String oldStatus = batch.getStatus();

        // Validate current status
        if (!Batch.STATUS_PRODUCED.equals(oldStatus) && !Batch.STATUS_QUALITY_PENDING.equals(oldStatus)) {
            throw new RuntimeException("Only PRODUCED or QUALITY_PENDING batches can be approved. Current status: " + oldStatus);
        }

        // Update status
        batch.setStatus(Batch.STATUS_AVAILABLE);
        batch.setApprovedBy(currentUser);
        batch.setApprovedOn(LocalDateTime.now());
        batch.setUpdatedBy(currentUser);
        batchRepository.save(batch);

        log.info("Batch {} approved by {}", batchId, currentUser);
        auditService.logStatusChange("BATCH", batchId, oldStatus, Batch.STATUS_AVAILABLE);

        return BatchDTO.StatusUpdateResponse.builder()
                .batchId(batchId)
                .batchNumber(batch.getBatchNumber())
                .previousStatus(oldStatus)
                .newStatus(Batch.STATUS_AVAILABLE)
                .message("Batch approved and now available for use")
                .updatedBy(currentUser)
                .updatedOn(batch.getUpdatedOn())
                .build();
    }

    /**
     * Reject a produced batch
     */
    @Transactional
    public BatchDTO.StatusUpdateResponse rejectBatch(Long batchId, String reason) {
        log.info("Rejecting batch: {}", batchId);

        String currentUser = getCurrentUser();
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));
        String oldStatus = batch.getStatus();

        // Validate current status
        if (!Batch.STATUS_PRODUCED.equals(oldStatus) && !Batch.STATUS_QUALITY_PENDING.equals(oldStatus)) {
            throw new RuntimeException("Only PRODUCED or QUALITY_PENDING batches can be rejected. Current status: " + oldStatus);
        }

        // Update status to BLOCKED (rejected batches need to be reviewed/scrapped)
        batch.setStatus(Batch.STATUS_BLOCKED);
        batch.setRejectionReason(reason);
        batch.setRejectedBy(currentUser);
        batch.setRejectedOn(LocalDateTime.now());
        batch.setUpdatedBy(currentUser);
        batchRepository.save(batch);

        log.info("Batch {} rejected by {}", batchId, currentUser);
        auditService.logStatusChange("BATCH", batchId, oldStatus, Batch.STATUS_BLOCKED);

        return BatchDTO.StatusUpdateResponse.builder()
                .batchId(batchId)
                .batchNumber(batch.getBatchNumber())
                .previousStatus(oldStatus)
                .newStatus(Batch.STATUS_BLOCKED)
                .message("Batch rejected. Reason: " + reason)
                .updatedBy(currentUser)
                .updatedOn(batch.getUpdatedOn())
                .build();
    }

    /**
     * Transition batch to QUALITY_PENDING status
     */
    @Transactional
    public BatchDTO.StatusUpdateResponse sendForQualityCheck(Long batchId) {
        log.info("Sending batch for quality check: {}", batchId);

        String currentUser = getCurrentUser();
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));
        String oldStatus = batch.getStatus();

        // Validate current status
        if (!Batch.STATUS_PRODUCED.equals(oldStatus)) {
            throw new RuntimeException("Only PRODUCED batches can be sent for quality check. Current status: " + oldStatus);
        }

        // Update status
        batch.setStatus(Batch.STATUS_QUALITY_PENDING);
        batch.setUpdatedBy(currentUser);
        batchRepository.save(batch);

        log.info("Batch {} sent for quality check by {}", batchId, currentUser);
        auditService.logStatusChange("BATCH", batchId, oldStatus, Batch.STATUS_QUALITY_PENDING);

        return BatchDTO.StatusUpdateResponse.builder()
                .batchId(batchId)
                .batchNumber(batch.getBatchNumber())
                .previousStatus(oldStatus)
                .newStatus(Batch.STATUS_QUALITY_PENDING)
                .message("Batch sent for quality check")
                .updatedBy(currentUser)
                .updatedOn(batch.getUpdatedOn())
                .build();
    }

    /**
     * Get batches by status
     */
    public List<BatchDTO> getBatchesByStatus(String status) {
        log.info("Fetching batches by status: {}", status);
        return batchRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Create a new batch.
     *
     * WARNING: Per MES Batch Management Specification, batches should ONLY be created
     * at operation boundaries (via ProductionService.confirmProduction()).
     * This method is retained for system/administrative use only.
     *
     * @deprecated Use ProductionService.confirmProduction() for normal batch creation.
     *             This endpoint may be restricted or removed in future versions.
     */
    @Transactional
    @Deprecated
    public BatchDTO createBatch(BatchDTO.CreateBatchRequest request) {
        log.warn("DEPRECATED: Direct batch creation used for batch: {}. " +
                "Batches should be created via production confirmation.", request.getBatchNumber());

        if (batchRepository.existsByBatchNumber(request.getBatchNumber())) {
            throw new RuntimeException("Batch number already exists: " + request.getBatchNumber());
        }

        String currentUser = getCurrentUser();

        Batch batch = Batch.builder()
                .batchNumber(request.getBatchNumber())
                .materialId(request.getMaterialId())
                .materialName(request.getMaterialName())
                .quantity(request.getQuantity())
                .unit(request.getUnit() != null ? request.getUnit() : "T")
                .status(Batch.STATUS_AVAILABLE)
                .createdVia("MANUAL") // Track that this was manually created
                .createdBy(currentUser)
                .build();

        batch = batchRepository.save(batch);
        log.info("Batch created with ID: {} (via MANUAL creation)", batch.getBatchId());
        auditService.logCreate("BATCH", batch.getBatchId(),
                "Batch created MANUALLY (not via production): " + request.getBatchNumber());

        // Audit: Log batch number generation per MES Batch Number Specification
        auditService.logBatchNumberGenerated(
                batch.getBatchId(),
                request.getBatchNumber(),
                null, // Manual creation has no source operation
                "MANUAL entry",
                Batch.CREATED_VIA_MANUAL
        );

        return convertToDTO(batch);
    }

    /**
     * Update an existing batch (metadata only - quantity changes require adjustQuantity).
     *
     * Per MES Batch Management Specification: batch quantity is NEVER edited directly.
     * Use adjustQuantity() method for quantity changes with mandatory reason.
     */
    @Transactional
    public BatchDTO updateBatch(Long batchId, BatchDTO.UpdateBatchRequest request) {
        log.info("Updating batch metadata: {}", batchId);

        String currentUser = getCurrentUser();
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));

        // Reject updates to terminal states
        if (Batch.STATUS_CONSUMED.equals(batch.getStatus())) {
            throw new RuntimeException("Cannot update consumed batch");
        }
        if (Batch.STATUS_SCRAPPED.equals(batch.getStatus())) {
            throw new RuntimeException("Cannot update scrapped batch");
        }

        // Validate unique batch number if changed
        if (request.getBatchNumber() != null && !request.getBatchNumber().equals(batch.getBatchNumber())) {
            if (batchRepository.existsByBatchNumber(request.getBatchNumber())) {
                throw new RuntimeException("Batch number already exists: " + request.getBatchNumber());
            }
            batch.setBatchNumber(request.getBatchNumber());
        }

        if (request.getMaterialId() != null) batch.setMaterialId(request.getMaterialId());
        if (request.getMaterialName() != null) batch.setMaterialName(request.getMaterialName());
        // REMOVED: Direct quantity updates are not allowed per MES spec
        // Use adjustQuantity() with mandatory reason instead
        if (request.getUnit() != null) batch.setUnit(request.getUnit());
        if (request.getStatus() != null) {
            String oldStatus = batch.getStatus();
            batch.setStatus(request.getStatus());
            if (!oldStatus.equals(request.getStatus())) {
                auditService.logStatusChange("BATCH", batchId, oldStatus, request.getStatus());
            }
        }

        batch.setUpdatedBy(currentUser);
        batch = batchRepository.save(batch);
        log.info("Batch {} metadata updated by {}", batchId, currentUser);
        auditService.logUpdate("BATCH", batchId, "batch", null, "Batch metadata updated");

        return convertToDTO(batch);
    }

    /**
     * Adjust batch quantity with mandatory reason and full audit trail.
     * Per MES Batch Management Specification: this is the ONLY way to change batch quantity.
     *
     * @param batchId The batch ID to adjust
     * @param request The adjustment request with new quantity, reason, and type
     * @return Response with adjustment details
     */
    @Transactional
    public BatchDTO.AdjustQuantityResponse adjustQuantity(Long batchId, BatchDTO.AdjustQuantityRequest request) {
        log.info("Adjusting quantity for batch {} - type: {}, reason: {}",
                batchId, request.getAdjustmentType(), request.getReason());

        String currentUser = getCurrentUser();
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));

        // Validate reason is provided (mandatory per MES spec)
        if (request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new RuntimeException("A reason is required for quantity adjustments");
        }

        // Validate batch state
        if (Batch.STATUS_CONSUMED.equals(batch.getStatus())) {
            throw new RuntimeException("Cannot adjust quantity of consumed batch");
        }
        if (Batch.STATUS_SCRAPPED.equals(batch.getStatus())) {
            throw new RuntimeException("Cannot adjust quantity of scrapped batch");
        }

        // Validate adjustment type
        if (!isValidAdjustmentType(request.getAdjustmentType())) {
            throw new RuntimeException("Invalid adjustment type: " + request.getAdjustmentType() +
                    ". Valid types: CORRECTION, INVENTORY_COUNT, DAMAGE, SCRAP_RECOVERY, SYSTEM");
        }

        // Validate new quantity
        if (request.getNewQuantity() == null || request.getNewQuantity().compareTo(java.math.BigDecimal.ZERO) < 0) {
            throw new RuntimeException("New quantity must be non-negative");
        }

        java.math.BigDecimal oldQuantity = batch.getQuantity();
        java.math.BigDecimal newQuantity = request.getNewQuantity();
        java.math.BigDecimal difference = newQuantity.subtract(oldQuantity);

        // Create adjustment record
        BatchQuantityAdjustment adjustment = BatchQuantityAdjustment.builder()
                .batch(batch)
                .oldQuantity(oldQuantity)
                .newQuantity(newQuantity)
                .adjustmentReason(request.getReason())
                .adjustmentType(request.getAdjustmentType())
                .adjustedBy(currentUser)
                .build();
        adjustmentRepository.save(adjustment);

        // Update batch quantity
        batch.setQuantity(newQuantity);
        batch.setUpdatedBy(currentUser);
        batchRepository.save(batch);

        // Audit log
        auditService.logUpdate("BATCH", batchId, "quantity",
                oldQuantity.toString(), newQuantity.toString());
        auditService.logCreate("BATCH_ADJUSTMENT", adjustment.getAdjustmentId(),
                String.format("Batch %s quantity adjusted: %s -> %s (%s). Reason: %s",
                        batch.getBatchNumber(), oldQuantity, newQuantity,
                        request.getAdjustmentType(), request.getReason()));

        log.info("Batch {} quantity adjusted from {} to {} by {} - reason: {}",
                batchId, oldQuantity, newQuantity, currentUser, request.getReason());

        return BatchDTO.AdjustQuantityResponse.builder()
                .batchId(batchId)
                .batchNumber(batch.getBatchNumber())
                .previousQuantity(oldQuantity)
                .newQuantity(newQuantity)
                .quantityDifference(difference)
                .adjustmentType(request.getAdjustmentType())
                .reason(request.getReason())
                .adjustedBy(currentUser)
                .adjustedOn(adjustment.getAdjustedOn())
                .message("Quantity adjusted successfully")
                .build();
    }

    /**
     * Get quantity adjustment history for a batch
     */
    public java.util.List<BatchDTO.QuantityAdjustmentHistory> getAdjustmentHistory(Long batchId) {
        log.info("Fetching adjustment history for batch: {}", batchId);

        // Verify batch exists
        if (!batchRepository.existsById(batchId)) {
            throw new RuntimeException("Batch not found: " + batchId);
        }

        return adjustmentRepository.findByBatchBatchIdOrderByAdjustedOnDesc(batchId).stream()
                .map(adj -> BatchDTO.QuantityAdjustmentHistory.builder()
                        .adjustmentId(adj.getAdjustmentId())
                        .oldQuantity(adj.getOldQuantity())
                        .newQuantity(adj.getNewQuantity())
                        .difference(adj.getQuantityDifference())
                        .adjustmentType(adj.getAdjustmentType())
                        .reason(adj.getAdjustmentReason())
                        .adjustedBy(adj.getAdjustedBy())
                        .adjustedOn(adj.getAdjustedOn())
                        .build())
                .collect(java.util.stream.Collectors.toList());
    }

    private boolean isValidAdjustmentType(String type) {
        return BatchQuantityAdjustment.TYPE_CORRECTION.equals(type) ||
                BatchQuantityAdjustment.TYPE_INVENTORY_COUNT.equals(type) ||
                BatchQuantityAdjustment.TYPE_DAMAGE.equals(type) ||
                BatchQuantityAdjustment.TYPE_SCRAP_RECOVERY.equals(type) ||
                BatchQuantityAdjustment.TYPE_SYSTEM.equals(type);
    }

    /**
     * Delete a batch (soft delete via status=SCRAPPED)
     */
    @Transactional
    public BatchDTO.StatusUpdateResponse deleteBatch(Long batchId) {
        log.info("Deleting (scrapping) batch: {}", batchId);

        String currentUser = getCurrentUser();
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));
        String oldStatus = batch.getStatus();

        if (Batch.STATUS_CONSUMED.equals(oldStatus)) {
            throw new RuntimeException("Cannot delete consumed batch");
        }
        if (Batch.STATUS_SCRAPPED.equals(oldStatus)) {
            throw new RuntimeException("Batch is already scrapped");
        }

        batch.setStatus(Batch.STATUS_SCRAPPED);
        batch.setUpdatedBy(currentUser);
        batchRepository.save(batch);

        log.info("Batch {} deleted (scrapped) by {}", batchId, currentUser);
        auditService.logStatusChange("BATCH", batchId, oldStatus, Batch.STATUS_SCRAPPED);

        return BatchDTO.StatusUpdateResponse.builder()
                .batchId(batchId)
                .batchNumber(batch.getBatchNumber())
                .previousStatus(oldStatus)
                .newStatus(Batch.STATUS_SCRAPPED)
                .message("Batch deleted (scrapped)")
                .updatedBy(currentUser)
                .updatedOn(batch.getUpdatedOn())
                .build();
    }

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
    }

    // ===== B16-B19: Validation & Constraint Methods =====

    /**
     * B16: Validate split quantity invariant.
     * Verifies that sum of child batch quantities equals the consumed amount from parent.
     */
    public BatchDTO.ValidationResult validateSplitInvariant(Long parentBatchId) {
        log.info("Validating split invariant for batch: {}", parentBatchId);

        Batch parentBatch = batchRepository.findById(parentBatchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + parentBatchId));

        // Get all child relations of type SPLIT
        List<BatchRelation> splitRelations = batchRelationRepository.findChildRelations(parentBatchId).stream()
                .filter(rel -> "SPLIT".equals(rel.getRelationType()))
                .collect(Collectors.toList());

        if (splitRelations.isEmpty()) {
            return BatchDTO.ValidationResult.builder()
                    .valid(true)
                    .message("No split relations found for batch")
                    .batchId(parentBatchId)
                    .batchNumber(parentBatch.getBatchNumber())
                    .build();
        }

        // Sum of quantityConsumed from relations
        java.math.BigDecimal totalConsumed = splitRelations.stream()
                .map(BatchRelation::getQuantityConsumed)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        // Sum of child batch quantities
        java.math.BigDecimal totalChildQty = splitRelations.stream()
                .map(rel -> rel.getChildBatch().getQuantity())
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        // Invariant: sum(children.quantity) should equal totalConsumed
        boolean valid = totalConsumed.compareTo(totalChildQty) == 0;

        return BatchDTO.ValidationResult.builder()
                .valid(valid)
                .message(valid ? "Split invariant valid" :
                        String.format("Split invariant violated: consumed=%s, children total=%s",
                                totalConsumed, totalChildQty))
                .batchId(parentBatchId)
                .batchNumber(parentBatch.getBatchNumber())
                .details(java.util.Map.of(
                        "totalConsumed", totalConsumed.toString(),
                        "totalChildQuantity", totalChildQty.toString(),
                        "childBatchCount", String.valueOf(splitRelations.size())
                ))
                .build();
    }

    /**
     * B17: Validate merge quantity invariant.
     * Verifies that sum of parent batch quantities equals the merged batch quantity.
     */
    public BatchDTO.ValidationResult validateMergeInvariant(Long mergedBatchId) {
        log.info("Validating merge invariant for batch: {}", mergedBatchId);

        Batch mergedBatch = batchRepository.findById(mergedBatchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + mergedBatchId));

        // Get all parent relations of type MERGE
        List<BatchRelation> mergeRelations = batchRelationRepository.findParentRelations(mergedBatchId).stream()
                .filter(rel -> "MERGE".equals(rel.getRelationType()))
                .collect(Collectors.toList());

        if (mergeRelations.isEmpty()) {
            return BatchDTO.ValidationResult.builder()
                    .valid(true)
                    .message("No merge relations found for batch")
                    .batchId(mergedBatchId)
                    .batchNumber(mergedBatch.getBatchNumber())
                    .build();
        }

        // Sum of quantityConsumed from parents
        java.math.BigDecimal totalConsumed = mergeRelations.stream()
                .map(BatchRelation::getQuantityConsumed)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        // Merged batch quantity
        java.math.BigDecimal mergedQty = mergedBatch.getQuantity();

        // Invariant: sum(parents.quantityConsumed) should equal merged.quantity
        boolean valid = totalConsumed.compareTo(mergedQty) == 0;

        return BatchDTO.ValidationResult.builder()
                .valid(valid)
                .message(valid ? "Merge invariant valid" :
                        String.format("Merge invariant violated: parents total=%s, merged=%s",
                                totalConsumed, mergedQty))
                .batchId(mergedBatchId)
                .batchNumber(mergedBatch.getBatchNumber())
                .details(java.util.Map.of(
                        "totalParentQuantity", totalConsumed.toString(),
                        "mergedQuantity", mergedQty.toString(),
                        "parentBatchCount", String.valueOf(mergeRelations.size())
                ))
                .build();
    }

    /**
     * B18: Check if a batch relation can be deleted.
     * Prevents deletion of genealogy records (BatchRelation) to maintain traceability.
     */
    public boolean canDeleteBatchRelation(Long relationId) {
        log.info("Checking if batch relation {} can be deleted", relationId);

        BatchRelation relation = batchRelationRepository.findById(relationId)
                .orElseThrow(() -> new RuntimeException("Batch relation not found: " + relationId));

        // Genealogy records should NEVER be deleted - only soft-deleted via status
        // Active relations cannot be deleted
        if ("ACTIVE".equals(relation.getStatus())) {
            log.warn("Attempt to delete active batch relation {} blocked", relationId);
            return false;
        }

        return true;
    }

    /**
     * B18: Soft delete a batch relation (set status to DELETED).
     * Hard delete is blocked to maintain genealogy integrity.
     */
    @Transactional
    public void softDeleteBatchRelation(Long relationId, String reason) {
        log.info("Soft deleting batch relation: {}", relationId);

        BatchRelation relation = batchRelationRepository.findById(relationId)
                .orElseThrow(() -> new RuntimeException("Batch relation not found: " + relationId));

        String currentUser = getCurrentUser();

        relation.setStatus("DELETED");
        // Note: BatchRelation uses createdBy field, not updatedBy
        batchRelationRepository.save(relation);

        auditService.logDelete("BATCH_RELATION", relationId,
                String.format("Batch relation soft-deleted by %s. Reason: %s", currentUser, reason));
    }

    /**
     * B19: Check if a batch is on hold before allowing consumption.
     * Returns true if batch can be consumed, false if on hold.
     */
    public boolean canConsumeBatch(Long batchId) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));

        // Check if batch is in a consumable state
        if (!Batch.STATUS_AVAILABLE.equals(batch.getStatus())) {
            log.warn("Batch {} cannot be consumed - status: {}", batchId, batch.getStatus());
            return false;
        }

        // Check for active holds on the batch
        // This requires checking HoldRecord table
        return !isOnHold(batchId);
    }

    /**
     * B19: Check if a batch has an active hold.
     */
    private boolean isOnHold(Long batchId) {
        // Query hold_records table for active holds on this batch
        // Note: This assumes HoldRecordRepository exists with appropriate method
        // For now, we check batch status for BLOCKED which indicates a hold
        Batch batch = batchRepository.findById(batchId).orElse(null);
        if (batch == null) return false;

        return Batch.STATUS_BLOCKED.equals(batch.getStatus());
    }

    /**
     * B19: Validate batch consumption with ON_HOLD check.
     * Throws exception if batch is on hold.
     */
    public void validateBatchForConsumption(Long batchId) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));

        if (Batch.STATUS_BLOCKED.equals(batch.getStatus())) {
            throw new RuntimeException("Cannot consume batch " + batch.getBatchNumber() +
                    ": batch is BLOCKED (on hold)");
        }

        if (!Batch.STATUS_AVAILABLE.equals(batch.getStatus())) {
            throw new RuntimeException("Cannot consume batch " + batch.getBatchNumber() +
                    ": batch status is " + batch.getStatus() + ", expected AVAILABLE");
        }
    }

    /**
     * Validate all genealogy invariants for a batch and its relations.
     */
    public java.util.List<BatchDTO.ValidationResult> validateGenealogyIntegrity(Long batchId) {
        log.info("Validating genealogy integrity for batch: {}", batchId);

        java.util.List<BatchDTO.ValidationResult> results = new java.util.ArrayList<>();

        // Validate split invariant
        results.add(validateSplitInvariant(batchId));

        // Validate merge invariant
        results.add(validateMergeInvariant(batchId));

        // Check child batches recursively (limit depth to prevent infinite loops)
        List<BatchRelation> childRelations = batchRelationRepository.findChildRelations(batchId);
        for (BatchRelation rel : childRelations) {
            results.add(validateSplitInvariant(rel.getChildBatch().getBatchId()));
            results.add(validateMergeInvariant(rel.getChildBatch().getBatchId()));
        }

        return results.stream()
                .filter(r -> r != null && !r.isValid())
                .collect(Collectors.toList());
    }
}
