package com.mes.production.controller;

import com.mes.production.dto.OperationTemplateDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.service.OperationTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for OperationTemplate - Design-time operation definitions.
 *
 * This controller provides endpoints for managing operation templates.
 * Templates are used by RoutingSteps and instantiated into runtime Operations.
 *
 * All endpoints are under /api/operation-templates
 */
@RestController
@RequestMapping("/api/operation-templates")
@RequiredArgsConstructor
public class OperationTemplateController {

    private final OperationTemplateService service;

    /**
     * Get all operation templates.
     */
    @GetMapping
    public ResponseEntity<List<OperationTemplateDTO.Response>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    /**
     * Get all active operation templates.
     */
    @GetMapping("/active")
    public ResponseEntity<List<OperationTemplateDTO.Response>> getActive() {
        return ResponseEntity.ok(service.getActive());
    }

    /**
     * Get paginated operation templates with filters.
     */
    @GetMapping("/paged")
    public ResponseEntity<PagedResponseDTO<OperationTemplateDTO.Response>> getPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "operationName") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(service.getPaged(page, size, sortBy, sortDirection, status, type, search));
    }

    /**
     * Get operation template by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<OperationTemplateDTO.Response> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    /**
     * Get templates by operation type.
     */
    @GetMapping("/by-type/{type}")
    public ResponseEntity<List<OperationTemplateDTO.Response>> getByType(@PathVariable String type) {
        return ResponseEntity.ok(service.getByType(type));
    }

    /**
     * Get template summaries for dropdowns.
     */
    @GetMapping("/summaries")
    public ResponseEntity<List<OperationTemplateDTO.Summary>> getSummaries() {
        return ResponseEntity.ok(service.getSummaries());
    }

    /**
     * Get distinct operation types.
     */
    @GetMapping("/types")
    public ResponseEntity<List<String>> getOperationTypes() {
        return ResponseEntity.ok(service.getOperationTypes());
    }

    /**
     * Create new operation template.
     */
    @PostMapping
    public ResponseEntity<OperationTemplateDTO.Response> create(
            @RequestBody OperationTemplateDTO.CreateRequest request) {
        return ResponseEntity.ok(service.create(request));
    }

    /**
     * Update operation template.
     */
    @PutMapping("/{id}")
    public ResponseEntity<OperationTemplateDTO.Response> update(
            @PathVariable Long id,
            @RequestBody OperationTemplateDTO.UpdateRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    /**
     * Activate operation template.
     */
    @PostMapping("/{id}/activate")
    public ResponseEntity<OperationTemplateDTO.Response> activate(@PathVariable Long id) {
        return ResponseEntity.ok(service.activate(id));
    }

    /**
     * Deactivate operation template.
     */
    @PostMapping("/{id}/deactivate")
    public ResponseEntity<OperationTemplateDTO.Response> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(service.deactivate(id));
    }

    /**
     * Delete operation template (soft delete to INACTIVE).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
