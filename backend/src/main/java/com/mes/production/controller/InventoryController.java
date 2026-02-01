package com.mes.production.controller;

import com.mes.production.dto.InventoryDTO;
import com.mes.production.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
     * Get all inventory
     */
    @GetMapping
    public ResponseEntity<List<InventoryDTO>> getAllInventory() {
        log.info("GET /api/inventory");
        List<InventoryDTO> inventory = inventoryService.getAllInventory();
        return ResponseEntity.ok(inventory);
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
}
