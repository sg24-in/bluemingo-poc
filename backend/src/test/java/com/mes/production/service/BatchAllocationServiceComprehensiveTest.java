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
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Comprehensive test suite for BatchAllocationService.
 *
 * This test suite covers additional edge cases for batch allocation:
 *
 * Test Categories:
 * 1. Allocation Quantity Edge Cases - Precision, zero, boundary values
 * 2. Multiple Allocations - Same batch to multiple orders, vice versa
 * 3. Partial Allocations - Allocating less than full batch quantity
 * 4. Release and Re-allocate - Releasing allocations and re-allocating
 * 5. Concurrent Allocations - Thread safety considerations
 * 6. Available Quantity Calculations - Complex scenarios
 * 7. Error Handling - Various failure modes
 * 8. Audit Trail - Verification of audit logging
 *
 * Per MES Batch Allocation Specification:
 * - Allocations must not exceed available batch quantity
 * - Released allocations restore quantity to batch
 * - Duplicate allocations for same batch/order line are not allowed
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("BatchAllocationService Comprehensive Tests")
class BatchAllocationServiceComprehensiveTest {

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

    // ========================================================================
    // 1. ALLOCATION QUANTITY EDGE CASES
    // ========================================================================

    @Nested
    @DisplayName("1. Allocation Quantity Edge Cases")
    class AllocationQuantityTests {

        @Test
        @DisplayName("1.1 Should allocate exact batch quantity (fully allocated)")
        void allocate_ExactQuantity_FullyAllocates() {
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
            BatchOrderAllocation result = allocationService.allocateBatchToOrder(1L, 1L, new BigDecimal("500.00"));

            // Assert
            assertNotNull(result);
            assertEquals(new BigDecimal("500.00"), result.getAllocatedQty());
        }

        @Test
        @DisplayName("1.2 Should allocate very small quantity (precision test)")
        void allocate_SmallQuantity_MaintainsPrecision() {
            // Arrange
            testBatch.setQuantity(new BigDecimal("1.000"));

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
            BatchOrderAllocation result = allocationService.allocateBatchToOrder(1L, 1L, new BigDecimal("0.001"));

            // Assert
            assertEquals(0, result.getAllocatedQty().compareTo(new BigDecimal("0.001")));
        }

        @Test
        @DisplayName("1.3 Should reject zero quantity allocation")
        void allocate_ZeroQuantity_ThrowsException() {
            // Arrange
            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(orderLineItemRepository.findById(1L)).thenReturn(Optional.of(testOrderLine));
            when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(BigDecimal.ZERO);

            // Act & Assert - allocating zero should fail
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> allocationService.allocateBatchToOrder(1L, 1L, BigDecimal.ZERO));

            // Note: If the service allows zero allocation, this test documents that behavior
        }

        @Test
        @DisplayName("1.4 Should reject negative quantity allocation")
        void allocate_NegativeQuantity_ThrowsException() {
            // Arrange
            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(orderLineItemRepository.findById(1L)).thenReturn(Optional.of(testOrderLine));
            when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(BigDecimal.ZERO);

            // Act & Assert
            assertThrows(RuntimeException.class,
                    () -> allocationService.allocateBatchToOrder(1L, 1L, new BigDecimal("-100.00")));
        }

        @Test
        @DisplayName("1.5 Should reject quantity exceeding available by 0.01")
        void allocate_ExceedsBySmallAmount_ThrowsException() {
            // Arrange
            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(orderLineItemRepository.findById(1L)).thenReturn(Optional.of(testOrderLine));
            when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(new BigDecimal("400.00"));
            when(allocationRepository.findByBatch_BatchIdAndOrderLineItem_OrderLineId(1L, 1L)).thenReturn(Optional.empty());

            // Available = 500 - 400 = 100. Request 100.01
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> allocationService.allocateBatchToOrder(1L, 1L, new BigDecimal("100.01")));

