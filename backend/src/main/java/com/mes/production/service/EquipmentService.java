package com.mes.production.service;

import com.mes.production.dto.EquipmentDTO;
import com.mes.production.entity.Equipment;
import com.mes.production.repository.EquipmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    /**
     * Get all equipment
     */
    public List<EquipmentDTO> getAllEquipment() {
        return equipmentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
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
