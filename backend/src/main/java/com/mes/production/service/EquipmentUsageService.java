package com.mes.production.service;

import com.mes.production.entity.*;
import com.mes.production.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EquipmentUsageService {

    private final OperationEquipmentUsageRepository usageRepository;
    private final OperationRepository operationRepository;
    private final EquipmentRepository equipmentRepository;
    private final OperatorRepository operatorRepository;
    private final AuditService auditService;

    /**
     * Log equipment usage for an operation
     */
    @Transactional
    public OperationEquipmentUsage logEquipmentUsage(Long operationId, Long equipmentId, Long operatorId,
                                                      LocalDateTime startTime, LocalDateTime endTime) {
        Operation operation = operationRepository.findById(operationId)
                .orElseThrow(() -> new RuntimeException("Operation not found: " + operationId));

        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new RuntimeException("Equipment not found: " + equipmentId));

        Operator operator = operatorId != null ? operatorRepository.findById(operatorId).orElse(null) : null;

        OperationEquipmentUsage usage = OperationEquipmentUsage.builder()
                .operation(operation)
                .equipment(equipment)
                .operator(operator)
                .startTime(startTime)
                .endTime(endTime)
                .status(OperationEquipmentUsage.STATUS_LOGGED)
                .createdBy(getCurrentUser())
                .build();

        usage = usageRepository.save(usage);
        log.info("Logged equipment usage: Operation={}, Equipment={}, Operator={}",
                operationId, equipmentId, operatorId);

        auditService.logCreate("EQUIPMENT_USAGE", usage.getUsageId(),
                String.format("Equipment: %s, Operation: %s", equipment.getName(), operation.getOperationName()));

        return usage;
    }

    /**
     * Log multiple equipment usages for an operation (from production confirmation)
     */
    @Transactional
    public void logEquipmentUsagesForConfirmation(Long operationId, List<Long> equipmentIds,
                                                   List<Long> operatorIds, LocalDateTime startTime,
                                                   LocalDateTime endTime) {
        if (equipmentIds == null || equipmentIds.isEmpty()) {
            return;
        }

        Operation operation = operationRepository.findById(operationId)
                .orElseThrow(() -> new RuntimeException("Operation not found: " + operationId));

        for (int i = 0; i < equipmentIds.size(); i++) {
            Long equipmentId = equipmentIds.get(i);
            Long operatorId = (operatorIds != null && i < operatorIds.size()) ? operatorIds.get(i) : null;

            Equipment equipment = equipmentRepository.findById(equipmentId)
                    .orElseThrow(() -> new RuntimeException("Equipment not found: " + equipmentId));

            Operator operator = operatorId != null ? operatorRepository.findById(operatorId).orElse(null) : null;

            OperationEquipmentUsage usage = OperationEquipmentUsage.builder()
                    .operation(operation)
                    .equipment(equipment)
                    .operator(operator)
                    .startTime(startTime)
                    .endTime(endTime)
                    .status(OperationEquipmentUsage.STATUS_CONFIRMED)
                    .createdBy(getCurrentUser())
                    .build();

            usageRepository.save(usage);
        }

        log.info("Logged {} equipment usages for operation {}", equipmentIds.size(), operationId);
    }

    /**
     * Get usage records for an operation
     */
    @Transactional(readOnly = true)
    public List<OperationEquipmentUsage> getUsageForOperation(Long operationId) {
        return usageRepository.findByOperationWithDetails(operationId);
    }

    /**
     * Get usage history for equipment
     */
    @Transactional(readOnly = true)
    public List<OperationEquipmentUsage> getEquipmentUsageHistory(Long equipmentId) {
        return usageRepository.findByEquipment_EquipmentId(equipmentId);
    }

    /**
     * Get usage history for operator
     */
    @Transactional(readOnly = true)
    public List<OperationEquipmentUsage> getOperatorUsageHistory(Long operatorId) {
        return usageRepository.findByOperator_OperatorId(operatorId);
    }

    /**
     * Check if equipment is currently in use
     */
    @Transactional(readOnly = true)
    public boolean isEquipmentInUse(Long equipmentId) {
        List<OperationEquipmentUsage> activeUsage = usageRepository.findActiveEquipmentUsage(equipmentId);
        return !activeUsage.isEmpty();
    }

    /**
     * Confirm usage record
     */
    @Transactional
    public OperationEquipmentUsage confirmUsage(Long usageId) {
        OperationEquipmentUsage usage = usageRepository.findById(usageId)
                .orElseThrow(() -> new RuntimeException("Usage record not found: " + usageId));

        usage.setStatus(OperationEquipmentUsage.STATUS_CONFIRMED);
        return usageRepository.save(usage);
    }

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
    }
}
