package com.mes.production.service;

import com.mes.production.dto.HoldReasonDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.entity.AuditTrail;
import com.mes.production.entity.HoldReason;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.HoldReasonRepository;
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
public class HoldReasonService {

    private final HoldReasonRepository holdReasonRepository;
    private final AuditTrailRepository auditTrailRepository;

    public List<HoldReasonDTO> getAllHoldReasons() {
        return holdReasonRepository.findAll().stream()
                .map(HoldReasonDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<HoldReasonDTO> getActiveHoldReasons() {
        return holdReasonRepository.findAllActive().stream()
                .map(HoldReasonDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<HoldReasonDTO> getActiveByApplicableTo(String applicableTo) {
        return holdReasonRepository.findActiveByApplicableTo(applicableTo).stream()
                .map(HoldReasonDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public PagedResponseDTO<HoldReasonDTO> getHoldReasonsPaged(PageRequestDTO request) {
        String sortBy = request.getSortBy() != null ? request.getSortBy() : "reasonCode";
        Sort.Direction direction = "DESC".equalsIgnoreCase(request.getSortDirection())
                ? Sort.Direction.DESC : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(
                request.getPage(),
                Math.min(request.getSize(), 100),
                Sort.by(direction, sortBy)
        );

        Page<HoldReason> page = holdReasonRepository.findByFilters(
                request.getSearch(),
                request.getStatus(),
                pageable
        );

        List<HoldReasonDTO> content = page.getContent().stream()
                .map(HoldReasonDTO::fromEntity)
                .collect(Collectors.toList());

        return PagedResponseDTO.<HoldReasonDTO>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    public HoldReasonDTO getHoldReasonById(Long id) {
        HoldReason reason = holdReasonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hold reason not found with ID: " + id));
        return HoldReasonDTO.fromEntity(reason);
    }

    @Transactional
    public HoldReasonDTO createHoldReason(HoldReasonDTO dto) {
        if (holdReasonRepository.existsByReasonCode(dto.getReasonCode())) {
            throw new RuntimeException("Hold reason code already exists: " + dto.getReasonCode());
        }

        String currentUser = getCurrentUsername();

        HoldReason reason = dto.toEntity();
        reason.setCreatedBy(currentUser);
        reason.setStatus(HoldReason.STATUS_ACTIVE);

        HoldReason saved = holdReasonRepository.save(reason);

        auditAction(saved.getReasonId(), AuditTrail.ACTION_CREATE, null, saved.getReasonCode(), currentUser);

        log.info("Created hold reason: {} by {}", saved.getReasonCode(), currentUser);
        return HoldReasonDTO.fromEntity(saved);
    }

    @Transactional
    public HoldReasonDTO updateHoldReason(Long id, HoldReasonDTO dto) {
        HoldReason existing = holdReasonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hold reason not found with ID: " + id));

        String currentUser = getCurrentUsername();

        if (!existing.getReasonCode().equals(dto.getReasonCode()) &&
                holdReasonRepository.existsByReasonCode(dto.getReasonCode())) {
            throw new RuntimeException("Hold reason code already exists: " + dto.getReasonCode());
        }

        String oldValues = String.format("code=%s, desc=%s", existing.getReasonCode(), existing.getReasonDescription());

        existing.setReasonCode(dto.getReasonCode());
        existing.setReasonDescription(dto.getReasonDescription());
        existing.setApplicableTo(dto.getApplicableTo());
        if (dto.getStatus() != null) {
            existing.setStatus(dto.getStatus());
        }
        existing.setUpdatedBy(currentUser);

        HoldReason saved = holdReasonRepository.save(existing);

        String newValues = String.format("code=%s, desc=%s", saved.getReasonCode(), saved.getReasonDescription());
        auditAction(saved.getReasonId(), AuditTrail.ACTION_UPDATE, oldValues, newValues, currentUser);

        log.info("Updated hold reason: {} by {}", saved.getReasonCode(), currentUser);
        return HoldReasonDTO.fromEntity(saved);
    }

    @Transactional
    public void deleteHoldReason(Long id) {
        HoldReason reason = holdReasonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hold reason not found with ID: " + id));

        String currentUser = getCurrentUsername();

        reason.setStatus(HoldReason.STATUS_INACTIVE);
        reason.setUpdatedBy(currentUser);
        holdReasonRepository.save(reason);

        auditAction(reason.getReasonId(), AuditTrail.ACTION_DELETE, HoldReason.STATUS_ACTIVE, HoldReason.STATUS_INACTIVE, currentUser);

        log.info("Deleted (deactivated) hold reason: {} by {}", reason.getReasonCode(), currentUser);
    }

    private void auditAction(Long entityId, String action, String oldValue, String newValue, String user) {
        AuditTrail audit = AuditTrail.builder()
                .entityType("HOLD_REASON")
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
