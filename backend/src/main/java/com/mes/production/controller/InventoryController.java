package com.mes.production.controller;

import com.mes.production.dto.InventoryDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@Slf4j
public class InventoryController {

    private final InventoryService inventoryService;

    /**
     * Get all inventory (legacy - non-paginated)
     */
    @GetMapping
    public ResponseEntity<List<InventoryDTO>> getAllInventory() {
        log.info("GET /api/inventory");
        List<InventoryDTO> inventory = inventoryService.getAllInventory();
        return ResponseEntity.ok(inventory);
    }

    /**
     * Get inventory with pagination, sorting, and filtering.
     */
    @GetMapping("/paged")
    public ResponseEntity<PagedResponseDTO<InventoryDTO>> getInventoryPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type) {

        log.info("GET /api/inventory/paged - page={}, size={}, state={}, type={}, search={}",
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

        PagedResponseDTO<InventoryDTO> result = inventoryService.getInventoryPaged(pageRequest);
        return ResponseEntity.ok(result);
    }

    /**
     * Get available inventory for consumption (RM and IM)
     */
    @GetMapping("/available")
    public ResponseEntity<List<InventoryDTO>> getAvailableForConsumption(
            @RequestParam(required = false) String materialId) {
        log.info("GET /api/inventory/available, materialId={}", materialId);

        List<InventoryDTO> inventory;
        if (materialId != null && !materialId.isEmpty()) {
            inventory = inventoryService.getAvailableByMaterialId(materialId);
        } else {
            inventory = inventoryService.getAvailableForConsumption();
        }
        return ResponseEntity.ok(inventory);
    }

    /**
     * Get inventory by state
     */
    @GetMapping("/state/{state}")
    public ResponseEntity<List<InventoryDTO>> getInventoryByState(@PathVariable String state) {
        log.info("GET /api/inventory/state/{}", state);
        List<InventoryDTO> inventory = inventoryService.getInventoryByState(state);
        return ResponseEntity.ok(inventory);
    }

    /**
     * Get inventory by type (RM, IM, FG, WIP)
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<InventoryDTO>> getInventoryByType(@PathVariable String type) {
        log.info("GET /api/inventory/type/{}", type);
        List<InventoryDTO> inventory = inventoryService.getInventoryByType(type);
        return ResponseEntity.ok(inventory);
    }

    /**
     * Get inventory by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<InventoryDTO> getInventoryById(@PathVariable Long id) {
        log.info("GET /api/inventory/{}", id);
        InventoryDTO inventory = inventoryService.getInventoryById(id);
        return ResponseEntity.ok(inventory);
    }

    /**
     * Create new inventory
     */
    @PostMapping
    public ResponseEntity<InventoryDTO> createInventory(
            @Valid @RequestBody InventoryDTO.CreateInventoryRequest request) {
        log.info("POST /api/inventory - Creating inventory for material: {}", request.getMaterialId());
        InventoryDTO created = inventoryService.createInventory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update inventory
     */
    @PutMapping("/{id}")
    public ResponseEntity<InventoryDTO> updateInventory(
            @PathVariable Long id,
            @Valid @RequestBody InventoryDTO.UpdateInventoryRequest request) {
        log.info("PUT /api/inventory/{}", id);
        InventoryDTO updated = inventoryService.updateInventory(id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete inventory (soft delete via scrap)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<InventoryDTO.StateUpdateResponse> deleteInventory(@PathVariable Long id) {
        log.info("DELETE /api/inventory/{}", id);
        InventoryDTO.StateUpdateResponse response = inventoryService.deleteInventory(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Get blocked inventory
     */
    @GetMapping("/blocked")
    public ResponseEntity<List<InventoryDTO>> getBlockedInventory() {
        log.info("GET /api/inventory/blocked");
        List<InventoryDTO> inventory = inventoryService.getBlockedInventory();
        return ResponseEntity.ok(inventory);
    }

    /**
     * Get scrapped inventory
     */
    @GetMapping("/scrapped")
    public ResponseEntity<List<InventoryDTO>> getScrappedInventory() {
        log.info("GET /api/inventory/scrapped");
        List<InventoryDTO> inventory = inventoryService.getScrappedInventory();
        return ResponseEntity.ok(inventory);
    }

    /**
     * Block inventory
     */
    @PostMapping("/{id}/block")
    public ResponseEntity<InventoryDTO.StateUpdateResponse> blockInventory(
            @PathVariable Long id,
            @RequestBody InventoryDTO.BlockRequest request) {
        log.info("POST /api/inventory/{}/block", id);
        InventoryDTO.StateUpdateResponse response = inventoryService.blockInventory(id, request.getReason());
        return ResponseEntity.ok(response);
    }

    /**
     * Unblock inventory
     */
    @PostMapping("/{id}/unblock")
    public ResponseEntity<InventoryDTO.StateUpdateResponse> unblockInventory(@PathVariable Long id) {
        log.info("POST /api/inventory/{}/unblock", id);
        InventoryDTO.StateUpdateResponse response = inventoryService.unblockInventory(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Scrap inventory
     */
    @PostMapping("/{id}/scrap")
    public ResponseEntity<InventoryDTO.StateUpdateResponse> scrapInventory(
            @PathVariable Long id,
            @RequestBody InventoryDTO.ScrapRequest request) {
        log.info("POST /api/inventory/{}/scrap", id);
        InventoryDTO.StateUpdateResponse response = inventoryService.scrapInventory(id, request.getReason());
        return ResponseEntity.ok(response);
    }

    /**
     * Get reserved inventory
     */
    @GetMapping("/reserved")
    public ResponseEntity<List<InventoryDTO>> getReservedInventory() {
        log.info("GET /api/inventory/reserved");
        List<InventoryDTO> inventory = inventoryService.getReservedInventory();
        return ResponseEntity.ok(inventory);
    }

    /**
     * Get reserved inventory for a specific order
     */
    @GetMapping("/reserved/order/{orderId}")
    public ResponseEntity<List<InventoryDTO>> getReservedForOrder(@PathVariable Long orderId) {
        log.info("GET /api/inventory/reserved/order/{}", orderId);
        List<InventoryDTO> inventory = inventoryService.getReservedForOrder(orderId);
        return ResponseEntity.ok(inventory);
    }

    /**
     * Reserve inventory
     */
    @PostMapping("/{id}/reserve")
    public ResponseEntity<InventoryDTO.StateUpdateResponse> reserveInventory(
            @PathVariable Long id,
            @RequestBody InventoryDTO.ReserveRequest request) {
        log.info("POST /api/inventory/{}/reserve", id);
        InventoryDTO.StateUpdateResponse response = inventoryService.reserveInventory(
                id, request.getOrderId(), request.getOperationId(), request.getQuantity());
        return ResponseEntity.ok(response);
    }

    /**
     * Release reservation
     */
    @PostMapping("/{id}/release-reservation")
    public ResponseEntity<InventoryDTO.StateUpdateResponse> releaseReservation(@PathVariable Long id) {
        log.info("POST /api/inventory/{}/release-reservation", id);
        InventoryDTO.StateUpdateResponse response = inventoryService.releaseReservation(id);
        return ResponseEntity.ok(response);
    }
}
