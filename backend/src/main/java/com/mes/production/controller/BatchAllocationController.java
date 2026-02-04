package com.mes.production.controller;

import com.mes.production.dto.BatchAllocationDTO;
import com.mes.production.entity.Batch;
import com.mes.production.entity.BatchOrderAllocation;
import com.mes.production.repository.BatchRepository;
import com.mes.production.service.BatchAllocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/batch-allocations")
@RequiredArgsConstructor
@Slf4j
public class BatchAllocationController {

    private final BatchAllocationService allocationService;
    private final BatchRepository batchRepository;

    /**
     * Allocate batch to order line
     */
    @PostMapping
    public ResponseEntity<BatchAllocationDTO.AllocationInfo> allocate(
            @RequestBody BatchAllocationDTO.AllocateRequest request) {
        log.info("POST /api/batch-allocations - Batch: {}, OrderLine: {}, Qty: {}",
                request.getBatchId(), request.getOrderLineId(), request.getQuantity());
        BatchOrderAllocation allocation = allocationService.allocateBatchToOrder(
                request.getBatchId(),
                request.getOrderLineId(),
                request.getQuantity()
        );
        return ResponseEntity.ok(convertToAllocationInfo(allocation));
    }

    /**
     * Release an allocation
     */
    @PutMapping("/{allocationId}/release")
    public ResponseEntity<BatchAllocationDTO.AllocationInfo> release(@PathVariable Long allocationId) {
        log.info("PUT /api/batch-allocations/{}/release", allocationId);
        BatchOrderAllocation allocation = allocationService.releaseAllocation(allocationId);
        return ResponseEntity.ok(convertToAllocationInfo(allocation));
    }

    /**
     * Update allocation quantity
     */
    @PutMapping("/{allocationId}/quantity")
    public ResponseEntity<BatchAllocationDTO.AllocationInfo> updateQuantity(
            @PathVariable Long allocationId,
            @RequestBody BatchAllocationDTO.UpdateQuantityRequest request) {
        log.info("PUT /api/batch-allocations/{}/quantity - New qty: {}", allocationId, request.getQuantity());
        BatchOrderAllocation allocation = allocationService.updateAllocationQuantity(
                allocationId,
                request.getQuantity()
        );
        return ResponseEntity.ok(convertToAllocationInfo(allocation));
    }

    /**
     * Get allocations for a batch
     */
    @GetMapping("/batch/{batchId}")
    public ResponseEntity<List<BatchAllocationDTO.AllocationInfo>> getBatchAllocations(
            @PathVariable Long batchId) {
        log.info("GET /api/batch-allocations/batch/{}", batchId);
        List<BatchOrderAllocation> allocations = allocationService.getBatchAllocations(batchId);
        List<BatchAllocationDTO.AllocationInfo> infos = allocations.stream()
                .map(this::convertToAllocationInfo)
                .collect(Collectors.toList());
        return ResponseEntity.ok(infos);
    }

    /**
     * Get allocations for an order line
     */
    @GetMapping("/order-line/{orderLineId}")
    public ResponseEntity<List<BatchAllocationDTO.AllocationInfo>> getOrderLineAllocations(
            @PathVariable Long orderLineId) {
        log.info("GET /api/batch-allocations/order-line/{}", orderLineId);
        List<BatchOrderAllocation> allocations = allocationService.getOrderLineAllocations(orderLineId);
        List<BatchAllocationDTO.AllocationInfo> infos = allocations.stream()
                .map(this::convertToAllocationInfo)
                .collect(Collectors.toList());
        return ResponseEntity.ok(infos);
    }

    /**
     * Get batch availability
     */
    @GetMapping("/batch/{batchId}/availability")
    public ResponseEntity<BatchAllocationDTO.BatchAvailability> getBatchAvailability(
            @PathVariable Long batchId) {
        log.info("GET /api/batch-allocations/batch/{}/availability", batchId);

        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));

        BigDecimal totalAllocated = allocationService.getTotalAllocatedForBatch(batchId);
        BigDecimal available = allocationService.getAvailableQuantityForBatch(batchId);
        boolean fullyAllocated = allocationService.isBatchFullyAllocated(batchId);

        BatchAllocationDTO.BatchAvailability availability = BatchAllocationDTO.BatchAvailability.builder()
                .batchId(batchId)
                .batchNumber(batch.getBatchNumber())
                .totalQuantity(batch.getQuantity())
                .allocatedQuantity(totalAllocated)
                .availableQuantity(available)
                .fullyAllocated(fullyAllocated)
                .build();

        return ResponseEntity.ok(availability);
    }

    private BatchAllocationDTO.AllocationInfo convertToAllocationInfo(BatchOrderAllocation allocation) {
        return BatchAllocationDTO.AllocationInfo.builder()
                .allocationId(allocation.getAllocationId())
                .batchId(allocation.getBatch() != null ? allocation.getBatch().getBatchId() : null)
                .batchNumber(allocation.getBatch() != null ? allocation.getBatch().getBatchNumber() : null)
                .materialId(allocation.getBatch() != null ? allocation.getBatch().getMaterialId() : null)
                .materialName(allocation.getBatch() != null ? allocation.getBatch().getMaterialName() : null)
                .orderLineId(allocation.getOrderLineItem() != null ? allocation.getOrderLineItem().getOrderLineId() : null)
                .orderId(allocation.getOrderLineItem() != null && allocation.getOrderLineItem().getOrder() != null
                        ? allocation.getOrderLineItem().getOrder().getOrderId() : null)
                .productSku(allocation.getOrderLineItem() != null ? allocation.getOrderLineItem().getProductSku() : null)
                .productName(allocation.getOrderLineItem() != null ? allocation.getOrderLineItem().getProductName() : null)
                .allocatedQty(allocation.getAllocatedQty())
                .unit(allocation.getBatch() != null ? allocation.getBatch().getUnit() : null)
                .timestamp(allocation.getTimestamp())
                .status(allocation.getStatus())
                .createdBy(allocation.getCreatedBy())
                .build();
    }
}
