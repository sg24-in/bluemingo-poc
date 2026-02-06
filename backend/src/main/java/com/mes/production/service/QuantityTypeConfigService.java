package com.mes.production.service;

import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.dto.QuantityTypeConfigDTO;
import com.mes.production.entity.AuditTrail;
import com.mes.production.entity.QuantityTypeConfig;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.QuantityTypeConfigRepository;
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
public class QuantityTypeConfigService {

    private final QuantityTypeConfigRepository repository;
    private final AuditTrailRepository auditTrailRepository;

    public List<QuantityTypeConfigDTO> getAllConfigs() {
        return repository.findAll().stream()
                .map(QuantityTypeConfigDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<QuantityTypeConfigDTO> getActiveConfigs() {
        return repository.findAllActive().stream()
                .map(QuantityTypeConfigDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public PagedResponseDTO<QuantityTypeConfigDTO> getConfigsPaged(PageRequestDTO request) {
        String sortBy = request.getSortBy() != null ? request.getSortBy() : "configName";
        Sort.Direction direction = "DESC".equalsIgnoreCase(request.getSortDirection())
                ? Sort.Direction.DESC : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(
                request.getPage(),
                Math.min(request.getSize(), 100),
                Sort.by(direction, sortBy)
        );

        Page<QuantityTypeConfig> page = repository.findByFilters(
                request.getSearch(), request.getStatus(), pageable);

        List<QuantityTypeConfigDTO> content = page.getContent().stream()
                .map(QuantityTypeConfigDTO::fromEntity)
                .collect(Collectors.toList());

        return PagedResponseDTO.<QuantityTypeConfigDTO>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    public QuantityTypeConfigDTO getConfigById(Long id) {
        QuantityTypeConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quantity type config not found with ID: " + id));
        return QuantityTypeConfigDTO.fromEntity(config);
    }

    @Transactional
    public QuantityTypeConfigDTO createConfig(QuantityTypeConfigDTO dto) {
        if (repository.existsByConfigName(dto.getConfigName())) {
            throw new RuntimeException("Config name already exists: " + dto.getConfigName());
        }

        String currentUser = getCurrentUsername();

        QuantityTypeConfig config = dto.toEntity();
        config.setCreatedBy(currentUser);
        config.setStatus(QuantityTypeConfig.STATUS_ACTIVE);

        QuantityTypeConfig saved = repository.save(config);

        auditAction(saved.getConfigId(), AuditTrail.ACTION_CREATE, null, saved.getConfigName(), currentUser);

        log.info("Created quantity type config: {} by {}", saved.getConfigName(), currentUser);
        return QuantityTypeConfigDTO.fromEntity(saved);
    }

    @Transactional
    public QuantityTypeConfigDTO updateConfig(Long id, QuantityTypeConfigDTO dto) {
        QuantityTypeConfig existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quantity type config not found with ID: " + id));

        String currentUser = getCurrentUsername();

        if (!existing.getConfigName().equals(dto.getConfigName()) &&
                repository.existsByConfigName(dto.getConfigName())) {
            throw new RuntimeException("Config name already exists: " + dto.getConfigName());
        }

        String oldValues = String.format("name=%s, type=%s, precision=%d",
                existing.getConfigName(), existing.getQuantityType(), existing.getDecimalPrecision());

        existing.setConfigName(dto.getConfigName());
        existing.setMaterialCode(dto.getMaterialCode());
        existing.setOperationType(dto.getOperationType());
        existing.setEquipmentType(dto.getEquipmentType());
        if (dto.getQuantityType() != null) existing.setQuantityType(dto.getQuantityType());
        if (dto.getDecimalPrecision() != null) existing.setDecimalPrecision(dto.getDecimalPrecision());
        if (dto.getRoundingRule() != null) existing.setRoundingRule(dto.getRoundingRule());
        existing.setMinQuantity(dto.getMinQuantity());
        existing.setMaxQuantity(dto.getMaxQuantity());
        existing.setUnit(dto.getUnit());
        if (dto.getStatus() != null) existing.setStatus(dto.getStatus());
        existing.setUpdatedBy(currentUser);

        QuantityTypeConfig saved = repository.save(existing);

        String newValues = String.format("name=%s, type=%s, precision=%d",
                saved.getConfigName(), saved.getQuantityType(), saved.getDecimalPrecision());
        auditAction(saved.getConfigId(), AuditTrail.ACTION_UPDATE, oldValues, newValues, currentUser);

        log.info("Updated quantity type config: {} by {}", saved.getConfigName(), currentUser);
        return QuantityTypeConfigDTO.fromEntity(saved);
    }

    @Transactional
    public void deleteConfig(Long id) {
        QuantityTypeConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quantity type config not found with ID: " + id));

        String currentUser = getCurrentUsername();

        config.setStatus(QuantityTypeConfig.STATUS_INACTIVE);
        config.setUpdatedBy(currentUser);
        repository.save(config);

        auditAction(config.getConfigId(), AuditTrail.ACTION_DELETE,
                QuantityTypeConfig.STATUS_ACTIVE, QuantityTypeConfig.STATUS_INACTIVE, currentUser);

        log.info("Deleted (deactivated) quantity type config: {} by {}", config.getConfigName(), currentUser);
    }

    private void auditAction(Long entityId, String action, String oldValue, String newValue, String user) {
        AuditTrail audit = AuditTrail.builder()
                .entityType("QUANTITY_TYPE_CONFIG")
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
