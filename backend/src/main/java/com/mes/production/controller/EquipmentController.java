package com.mes.production.controller;

import com.mes.production.dto.EquipmentDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.service.EquipmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
@Slf4j
public class EquipmentController {

    private final EquipmentService equipmentService;

    /**
     * Get all equipment
     */
    @GetMapping
    public ResponseEntity<List<EquipmentDTO>> getAllEquipment() {
        log.info("GET /api/equipment");
        List<EquipmentDTO> equipment = equipmentService.getAllEquipment();
        return ResponseEntity.ok(equipment);
    }

    /**
     * Get equipment with pagination, sorting, and filtering.
     */
    @GetMapping("/paged")
    public ResponseEntity<PagedResponseDTO<EquipmentDTO>> getEquipmentPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type) {

        log.info("GET /api/equipment/paged - page={}, size={}, status={}, type={}, search={}",
                page, size, status, type, search);

        PageRequestDTO pageRequest = PageRequestDTO.builder()
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .search(search)
                .status(status)
                .type(type)
                .build();

        PagedResponseDTO<EquipmentDTO> result = equipmentService.getEquipmentPaged(pageRequest);
        return ResponseEntity.ok(result);
    }

    /**
     * Get equipment by ID
     */
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<EquipmentDTO> getEquipmentById(@PathVariable Long id) {
        log.info("GET /api/equipment/{}", id);
        EquipmentDTO equipment = equipmentService.getEquipmentById(id);
        return ResponseEntity.ok(equipment);
    }

    /**
     * Get equipment by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<EquipmentDTO>> getEquipmentByStatus(@PathVariable String status) {
        log.info("GET /api/equipment/status/{}", status);
        List<EquipmentDTO> equipment = equipmentService.getEquipmentByStatus(status);
        return ResponseEntity.ok(equipment);
    }

    /**
     * Get equipment under maintenance
     */
    @GetMapping("/maintenance")
    public ResponseEntity<List<EquipmentDTO>> getMaintenanceEquipment() {
        log.info("GET /api/equipment/maintenance");
        List<EquipmentDTO> equipment = equipmentService.getMaintenanceEquipment();
        return ResponseEntity.ok(equipment);
    }

    /**
     * Get equipment on hold
     */
    @GetMapping("/on-hold")
    public ResponseEntity<List<EquipmentDTO>> getOnHoldEquipment() {
        log.info("GET /api/equipment/on-hold");
        List<EquipmentDTO> equipment = equipmentService.getOnHoldEquipment();
        return ResponseEntity.ok(equipment);
    }

    /**
     * Start maintenance for equipment
     */
    @PostMapping("/{id:\\d+}/maintenance/start")
    public ResponseEntity<EquipmentDTO.StatusUpdateResponse> startMaintenance(
            @PathVariable Long id,
            @RequestBody EquipmentDTO.MaintenanceRequest request) {
        log.info("POST /api/equipment/{}/maintenance/start", id);
        EquipmentDTO.StatusUpdateResponse response = equipmentService.startMaintenance(
                id, request.getReason(), request.getExpectedEndTime());
        return ResponseEntity.ok(response);
    }

    /**
     * End maintenance for equipment
     */
    @PostMapping("/{id:\\d+}/maintenance/end")
    public ResponseEntity<EquipmentDTO.StatusUpdateResponse> endMaintenance(@PathVariable Long id) {
        log.info("POST /api/equipment/{}/maintenance/end", id);
        EquipmentDTO.StatusUpdateResponse response = equipmentService.endMaintenance(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Put equipment on hold
     */
    @PostMapping("/{id:\\d+}/hold")
    public ResponseEntity<EquipmentDTO.StatusUpdateResponse> putOnHold(
            @PathVariable Long id,
            @RequestBody EquipmentDTO.HoldRequest request) {
        log.info("POST /api/equipment/{}/hold", id);
        EquipmentDTO.StatusUpdateResponse response = equipmentService.putOnHold(id, request.getReason());
        return ResponseEntity.ok(response);
    }

    /**
     * Release equipment from hold
     */
    @PostMapping("/{id:\\d+}/release")
    public ResponseEntity<EquipmentDTO.StatusUpdateResponse> releaseFromHold(@PathVariable Long id) {
        log.info("POST /api/equipment/{}/release", id);
        EquipmentDTO.StatusUpdateResponse response = equipmentService.releaseFromHold(id);
        return ResponseEntity.ok(response);
    }
}
