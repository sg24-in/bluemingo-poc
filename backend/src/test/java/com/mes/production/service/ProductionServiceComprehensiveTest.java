package com.mes.production.service;

import com.mes.production.dto.ProductionConfirmationDTO;
import com.mes.production.entity.*;
import com.mes.production.entity.Process;
import com.mes.production.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Comprehensive test suite for ProductionService.
 *
 * Test Categories:
 * 1. confirmProduction() - Full flow testing
 * 2. getOperationDetails() - Operation retrieval
 * 3. getConfirmationById() - Confirmation retrieval
 * 4. getConfirmationsByStatus() - Status filtering
 * 5. getContinuableOperations() - Partial confirmation support
 * 6. Material Consumption Logic - Inventory validation
 * 7. Batch Creation Logic - Output batch generation
 * 8. Rejection Tests - Confirmation rejection flow
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ProductionService Comprehensive Tests")
class ProductionServiceComprehensiveTest {

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
        setupSecurityContext();
        setupTestEntities();
        setupDefaultMocks();
    }

    private void setupSecurityContext() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("test-user");
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    private void setupTestEntities() {
        testOrder = Order.builder()
                .orderId(1L)
                .orderNumber("ORD-001")
                .status("IN_PROGRESS")
                .build();

        testOrderLine = OrderLineItem.builder()
                .orderLineId(1L)
                .order(testOrder)
                .productSku("STEEL-001")
                .productName("Steel Coil")
                .quantity(BigDecimal.valueOf(100))
                .build();

        testProcess = Process.builder()
                .processId(1L)
                .processName("Melting Stage")
                .status(ProcessStatus.ACTIVE)
                .build();

        testOperation = Operation.builder()
                .operationId(1L)
                .process(testProcess)
                .orderLineItem(testOrderLine)
                .operationName("Melting")
                .operationCode("MELT-001")
                .operationType("MELTING")
                .sequenceNumber(1)
                .status("READY")
                .targetQty(BigDecimal.valueOf(100))
                .confirmedQty(BigDecimal.ZERO)
                .build();

        testBatch = Batch.builder()
                .batchId(1L)
                .batchNumber("BATCH-001")
                .materialId("RM-001")
                .materialName("Iron Ore")
                .quantity(BigDecimal.valueOf(50))
                .status("AVAILABLE")
                .build();

        testInventory = Inventory.builder()
                .inventoryId(1L)
                .materialId("RM-001")
                .materialName("Iron Ore")
                .inventoryType("RM")
                .state("AVAILABLE")
                .quantity(BigDecimal.valueOf(50))
                .batch(testBatch)
                .build();
    }

    private void setupDefaultMocks() {
        when(batchSizeService.calculateBatchSizes(any(), any(), any(), any(), any()))
                .thenAnswer(invocation -> {
                    BigDecimal qty = invocation.getArgument(0);
                    return new BatchSizeService.BatchSizeResult(
                            List.of(qty),
                            1,
                            qty,
                            false,
                            null
                    );
                });
    }

    // ========================================================================
    // 1. CONFIRM PRODUCTION - FULL FLOW
    // ========================================================================

    @Nested
    @DisplayName("1. Confirm Production Tests")
    class ConfirmProductionTests {

        @Test
        @DisplayName("1.1 should_confirmProduction_when_validRequest")
        void should_confirmProduction_when_validRequest() {
            // Arrange
            ProductionConfirmationDTO.Request request = createValidRequest();

            setupSuccessfulConfirmationMocks();

            // Act
            ProductionConfirmationDTO.Response response = productionService.confirmProduction(request);

            // Assert
            assertNotNull(response);
            assertEquals(1L, response.getConfirmationId());
            assertEquals(BigDecimal.valueOf(25), response.getProducedQty());
            verify(confirmationRepository).save(any(ProductionConfirmation.class));
            verify(operationRepository).save(any(Operation.class));
        }

        @Test
        @DisplayName("1.2 should_throwException_when_operationNotReady")
        void should_throwException_when_operationNotReady() {
            // Arrange
            testOperation.setStatus("CONFIRMED");
            when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));

            ProductionConfirmationDTO.Request request = createValidRequest();

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> productionService.confirmProduction(request));

            assertTrue(exception.getMessage().contains("not in READY or IN_PROGRESS status"));
        }

        @Test
        @DisplayName("1.3 should_throwException_when_operationOnHold")
        void should_throwException_when_operationOnHold() {
            // Arrange
            when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
            when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("OPERATION", 1L, "ACTIVE"))
                    .thenReturn(true);

            ProductionConfirmationDTO.Request request = createValidRequest();

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> productionService.confirmProduction(request));

            assertTrue(exception.getMessage().contains("on hold"));
        }

        @Test
        @DisplayName("1.4 should_throwException_when_processOnHold")
        void should_throwException_when_processOnHold() {
            // Arrange
            when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
            when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("OPERATION", 1L, "ACTIVE"))
                    .thenReturn(false);
            when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("PROCESS", 1L, "ACTIVE"))
                    .thenReturn(true);

            ProductionConfirmationDTO.Request request = createValidRequest();

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> productionService.confirmProduction(request));

            assertTrue(exception.getMessage().contains("on hold"));
        }

        @Test
        @DisplayName("1.5 should_throwException_when_processNotActive")
        void should_throwException_when_processNotActive() {
            // Arrange
            testProcess.setStatus(ProcessStatus.DRAFT);
            when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
            when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(anyString(), anyLong(), anyString()))
                    .thenReturn(false);

            ProductionConfirmationDTO.Request request = createValidRequest();

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> productionService.confirmProduction(request));

            assertTrue(exception.getMessage().contains("must be ACTIVE") ||
                       exception.getMessage().contains("DRAFT"));
        }

        @Test
        @DisplayName("1.6 should_throwException_when_operationNotFound")
        void should_throwException_when_operationNotFound() {
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
        @DisplayName("1.7 should_createPartialConfirmation_when_qtyLessThanTarget")
        void should_createPartialConfirmation_when_qtyLessThanTarget() {
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
                    .producedQty(BigDecimal.valueOf(25)) // Less than 100
                    .startTime(LocalDateTime.now().minusHours(1))
                    .endTime(LocalDateTime.now())
                    .equipmentIds(List.of(1L))
                    .operatorIds(List.of(1L))
                    .build();

            setupSuccessfulConfirmationMocks();

            // Act
            ProductionConfirmationDTO.Response response = productionService.confirmProduction(request);

            // Assert
            assertEquals(ProductionConfirmation.STATUS_PARTIALLY_CONFIRMED, response.getStatus());
            assertTrue(response.getIsPartial());
            assertEquals(BigDecimal.valueOf(75), response.getRemainingQty());
        }

        @Test
        @DisplayName("1.8 should_createFullConfirmation_when_qtyMeetsTarget")
        void should_createFullConfirmation_when_qtyMeetsTarget() {
            // Arrange
            testOperation.setTargetQty(BigDecimal.valueOf(50));
            testOperation.setConfirmedQty(BigDecimal.valueOf(25));

            ProductionConfirmationDTO.Request request = ProductionConfirmationDTO.Request.builder()
                    .operationId(1L)
                    .materialsConsumed(List.of(
                            ProductionConfirmationDTO.MaterialConsumption.builder()
                                    .batchId(1L)
                                    .inventoryId(1L)
                                    .quantity(BigDecimal.valueOf(20))
                                    .build()
                    ))
                    .producedQty(BigDecimal.valueOf(25)) // Total = 50, meets target
                    .startTime(LocalDateTime.now().minusHours(1))
                    .endTime(LocalDateTime.now())
                    .equipmentIds(List.of(1L))
                    .operatorIds(List.of(1L))
                    .build();

            setupSuccessfulConfirmationMocks();
            when(operationRepository.findNextOperation(anyLong(), anyInt())).thenReturn(Optional.empty());

            // Act
            ProductionConfirmationDTO.Response response = productionService.confirmProduction(request);

            // Assert
            assertEquals(ProductionConfirmation.STATUS_CONFIRMED, response.getStatus());
        }

        @Test
        @DisplayName("1.9 should_forcePartialConfirmation_when_saveAsPartialTrue")
        void should_forcePartialConfirmation_when_saveAsPartialTrue() {
            // Arrange
            testOperation.setTargetQty(BigDecimal.valueOf(25)); // Qty equals target
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
                    .producedQty(BigDecimal.valueOf(25))
                    .saveAsPartial(true) // Force partial
                    .startTime(LocalDateTime.now().minusHours(1))
                    .endTime(LocalDateTime.now())
                    .equipmentIds(List.of(1L))
                    .operatorIds(List.of(1L))
                    .build();

            setupSuccessfulConfirmationMocks();

            // Act
            ProductionConfirmationDTO.Response response = productionService.confirmProduction(request);

            // Assert
            assertEquals(ProductionConfirmation.STATUS_PARTIALLY_CONFIRMED, response.getStatus());
        }

        private ProductionConfirmationDTO.Request createValidRequest() {
            return ProductionConfirmationDTO.Request.builder()
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
        }

        private void setupSuccessfulConfirmationMocks() {
            when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
            when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(anyString(), anyLong(), anyString()))
                    .thenReturn(false);
            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
                Batch b = i.getArgument(0);
                if (b.getBatchId() == null) b.setBatchId(2L);
                return b;
            });
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));
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
            when(batchNumberService.generateBatchNumber(anyString(), anyString())).thenReturn("BATCH-OUT-001");
        }
    }

    // ========================================================================
    // 2. GET OPERATION DETAILS
    // ========================================================================

    @Nested
    @DisplayName("2. Get Operation Details Tests")
    class GetOperationDetailsTests {

        @Test
        @DisplayName("2.1 should_returnOperation_when_operationExists")
        void should_returnOperation_when_operationExists() {
            // Arrange
            when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));

            // Act
            Operation result = productionService.getOperationDetails(1L);

            // Assert
            assertNotNull(result);
            assertEquals("Melting", result.getOperationName());
            assertEquals("READY", result.getStatus());
        }

        @Test
        @DisplayName("2.2 should_throwException_when_operationNotFound")
        void should_throwException_when_operationNotFound() {
            // Arrange
            when(operationRepository.findByIdWithDetails(999L)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> productionService.getOperationDetails(999L));

            assertTrue(exception.getMessage().contains("not found"));
        }
    }

    // ========================================================================
    // 3. GET CONFIRMATION BY ID
    // ========================================================================

    @Nested
    @DisplayName("3. Get Confirmation By ID Tests")
    class GetConfirmationByIdTests {

        @Test
        @DisplayName("3.1 should_returnConfirmation_when_exists")
        void should_returnConfirmation_when_exists() {
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
        @DisplayName("3.2 should_throwException_when_confirmationNotFound")
        void should_throwException_when_confirmationNotFound() {
            // Arrange
            when(confirmationRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThrows(RuntimeException.class,
                    () -> productionService.getConfirmationById(999L));
        }
    }

    // ========================================================================
    // 4. GET CONFIRMATIONS BY STATUS
    // ========================================================================

    @Nested
    @DisplayName("4. Get Confirmations By Status Tests")
    class GetConfirmationsByStatusTests {

        @Test
        @DisplayName("4.1 should_returnConfirmations_when_statusMatches")
        void should_returnConfirmations_when_statusMatches() {
            // Arrange
            ProductionConfirmation confirmation = ProductionConfirmation.builder()
                    .confirmationId(1L)
                    .operation(testOperation)
                    .producedQty(BigDecimal.valueOf(25))
                    .status(ProductionConfirmation.STATUS_REJECTED)
                    .rejectionReason("Quality issue")
                    .createdOn(LocalDateTime.now())
                    .build();

            when(confirmationRepository.findByStatus(ProductionConfirmation.STATUS_REJECTED))
                    .thenReturn(List.of(confirmation));
            when(equipmentRepository.findAllById(anyList())).thenReturn(List.of());
            when(operatorRepository.findAllById(anyList())).thenReturn(List.of());

            // Act
            List<ProductionConfirmationDTO.Response> result =
                    productionService.getConfirmationsByStatus(ProductionConfirmation.STATUS_REJECTED);

            // Assert
            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals(ProductionConfirmation.STATUS_REJECTED, result.get(0).getStatus());
        }

        @Test
        @DisplayName("4.2 should_returnEmptyList_when_noMatchingStatus")
        void should_returnEmptyList_when_noMatchingStatus() {
            // Arrange
            when(confirmationRepository.findByStatus("UNKNOWN")).thenReturn(List.of());

            // Act
            List<ProductionConfirmationDTO.Response> result =
                    productionService.getConfirmationsByStatus("UNKNOWN");

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    // ========================================================================
    // 5. GET CONTINUABLE OPERATIONS
    // ========================================================================

    @Nested
    @DisplayName("5. Get Continuable Operations Tests")
    class GetContinuableOperationsTests {

        @Test
        @DisplayName("5.1 should_returnContinuableOperations_when_partialProgressExists")
        void should_returnContinuableOperations_when_partialProgressExists() {
            // Arrange
            Operation inProgressOp = Operation.builder()
                    .operationId(2L)
                    .operationName("Casting")
                    .operationCode("CAST-001")
                    .operationType("CASTING")
                    .status("IN_PROGRESS")
                    .confirmedQty(BigDecimal.valueOf(50))
                    .targetQty(BigDecimal.valueOf(100))
                    .orderLineItem(testOrderLine)
                    .build();

            when(operationRepository.findByStatus("IN_PROGRESS"))
                    .thenReturn(List.of(inProgressOp));

            // Act
            List<Map<String, Object>> result = productionService.getContinuableOperations();

            // Assert
            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals(2L, result.get(0).get("operationId"));
            assertEquals(BigDecimal.valueOf(50), result.get(0).get("confirmedQty"));
            assertEquals(BigDecimal.valueOf(50), result.get(0).get("remainingQty"));
        }

        @Test
        @DisplayName("5.2 should_returnEmptyList_when_noContinuableOperations")
        void should_returnEmptyList_when_noContinuableOperations() {
            // Arrange
            when(operationRepository.findByStatus("IN_PROGRESS")).thenReturn(List.of());

            // Act
            List<Map<String, Object>> result = productionService.getContinuableOperations();

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("5.3 should_excludeOperations_when_confirmedQtyIsZero")
        void should_excludeOperations_when_confirmedQtyIsZero() {
            // Arrange
            Operation zeroProgressOp = Operation.builder()
                    .operationId(3L)
                    .operationName("Rolling")
                    .status("IN_PROGRESS")
                    .confirmedQty(BigDecimal.ZERO)
                    .targetQty(BigDecimal.valueOf(100))
                    .build();

            when(operationRepository.findByStatus("IN_PROGRESS"))
                    .thenReturn(List.of(zeroProgressOp));

            // Act
            List<Map<String, Object>> result = productionService.getContinuableOperations();

            // Assert
            assertTrue(result.isEmpty());
        }
    }

    // ========================================================================
    // 6. MATERIAL CONSUMPTION LOGIC
    // ========================================================================

    @Nested
    @DisplayName("6. Material Consumption Logic Tests")
    class MaterialConsumptionTests {

        @Test
        @DisplayName("6.1 should_throwException_when_inventoryNotAvailable")
        void should_throwException_when_inventoryNotAvailable() {
            // Arrange
            testInventory.setState("CONSUMED");
            when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
            when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(anyString(), anyLong(), anyString()))
                    .thenReturn(false);
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
        @DisplayName("6.2 should_throwException_when_consumptionExceedsAvailable")
        void should_throwException_when_consumptionExceedsAvailable() {
            // Arrange
            testInventory.setQuantity(BigDecimal.valueOf(20));
            when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
            when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(anyString(), anyLong(), anyString()))
                    .thenReturn(false);
            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));

            ProductionConfirmationDTO.Request request = ProductionConfirmationDTO.Request.builder()
                    .operationId(1L)
                    .materialsConsumed(List.of(
                            ProductionConfirmationDTO.MaterialConsumption.builder()
                                    .batchId(1L)
                                    .inventoryId(1L)
                                    .quantity(BigDecimal.valueOf(50)) // More than 20 available
                                    .build()
                    ))
                    .producedQty(BigDecimal.TEN)
                    .startTime(LocalDateTime.now())
                    .endTime(LocalDateTime.now())
                    .build();

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> productionService.confirmProduction(request));

            assertTrue(exception.getMessage().contains("exceeds"));
        }
    }

    // ========================================================================
    // 7. BATCH CREATION LOGIC
    // ========================================================================

    @Nested
    @DisplayName("7. Batch Creation Logic Tests")
    class BatchCreationTests {

        @Test
        @DisplayName("7.1 should_createOutputBatch_when_productionConfirmed")
        void should_createOutputBatch_when_productionConfirmed() {
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
                    .startTime(LocalDateTime.now().minusHours(1))
                    .endTime(LocalDateTime.now())
                    .equipmentIds(List.of(1L))
                    .operatorIds(List.of(1L))
                    .build();

            when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
            when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(anyString(), anyLong(), anyString()))
                    .thenReturn(false);
            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
                Batch b = i.getArgument(0);
                if (b.getBatchId() == null) b.setBatchId(2L);
                return b;
            });
            when(inventoryRepository.save(any())).thenAnswer(i -> i.getArgument(0));
            when(batchRelationRepository.save(any())).thenAnswer(i -> i.getArgument(0));
            when(confirmationRepository.save(any(ProductionConfirmation.class))).thenAnswer(i -> {
                ProductionConfirmation pc = i.getArgument(0);
                pc.setConfirmationId(1L);
                pc.setCreatedOn(LocalDateTime.now());
                return pc;
            });
            when(operationRepository.save(any())).thenAnswer(i -> i.getArgument(0));
            when(equipmentRepository.findAllById(anyList())).thenReturn(List.of());
            when(operatorRepository.findAllById(anyList())).thenReturn(List.of());
            when(batchNumberService.generateBatchNumber(anyString(), anyString())).thenReturn("BATCH-OUT-001");
            when(operationRepository.findNextOperation(anyLong(), anyInt())).thenReturn(Optional.empty());

            // Act
            ProductionConfirmationDTO.Response response = productionService.confirmProduction(request);

            // Assert
            assertNotNull(response.getOutputBatch());
            assertNotNull(response.getOutputBatches());
            assertFalse(response.getOutputBatches().isEmpty());
        }

        @Test
        @DisplayName("7.2 should_setOutputBatchStatusToQualityPending")
        void should_setOutputBatchStatusToQualityPending() {
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
                    .startTime(LocalDateTime.now().minusHours(1))
                    .endTime(LocalDateTime.now())
                    .build();

            when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));
            when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(anyString(), anyLong(), anyString()))
                    .thenReturn(false);
            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
                Batch b = i.getArgument(0);
                if (b.getBatchId() == null) b.setBatchId(2L);
                return b;
            });
            when(inventoryRepository.save(any())).thenAnswer(i -> i.getArgument(0));
            when(batchRelationRepository.save(any())).thenAnswer(i -> i.getArgument(0));
            when(confirmationRepository.save(any(ProductionConfirmation.class))).thenAnswer(i -> {
                ProductionConfirmation pc = i.getArgument(0);
                pc.setConfirmationId(1L);
                pc.setCreatedOn(LocalDateTime.now());
                return pc;
            });
            when(operationRepository.save(any())).thenAnswer(i -> i.getArgument(0));
            when(equipmentRepository.findAllById(anyList())).thenReturn(List.of());
            when(operatorRepository.findAllById(anyList())).thenReturn(List.of());
            when(batchNumberService.generateBatchNumber(anyString(), anyString())).thenReturn("BATCH-OUT-001");
            when(operationRepository.findNextOperation(anyLong(), anyInt())).thenReturn(Optional.empty());

            // Act
            productionService.confirmProduction(request);

            // Assert - verify at least one batch was saved with QUALITY_PENDING status
            verify(batchRepository, atLeastOnce()).save(argThat(batch ->
                    Batch.STATUS_QUALITY_PENDING.equals(batch.getStatus())
            ));
        }
    }

    // ========================================================================
    // 8. REJECTION TESTS
    // ========================================================================

    @Nested
    @DisplayName("8. Rejection Tests")
    class RejectionTests {

        @Test
        @DisplayName("8.1 should_rejectConfirmation_when_validRequest")
        void should_rejectConfirmation_when_validRequest() {
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

            ProductionConfirmationDTO.RejectionRequest request =
                    ProductionConfirmationDTO.RejectionRequest.builder()
                            .confirmationId(1L)
                            .reason("Quality defects found")
                            .notes("Additional notes")
                            .build();

            // Act
            ProductionConfirmationDTO.StatusUpdateResponse response =
                    productionService.rejectConfirmation(request);

            // Assert
            assertNotNull(response);
            assertEquals(1L, response.getConfirmationId());
            assertEquals(ProductionConfirmation.STATUS_CONFIRMED, response.getPreviousStatus());
            assertEquals(ProductionConfirmation.STATUS_REJECTED, response.getNewStatus());
            verify(auditService).logStatusChange(eq("PRODUCTION_CONFIRMATION"), eq(1L),
                    eq(ProductionConfirmation.STATUS_CONFIRMED), eq(ProductionConfirmation.STATUS_REJECTED));
        }

        @Test
        @DisplayName("8.2 should_throwException_when_rejectingAlreadyRejected")
        void should_throwException_when_rejectingAlreadyRejected() {
            // Arrange
            ProductionConfirmation confirmation = ProductionConfirmation.builder()
                    .confirmationId(1L)
                    .status(ProductionConfirmation.STATUS_REJECTED)
                    .build();

            when(confirmationRepository.findById(1L)).thenReturn(Optional.of(confirmation));

            ProductionConfirmationDTO.RejectionRequest request =
                    ProductionConfirmationDTO.RejectionRequest.builder()
                            .confirmationId(1L)
                            .reason("Test reason")
                            .build();

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> productionService.rejectConfirmation(request));

            assertTrue(exception.getMessage().contains("already rejected"));
        }

        @Test
        @DisplayName("8.3 should_throwException_when_confirmationNotFound")
        void should_throwException_when_confirmationNotFound() {
            // Arrange
            when(confirmationRepository.findById(999L)).thenReturn(Optional.empty());

            ProductionConfirmationDTO.RejectionRequest request =
                    ProductionConfirmationDTO.RejectionRequest.builder()
                            .confirmationId(999L)
                            .reason("Test reason")
                            .build();

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> productionService.rejectConfirmation(request));

            assertTrue(exception.getMessage().contains("not found"));
        }
    }
}
