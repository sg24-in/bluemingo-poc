package com.mes.production.service;

import com.mes.production.dto.InventoryDTO;
import com.mes.production.entity.Inventory;
import com.mes.production.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    /**
     * Get all available inventory for consumption (RM and IM)
     */
    public List<InventoryDTO> getAvailableForConsumption() {
        log.info("Fetching available inventory for consumption");

        return inventoryRepository.findAvailableRawAndIntermediates().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get available inventory by material ID
     */
    public List<InventoryDTO> getAvailableByMaterialId(String materialId) {
        log.info("Fetching available inventory for material: {}", materialId);

        return inventoryRepository.findAvailableByMaterialId(materialId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all inventory
     */
    public List<InventoryDTO> getAllInventory() {
        log.info("Fetching all inventory");

        return inventoryRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get inventory by state
     */
    public List<InventoryDTO> getInventoryByState(String state) {
        log.info("Fetching inventory by state: {}", state);

        return inventoryRepository.findByState(state).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get inventory by type (RM, IM, FG, WIP)
     */
    public List<InventoryDTO> getInventoryByType(String type) {
        log.info("Fetching inventory by type: {}", type);

        return inventoryRepository.findByInventoryType(type).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private InventoryDTO convertToDTO(Inventory inventory) {
        return InventoryDTO.builder()
                .inventoryId(inventory.getInventoryId())
                .materialId(inventory.getMaterialId())
                .materialName(inventory.getMaterialName())
                .inventoryType(inventory.getInventoryType())
                .state(inventory.getState())
                .quantity(inventory.getQuantity())
                .unit(inventory.getUnit())
                .location(inventory.getLocation())
                .batchId(inventory.getBatch() != null ? inventory.getBatch().getBatchId() : null)
                .batchNumber(inventory.getBatch() != null ? inventory.getBatch().getBatchNumber() : null)
                .build();
    }
}
