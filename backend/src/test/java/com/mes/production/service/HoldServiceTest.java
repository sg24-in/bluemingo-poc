package com.mes.production.service;

import com.mes.production.dto.HoldDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.entity.*;
import com.mes.production.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HoldServiceTest {

    @Mock
    private HoldRecordRepository holdRecordRepository;

    @Mock
    private OperationRepository operationRepository;

    @Mock
    private ProcessRepository processRepository;

    @Mock
    private OrderLineItemRepository orderLineItemRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private BatchRepository batchRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @InjectMocks
    private HoldService holdService;

    private Operation testOperation;
    private HoldRecord testHoldRecord;

    @BeforeEach
    void setUp() {
        testOperation = Operation.builder()
                .operationId(1L)
                .operationName("Test Operation")
                .status("READY")
                .build();

        testHoldRecord = HoldRecord.builder()
                .holdId(1L)
                .entityType("OPERATION")
                .entityId(1L)
                .reason("Equipment Breakdown")
                .comments("Test comments")
                .appliedBy("test-user")
                .appliedOn(LocalDateTime.now())
                .status("ACTIVE")
                .build();
    }

    @Test
    @DisplayName("Should apply hold successfully")
    void applyHold_ValidRequest_Success() {
        // Arrange
        HoldDTO.ApplyHoldRequest request = HoldDTO.ApplyHoldRequest.builder()
                .entityType("OPERATION")
                .entityId(1L)
                .reason("Equipment Breakdown")
                .comments("Test hold")
                .build();

        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("OPERATION", 1L, "ACTIVE")).thenReturn(false);
        when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
        when(holdRecordRepository.save(any(HoldRecord.class))).thenAnswer(i -> {
            HoldRecord h = i.getArgument(0);
            h.setHoldId(1L);
            return h;
        });
        when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        HoldDTO.HoldResponse response = holdService.applyHold(request, "test-user");

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getHoldId());
        assertEquals("OPERATION", response.getEntityType());
        assertEquals("Equipment Breakdown", response.getReason());
        assertEquals("ACTIVE", response.getStatus());

        verify(holdRecordRepository, times(1)).save(any(HoldRecord.class));
        verify(operationRepository, times(1)).save(any(Operation.class));
    }

    @Test
    @DisplayName("Should throw exception when entity is already on hold")
    void applyHold_AlreadyOnHold_ThrowsException() {
        // Arrange
        HoldDTO.ApplyHoldRequest request = HoldDTO.ApplyHoldRequest.builder()
                .entityType("OPERATION")
                .entityId(1L)
                .reason("Equipment Breakdown")
                .build();

        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("OPERATION", 1L, "ACTIVE")).thenReturn(true);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> holdService.applyHold(request, "test-user"));

        assertTrue(exception.getMessage().contains("already on hold"));
    }

    @Test
    @DisplayName("Should release hold successfully")
    void releaseHold_ValidRequest_Success() {
        // Arrange
        HoldDTO.ReleaseHoldRequest request = HoldDTO.ReleaseHoldRequest.builder()
                .releaseComments("Issue resolved")
                .build();

        when(holdRecordRepository.findById(1L)).thenReturn(Optional.of(testHoldRecord));
        when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
        when(holdRecordRepository.save(any(HoldRecord.class))).thenAnswer(i -> i.getArgument(0));
        when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        HoldDTO.HoldResponse response = holdService.releaseHold(1L, request, "test-user");

        // Assert
        assertNotNull(response);
        assertEquals("RELEASED", response.getStatus());
        assertEquals("Issue resolved", response.getReleaseComments());

        verify(holdRecordRepository, times(1)).save(any(HoldRecord.class));
    }

    @Test
    @DisplayName("Should throw exception when releasing non-active hold")
    void releaseHold_NotActive_ThrowsException() {
        // Arrange
        testHoldRecord.setStatus("RELEASED");
        when(holdRecordRepository.findById(1L)).thenReturn(Optional.of(testHoldRecord));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> holdService.releaseHold(1L, null, "test-user"));

        assertTrue(exception.getMessage().contains("not active"));
    }

    @Test
    @DisplayName("Should throw exception when hold not found")
    void releaseHold_NotFound_ThrowsException() {
        // Arrange
        when(holdRecordRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> holdService.releaseHold(999L, null, "test-user"));
    }

    @Test
    @DisplayName("Should return true when entity is on hold")
    void isEntityOnHold_ActiveHold_ReturnsTrue() {
        // Arrange
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("OPERATION", 1L, "ACTIVE")).thenReturn(true);

        // Act
        boolean result = holdService.isEntityOnHold("OPERATION", 1L);

        // Assert
        assertTrue(result);
    }

    @Test
    @DisplayName("Should return false when entity is not on hold")
    void isEntityOnHold_NoActiveHold_ReturnsFalse() {
        // Arrange
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("OPERATION", 1L, "ACTIVE")).thenReturn(false);

        // Act
        boolean result = holdService.isEntityOnHold("OPERATION", 1L);

        // Assert
        assertFalse(result);
    }

    @Test
    @DisplayName("Should get active holds")
    void getActiveHolds_ReturnsHolds() {
        // Arrange
        when(holdRecordRepository.findActiveHoldsOrderByAppliedOnDesc()).thenReturn(List.of(testHoldRecord));
        when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));

        // Act
        List<HoldDTO.HoldResponse> result = holdService.getActiveHolds();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("OPERATION", result.get(0).getEntityType());
    }

    @Test
    @DisplayName("Should get active hold count")
    void getActiveHoldCount_ReturnsCount() {
        // Arrange
        when(holdRecordRepository.countByStatus("ACTIVE")).thenReturn(5L);

        // Act
        Long result = holdService.getActiveHoldCount();

        // Assert
        assertEquals(5L, result);
    }

    @Test
    @DisplayName("Should throw exception for invalid entity type")
    void applyHold_InvalidEntityType_ThrowsException() {
        // Arrange
        HoldDTO.ApplyHoldRequest request = HoldDTO.ApplyHoldRequest.builder()
                .entityType("INVALID_TYPE")
                .entityId(1L)
                .reason("Test")
                .build();

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> holdService.applyHold(request, "test-user"));

        assertTrue(exception.getMessage().contains("Invalid entity type"));
    }

    // ==================== NEW TESTS: Equipment Hold (R-07) ====================

    @Nested
    @DisplayName("Equipment Hold Tests (R-07)")
    class EquipmentHoldTests {

        private Equipment testEquipment;

        @BeforeEach
        void setUp() {
            testEquipment = Equipment.builder()
                    .equipmentId(10L)
                    .equipmentCode("EQ-FURN-001")
                    .name("Electric Arc Furnace")
                    .equipmentType("BATCH")
                    .status("AVAILABLE")
                    .build();
        }

        @Test
        @DisplayName("Should apply hold to EQUIPMENT entity type")
        void applyHold_EquipmentEntity_Success() {
            // Arrange
            HoldDTO.ApplyHoldRequest request = HoldDTO.ApplyHoldRequest.builder()
                    .entityType("EQUIPMENT")
                    .entityId(10L)
                    .reason("Safety inspection required")
                    .comments("Annual safety check")
                    .build();

            when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("EQUIPMENT", 10L, "ACTIVE")).thenReturn(false);
            when(equipmentRepository.findById(10L)).thenReturn(Optional.of(testEquipment));
            when(holdRecordRepository.save(any(HoldRecord.class))).thenAnswer(i -> {
                HoldRecord h = i.getArgument(0);
                h.setHoldId(2L);
                return h;
            });
            when(equipmentRepository.save(any(Equipment.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            HoldDTO.HoldResponse response = holdService.applyHold(request, "safety-officer");

            // Assert
            assertNotNull(response);
            assertEquals(2L, response.getHoldId());
            assertEquals("EQUIPMENT", response.getEntityType());
            assertEquals("Safety inspection required", response.getReason());
            assertEquals("ACTIVE", response.getStatus());
            assertTrue(response.getEntityName().contains("EQ-FURN-001"));

            verify(holdRecordRepository, times(1)).save(any(HoldRecord.class));
            verify(equipmentRepository, times(1)).save(any(Equipment.class));
        }

        @Test
        @DisplayName("Should release EQUIPMENT hold and restore AVAILABLE status")
        void releaseHold_EquipmentEntity_RestoresAvailable() {
            // Arrange
            HoldRecord equipmentHold = HoldRecord.builder()
                    .holdId(2L)
                    .entityType("EQUIPMENT")
                    .entityId(10L)
                    .reason("Safety inspection")
                    .appliedBy("safety-officer")
                    .appliedOn(LocalDateTime.now().minusHours(2))
                    .status("ACTIVE")
                    .build();

            HoldDTO.ReleaseHoldRequest request = HoldDTO.ReleaseHoldRequest.builder()
                    .releaseComments("Inspection passed")
                    .build();

            when(holdRecordRepository.findById(2L)).thenReturn(Optional.of(equipmentHold));
            when(equipmentRepository.findById(10L)).thenReturn(Optional.of(testEquipment));
            when(holdRecordRepository.save(any(HoldRecord.class))).thenAnswer(i -> i.getArgument(0));
            when(equipmentRepository.save(any(Equipment.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            HoldDTO.HoldResponse response = holdService.releaseHold(2L, request, "safety-officer");

            // Assert
            assertEquals("RELEASED", response.getStatus());
            assertEquals("Inspection passed", response.getReleaseComments());
            verify(equipmentRepository, times(1)).save(argThat(eq ->
                    "AVAILABLE".equals(eq.getStatus())));
        }
    }

    // ==================== NEW TESTS: Order Hold (R-09) ====================

    @Nested
    @DisplayName("Order Hold Tests (R-09)")
    class OrderHoldTests {

        private Order testOrder;
        private OrderLineItem testLineItem;
        private Operation readyOp;
        private Operation inProgressOp;
        private Operation confirmedOp;

        @BeforeEach
        void setUp() {
            readyOp = Operation.builder()
                    .operationId(101L)
                    .operationName("Melting")
                    .status("READY")
                    .build();

            inProgressOp = Operation.builder()
                    .operationId(102L)
                    .operationName("Casting")
                    .status("IN_PROGRESS")
                    .build();

            confirmedOp = Operation.builder()
                    .operationId(103L)
                    .operationName("Rolling")
                    .status("CONFIRMED")
                    .build();

            testLineItem = OrderLineItem.builder()
                    .orderLineId(50L)
                    .productSku("PROD-001")
                    .productName("Steel Slab")
                    .status("CREATED")
                    .operations(List.of(readyOp, inProgressOp, confirmedOp))
                    .build();

            testOrder = Order.builder()
                    .orderId(20L)
                    .orderNumber("ORD-0020")
                    .customerName("Acme Corp")
                    .status("CREATED")
                    .lineItems(List.of(testLineItem))
                    .build();
        }

        @Test
        @DisplayName("Should apply hold to ORDER entity type")
        void applyHold_OrderEntity_Success() {
            // Arrange
            HoldDTO.ApplyHoldRequest request = HoldDTO.ApplyHoldRequest.builder()
                    .entityType("ORDER")
                    .entityId(20L)
                    .reason("Customer credit issue")
                    .comments("Payment pending")
                    .build();

            when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("ORDER", 20L, "ACTIVE")).thenReturn(false);
            when(orderRepository.findById(20L)).thenReturn(Optional.of(testOrder));
            when(holdRecordRepository.save(any(HoldRecord.class))).thenAnswer(i -> {
                HoldRecord h = i.getArgument(0);
                h.setHoldId(3L);
                return h;
            });
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));
            when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            HoldDTO.HoldResponse response = holdService.applyHold(request, "credit-manager");

            // Assert
            assertNotNull(response);
            assertEquals("ORDER", response.getEntityType());
            assertEquals("Customer credit issue", response.getReason());
            assertEquals("ACTIVE", response.getStatus());
            assertTrue(response.getEntityName().contains("ORD-0020"));

            verify(orderRepository, times(1)).save(any(Order.class));
        }

        @Test
        @DisplayName("Should cascade hold to READY and IN_PROGRESS operations when order is held (R-09)")
        void applyHold_OrderEntity_CascadesToOperations() {
            // Arrange
            HoldDTO.ApplyHoldRequest request = HoldDTO.ApplyHoldRequest.builder()
                    .entityType("ORDER")
                    .entityId(20L)
                    .reason("Customer credit issue")
                    .build();

            when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("ORDER", 20L, "ACTIVE")).thenReturn(false);
            when(orderRepository.findById(20L)).thenReturn(Optional.of(testOrder));
            when(holdRecordRepository.save(any(HoldRecord.class))).thenAnswer(i -> {
                HoldRecord h = i.getArgument(0);
                h.setHoldId(3L);
                return h;
            });
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));
            when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            holdService.applyHold(request, "credit-manager");

            // Assert - READY and IN_PROGRESS operations should be cascaded to ON_HOLD
            assertEquals("ON_HOLD", readyOp.getStatus());
            assertEquals("ON_HOLD", inProgressOp.getStatus());
            // CONFIRMED operation should NOT be affected
            assertEquals("CONFIRMED", confirmedOp.getStatus());

            // 2 operations cascaded (READY + IN_PROGRESS)
            verify(operationRepository, times(2)).save(any(Operation.class));
        }

        @Test
        @DisplayName("Should cascade release to ON_HOLD operations when order is released (R-09)")
        void releaseHold_OrderEntity_CascadesToOperations() {
            // Arrange - set operations to ON_HOLD state (as if hold was cascaded)
            readyOp.setStatus("ON_HOLD");
            inProgressOp.setStatus("ON_HOLD");

            HoldRecord orderHold = HoldRecord.builder()
                    .holdId(3L)
                    .entityType("ORDER")
                    .entityId(20L)
                    .reason("Customer credit issue")
                    .appliedBy("credit-manager")
                    .appliedOn(LocalDateTime.now().minusHours(1))
                    .status("ACTIVE")
                    .build();

            HoldDTO.ReleaseHoldRequest request = HoldDTO.ReleaseHoldRequest.builder()
                    .releaseComments("Payment received")
                    .build();

            when(holdRecordRepository.findById(3L)).thenReturn(Optional.of(orderHold));
            when(orderRepository.findById(20L)).thenReturn(Optional.of(testOrder));
            when(holdRecordRepository.save(any(HoldRecord.class))).thenAnswer(i -> i.getArgument(0));
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));
            when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            HoldDTO.HoldResponse response = holdService.releaseHold(3L, request, "credit-manager");

            // Assert - ON_HOLD operations should be restored to READY
            assertEquals("RELEASED", response.getStatus());
            assertEquals("READY", readyOp.getStatus());
            assertEquals("READY", inProgressOp.getStatus());
            // CONFIRMED remains unchanged
            assertEquals("CONFIRMED", confirmedOp.getStatus());

            verify(operationRepository, times(2)).save(any(Operation.class));
        }

        @Test
        @DisplayName("Should release ORDER hold and restore CREATED status")
        void releaseHold_OrderEntity_RestoresCreated() {
            // Arrange - order with no line items to keep test focused on status
            Order simpleOrder = Order.builder()
                    .orderId(21L)
                    .orderNumber("ORD-0021")
                    .customerName("Simple Corp")
                    .status("ON_HOLD")
                    .lineItems(null)
                    .build();

            HoldRecord orderHold = HoldRecord.builder()
                    .holdId(4L)
                    .entityType("ORDER")
                    .entityId(21L)
                    .reason("Review required")
                    .appliedBy("admin")
                    .appliedOn(LocalDateTime.now().minusMinutes(30))
                    .status("ACTIVE")
                    .build();

            HoldDTO.ReleaseHoldRequest request = HoldDTO.ReleaseHoldRequest.builder()
                    .releaseComments("Review completed")
                    .build();

            when(holdRecordRepository.findById(4L)).thenReturn(Optional.of(orderHold));
            when(orderRepository.findById(21L)).thenReturn(Optional.of(simpleOrder));
            when(holdRecordRepository.save(any(HoldRecord.class))).thenAnswer(i -> i.getArgument(0));
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            HoldDTO.HoldResponse response = holdService.releaseHold(4L, request, "admin");

            // Assert
            assertEquals("RELEASED", response.getStatus());
            verify(orderRepository, times(1)).save(argThat(o ->
                    "CREATED".equals(o.getStatus())));
        }
    }

    // ==================== NEW TESTS: Release Status Restoration ====================

    @Nested
    @DisplayName("Release Hold Status Restoration Tests")
    class ReleaseStatusRestorationTests {

        @Test
        @DisplayName("Should restore READY status for OPERATION on release")
        void releaseHold_OperationEntity_RestoresReady() {
            // Arrange
            HoldRecord opHold = HoldRecord.builder()
                    .holdId(10L)
                    .entityType("OPERATION")
                    .entityId(1L)
                    .reason("Quality issue")
                    .appliedBy("inspector")
                    .appliedOn(LocalDateTime.now().minusHours(1))
                    .status("ACTIVE")
                    .build();

            testOperation.setStatus("ON_HOLD");

            when(holdRecordRepository.findById(10L)).thenReturn(Optional.of(opHold));
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
            when(holdRecordRepository.save(any(HoldRecord.class))).thenAnswer(i -> i.getArgument(0));
            when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            holdService.releaseHold(10L, null, "inspector");

            // Assert
            verify(operationRepository, times(1)).save(argThat(op ->
                    "READY".equals(op.getStatus())));
        }

        @Test
        @DisplayName("Should restore AVAILABLE status for INVENTORY on release")
        void releaseHold_InventoryEntity_RestoresAvailable() {
            // Arrange
            Inventory testInventory = Inventory.builder()
                    .inventoryId(30L)
                    .materialId("MAT-001")
                    .materialName("Steel Scrap")
                    .state("ON_HOLD")
                    .build();

            HoldRecord invHold = HoldRecord.builder()
                    .holdId(11L)
                    .entityType("INVENTORY")
                    .entityId(30L)
                    .reason("Contamination risk")
                    .appliedBy("lab-tech")
                    .appliedOn(LocalDateTime.now().minusMinutes(45))
                    .status("ACTIVE")
                    .build();

            when(holdRecordRepository.findById(11L)).thenReturn(Optional.of(invHold));
            when(inventoryRepository.findById(30L)).thenReturn(Optional.of(testInventory));
            when(holdRecordRepository.save(any(HoldRecord.class))).thenAnswer(i -> i.getArgument(0));
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            holdService.releaseHold(11L, null, "lab-tech");

            // Assert
            verify(inventoryRepository, times(1)).save(argThat(inv ->
                    "AVAILABLE".equals(inv.getState())));
        }

        @Test
        @DisplayName("Should restore AVAILABLE status for BATCH on release")
        void releaseHold_BatchEntity_RestoresAvailable() {
            // Arrange
            Batch testBatch = Batch.builder()
                    .batchId(40L)
                    .batchNumber("BATCH-2026-001")
                    .materialId("MAT-002")
                    .status("ON_HOLD")
                    .build();

            HoldRecord batchHold = HoldRecord.builder()
                    .holdId(12L)
                    .entityType("BATCH")
                    .entityId(40L)
                    .reason("Lab test pending")
                    .appliedBy("qa-lead")
                    .appliedOn(LocalDateTime.now().minusMinutes(20))
                    .status("ACTIVE")
                    .build();

            when(holdRecordRepository.findById(12L)).thenReturn(Optional.of(batchHold));
            when(batchRepository.findById(40L)).thenReturn(Optional.of(testBatch));
            when(holdRecordRepository.save(any(HoldRecord.class))).thenAnswer(i -> i.getArgument(0));
            when(batchRepository.save(any(Batch.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            holdService.releaseHold(12L, null, "qa-lead");

            // Assert
            verify(batchRepository, times(1)).save(argThat(b ->
                    "AVAILABLE".equals(b.getStatus())));
        }
    }

    // ==================== NEW TESTS: Duplicate Hold ====================

    @Test
    @DisplayName("Should throw error for duplicate hold on EQUIPMENT")
    void applyHold_DuplicateEquipmentHold_ThrowsException() {
        // Arrange
        HoldDTO.ApplyHoldRequest request = HoldDTO.ApplyHoldRequest.builder()
                .entityType("EQUIPMENT")
                .entityId(10L)
                .reason("Second hold attempt")
                .build();

        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("EQUIPMENT", 10L, "ACTIVE")).thenReturn(true);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> holdService.applyHold(request, "test-user"));

        assertTrue(exception.getMessage().contains("already on hold"));
        verify(holdRecordRepository, never()).save(any(HoldRecord.class));
    }

    @Test
    @DisplayName("Should throw error for duplicate hold on BATCH")
    void applyHold_DuplicateBatchHold_ThrowsException() {
        // Arrange
        HoldDTO.ApplyHoldRequest request = HoldDTO.ApplyHoldRequest.builder()
                .entityType("BATCH")
                .entityId(40L)
                .reason("Second hold attempt")
                .build();

        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("BATCH", 40L, "ACTIVE")).thenReturn(true);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> holdService.applyHold(request, "test-user"));

        assertTrue(exception.getMessage().contains("already on hold"));
    }

    // ==================== NEW TESTS: getEntityName ====================

    @Nested
    @DisplayName("getEntityName Tests")
    class GetEntityNameTests {

        @Test
        @DisplayName("Should return correct entity name for EQUIPMENT")
        void getActiveHolds_EquipmentEntity_ReturnsEquipmentName() {
            // Arrange
            Equipment equipment = Equipment.builder()
                    .equipmentId(10L)
                    .equipmentCode("EQ-CAST-002")
                    .name("Continuous Caster")
                    .status("ON_HOLD")
                    .build();

            HoldRecord equipHold = HoldRecord.builder()
                    .holdId(5L)
                    .entityType("EQUIPMENT")
                    .entityId(10L)
                    .reason("Maintenance")
                    .appliedBy("maint-mgr")
                    .appliedOn(LocalDateTime.now())
                    .status("ACTIVE")
                    .build();

            when(holdRecordRepository.findActiveHoldsOrderByAppliedOnDesc()).thenReturn(List.of(equipHold));
            when(equipmentRepository.findById(10L)).thenReturn(Optional.of(equipment));

            // Act
            List<HoldDTO.HoldResponse> results = holdService.getActiveHolds();

            // Assert
            assertEquals(1, results.size());
            assertEquals("EQ-CAST-002 - Continuous Caster", results.get(0).getEntityName());
        }

        @Test
        @DisplayName("Should return correct entity name for BATCH")
        void getActiveHolds_BatchEntity_ReturnsBatchNumber() {
            // Arrange
            Batch batch = Batch.builder()
                    .batchId(40L)
                    .batchNumber("BATCH-2026-042")
                    .build();

            HoldRecord batchHold = HoldRecord.builder()
                    .holdId(6L)
                    .entityType("BATCH")
                    .entityId(40L)
                    .reason("Quality check")
                    .appliedBy("qa")
                    .appliedOn(LocalDateTime.now())
                    .status("ACTIVE")
                    .build();

            when(holdRecordRepository.findActiveHoldsOrderByAppliedOnDesc()).thenReturn(List.of(batchHold));
            when(batchRepository.findById(40L)).thenReturn(Optional.of(batch));

            // Act
            List<HoldDTO.HoldResponse> results = holdService.getActiveHolds();

            // Assert
            assertEquals("BATCH-2026-042", results.get(0).getEntityName());
        }

        @Test
        @DisplayName("Should return correct entity name for INVENTORY")
        void getActiveHolds_InventoryEntity_ReturnsMaterialInfo() {
            // Arrange
            Inventory inventory = Inventory.builder()
                    .inventoryId(30L)
                    .materialId("MAT-SCRAP-01")
                    .materialName("Steel Scrap Grade A")
                    .build();

            HoldRecord invHold = HoldRecord.builder()
                    .holdId(7L)
                    .entityType("INVENTORY")
                    .entityId(30L)
                    .reason("Spec mismatch")
                    .appliedBy("inspector")
                    .appliedOn(LocalDateTime.now())
                    .status("ACTIVE")
                    .build();

            when(holdRecordRepository.findActiveHoldsOrderByAppliedOnDesc()).thenReturn(List.of(invHold));
            when(inventoryRepository.findById(30L)).thenReturn(Optional.of(inventory));

            // Act
            List<HoldDTO.HoldResponse> results = holdService.getActiveHolds();

            // Assert
            assertEquals("MAT-SCRAP-01 - Steel Scrap Grade A", results.get(0).getEntityName());
        }

        @Test
        @DisplayName("Should return 'Unknown' prefix when entity not found")
        void getActiveHolds_EntityNotFound_ReturnsUnknown() {
            // Arrange
            HoldRecord orphanHold = HoldRecord.builder()
                    .holdId(8L)
                    .entityType("EQUIPMENT")
                    .entityId(999L)
                    .reason("Some reason")
                    .appliedBy("user")
                    .appliedOn(LocalDateTime.now())
                    .status("ACTIVE")
                    .build();

            when(holdRecordRepository.findActiveHoldsOrderByAppliedOnDesc()).thenReturn(List.of(orphanHold));
            when(equipmentRepository.findById(999L)).thenReturn(Optional.empty());

            // Act
            List<HoldDTO.HoldResponse> results = holdService.getActiveHolds();

            // Assert
            assertEquals("Unknown Equipment", results.get(0).getEntityName());
        }
    }

    // ==================== NEW TESTS: getEntityStatus ====================

    @Test
    @DisplayName("Should get correct entity status for INVENTORY")
    void applyHold_InventoryEntity_CapturesPreviousStatus() {
        // Arrange
        Inventory inventory = Inventory.builder()
                .inventoryId(30L)
                .materialId("MAT-001")
                .materialName("Steel Scrap")
                .state("AVAILABLE")
                .build();

        HoldDTO.ApplyHoldRequest request = HoldDTO.ApplyHoldRequest.builder()
                .entityType("INVENTORY")
                .entityId(30L)
                .reason("Quality concern")
                .build();

        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("INVENTORY", 30L, "ACTIVE")).thenReturn(false);
        when(inventoryRepository.findById(30L)).thenReturn(Optional.of(inventory));
        when(holdRecordRepository.save(any(HoldRecord.class))).thenAnswer(i -> {
            HoldRecord h = i.getArgument(0);
            h.setHoldId(13L);
            return h;
        });
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        HoldDTO.HoldResponse response = holdService.applyHold(request, "qa-user");

        // Assert
        assertNotNull(response);
        assertEquals("INVENTORY", response.getEntityType());
        verify(inventoryRepository, times(1)).save(any(Inventory.class));
    }

    @Test
    @DisplayName("Should throw when entity not found during status check for BATCH")
    void applyHold_BatchNotFound_ThrowsException() {
        // Arrange
        HoldDTO.ApplyHoldRequest request = HoldDTO.ApplyHoldRequest.builder()
                .entityType("BATCH")
                .entityId(999L)
                .reason("Test")
                .build();

        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("BATCH", 999L, "ACTIVE")).thenReturn(false);
        when(batchRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> holdService.applyHold(request, "test-user"));

        assertTrue(exception.getMessage().contains("not found"));
    }

    // ==================== NEW TESTS: Pagination ====================

    @Nested
    @DisplayName("Holds Pagination Tests")
    class HoldsPaginationTests {

        @Test
        @DisplayName("Should return paged holds without filters")
        void getHoldsPaged_NoFilters_ReturnsAll() {
            // Arrange
            PageRequestDTO pageRequest = PageRequestDTO.builder()
                    .page(0)
                    .size(10)
                    .sortDirection("DESC")
                    .build();

            HoldRecord hold1 = HoldRecord.builder()
                    .holdId(1L).entityType("OPERATION").entityId(1L)
                    .reason("Test 1").appliedBy("user1")
                    .appliedOn(LocalDateTime.now()).status("ACTIVE").build();
            HoldRecord hold2 = HoldRecord.builder()
                    .holdId(2L).entityType("BATCH").entityId(2L)
                    .reason("Test 2").appliedBy("user2")
                    .appliedOn(LocalDateTime.now()).status("ACTIVE").build();

            Page<HoldRecord> page = new PageImpl<>(List.of(hold1, hold2));
            when(holdRecordRepository.findAll(any(Pageable.class))).thenReturn(page);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
            when(batchRepository.findById(2L)).thenReturn(Optional.of(
                    Batch.builder().batchId(2L).batchNumber("BATCH-001").build()));

            // Act
            PagedResponseDTO<HoldDTO.HoldResponse> result = holdService.getHoldsPaged(pageRequest);

            // Assert
            assertNotNull(result);
            assertEquals(2, result.getContent().size());
            verify(holdRecordRepository, times(1)).findAll(any(Pageable.class));
        }

        @Test
        @DisplayName("Should return paged holds with status filter")
        void getHoldsPaged_WithStatusFilter_ReturnsFiltered() {
            // Arrange
            PageRequestDTO pageRequest = PageRequestDTO.builder()
                    .page(0)
                    .size(10)
                    .status("ACTIVE")
                    .build();

            HoldRecord activeHold = HoldRecord.builder()
                    .holdId(1L).entityType("OPERATION").entityId(1L)
                    .reason("Active hold").appliedBy("user1")
                    .appliedOn(LocalDateTime.now()).status("ACTIVE").build();

            Page<HoldRecord> page = new PageImpl<>(List.of(activeHold));
            when(holdRecordRepository.findByFilters(eq("ACTIVE"), isNull(), isNull(), any(Pageable.class)))
                    .thenReturn(page);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));

            // Act
            PagedResponseDTO<HoldDTO.HoldResponse> result = holdService.getHoldsPaged(pageRequest);

            // Assert
            assertNotNull(result);
            assertEquals(1, result.getContent().size());
            assertEquals("ACTIVE", result.getContent().get(0).getStatus());
            verify(holdRecordRepository, times(1)).findByFilters(anyString(), any(), any(), any(Pageable.class));
        }

        @Test
        @DisplayName("Should return paged holds with entity type filter")
        void getHoldsPaged_WithTypeFilter_ReturnsFiltered() {
            // Arrange
            PageRequestDTO pageRequest = PageRequestDTO.builder()
                    .page(0)
                    .size(10)
                    .type("EQUIPMENT")
                    .build();

            Equipment equipment = Equipment.builder()
                    .equipmentId(10L).equipmentCode("EQ-001").name("Furnace").build();

            HoldRecord equipHold = HoldRecord.builder()
                    .holdId(5L).entityType("EQUIPMENT").entityId(10L)
                    .reason("Maintenance").appliedBy("admin")
                    .appliedOn(LocalDateTime.now()).status("ACTIVE").build();

            Page<HoldRecord> page = new PageImpl<>(List.of(equipHold));
            when(holdRecordRepository.findByFilters(isNull(), eq("EQUIPMENT"), isNull(), any(Pageable.class)))
                    .thenReturn(page);
            when(equipmentRepository.findById(10L)).thenReturn(Optional.of(equipment));

            // Act
            PagedResponseDTO<HoldDTO.HoldResponse> result = holdService.getHoldsPaged(pageRequest);

            // Assert
            assertNotNull(result);
            assertEquals(1, result.getContent().size());
            assertEquals("EQUIPMENT", result.getContent().get(0).getEntityType());
        }
    }

    // ==================== NEW TESTS: Active Hold Count ====================

    @Test
    @DisplayName("Should return zero when no active holds")
    void getActiveHoldCount_NoActiveHolds_ReturnsZero() {
        // Arrange
        when(holdRecordRepository.countByStatus("ACTIVE")).thenReturn(0L);

        // Act
        Long result = holdService.getActiveHoldCount();

        // Assert
        assertEquals(0L, result);
    }

    // ==================== NEW TESTS: Apply Hold to BATCH ====================

    @Test
    @DisplayName("Should apply hold to BATCH entity type")
    void applyHold_BatchEntity_Success() {
        // Arrange
        Batch testBatch = Batch.builder()
                .batchId(40L)
                .batchNumber("BATCH-2026-099")
                .materialId("MAT-003")
                .status("AVAILABLE")
                .build();

        HoldDTO.ApplyHoldRequest request = HoldDTO.ApplyHoldRequest.builder()
                .entityType("BATCH")
                .entityId(40L)
                .reason("Lab test results pending")
                .comments("Waiting for chemical analysis")
                .build();

        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("BATCH", 40L, "ACTIVE")).thenReturn(false);
        when(batchRepository.findById(40L)).thenReturn(Optional.of(testBatch));
        when(holdRecordRepository.save(any(HoldRecord.class))).thenAnswer(i -> {
            HoldRecord h = i.getArgument(0);
            h.setHoldId(14L);
            return h;
        });
        when(batchRepository.save(any(Batch.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        HoldDTO.HoldResponse response = holdService.applyHold(request, "lab-tech");

        // Assert
        assertNotNull(response);
        assertEquals("BATCH", response.getEntityType());
        assertEquals("Lab test results pending", response.getReason());
        assertEquals("BATCH-2026-099", response.getEntityName());
        verify(batchRepository, times(1)).save(argThat(b ->
                "ON_HOLD".equals(b.getStatus())));
    }
}
