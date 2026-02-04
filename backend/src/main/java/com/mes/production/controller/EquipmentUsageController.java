package com.mes.production.controller;

import com.mes.production.dto.EquipmentUsageDTO;
import com.mes.production.entity.OperationEquipmentUsage;
import com.mes.production.service.EquipmentUsageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/equipment-usage")
@RequiredArgsConstructor
@Slf4j
public class EquipmentUsageController {

    private final EquipmentUsageService equipmentUsageService;

    /**
     * Log equipment usage
     */
    @PostMapping
    public ResponseEntity<EquipmentUsageDTO.UsageInfo> logUsage(@RequestBody EquipmentUsageDTO.LogUsageRequest request) {
        log.info("POST /api/equipment-usage - Operation: {}, Equipment: {}", request.getOperationId(), request.getEquipmentId());
        OperationEquipmentUsage usage = equipmentUsageService.logEquipmentUsage(
                request.getOperationId(),
                request.getEquipmentId(),
                request.getOperatorId(),
                request.getStartTime(),
                request.getEndTime()
        );
        return ResponseEntity.ok(convertToUsageInfo(usage));
    }

    /**
     * Log bulk equipment usage (for production confirmation)
     */
    @PostMapping("/bulk")
    public ResponseEntity<Void> logBulkUsage(@RequestBody EquipmentUsageDTO.BulkLogRequest request) {
        log.info("POST /api/equipment-usage/bulk - Operation: {}, Equipments: {}",
                request.getOperationId(), request.getEquipmentIds());
        equipmentUsageService.logEquipmentUsagesForConfirmation(
                request.getOperationId(),
                request.getEquipmentIds(),
                request.getOperatorIds(),
                request.getStartTime(),
                request.getEndTime()
        );
        return ResponseEntity.ok().build();
    }

    /**
     * Get usage records for an operation
     */
    @GetMapping("/operation/{operationId}")
    public ResponseEntity<List<EquipmentUsageDTO.UsageInfo>> getOperationUsage(@PathVariable Long operationId) {
        log.info("GET /api/equipment-usage/operation/{}", operationId);
        List<OperationEquipmentUsage> usages = equipmentUsageService.getUsageForOperation(operationId);
        List<EquipmentUsageDTO.UsageInfo> usageInfos = usages.stream()
                .map(this::convertToUsageInfo)
                .collect(Collectors.toList());
        return ResponseEntity.ok(usageInfos);
    }

    /**
     * Get usage history for equipment
     */
    @GetMapping("/equipment/{equipmentId}")
    public ResponseEntity<List<EquipmentUsageDTO.UsageInfo>> getEquipmentUsageHistory(@PathVariable Long equipmentId) {
        log.info("GET /api/equipment-usage/equipment/{}", equipmentId);
        List<OperationEquipmentUsage> usages = equipmentUsageService.getEquipmentUsageHistory(equipmentId);
        List<EquipmentUsageDTO.UsageInfo> usageInfos = usages.stream()
                .map(this::convertToUsageInfo)
                .collect(Collectors.toList());
        return ResponseEntity.ok(usageInfos);
    }

    /**
     * Get usage history for operator
     */
    @GetMapping("/operator/{operatorId}")
    public ResponseEntity<List<EquipmentUsageDTO.UsageInfo>> getOperatorUsageHistory(@PathVariable Long operatorId) {
        log.info("GET /api/equipment-usage/operator/{}", operatorId);
        List<OperationEquipmentUsage> usages = equipmentUsageService.getOperatorUsageHistory(operatorId);
        List<EquipmentUsageDTO.UsageInfo> usageInfos = usages.stream()
                .map(this::convertToUsageInfo)
                .collect(Collectors.toList());
        return ResponseEntity.ok(usageInfos);
    }

    /**
     * Check if equipment is in use
     */
    @GetMapping("/equipment/{equipmentId}/in-use")
    public ResponseEntity<Boolean> isEquipmentInUse(@PathVariable Long equipmentId) {
        log.info("GET /api/equipment-usage/equipment/{}/in-use", equipmentId);
        boolean inUse = equipmentUsageService.isEquipmentInUse(equipmentId);
        return ResponseEntity.ok(inUse);
    }

    /**
     * Confirm usage record
     */
    @PutMapping("/{usageId}/confirm")
    public ResponseEntity<EquipmentUsageDTO.UsageInfo> confirmUsage(@PathVariable Long usageId) {
        log.info("PUT /api/equipment-usage/{}/confirm", usageId);
        OperationEquipmentUsage usage = equipmentUsageService.confirmUsage(usageId);
        return ResponseEntity.ok(convertToUsageInfo(usage));
    }

    private EquipmentUsageDTO.UsageInfo convertToUsageInfo(OperationEquipmentUsage usage) {
        return EquipmentUsageDTO.UsageInfo.builder()
                .usageId(usage.getUsageId())
                .operationId(usage.getOperation() != null ? usage.getOperation().getOperationId() : null)
                .operationName(usage.getOperation() != null ? usage.getOperation().getOperationName() : null)
                .equipmentId(usage.getEquipment() != null ? usage.getEquipment().getEquipmentId() : null)
                .equipmentCode(usage.getEquipment() != null ? usage.getEquipment().getEquipmentCode() : null)
                .equipmentName(usage.getEquipment() != null ? usage.getEquipment().getName() : null)
                .operatorId(usage.getOperator() != null ? usage.getOperator().getOperatorId() : null)
                .operatorCode(usage.getOperator() != null ? usage.getOperator().getOperatorCode() : null)
                .operatorName(usage.getOperator() != null ? usage.getOperator().getName() : null)
                .startTime(usage.getStartTime())
                .endTime(usage.getEndTime())
                .status(usage.getStatus())
                .createdOn(usage.getCreatedOn())
                .build();
    }
}
