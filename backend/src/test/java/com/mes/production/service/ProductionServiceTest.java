package com.mes.production.service;

import com.mes.production.dto.ProductionConfirmationDTO;
import com.mes.production.entity.*;
import com.mes.production.entity.Process;
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

        // Process is design-time only (no OrderLineItem reference)
        testProcess = Process.builder()
                .processId(1L)
                .processName("Test Stage")
                .status("IN_PROGRESS")
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
}
