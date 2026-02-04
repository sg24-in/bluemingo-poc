package com.mes.production.service;

import com.mes.production.entity.Batch;
import com.mes.production.entity.BatchOrderAllocation;
import com.mes.production.entity.OrderLineItem;
import com.mes.production.repository.BatchOrderAllocationRepository;
import com.mes.production.repository.BatchRepository;
import com.mes.production.repository.OrderLineItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BatchAllocationService {

    private final BatchOrderAllocationRepository allocationRepository;
    private final BatchRepository batchRepository;
    private final OrderLineItemRepository orderLineItemRepository;
    private final AuditService auditService;

    /**
     * Allocate a batch to an order line
     */
    @Transactional
    public BatchOrderAllocation allocateBatchToOrder(Long batchId, Long orderLineId, BigDecimal quantity) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));

        OrderLineItem orderLine = orderLineItemRepository.findById(orderLineId)
                .orElseThrow(() -> new RuntimeException("Order line not found: " + orderLineId));

        // Check if batch has sufficient unallocated quantity
        BigDecimal totalAllocated = allocationRepository.getTotalAllocatedQtyForBatch(batchId);
        BigDecimal availableQty = batch.getQuantity().subtract(totalAllocated);

        if (quantity.compareTo(availableQty) > 0) {
            throw new RuntimeException(String.format(
                    "Insufficient batch quantity. Available: %s, Requested: %s", availableQty, quantity));
        }

        // Check if allocation already exists
        allocationRepository.findByBatch_BatchIdAndOrderLineItem_OrderLineId(batchId, orderLineId)
                .ifPresent(existing -> {
                    throw new RuntimeException("Allocation already exists for this batch and order line");
                });

        BatchOrderAllocation allocation = BatchOrderAllocation.builder()
                .batch(batch)
                .orderLineItem(orderLine)
                .allocatedQty(quantity)
                .timestamp(LocalDateTime.now())
                .status(BatchOrderAllocation.STATUS_ALLOCATED)
                .createdBy(getCurrentUser())
                .build();

        allocation = allocationRepository.save(allocation);
        log.info("Allocated batch {} to order line {}: quantity={}", batchId, orderLineId, quantity);

        auditService.logCreate("BATCH_ALLOCATION", allocation.getAllocationId(),
                String.format("Batch: %s, Order: %d, Qty: %s", batch.getBatchNumber(), orderLineId, quantity));

        return allocation;
    }

    /**
     * Release an allocation
     */
    @Transactional
    public BatchOrderAllocation releaseAllocation(Long allocationId) {
        BatchOrderAllocation allocation = allocationRepository.findById(allocationId)
                .orElseThrow(() -> new RuntimeException("Allocation not found: " + allocationId));

        if (BatchOrderAllocation.STATUS_RELEASED.equals(allocation.getStatus())) {
            throw new RuntimeException("Allocation is already released");
        }

        String oldStatus = allocation.getStatus();
        allocation.setStatus(BatchOrderAllocation.STATUS_RELEASED);
        allocation = allocationRepository.save(allocation);

        log.info("Released allocation {}", allocationId);

        auditService.logStatusChange("BATCH_ALLOCATION", allocationId, oldStatus, BatchOrderAllocation.STATUS_RELEASED);

        return allocation;
    }

    /**
     * Get allocations for a batch
     */
    @Transactional(readOnly = true)
    public List<BatchOrderAllocation> getBatchAllocations(Long batchId) {
        return allocationRepository.findByBatchWithOrderDetails(batchId);
    }

    /**
     * Get allocations for an order line
     */
    @Transactional(readOnly = true)
    public List<BatchOrderAllocation> getOrderLineAllocations(Long orderLineId) {
        return allocationRepository.findByOrderLineWithBatchDetails(orderLineId);
    }

    /**
     * Get active allocations for a batch
     */
    @Transactional(readOnly = true)
    public List<BatchOrderAllocation> getActiveBatchAllocations(Long batchId) {
        return allocationRepository.findByBatch_BatchIdAndStatus(batchId, BatchOrderAllocation.STATUS_ALLOCATED);
    }

    /**
     * Get total allocated quantity for a batch
     */
    @Transactional(readOnly = true)
    public BigDecimal getTotalAllocatedForBatch(Long batchId) {
        return allocationRepository.getTotalAllocatedQtyForBatch(batchId);
    }

    /**
     * Get available (unallocated) quantity for a batch
     */
    @Transactional(readOnly = true)
    public BigDecimal getAvailableQuantityForBatch(Long batchId) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));

        BigDecimal totalAllocated = allocationRepository.getTotalAllocatedQtyForBatch(batchId);
        return batch.getQuantity().subtract(totalAllocated);
    }

    /**
     * Check if batch is fully allocated
     */
    @Transactional(readOnly = true)
    public boolean isBatchFullyAllocated(Long batchId) {
        return allocationRepository.isBatchFullyAllocated(batchId);
    }

    /**
     * Update allocation quantity
     */
    @Transactional
    public BatchOrderAllocation updateAllocationQuantity(Long allocationId, BigDecimal newQuantity) {
        BatchOrderAllocation allocation = allocationRepository.findById(allocationId)
                .orElseThrow(() -> new RuntimeException("Allocation not found: " + allocationId));

        if (BatchOrderAllocation.STATUS_RELEASED.equals(allocation.getStatus())) {
            throw new RuntimeException("Cannot update released allocation");
        }

        // Verify new quantity doesn't exceed available
        Batch batch = allocation.getBatch();
        BigDecimal totalAllocated = allocationRepository.getTotalAllocatedQtyForBatch(batch.getBatchId());
        BigDecimal currentAllocation = allocation.getAllocatedQty();
        BigDecimal availableQty = batch.getQuantity().subtract(totalAllocated).add(currentAllocation);

        if (newQuantity.compareTo(availableQty) > 0) {
            throw new RuntimeException(String.format(
                    "Insufficient batch quantity. Available: %s, Requested: %s", availableQty, newQuantity));
        }

        BigDecimal oldQty = allocation.getAllocatedQty();
        allocation.setAllocatedQty(newQuantity);
        allocation = allocationRepository.save(allocation);

        auditService.logUpdate("BATCH_ALLOCATION", allocationId, "allocatedQty",
                oldQty.toString(), newQuantity.toString());

        return allocation;
    }

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
    }
}
