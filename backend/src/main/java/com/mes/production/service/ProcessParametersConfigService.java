package com.mes.production.service;

import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.dto.ProcessParametersConfigDTO;
import com.mes.production.entity.AuditTrail;
import com.mes.production.entity.ProcessParametersConfig;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.ProcessParametersConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProcessParametersConfigService {

    private final ProcessParametersConfigRepository repository;
    private final AuditTrailRepository auditTrailRepository;

    public List<ProcessParametersConfigDTO> getAllConfigs() {
        return repository.findAll().stream()
                .map(ProcessParametersConfigDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ProcessParametersConfigDTO> getActiveConfigs() {
        return repository.findAllActive().stream()
                .map(ProcessParametersConfigDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ProcessParametersConfigDTO> getActiveByOperationAndProduct(String operationType, String productSku) {
        return repository.findActiveByOperationTypeAndProduct(operationType, productSku).stream()
                .map(ProcessParametersConfigDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public PagedResponseDTO<ProcessParametersConfigDTO> getConfigsPaged(PageRequestDTO request) {
        String sortBy = request.getSortBy() != null ? request.getSortBy() : "operationType";
        Sort.Direction direction = "DESC".equalsIgnoreCase(request.getSortDirection())
                ? Sort.Direction.DESC : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(
                request.getPage(),
                Math.min(request.getSize(), 100),
                Sort.by(direction, sortBy)
        );

        Page<ProcessParametersConfig> page = repository.findByFilters(
                request.getSearch(), request.getStatus(), pageable);

        List<ProcessParametersConfigDTO> content = page.getContent().stream()
                .map(ProcessParametersConfigDTO::fromEntity)
                .collect(Collectors.toList());

        return PagedResponseDTO.<ProcessParametersConfigDTO>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    public ProcessParametersConfigDTO getConfigById(Long id) {
        ProcessParametersConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Process parameter config not found with ID: " + id));
        return ProcessParametersConfigDTO.fromEntity(config);
    }

    @Transactional
    public ProcessParametersConfigDTO createConfig(ProcessParametersConfigDTO dto) {
        String currentUser = getCurrentUsername();

        ProcessParametersConfig config = dto.toEntity();
        config.setCreatedBy(currentUser);
        config.setStatus(ProcessParametersConfig.STATUS_ACTIVE);

        ProcessParametersConfig saved = repository.save(config);

        auditAction(saved.getConfigId(), AuditTrail.ACTION_CREATE, null,
                saved.getOperationType() + "/" + saved.getParameterName(), currentUser);

        log.info("Created process parameter config: {}/{} by {}", saved.getOperationType(), saved.getParameterName(), currentUser);
        return ProcessParametersConfigDTO.fromEntity(saved);
    }

    @Transactional
    public ProcessParametersConfigDTO updateConfig(Long id, ProcessParametersConfigDTO dto) {
        ProcessParametersConfig existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Process parameter config not found with ID: " + id));

        String currentUser = getCurrentUsername();
        String oldValues = String.format("op=%s, param=%s, min=%s, max=%s",
                existing.getOperationType(), existing.getParameterName(), existing.getMinValue(), existing.getMaxValue());

        existing.setOperationType(dto.getOperationType());
        existing.setProductSku(dto.getProductSku());
        existing.setParameterName(dto.getParameterName());
        if (dto.getParameterType() != null) existing.setParameterType(dto.getParameterType());
        existing.setUnit(dto.getUnit());
        existing.setMinValue(dto.getMinValue());
        existing.setMaxValue(dto.getMaxValue());
        existing.setDefaultValue(dto.getDefaultValue());
        if (dto.getIsRequired() != null) existing.setIsRequired(dto.getIsRequired());
        if (dto.getDisplayOrder() != null) existing.setDisplayOrder(dto.getDisplayOrder());
        if (dto.getStatus() != null) existing.setStatus(dto.getStatus());
        existing.setUpdatedBy(currentUser);

        ProcessParametersConfig saved = repository.save(existing);

        String newValues = String.format("op=%s, param=%s, min=%s, max=%s",
                saved.getOperationType(), saved.getParameterName(), saved.getMinValue(), saved.getMaxValue());
        auditAction(saved.getConfigId(), AuditTrail.ACTION_UPDATE, oldValues, newValues, currentUser);

        log.info("Updated process parameter config: {}/{} by {}", saved.getOperationType(), saved.getParameterName(), currentUser);
        return ProcessParametersConfigDTO.fromEntity(saved);
    }

    @Transactional
    public void deleteConfig(Long id) {
        ProcessParametersConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Process parameter config not found with ID: " + id));

        String currentUser = getCurrentUsername();

        config.setStatus(ProcessParametersConfig.STATUS_INACTIVE);
        config.setUpdatedBy(currentUser);
        repository.save(config);

        auditAction(config.getConfigId(), AuditTrail.ACTION_DELETE,
                ProcessParametersConfig.STATUS_ACTIVE, ProcessParametersConfig.STATUS_INACTIVE, currentUser);

        log.info("Deleted (deactivated) process parameter config: {}/{} by {}",
                config.getOperationType(), config.getParameterName(), currentUser);
    }

    private void auditAction(Long entityId, String action, String oldValue, String newValue, String user) {
        AuditTrail audit = AuditTrail.builder()
                .entityType("PROCESS_PARAMETERS_CONFIG")
                .entityId(entityId)
                .action(action)
                .oldValue(oldValue)
                .newValue(newValue)
                .changedBy(user)
                .timestamp(LocalDateTime.now())
                .build();
        auditTrailRepository.save(audit);
    }

    private String getCurrentUsername() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "system";
        }
    }
}
