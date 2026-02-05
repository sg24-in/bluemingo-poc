package com.mes.production.service;

import com.mes.production.dto.OperatorDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.entity.AuditTrail;
import com.mes.production.entity.Operator;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.OperatorRepository;
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
public class OperatorService {

    private final OperatorRepository operatorRepository;
    private final AuditTrailRepository auditTrailRepository;

    public List<OperatorDTO> getAllOperators() {
        return operatorRepository.findAll().stream()
                .map(OperatorDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<OperatorDTO> getActiveOperators() {
        return operatorRepository.findByStatus("ACTIVE").stream()
                .map(OperatorDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public PagedResponseDTO<OperatorDTO> getOperatorsPaged(PageRequestDTO request) {
        String sortBy = request.getSortBy() != null ? request.getSortBy() : "name";
        Sort.Direction direction = "DESC".equalsIgnoreCase(request.getSortDirection())
                ? Sort.Direction.DESC : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(
                request.getPage(),
                Math.min(request.getSize(), 100),
                Sort.by(direction, sortBy)
        );

        Page<Operator> page = operatorRepository.findByFilters(
                request.getStatus(),
                request.getSearch(),
                pageable
        );

        List<OperatorDTO> content = page.getContent().stream()
                .map(OperatorDTO::fromEntity)
                .collect(Collectors.toList());

        return PagedResponseDTO.<OperatorDTO>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    public OperatorDTO getOperatorById(Long id) {
        Operator operator = operatorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Operator not found with ID: " + id));
        return OperatorDTO.fromEntity(operator);
    }

    @Transactional
    public OperatorDTO createOperator(OperatorDTO dto) {
        log.info("Creating operator: {}", dto.getOperatorCode());

        if (operatorRepository.existsByOperatorCode(dto.getOperatorCode())) {
            throw new RuntimeException("Operator code already exists: " + dto.getOperatorCode());
        }

        String currentUser = getCurrentUsername();

        Operator operator = dto.toEntity();
        operator.setCreatedBy(currentUser);
        operator.setStatus("ACTIVE");

        Operator saved = operatorRepository.save(operator);

        auditOperatorAction(saved.getOperatorId(), AuditTrail.ACTION_CREATE, null, saved.getOperatorCode(), currentUser);

        log.info("Created operator: {} by {}", saved.getOperatorCode(), currentUser);
        return OperatorDTO.fromEntity(saved);
    }

    @Transactional
    public OperatorDTO updateOperator(Long id, OperatorDTO dto) {
        Operator existing = operatorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Operator not found with ID: " + id));

        String currentUser = getCurrentUsername();

        if (!existing.getOperatorCode().equals(dto.getOperatorCode()) &&
                operatorRepository.existsByOperatorCode(dto.getOperatorCode())) {
            throw new RuntimeException("Operator code already exists: " + dto.getOperatorCode());
        }

        String oldValues = String.format("code=%s, name=%s", existing.getOperatorCode(), existing.getName());

        existing.setOperatorCode(dto.getOperatorCode());
        existing.setName(dto.getName());
        existing.setDepartment(dto.getDepartment());
        existing.setShift(dto.getShift());
        if (dto.getStatus() != null) {
            existing.setStatus(dto.getStatus());
        }
        existing.setUpdatedBy(currentUser);

        Operator saved = operatorRepository.save(existing);

        String newValues = String.format("code=%s, name=%s", saved.getOperatorCode(), saved.getName());
        auditOperatorAction(saved.getOperatorId(), AuditTrail.ACTION_UPDATE, oldValues, newValues, currentUser);

        log.info("Updated operator: {} by {}", saved.getOperatorCode(), currentUser);
        return OperatorDTO.fromEntity(saved);
    }

    @Transactional
    public void deleteOperator(Long id) {
        Operator operator = operatorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Operator not found with ID: " + id));

        String currentUser = getCurrentUsername();

        operator.setStatus("INACTIVE");
        operator.setUpdatedBy(currentUser);
        operatorRepository.save(operator);

        auditOperatorAction(operator.getOperatorId(), AuditTrail.ACTION_DELETE, "ACTIVE", "INACTIVE", currentUser);

        log.info("Deleted (deactivated) operator: {} by {}", operator.getOperatorCode(), currentUser);
    }

    private void auditOperatorAction(Long operatorId, String action, String oldValue, String newValue, String user) {
        AuditTrail audit = AuditTrail.builder()
                .entityType("OPERATOR")
                .entityId(operatorId)
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
