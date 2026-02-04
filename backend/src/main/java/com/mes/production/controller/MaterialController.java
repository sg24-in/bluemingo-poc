package com.mes.production.controller;

import com.mes.production.dto.MaterialDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.service.MaterialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/materials")
@RequiredArgsConstructor
@Slf4j
public class MaterialController {

    private final MaterialService materialService;

    /**
     * Get all materials (non-paginated)
     */
    @GetMapping
    public ResponseEntity<List<MaterialDTO>> getAllMaterials() {
        log.info("GET /api/materials");
        List<MaterialDTO> materials = materialService.getAllMaterials();
        return ResponseEntity.ok(materials);
    }

    /**
     * Get all active materials (for dropdowns)
     */
    @GetMapping("/active")
    public ResponseEntity<List<MaterialDTO>> getActiveMaterials() {
        log.info("GET /api/materials/active");
        List<MaterialDTO> materials = materialService.getActiveMaterials();
        return ResponseEntity.ok(materials);
    }

    /**
     * Get active materials by type
     */
    @GetMapping("/active/type/{type}")
    public ResponseEntity<List<MaterialDTO>> getActiveMaterialsByType(@PathVariable String type) {
        log.info("GET /api/materials/active/type/{}", type);
        List<MaterialDTO> materials = materialService.getActiveMaterialsByType(type);
        return ResponseEntity.ok(materials);
    }

    /**
     * Get consumable materials (RM and IM)
     */
    @GetMapping("/consumable")
    public ResponseEntity<List<MaterialDTO>> getConsumableMaterials() {
        log.info("GET /api/materials/consumable");
        List<MaterialDTO> materials = materialService.getConsumableMaterials();
        return ResponseEntity.ok(materials);
    }

    /**
     * Get materials with pagination
     */
    @GetMapping("/paged")
    public ResponseEntity<PagedResponseDTO<MaterialDTO>> getMaterialsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type) {

        log.info("GET /api/materials/paged - page={}, size={}, search={}, status={}, type={}",
                page, size, search, status, type);

        PageRequestDTO request = PageRequestDTO.builder()
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .search(search)
                .status(status)
                .type(type)
                .build();

        PagedResponseDTO<MaterialDTO> result = materialService.getMaterialsPaged(request);
        return ResponseEntity.ok(result);
    }

    /**
     * Get material by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<MaterialDTO> getMaterialById(@PathVariable Long id) {
        log.info("GET /api/materials/{}", id);
        MaterialDTO material = materialService.getMaterialById(id);
        return ResponseEntity.ok(material);
    }

    /**
     * Get material by code
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<MaterialDTO> getMaterialByCode(@PathVariable String code) {
        log.info("GET /api/materials/code/{}", code);
        MaterialDTO material = materialService.getMaterialByCode(code);
        return ResponseEntity.ok(material);
    }

    /**
     * Create a new material
     */
    @PostMapping
    public ResponseEntity<MaterialDTO> createMaterial(@Valid @RequestBody MaterialDTO dto) {
        log.info("POST /api/materials - creating material: {}", dto.getMaterialCode());
        MaterialDTO created = materialService.createMaterial(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update an existing material
     */
    @PutMapping("/{id}")
    public ResponseEntity<MaterialDTO> updateMaterial(
            @PathVariable Long id,
            @Valid @RequestBody MaterialDTO dto) {
        log.info("PUT /api/materials/{} - updating material", id);
        MaterialDTO updated = materialService.updateMaterial(id, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a material (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteMaterial(@PathVariable Long id) {
        log.info("DELETE /api/materials/{}", id);
        materialService.deleteMaterial(id);
        return ResponseEntity.ok(Map.of("message", "Material deleted successfully"));
    }
}
