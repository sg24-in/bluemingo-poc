package com.mes.production.controller;

import com.mes.production.dto.BomDTO;
import com.mes.production.service.BomValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bom")
@RequiredArgsConstructor
@Slf4j
public class BomController {

    private final BomValidationService bomValidationService;

    /**
     * Get BOM requirements for a product
     */
    @GetMapping("/{productSku}/requirements")
    public ResponseEntity<BomDTO.BomTreeResponse> getBomRequirements(@PathVariable String productSku) {
        log.info("GET /api/bom/{}/requirements", productSku);
        return ResponseEntity.ok(bomValidationService.getBomRequirements(productSku));
    }

    /**
     * Get BOM requirements for a specific level
     */
    @GetMapping("/{productSku}/requirements/level/{level}")
    public ResponseEntity<List<BomDTO.BomRequirement>> getBomRequirementsForLevel(
            @PathVariable String productSku,
            @PathVariable Integer level) {
        log.info("GET /api/bom/{}/requirements/level/{}", productSku, level);
        return ResponseEntity.ok(bomValidationService.getBomRequirementsForLevel(productSku, level));
    }

    /**
     * Validate material consumption against BOM
     */
    @PostMapping("/validate")
    public ResponseEntity<BomDTO.BomValidationResult> validateConsumption(
            @RequestBody BomDTO.BomValidationRequest request) {
        log.info("POST /api/bom/validate for product: {}", request.getProductSku());
        return ResponseEntity.ok(bomValidationService.validateConsumption(request));
    }

    /**
     * Get suggested material consumption for an operation based on BOM
     * Returns pre-populated quantities and available batches
     */
    @GetMapping("/operation/{operationId}/suggested-consumption")
    public ResponseEntity<BomDTO.SuggestedConsumptionResponse> getSuggestedConsumption(
            @PathVariable Long operationId) {
        log.info("GET /api/bom/operation/{}/suggested-consumption", operationId);
        return ResponseEntity.ok(bomValidationService.getSuggestedConsumption(operationId));
    }
}
