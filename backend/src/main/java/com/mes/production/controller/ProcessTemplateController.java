package com.mes.production.controller;

import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.ProcessTemplateDTO;
import com.mes.production.service.ProcessTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for ProcessTemplate (design-time) management.
 * Provides CRUD endpoints for process definitions, routing steps, and activation workflow.
 *
 * Endpoint: /api/process-templates
 *
 * Per MES Consolidated Specification:
 * - ProcessTemplate is the design-time entity for process definitions
 * - Process is the runtime entity for execution tracking (at /api/processes)
 * - Routing/RoutingSteps define the sequence of operations
 */
@RestController
@RequestMapping("/api/process-templates")
@RequiredArgsConstructor
@Slf4j
public class ProcessTemplateController {

    private final ProcessTemplateService processTemplateService;

    /**
     * Create a new process template.
     */
    @PostMapping
    public ResponseEntity<ProcessTemplateDTO.TemplateResponse> createTemplate(
            @RequestBody ProcessTemplateDTO.CreateRequest request,
            Authentication auth) {

        log.info("POST /api/processes - Creating template: {}", request.getTemplateName());
        String username = auth != null ? auth.getName() : "system";

        ProcessTemplateDTO.TemplateResponse response = processTemplateService.createTemplate(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get a process template by ID.
     */
    @GetMapping("/{templateId}")
    public ResponseEntity<ProcessTemplateDTO.TemplateResponse> getTemplate(@PathVariable Long templateId) {
        log.info("GET /api/processes/{}", templateId);

        return processTemplateService.getTemplate(templateId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get a process template by code.
     */
    @GetMapping("/code/{templateCode}")
    public ResponseEntity<ProcessTemplateDTO.TemplateResponse> getTemplateByCode(
            @PathVariable String templateCode) {

        log.info("GET /api/processes/code/{}", templateCode);

        return processTemplateService.getTemplateByCode(templateCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get paginated list of templates.
     */
    @GetMapping("/paged")
    public ResponseEntity<PagedResponseDTO<ProcessTemplateDTO.TemplateSummary>> getTemplatesPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdOn") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String productSku,
            @RequestParam(required = false) String search) {

        log.info("GET /api/processes/paged - page={}, size={}, status={}, productSku={}, search={}",
                page, size, status, productSku, search);

        PagedResponseDTO<ProcessTemplateDTO.TemplateSummary> response =
                processTemplateService.getTemplatesPaged(page, size, sortBy, sortDirection, status, productSku, search);

        return ResponseEntity.ok(response);
    }

    /**
     * Get all templates for a product.
     */
    @GetMapping("/product/{productSku}")
    public ResponseEntity<List<ProcessTemplateDTO.TemplateSummary>> getTemplatesForProduct(
            @PathVariable String productSku) {

        log.info("GET /api/processes/product/{}", productSku);

        List<ProcessTemplateDTO.TemplateSummary> templates =
                processTemplateService.getTemplatesForProduct(productSku);

        return ResponseEntity.ok(templates);
    }

    /**
     * Get the effective template for a product.
     */
    @GetMapping("/product/{productSku}/effective")
    public ResponseEntity<ProcessTemplateDTO.TemplateResponse> getEffectiveTemplate(
            @PathVariable String productSku) {

        log.info("GET /api/processes/product/{}/effective", productSku);

        return processTemplateService.getEffectiveTemplate(productSku)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Update a process template.
     */
    @PutMapping("/{templateId}")
    public ResponseEntity<ProcessTemplateDTO.TemplateResponse> updateTemplate(
            @PathVariable Long templateId,
            @RequestBody ProcessTemplateDTO.UpdateRequest request,
            Authentication auth) {

        log.info("PUT /api/processes/{}", templateId);
        String username = auth != null ? auth.getName() : "system";

        ProcessTemplateDTO.TemplateResponse response =
                processTemplateService.updateTemplate(templateId, request, username);

        return ResponseEntity.ok(response);
    }

    /**
     * Delete a process template (only DRAFT templates).
     */
    @DeleteMapping("/{templateId}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long templateId) {
        log.info("DELETE /api/processes/{}", templateId);

        processTemplateService.deleteTemplate(templateId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Activate a process template.
     */
    @PostMapping("/{templateId}/activate")
    public ResponseEntity<ProcessTemplateDTO.TemplateResponse> activateTemplate(
            @PathVariable Long templateId,
            @RequestBody(required = false) ProcessTemplateDTO.ActivationRequest request,
            Authentication auth) {

        log.info("POST /api/processes/{}/activate", templateId);
        String username = auth != null ? auth.getName() : "system";

        ProcessTemplateDTO.ActivationRequest activationRequest = request != null ? request :
                ProcessTemplateDTO.ActivationRequest.builder().deactivateOthers(true).build();

        ProcessTemplateDTO.TemplateResponse response =
                processTemplateService.activateTemplate(templateId, activationRequest, username);

        return ResponseEntity.ok(response);
    }

    /**
     * Deactivate a process template.
     */
    @PostMapping("/{templateId}/deactivate")
    public ResponseEntity<ProcessTemplateDTO.TemplateResponse> deactivateTemplate(
            @PathVariable Long templateId,
            Authentication auth) {

        log.info("POST /api/processes/{}/deactivate", templateId);
        String username = auth != null ? auth.getName() : "system";

        ProcessTemplateDTO.TemplateResponse response =
                processTemplateService.deactivateTemplate(templateId, username);

        return ResponseEntity.ok(response);
    }

    /**
     * Create a new version of a template.
     */
    @PostMapping("/{templateId}/new-version")
    public ResponseEntity<ProcessTemplateDTO.TemplateResponse> createNewVersion(
            @PathVariable Long templateId,
            Authentication auth) {

        log.info("POST /api/processes/{}/new-version", templateId);
        String username = auth != null ? auth.getName() : "system";

        ProcessTemplateDTO.TemplateResponse response =
                processTemplateService.createNewVersion(templateId, username);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ============ Routing Step Endpoints ============

    /**
     * Add a routing step to a template.
     */
    @PostMapping("/{templateId}/steps")
    public ResponseEntity<ProcessTemplateDTO.RoutingStepResponse> addRoutingStep(
            @PathVariable Long templateId,
            @RequestBody ProcessTemplateDTO.RoutingStepTemplate stepTemplate,
            Authentication auth) {

        log.info("POST /api/processes/{}/steps", templateId);
        String username = auth != null ? auth.getName() : "system";

        ProcessTemplateDTO.RoutingStepResponse response =
                processTemplateService.addRoutingStep(templateId, stepTemplate, username);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update a routing step.
     */
    @PutMapping("/steps/{stepId}")
    public ResponseEntity<ProcessTemplateDTO.RoutingStepResponse> updateRoutingStep(
            @PathVariable Long stepId,
            @RequestBody ProcessTemplateDTO.RoutingStepTemplate stepTemplate,
            Authentication auth) {

        log.info("PUT /api/processes/steps/{}", stepId);
        String username = auth != null ? auth.getName() : "system";

        ProcessTemplateDTO.RoutingStepResponse response =
                processTemplateService.updateRoutingStep(stepId, stepTemplate, username);

        return ResponseEntity.ok(response);
    }

    /**
     * Delete a routing step.
     */
    @DeleteMapping("/steps/{stepId}")
    public ResponseEntity<Void> deleteRoutingStep(@PathVariable Long stepId) {
        log.info("DELETE /api/processes/steps/{}", stepId);

        processTemplateService.deleteRoutingStep(stepId);
        return ResponseEntity.noContent().build();
    }
}
