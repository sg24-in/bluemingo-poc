package com.mes.production.service;

import com.mes.production.dto.BatchNumberConfigDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.entity.AuditTrail;
import com.mes.production.entity.BatchNumberConfig;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.BatchNumberConfigRepository;
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
public class BatchNumberConfigService {

    private final BatchNumberConfigRepository repository;
    private final AuditTrailRepository auditTrailRepository;

    public List<BatchNumberConfigDTO> getAllConfigs() {
        return repository.findAll().stream()
                .map(BatchNumberConfigDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<BatchNumberConfigDTO> getActiveConfigs() {
        return repository.findAllActive().stream()
                .map(BatchNumberConfigDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public PagedResponseDTO<BatchNumberConfigDTO> getConfigsPaged(PageRequestDTO request) {
        String sortBy = request.getSortBy() != null ? request.getSortBy() : "priority";
        Sort.Direction direction = "DESC".equalsIgnoreCase(request.getSortDirection())
                ? Sort.Direction.DESC : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(
                request.getPage(),
                Math.min(request.getSize(), 100),
                Sort.by(direction, sortBy)
        );

        Page<BatchNumberConfig> page = repository.findByFilters(
                request.getSearch(), request.getStatus(), pageable);

        List<BatchNumberConfigDTO> content = page.getContent().stream()
                .map(BatchNumberConfigDTO::fromEntity)
                .collect(Collectors.toList());

        return PagedResponseDTO.<BatchNumberConfigDTO>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    public BatchNumberConfigDTO getConfigById(Long id) {
        BatchNumberConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch number config not found with ID: " + id));
        return BatchNumberConfigDTO.fromEntity(config);
    }

    @Transactional
    public BatchNumberConfigDTO createConfig(BatchNumberConfigDTO dto) {
        if (repository.existsByConfigName(dto.getConfigName())) {
            throw new RuntimeException("Config name already exists: " + dto.getConfigName());
        }

        String currentUser = getCurrentUsername();

        BatchNumberConfig config = dto.toEntity();
        config.setCreatedBy(currentUser);
        config.setStatus(BatchNumberConfig.STATUS_ACTIVE);

        BatchNumberConfig saved = repository.save(config);

        auditAction(saved.getConfigId(), AuditTrail.ACTION_CREATE, null, saved.getConfigName(), currentUser);

        log.info("Created batch number config: {} by {}", saved.getConfigName(), currentUser);
        return BatchNumberConfigDTO.fromEntity(saved);
    }

    @Transactional
    public BatchNumberConfigDTO updateConfig(Long id, BatchNumberConfigDTO dto) {
        BatchNumberConfig existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch number config not found with ID: " + id));

        String currentUser = getCurrentUsername();

        if (!existing.getConfigName().equals(dto.getConfigName()) &&
                repository.existsByConfigName(dto.getConfigName())) {
            throw new RuntimeException("Config name already exists: " + dto.getConfigName());
        }

        String oldValues = String.format("name=%s, prefix=%s, seq=%s",
                existing.getConfigName(), existing.getPrefix(), existing.getSequenceReset());

        existing.setConfigName(dto.getConfigName());
        existing.setOperationType(dto.getOperationType());
        existing.setProductSku(dto.getProductSku());
        if (dto.getPrefix() != null) existing.setPrefix(dto.getPrefix());
        if (dto.getIncludeOperationCode() != null) existing.setIncludeOperationCode(dto.getIncludeOperationCode());
        if (dto.getOperationCodeLength() != null) existing.setOperationCodeLength(dto.getOperationCodeLength());
        if (dto.getSeparator() != null) existing.setSeparator(dto.getSeparator());
        existing.setDateFormat(dto.getDateFormat());
        if (dto.getIncludeDate() != null) existing.setIncludeDate(dto.getIncludeDate());
        if (dto.getSequenceLength() != null) existing.setSequenceLength(dto.getSequenceLength());
        if (dto.getSequenceReset() != null) existing.setSequenceReset(dto.getSequenceReset());
        if (dto.getPriority() != null) existing.setPriority(dto.getPriority());
        if (dto.getStatus() != null) existing.setStatus(dto.getStatus());
        existing.setUpdatedBy(currentUser);

        BatchNumberConfig saved = repository.save(existing);

        String newValues = String.format("name=%s, prefix=%s, seq=%s",
                saved.getConfigName(), saved.getPrefix(), saved.getSequenceReset());
        auditAction(saved.getConfigId(), AuditTrail.ACTION_UPDATE, oldValues, newValues, currentUser);

        log.info("Updated batch number config: {} by {}", saved.getConfigName(), currentUser);
        return BatchNumberConfigDTO.fromEntity(saved);
    }

    @Transactional
    public void deleteConfig(Long id) {
        BatchNumberConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch number config not found with ID: " + id));

        String currentUser = getCurrentUsername();

        config.setStatus(BatchNumberConfig.STATUS_INACTIVE);
        config.setUpdatedBy(currentUser);
        repository.save(config);

        auditAction(config.getConfigId(), AuditTrail.ACTION_DELETE,
                BatchNumberConfig.STATUS_ACTIVE, BatchNumberConfig.STATUS_INACTIVE, currentUser);

        log.info("Deleted (deactivated) batch number config: {} by {}", config.getConfigName(), currentUser);
    }

    private void auditAction(Long entityId, String action, String oldValue, String newValue, String user) {
        AuditTrail audit = AuditTrail.builder()
                .entityType("BATCH_NUMBER_CONFIG")
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
