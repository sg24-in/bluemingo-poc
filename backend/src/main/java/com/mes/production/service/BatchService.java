package com.mes.production.service;

import com.mes.production.dto.BatchDTO;
import com.mes.production.entity.Batch;
import com.mes.production.entity.BatchRelation;
import com.mes.production.entity.Operation;
import com.mes.production.repository.BatchRelationRepository;
import com.mes.production.repository.BatchRepository;
import com.mes.production.repository.OperationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
                .build();
    }
}
