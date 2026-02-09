package com.mes.production.service;

import com.mes.production.dto.DashboardDTO;
import com.mes.production.entity.AuditTrail;
import com.mes.production.entity.Batch;
import com.mes.production.entity.Operation;
import com.mes.production.entity.Order;
import com.mes.production.entity.OrderLineItem;
import com.mes.production.entity.Process;
import com.mes.production.entity.ProductionConfirmation;
import com.mes.production.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Comprehensive test suite for DashboardService.
 *
 * Test Categories:
 * 1. getDashboardSummary() - All metrics calculation
 * 2. getRecentActivity() - Recent confirmations
 * 3. getRecentAuditActivity() - Audit trail formatting
 * 4. Edge Cases - Empty data, null handling
 * 5. Different Data Scenarios - Various counts and combinations
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DashboardService Comprehensive Tests")
class DashboardServiceComprehensiveTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OperationRepository operationRepository;

    @Mock
    private ProcessRepository processRepository;

    @Mock
    private HoldRecordRepository holdRecordRepository;

    @Mock
    private ProductionConfirmationRepository confirmationRepository;

    @Mock
    private BatchRepository batchRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private DashboardService dashboardService;

    private ProductionConfirmation testConfirmation;
    private Operation testOperation;
    private OrderLineItem testOrderLine;

    @BeforeEach
    void setUp() {
        Order testOrder = Order.builder()
                .orderId(1L)
                .orderNumber("ORD-001")
                .customerId("CUST-001")
                .status("IN_PROGRESS")
                .build();

        testOrderLine = OrderLineItem.builder()
                .orderLineId(1L)
                .order(testOrder)
                .productSku("STEEL-001")
                .productName("Steel Coil")
                .build();

        Process testProcess = Process.builder()
                .processId(1L)
                .processName("Melting Stage")
                .build();

        testOperation = Operation.builder()
                .operationId(1L)
                .operationName("Melting")
                .process(testProcess)
                .orderLineItem(testOrderLine)
                .build();

        testConfirmation = ProductionConfirmation.builder()
                .confirmationId(1L)
                .operation(testOperation)
                .producedQty(BigDecimal.valueOf(100))
                .createdOn(LocalDateTime.now())
                .build();
    }

    // ========================================================================
    // 1. GET DASHBOARD SUMMARY - ALL METRICS
    // ========================================================================

    @Nested
    @DisplayName("1. getDashboardSummary() Tests")
    class GetDashboardSummaryTests {

        @Test
        @DisplayName("1.1 should_returnAllMetrics_when_dataExists")
        void should_returnAllMetrics_when_dataExists() {
            // Arrange
            when(orderRepository.count()).thenReturn(25L);
            when(orderRepository.countByStatusIn(anyList())).thenReturn(15L);
            when(operationRepository.countByStatus("READY")).thenReturn(8L);
            when(operationRepository.countByStatus("IN_PROGRESS")).thenReturn(5L);
            when(holdRecordRepository.countByStatus("ACTIVE")).thenReturn(3L);
            when(confirmationRepository.countByCreatedOnAfter(any(LocalDateTime.class))).thenReturn(12L);
            when(batchRepository.countByStatus(Batch.STATUS_QUALITY_PENDING)).thenReturn(4L);
            when(confirmationRepository.findRecentConfirmations(any(Pageable.class))).thenReturn(List.of(testConfirmation));
            when(auditService.getRecentActivity(10)).thenReturn(List.of());

            // Act
            DashboardDTO.Summary result = dashboardService.getDashboardSummary();

            // Assert
            assertNotNull(result);
            assertEquals(25L, result.getTotalOrders());
            assertEquals(15L, result.getOrdersInProgress());
            assertEquals(8L, result.getOperationsReady());
            assertEquals(5L, result.getOperationsInProgress());
            assertEquals(3L, result.getActiveHolds());
            assertEquals(12L, result.getTodayConfirmations());
            assertEquals(4L, result.getBatchesPendingApproval());
            assertEquals(0L, result.getQualityPendingProcesses()); // Always 0 per design
        }

        @Test
        @DisplayName("1.2 should_returnZeroCountsGracefully_when_noDataExists")
        void should_returnZeroCountsGracefully_when_noDataExists() {
            // Arrange
            when(orderRepository.count()).thenReturn(0L);
            when(orderRepository.countByStatusIn(anyList())).thenReturn(0L);
            when(operationRepository.countByStatus("READY")).thenReturn(0L);
            when(operationRepository.countByStatus("IN_PROGRESS")).thenReturn(0L);
            when(holdRecordRepository.countByStatus("ACTIVE")).thenReturn(0L);
            when(confirmationRepository.countByCreatedOnAfter(any(LocalDateTime.class))).thenReturn(0L);
            when(batchRepository.countByStatus(any())).thenReturn(0L);
            when(confirmationRepository.findRecentConfirmations(any(Pageable.class))).thenReturn(List.of());
            when(auditService.getRecentActivity(10)).thenReturn(List.of());

            // Act
            DashboardDTO.Summary result = dashboardService.getDashboardSummary();

            // Assert
            assertNotNull(result);
            assertEquals(0L, result.getTotalOrders());
            assertEquals(0L, result.getOperationsReady());
            assertEquals(0L, result.getActiveHolds());
            assertEquals(0L, result.getTodayConfirmations());
            assertTrue(result.getRecentActivity().isEmpty());
            assertTrue(result.getAuditActivity().isEmpty());
        }

        @Test
        @DisplayName("1.3 should_includeRecentActivity_when_confirmationsExist")
        void should_includeRecentActivity_when_confirmationsExist() {
            // Arrange
            List<ProductionConfirmation> confirmations = List.of(
                    testConfirmation,
                    ProductionConfirmation.builder()
                            .confirmationId(2L)
                            .operation(testOperation)
                            .producedQty(BigDecimal.valueOf(200))
                            .createdOn(LocalDateTime.now().minusHours(1))
                            .build()
            );

            when(orderRepository.count()).thenReturn(1L);
            when(orderRepository.countByStatusIn(anyList())).thenReturn(1L);
            when(operationRepository.countByStatus(any())).thenReturn(0L);
            when(holdRecordRepository.countByStatus(any())).thenReturn(0L);
            when(confirmationRepository.countByCreatedOnAfter(any())).thenReturn(2L);
            when(batchRepository.countByStatus(any())).thenReturn(0L);
            when(confirmationRepository.findRecentConfirmations(any(Pageable.class))).thenReturn(confirmations);
            when(auditService.getRecentActivity(10)).thenReturn(List.of());

            // Act
            DashboardDTO.Summary result = dashboardService.getDashboardSummary();

            // Assert
            assertNotNull(result.getRecentActivity());
            assertEquals(2, result.getRecentActivity().size());
        }

        @Test
        @DisplayName("1.4 should_includeAuditActivity_when_auditTrailExists")
        void should_includeAuditActivity_when_auditTrailExists() {
            // Arrange
            AuditTrail audit1 = AuditTrail.builder()
                    .auditId(1L)
                    .entityType("BATCH")
                    .entityId(1L)
                    .action("CREATE")
                    .changedBy("admin")
                    .timestamp(LocalDateTime.now())
                    .build();

            AuditTrail audit2 = AuditTrail.builder()
                    .auditId(2L)
                    .entityType("OPERATION")
                    .entityId(2L)
                    .action("STATUS_CHANGE")
                    .oldValue("READY")
                    .newValue("CONFIRMED")
                    .changedBy("operator")
                    .timestamp(LocalDateTime.now().minusMinutes(5))
                    .build();

            when(orderRepository.count()).thenReturn(1L);
            when(orderRepository.countByStatusIn(anyList())).thenReturn(1L);
            when(operationRepository.countByStatus(any())).thenReturn(0L);
            when(holdRecordRepository.countByStatus(any())).thenReturn(0L);
            when(confirmationRepository.countByCreatedOnAfter(any())).thenReturn(0L);
            when(batchRepository.countByStatus(any())).thenReturn(0L);
            when(confirmationRepository.findRecentConfirmations(any(Pageable.class))).thenReturn(List.of());
            when(auditService.getRecentActivity(10)).thenReturn(List.of(audit1, audit2));

            // Act
            DashboardDTO.Summary result = dashboardService.getDashboardSummary();

            // Assert
            assertNotNull(result.getAuditActivity());
            assertEquals(2, result.getAuditActivity().size());
        }
    }

    // ========================================================================
    // 2. GET RECENT ACTIVITY TESTS
    // ========================================================================

    @Nested
    @DisplayName("2. getRecentActivity() Tests")
    class GetRecentActivityTests {

        @Test
        @DisplayName("2.1 should_returnLimitedResults_when_manyConfirmationsExist")
        void should_returnLimitedResults_when_manyConfirmationsExist() {
            // Arrange
            List<ProductionConfirmation> confirmations = new ArrayList<>();
            for (int i = 0; i < 10; i++) {
                confirmations.add(ProductionConfirmation.builder()
                        .confirmationId((long) i)
                        .operation(testOperation)
                        .producedQty(BigDecimal.valueOf(100 + i))
                        .createdOn(LocalDateTime.now().minusHours(i))
                        .build());
            }

            when(confirmationRepository.findRecentConfirmations(any(Pageable.class))).thenReturn(confirmations.subList(0, 5));

            // Act
            List<DashboardDTO.RecentActivity> result = dashboardService.getRecentActivity(5);

            // Assert
            assertNotNull(result);
            assertEquals(5, result.size());
        }

        @Test
        @DisplayName("2.2 should_returnEmptyList_when_noConfirmationsExist")
        void should_returnEmptyList_when_noConfirmationsExist() {
            // Arrange
            when(confirmationRepository.findRecentConfirmations(any(Pageable.class))).thenReturn(List.of());

            // Act
            List<DashboardDTO.RecentActivity> result = dashboardService.getRecentActivity(5);

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("2.3 should_mapFieldsCorrectly_when_confirmationHasAllData")
        void should_mapFieldsCorrectly_when_confirmationHasAllData() {
            // Arrange
            when(confirmationRepository.findRecentConfirmations(any(Pageable.class)))
                    .thenReturn(List.of(testConfirmation));

            // Act
            List<DashboardDTO.RecentActivity> result = dashboardService.getRecentActivity(5);

            // Assert
            assertFalse(result.isEmpty());
            DashboardDTO.RecentActivity activity = result.get(0);
            assertEquals(1L, activity.getConfirmationId());
            assertEquals("Melting", activity.getOperationName());
            assertEquals("STEEL-001", activity.getProductSku());
            assertEquals(BigDecimal.valueOf(100), activity.getProducedQty());
            assertNotNull(activity.getConfirmedAt());
        }

        @Test
        @DisplayName("2.4 should_handleNullOrderLineItem_when_operationHasNoOrder")
        void should_handleNullOrderLineItem_when_operationHasNoOrder() {
            // Arrange
            Operation operationWithoutOrder = Operation.builder()
                    .operationId(2L)
                    .operationName("Standalone Op")
                    .orderLineItem(null)
                    .build();

            ProductionConfirmation confirmationWithoutOrder = ProductionConfirmation.builder()
                    .confirmationId(2L)
                    .operation(operationWithoutOrder)
                    .producedQty(BigDecimal.valueOf(50))
                    .createdOn(LocalDateTime.now())
                    .build();

            when(confirmationRepository.findRecentConfirmations(any(Pageable.class)))
                    .thenReturn(List.of(confirmationWithoutOrder));

            // Act
            List<DashboardDTO.RecentActivity> result = dashboardService.getRecentActivity(5);

            // Assert
            assertFalse(result.isEmpty());
            assertEquals("", result.get(0).getProductSku());
        }
    }

    // ========================================================================
    // 3. GET RECENT AUDIT ACTIVITY TESTS
    // ========================================================================

    @Nested
    @DisplayName("3. getRecentAuditActivity() Tests")
    class GetRecentAuditActivityTests {

        @Test
        @DisplayName("3.1 should_formatCREATEAction_correctly")
        void should_formatCREATEAction_correctly() {
            // Arrange
            AuditTrail createAudit = AuditTrail.builder()
                    .auditId(1L)
                    .entityType("BATCH")
                    .entityId(123L)
                    .action("CREATE")
                    .changedBy("admin")
                    .timestamp(LocalDateTime.now())
                    .build();

            when(auditService.getRecentActivity(10)).thenReturn(List.of(createAudit));

            // Act
            List<DashboardDTO.AuditActivity> result = dashboardService.getRecentAuditActivity(10);

            // Assert
            assertFalse(result.isEmpty());
            DashboardDTO.AuditActivity activity = result.get(0);
            assertEquals("CREATE", activity.getAction());
            assertTrue(activity.getDescription().contains("Created"));
            assertTrue(activity.getDescription().contains("batch"));
            assertTrue(activity.getDescription().contains("123"));
        }

        @Test
        @DisplayName("3.2 should_formatSTATUS_CHANGEAction_correctly")
        void should_formatSTATUS_CHANGEAction_correctly() {
            // Arrange
            AuditTrail statusAudit = AuditTrail.builder()
                    .auditId(2L)
                    .entityType("OPERATION")
                    .entityId(456L)
                    .action("STATUS_CHANGE")
                    .oldValue("READY")
                    .newValue("IN_PROGRESS")
                    .changedBy("operator")
                    .timestamp(LocalDateTime.now())
                    .build();

            when(auditService.getRecentActivity(10)).thenReturn(List.of(statusAudit));

            // Act
            List<DashboardDTO.AuditActivity> result = dashboardService.getRecentAuditActivity(10);

            // Assert
            assertFalse(result.isEmpty());
            DashboardDTO.AuditActivity activity = result.get(0);
            assertEquals("STATUS_CHANGE", activity.getAction());
            assertTrue(activity.getDescription().contains("READY"));
            assertTrue(activity.getDescription().contains("IN_PROGRESS"));
        }

        @Test
        @DisplayName("3.3 should_formatHOLDAction_correctly")
        void should_formatHOLDAction_correctly() {
            // Arrange
            AuditTrail holdAudit = AuditTrail.builder()
                    .auditId(3L)
                    .entityType("INVENTORY")
                    .entityId(789L)
                    .action("HOLD")
                    .changedBy("supervisor")
                    .timestamp(LocalDateTime.now())
                    .build();

            when(auditService.getRecentActivity(10)).thenReturn(List.of(holdAudit));

            // Act
            List<DashboardDTO.AuditActivity> result = dashboardService.getRecentAuditActivity(10);

            // Assert
            assertFalse(result.isEmpty());
            assertTrue(result.get(0).getDescription().toLowerCase().contains("hold"));
        }

        @Test
        @DisplayName("3.4 should_formatRELEASEAction_correctly")
        void should_formatRELEASEAction_correctly() {
            // Arrange
            AuditTrail releaseAudit = AuditTrail.builder()
                    .auditId(4L)
                    .entityType("BATCH")
                    .entityId(101L)
                    .action("RELEASE")
                    .changedBy("supervisor")
                    .timestamp(LocalDateTime.now())
                    .build();

            when(auditService.getRecentActivity(10)).thenReturn(List.of(releaseAudit));

            // Act
            List<DashboardDTO.AuditActivity> result = dashboardService.getRecentAuditActivity(10);

            // Assert
            assertFalse(result.isEmpty());
            assertTrue(result.get(0).getDescription().contains("Released"));
        }

        @Test
        @DisplayName("3.5 should_formatCONSUMEAction_correctly")
        void should_formatCONSUMEAction_correctly() {
            // Arrange
            AuditTrail consumeAudit = AuditTrail.builder()
                    .auditId(5L)
                    .entityType("INVENTORY")
                    .entityId(202L)
                    .action("CONSUME")
                    .changedBy("operator")
                    .timestamp(LocalDateTime.now())
                    .build();

            when(auditService.getRecentActivity(10)).thenReturn(List.of(consumeAudit));

            // Act
            List<DashboardDTO.AuditActivity> result = dashboardService.getRecentAuditActivity(10);

            // Assert
            assertFalse(result.isEmpty());
            assertTrue(result.get(0).getDescription().contains("Consumed"));
        }

        @Test
        @DisplayName("3.6 should_formatPRODUCEAction_correctly")
        void should_formatPRODUCEAction_correctly() {
            // Arrange
            AuditTrail produceAudit = AuditTrail.builder()
                    .auditId(6L)
                    .entityType("BATCH")
                    .entityId(303L)
                    .action("PRODUCE")
                    .changedBy("operator")
                    .timestamp(LocalDateTime.now())
                    .build();

            when(auditService.getRecentActivity(10)).thenReturn(List.of(produceAudit));

            // Act
            List<DashboardDTO.AuditActivity> result = dashboardService.getRecentAuditActivity(10);

            // Assert
            assertFalse(result.isEmpty());
            assertTrue(result.get(0).getDescription().contains("Produced"));
        }

        @Test
        @DisplayName("3.7 should_handleUnknownAction_gracefully")
        void should_handleUnknownAction_gracefully() {
            // Arrange
            AuditTrail unknownAudit = AuditTrail.builder()
                    .auditId(7L)
                    .entityType("CUSTOM")
                    .entityId(404L)
                    .action("CUSTOM_ACTION")
                    .changedBy("system")
                    .timestamp(LocalDateTime.now())
                    .build();

            when(auditService.getRecentActivity(10)).thenReturn(List.of(unknownAudit));

            // Act
            List<DashboardDTO.AuditActivity> result = dashboardService.getRecentAuditActivity(10);

            // Assert
            assertFalse(result.isEmpty());
            assertNotNull(result.get(0).getDescription());
            assertTrue(result.get(0).getDescription().contains("CUSTOM_ACTION"));
        }

        @Test
        @DisplayName("3.8 should_returnEmptyList_when_noAuditTrail")
        void should_returnEmptyList_when_noAuditTrail() {
            // Arrange
            when(auditService.getRecentActivity(10)).thenReturn(List.of());

            // Act
            List<DashboardDTO.AuditActivity> result = dashboardService.getRecentAuditActivity(10);

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    // ========================================================================
    // 4. EDGE CASES
    // ========================================================================

    @Nested
    @DisplayName("4. Edge Cases")
    class EdgeCaseTests {

        @Test
        @DisplayName("4.1 should_handleNullEntityType_gracefully")
        void should_handleNullEntityType_gracefully() {
            // Arrange
            AuditTrail auditWithNullType = AuditTrail.builder()
                    .auditId(1L)
                    .entityType(null)
                    .entityId(1L)
                    .action("CREATE")
                    .changedBy("admin")
                    .timestamp(LocalDateTime.now())
                    .build();

            when(auditService.getRecentActivity(10)).thenReturn(List.of(auditWithNullType));

            // Act & Assert - should not throw
            assertDoesNotThrow(() -> dashboardService.getRecentAuditActivity(10));
        }

        @Test
        @DisplayName("4.2 should_handleNullOperation_inConfirmation")
        void should_handleNullOperation_inConfirmation() {
            // Arrange
            ProductionConfirmation confirmationWithNullOp = ProductionConfirmation.builder()
                    .confirmationId(1L)
                    .operation(null)
                    .producedQty(BigDecimal.valueOf(100))
                    .createdOn(LocalDateTime.now())
                    .build();

            when(confirmationRepository.findRecentConfirmations(any(Pageable.class)))
                    .thenReturn(List.of(confirmationWithNullOp));

            // Act
            List<DashboardDTO.RecentActivity> result = dashboardService.getRecentActivity(5);

            // Assert
            assertFalse(result.isEmpty());
            assertEquals("", result.get(0).getOperationName());
        }

        @Test
        @DisplayName("4.3 should_handleLargeNumbers_inCounts")
        void should_handleLargeNumbers_inCounts() {
            // Arrange
            when(orderRepository.count()).thenReturn(Long.MAX_VALUE);
            when(orderRepository.countByStatusIn(anyList())).thenReturn(999999999L);
            when(operationRepository.countByStatus("READY")).thenReturn(Long.MAX_VALUE);
            when(operationRepository.countByStatus("IN_PROGRESS")).thenReturn(Long.MAX_VALUE);
            when(holdRecordRepository.countByStatus(any())).thenReturn(0L);
            when(confirmationRepository.countByCreatedOnAfter(any())).thenReturn(Long.MAX_VALUE);
            when(batchRepository.countByStatus(any())).thenReturn(0L);
            when(confirmationRepository.findRecentConfirmations(any())).thenReturn(List.of());
            when(auditService.getRecentActivity(10)).thenReturn(List.of());

            // Act
            DashboardDTO.Summary result = dashboardService.getDashboardSummary();

            // Assert
            assertEquals(Long.MAX_VALUE, result.getTotalOrders());
            assertEquals(Long.MAX_VALUE, result.getOperationsReady());
        }
    }

    // ========================================================================
    // 5. DIFFERENT DATA SCENARIOS
    // ========================================================================

    @Nested
    @DisplayName("5. Different Data Scenarios")
    class DifferentDataScenariosTests {

        @Test
        @DisplayName("5.1 should_reflectHighHoldCount_when_manyActiveHolds")
        void should_reflectHighHoldCount_when_manyActiveHolds() {
            // Arrange
            when(orderRepository.count()).thenReturn(10L);
            when(orderRepository.countByStatusIn(anyList())).thenReturn(5L);
            when(operationRepository.countByStatus("READY")).thenReturn(3L);
            when(operationRepository.countByStatus("IN_PROGRESS")).thenReturn(2L);
            when(holdRecordRepository.countByStatus("ACTIVE")).thenReturn(50L); // High hold count
            when(confirmationRepository.countByCreatedOnAfter(any())).thenReturn(0L);
            when(batchRepository.countByStatus(any())).thenReturn(0L);
            when(confirmationRepository.findRecentConfirmations(any())).thenReturn(List.of());
            when(auditService.getRecentActivity(10)).thenReturn(List.of());

            // Act
            DashboardDTO.Summary result = dashboardService.getDashboardSummary();

            // Assert
            assertEquals(50L, result.getActiveHolds());
        }

        @Test
        @DisplayName("5.2 should_reflectBusyDay_when_manyTodayConfirmations")
        void should_reflectBusyDay_when_manyTodayConfirmations() {
            // Arrange
            when(orderRepository.count()).thenReturn(100L);
            when(orderRepository.countByStatusIn(anyList())).thenReturn(80L);
            when(operationRepository.countByStatus("READY")).thenReturn(20L);
            when(operationRepository.countByStatus("IN_PROGRESS")).thenReturn(15L);
            when(holdRecordRepository.countByStatus("ACTIVE")).thenReturn(2L);
            when(confirmationRepository.countByCreatedOnAfter(any())).thenReturn(150L); // Busy day
            when(batchRepository.countByStatus(any())).thenReturn(10L);
            when(confirmationRepository.findRecentConfirmations(any())).thenReturn(List.of());
            when(auditService.getRecentActivity(10)).thenReturn(List.of());

            // Act
            DashboardDTO.Summary result = dashboardService.getDashboardSummary();

            // Assert
            assertEquals(150L, result.getTodayConfirmations());
        }

        @Test
        @DisplayName("5.3 should_showPendingApprovals_when_batchesAwaitingApproval")
        void should_showPendingApprovals_when_batchesAwaitingApproval() {
            // Arrange
            when(orderRepository.count()).thenReturn(5L);
            when(orderRepository.countByStatusIn(anyList())).thenReturn(3L);
            when(operationRepository.countByStatus("READY")).thenReturn(1L);
            when(operationRepository.countByStatus("IN_PROGRESS")).thenReturn(1L);
            when(holdRecordRepository.countByStatus("ACTIVE")).thenReturn(0L);
            when(confirmationRepository.countByCreatedOnAfter(any())).thenReturn(5L);
            when(batchRepository.countByStatus(Batch.STATUS_QUALITY_PENDING)).thenReturn(25L);
            when(confirmationRepository.findRecentConfirmations(any())).thenReturn(List.of());
            when(auditService.getRecentActivity(10)).thenReturn(List.of());

            // Act
            DashboardDTO.Summary result = dashboardService.getDashboardSummary();

            // Assert
            assertEquals(25L, result.getBatchesPendingApproval());
        }
    }
}
