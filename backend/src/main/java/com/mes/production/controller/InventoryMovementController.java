package com.mes.production.controller;

import com.mes.production.dto.InventoryMovementDTO;
import com.mes.production.entity.InventoryMovement;
import com.mes.production.service.InventoryMovementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventory-movements")
@RequiredArgsConstructor
@Slf4j
public class InventoryMovementController {

    private final InventoryMovementService movementService;

    /**
     * Record a movement
     */
    @PostMapping
    public ResponseEntity<InventoryMovementDTO.MovementInfo> recordMovement(
            @RequestBody InventoryMovementDTO.RecordMovementRequest request) {
        log.info("POST /api/inventory-movements - Inventory: {}, Type: {}",
                request.getInventoryId(), request.getMovementType());
        InventoryMovement movement = movementService.recordMovement(
                request.getInventoryId(),
                request.getOperationId(),
                request.getMovementType(),
                request.getQuantity(),
                request.getReason()
        );
        return ResponseEntity.ok(convertToMovementInfo(movement));
    }

    /**
     * Get movements for an inventory
     */
    @GetMapping("/inventory/{inventoryId}")
    public ResponseEntity<List<InventoryMovementDTO.MovementInfo>> getInventoryMovements(
            @PathVariable Long inventoryId) {
        log.info("GET /api/inventory-movements/inventory/{}", inventoryId);
        List<InventoryMovement> movements = movementService.getInventoryMovementHistory(inventoryId);
        List<InventoryMovementDTO.MovementInfo> infos = movements.stream()
                .map(this::convertToMovementInfo)
                .collect(Collectors.toList());
        return ResponseEntity.ok(infos);
    }

    /**
     * Get movements for an operation
     */
    @GetMapping("/operation/{operationId}")
    public ResponseEntity<List<InventoryMovementDTO.MovementInfo>> getOperationMovements(
            @PathVariable Long operationId) {
        log.info("GET /api/inventory-movements/operation/{}", operationId);
        List<InventoryMovement> movements = movementService.getOperationMovements(operationId);
        List<InventoryMovementDTO.MovementInfo> infos = movements.stream()
                .map(this::convertToMovementInfo)
                .collect(Collectors.toList());
        return ResponseEntity.ok(infos);
    }

    /**
     * Get movements for a batch
     */
    @GetMapping("/batch/{batchId}")
    public ResponseEntity<List<InventoryMovementDTO.MovementInfo>> getBatchMovements(
            @PathVariable Long batchId) {
        log.info("GET /api/inventory-movements/batch/{}", batchId);
        List<InventoryMovement> movements = movementService.getBatchMovements(batchId);
        List<InventoryMovementDTO.MovementInfo> infos = movements.stream()
                .map(this::convertToMovementInfo)
                .collect(Collectors.toList());
        return ResponseEntity.ok(infos);
    }

    /**
     * Get movements in time range
     */
    @GetMapping("/range")
    public ResponseEntity<List<InventoryMovementDTO.MovementInfo>> getMovementsInRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        log.info("GET /api/inventory-movements/range?startTime={}&endTime={}", startTime, endTime);
        List<InventoryMovement> movements = movementService.getMovementsInTimeRange(startTime, endTime);
        List<InventoryMovementDTO.MovementInfo> infos = movements.stream()
                .map(this::convertToMovementInfo)
                .collect(Collectors.toList());
        return ResponseEntity.ok(infos);
    }

    /**
     * Get recent movements
     */
    @GetMapping("/recent")
    public ResponseEntity<List<InventoryMovementDTO.MovementInfo>> getRecentMovements(
            @RequestParam(defaultValue = "10") int limit) {
        log.info("GET /api/inventory-movements/recent?limit={}", limit);
        List<InventoryMovement> movements = movementService.getRecentMovements(limit);
        List<InventoryMovementDTO.MovementInfo> infos = movements.stream()
                .map(this::convertToMovementInfo)
                .collect(Collectors.toList());
        return ResponseEntity.ok(infos);
    }

    /**
     * Get pending movements
     */
    @GetMapping("/pending")
    public ResponseEntity<List<InventoryMovementDTO.MovementInfo>> getPendingMovements() {
        log.info("GET /api/inventory-movements/pending");
        List<InventoryMovement> movements = movementService.getPendingMovements();
        List<InventoryMovementDTO.MovementInfo> infos = movements.stream()
                .map(this::convertToMovementInfo)
                .collect(Collectors.toList());
        return ResponseEntity.ok(infos);
    }

    /**
     * Execute a pending movement
     */
    @PutMapping("/{movementId}/execute")
    public ResponseEntity<InventoryMovementDTO.MovementInfo> executeMovement(@PathVariable Long movementId) {
        log.info("PUT /api/inventory-movements/{}/execute", movementId);
        InventoryMovement movement = movementService.executeMovement(movementId);
        return ResponseEntity.ok(convertToMovementInfo(movement));
    }

    private InventoryMovementDTO.MovementInfo convertToMovementInfo(InventoryMovement movement) {
        return InventoryMovementDTO.MovementInfo.builder()
                .movementId(movement.getMovementId())
                .inventoryId(movement.getInventory() != null ? movement.getInventory().getInventoryId() : null)
                .materialId(movement.getInventory() != null ? movement.getInventory().getMaterialId() : null)
                .materialName(movement.getInventory() != null ? movement.getInventory().getMaterialName() : null)
                .operationId(movement.getOperation() != null ? movement.getOperation().getOperationId() : null)
                .operationName(movement.getOperation() != null ? movement.getOperation().getOperationName() : null)
                .movementType(movement.getMovementType())
                .quantity(movement.getQuantity())
                .unit(movement.getInventory() != null ? movement.getInventory().getUnit() : null)
                .timestamp(movement.getTimestamp())
                .reason(movement.getReason())
                .status(movement.getStatus())
                .createdBy(movement.getCreatedBy())
                .build();
    }
}
