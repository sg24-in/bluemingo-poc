package com.mes.production.service;

import com.mes.production.dto.DelayReasonDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.entity.AuditTrail;
import com.mes.production.entity.DelayReason;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.DelayReasonRepository;
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
public class DelayReasonService {

    private final DelayReasonRepository delayReasonRepository;
    private final AuditTrailRepository auditTrailRepository;

    public List<DelayReasonDTO> getAllDelayReasons() {
        return delayReasonRepository.findAll().stream()
                .map(DelayReasonDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<DelayReasonDTO> getActiveDelayReasons() {
        return delayReasonRepository.findAllActive().stream()
                .map(DelayReasonDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public PagedResponseDTO<DelayReasonDTO> getDelayReasonsPaged(PageRequestDTO request) {
        String sortBy = request.getSortBy() != null ? request.getSortBy() : "reasonCode";
        Sort.Direction direction = "DESC".equalsIgnoreCase(request.getSortDirection())
                ? Sort.Direction.DESC : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(
                request.getPage(),
                Math.min(request.getSize(), 100),
                Sort.by(direction, sortBy)
        );

        Page<DelayReason> page = delayReasonRepository.findByFilters(
                request.getSearch(),
                request.getStatus(),
                pageable
        );

        List<DelayReasonDTO> content = page.getContent().stream()
                .map(DelayReasonDTO::fromEntity)
                .collect(Collectors.toList());

        return PagedResponseDTO.<DelayReasonDTO>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    public DelayReasonDTO getDelayReasonById(Long id) {
        DelayReason reason = delayReasonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delay reason not found with ID: " + id));
        return DelayReasonDTO.fromEntity(reason);
    }

    @Transactional
    public DelayReasonDTO createDelayReason(DelayReasonDTO dto) {
        if (delayReasonRepository.existsByReasonCode(dto.getReasonCode())) {
            throw new RuntimeException("Delay reason code already exists: " + dto.getReasonCode());
        }

        String currentUser = getCurrentUsername();

        DelayReason reason = dto.toEntity();
        reason.setCreatedBy(currentUser);
        reason.setStatus(DelayReason.STATUS_ACTIVE);

        DelayReason saved = delayReasonRepository.save(reason);

        auditAction(saved.getReasonId(), AuditTrail.ACTION_CREATE, null, saved.getReasonCode(), currentUser);

        log.info("Created delay reason: {} by {}", saved.getReasonCode(), currentUser);
        return DelayReasonDTO.fromEntity(saved);
    }

    @Transactional
    public DelayReasonDTO updateDelayReason(Long id, DelayReasonDTO dto) {
        DelayReason existing = delayReasonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delay reason not found with ID: " + id));

        String currentUser = getCurrentUsername();

        if (!existing.getReasonCode().equals(dto.getReasonCode()) &&
                delayReasonRepository.existsByReasonCode(dto.getReasonCode())) {
            throw new RuntimeException("Delay reason code already exists: " + dto.getReasonCode());
        }

        String oldValues = String.format("code=%s, desc=%s", existing.getReasonCode(), existing.getReasonDescription());

        existing.setReasonCode(dto.getReasonCode());
        existing.setReasonDescription(dto.getReasonDescription());
        if (dto.getStatus() != null) {
            existing.setStatus(dto.getStatus());
        }
        existing.setUpdatedBy(currentUser);

        DelayReason saved = delayReasonRepository.save(existing);

        String newValues = String.format("code=%s, desc=%s", saved.getReasonCode(), saved.getReasonDescription());
        auditAction(saved.getReasonId(), AuditTrail.ACTION_UPDATE, oldValues, newValues, currentUser);

        log.info("Updated delay reason: {} by {}", saved.getReasonCode(), currentUser);
        return DelayReasonDTO.fromEntity(saved);
    }

    @Transactional
    public void deleteDelayReason(Long id) {
        DelayReason reason = delayReasonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delay reason not found with ID: " + id));

        String currentUser = getCurrentUsername();

        reason.setStatus(DelayReason.STATUS_INACTIVE);
        reason.setUpdatedBy(currentUser);
        delayReasonRepository.save(reason);

        auditAction(reason.getReasonId(), AuditTrail.ACTION_DELETE, DelayReason.STATUS_ACTIVE, DelayReason.STATUS_INACTIVE, currentUser);

        log.info("Deleted (deactivated) delay reason: {} by {}", reason.getReasonCode(), currentUser);
    }

    private void auditAction(Long entityId, String action, String oldValue, String newValue, String user) {
        AuditTrail audit = AuditTrail.builder()
                .entityType("DELAY_REASON")
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
