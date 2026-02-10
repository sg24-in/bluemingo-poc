package com.mes.production.service;

import com.mes.production.dto.BomDTO;
import com.mes.production.dto.ProductionConfirmationDTO;
import com.mes.production.entity.*;
import com.mes.production.entity.Process;
import com.mes.production.entity.ProcessStatus;
import com.mes.production.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ProductionServiceTest {

    @Mock
    private OperationRepository operationRepository;

    @Mock
    private ProcessRepository processRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private BatchRepository batchRepository;

    @Mock
    private BatchRelationRepository batchRelationRepository;

    @Mock
    private ProductionConfirmationRepository confirmationRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private OperatorRepository operatorRepository;

    @Mock
    private HoldRecordRepository holdRecordRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private EquipmentUsageService equipmentUsageService;

    @Mock
    private InventoryMovementService inventoryMovementService;

    @Mock
    private ProcessParameterService processParameterService;

    @Mock
    private BatchNumberService batchNumberService;

    @Mock
    private InventoryStateValidator inventoryStateValidator;

    @Mock
    private BatchSizeService batchSizeService;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private BomValidationService bomValidationService;

    @InjectMocks
    private ProductionService productionService;

    private Operation testOperation;
    private Process testProcess;
    private OrderLineItem testOrderLine;
    private Order testOrder;
    private Inventory testInventory;
    private Batch testBatch;

    @BeforeEach
    void setUp() {
        // Set up security context
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("test-user");
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        // Create test data
        testOrder = Order.builder()
                .orderId(1L)
                .status("IN_PROGRESS")
                .build();

        testOrderLine = OrderLineItem.builder()
                .orderLineId(1L)
                .order(testOrder)
                .productSku("TEST-SKU")
                .productName("Test Product")
                .quantity(BigDecimal.valueOf(100))
                .build();
        testOrder.setLineItems(List.of(testOrderLine));

        // Process is design-time only (no OrderLineItem reference)
        testProcess = Process.builder()
                .processId(1L)
                .processName("Test Stage")
                .status(ProcessStatus.ACTIVE)
                .build();

        // Operation links to both Process (design-time) and OrderLineItem (runtime)
        testOperation = Operation.builder()
                .operationId(1L)
                .process(testProcess)
                .orderLineItem(testOrderLine)
                .operationName("Test Operation")
                .operationCode("OP001")
                .operationType("MELTING")
                .sequenceNumber(1)
                .status("READY")
                .build();
        testOrderLine.setOperations(List.of(testOperation));

        testBatch = Batch.builder()
                .batchId(1L)
                .batchNumber("BATCH-001")
                .materialId("RM-001")
                .materialName("Test Material")
                .quantity(BigDecimal.valueOf(50))
                .status("AVAILABLE")
                .build();

        testInventory = Inventory.builder()
                .inventoryId(1L)
                .materialId("RM-001")
                .materialName("Test Material")
                .inventoryType("RM")
                .state("AVAILABLE")
                .quantity(BigDecimal.valueOf(50))
                .batch(testBatch)
                .build();

        // Default batch size service mock - returns single batch (backward compatible)
        when(batchSizeService.calculateBatchSizes(any(), any(), any(), any(), any()))
                .thenAnswer(invocation -> {
                    BigDecimal qty = invocation.getArgument(0);
                    if (qty == null) qty = BigDecimal.ZERO;
                    return new BatchSizeService.BatchSizeResult(
                            List.of(qty),
                            1,
                            qty,
                            false,
                            null
                    );
                });

        // Default BOM validation mock - returns valid result (R-02)
        when(bomValidationService.validateConsumption(any(BomDTO.BomValidationRequest.class)))
                .thenReturn(BomDTO.BomValidationResult.builder()
                        .valid(true)
                        .productSku("TEST-SKU")
                        .requirementChecks(List.of())
                        .warnings(List.of())
                        .errors(List.of())
                        .build());

        // Default order repository mock for auto-complete check (R-08)
        when(orderRepository.findById(anyLong())).thenReturn(Optional.of(testOrder));
    }

    @Test
    @DisplayName("Should confirm production successfully with valid request")
    void confirmProduction_ValidRequest_Success() {
        // Arrange
        ProductionConfirmationDTO.Request request = ProductionConfirmationDTO.Request.builder()
                .operationId(1L)
                .materialsConsumed(List.of(
                        ProductionConfirmationDTO.MaterialConsumption.builder()
                                .batchId(1L)
                                .inventoryId(1L)
                                .quantity(BigDecimal.valueOf(30))
                                .build()
                ))
                .producedQty(BigDecimal.valueOf(25))
                .scrapQty(BigDecimal.valueOf(5))
                .startTime(LocalDateTime.now().minusHours(1))
                .endTime(LocalDateTime.now())
                .equipmentIds(List.of(1L))
                .operatorIds(List.of(1L))
                .build();

        when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("OPERATION", 1L, "ACTIVE")).thenReturn(false);
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("PROCESS", 1L, "ACTIVE")).thenReturn(false);
        when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("INVENTORY", 1L, "ACTIVE")).thenReturn(false);
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("BATCH", 1L, "ACTIVE")).thenReturn(false);
        when(batchRepository.findMaxSequenceByPrefix(anyString())).thenReturn(Optional.of(0));
        when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
            Batch b = i.getArgument(0);
            b.setBatchId(2L);
            return b;
        });
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(batchRelationRepository.save(any(BatchRelation.class))).thenAnswer(i -> i.getArgument(0));
        when(confirmationRepository.save(any(ProductionConfirmation.class))).thenAnswer(i -> {
            ProductionConfirmation pc = i.getArgument(0);
            pc.setConfirmationId(1L);
            pc.setCreatedOn(LocalDateTime.now());
            return pc;
        });
        when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));
        when(operationRepository.findNextOperation(anyLong(), anyInt())).thenReturn(Optional.empty());
        when(processRepository.save(any(Process.class))).thenAnswer(i -> i.getArgument(0));
        when(equipmentRepository.findAllById(anyList())).thenReturn(List.of());
        when(operatorRepository.findAllById(anyList())).thenReturn(List.of());
        when(batchNumberService.generateBatchNumber(anyString(), anyString())).thenReturn("BATCH-TEST-001");

        // Act
        ProductionConfirmationDTO.Response response = productionService.confirmProduction(request);

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getConfirmationId());
        assertEquals(BigDecimal.valueOf(25), response.getProducedQty());
        assertEquals("CONFIRMED", response.getStatus());

        verify(confirmationRepository, times(1)).save(any(ProductionConfirmation.class));
        verify(operationRepository, times(1)).save(any(Operation.class));
    }

    @Test
    @DisplayName("Should throw exception when operation is not in READY status")
    void confirmProduction_OperationNotReady_ThrowsException() {
        // Arrange
        testOperation.setStatus("CONFIRMED");
        when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));

        ProductionConfirmationDTO.Request request = ProductionConfirmationDTO.Request.builder()
                .operationId(1L)
                .materialsConsumed(List.of())
                .producedQty(BigDecimal.TEN)
                .startTime(LocalDateTime.now())
                .endTime(LocalDateTime.now())
                .build();

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> productionService.confirmProduction(request));

        assertTrue(exception.getMessage().contains("not in READY or IN_PROGRESS status"));
    }

    @Test
    @DisplayName("Should throw exception when operation is on hold")
    void confirmProduction_OperationOnHold_ThrowsException() {
        // Arrange
        when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("OPERATION", 1L, "ACTIVE")).thenReturn(true);

        ProductionConfirmationDTO.Request request = ProductionConfirmationDTO.Request.builder()
                .operationId(1L)
                .materialsConsumed(List.of())
                .producedQty(BigDecimal.TEN)
                .startTime(LocalDateTime.now())
                .endTime(LocalDateTime.now())
                .build();

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> productionService.confirmProduction(request));

        assertTrue(exception.getMessage().contains("on hold"));
    }

    @Test
    @DisplayName("Should throw exception when inventory is not available")
    void confirmProduction_InsufficientInventory_ThrowsException() {
        // Arrange
        testInventory.setState("CONSUMED");
        when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("OPERATION", 1L, "ACTIVE")).thenReturn(false);
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("PROCESS", 1L, "ACTIVE")).thenReturn(false);
        when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
        doThrow(new IllegalStateException("Inventory is not available for consumption"))
                .when(inventoryStateValidator).validateConsumption(any(Inventory.class), any());

        ProductionConfirmationDTO.Request request = ProductionConfirmationDTO.Request.builder()
                .operationId(1L)
                .materialsConsumed(List.of(
                        ProductionConfirmationDTO.MaterialConsumption.builder()
                                .batchId(1L)
                                .inventoryId(1L)
                                .quantity(BigDecimal.valueOf(30))
                                .build()
                ))
                .producedQty(BigDecimal.TEN)
                .startTime(LocalDateTime.now())
                .endTime(LocalDateTime.now())
                .build();

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> productionService.confirmProduction(request));

        assertTrue(exception.getMessage().contains("not available"));
    }

    @Test
    @DisplayName("Should throw exception when operation not found")
    void confirmProduction_OperationNotFound_ThrowsException() {
        // Arrange
        when(operationRepository.findByIdWithDetails(999L)).thenReturn(Optional.empty());

        ProductionConfirmationDTO.Request request = ProductionConfirmationDTO.Request.builder()
                .operationId(999L)
                .materialsConsumed(List.of())
                .producedQty(BigDecimal.TEN)
                .startTime(LocalDateTime.now())
                .endTime(LocalDateTime.now())
                .build();

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> productionService.confirmProduction(request));

        assertTrue(exception.getMessage().contains("not found"));
    }

    @Test
    @DisplayName("Should get operation details successfully")
    void getOperationDetails_ValidId_ReturnsOperation() {
        // Arrange
        when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));

        // Act
        Operation result = productionService.getOperationDetails(1L);

        // Assert
        assertNotNull(result);
        assertEquals("Test Operation", result.getOperationName());
        assertEquals("READY", result.getStatus());
    }

    @Test
    @DisplayName("Should throw exception when getting non-existent operation")
    void getOperationDetails_InvalidId_ThrowsException() {
        // Arrange
        when(operationRepository.findByIdWithDetails(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> productionService.getOperationDetails(999L));
    }

    @Test
    @DisplayName("Should reject confirmation successfully")
    void rejectConfirmation_ValidRequest_Success() {
        // Arrange
        ProductionConfirmation confirmation = ProductionConfirmation.builder()
                .confirmationId(1L)
                .operation(testOperation)
                .producedQty(BigDecimal.valueOf(25))
                .status(ProductionConfirmation.STATUS_CONFIRMED)
                .createdOn(LocalDateTime.now())
                .build();

        when(confirmationRepository.findById(1L)).thenReturn(Optional.of(confirmation));
        when(confirmationRepository.save(any(ProductionConfirmation.class))).thenAnswer(i -> {
            ProductionConfirmation pc = i.getArgument(0);
            pc.setUpdatedOn(LocalDateTime.now());
            return pc;
        });

        ProductionConfirmationDTO.RejectionRequest request = ProductionConfirmationDTO.RejectionRequest.builder()
                .confirmationId(1L)
                .reason("Quality defects found")
                .notes("Additional notes")
                .build();

        // Act
        ProductionConfirmationDTO.StatusUpdateResponse response = productionService.rejectConfirmation(request);

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getConfirmationId());
        assertEquals(ProductionConfirmation.STATUS_CONFIRMED, response.getPreviousStatus());
        assertEquals(ProductionConfirmation.STATUS_REJECTED, response.getNewStatus());
        assertTrue(response.getMessage().contains("rejected"));

        verify(confirmationRepository, times(1)).save(any(ProductionConfirmation.class));
        verify(auditService, times(1)).logStatusChange(eq("PRODUCTION_CONFIRMATION"), eq(1L),
                eq(ProductionConfirmation.STATUS_CONFIRMED), eq(ProductionConfirmation.STATUS_REJECTED));
    }

    @Test
    @DisplayName("Should throw exception when rejecting already rejected confirmation")
    void rejectConfirmation_AlreadyRejected_ThrowsException() {
        // Arrange
        ProductionConfirmation confirmation = ProductionConfirmation.builder()
                .confirmationId(1L)
                .status(ProductionConfirmation.STATUS_REJECTED)
                .build();

        when(confirmationRepository.findById(1L)).thenReturn(Optional.of(confirmation));

        ProductionConfirmationDTO.RejectionRequest request = ProductionConfirmationDTO.RejectionRequest.builder()
                .confirmationId(1L)
                .reason("Test reason")
                .build();

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> productionService.rejectConfirmation(request));

        assertTrue(exception.getMessage().contains("already rejected"));
    }

    @Test
    @DisplayName("Should throw exception when confirmation not found")
    void rejectConfirmation_NotFound_ThrowsException() {
        // Arrange
        when(confirmationRepository.findById(999L)).thenReturn(Optional.empty());

        ProductionConfirmationDTO.RejectionRequest request = ProductionConfirmationDTO.RejectionRequest.builder()
                .confirmationId(999L)
                .reason("Test reason")
                .build();

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> productionService.rejectConfirmation(request));

        assertTrue(exception.getMessage().contains("not found"));
    }

    @Test
    @DisplayName("Should get confirmation by ID")
    void getConfirmationById_ValidId_ReturnsConfirmation() {
        // Arrange
        ProductionConfirmation confirmation = ProductionConfirmation.builder()
                .confirmationId(1L)
                .operation(testOperation)
                .producedQty(BigDecimal.valueOf(25))
                .status(ProductionConfirmation.STATUS_CONFIRMED)
                .createdOn(LocalDateTime.now())
                .build();

        when(confirmationRepository.findById(1L)).thenReturn(Optional.of(confirmation));
        when(equipmentRepository.findAllById(anyList())).thenReturn(List.of());
        when(operatorRepository.findAllById(anyList())).thenReturn(List.of());

        // Act
        ProductionConfirmationDTO.Response response = productionService.getConfirmationById(1L);

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getConfirmationId());
        assertEquals(ProductionConfirmation.STATUS_CONFIRMED, response.getStatus());
    }

    @Test
    @DisplayName("Should get confirmations by status")
    void getConfirmationsByStatus_ValidStatus_ReturnsConfirmations() {
        // Arrange
        ProductionConfirmation confirmation = ProductionConfirmation.builder()
                .confirmationId(1L)
                .operation(testOperation)
                .producedQty(BigDecimal.valueOf(25))
                .status(ProductionConfirmation.STATUS_REJECTED)
                .rejectionReason("Quality defects")
                .rejectedBy("test-user")
                .rejectedOn(LocalDateTime.now())
                .createdOn(LocalDateTime.now())
                .build();

        when(confirmationRepository.findByStatus(ProductionConfirmation.STATUS_REJECTED))
                .thenReturn(List.of(confirmation));
        when(equipmentRepository.findAllById(anyList())).thenReturn(List.of());
        when(operatorRepository.findAllById(anyList())).thenReturn(List.of());

        // Act
        List<ProductionConfirmationDTO.Response> responses = productionService.getConfirmationsByStatus(ProductionConfirmation.STATUS_REJECTED);

        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals(ProductionConfirmation.STATUS_REJECTED, responses.get(0).getStatus());
        assertEquals("Quality defects", responses.get(0).getRejectionReason());
    }

    @Test
    @DisplayName("Should create partial confirmation when produced qty is less than target")
    void confirmProduction_PartialQuantity_CreatesPartialConfirmation() {
        // Arrange
        testOperation.setTargetQty(BigDecimal.valueOf(100));
        testOperation.setConfirmedQty(BigDecimal.ZERO);

        ProductionConfirmationDTO.Request request = ProductionConfirmationDTO.Request.builder()
                .operationId(1L)
                .materialsConsumed(List.of(
                        ProductionConfirmationDTO.MaterialConsumption.builder()
                                .batchId(1L)
                                .inventoryId(1L)
                                .quantity(BigDecimal.valueOf(20))
                                .build()
                ))
                .producedQty(BigDecimal.valueOf(25)) // Less than target of 100
                .scrapQty(BigDecimal.ZERO)
                .startTime(LocalDateTime.now().minusHours(1))
                .endTime(LocalDateTime.now())
                .equipmentIds(List.of(1L))
                .operatorIds(List.of(1L))
                .build();

        when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(anyString(), anyLong(), anyString())).thenReturn(false);
        when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
        when(batchRepository.findMaxSequenceByPrefix(anyString())).thenReturn(Optional.of(0));
        when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
            Batch b = i.getArgument(0);
            b.setBatchId(2L);
            return b;
        });
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(batchRelationRepository.save(any(BatchRelation.class))).thenAnswer(i -> i.getArgument(0));
        when(confirmationRepository.save(any(ProductionConfirmation.class))).thenAnswer(i -> {
            ProductionConfirmation pc = i.getArgument(0);
            pc.setConfirmationId(1L);
            pc.setCreatedOn(LocalDateTime.now());
            return pc;
        });
        when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));
        when(equipmentRepository.findAllById(anyList())).thenReturn(List.of());
        when(operatorRepository.findAllById(anyList())).thenReturn(List.of());
        when(batchNumberService.generateBatchNumber(anyString(), anyString())).thenReturn("BATCH-TEST-001");

        // Act
        ProductionConfirmationDTO.Response response = productionService.confirmProduction(request);

        // Assert
        assertNotNull(response);
        assertEquals(ProductionConfirmation.STATUS_PARTIALLY_CONFIRMED, response.getStatus());

        // Verify operation stays in IN_PROGRESS for partial confirmation
        assertEquals("IN_PROGRESS", testOperation.getStatus());
        assertEquals(BigDecimal.valueOf(25), testOperation.getConfirmedQty());
    }

    @Test
    @DisplayName("Should create full confirmation when produced qty meets target")
    void confirmProduction_FullQuantity_CreatesFullConfirmation() {
        // Arrange
        testOperation.setTargetQty(BigDecimal.valueOf(50));
        testOperation.setConfirmedQty(BigDecimal.valueOf(25)); // Already 25 confirmed

        ProductionConfirmationDTO.Request request = ProductionConfirmationDTO.Request.builder()
                .operationId(1L)
                .materialsConsumed(List.of(
                        ProductionConfirmationDTO.MaterialConsumption.builder()
                                .batchId(1L)
                                .inventoryId(1L)
                                .quantity(BigDecimal.valueOf(20))
                                .build()
                ))
                .producedQty(BigDecimal.valueOf(25)) // This brings total to 50, meeting target
                .scrapQty(BigDecimal.ZERO)
                .startTime(LocalDateTime.now().minusHours(1))
                .endTime(LocalDateTime.now())
                .equipmentIds(List.of(1L))
                .operatorIds(List.of(1L))
                .build();

        when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(anyString(), anyLong(), anyString())).thenReturn(false);
        when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
        when(batchRepository.findMaxSequenceByPrefix(anyString())).thenReturn(Optional.of(0));
        when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
            Batch b = i.getArgument(0);
            b.setBatchId(2L);
            return b;
        });
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(batchRelationRepository.save(any(BatchRelation.class))).thenAnswer(i -> i.getArgument(0));
        when(confirmationRepository.save(any(ProductionConfirmation.class))).thenAnswer(i -> {
            ProductionConfirmation pc = i.getArgument(0);
            pc.setConfirmationId(1L);
            pc.setCreatedOn(LocalDateTime.now());
            return pc;
        });
        when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));
        when(operationRepository.findNextOperation(anyLong(), anyInt())).thenReturn(Optional.empty());
        when(processRepository.save(any(Process.class))).thenAnswer(i -> i.getArgument(0));
        when(equipmentRepository.findAllById(anyList())).thenReturn(List.of());
        when(operatorRepository.findAllById(anyList())).thenReturn(List.of());
        when(batchNumberService.generateBatchNumber(anyString(), anyString())).thenReturn("BATCH-TEST-001");

        // Act
        ProductionConfirmationDTO.Response response = productionService.confirmProduction(request);

        // Assert
        assertNotNull(response);
        assertEquals(ProductionConfirmation.STATUS_CONFIRMED, response.getStatus());

        // Verify operation moves to CONFIRMED for full confirmation
        assertEquals("CONFIRMED", testOperation.getStatus());
        assertEquals(BigDecimal.valueOf(50), testOperation.getConfirmedQty());
    }

    // ===== BF-01: findNextOperation uses orderLineId (not processId) =====

    @Test
    @DisplayName("BF-01: Should set next operation to READY when full confirmation completed, using orderLineId")
    void should_setNextOperationToReady_when_fullConfirmationCompleted() {
        // GIVEN: An operation with target qty that will be fully met
        testOperation.setTargetQty(BigDecimal.valueOf(25));
        testOperation.setConfirmedQty(BigDecimal.ZERO);

        // A next operation exists in the same order line item
        Operation nextOperation = Operation.builder()
                .operationId(2L)
                .process(testProcess)
                .orderLineItem(testOrderLine)
                .operationName("Next Operation")
                .operationCode("OP002")
                .operationType("CASTING")
                .sequenceNumber(2)
                .status("NOT_STARTED")
                .build();

        ProductionConfirmationDTO.Request request = ProductionConfirmationDTO.Request.builder()
                .operationId(1L)
                .materialsConsumed(List.of(
                        ProductionConfirmationDTO.MaterialConsumption.builder()
                                .batchId(1L)
                                .inventoryId(1L)
                                .quantity(BigDecimal.valueOf(30))
                                .build()
                ))
                .producedQty(BigDecimal.valueOf(25))
                .scrapQty(BigDecimal.valueOf(5))
                .startTime(LocalDateTime.now().minusHours(1))
                .endTime(LocalDateTime.now())
                .equipmentIds(List.of(1L))
                .operatorIds(List.of(1L))
                .build();

        when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(anyString(), anyLong(), anyString())).thenReturn(false);
        when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
        when(batchRepository.findMaxSequenceByPrefix(anyString())).thenReturn(Optional.of(0));
        when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
            Batch b = i.getArgument(0);
            b.setBatchId(2L);
            return b;
        });
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(batchRelationRepository.save(any(BatchRelation.class))).thenAnswer(i -> i.getArgument(0));
        when(confirmationRepository.save(any(ProductionConfirmation.class))).thenAnswer(i -> {
            ProductionConfirmation pc = i.getArgument(0);
            pc.setConfirmationId(1L);
            pc.setCreatedOn(LocalDateTime.now());
            return pc;
        });
        when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));
        when(processRepository.save(any(Process.class))).thenAnswer(i -> i.getArgument(0));
        when(equipmentRepository.findAllById(anyList())).thenReturn(List.of());
        when(operatorRepository.findAllById(anyList())).thenReturn(List.of());
        when(batchNumberService.generateBatchNumber(anyString(), anyString())).thenReturn("BATCH-TEST-001");

        // WHEN: findNextOperation is called with orderLineId (1L), it returns the next operation
        when(operationRepository.findNextOperation(eq(1L), eq(1))).thenReturn(Optional.of(nextOperation));

        ProductionConfirmationDTO.Response response = productionService.confirmProduction(request);

        // THEN: findNextOperation was called with orderLineId (1L), not processId
        verify(operationRepository).findNextOperation(eq(1L), eq(1));

        // The next operation's status should be set to READY
        assertEquals("READY", nextOperation.getStatus());

        // The response should include next operation info
        assertNotNull(response.getNextOperation());
        assertEquals(2L, response.getNextOperation().getOperationId());
        assertEquals("Next Operation", response.getNextOperation().getOperationName());
        assertEquals("READY", response.getNextOperation().getStatus());
    }

    @Test
    @DisplayName("BF-01: Should not set next operation to READY when partial confirmation")
    void should_notSetNextOperationReady_when_partialConfirmation() {
        // GIVEN: An operation with target qty 100 and only 25 produced (partial)
        testOperation.setTargetQty(BigDecimal.valueOf(100));
        testOperation.setConfirmedQty(BigDecimal.ZERO);

        ProductionConfirmationDTO.Request request = ProductionConfirmationDTO.Request.builder()
                .operationId(1L)
                .materialsConsumed(List.of(
                        ProductionConfirmationDTO.MaterialConsumption.builder()
                                .batchId(1L)
                                .inventoryId(1L)
                                .quantity(BigDecimal.valueOf(20))
                                .build()
                ))
                .producedQty(BigDecimal.valueOf(25)) // Only 25 of 100 target
                .scrapQty(BigDecimal.ZERO)
                .startTime(LocalDateTime.now().minusHours(1))
                .endTime(LocalDateTime.now())
                .equipmentIds(List.of(1L))
                .operatorIds(List.of(1L))
                .build();

        when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(anyString(), anyLong(), anyString())).thenReturn(false);
        when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
        when(batchRepository.findMaxSequenceByPrefix(anyString())).thenReturn(Optional.of(0));
        when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
            Batch b = i.getArgument(0);
            b.setBatchId(2L);
            return b;
        });
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(batchRelationRepository.save(any(BatchRelation.class))).thenAnswer(i -> i.getArgument(0));
        when(confirmationRepository.save(any(ProductionConfirmation.class))).thenAnswer(i -> {
            ProductionConfirmation pc = i.getArgument(0);
            pc.setConfirmationId(1L);
            pc.setCreatedOn(LocalDateTime.now());
            return pc;
        });
        when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));
        when(equipmentRepository.findAllById(anyList())).thenReturn(List.of());
        when(operatorRepository.findAllById(anyList())).thenReturn(List.of());
        when(batchNumberService.generateBatchNumber(anyString(), anyString())).thenReturn("BATCH-TEST-001");

        // WHEN: Partial confirmation is processed
        ProductionConfirmationDTO.Response response = productionService.confirmProduction(request);

        // THEN: findNextOperation should NOT be called (partial = stays IN_PROGRESS)
        verify(operationRepository, never()).findNextOperation(anyLong(), anyInt());

        // Operation stays in IN_PROGRESS, not CONFIRMED
        assertEquals("IN_PROGRESS", testOperation.getStatus());
        assertEquals(ProductionConfirmation.STATUS_PARTIALLY_CONFIRMED, response.getStatus());
    }

    @Test
    @DisplayName("BF-01: Should complete process gracefully when no next operation exists")
    void should_completeProcessGracefully_when_noNextOperationExists() {
        // GIVEN: A full confirmation where there is no next operation (last in sequence)
        testOperation.setTargetQty(BigDecimal.valueOf(25));
        testOperation.setConfirmedQty(BigDecimal.ZERO);

        ProductionConfirmationDTO.Request request = ProductionConfirmationDTO.Request.builder()
                .operationId(1L)
                .materialsConsumed(List.of(
                        ProductionConfirmationDTO.MaterialConsumption.builder()
                                .batchId(1L)
                                .inventoryId(1L)
                                .quantity(BigDecimal.valueOf(30))
                                .build()
                ))
                .producedQty(BigDecimal.valueOf(25))
                .scrapQty(BigDecimal.valueOf(5))
                .startTime(LocalDateTime.now().minusHours(1))
                .endTime(LocalDateTime.now())
                .equipmentIds(List.of(1L))
                .operatorIds(List.of(1L))
                .build();

        when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(anyString(), anyLong(), anyString())).thenReturn(false);
        when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
        when(batchRepository.findMaxSequenceByPrefix(anyString())).thenReturn(Optional.of(0));
        when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
            Batch b = i.getArgument(0);
            b.setBatchId(2L);
            return b;
        });
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(batchRelationRepository.save(any(BatchRelation.class))).thenAnswer(i -> i.getArgument(0));
        when(confirmationRepository.save(any(ProductionConfirmation.class))).thenAnswer(i -> {
            ProductionConfirmation pc = i.getArgument(0);
            pc.setConfirmationId(1L);
            pc.setCreatedOn(LocalDateTime.now());
            return pc;
        });
        when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));
        when(processRepository.save(any(Process.class))).thenAnswer(i -> i.getArgument(0));
        when(equipmentRepository.findAllById(anyList())).thenReturn(List.of());
        when(operatorRepository.findAllById(anyList())).thenReturn(List.of());
        when(batchNumberService.generateBatchNumber(anyString(), anyString())).thenReturn("BATCH-TEST-001");

        // findNextOperation returns empty - no next operation
        when(operationRepository.findNextOperation(eq(1L), eq(1))).thenReturn(Optional.empty());

        // WHEN: Full confirmation is processed
        ProductionConfirmationDTO.Response response = productionService.confirmProduction(request);

        // THEN: No exception is thrown, response.nextOperation is null
        assertNotNull(response);
        assertNull(response.getNextOperation());
        assertEquals("CONFIRMED", response.getStatus());
        assertEquals("CONFIRMED", testOperation.getStatus());
    }

    // ===== BF-02: ProductionConfirmation without CLOB =====

    @Test
    @DisplayName("BF-02: Should save confirmation with processParameters as JSON string (not CLOB)")
    void should_saveConfirmationWithProcessParameters_when_parametersProvided() {
        // GIVEN: A confirmation request with process parameters
        testOperation.setTargetQty(BigDecimal.valueOf(25));
        testOperation.setConfirmedQty(BigDecimal.ZERO);

        Map<String, Object> processParams = Map.of(
                "temperature", 1200,
                "pressure", 3.5,
                "speed", "HIGH"
        );

        ProductionConfirmationDTO.Request request = ProductionConfirmationDTO.Request.builder()
                .operationId(1L)
                .materialsConsumed(List.of(
                        ProductionConfirmationDTO.MaterialConsumption.builder()
                                .batchId(1L)
                                .inventoryId(1L)
                                .quantity(BigDecimal.valueOf(30))
                                .build()
                ))
                .producedQty(BigDecimal.valueOf(25))
                .scrapQty(BigDecimal.valueOf(5))
                .startTime(LocalDateTime.now().minusHours(1))
                .endTime(LocalDateTime.now())
                .equipmentIds(List.of(1L))
                .operatorIds(List.of(1L))
                .processParameters(processParams)
                .build();

        when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(anyString(), anyLong(), anyString())).thenReturn(false);
        when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
        when(batchRepository.findMaxSequenceByPrefix(anyString())).thenReturn(Optional.of(0));
        when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
            Batch b = i.getArgument(0);
            b.setBatchId(2L);
            return b;
        });
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(batchRelationRepository.save(any(BatchRelation.class))).thenAnswer(i -> i.getArgument(0));
        when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));
        when(operationRepository.findNextOperation(anyLong(), anyInt())).thenReturn(Optional.empty());
        when(processRepository.save(any(Process.class))).thenAnswer(i -> i.getArgument(0));
        when(equipmentRepository.findAllById(anyList())).thenReturn(List.of());
        when(operatorRepository.findAllById(anyList())).thenReturn(List.of());
        when(batchNumberService.generateBatchNumber(anyString(), anyString())).thenReturn("BATCH-TEST-001");

        // Mock process parameter validation to return valid result
        ProcessParameterService.ValidationResult validationResult = new ProcessParameterService.ValidationResult();
        when(processParameterService.validateParameters(anyString(), anyString(), anyMap())).thenReturn(validationResult);

        // Capture the saved confirmation to inspect processParametersJson
        when(confirmationRepository.save(any(ProductionConfirmation.class))).thenAnswer(i -> {
            ProductionConfirmation pc = i.getArgument(0);
            pc.setConfirmationId(1L);
            pc.setCreatedOn(LocalDateTime.now());
            return pc;
        });

        // WHEN: Confirmation is processed with process parameters
        ProductionConfirmationDTO.Response response = productionService.confirmProduction(request);

        // THEN: The confirmation is saved with processParametersJson as a plain String
        verify(confirmationRepository).save(argThat(confirmation -> {
            String json = confirmation.getProcessParametersJson();
            // Must be a String (not a CLOB), and must contain the parameter values
            assertNotNull(json, "processParametersJson should not be null when parameters are provided");
            assertTrue(json instanceof String, "processParametersJson must be a String, not a CLOB");
            assertTrue(json.contains("temperature"), "JSON should contain 'temperature' parameter key");
            assertTrue(json.contains("1200"), "JSON should contain temperature value");
            assertTrue(json.contains("pressure"), "JSON should contain 'pressure' parameter key");
            assertTrue(json.contains("speed"), "JSON should contain 'speed' parameter key");
            return true;
        }));

        assertNotNull(response);
        assertEquals(1L, response.getConfirmationId());
    }

    // ===== Phase 1: Additional coverage tests =====

    @Test
    @DisplayName("Should return continuable operations with partial progress")
    void should_returnContinuableOperations_when_operationsHavePartialProgress() {
        // GIVEN: Two IN_PROGRESS operations - one with confirmed qty, one without
        Operation partialOp = Operation.builder()
                .operationId(10L)
                .operationName("Partial Op")
                .operationCode("POP-001")
                .operationType("MELTING")
                .status("IN_PROGRESS")
                .confirmedQty(BigDecimal.valueOf(30))
                .targetQty(BigDecimal.valueOf(100))
                .orderLineItem(testOrderLine)
                .build();

        Operation freshOp = Operation.builder()
                .operationId(11L)
                .operationName("Fresh Op")
                .operationCode("FOP-001")
                .operationType("CASTING")
                .status("IN_PROGRESS")
                .confirmedQty(BigDecimal.ZERO) // No progress yet
                .targetQty(BigDecimal.valueOf(50))
                .build();

        when(operationRepository.findByStatus("IN_PROGRESS")).thenReturn(List.of(partialOp, freshOp));

        // WHEN
        List<Map<String, Object>> result = productionService.getContinuableOperations();

        // THEN: Only the operation with confirmed qty > 0 is returned
        assertEquals(1, result.size());
        assertEquals(10L, result.get(0).get("operationId"));
        assertEquals("Partial Op", result.get(0).get("operationName"));
        assertEquals(BigDecimal.valueOf(30), result.get(0).get("confirmedQty"));
        assertEquals(BigDecimal.valueOf(70), result.get(0).get("remainingQty"));
        assertEquals("TEST-SKU", result.get(0).get("productSku"));
    }

    @Test
    @DisplayName("Should reject confirmation when process parameters fail validation")
    void should_rejectConfirmation_when_processParametersBelowMinimum() {
        // GIVEN: Process parameters that violate min/max constraints
        Map<String, Object> badParams = Map.of("temperature", 500); // Below minimum

        ProductionConfirmationDTO.Request request = ProductionConfirmationDTO.Request.builder()
                .operationId(1L)
                .materialsConsumed(List.of())
                .producedQty(BigDecimal.TEN)
                .startTime(LocalDateTime.now())
                .endTime(LocalDateTime.now())
                .processParameters(badParams)
                .build();

        when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(anyString(), anyLong(), anyString())).thenReturn(false);

        // Validation fails with error messages
        ProcessParameterService.ValidationResult failedResult = new ProcessParameterService.ValidationResult();
        failedResult.setValid(false);
        failedResult.getErrors().add("temperature: 500 is below minimum 800");
        when(processParameterService.validateParameters(eq("MELTING"), eq("TEST-SKU"), anyMap())).thenReturn(failedResult);

        // WHEN & THEN
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> productionService.confirmProduction(request));

        assertTrue(exception.getMessage().contains("Process parameter validation failed"));
        assertTrue(exception.getMessage().contains("temperature"));
    }

    @Test
    @DisplayName("Should reject confirmation when process is on hold")
    void should_throwException_when_processIsOnHold() {
        // GIVEN: Operation is valid but its process has an active hold
        ProductionConfirmationDTO.Request request = ProductionConfirmationDTO.Request.builder()
                .operationId(1L)
                .materialsConsumed(List.of())
                .producedQty(BigDecimal.TEN)
                .startTime(LocalDateTime.now())
                .endTime(LocalDateTime.now())
                .build();

        when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("OPERATION", 1L, "ACTIVE")).thenReturn(false);
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("PROCESS", 1L, "ACTIVE")).thenReturn(true);

        // WHEN & THEN
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> productionService.confirmProduction(request));

        assertTrue(exception.getMessage().contains("Process is on hold"));
    }

    @Test
    @DisplayName("Should reject confirmation when process status is not ACTIVE")
    void should_throwException_when_processIsNotActive() {
        // GIVEN: Process is INACTIVE (not ACTIVE)
        testProcess.setStatus(ProcessStatus.INACTIVE);

        ProductionConfirmationDTO.Request request = ProductionConfirmationDTO.Request.builder()
                .operationId(1L)
                .materialsConsumed(List.of())
                .producedQty(BigDecimal.TEN)
                .startTime(LocalDateTime.now())
                .endTime(LocalDateTime.now())
                .build();

        when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(anyString(), anyLong(), anyString())).thenReturn(false);

        // WHEN & THEN
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> productionService.confirmProduction(request));

        assertTrue(exception.getMessage().contains("Cannot confirm production"));
        assertTrue(exception.getMessage().contains("must be ACTIVE"));
    }

    @Test
    @DisplayName("Should create multiple batches when output exceeds max batch size")
    void should_createMultipleBatches_when_outputExceedsMaxBatchSize() {
        // GIVEN: BatchSizeService splits 100T into two batches of 60T and 40T
        testOperation.setTargetQty(BigDecimal.valueOf(100));
        testOperation.setConfirmedQty(BigDecimal.ZERO);

        when(batchSizeService.calculateBatchSizes(any(), any(), any(), any(), any()))
                .thenReturn(new BatchSizeService.BatchSizeResult(
                        List.of(BigDecimal.valueOf(60), BigDecimal.valueOf(40)),
                        2,
                        BigDecimal.valueOf(100),
                        false,
                        null
                ));

        ProductionConfirmationDTO.Request request = ProductionConfirmationDTO.Request.builder()
                .operationId(1L)
                .materialsConsumed(List.of(
                        ProductionConfirmationDTO.MaterialConsumption.builder()
                                .batchId(1L)
                                .inventoryId(1L)
                                .quantity(BigDecimal.valueOf(50))
                                .build()
                ))
                .producedQty(BigDecimal.valueOf(100))
                .scrapQty(BigDecimal.ZERO)
                .startTime(LocalDateTime.now().minusHours(1))
                .endTime(LocalDateTime.now())
                .build();

        when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(anyString(), anyLong(), anyString())).thenReturn(false);
        when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));

        // Mock batch saves - track how many batches are created
        java.util.concurrent.atomic.AtomicLong batchIdCounter = new java.util.concurrent.atomic.AtomicLong(10L);
        when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
            Batch b = i.getArgument(0);
            if (b.getBatchId() == null) {
                b.setBatchId(batchIdCounter.getAndIncrement());
            }
            return b;
        });
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> {
            Inventory inv = i.getArgument(0);
            if (inv.getInventoryId() == null) {
                inv.setInventoryId(batchIdCounter.getAndIncrement());
            }
            return inv;
        });
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(batchRelationRepository.save(any(BatchRelation.class))).thenAnswer(i -> i.getArgument(0));
        when(confirmationRepository.save(any(ProductionConfirmation.class))).thenAnswer(i -> {
            ProductionConfirmation pc = i.getArgument(0);
            pc.setConfirmationId(1L);
            pc.setCreatedOn(LocalDateTime.now());
            return pc;
        });
        when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));
        when(operationRepository.findNextOperation(anyLong(), anyInt())).thenReturn(Optional.empty());
        when(equipmentRepository.findAllById(anyList())).thenReturn(List.of());
        when(operatorRepository.findAllById(anyList())).thenReturn(List.of());
        when(batchNumberService.generateBatchNumber(anyString(), anyString())).thenReturn("BATCH-MULTI-001");

        // WHEN
        ProductionConfirmationDTO.Response response = productionService.confirmProduction(request);

        // THEN: Response contains 2 output batches
        assertNotNull(response);
        assertEquals(2, response.getBatchCount());
        assertEquals(2, response.getOutputBatches().size());

        // Verify batch save was called for 2 output batches (plus possible input batch saves)
        verify(batchRepository, atLeast(2)).save(any(Batch.class));
    }
}
