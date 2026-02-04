package com.mes.production.service;

import com.mes.production.dto.HoldDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.entity.*;
import com.mes.production.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class HoldService {

    private final HoldRecordRepository holdRecordRepository;
    private final OperationRepository operationRepository;
    private final ProcessRepository processRepository;
    private final OrderLineItemRepository orderLineItemRepository;
    private final InventoryRepository inventoryRepository;
    private final BatchRepository batchRepository;

    @Transactional
    public HoldDTO.HoldResponse applyHold(HoldDTO.ApplyHoldRequest request, String appliedBy) {
        // Validate entity type
        validateEntityType(request.getEntityType());

        // Check if entity exists
        String entityName = getEntityName(request.getEntityType(), request.getEntityId());

        // Check if entity is already on hold
        if (isEntityOnHold(request.getEntityType(), request.getEntityId())) {
            throw new RuntimeException("Entity is already on hold");
        }

        // Get current status before applying hold
        String previousStatus = getEntityStatus(request.getEntityType(), request.getEntityId());

        // Create hold record
        HoldRecord holdRecord = HoldRecord.builder()
                .entityType(request.getEntityType())
                .entityId(request.getEntityId())
                .reason(request.getReason())
                .comments(request.getComments())
                .appliedBy(appliedBy)
                .appliedOn(LocalDateTime.now())
                .status("ACTIVE")
                .build();
        holdRecord.setPreviousStatus(previousStatus);

        holdRecordRepository.save(holdRecord);

        // Update entity status to ON_HOLD
        updateEntityStatus(request.getEntityType(), request.getEntityId(), "ON_HOLD", appliedBy);

        return convertToResponse(holdRecord, entityName);
    }

    @Transactional
    public HoldDTO.HoldResponse releaseHold(Long holdId, HoldDTO.ReleaseHoldRequest request, String releasedBy) {
        HoldRecord holdRecord = holdRecordRepository.findById(holdId)
                .orElseThrow(() -> new RuntimeException("Hold record not found"));

        if (!"ACTIVE".equals(holdRecord.getStatus())) {
            throw new RuntimeException("Hold is not active");
        }

        // Get previous status (we'll restore to READY for operations, AVAILABLE for inventory/batches)
        String restoreStatus = getRestoreStatus(holdRecord.getEntityType());

        // Update hold record
        holdRecord.setReleasedBy(releasedBy);
        holdRecord.setReleasedOn(LocalDateTime.now());
        holdRecord.setReleaseComments(request != null ? request.getReleaseComments() : null);
        holdRecord.setStatus("RELEASED");
        holdRecordRepository.save(holdRecord);

        // Restore entity status
        updateEntityStatus(holdRecord.getEntityType(), holdRecord.getEntityId(), restoreStatus, releasedBy);

        String entityName = getEntityName(holdRecord.getEntityType(), holdRecord.getEntityId());
        return convertToResponse(holdRecord, entityName);
    }

    @Transactional(readOnly = true)
    public List<HoldDTO.HoldResponse> getActiveHolds() {
        return holdRecordRepository.findActiveHoldsOrderByAppliedOnDesc().stream()
                .map(hold -> {
                    String entityName = getEntityName(hold.getEntityType(), hold.getEntityId());
                    return convertToResponse(hold, entityName);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get holds with pagination, sorting, and filtering
     */
    @Transactional(readOnly = true)
    public PagedResponseDTO<HoldDTO.HoldResponse> getHoldsPaged(PageRequestDTO pageRequest) {
        log.info("Fetching holds with pagination: page={}, size={}, status={}, type={}, search={}",
                pageRequest.getPage(), pageRequest.getSize(),
                pageRequest.getStatus(), pageRequest.getType(), pageRequest.getSearch());

        Pageable pageable = pageRequest.toPageable("appliedOn");

        Page<HoldRecord> page;
        if (pageRequest.hasFilters()) {
            page = holdRecordRepository.findByFilters(
                    pageRequest.getStatus(),
                    pageRequest.getType(), // entityType filter
                    pageRequest.getSearchPattern(),
                    pageable);
        } else {
            page = holdRecordRepository.findAll(pageable);
        }

        Page<HoldDTO.HoldResponse> dtoPage = page.map(hold -> {
            String entityName = getEntityName(hold.getEntityType(), hold.getEntityId());
            return convertToResponse(hold, entityName);
        });

        return PagedResponseDTO.fromPage(dtoPage,
                pageRequest.getSortBy(),
                pageRequest.getSortDirection(),
                pageRequest.getSearch());
    }

    @Transactional(readOnly = true)
    public List<HoldDTO.HoldResponse> getHoldsByEntity(String entityType, Long entityId) {
        return holdRecordRepository.findByEntityTypeAndEntityId(entityType, entityId).stream()
                .map(hold -> {
                    String entityName = getEntityName(hold.getEntityType(), hold.getEntityId());
                    return convertToResponse(hold, entityName);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean isEntityOnHold(String entityType, Long entityId) {
        return holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(entityType, entityId, "ACTIVE");
    }

    @Transactional(readOnly = true)
    public Long getActiveHoldCount() {
        return holdRecordRepository.countByStatus("ACTIVE");
    }

    private void validateEntityType(String entityType) {
        List<String> validTypes = List.of("OPERATION", "PROCESS", "ORDER_LINE", "INVENTORY", "BATCH");
        if (!validTypes.contains(entityType)) {
            throw new RuntimeException("Invalid entity type: " + entityType);
        }
    }

    private String getEntityName(String entityType, Long entityId) {
        return switch (entityType) {
            case "OPERATION" -> operationRepository.findById(entityId)
                    .map(Operation::getOperationName)
                    .orElse("Unknown Operation");
            case "PROCESS" -> processRepository.findById(entityId)
                    .map(com.mes.production.entity.Process::getStageName)
                    .orElse("Unknown Process");
            case "ORDER_LINE" -> orderLineItemRepository.findById(entityId)
                    .map(oli -> oli.getProductSku() + " - " + oli.getProductName())
                    .orElse("Unknown Order Line");
            case "INVENTORY" -> inventoryRepository.findById(entityId)
                    .map(inv -> inv.getMaterialId() + " - " + inv.getMaterialName())
                    .orElse("Unknown Inventory");
            case "BATCH" -> batchRepository.findById(entityId)
                    .map(Batch::getBatchNumber)
                    .orElse("Unknown Batch");
            default -> "Unknown";
        };
    }

    private String getEntityStatus(String entityType, Long entityId) {
        return switch (entityType) {
            case "OPERATION" -> operationRepository.findById(entityId)
                    .map(Operation::getStatus)
                    .orElseThrow(() -> new RuntimeException("Operation not found"));
            case "PROCESS" -> processRepository.findById(entityId)
                    .map(com.mes.production.entity.Process::getStatus)
                    .orElseThrow(() -> new RuntimeException("Process not found"));
            case "ORDER_LINE" -> orderLineItemRepository.findById(entityId)
                    .map(OrderLineItem::getStatus)
                    .orElseThrow(() -> new RuntimeException("Order line not found"));
            case "INVENTORY" -> inventoryRepository.findById(entityId)
                    .map(Inventory::getState)
                    .orElseThrow(() -> new RuntimeException("Inventory not found"));
            case "BATCH" -> batchRepository.findById(entityId)
                    .map(Batch::getStatus)
                    .orElseThrow(() -> new RuntimeException("Batch not found"));
            default -> throw new RuntimeException("Invalid entity type");
        };
    }

    private String getRestoreStatus(String entityType) {
        return switch (entityType) {
            case "OPERATION" -> "READY";
            case "PROCESS" -> "READY";
            case "ORDER_LINE" -> "CREATED";
            case "INVENTORY" -> "AVAILABLE";
            case "BATCH" -> "AVAILABLE";
            default -> "AVAILABLE";
        };
    }

    private void updateEntityStatus(String entityType, Long entityId, String newStatus, String updatedBy) {
        switch (entityType) {
            case "OPERATION" -> {
                Operation operation = operationRepository.findById(entityId)
                        .orElseThrow(() -> new RuntimeException("Operation not found"));
                operation.setStatus(newStatus);
                operation.setUpdatedBy(updatedBy);
                operationRepository.save(operation);
            }
            case "PROCESS" -> {
                com.mes.production.entity.Process process = processRepository.findById(entityId)
                        .orElseThrow(() -> new RuntimeException("Process not found"));
                process.setStatus(newStatus);
                process.setUpdatedBy(updatedBy);
                processRepository.save(process);
            }
            case "ORDER_LINE" -> {
                OrderLineItem orderLine = orderLineItemRepository.findById(entityId)
                        .orElseThrow(() -> new RuntimeException("Order line not found"));
                orderLine.setStatus(newStatus);
                orderLine.setUpdatedBy(updatedBy);
                orderLineItemRepository.save(orderLine);
            }
            case "INVENTORY" -> {
                Inventory inventory = inventoryRepository.findById(entityId)
                        .orElseThrow(() -> new RuntimeException("Inventory not found"));
                inventory.setState(newStatus);
                inventory.setUpdatedBy(updatedBy);
                inventoryRepository.save(inventory);
            }
            case "BATCH" -> {
                Batch batch = batchRepository.findById(entityId)
                        .orElseThrow(() -> new RuntimeException("Batch not found"));
                batch.setStatus(newStatus);
                batch.setUpdatedBy(updatedBy);
                batchRepository.save(batch);
            }
        }
    }

    private HoldDTO.HoldResponse convertToResponse(HoldRecord hold, String entityName) {
        Long durationMinutes = null;
        if (hold.getAppliedOn() != null) {
            LocalDateTime endTime = hold.getReleasedOn() != null ? hold.getReleasedOn() : LocalDateTime.now();
            durationMinutes = Duration.between(hold.getAppliedOn(), endTime).toMinutes();
        }

        return HoldDTO.HoldResponse.builder()
                .holdId(hold.getHoldId())
                .entityType(hold.getEntityType())
                .entityId(hold.getEntityId())
                .entityName(entityName)
                .reason(hold.getReason())
                .comments(hold.getComments())
                .appliedBy(hold.getAppliedBy())
                .appliedOn(hold.getAppliedOn())
                .releasedBy(hold.getReleasedBy())
                .releasedOn(hold.getReleasedOn())
                .releaseComments(hold.getReleaseComments())
                .status(hold.getStatus())
                .durationMinutes(durationMinutes)
                .build();
    }
}
