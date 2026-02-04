package com.mes.production.service;

import com.mes.production.dto.BatchDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.entity.Batch;
import com.mes.production.entity.BatchRelation;
import com.mes.production.entity.Operation;
import com.mes.production.repository.BatchRelationRepository;
import com.mes.production.repository.BatchRepository;
import com.mes.production.repository.OperationRepository;
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
    private final OperationRepository operationRepository;
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
                productionInfo = BatchDTO.ProductionInfo.builder()
                        .operationId(op.getOperationId())
                        .operationName(op.getOperationName())
                        .processName(op.getProcess().getStageName())
                        .orderId(op.getProcess().getOrderLineItem().getOrder().getOrderId().toString())
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
                .approvedBy(batch.getApprovedBy())
                .approvedOn(batch.getApprovedOn())
                .rejectionReason(batch.getRejectionReason())
                .rejectedBy(batch.getRejectedBy())
                .rejectedOn(batch.getRejectedOn())
                .build();
    }

    /**
     * Split a batch into multiple smaller batches
     */
    @Transactional
    public BatchDTO.SplitResponse splitBatch(BatchDTO.SplitRequest request, String userId) {
        log.info("Splitting batch: {}", request.getSourceBatchId());

        Batch sourceBatch = batchRepository.findById(request.getSourceBatchId())
                .orElseThrow(() -> new RuntimeException("Batch not found: " + request.getSourceBatchId()));

        // Validate batch is available
        if (!"AVAILABLE".equals(sourceBatch.getStatus())) {
            throw new RuntimeException("Only AVAILABLE batches can be split");
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

            // Create new batch
            Batch newBatch = Batch.builder()
                    .batchNumber(newBatchNumber)
                    .materialId(sourceBatch.getMaterialId())
                    .materialName(sourceBatch.getMaterialName())
                    .quantity(portion.getQuantity())
                    .unit(sourceBatch.getUnit())
                    .status("AVAILABLE")
                    .createdBy(userId)
                    .build();

            newBatch = batchRepository.save(newBatch);

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
        }

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
                .createdBy(userId)
                .build();

        mergedBatch = batchRepository.save(mergedBatch);

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

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
    }
}
