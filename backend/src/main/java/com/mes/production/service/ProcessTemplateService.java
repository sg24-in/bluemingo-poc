package com.mes.production.service;

import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.ProcessTemplateDTO;
import com.mes.production.entity.ProcessTemplate;
import com.mes.production.entity.Routing;
import com.mes.production.entity.RoutingStep;
import com.mes.production.repository.ProcessTemplateRepository;
import com.mes.production.repository.RoutingRepository;
import com.mes.production.repository.RoutingStepRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for managing Process Templates (design-time definitions).
 * Handles CRUD operations and activation workflow with single-active-template enforcement.
 *
 * Per MES Consolidated Specification:
 * - ProcessTemplate is the design-time entity for process definitions
 * - Process is the runtime entity for execution tracking
 * - Routing/RoutingSteps define the sequence of operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProcessTemplateService {

    private final ProcessTemplateRepository processTemplateRepository;
    private final RoutingRepository routingRepository;
    private final RoutingStepRepository routingStepRepository;

    /**
     * Create a new process template with routing steps.
     */
    @Transactional
    public ProcessTemplateDTO.TemplateResponse createTemplate(
            ProcessTemplateDTO.CreateRequest request, String createdBy) {

        log.info("Creating process template: {} by {}", request.getTemplateName(), createdBy);

        // Validate unique template code
        if (request.getTemplateCode() != null &&
            processTemplateRepository.existsByTemplateCode(request.getTemplateCode())) {
            throw new IllegalArgumentException("Template code already exists: " + request.getTemplateCode());
        }

        // Create the template
        ProcessTemplate template = ProcessTemplate.builder()
                .templateName(request.getTemplateName())
                .templateCode(request.getTemplateCode())
                .description(request.getDescription())
                .productSku(request.getProductSku())
                .version(request.getVersion() != null ? request.getVersion() : "V1")
                .effectiveFrom(request.getEffectiveFrom())
                .effectiveTo(request.getEffectiveTo())
                .status(ProcessTemplate.STATUS_DRAFT)
                .createdBy(createdBy)
                .build();

        template = processTemplateRepository.save(template);
        log.info("Created process template with ID: {}", template.getProcessTemplateId());

        // Create routing steps if provided
        List<ProcessTemplateDTO.RoutingStepResponse> stepResponses = null;
        if (request.getRoutingSteps() != null && !request.getRoutingSteps().isEmpty()) {
            // Create a placeholder routing for design-time steps
            Routing routing = createDesignTimeRouting(template, createdBy);
            stepResponses = createRoutingSteps(routing, request.getRoutingSteps(), createdBy);
        }

        return buildTemplateResponse(template, stepResponses);
    }

    /**
     * Update an existing process template.
     * Only DRAFT templates can be fully updated.
     */
    @Transactional
    public ProcessTemplateDTO.TemplateResponse updateTemplate(
            Long templateId, ProcessTemplateDTO.UpdateRequest request, String updatedBy) {

        log.info("Updating process template: {} by {}", templateId, updatedBy);

        ProcessTemplate template = processTemplateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("Template not found: " + templateId));

        // Only DRAFT templates can be fully updated
        if (!ProcessTemplate.STATUS_DRAFT.equals(template.getStatus())) {
            // For non-DRAFT, only allow limited updates
            log.warn("Limited update for non-DRAFT template: {}", templateId);
            if (request.getEffectiveTo() != null) {
                template.setEffectiveTo(request.getEffectiveTo());
            }
        } else {
            // Full update for DRAFT
            if (request.getTemplateName() != null) {
                template.setTemplateName(request.getTemplateName());
            }
            if (request.getDescription() != null) {
                template.setDescription(request.getDescription());
            }
            if (request.getProductSku() != null) {
                template.setProductSku(request.getProductSku());
            }
            if (request.getEffectiveFrom() != null) {
                template.setEffectiveFrom(request.getEffectiveFrom());
            }
            if (request.getEffectiveTo() != null) {
                template.setEffectiveTo(request.getEffectiveTo());
            }
        }

        template.setUpdatedBy(updatedBy);
        template = processTemplateRepository.save(template);

        return buildTemplateResponse(template, getRoutingStepsForTemplate(templateId));
    }

    /**
     * Get a process template by ID.
     */
    @Transactional(readOnly = true)
    public Optional<ProcessTemplateDTO.TemplateResponse> getTemplate(Long templateId) {
        return processTemplateRepository.findById(templateId)
                .map(template -> buildTemplateResponse(template, getRoutingStepsForTemplate(templateId)));
    }

    /**
     * Get a process template by code.
     */
    @Transactional(readOnly = true)
    public Optional<ProcessTemplateDTO.TemplateResponse> getTemplateByCode(String templateCode) {
        return processTemplateRepository.findByTemplateCode(templateCode)
                .map(template -> buildTemplateResponse(template,
                        getRoutingStepsForTemplate(template.getProcessTemplateId())));
    }

    /**
     * Get paginated list of templates.
     */
    @Transactional(readOnly = true)
    public PagedResponseDTO<ProcessTemplateDTO.TemplateSummary> getTemplatesPaged(
            int page, int size, String sortBy, String sortDirection,
            String status, String productSku, String search) {

        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        String searchPattern = search != null ? "%" + search + "%" : null;
        Page<ProcessTemplate> templatePage = processTemplateRepository.findByFilters(
                status, productSku, searchPattern, pageable);

        List<ProcessTemplateDTO.TemplateSummary> summaries = templatePage.getContent().stream()
                .map(this::buildTemplateSummary)
                .collect(Collectors.toList());

        return PagedResponseDTO.<ProcessTemplateDTO.TemplateSummary>builder()
                .content(summaries)
                .page(templatePage.getNumber())
                .size(templatePage.getSize())
                .totalElements(templatePage.getTotalElements())
                .totalPages(templatePage.getTotalPages())
                .first(templatePage.isFirst())
                .last(templatePage.isLast())
                .build();
    }

    /**
     * Get all templates for a product.
     */
    @Transactional(readOnly = true)
    public List<ProcessTemplateDTO.TemplateSummary> getTemplatesForProduct(String productSku) {
        return processTemplateRepository.findByProductSku(productSku).stream()
                .map(this::buildTemplateSummary)
                .collect(Collectors.toList());
    }

    /**
     * Get effective template for a product (active and within date range).
     */
    @Transactional(readOnly = true)
    public Optional<ProcessTemplateDTO.TemplateResponse> getEffectiveTemplate(String productSku) {
        List<ProcessTemplate> effective = processTemplateRepository.findEffectiveByProductSku(
                productSku, LocalDate.now());

        if (effective.isEmpty()) {
            return Optional.empty();
        }

        // Return the first effective template (should normally be only one)
        ProcessTemplate template = effective.get(0);
        return Optional.of(buildTemplateResponse(template,
                getRoutingStepsForTemplate(template.getProcessTemplateId())));
    }

    /**
     * Activate a process template.
     * Optionally deactivates other active templates for the same product.
     */
    @Transactional
    public ProcessTemplateDTO.TemplateResponse activateTemplate(
            Long templateId, ProcessTemplateDTO.ActivationRequest request, String activatedBy) {

        log.info("Activating process template: {} by {}", templateId, activatedBy);

        ProcessTemplate template = processTemplateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("Template not found: " + templateId));

        // Validate current status
        if (ProcessTemplate.STATUS_ACTIVE.equals(template.getStatus())) {
            throw new IllegalStateException("Template is already active: " + templateId);
        }

        // Deactivate other active templates for same product if requested
        if (Boolean.TRUE.equals(request.getDeactivateOthers()) && template.getProductSku() != null) {
            deactivateOtherTemplates(template.getProductSku(), templateId, activatedBy);
        }

        // Set effective date if provided
        if (request.getEffectiveFrom() != null) {
            template.setEffectiveFrom(request.getEffectiveFrom());
        } else if (template.getEffectiveFrom() == null) {
            template.setEffectiveFrom(LocalDate.now());
        }

        template.setStatus(ProcessTemplate.STATUS_ACTIVE);
        template.setUpdatedBy(activatedBy);
        template = processTemplateRepository.save(template);

        log.info("Activated process template: {}", templateId);
        return buildTemplateResponse(template, getRoutingStepsForTemplate(templateId));
    }

    /**
     * Deactivate a process template.
     */
    @Transactional
    public ProcessTemplateDTO.TemplateResponse deactivateTemplate(Long templateId, String deactivatedBy) {
        log.info("Deactivating process template: {} by {}", templateId, deactivatedBy);

        ProcessTemplate template = processTemplateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("Template not found: " + templateId));

        if (!ProcessTemplate.STATUS_ACTIVE.equals(template.getStatus())) {
            throw new IllegalStateException("Only active templates can be deactivated: " + templateId);
        }

        template.setStatus(ProcessTemplate.STATUS_INACTIVE);
        template.setEffectiveTo(LocalDate.now());
        template.setUpdatedBy(deactivatedBy);
        template = processTemplateRepository.save(template);

        log.info("Deactivated process template: {}", templateId);
        return buildTemplateResponse(template, getRoutingStepsForTemplate(templateId));
    }

    /**
     * Create a new version of an existing template.
     */
    @Transactional
    public ProcessTemplateDTO.TemplateResponse createNewVersion(Long templateId, String createdBy) {
        log.info("Creating new version of template: {} by {}", templateId, createdBy);

        ProcessTemplate original = processTemplateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("Template not found: " + templateId));

        // Generate new version number
        String newVersion = generateNextVersion(original.getVersion());

        // Create copy with new version
        ProcessTemplate newTemplate = ProcessTemplate.builder()
                .templateName(original.getTemplateName())
                .templateCode(original.getTemplateCode() + "-" + newVersion)
                .description(original.getDescription())
                .productSku(original.getProductSku())
                .version(newVersion)
                .status(ProcessTemplate.STATUS_DRAFT)
                .createdBy(createdBy)
                .build();

        newTemplate = processTemplateRepository.save(newTemplate);

        // Copy routing steps
        List<ProcessTemplateDTO.RoutingStepResponse> copiedSteps = copyRoutingSteps(
                original.getProcessTemplateId(), newTemplate.getProcessTemplateId(), createdBy);

        log.info("Created new version {} of template {}", newVersion, templateId);
        return buildTemplateResponse(newTemplate, copiedSteps);
    }

    /**
     * Delete a process template (only DRAFT templates).
     */
    @Transactional
    public void deleteTemplate(Long templateId) {
        log.info("Deleting process template: {}", templateId);

        ProcessTemplate template = processTemplateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("Template not found: " + templateId));

        if (!ProcessTemplate.STATUS_DRAFT.equals(template.getStatus())) {
            throw new IllegalStateException("Only DRAFT templates can be deleted: " + templateId);
        }

        // Delete associated routing and steps
        deleteTemplateRoutings(templateId);
        processTemplateRepository.delete(template);

        log.info("Deleted process template: {}", templateId);
    }

    /**
     * Add a routing step to a template.
     */
    @Transactional
    public ProcessTemplateDTO.RoutingStepResponse addRoutingStep(
            Long templateId, ProcessTemplateDTO.RoutingStepTemplate stepTemplate, String createdBy) {

        log.info("Adding routing step to template: {}", templateId);

        ProcessTemplate template = processTemplateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("Template not found: " + templateId));

        if (!ProcessTemplate.STATUS_DRAFT.equals(template.getStatus())) {
            throw new IllegalStateException("Can only add steps to DRAFT templates: " + templateId);
        }

        // Get or create design-time routing
        Routing routing = getOrCreateDesignTimeRouting(templateId, createdBy);

        RoutingStep step = RoutingStep.builder()
                .routing(routing)
                .sequenceNumber(stepTemplate.getSequenceNumber())
                .operationName(stepTemplate.getOperationName())
                .operationType(stepTemplate.getOperationType())
                .operationCode(stepTemplate.getOperationCode())
                .description(stepTemplate.getDescription())
                .targetQty(stepTemplate.getTargetQty())
                .estimatedDurationMinutes(stepTemplate.getEstimatedDurationMinutes())
                .isParallel(stepTemplate.getIsParallel())
                .mandatoryFlag(stepTemplate.getMandatoryFlag())
                .producesOutputBatch(stepTemplate.getProducesOutputBatch())
                .allowsSplit(stepTemplate.getAllowsSplit())
                .allowsMerge(stepTemplate.getAllowsMerge())
                .status(RoutingStep.STATUS_READY)
                .createdBy(createdBy)
                .build();

        step = routingStepRepository.save(step);
        return buildStepResponse(step);
    }

    /**
     * Update a routing step.
     */
    @Transactional
    public ProcessTemplateDTO.RoutingStepResponse updateRoutingStep(
            Long stepId, ProcessTemplateDTO.RoutingStepTemplate stepTemplate, String updatedBy) {

        log.info("Updating routing step: {}", stepId);

        RoutingStep step = routingStepRepository.findById(stepId)
                .orElseThrow(() -> new IllegalArgumentException("Routing step not found: " + stepId));

        // Check if parent template is in DRAFT status
        ProcessTemplate template = step.getRouting().getProcessTemplate();
        if (template != null && !ProcessTemplate.STATUS_DRAFT.equals(template.getStatus())) {
            throw new IllegalStateException("Can only update steps of DRAFT templates");
        }

        if (stepTemplate.getSequenceNumber() != null) {
            step.setSequenceNumber(stepTemplate.getSequenceNumber());
        }
        if (stepTemplate.getOperationName() != null) {
            step.setOperationName(stepTemplate.getOperationName());
        }
        if (stepTemplate.getOperationType() != null) {
            step.setOperationType(stepTemplate.getOperationType());
        }
        if (stepTemplate.getOperationCode() != null) {
            step.setOperationCode(stepTemplate.getOperationCode());
        }
        if (stepTemplate.getDescription() != null) {
            step.setDescription(stepTemplate.getDescription());
        }
        if (stepTemplate.getTargetQty() != null) {
            step.setTargetQty(stepTemplate.getTargetQty());
        }
        if (stepTemplate.getEstimatedDurationMinutes() != null) {
            step.setEstimatedDurationMinutes(stepTemplate.getEstimatedDurationMinutes());
        }
        if (stepTemplate.getIsParallel() != null) {
            step.setIsParallel(stepTemplate.getIsParallel());
        }
        if (stepTemplate.getMandatoryFlag() != null) {
            step.setMandatoryFlag(stepTemplate.getMandatoryFlag());
        }
        if (stepTemplate.getProducesOutputBatch() != null) {
            step.setProducesOutputBatch(stepTemplate.getProducesOutputBatch());
        }
        if (stepTemplate.getAllowsSplit() != null) {
            step.setAllowsSplit(stepTemplate.getAllowsSplit());
        }
        if (stepTemplate.getAllowsMerge() != null) {
            step.setAllowsMerge(stepTemplate.getAllowsMerge());
        }

        step.setUpdatedBy(updatedBy);
        step = routingStepRepository.save(step);
        return buildStepResponse(step);
    }

    /**
     * Delete a routing step.
     */
    @Transactional
    public void deleteRoutingStep(Long stepId) {
        log.info("Deleting routing step: {}", stepId);

        RoutingStep step = routingStepRepository.findById(stepId)
                .orElseThrow(() -> new IllegalArgumentException("Routing step not found: " + stepId));

        // Check if parent template is in DRAFT status
        ProcessTemplate template = step.getRouting().getProcessTemplate();
        if (template != null && !ProcessTemplate.STATUS_DRAFT.equals(template.getStatus())) {
            throw new IllegalStateException("Can only delete steps of DRAFT templates");
        }

        routingStepRepository.delete(step);
        log.info("Deleted routing step: {}", stepId);
    }

    // ============ Helper Methods ============

    private Routing createDesignTimeRouting(ProcessTemplate template, String createdBy) {
        Routing routing = Routing.builder()
                .routingName(template.getTemplateName() + " - Design")
                .routingType(Routing.TYPE_SEQUENTIAL)
                .status(Routing.STATUS_DRAFT)
                .processTemplate(template)
                .createdBy(createdBy)
                .build();
        return routingRepository.save(routing);
    }

    private Routing getOrCreateDesignTimeRouting(Long templateId, String createdBy) {
        // Find existing design-time routing for this template using repository method
        Optional<Routing> existingRouting = routingRepository.findByProcessTemplate_ProcessTemplateId(templateId);

        if (existingRouting.isPresent()) {
            return existingRouting.get();
        }

        // Create new one
        ProcessTemplate template = processTemplateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("Template not found: " + templateId));
        return createDesignTimeRouting(template, createdBy);
    }

    private List<ProcessTemplateDTO.RoutingStepResponse> createRoutingSteps(
            Routing routing, List<ProcessTemplateDTO.RoutingStepTemplate> stepTemplates, String createdBy) {

        return stepTemplates.stream().map(st -> {
            RoutingStep step = RoutingStep.builder()
                    .routing(routing)
                    .sequenceNumber(st.getSequenceNumber())
                    .operationName(st.getOperationName())
                    .operationType(st.getOperationType())
                    .operationCode(st.getOperationCode())
                    .description(st.getDescription())
                    .targetQty(st.getTargetQty())
                    .estimatedDurationMinutes(st.getEstimatedDurationMinutes())
                    .isParallel(st.getIsParallel())
                    .mandatoryFlag(st.getMandatoryFlag())
                    .producesOutputBatch(st.getProducesOutputBatch())
                    .allowsSplit(st.getAllowsSplit())
                    .allowsMerge(st.getAllowsMerge())
                    .status(RoutingStep.STATUS_READY)
                    .createdBy(createdBy)
                    .build();
            step = routingStepRepository.save(step);
            return buildStepResponse(step);
        }).collect(Collectors.toList());
    }

    private List<ProcessTemplateDTO.RoutingStepResponse> getRoutingStepsForTemplate(Long templateId) {
        // Find routing for this template using repository method
        Optional<Routing> routingOpt = routingRepository.findByProcessTemplate_ProcessTemplateId(templateId);

        if (routingOpt.isEmpty()) {
            return List.of();
        }

        Routing routing = routingOpt.get();
        return routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(routing.getRoutingId())
                .stream()
                .map(this::buildStepResponse)
                .collect(Collectors.toList());
    }

    private void deactivateOtherTemplates(String productSku, Long excludeTemplateId, String updatedBy) {
        List<ProcessTemplate> activeTemplates = processTemplateRepository.findActiveByProductSku(productSku);
        for (ProcessTemplate t : activeTemplates) {
            if (!t.getProcessTemplateId().equals(excludeTemplateId)) {
                t.setStatus(ProcessTemplate.STATUS_SUPERSEDED);
                t.setEffectiveTo(LocalDate.now().minusDays(1));
                t.setUpdatedBy(updatedBy);
                processTemplateRepository.save(t);
                log.info("Superseded template {} for product {}", t.getProcessTemplateId(), productSku);
            }
        }
    }

    private String generateNextVersion(String currentVersion) {
        if (currentVersion == null || currentVersion.isEmpty()) {
            return "V2";
        }
        // Extract number from version string (e.g., "V1" -> 1)
        String numPart = currentVersion.replaceAll("[^0-9]", "");
        int num = numPart.isEmpty() ? 1 : Integer.parseInt(numPart);
        return "V" + (num + 1);
    }

    private List<ProcessTemplateDTO.RoutingStepResponse> copyRoutingSteps(
            Long sourceTemplateId, Long targetTemplateId, String createdBy) {

        List<ProcessTemplateDTO.RoutingStepResponse> sourceSteps = getRoutingStepsForTemplate(sourceTemplateId);
        if (sourceSteps.isEmpty()) {
            return List.of();
        }

        Routing targetRouting = getOrCreateDesignTimeRouting(targetTemplateId, createdBy);

        return sourceSteps.stream().map(ss -> {
            RoutingStep step = RoutingStep.builder()
                    .routing(targetRouting)
                    .sequenceNumber(ss.getSequenceNumber())
                    .operationName(ss.getOperationName())
                    .operationType(ss.getOperationType())
                    .operationCode(ss.getOperationCode())
                    .description(ss.getDescription())
                    .targetQty(ss.getTargetQty())
                    .estimatedDurationMinutes(ss.getEstimatedDurationMinutes())
                    .isParallel(ss.getIsParallel())
                    .mandatoryFlag(ss.getMandatoryFlag())
                    .producesOutputBatch(ss.getProducesOutputBatch())
                    .allowsSplit(ss.getAllowsSplit())
                    .allowsMerge(ss.getAllowsMerge())
                    .status(RoutingStep.STATUS_READY)
                    .createdBy(createdBy)
                    .build();
            step = routingStepRepository.save(step);
            return buildStepResponse(step);
        }).collect(Collectors.toList());
    }

    private void deleteTemplateRoutings(Long templateId) {
        // Find all routings for this template
        List<Routing> routings = routingRepository.findByProcessTemplate_ProcessTemplateIdAndStatus(templateId, Routing.STATUS_DRAFT);

        for (Routing routing : routings) {
            routingStepRepository.deleteAll(
                    routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(routing.getRoutingId()));
            routingRepository.delete(routing);
        }
    }

    private ProcessTemplateDTO.TemplateResponse buildTemplateResponse(
            ProcessTemplate template, List<ProcessTemplateDTO.RoutingStepResponse> steps) {

        return ProcessTemplateDTO.TemplateResponse.builder()
                .processTemplateId(template.getProcessTemplateId())
                .templateName(template.getTemplateName())
                .templateCode(template.getTemplateCode())
                .description(template.getDescription())
                .productSku(template.getProductSku())
                .status(template.getStatus())
                .version(template.getVersion())
                .effectiveFrom(template.getEffectiveFrom())
                .effectiveTo(template.getEffectiveTo())
                .isEffective(template.isEffective())
                .createdOn(template.getCreatedOn())
                .createdBy(template.getCreatedBy())
                .updatedOn(template.getUpdatedOn())
                .updatedBy(template.getUpdatedBy())
                .routingSteps(steps)
                .build();
    }

    private ProcessTemplateDTO.TemplateSummary buildTemplateSummary(ProcessTemplate template) {
        int stepCount = getRoutingStepsForTemplate(template.getProcessTemplateId()).size();

        return ProcessTemplateDTO.TemplateSummary.builder()
                .processTemplateId(template.getProcessTemplateId())
                .templateName(template.getTemplateName())
                .templateCode(template.getTemplateCode())
                .productSku(template.getProductSku())
                .status(template.getStatus())
                .version(template.getVersion())
                .isEffective(template.isEffective())
                .stepCount(stepCount)
                .createdOn(template.getCreatedOn())
                .build();
    }

    private ProcessTemplateDTO.RoutingStepResponse buildStepResponse(RoutingStep step) {
        return ProcessTemplateDTO.RoutingStepResponse.builder()
                .routingStepId(step.getRoutingStepId())
                .sequenceNumber(step.getSequenceNumber())
                .operationName(step.getOperationName())
                .operationType(step.getOperationType())
                .operationCode(step.getOperationCode())
                .description(step.getDescription())
                .targetQty(step.getTargetQty())
                .estimatedDurationMinutes(step.getEstimatedDurationMinutes())
                .isParallel(step.getIsParallel())
                .mandatoryFlag(step.getMandatoryFlag())
                .producesOutputBatch(step.getProducesOutputBatch())
                .allowsSplit(step.getAllowsSplit())
                .allowsMerge(step.getAllowsMerge())
                .status(step.getStatus())
                .build();
    }
}
