package com.mes.production.controller;

import com.mes.production.dto.BatchDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.service.BatchNumberService;
import com.mes.production.service.BatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/batches")
@RequiredArgsConstructor
@Slf4j
public class BatchController {

    private final BatchService batchService;
    private final BatchNumberService batchNumberService;

    /**
     * Get all batches (legacy - non-paginated)
     */
    @GetMapping
    public ResponseEntity<List<BatchDTO>> getAllBatches() {
        log.info("GET /api/batches");
        List<BatchDTO> batches = batchService.getAllBatches();
        return ResponseEntity.ok(batches);
    }

    /**
     * P07: Preview the next batch number WITHOUT incrementing the sequence.
     * Used to show users what the next batch number will be before confirmation.
     *
     * @param operationType The operation type (e.g., FURNACE, ROLLING)
     * @param productSku    The product SKU (optional)
     * @return Preview of the next batch number that would be generated
     */
    @GetMapping("/preview-number")
    public ResponseEntity<BatchDTO.BatchNumberPreview> previewBatchNumber(
            @RequestParam(required = false) String operationType,
            @RequestParam(required = false) String productSku) {
        log.info("GET /api/batches/preview-number - operationType={}, productSku={}", operationType, productSku);

        String previewNumber = batchNumberService.previewBatchNumber(operationType, productSku);

        BatchDTO.BatchNumberPreview response = new BatchDTO.BatchNumberPreview();
        response.setPreviewBatchNumber(previewNumber);
        response.setOperationType(operationType);
        response.setProductSku(productSku);

        return ResponseEntity.ok(response);
    }

    /**
     * Get batches with pagination, sorting, and filtering.
     */
    @GetMapping("/paged")
    public ResponseEntity<PagedResponseDTO<BatchDTO>> getBatchesPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {

        log.info("GET /api/batches/paged - page={}, size={}, status={}, search={}",
                page, size, status, search);

        PageRequestDTO pageRequest = PageRequestDTO.builder()
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .search(search)
                .status(status)
                .build();

        PagedResponseDTO<BatchDTO> result = batchService.getBatchesPaged(pageRequest);
        return ResponseEntity.ok(result);
    }

    /**
     * Get batch by ID
     */
    @GetMapping("/{batchId}")
    public ResponseEntity<BatchDTO> getBatchById(@PathVariable Long batchId) {
        log.info("GET /api/batches/{}", batchId);
        BatchDTO batch = batchService.getBatchById(batchId);
        return ResponseEntity.ok(batch);
    }

    /**
     * Get batch genealogy (traceability)
     */
    @GetMapping("/{batchId}/genealogy")
    public ResponseEntity<BatchDTO.Genealogy> getBatchGenealogy(@PathVariable Long batchId) {
        log.info("GET /api/batches/{}/genealogy", batchId);
        BatchDTO.Genealogy genealogy = batchService.getBatchGenealogy(batchId);
        return ResponseEntity.ok(genealogy);
    }

    /**
     * Create a new batch - BLOCKED.
     *
     * Per MES Batch Management Specification, batches should ONLY be created
     * at operation boundaries via production confirmation or material receipt.
     *
     * Use these endpoints instead:
     * - POST /api/production/confirm - Create batch via production confirmation
     * - POST /api/receive-material - Create batch via raw material receipt
     *
     * @deprecated This endpoint is disabled. Returns 403 Forbidden.
     */
    @PostMapping
    @Deprecated
    public ResponseEntity<BatchDTO> createBatch(
            @Valid @RequestBody BatchDTO.CreateBatchRequest request) {
        log.error("BLOCKED: Manual batch creation attempted for batch: {}. Use production confirmation or material receipt.",
                  request.getBatchNumber());
        throw new RuntimeException("Manual batch creation is not allowed. " +
                "Batches must be created via production confirmation (POST /api/production/confirm) " +
                "or material receipt (POST /api/receive-material).");
    }

    /**
     * Update a batch
     */
    @PutMapping("/{batchId}")
    public ResponseEntity<BatchDTO> updateBatch(
            @PathVariable Long batchId,
            @Valid @RequestBody BatchDTO.UpdateBatchRequest request) {
        log.info("PUT /api/batches/{}", batchId);
        BatchDTO updated = batchService.updateBatch(batchId, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a batch (soft delete via scrap)
     */
    @DeleteMapping("/{batchId}")
    public ResponseEntity<BatchDTO.StatusUpdateResponse> deleteBatch(@PathVariable Long batchId) {
        log.info("DELETE /api/batches/{}", batchId);
        BatchDTO.StatusUpdateResponse response = batchService.deleteBatch(batchId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get available batches by material ID
     */
    @GetMapping("/available")
    public ResponseEntity<List<BatchDTO>> getAvailableBatches(
            @RequestParam(required = false) String materialId) {
        log.info("GET /api/batches/available, materialId={}", materialId);

        List<BatchDTO> batches;
        if (materialId != null && !materialId.isEmpty()) {
            batches = batchService.getAvailableBatchesByMaterial(materialId);
        } else {
            batches = batchService.getAllBatches();
        }
        return ResponseEntity.ok(batches);
    }

    /**
     * Get batches by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<BatchDTO>> getBatchesByStatus(@PathVariable String status) {
        log.info("GET /api/batches/status/{}", status);
        List<BatchDTO> batches = batchService.getBatchesByStatus(status);
        return ResponseEntity.ok(batches);
    }

    /**
     * Get produced batches pending approval
     */
    @GetMapping("/produced")
    public ResponseEntity<List<BatchDTO>> getProducedBatches() {
        log.info("GET /api/batches/produced");
        List<BatchDTO> batches = batchService.getProducedBatches();
        return ResponseEntity.ok(batches);
    }

}
