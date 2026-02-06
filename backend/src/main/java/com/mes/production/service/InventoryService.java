package com.mes.production.service;

import com.mes.production.dto.InventoryDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.entity.Batch;
import com.mes.production.entity.Inventory;
import com.mes.production.repository.BatchRepository;
import com.mes.production.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final BatchRepository batchRepository;
    private final AuditService auditService;

    private static final Set<String> VALID_STATES = Set.of(
            Inventory.STATE_AVAILABLE,
            Inventory.STATE_RESERVED,
            Inventory.STATE_CONSUMED,
            Inventory.STATE_PRODUCED,
            Inventory.STATE_BLOCKED,
            Inventory.STATE_SCRAPPED,
            Inventory.STATE_ON_HOLD
    );

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
     * Get inventory with pagination, sorting, and filtering
     */
    public PagedResponseDTO<InventoryDTO> getInventoryPaged(PageRequestDTO pageRequest) {
        log.info("Fetching inventory with pagination: page={}, size={}, state={}, type={}, search={}",
                pageRequest.getPage(), pageRequest.getSize(),
                pageRequest.getStatus(), pageRequest.getType(), pageRequest.getSearch());

        org.springframework.data.domain.Pageable pageable = pageRequest.toPageable("createdOn");

        org.springframework.data.domain.Page<Inventory> page;
        if (pageRequest.hasFilters()) {
            page = inventoryRepository.findByFilters(
                    pageRequest.getStatus(), // state filter
                    pageRequest.getType(),   // inventory type filter
                    pageRequest.getSearchPattern(),
                    pageable);
        } else {
            page = inventoryRepository.findAll(pageable);
        }

        org.springframework.data.domain.Page<InventoryDTO> dtoPage = page.map(this::convertToDTO);

        return PagedResponseDTO.fromPage(dtoPage,
                pageRequest.getSortBy(),
                pageRequest.getSortDirection(),
                pageRequest.getSearch());
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

    /**
     * Block inventory
     */
    @Transactional
    public InventoryDTO.StateUpdateResponse blockInventory(Long inventoryId, String reason) {
        log.info("Blocking inventory: {}", inventoryId);

        String currentUser = getCurrentUser();
        Inventory inventory = getInventoryEntity(inventoryId);
        String oldState = inventory.getState();

        // Validate current state
        if (Inventory.STATE_CONSUMED.equals(oldState) || Inventory.STATE_SCRAPPED.equals(oldState)) {
            throw new RuntimeException("Cannot block inventory in state: " + oldState);
        }

        if (Inventory.STATE_BLOCKED.equals(oldState)) {
            throw new RuntimeException("Inventory is already blocked");
        }

        // Update state
        inventory.setState(Inventory.STATE_BLOCKED);
        inventory.setBlockReason(reason);
        inventory.setBlockedBy(currentUser);
        inventory.setBlockedOn(LocalDateTime.now());
        inventory.setUpdatedBy(currentUser);
        inventoryRepository.save(inventory);

        log.info("Inventory {} blocked by {}", inventoryId, currentUser);
        auditService.logStatusChange("INVENTORY", inventoryId, oldState, Inventory.STATE_BLOCKED);

        return InventoryDTO.StateUpdateResponse.builder()
                .inventoryId(inventoryId)
                .previousState(oldState)
                .newState(Inventory.STATE_BLOCKED)
                .message("Inventory blocked. Reason: " + reason)
                .updatedBy(currentUser)
                .updatedOn(inventory.getUpdatedOn())
                .build();
    }

    /**
     * Unblock inventory
     */
    @Transactional
    public InventoryDTO.StateUpdateResponse unblockInventory(Long inventoryId) {
        log.info("Unblocking inventory: {}", inventoryId);

        String currentUser = getCurrentUser();
        Inventory inventory = getInventoryEntity(inventoryId);
        String oldState = inventory.getState();

        if (!Inventory.STATE_BLOCKED.equals(oldState)) {
            throw new RuntimeException("Inventory is not blocked. Current state: " + oldState);
        }

        // Update state back to AVAILABLE
        inventory.setState(Inventory.STATE_AVAILABLE);
        inventory.setBlockReason(null);
        inventory.setBlockedBy(null);
        inventory.setBlockedOn(null);
        inventory.setUpdatedBy(currentUser);
        inventoryRepository.save(inventory);

        log.info("Inventory {} unblocked by {}", inventoryId, currentUser);
        auditService.logStatusChange("INVENTORY", inventoryId, oldState, Inventory.STATE_AVAILABLE);

        return InventoryDTO.StateUpdateResponse.builder()
                .inventoryId(inventoryId)
                .previousState(oldState)
                .newState(Inventory.STATE_AVAILABLE)
                .message("Inventory unblocked and available")
                .updatedBy(currentUser)
                .updatedOn(inventory.getUpdatedOn())
                .build();
    }

    /**
     * Scrap inventory
     */
    @Transactional
    public InventoryDTO.StateUpdateResponse scrapInventory(Long inventoryId, String reason) {
        log.info("Scrapping inventory: {}", inventoryId);

        String currentUser = getCurrentUser();
        Inventory inventory = getInventoryEntity(inventoryId);
        String oldState = inventory.getState();

        // Validate current state
        if (Inventory.STATE_CONSUMED.equals(oldState)) {
            throw new RuntimeException("Cannot scrap already consumed inventory");
        }

        if (Inventory.STATE_SCRAPPED.equals(oldState)) {
            throw new RuntimeException("Inventory is already scrapped");
        }

        // Update state
        inventory.setState(Inventory.STATE_SCRAPPED);
        inventory.setScrapReason(reason);
        inventory.setScrappedBy(currentUser);
        inventory.setScrappedOn(LocalDateTime.now());
        inventory.setUpdatedBy(currentUser);
        inventoryRepository.save(inventory);

        log.info("Inventory {} scrapped by {}", inventoryId, currentUser);
        auditService.logStatusChange("INVENTORY", inventoryId, oldState, Inventory.STATE_SCRAPPED);

        return InventoryDTO.StateUpdateResponse.builder()
                .inventoryId(inventoryId)
                .previousState(oldState)
                .newState(Inventory.STATE_SCRAPPED)
                .message("Inventory scrapped. Reason: " + reason)
                .updatedBy(currentUser)
                .updatedOn(inventory.getUpdatedOn())
                .build();
    }

    /**
     * Get inventory by ID
     */
    public InventoryDTO getInventoryById(Long inventoryId) {
        Inventory inventory = getInventoryEntity(inventoryId);
        return convertToDTO(inventory);
    }

    /**
     * Get blocked inventory
     */
    public List<InventoryDTO> getBlockedInventory() {
        return inventoryRepository.findByState(Inventory.STATE_BLOCKED).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get scrapped inventory
     */
    public List<InventoryDTO> getScrappedInventory() {
        return inventoryRepository.findByState(Inventory.STATE_SCRAPPED).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get reserved inventory
     */
    public List<InventoryDTO> getReservedInventory() {
        return inventoryRepository.findByState(Inventory.STATE_RESERVED).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Reserve inventory for an order/operation
     */
    @Transactional
    public InventoryDTO.StateUpdateResponse reserveInventory(Long inventoryId, Long orderId, Long operationId, java.math.BigDecimal quantity) {
        log.info("Reserving inventory: {} for order: {}, operation: {}", inventoryId, orderId, operationId);

        String currentUser = getCurrentUser();
        Inventory inventory = getInventoryEntity(inventoryId);
        String oldState = inventory.getState();

        // Validate current state
        if (!Inventory.STATE_AVAILABLE.equals(oldState)) {
            throw new RuntimeException("Only AVAILABLE inventory can be reserved. Current state: " + oldState);
        }

        // Validate quantity if specified
        if (quantity != null && quantity.compareTo(inventory.getQuantity()) > 0) {
            throw new RuntimeException("Reservation quantity exceeds available quantity");
        }

        // Update state
        inventory.setState(Inventory.STATE_RESERVED);
        inventory.setReservedForOrderId(orderId);
        inventory.setReservedForOperationId(operationId);
        inventory.setReservedBy(currentUser);
        inventory.setReservedOn(LocalDateTime.now());
        inventory.setReservedQty(quantity != null ? quantity : inventory.getQuantity());
        inventory.setUpdatedBy(currentUser);
        inventoryRepository.save(inventory);

        log.info("Inventory {} reserved by {}", inventoryId, currentUser);
        auditService.logStatusChange("INVENTORY", inventoryId, oldState, Inventory.STATE_RESERVED);

        return InventoryDTO.StateUpdateResponse.builder()
                .inventoryId(inventoryId)
                .previousState(oldState)
                .newState(Inventory.STATE_RESERVED)
                .message("Inventory reserved for order: " + orderId)
                .updatedBy(currentUser)
                .updatedOn(inventory.getUpdatedOn())
                .build();
    }

    /**
     * Release reserved inventory back to available
     */
    @Transactional
    public InventoryDTO.StateUpdateResponse releaseReservation(Long inventoryId) {
        log.info("Releasing reservation for inventory: {}", inventoryId);

        String currentUser = getCurrentUser();
        Inventory inventory = getInventoryEntity(inventoryId);
        String oldState = inventory.getState();

        if (!Inventory.STATE_RESERVED.equals(oldState)) {
            throw new RuntimeException("Inventory is not reserved. Current state: " + oldState);
        }

        // Update state back to AVAILABLE
        inventory.setState(Inventory.STATE_AVAILABLE);
        inventory.setReservedForOrderId(null);
        inventory.setReservedForOperationId(null);
        inventory.setReservedBy(null);
        inventory.setReservedOn(null);
        inventory.setReservedQty(null);
        inventory.setUpdatedBy(currentUser);
        inventoryRepository.save(inventory);

        log.info("Inventory {} reservation released by {}", inventoryId, currentUser);
        auditService.logStatusChange("INVENTORY", inventoryId, oldState, Inventory.STATE_AVAILABLE);

        return InventoryDTO.StateUpdateResponse.builder()
                .inventoryId(inventoryId)
                .previousState(oldState)
                .newState(Inventory.STATE_AVAILABLE)
                .message("Reservation released, inventory available")
                .updatedBy(currentUser)
                .updatedOn(inventory.getUpdatedOn())
                .build();
    }

    /**
     * Create new inventory
     */
    @Transactional
    public InventoryDTO createInventory(InventoryDTO.CreateInventoryRequest request) {
        log.info("Creating inventory for material: {}", request.getMaterialId());

        String currentUser = getCurrentUser();

        Inventory inventory = Inventory.builder()
                .materialId(request.getMaterialId())
                .materialName(request.getMaterialName())
                .inventoryType(request.getInventoryType())
                .quantity(request.getQuantity())
                .unit(request.getUnit() != null ? request.getUnit() : "T")
                .location(request.getLocation())
                .state(Inventory.STATE_AVAILABLE)
                .createdBy(currentUser)
                .build();

        if (request.getBatchId() != null) {
            Batch batch = batchRepository.findById(request.getBatchId())
                    .orElseThrow(() -> new RuntimeException("Batch not found: " + request.getBatchId()));
            inventory.setBatch(batch);
        }

        inventory = inventoryRepository.save(inventory);
        log.info("Inventory created with ID: {}", inventory.getInventoryId());
        auditService.logCreate("INVENTORY", inventory.getInventoryId(),
                "Inventory created for material: " + request.getMaterialId());

        return convertToDTO(inventory);
    }

    /**
     * Update existing inventory
     */
    @Transactional
    public InventoryDTO updateInventory(Long inventoryId, InventoryDTO.UpdateInventoryRequest request) {
        log.info("Updating inventory: {}", inventoryId);

        String currentUser = getCurrentUser();
        Inventory inventory = getInventoryEntity(inventoryId);

        // Reject updates to terminal states
        if (Inventory.STATE_CONSUMED.equals(inventory.getState())) {
            throw new RuntimeException("Cannot update consumed inventory");
        }
        if (Inventory.STATE_SCRAPPED.equals(inventory.getState())) {
            throw new RuntimeException("Cannot update scrapped inventory");
        }

        if (request.getMaterialId() != null) inventory.setMaterialId(request.getMaterialId());
        if (request.getMaterialName() != null) inventory.setMaterialName(request.getMaterialName());
        if (request.getInventoryType() != null) inventory.setInventoryType(request.getInventoryType());
        if (request.getQuantity() != null) inventory.setQuantity(request.getQuantity());
        if (request.getUnit() != null) inventory.setUnit(request.getUnit());
        if (request.getLocation() != null) inventory.setLocation(request.getLocation());
        if (request.getState() != null && VALID_STATES.contains(request.getState())) {
            String oldState = inventory.getState();
            inventory.setState(request.getState());
            if (!oldState.equals(request.getState())) {
                auditService.logStatusChange("INVENTORY", inventoryId, oldState, request.getState());
            }
        }
        if (request.getBatchId() != null) {
            Batch batch = batchRepository.findById(request.getBatchId())
                    .orElseThrow(() -> new RuntimeException("Batch not found: " + request.getBatchId()));
            inventory.setBatch(batch);
        }

        inventory.setUpdatedBy(currentUser);
        inventory = inventoryRepository.save(inventory);
        log.info("Inventory {} updated by {}", inventoryId, currentUser);
        auditService.logUpdate("INVENTORY", inventoryId, "inventory", null, "Inventory updated");

        return convertToDTO(inventory);
    }

    /**
     * Delete inventory (soft delete via state=SCRAPPED)
     */
    @Transactional
    public InventoryDTO.StateUpdateResponse deleteInventory(Long inventoryId) {
        log.info("Deleting (scrapping) inventory: {}", inventoryId);

        String currentUser = getCurrentUser();
        Inventory inventory = getInventoryEntity(inventoryId);
        String oldState = inventory.getState();

        if (Inventory.STATE_CONSUMED.equals(oldState)) {
            throw new RuntimeException("Cannot delete consumed inventory");
        }
        if (Inventory.STATE_SCRAPPED.equals(oldState)) {
            throw new RuntimeException("Inventory is already scrapped");
        }

        inventory.setState(Inventory.STATE_SCRAPPED);
        inventory.setScrapReason("Deleted by user");
        inventory.setScrappedBy(currentUser);
        inventory.setScrappedOn(LocalDateTime.now());
        inventory.setUpdatedBy(currentUser);
        inventoryRepository.save(inventory);

        log.info("Inventory {} deleted (scrapped) by {}", inventoryId, currentUser);
        auditService.logStatusChange("INVENTORY", inventoryId, oldState, Inventory.STATE_SCRAPPED);

        return InventoryDTO.StateUpdateResponse.builder()
                .inventoryId(inventoryId)
                .previousState(oldState)
                .newState(Inventory.STATE_SCRAPPED)
                .message("Inventory deleted (scrapped)")
                .updatedBy(currentUser)
                .updatedOn(inventory.getUpdatedOn())
                .build();
    }

    /**
     * Get reserved inventory for a specific order
     */
    public List<InventoryDTO> getReservedForOrder(Long orderId) {
        return inventoryRepository.findByReservedForOrderId(orderId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private Inventory getInventoryEntity(Long inventoryId) {
        return inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new RuntimeException("Inventory not found: " + inventoryId));
    }

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
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
                .blockReason(inventory.getBlockReason())
                .blockedBy(inventory.getBlockedBy())
                .blockedOn(inventory.getBlockedOn())
                .scrapReason(inventory.getScrapReason())
                .scrappedBy(inventory.getScrappedBy())
                .scrappedOn(inventory.getScrappedOn())
                .reservedForOrderId(inventory.getReservedForOrderId())
                .reservedForOperationId(inventory.getReservedForOperationId())
                .reservedBy(inventory.getReservedBy())
                .reservedOn(inventory.getReservedOn())
                .reservedQty(inventory.getReservedQty())
                .build();
    }
}
