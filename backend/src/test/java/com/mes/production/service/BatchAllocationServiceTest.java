package com.mes.production.service;

import com.mes.production.entity.Batch;
import com.mes.production.entity.BatchOrderAllocation;
import com.mes.production.entity.Order;
import com.mes.production.entity.OrderLineItem;
import com.mes.production.repository.BatchOrderAllocationRepository;
import com.mes.production.repository.BatchRepository;
import com.mes.production.repository.OrderLineItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BatchAllocationServiceTest {

    @Mock
    private BatchOrderAllocationRepository allocationRepository;

    @Mock
    private BatchRepository batchRepository;

    @Mock
    private OrderLineItemRepository orderLineItemRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private BatchAllocationService allocationService;

    private Batch testBatch;
    private OrderLineItem testOrderLine;
    private Order testOrder;
    private BatchOrderAllocation testAllocation;

    @BeforeEach
    void setUp() {
        testBatch = Batch.builder()
                .batchId(1L)
                .batchNumber("BATCH-001")
                .materialId("IM-001")
                .materialName("Steel Billet")
                .quantity(new BigDecimal("500.00"))
                .unit("KG")
                .status("AVAILABLE")
                .build();

        testOrder = Order.builder()
                .orderId(1L)
                .customerId("CUST-001")
                .status("IN_PROGRESS")
                .build();

        testOrderLine = OrderLineItem.builder()
                .orderLineId(1L)
                .order(testOrder)
                .productSku("STEEL-001")
                .quantity(new BigDecimal("200.00"))
                .build();

        testAllocation = BatchOrderAllocation.builder()
                .allocationId(1L)
                .batch(testBatch)
                .orderLineItem(testOrderLine)
                .allocatedQty(new BigDecimal("100.00"))
                .timestamp(LocalDateTime.now())
                .status(BatchOrderAllocation.STATUS_ALLOCATED)
                .createdBy("admin@mes.com")
                .build();
    }

    @Test
    @DisplayName("Should allocate batch to order line successfully")
    void allocateBatchToOrder_ValidRequest_ReturnsAllocation() {
        // Arrange
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(orderLineItemRepository.findById(1L)).thenReturn(Optional.of(testOrderLine));
        when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(BigDecimal.ZERO);
        when(allocationRepository.findByBatch_BatchIdAndOrderLineItem_OrderLineId(1L, 1L)).thenReturn(Optional.empty());
        when(allocationRepository.save(any(BatchOrderAllocation.class))).thenAnswer(i -> {
            BatchOrderAllocation a = i.getArgument(0);
            a.setAllocationId(1L);
            return a;
        });

        // Act
        BatchOrderAllocation result = allocationService.allocateBatchToOrder(1L, 1L, new BigDecimal("100.00"));

        // Assert
        assertNotNull(result);
        assertEquals(new BigDecimal("100.00"), result.getAllocatedQty());
        assertEquals(BatchOrderAllocation.STATUS_ALLOCATED, result.getStatus());
        verify(allocationRepository, times(1)).save(any(BatchOrderAllocation.class));
        verify(auditService, times(1)).logCreate(eq("BATCH_ALLOCATION"), any(), anyString());
    }

    @Test
    @DisplayName("Should throw exception when batch not found")
    void allocateBatchToOrder_BatchNotFound_ThrowsException() {
        // Arrange
        when(batchRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> allocationService.allocateBatchToOrder(999L, 1L, new BigDecimal("100.00")));

        assertTrue(exception.getMessage().contains("Batch not found"));
    }

    @Test
    @DisplayName("Should throw exception when order line not found")
    void allocateBatchToOrder_OrderLineNotFound_ThrowsException() {
        // Arrange
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(orderLineItemRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> allocationService.allocateBatchToOrder(1L, 999L, new BigDecimal("100.00")));

        assertTrue(exception.getMessage().contains("Order line not found"));
    }

    @Test
    @DisplayName("Should throw exception when insufficient quantity")
    void allocateBatchToOrder_InsufficientQuantity_ThrowsException() {
        // Arrange
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(orderLineItemRepository.findById(1L)).thenReturn(Optional.of(testOrderLine));
        when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(new BigDecimal("450.00"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> allocationService.allocateBatchToOrder(1L, 1L, new BigDecimal("100.00")));

        assertTrue(exception.getMessage().contains("Insufficient batch quantity"));
    }

    @Test
    @DisplayName("Should throw exception when allocation already exists")
    void allocateBatchToOrder_AllocationExists_ThrowsException() {
        // Arrange
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(orderLineItemRepository.findById(1L)).thenReturn(Optional.of(testOrderLine));
        when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(BigDecimal.ZERO);
        when(allocationRepository.findByBatch_BatchIdAndOrderLineItem_OrderLineId(1L, 1L))
                .thenReturn(Optional.of(testAllocation));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> allocationService.allocateBatchToOrder(1L, 1L, new BigDecimal("100.00")));

        assertTrue(exception.getMessage().contains("Allocation already exists"));
    }

    @Test
    @DisplayName("Should release allocation successfully")
    void releaseAllocation_ValidRequest_ReleasesAllocation() {
        // Arrange
        when(allocationRepository.findById(1L)).thenReturn(Optional.of(testAllocation));
        when(allocationRepository.save(any(BatchOrderAllocation.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        BatchOrderAllocation result = allocationService.releaseAllocation(1L);

        // Assert
        assertNotNull(result);
        assertEquals(BatchOrderAllocation.STATUS_RELEASED, result.getStatus());
        verify(auditService, times(1)).logStatusChange(eq("BATCH_ALLOCATION"), eq(1L), anyString(), eq(BatchOrderAllocation.STATUS_RELEASED));
    }

    @Test
    @DisplayName("Should throw exception when allocation not found")
    void releaseAllocation_NotFound_ThrowsException() {
        // Arrange
        when(allocationRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> allocationService.releaseAllocation(999L));

        assertTrue(exception.getMessage().contains("Allocation not found"));
    }

    @Test
    @DisplayName("Should throw exception when allocation already released")
    void releaseAllocation_AlreadyReleased_ThrowsException() {
        // Arrange
        testAllocation.setStatus(BatchOrderAllocation.STATUS_RELEASED);
        when(allocationRepository.findById(1L)).thenReturn(Optional.of(testAllocation));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> allocationService.releaseAllocation(1L));

        assertTrue(exception.getMessage().contains("already released"));
    }

    @Test
    @DisplayName("Should get batch allocations")
    void getBatchAllocations_ValidId_ReturnsAllocations() {
        // Arrange
        when(allocationRepository.findByBatchWithOrderDetails(1L)).thenReturn(List.of(testAllocation));

        // Act
        List<BatchOrderAllocation> result = allocationService.getBatchAllocations(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getAllocationId());
    }

    @Test
    @DisplayName("Should get order line allocations")
    void getOrderLineAllocations_ValidId_ReturnsAllocations() {
        // Arrange
        when(allocationRepository.findByOrderLineWithBatchDetails(1L)).thenReturn(List.of(testAllocation));

        // Act
        List<BatchOrderAllocation> result = allocationService.getOrderLineAllocations(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("Should get active batch allocations")
    void getActiveBatchAllocations_ValidId_ReturnsActiveAllocations() {
        // Arrange
        when(allocationRepository.findByBatch_BatchIdAndStatus(1L, BatchOrderAllocation.STATUS_ALLOCATED))
                .thenReturn(List.of(testAllocation));

        // Act
        List<BatchOrderAllocation> result = allocationService.getActiveBatchAllocations(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(BatchOrderAllocation.STATUS_ALLOCATED, result.get(0).getStatus());
    }

    @Test
    @DisplayName("Should get total allocated for batch")
    void getTotalAllocatedForBatch_ValidId_ReturnsTotal() {
        // Arrange
        when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(new BigDecimal("200.00"));

        // Act
        BigDecimal result = allocationService.getTotalAllocatedForBatch(1L);

        // Assert
        assertEquals(new BigDecimal("200.00"), result);
    }

    @Test
    @DisplayName("Should get available quantity for batch")
    void getAvailableQuantityForBatch_ValidId_ReturnsAvailableQty() {
        // Arrange
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(new BigDecimal("200.00"));

        // Act
        BigDecimal result = allocationService.getAvailableQuantityForBatch(1L);

        // Assert
        assertEquals(new BigDecimal("300.00"), result); // 500 - 200
    }

    @Test
    @DisplayName("Should check if batch is fully allocated")
    void isBatchFullyAllocated_ValidId_ReturnsStatus() {
        // Arrange
        when(allocationRepository.isBatchFullyAllocated(1L)).thenReturn(false);

        // Act
        boolean result = allocationService.isBatchFullyAllocated(1L);

        // Assert
        assertFalse(result);
    }

    @Test
    @DisplayName("Should update allocation quantity successfully")
    void updateAllocationQuantity_ValidRequest_UpdatesQuantity() {
        // Arrange
        when(allocationRepository.findById(1L)).thenReturn(Optional.of(testAllocation));
        when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(new BigDecimal("100.00"));
        when(allocationRepository.save(any(BatchOrderAllocation.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        BatchOrderAllocation result = allocationService.updateAllocationQuantity(1L, new BigDecimal("150.00"));

        // Assert
        assertNotNull(result);
        assertEquals(new BigDecimal("150.00"), result.getAllocatedQty());
        verify(auditService, times(1)).logUpdate(eq("BATCH_ALLOCATION"), eq(1L), eq("allocatedQty"), anyString(), anyString());
    }

    @Test
    @DisplayName("Should throw exception when updating released allocation")
    void updateAllocationQuantity_ReleasedAllocation_ThrowsException() {
        // Arrange
        testAllocation.setStatus(BatchOrderAllocation.STATUS_RELEASED);
        when(allocationRepository.findById(1L)).thenReturn(Optional.of(testAllocation));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> allocationService.updateAllocationQuantity(1L, new BigDecimal("150.00")));

        assertTrue(exception.getMessage().contains("Cannot update released"));
    }

    @Test
    @DisplayName("Should throw exception when new quantity exceeds available")
    void updateAllocationQuantity_ExceedsAvailable_ThrowsException() {
        // Arrange
        when(allocationRepository.findById(1L)).thenReturn(Optional.of(testAllocation));
        when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(new BigDecimal("450.00"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> allocationService.updateAllocationQuantity(1L, new BigDecimal("200.00")));

        assertTrue(exception.getMessage().contains("Insufficient batch quantity"));
    }
}