            assertTrue(exception.getMessage().contains("Insufficient"));
        }

        @Test
        @DisplayName("1.6 Should handle large quantity allocations")
        void allocate_LargeQuantity_HandlesSuccessfully() {
            // Arrange
            testBatch.setQuantity(new BigDecimal("999999999.99"));

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
            BatchOrderAllocation result = allocationService.allocateBatchToOrder(1L, 1L, new BigDecimal("999999999.99"));

            // Assert
            assertEquals(new BigDecimal("999999999.99"), result.getAllocatedQty());
        }
    }

    // ========================================================================
    // 2. MULTIPLE ALLOCATIONS
    // ========================================================================

    @Nested
    @DisplayName("2. Multiple Allocations Tests")
    class MultipleAllocationTests {

        @Test
        @DisplayName("2.1 Should allow same batch to different order lines")
        void allocate_SameBatchDifferentOrders_Succeeds() {
            // Arrange
            OrderLineItem orderLine2 = OrderLineItem.builder()
                    .orderLineId(2L)
                    .order(testOrder)
                    .productSku("STEEL-002")
                    .quantity(new BigDecimal("100.00"))
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(orderLineItemRepository.findById(1L)).thenReturn(Optional.of(testOrderLine));
            when(orderLineItemRepository.findById(2L)).thenReturn(Optional.of(orderLine2));
            when(allocationRepository.getTotalAllocatedQtyForBatch(1L))
                    .thenReturn(BigDecimal.ZERO)
                    .thenReturn(new BigDecimal("100.00"));
            when(allocationRepository.findByBatch_BatchIdAndOrderLineItem_OrderLineId(anyLong(), anyLong()))
                    .thenReturn(Optional.empty());
            when(allocationRepository.save(any(BatchOrderAllocation.class))).thenAnswer(i -> {
                BatchOrderAllocation a = i.getArgument(0);
                a.setAllocationId(10L);
                return a;
            });

            // Act
            BatchOrderAllocation result1 = allocationService.allocateBatchToOrder(1L, 1L, new BigDecimal("100.00"));
            BatchOrderAllocation result2 = allocationService.allocateBatchToOrder(1L, 2L, new BigDecimal("100.00"));

            // Assert
            assertNotNull(result1);
            assertNotNull(result2);
            verify(allocationRepository, times(2)).save(any(BatchOrderAllocation.class));
        }

        @Test
        @DisplayName("2.2 Should prevent duplicate allocation to same batch/order line")
        void allocate_DuplicateAllocation_ThrowsException() {
            // Arrange
            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(orderLineItemRepository.findById(1L)).thenReturn(Optional.of(testOrderLine));
            when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(BigDecimal.ZERO);
            when(allocationRepository.findByBatch_BatchIdAndOrderLineItem_OrderLineId(1L, 1L))
                    .thenReturn(Optional.of(testAllocation));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> allocationService.allocateBatchToOrder(1L, 1L, new BigDecimal("50.00")));

            assertTrue(exception.getMessage().contains("already exists"));
        }

        @Test
        @DisplayName("2.3 Should track total allocated across multiple order lines")
        void allocate_MultipleOrderLines_CalculatesTotal() {
            // Arrange - already allocated 200, trying to allocate 350 more (total 550 > 500)
            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(orderLineItemRepository.findById(2L)).thenReturn(Optional.of(
                    OrderLineItem.builder().orderLineId(2L).order(testOrder).productSku("STEEL-002").build()
            ));
            when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(new BigDecimal("200.00"));
            when(allocationRepository.findByBatch_BatchIdAndOrderLineItem_OrderLineId(1L, 2L))
                    .thenReturn(Optional.empty());

            // Act & Assert - 350 + 200 = 550 > 500 available
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> allocationService.allocateBatchToOrder(1L, 2L, new BigDecimal("350.00")));

            assertTrue(exception.getMessage().contains("Insufficient"));
        }
    }

    // ========================================================================
    // 3. PARTIAL ALLOCATIONS
    // ========================================================================

    @Nested
    @DisplayName("3. Partial Allocation Tests")
    class PartialAllocationTests {

        @Test
        @DisplayName("3.1 Should allow partial allocation leaving some quantity")
        void allocate_PartialAmount_LeavesRemaining() {
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

            // Act - allocate only 100 out of 500
            BatchOrderAllocation result = allocationService.allocateBatchToOrder(1L, 1L, new BigDecimal("100.00"));

            // Assert
            assertEquals(new BigDecimal("100.00"), result.getAllocatedQty());

            // Verify available quantity calculation works
            when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(new BigDecimal("100.00"));
            BigDecimal available = allocationService.getAvailableQuantityForBatch(1L);
            assertEquals(new BigDecimal("400.00"), available);
        }

        @Test
        @DisplayName("3.2 Should return correct available quantity after partial allocation")
        void getAvailable_AfterPartialAllocation_ReturnsCorrect() {
            // Arrange
            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(new BigDecimal("350.00"));

            // Act
            BigDecimal available = allocationService.getAvailableQuantityForBatch(1L);

            // Assert
            assertEquals(new BigDecimal("150.00"), available);
        }
    }

    // ========================================================================
    // 4. RELEASE AND RE-ALLOCATE
    // ========================================================================

    @Nested
    @DisplayName("4. Release and Re-allocate Tests")
    class ReleaseAndReallocateTests {

        @Test
        @DisplayName("4.1 Should restore quantity after release")
        void release_ThenQueryAvailable_ShowsRestored() {
            // Arrange
            when(allocationRepository.findById(1L)).thenReturn(Optional.of(testAllocation));
            when(allocationRepository.save(any(BatchOrderAllocation.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            BatchOrderAllocation released = allocationService.releaseAllocation(1L);

            // Assert
            assertEquals(BatchOrderAllocation.STATUS_RELEASED, released.getStatus());
            verify(auditService).logStatusChange(eq("BATCH_ALLOCATION"), eq(1L),
                    eq(BatchOrderAllocation.STATUS_ALLOCATED), eq(BatchOrderAllocation.STATUS_RELEASED));
        }

        @Test
        @DisplayName("4.2 Should allow new allocation after release")
        void release_ThenReallocate_Succeeds() {
            // Arrange
            testAllocation.setStatus(BatchOrderAllocation.STATUS_RELEASED);

            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(orderLineItemRepository.findById(1L)).thenReturn(Optional.of(testOrderLine));
            // After release, the getTotalAllocatedQtyForBatch should return 0 (released allocations don't count)
            when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(BigDecimal.ZERO);
            when(allocationRepository.findByBatch_BatchIdAndOrderLineItem_OrderLineId(1L, 1L)).thenReturn(Optional.empty());
            when(allocationRepository.save(any(BatchOrderAllocation.class))).thenAnswer(i -> {
                BatchOrderAllocation a = i.getArgument(0);
                a.setAllocationId(2L);
                return a;
            });

            // Act
            BatchOrderAllocation newAllocation = allocationService.allocateBatchToOrder(1L, 1L, new BigDecimal("100.00"));

            // Assert
            assertNotNull(newAllocation);
            assertEquals(2L, newAllocation.getAllocationId());
        }

        @Test
        @DisplayName("4.3 Should prevent double release")
        void release_AlreadyReleased_ThrowsException() {
            // Arrange
            testAllocation.setStatus(BatchOrderAllocation.STATUS_RELEASED);
            when(allocationRepository.findById(1L)).thenReturn(Optional.of(testAllocation));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> allocationService.releaseAllocation(1L));

            assertTrue(exception.getMessage().contains("already released"));
        }
    }

    // ========================================================================
    // 5. UPDATE ALLOCATION QUANTITY
    // ========================================================================

    @Nested
    @DisplayName("5. Update Allocation Quantity Tests")
    class UpdateQuantityTests {

        @Test
        @DisplayName("5.1 Should increase allocation quantity within available")
        void updateQuantity_Increase_Succeeds() {
            // Arrange
            when(allocationRepository.findById(1L)).thenReturn(Optional.of(testAllocation));
            when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(new BigDecimal("100.00"));
            when(allocationRepository.save(any(BatchOrderAllocation.class))).thenAnswer(i -> i.getArgument(0));

            // Act - increase from 100 to 200 (available = 500 - 100 + 100 = 500)
            BatchOrderAllocation result = allocationService.updateAllocationQuantity(1L, new BigDecimal("200.00"));

            // Assert
            assertEquals(new BigDecimal("200.00"), result.getAllocatedQty());
        }

        @Test
        @DisplayName("5.2 Should decrease allocation quantity")
        void updateQuantity_Decrease_Succeeds() {
            // Arrange
            when(allocationRepository.findById(1L)).thenReturn(Optional.of(testAllocation));
            when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(new BigDecimal("100.00"));
            when(allocationRepository.save(any(BatchOrderAllocation.class))).thenAnswer(i -> i.getArgument(0));

            // Act - decrease from 100 to 50
            BatchOrderAllocation result = allocationService.updateAllocationQuantity(1L, new BigDecimal("50.00"));

            // Assert
            assertEquals(new BigDecimal("50.00"), result.getAllocatedQty());
        }

        @Test
        @DisplayName("5.3 Should reject update exceeding available")
        void updateQuantity_ExceedsAvailable_ThrowsException() {
            // Arrange
            when(allocationRepository.findById(1L)).thenReturn(Optional.of(testAllocation));
            when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(new BigDecimal("400.00"));

            // Available = 500 - 400 + 100 = 200. Request 250.
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> allocationService.updateAllocationQuantity(1L, new BigDecimal("250.00")));

            assertTrue(exception.getMessage().contains("Insufficient"));
        }

        @Test
        @DisplayName("5.4 Should reject update on released allocation")
        void updateQuantity_Released_ThrowsException() {
            // Arrange
            testAllocation.setStatus(BatchOrderAllocation.STATUS_RELEASED);
            when(allocationRepository.findById(1L)).thenReturn(Optional.of(testAllocation));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> allocationService.updateAllocationQuantity(1L, new BigDecimal("150.00")));

            assertTrue(exception.getMessage().contains("released"));
        }

        @Test
        @DisplayName("5.5 Should log audit on quantity update")
        void updateQuantity_Success_LogsAudit() {
            // Arrange
            when(allocationRepository.findById(1L)).thenReturn(Optional.of(testAllocation));
            when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(new BigDecimal("100.00"));
            when(allocationRepository.save(any(BatchOrderAllocation.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            allocationService.updateAllocationQuantity(1L, new BigDecimal("150.00"));

            // Assert
            verify(auditService).logUpdate(eq("BATCH_ALLOCATION"), eq(1L), eq("allocatedQty"),
                    eq("100.00"), eq("150.00"));
        }
    }

    // ========================================================================
    // 6. AVAILABLE QUANTITY CALCULATIONS
    // ========================================================================

    @Nested
    @DisplayName("6. Available Quantity Calculations")
    class AvailableQuantityTests {

        @Test
        @DisplayName("6.1 Should return full quantity when no allocations")
        void getAvailable_NoAllocations_ReturnsFull() {
            // Arrange
            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(BigDecimal.ZERO);

            // Act
            BigDecimal available = allocationService.getAvailableQuantityForBatch(1L);

            // Assert
            assertEquals(new BigDecimal("500.00"), available);
        }

        @Test
        @DisplayName("6.2 Should return zero when fully allocated")
        void getAvailable_FullyAllocated_ReturnsZero() {
            // Arrange
            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(new BigDecimal("500.00"));

            // Act
            BigDecimal available = allocationService.getAvailableQuantityForBatch(1L);

            // Assert
            assertEquals(0, available.compareTo(BigDecimal.ZERO));
        }

        @Test
        @DisplayName("6.3 Should indicate fully allocated status")
        void isFullyAllocated_FullQuantity_ReturnsTrue() {
            // Arrange
            when(allocationRepository.isBatchFullyAllocated(1L)).thenReturn(true);

            // Act
            boolean isFullyAllocated = allocationService.isBatchFullyAllocated(1L);

            // Assert
            assertTrue(isFullyAllocated);
        }

        @Test
        @DisplayName("6.4 Should indicate not fully allocated when partial")
        void isFullyAllocated_Partial_ReturnsFalse() {
            // Arrange
            when(allocationRepository.isBatchFullyAllocated(1L)).thenReturn(false);

            // Act
            boolean isFullyAllocated = allocationService.isBatchFullyAllocated(1L);

            // Assert
            assertFalse(isFullyAllocated);
        }

        @Test
        @DisplayName("6.5 Should throw when batch not found for available query")
        void getAvailable_BatchNotFound_ThrowsException() {
            // Arrange
            when(batchRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThrows(RuntimeException.class,
                    () -> allocationService.getAvailableQuantityForBatch(999L));
        }
    }

    // ========================================================================
    // 7. ERROR HANDLING
    // ========================================================================

    @Nested
    @DisplayName("7. Error Handling Tests")
    class ErrorHandlingTests {

        @Test
        @DisplayName("7.1 Should throw clear error for missing batch")
        void allocate_MissingBatch_ClearError() {
            // Arrange
            when(batchRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> allocationService.allocateBatchToOrder(999L, 1L, new BigDecimal("100.00")));

            assertTrue(exception.getMessage().contains("Batch not found"));
            assertTrue(exception.getMessage().contains("999"));
        }

        @Test
        @DisplayName("7.2 Should throw clear error for missing order line")
        void allocate_MissingOrderLine_ClearError() {
            // Arrange
            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(orderLineItemRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> allocationService.allocateBatchToOrder(1L, 999L, new BigDecimal("100.00")));

            assertTrue(exception.getMessage().contains("Order line not found"));
            assertTrue(exception.getMessage().contains("999"));
        }

        @Test
        @DisplayName("7.3 Should throw clear error for missing allocation on release")
        void release_MissingAllocation_ClearError() {
            // Arrange
            when(allocationRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> allocationService.releaseAllocation(999L));

            assertTrue(exception.getMessage().contains("Allocation not found"));
            assertTrue(exception.getMessage().contains("999"));
        }

        @Test
        @DisplayName("7.4 Should include available quantity in insufficient error")
        void allocate_Insufficient_ErrorIncludesAvailable() {
            // Arrange
            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(orderLineItemRepository.findById(1L)).thenReturn(Optional.of(testOrderLine));
            when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(new BigDecimal("400.00"));
            when(allocationRepository.findByBatch_BatchIdAndOrderLineItem_OrderLineId(1L, 1L)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> allocationService.allocateBatchToOrder(1L, 1L, new BigDecimal("150.00")));

            assertTrue(exception.getMessage().contains("100")); // Available = 500 - 400 = 100
            assertTrue(exception.getMessage().contains("150")); // Requested
        }
    }

    // ========================================================================
    // 8. QUERY OPERATIONS
    // ========================================================================

    @Nested
    @DisplayName("8. Query Operations Tests")
    class QueryOperationsTests {

        @Test
        @DisplayName("8.1 Should return empty list for batch with no allocations")
        void getBatchAllocations_None_ReturnsEmpty() {
            // Arrange
            when(allocationRepository.findByBatchWithOrderDetails(1L)).thenReturn(List.of());

            // Act
            List<BatchOrderAllocation> result = allocationService.getBatchAllocations(1L);

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("8.2 Should return multiple allocations for batch")
        void getBatchAllocations_Multiple_ReturnsAll() {
            // Arrange
            BatchOrderAllocation alloc1 = BatchOrderAllocation.builder()
                    .allocationId(1L)
                    .batch(testBatch)
                    .orderLineItem(testOrderLine)
                    .allocatedQty(new BigDecimal("100.00"))
                    .status(BatchOrderAllocation.STATUS_ALLOCATED)
                    .build();

            BatchOrderAllocation alloc2 = BatchOrderAllocation.builder()
                    .allocationId(2L)
                    .batch(testBatch)
                    .orderLineItem(OrderLineItem.builder().orderLineId(2L).order(testOrder).build())
                    .allocatedQty(new BigDecimal("200.00"))
                    .status(BatchOrderAllocation.STATUS_ALLOCATED)
                    .build();

            when(allocationRepository.findByBatchWithOrderDetails(1L)).thenReturn(List.of(alloc1, alloc2));

            // Act
            List<BatchOrderAllocation> result = allocationService.getBatchAllocations(1L);

            // Assert
            assertEquals(2, result.size());
        }

        @Test
        @DisplayName("8.3 Should filter active allocations only")
        void getActiveAllocations_FiltersReleased() {
            // Arrange
            when(allocationRepository.findByBatch_BatchIdAndStatus(1L, BatchOrderAllocation.STATUS_ALLOCATED))
                    .thenReturn(List.of(testAllocation));

            // Act
            List<BatchOrderAllocation> result = allocationService.getActiveBatchAllocations(1L);

            // Assert
            assertEquals(1, result.size());
            assertEquals(BatchOrderAllocation.STATUS_ALLOCATED, result.get(0).getStatus());
        }

        @Test
        @DisplayName("8.4 Should get total allocated for batch")
        void getTotalAllocated_ReturnsSum() {
            // Arrange
            when(allocationRepository.getTotalAllocatedQtyForBatch(1L)).thenReturn(new BigDecimal("350.00"));

            // Act
            BigDecimal total = allocationService.getTotalAllocatedForBatch(1L);

            // Assert
            assertEquals(new BigDecimal("350.00"), total);
        }

        @Test
        @DisplayName("8.5 Should get allocations for order line")
        void getOrderLineAllocations_ReturnsAllocations() {
            // Arrange
            when(allocationRepository.findByOrderLineWithBatchDetails(1L)).thenReturn(List.of(testAllocation));

            // Act
            List<BatchOrderAllocation> result = allocationService.getOrderLineAllocations(1L);

            // Assert
            assertEquals(1, result.size());
            assertEquals(1L, result.get(0).getOrderLineItem().getOrderLineId());
        }
    }
}
