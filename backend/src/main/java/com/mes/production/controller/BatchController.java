package com.mes.production.controller;

import com.mes.production.dto.BatchDTO;
import com.mes.production.service.BatchService;
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

    /**
     * Get all batches
     */
    @GetMapping
    public ResponseEntity<List<BatchDTO>> getAllBatches() {
        log.info("GET /api/batches");
        List<BatchDTO> batches = batchService.getAllBatches();
        return ResponseEntity.ok(batches);
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
}
