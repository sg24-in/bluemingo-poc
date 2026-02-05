package com.mes.production.controller;

import com.mes.production.dto.BomDTO;
import com.mes.production.service.BomService;
import com.mes.production.service.BomValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bom")
@RequiredArgsConstructor
@Slf4j
public class BomController {

    private final BomValidationService bomValidationService;
    private final BomService bomService;

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

    // =====================================================
    // BOM Tree CRUD Endpoints
    // =====================================================

    /**
     * Get full BOM tree for a product (hierarchical structure)
     */
    @GetMapping("/{productSku}/tree")
    public ResponseEntity<BomDTO.BomTreeFullResponse> getBomTree(@PathVariable String productSku) {
        log.info("GET /api/bom/{}/tree", productSku);
        return ResponseEntity.ok(bomService.getBomTree(productSku));
    }

    /**
     * Get BOM tree for a specific version
     */
    @GetMapping("/{productSku}/tree/version/{version}")
    public ResponseEntity<BomDTO.BomTreeFullResponse> getBomTreeByVersion(
            @PathVariable String productSku,
            @PathVariable String version) {
        log.info("GET /api/bom/{}/tree/version/{}", productSku, version);
        return ResponseEntity.ok(bomService.getBomTreeByVersion(productSku, version));
    }

    /**
     * Get flat list of BOM nodes (for table view)
     */
    @GetMapping("/{productSku}/list")
    public ResponseEntity<List<BomDTO.BomListResponse>> getBomList(@PathVariable String productSku) {
        log.info("GET /api/bom/{}/list", productSku);
        return ResponseEntity.ok(bomService.getBomList(productSku));
    }

    /**
     * Get a single BOM node by ID
     */
    @GetMapping("/node/{bomId}")
    public ResponseEntity<BomDTO.BomTreeNode> getBomNode(@PathVariable Long bomId) {
        log.info("GET /api/bom/node/{}", bomId);
        return ResponseEntity.ok(bomService.getBomNode(bomId));
    }

    /**
     * Get all products that have BOMs defined
     */
    @GetMapping("/products")
    public ResponseEntity<List<BomDTO.BomProductSummary>> getAllProducts() {
        log.info("GET /api/bom/products");
        return ResponseEntity.ok(bomService.getAllProducts());
    }

    /**
     * Get versions available for a product
     */
    @GetMapping("/{productSku}/versions")
    public ResponseEntity<List<String>> getVersionsForProduct(@PathVariable String productSku) {
        log.info("GET /api/bom/{}/versions", productSku);
        return ResponseEntity.ok(bomService.getVersionsForProduct(productSku));
    }

    /**
     * Create a single BOM node
     */
    @PostMapping("/node")
    public ResponseEntity<BomDTO.BomTreeNode> createBomNode(@RequestBody BomDTO.CreateBomNodeRequest request) {
        log.info("POST /api/bom/node for product: {}", request.getProductSku());
        return ResponseEntity.ok(bomService.createBomNode(request));
    }

    /**
     * Create a full BOM tree (multiple nodes at once)
     */
    @PostMapping("/tree")
    public ResponseEntity<BomDTO.BomTreeFullResponse> createBomTree(@RequestBody BomDTO.CreateBomTreeRequest request) {
        log.info("POST /api/bom/tree for product: {}", request.getProductSku());
        return ResponseEntity.ok(bomService.createBomTree(request));
    }

    /**
     * Update a BOM node
     */
    @PutMapping("/node/{bomId}")
    public ResponseEntity<BomDTO.BomTreeNode> updateBomNode(
            @PathVariable Long bomId,
            @RequestBody BomDTO.UpdateBomNodeRequest request) {
        log.info("PUT /api/bom/node/{}", bomId);
        return ResponseEntity.ok(bomService.updateBomNode(bomId, request));
    }

    /**
     * Update top-level BOM settings (version, status) for all nodes of a product
     */
    @PutMapping("/{productSku}/settings")
    public ResponseEntity<BomDTO.UpdateBomSettingsResponse> updateBomSettings(
            @PathVariable String productSku,
            @RequestBody BomDTO.UpdateBomSettingsRequest request) {
        log.info("PUT /api/bom/{}/settings", productSku);
        return ResponseEntity.ok(bomService.updateBomSettings(productSku, request));
    }

    /**
     * Move a BOM node to a new parent
     */
    @PutMapping("/node/{bomId}/move")
    public ResponseEntity<BomDTO.BomTreeNode> moveBomNode(
            @PathVariable Long bomId,
            @RequestBody BomDTO.MoveBomNodeRequest request) {
        log.info("PUT /api/bom/node/{}/move", bomId);
        return ResponseEntity.ok(bomService.moveBomNode(bomId, request));
    }

    /**
     * Delete a BOM node (soft delete)
     */
    @DeleteMapping("/node/{bomId}")
    public ResponseEntity<Map<String, String>> deleteBomNode(@PathVariable Long bomId) {
        log.info("DELETE /api/bom/node/{}", bomId);
        bomService.deleteBomNode(bomId);
        return ResponseEntity.ok(Map.of("message", "BOM node deleted successfully"));
    }

    /**
     * Delete a BOM node and all its children (cascade)
     */
    @DeleteMapping("/node/{bomId}/cascade")
    public ResponseEntity<Map<String, Object>> deleteBomNodeCascade(@PathVariable Long bomId) {
        log.info("DELETE /api/bom/node/{}/cascade", bomId);
        int deletedCount = bomService.deleteBomNodeCascade(bomId);
        return ResponseEntity.ok(Map.of(
                "message", "BOM node and children deleted successfully",
                "deletedCount", deletedCount
        ));
    }

    /**
     * Delete entire BOM tree for a product
     */
    @DeleteMapping("/{productSku}/tree")
    public ResponseEntity<Map<String, Object>> deleteBomTree(@PathVariable String productSku) {
        log.info("DELETE /api/bom/{}/tree", productSku);
        int deletedCount = bomService.deleteBomTree(productSku);
        return ResponseEntity.ok(Map.of(
                "message", "BOM tree deleted successfully",
                "deletedCount", deletedCount
        ));
    }
}
