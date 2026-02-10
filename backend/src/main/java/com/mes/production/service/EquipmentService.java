package com.mes.production.service;

import com.mes.production.dto.EquipmentDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.entity.AuditTrail;
import com.mes.production.entity.Equipment;
import com.mes.production.entity.HoldRecord;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.EquipmentRepository;
import com.mes.production.repository.HoldRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final AuditService auditService;
    private final AuditTrailRepository auditTrailRepository;
    private final HoldRecordRepository holdRecordRepository;

    /**
     * Get all equipment
     */
    public List<EquipmentDTO> getAllEquipment() {
        return equipmentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get equipment with pagination, sorting, and filtering
     */
    public PagedResponseDTO<EquipmentDTO> getEquipmentPaged(PageRequestDTO pageRequest) {
        log.info("Fetching equipment with pagination: page={}, size={}, status={}, type={}, search={}",
                pageRequest.getPage(), pageRequest.getSize(),
                pageRequest.getStatus(), pageRequest.getType(), pageRequest.getSearch());

        Pageable pageable = pageRequest.toPageable("equipmentCode");

        Page<Equipment> page;
        if (pageRequest.hasFilters()) {
            page = equipmentRepository.findByFilters(
                    pageRequest.getStatus(),
                    pageRequest.getType(),
                    pageRequest.getSearchPattern(),
                    pageable);
        } else {
            page = equipmentRepository.findAll(pageable);
        }

        Page<EquipmentDTO> dtoPage = page.map(this::convertToDTO);

        return PagedResponseDTO.fromPage(dtoPage,
                pageRequest.getSortBy(),
                pageRequest.getSortDirection(),
                pageRequest.getSearch());
    }

    /**
     * Get equipment by ID
     */
    public EquipmentDTO getEquipmentById(Long equipmentId) {
        Equipment equipment = getEquipmentEntity(equipmentId);
        return convertToDTO(equipment);
    }

    /**
     * Get equipment by status
     */
    public List<EquipmentDTO> getEquipmentByStatus(String status) {
        return equipmentRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get equipment under maintenance
     */
    public List<EquipmentDTO> getMaintenanceEquipment() {
        return equipmentRepository.findByStatus(Equipment.STATUS_MAINTENANCE).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get equipment on hold
     */
    public List<EquipmentDTO> getOnHoldEquipment() {
        return equipmentRepository.findByStatus(Equipment.STATUS_ON_HOLD).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Start maintenance for equipment
     */
    @Transactional
    public EquipmentDTO.StatusUpdateResponse startMaintenance(Long equipmentId, String reason, LocalDateTime expectedEndTime) {
        log.info("Starting maintenance for equipment: {}", equipmentId);

        String currentUser = getCurrentUser();
        Equipment equipment = getEquipmentEntity(equipmentId);
        String oldStatus = equipment.getStatus();

        // Validate current status
        if (Equipment.STATUS_IN_USE.equals(oldStatus)) {
            throw new RuntimeException("Cannot start maintenance on equipment currently in use");
        }

        if (Equipment.STATUS_MAINTENANCE.equals(oldStatus)) {
            throw new RuntimeException("Equipment is already under maintenance");
        }

        // Update status
        equipment.setStatus(Equipment.STATUS_MAINTENANCE);
        equipment.setMaintenanceReason(reason);
        equipment.setMaintenanceStart(LocalDateTime.now());
        equipment.setMaintenanceBy(currentUser);
        equipment.setExpectedMaintenanceEnd(expectedEndTime);
        equipment.setUpdatedBy(currentUser);
        equipmentRepository.save(equipment);

        log.info("Equipment {} maintenance started by {}", equipmentId, currentUser);
        auditService.logStatusChange("EQUIPMENT", equipmentId, oldStatus, Equipment.STATUS_MAINTENANCE);

        return EquipmentDTO.StatusUpdateResponse.builder()
                .equipmentId(equipmentId)
                .equipmentCode(equipment.getEquipmentCode())
                .previousStatus(oldStatus)
                .newStatus(Equipment.STATUS_MAINTENANCE)
                .message("Equipment maintenance started. Reason: " + reason)
                .updatedBy(currentUser)
                .updatedOn(equipment.getUpdatedOn())
                .build();
    }

    /**
     * End maintenance for equipment
     */
    @Transactional
    public EquipmentDTO.StatusUpdateResponse endMaintenance(Long equipmentId) {
        log.info("Ending maintenance for equipment: {}", equipmentId);

        String currentUser = getCurrentUser();
        Equipment equipment = getEquipmentEntity(equipmentId);
        String oldStatus = equipment.getStatus();

        if (!Equipment.STATUS_MAINTENANCE.equals(oldStatus)) {
            throw new RuntimeException("Equipment is not under maintenance. Current status: " + oldStatus);
        }

        // Update status back to AVAILABLE
        equipment.setStatus(Equipment.STATUS_AVAILABLE);
        equipment.setMaintenanceReason(null);
        equipment.setMaintenanceStart(null);
        equipment.setMaintenanceBy(null);
        equipment.setExpectedMaintenanceEnd(null);
        equipment.setUpdatedBy(currentUser);
        equipmentRepository.save(equipment);

        log.info("Equipment {} maintenance ended by {}", equipmentId, currentUser);
        auditService.logStatusChange("EQUIPMENT", equipmentId, oldStatus, Equipment.STATUS_AVAILABLE);

        return EquipmentDTO.StatusUpdateResponse.builder()
                .equipmentId(equipmentId)
                .equipmentCode(equipment.getEquipmentCode())
                .previousStatus(oldStatus)
                .newStatus(Equipment.STATUS_AVAILABLE)
                .message("Equipment maintenance completed and now available")
                .updatedBy(currentUser)
                .updatedOn(equipment.getUpdatedOn())
                .build();
    }

    /**
     * Put equipment on hold
     */
    @Transactional
    public EquipmentDTO.StatusUpdateResponse putOnHold(Long equipmentId, String reason) {
        log.info("Putting equipment on hold: {}", equipmentId);

        String currentUser = getCurrentUser();
        Equipment equipment = getEquipmentEntity(equipmentId);
        String oldStatus = equipment.getStatus();

        // Validate current status
        if (Equipment.STATUS_IN_USE.equals(oldStatus)) {
            throw new RuntimeException("Cannot put equipment on hold while in use");
        }

        if (Equipment.STATUS_ON_HOLD.equals(oldStatus)) {
            throw new RuntimeException("Equipment is already on hold");
        }

        // Update status
        equipment.setStatus(Equipment.STATUS_ON_HOLD);
        equipment.setHoldReason(reason);
        equipment.setHoldStart(LocalDateTime.now());
        equipment.setHeldBy(currentUser);
        equipment.setUpdatedBy(currentUser);
        equipmentRepository.save(equipment);

        // Create HoldRecord for audit trail consistency (R-07)
        HoldRecord holdRecord = HoldRecord.builder()
                .entityType(HoldRecord.ENTITY_TYPE_EQUIPMENT)
                .entityId(equipmentId)
                .reason(reason)
                .appliedBy(currentUser)
                .appliedOn(LocalDateTime.now())
                .status(HoldRecord.STATUS_ACTIVE)
                .build();
        holdRecord.setPreviousStatus(oldStatus);
        holdRecordRepository.save(holdRecord);

        log.info("Equipment {} put on hold by {}", equipmentId, currentUser);
        auditService.logStatusChange("EQUIPMENT", equipmentId, oldStatus, Equipment.STATUS_ON_HOLD);

        return EquipmentDTO.StatusUpdateResponse.builder()
                .equipmentId(equipmentId)
                .equipmentCode(equipment.getEquipmentCode())
                .previousStatus(oldStatus)
                .newStatus(Equipment.STATUS_ON_HOLD)
                .message("Equipment put on hold. Reason: " + reason)
                .updatedBy(currentUser)
                .updatedOn(equipment.getUpdatedOn())
                .build();
    }

    /**
     * Release equipment from hold
     */
    @Transactional
    public EquipmentDTO.StatusUpdateResponse releaseFromHold(Long equipmentId) {
        log.info("Releasing equipment from hold: {}", equipmentId);

        String currentUser = getCurrentUser();
        Equipment equipment = getEquipmentEntity(equipmentId);
        String oldStatus = equipment.getStatus();

        if (!Equipment.STATUS_ON_HOLD.equals(oldStatus)) {
            throw new RuntimeException("Equipment is not on hold. Current status: " + oldStatus);
        }

        // Update status back to AVAILABLE
        equipment.setStatus(Equipment.STATUS_AVAILABLE);
        equipment.setHoldReason(null);
        equipment.setHoldStart(null);
        equipment.setHeldBy(null);
        equipment.setUpdatedBy(currentUser);
        equipmentRepository.save(equipment);

        // Release active HoldRecord for audit trail consistency (R-07)
        holdRecordRepository.findByEntityTypeAndEntityIdAndStatus(
                HoldRecord.ENTITY_TYPE_EQUIPMENT, equipmentId, HoldRecord.STATUS_ACTIVE)
                .ifPresent(holdRecord -> {
                    holdRecord.setReleasedBy(currentUser);
                    holdRecord.setReleasedOn(LocalDateTime.now());
                    holdRecord.setStatus(HoldRecord.STATUS_RELEASED);
                    holdRecordRepository.save(holdRecord);
                });

        log.info("Equipment {} released from hold by {}", equipmentId, currentUser);
        auditService.logStatusChange("EQUIPMENT", equipmentId, oldStatus, Equipment.STATUS_AVAILABLE);

        return EquipmentDTO.StatusUpdateResponse.builder()
                .equipmentId(equipmentId)
                .equipmentCode(equipment.getEquipmentCode())
                .previousStatus(oldStatus)
                .newStatus(Equipment.STATUS_AVAILABLE)
                .message("Equipment released from hold and now available")
                .updatedBy(currentUser)
                .updatedOn(equipment.getUpdatedOn())
                .build();
    }

    /**
     * Create new equipment
     */
    @Transactional
    public EquipmentDTO createEquipment(EquipmentDTO.CreateEquipmentRequest request) {
        log.info("Creating equipment: {}", request.getEquipmentCode());

        if (equipmentRepository.existsByEquipmentCode(request.getEquipmentCode())) {
            throw new RuntimeException("Equipment code already exists: " + request.getEquipmentCode());
        }

        String currentUser = getCurrentUser();

        Equipment equipment = Equipment.builder()
                .equipmentCode(request.getEquipmentCode())
                .name(request.getName())
                .equipmentType(request.getEquipmentType())
                .capacity(request.getCapacity())
                .capacityUnit(request.getCapacityUnit())
                .location(request.getLocation())
                .status(Equipment.STATUS_AVAILABLE)
                .createdBy(currentUser)
                .build();

        Equipment saved = equipmentRepository.save(equipment);

        auditEquipmentAction(saved.getEquipmentId(), AuditTrail.ACTION_CREATE, null, saved.getEquipmentCode(), currentUser);

        log.info("Created equipment: {} by {}", saved.getEquipmentCode(), currentUser);
        return convertToDTO(saved);
    }

    /**
     * Update existing equipment
     */
    @Transactional
    public EquipmentDTO updateEquipment(Long equipmentId, EquipmentDTO.UpdateEquipmentRequest request) {
        log.info("Updating equipment: {}", equipmentId);

        Equipment existing = getEquipmentEntity(equipmentId);
        String currentUser = getCurrentUser();

        // Check for duplicate code if changed
        if (!existing.getEquipmentCode().equals(request.getEquipmentCode()) &&
                equipmentRepository.existsByEquipmentCode(request.getEquipmentCode())) {
            throw new RuntimeException("Equipment code already exists: " + request.getEquipmentCode());
        }

        String oldValues = String.format("code=%s, name=%s, type=%s", existing.getEquipmentCode(), existing.getName(), existing.getEquipmentType());

        existing.setEquipmentCode(request.getEquipmentCode());
        existing.setName(request.getName());
        existing.setEquipmentType(request.getEquipmentType());
        existing.setCapacity(request.getCapacity());
        existing.setCapacityUnit(request.getCapacityUnit());
        existing.setLocation(request.getLocation());
        if (request.getStatus() != null) {
            existing.setStatus(request.getStatus());
        }
        existing.setUpdatedBy(currentUser);

        Equipment saved = equipmentRepository.save(existing);

        String newValues = String.format("code=%s, name=%s, type=%s", saved.getEquipmentCode(), saved.getName(), saved.getEquipmentType());
        auditEquipmentAction(saved.getEquipmentId(), AuditTrail.ACTION_UPDATE, oldValues, newValues, currentUser);

        log.info("Updated equipment: {} by {}", saved.getEquipmentCode(), currentUser);
        return convertToDTO(saved);
    }

    /**
     * Delete equipment (soft delete - set status to UNAVAILABLE)
     */
    @Transactional
    public void deleteEquipment(Long equipmentId) {
        Equipment equipment = getEquipmentEntity(equipmentId);
        String currentUser = getCurrentUser();

        if (Equipment.STATUS_IN_USE.equals(equipment.getStatus())) {
            throw new RuntimeException("Cannot delete equipment that is currently in use");
        }

        equipment.setStatus(Equipment.STATUS_UNAVAILABLE);
        equipment.setUpdatedBy(currentUser);
        equipmentRepository.save(equipment);

        auditEquipmentAction(equipment.getEquipmentId(), AuditTrail.ACTION_DELETE, Equipment.STATUS_AVAILABLE, Equipment.STATUS_UNAVAILABLE, currentUser);

        log.info("Deleted (deactivated) equipment: {} by {}", equipment.getEquipmentCode(), currentUser);
    }

    private void auditEquipmentAction(Long equipmentId, String action, String oldValue, String newValue, String user) {
        AuditTrail audit = AuditTrail.builder()
                .entityType("EQUIPMENT")
                .entityId(equipmentId)
                .action(action)
                .oldValue(oldValue)
                .newValue(newValue)
                .changedBy(user)
                .timestamp(LocalDateTime.now())
                .build();
        auditTrailRepository.save(audit);
    }

    private Equipment getEquipmentEntity(Long equipmentId) {
        return equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new RuntimeException("Equipment not found: " + equipmentId));
    }

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
    }

    private EquipmentDTO convertToDTO(Equipment equipment) {
        return EquipmentDTO.builder()
                .equipmentId(equipment.getEquipmentId())
                .equipmentCode(equipment.getEquipmentCode())
                .name(equipment.getName())
                .equipmentType(equipment.getEquipmentType())
                .capacity(equipment.getCapacity())
                .capacityUnit(equipment.getCapacityUnit())
                .location(equipment.getLocation())
                .status(equipment.getStatus())
                .maintenanceReason(equipment.getMaintenanceReason())
                .maintenanceStart(equipment.getMaintenanceStart())
                .maintenanceBy(equipment.getMaintenanceBy())
                .expectedMaintenanceEnd(equipment.getExpectedMaintenanceEnd())
                .holdReason(equipment.getHoldReason())
                .holdStart(equipment.getHoldStart())
                .heldBy(equipment.getHeldBy())
                .build();
    }
}
