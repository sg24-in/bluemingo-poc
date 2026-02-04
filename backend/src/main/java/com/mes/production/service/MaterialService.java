package com.mes.production.service;

import com.mes.production.dto.MaterialDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.entity.AuditTrail;
import com.mes.production.entity.Material;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.MaterialRepository;
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
public class MaterialService {

    private final MaterialRepository materialRepository;
    private final AuditTrailRepository auditTrailRepository;

    /**
     * Get all materials
     */
    public List<MaterialDTO> getAllMaterials() {
        return materialRepository.findAll().stream()
                .map(MaterialDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get all active materials
     */
    public List<MaterialDTO> getActiveMaterials() {
        return materialRepository.findAllActiveMaterials().stream()
                .map(MaterialDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get active materials by type
     */
    public List<MaterialDTO> getActiveMaterialsByType(String type) {
        return materialRepository.findActiveMaterialsByType(type).stream()
                .map(MaterialDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get consumable materials (RM and IM)
     */
    public List<MaterialDTO> getConsumableMaterials() {
        return materialRepository.findConsumableMaterials().stream()
                .map(MaterialDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get materials with pagination
     */
    public PagedResponseDTO<MaterialDTO> getMaterialsPaged(PageRequestDTO request) {
        String sortBy = request.getSortBy() != null ? request.getSortBy() : "materialName";
        Sort.Direction direction = "DESC".equalsIgnoreCase(request.getSortDirection())
                ? Sort.Direction.DESC : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(
                request.getPage(),
                Math.min(request.getSize(), 100),
                Sort.by(direction, sortBy)
        );

        Page<Material> page = materialRepository.findByFilters(
                request.getSearch(),
                request.getStatus(),
                request.getType(),
                pageable
        );

        List<MaterialDTO> content = page.getContent().stream()
                .map(MaterialDTO::fromEntity)
                .collect(Collectors.toList());

        return PagedResponseDTO.<MaterialDTO>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    /**
     * Get material by ID
     */
    public MaterialDTO getMaterialById(Long id) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material not found with ID: " + id));
        return MaterialDTO.fromEntity(material);
    }

    /**
     * Get material by code
     */
    public MaterialDTO getMaterialByCode(String code) {
        Material material = materialRepository.findByMaterialCode(code)
                .orElseThrow(() -> new RuntimeException("Material not found with code: " + code));
        return MaterialDTO.fromEntity(material);
    }

    /**
     * Create a new material
     */
    @Transactional
    public MaterialDTO createMaterial(MaterialDTO dto) {
        if (materialRepository.existsByMaterialCode(dto.getMaterialCode())) {
            throw new RuntimeException("Material code already exists: " + dto.getMaterialCode());
        }

        String currentUser = getCurrentUsername();

        Material material = dto.toEntity();
        material.setCreatedBy(currentUser);
        material.setStatus(Material.STATUS_ACTIVE);

        Material saved = materialRepository.save(material);

        auditMaterialAction(saved.getMaterialId(), AuditTrail.ACTION_CREATE, null, saved.getMaterialCode(), currentUser);

        log.info("Created material: {} by {}", saved.getMaterialCode(), currentUser);
        return MaterialDTO.fromEntity(saved);
    }

    /**
     * Update an existing material
     */
    @Transactional
    public MaterialDTO updateMaterial(Long id, MaterialDTO dto) {
        Material existing = materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material not found with ID: " + id));

        String currentUser = getCurrentUsername();

        if (!existing.getMaterialCode().equals(dto.getMaterialCode()) &&
                materialRepository.existsByMaterialCode(dto.getMaterialCode())) {
            throw new RuntimeException("Material code already exists: " + dto.getMaterialCode());
        }

        String oldValues = String.format("code=%s, name=%s", existing.getMaterialCode(), existing.getMaterialName());

        // Update fields
        existing.setMaterialCode(dto.getMaterialCode());
        existing.setMaterialName(dto.getMaterialName());
        existing.setDescription(dto.getDescription());
        existing.setMaterialType(dto.getMaterialType());
        existing.setBaseUnit(dto.getBaseUnit());
        existing.setMaterialGroup(dto.getMaterialGroup());
        existing.setSku(dto.getSku());
        existing.setStandardCost(dto.getStandardCost());
        existing.setCostCurrency(dto.getCostCurrency());
        existing.setMinStockLevel(dto.getMinStockLevel());
        existing.setMaxStockLevel(dto.getMaxStockLevel());
        existing.setReorderPoint(dto.getReorderPoint());
        existing.setLeadTimeDays(dto.getLeadTimeDays());
        existing.setShelfLifeDays(dto.getShelfLifeDays());
        existing.setStorageConditions(dto.getStorageConditions());
        if (dto.getStatus() != null) {
            existing.setStatus(dto.getStatus());
        }
        existing.setUpdatedBy(currentUser);

        Material saved = materialRepository.save(existing);

        String newValues = String.format("code=%s, name=%s", saved.getMaterialCode(), saved.getMaterialName());
        auditMaterialAction(saved.getMaterialId(), AuditTrail.ACTION_UPDATE, oldValues, newValues, currentUser);

        log.info("Updated material: {} by {}", saved.getMaterialCode(), currentUser);
        return MaterialDTO.fromEntity(saved);
    }

    /**
     * Delete a material (soft delete)
     */
    @Transactional
    public void deleteMaterial(Long id) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material not found with ID: " + id));

        String currentUser = getCurrentUsername();

        material.setStatus(Material.STATUS_INACTIVE);
        material.setUpdatedBy(currentUser);
        materialRepository.save(material);

        auditMaterialAction(material.getMaterialId(), AuditTrail.ACTION_DELETE, Material.STATUS_ACTIVE, Material.STATUS_INACTIVE, currentUser);

        log.info("Deleted (deactivated) material: {} by {}", material.getMaterialCode(), currentUser);
    }

    private void auditMaterialAction(Long materialId, String action, String oldValue, String newValue, String user) {
        AuditTrail audit = AuditTrail.builder()
                .entityType("MATERIAL")
                .entityId(materialId)
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
