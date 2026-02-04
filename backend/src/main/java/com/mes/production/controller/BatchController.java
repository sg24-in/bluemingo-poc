package com.mes.production.controller;

import com.mes.production.dto.BatchDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.service.BatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/batches")
@RequiredArgsConstructor
@Slf4j
public class BatchController {

    private final BatchService batchService;

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
     * Split a batch into multiple smaller batches
     */
    @PostMapping("/{batchId}/split")
    public ResponseEntity<BatchDTO.SplitResponse> splitBatch(
            @PathVariable Long batchId,
            @Valid @RequestBody BatchDTO.SplitRequest request,
            Authentication authentication) {
        log.info("POST /api/batches/{}/split", batchId);

        // Ensure the path batchId matches the request
        request.setSourceBatchId(batchId);

        String userId = authentication != null ? authentication.getName() : "system";
        BatchDTO.SplitResponse response = batchService.splitBatch(request, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Merge multiple batches into one
     */
    @PostMapping("/merge")
    public ResponseEntity<BatchDTO.MergeResponse> mergeBatches(
            @Valid @RequestBody BatchDTO.MergeRequest request,
            Authentication authentication) {
        log.info("POST /api/batches/merge - Merging {} batches",
                request.getSourceBatchIds() != null ? request.getSourceBatchIds().size() : 0);

        String userId = authentication != null ? authentication.getName() : "system";
        BatchDTO.MergeResponse response = batchService.mergeBatches(request, userId);
        return ResponseEntity.ok(response);
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

    /**
     * Send batch for quality check
     */
    @PostMapping("/{batchId}/quality-check")
    public ResponseEntity<BatchDTO.StatusUpdateResponse> sendForQualityCheck(@PathVariable Long batchId) {
        log.info("POST /api/batches/{}/quality-check", batchId);
        BatchDTO.StatusUpdateResponse response = batchService.sendForQualityCheck(batchId);
        return ResponseEntity.ok(response);
    }

    /**
     * Approve a batch
     */
    @PostMapping("/{batchId}/approve")
    public ResponseEntity<BatchDTO.StatusUpdateResponse> approveBatch(@PathVariable Long batchId) {
        log.info("POST /api/batches/{}/approve", batchId);
        BatchDTO.StatusUpdateResponse response = batchService.approveBatch(batchId);
        return ResponseEntity.ok(response);
    }

    /**
     * Reject a batch
     */
    @PostMapping("/{batchId}/reject")
    public ResponseEntity<BatchDTO.StatusUpdateResponse> rejectBatch(
            @PathVariable Long batchId,
            @RequestBody BatchDTO.RejectionRequest request) {
        log.info("POST /api/batches/{}/reject", batchId);
        BatchDTO.StatusUpdateResponse response = batchService.rejectBatch(batchId, request.getReason());
        return ResponseEntity.ok(response);
    }
}
