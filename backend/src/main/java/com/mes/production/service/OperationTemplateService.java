package com.mes.production.service;

import com.mes.production.dto.OperationTemplateDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.entity.OperationTemplate;
import com.mes.production.repository.OperationTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for OperationTemplate - Design-time operation definitions.
 *
 * This service manages reusable operation templates that are:
 * - Referenced by RoutingSteps
 * - Used to instantiate runtime Operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OperationTemplateService {

    private final OperationTemplateRepository repository;
    private final AuditService auditService;

    /**
     * Get all operation templates.
     */
    public List<OperationTemplateDTO.Response> getAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all active operation templates.
     */
    public List<OperationTemplateDTO.Response> getActive() {
        return repository.findActive().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get operation template by ID.
     */
    public OperationTemplateDTO.Response getById(Long id) {
        OperationTemplate template = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Operation template not found: " + id));
        return toResponse(template);
    }

    /**
     * Get operation template entity by ID.
     */
    public OperationTemplate getEntityById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Operation template not found: " + id));
    }

    /**
     * Get templates by operation type.
     */
    public List<OperationTemplateDTO.Response> getByType(String operationType) {
        return repository.findByOperationTypeAndStatus(operationType, OperationTemplate.STATUS_ACTIVE)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get paginated templates with filters.
     */
    public PagedResponseDTO<OperationTemplateDTO.Response> getPaged(
            int page, int size, String sortBy, String sortDirection,
            String status, String type, String search) {

        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<OperationTemplate> pageResult = repository.findByFilters(
                status, type, search, pageable);

        List<OperationTemplateDTO.Response> content = pageResult.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return PagedResponseDTO.<OperationTemplateDTO.Response>builder()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .first(pageResult.isFirst())
                .last(pageResult.isLast())
                .build();
    }

    /**
     * Get all summaries for dropdown.
     */
    public List<OperationTemplateDTO.Summary> getSummaries() {
        return repository.findActive().stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    /**
     * Get distinct operation types.
     */
    public List<String> getOperationTypes() {
        return repository.findDistinctOperationTypes();
    }

    /**
     * Create new operation template.
     */
    @Transactional
    public OperationTemplateDTO.Response create(OperationTemplateDTO.CreateRequest request) {
        log.info("Creating operation template: {}", request.getOperationName());

        // Validate unique code if provided
        if (request.getOperationCode() != null && !request.getOperationCode().isEmpty()) {
            repository.findByOperationCode(request.getOperationCode()).ifPresent(existing -> {
                throw new IllegalArgumentException("Operation code already exists: " + request.getOperationCode());
            });
        }

        OperationTemplate template = OperationTemplate.builder()
                .operationName(request.getOperationName())
                .operationCode(request.getOperationCode())
                .operationType(request.getOperationType())
                .quantityType(request.getQuantityType())
                .defaultEquipmentType(request.getDefaultEquipmentType())
                .description(request.getDescription())
                .estimatedDurationMinutes(request.getEstimatedDurationMinutes())
                .status(OperationTemplate.STATUS_ACTIVE)
                .createdBy(getCurrentUser())
                .build();

        template = repository.save(template);
        log.info("Created operation template: {} with ID {}", template.getOperationName(), template.getOperationTemplateId());

        auditService.logCreate("OPERATION_TEMPLATE", template.getOperationTemplateId(),
                String.format("Created operation template: %s (%s)", template.getOperationName(), template.getOperationType()));

        return toResponse(template);
    }

    /**
     * Update existing operation template.
     */
    @Transactional
    public OperationTemplateDTO.Response update(Long id, OperationTemplateDTO.UpdateRequest request) {
        log.info("Updating operation template: {}", id);

        OperationTemplate template = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Operation template not found: " + id));

        // Validate unique code if changed
        if (request.getOperationCode() != null && !request.getOperationCode().isEmpty() &&
                !request.getOperationCode().equals(template.getOperationCode())) {
            repository.findByOperationCode(request.getOperationCode()).ifPresent(existing -> {
                throw new IllegalArgumentException("Operation code already exists: " + request.getOperationCode());
            });
        }

        // Update fields
        if (request.getOperationName() != null) template.setOperationName(request.getOperationName());
        if (request.getOperationCode() != null) template.setOperationCode(request.getOperationCode());
        if (request.getOperationType() != null) template.setOperationType(request.getOperationType());
        if (request.getQuantityType() != null) template.setQuantityType(request.getQuantityType());
        if (request.getDefaultEquipmentType() != null) template.setDefaultEquipmentType(request.getDefaultEquipmentType());
        if (request.getDescription() != null) template.setDescription(request.getDescription());
        if (request.getEstimatedDurationMinutes() != null) template.setEstimatedDurationMinutes(request.getEstimatedDurationMinutes());
        if (request.getStatus() != null) template.setStatus(request.getStatus());

        template.setUpdatedBy(getCurrentUser());
        template = repository.save(template);

        log.info("Updated operation template: {}", template.getOperationTemplateId());

        auditService.logUpdate("OPERATION_TEMPLATE", template.getOperationTemplateId(),
                "operationName", null, template.getOperationName());

        return toResponse(template);
    }

    /**
     * Activate operation template.
     */
    @Transactional
    public OperationTemplateDTO.Response activate(Long id) {
        OperationTemplate template = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Operation template not found: " + id));

        template.setStatus(OperationTemplate.STATUS_ACTIVE);
        template.setUpdatedBy(getCurrentUser());
        template = repository.save(template);

        auditService.logStatusChange("OPERATION_TEMPLATE", id, OperationTemplate.STATUS_INACTIVE, OperationTemplate.STATUS_ACTIVE);
        return toResponse(template);
    }

    /**
     * Deactivate operation template.
     */
    @Transactional
    public OperationTemplateDTO.Response deactivate(Long id) {
        OperationTemplate template = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Operation template not found: " + id));

        template.setStatus(OperationTemplate.STATUS_INACTIVE);
        template.setUpdatedBy(getCurrentUser());
        template = repository.save(template);

        auditService.logStatusChange("OPERATION_TEMPLATE", id, OperationTemplate.STATUS_ACTIVE, OperationTemplate.STATUS_INACTIVE);
        return toResponse(template);
    }

    /**
     * Delete operation template (soft delete to INACTIVE).
     */
    @Transactional
    public void delete(Long id) {
        OperationTemplate template = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Operation template not found: " + id));

        template.setStatus(OperationTemplate.STATUS_INACTIVE);
        template.setUpdatedBy(getCurrentUser());
        repository.save(template);

        auditService.logDelete("OPERATION_TEMPLATE", id,
                String.format("Deleted (deactivated) operation template: %s", template.getOperationName()));
    }

    // ========== Helper Methods ==========

    private OperationTemplateDTO.Response toResponse(OperationTemplate template) {
        return OperationTemplateDTO.Response.builder()
                .operationTemplateId(template.getOperationTemplateId())
                .operationName(template.getOperationName())
                .operationCode(template.getOperationCode())
                .operationType(template.getOperationType())
                .quantityType(template.getQuantityType())
                .defaultEquipmentType(template.getDefaultEquipmentType())
                .description(template.getDescription())
                .estimatedDurationMinutes(template.getEstimatedDurationMinutes())
                .status(template.getStatus())
                .createdOn(template.getCreatedOn())
                .createdBy(template.getCreatedBy())
                .updatedOn(template.getUpdatedOn())
                .updatedBy(template.getUpdatedBy())
                .build();
    }

    private OperationTemplateDTO.Summary toSummary(OperationTemplate template) {
        return OperationTemplateDTO.Summary.builder()
                .operationTemplateId(template.getOperationTemplateId())
                .operationName(template.getOperationName())
                .operationCode(template.getOperationCode())
                .operationType(template.getOperationType())
                .status(template.getStatus())
                .build();
    }

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
    }
}
