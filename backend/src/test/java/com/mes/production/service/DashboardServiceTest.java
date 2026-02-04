package com.mes.production.service;

import com.mes.production.dto.DashboardDTO;
import com.mes.production.entity.AuditTrail;
import com.mes.production.entity.Operation;
import com.mes.production.entity.Process;
import com.mes.production.entity.OrderLineItem;
import com.mes.production.entity.ProductionConfirmation;
import com.mes.production.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

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
    private AuditService auditService;

    @InjectMocks
    private DashboardService dashboardService;

    private ProductionConfirmation testConfirmation;
    private Operation testOperation;
    private AuditTrail testAuditTrail;

    @BeforeEach
    void setUp() {
        testAuditTrail = AuditTrail.builder()
                .auditId(1L)
                .entityType("BATCH")
                .entityId(1L)
                .action("CREATE")
                .changedBy("admin")
                .timestamp(LocalDateTime.now())
                .build();
        OrderLineItem testOrderLine = OrderLineItem.builder()
                .orderLineId(1L)
                .productSku("TEST-SKU")
                .productName("Test Product")
                .build();

        Process testProcess = Process.builder()
                .processId(1L)
                .stageName("Test Stage")
                .orderLineItem(testOrderLine)
                .build();

        testOperation = Operation.builder()
                .operationId(1L)
                .operationName("Test Operation")
                .process(testProcess)
                .build();

        testConfirmation = ProductionConfirmation.builder()
                .confirmationId(1L)
                .operation(testOperation)
                .producedQty(BigDecimal.valueOf(100))
                .createdOn(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should return dashboard summary with all counts")
    void getDashboardSummary_ReturnsAllCounts() {
        // Arrange
        when(orderRepository.count()).thenReturn(10L);
        when(orderRepository.countByStatusIn(anyList())).thenReturn(5L);
        when(operationRepository.countByStatus("READY")).thenReturn(3L);
        when(operationRepository.countByStatus("IN_PROGRESS")).thenReturn(2L);
        when(holdRecordRepository.countByStatus("ACTIVE")).thenReturn(1L);
        when(confirmationRepository.countByCreatedOnAfter(any(LocalDateTime.class))).thenReturn(8L);
        when(processRepository.findByStatus(Process.STATUS_QUALITY_PENDING)).thenReturn(List.of());
        when(confirmationRepository.findRecentConfirmations(any(Pageable.class))).thenReturn(List.of(testConfirmation));
        when(auditService.getRecentActivity(10)).thenReturn(List.of(testAuditTrail));

        // Act
        DashboardDTO.Summary result = dashboardService.getDashboardSummary();

        // Assert
        assertNotNull(result);
        assertEquals(10L, result.getTotalOrders());
        assertEquals(5L, result.getOrdersInProgress());
        assertEquals(3L, result.getOperationsReady());
        assertEquals(2L, result.getOperationsInProgress());
        assertEquals(1L, result.getActiveHolds());
        assertEquals(8L, result.getTodayConfirmations());
        assertEquals(0L, result.getQualityPendingProcesses());
        assertNotNull(result.getRecentActivity());
        assertFalse(result.getRecentActivity().isEmpty());
        assertNotNull(result.getAuditActivity());
        assertFalse(result.getAuditActivity().isEmpty());
    }

    @Test
    @DisplayName("Should return recent activity with limited results")
    void getRecentActivity_ReturnsLimitedResults() {
        // Arrange
        when(confirmationRepository.findRecentConfirmations(any(Pageable.class))).thenReturn(List.of(testConfirmation));

        // Act
        List<DashboardDTO.RecentActivity> result = dashboardService.getRecentActivity(5);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getConfirmationId());
        assertEquals("Test Operation", result.get(0).getOperationName());
        assertEquals(BigDecimal.valueOf(100), result.get(0).getProducedQty());
    }

    @Test
    @DisplayName("Should return empty recent activity when no confirmations")
    void getRecentActivity_NoConfirmations_ReturnsEmptyList() {
        // Arrange
        when(confirmationRepository.findRecentConfirmations(any(Pageable.class))).thenReturn(List.of());

        // Act
        List<DashboardDTO.RecentActivity> result = dashboardService.getRecentActivity(5);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should handle zero counts in dashboard summary")
    void getDashboardSummary_ZeroCounts_HandlesGracefully() {
        // Arrange
        when(orderRepository.count()).thenReturn(0L);
        when(orderRepository.countByStatusIn(anyList())).thenReturn(0L);
        when(operationRepository.countByStatus("READY")).thenReturn(0L);
        when(operationRepository.countByStatus("IN_PROGRESS")).thenReturn(0L);
        when(holdRecordRepository.countByStatus("ACTIVE")).thenReturn(0L);
        when(confirmationRepository.countByCreatedOnAfter(any(LocalDateTime.class))).thenReturn(0L);
        when(processRepository.findByStatus(Process.STATUS_QUALITY_PENDING)).thenReturn(List.of());
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
        assertEquals(0L, result.getQualityPendingProcesses());
        assertTrue(result.getRecentActivity().isEmpty());
        assertTrue(result.getAuditActivity().isEmpty());
    }

    @Test
    @DisplayName("Should return audit activity with proper formatting")
    void getRecentAuditActivity_ReturnsFormattedActivity() {
        // Arrange
        AuditTrail createAudit = AuditTrail.builder()
                .auditId(1L)
                .entityType("BATCH")
                .entityId(1L)
                .action("CREATE")
                .changedBy("admin")
                .timestamp(LocalDateTime.now())
                .build();

        AuditTrail statusAudit = AuditTrail.builder()
                .auditId(2L)
                .entityType("OPERATION")
                .entityId(2L)
                .action("STATUS_CHANGE")
                .oldValue("READY")
                .newValue("CONFIRMED")
                .changedBy("operator1")
                .timestamp(LocalDateTime.now())
                .build();

        when(auditService.getRecentActivity(10)).thenReturn(List.of(createAudit, statusAudit));

        // Act
        List<DashboardDTO.AuditActivity> result = dashboardService.getRecentAuditActivity(10);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());

        // Verify CREATE action
        DashboardDTO.AuditActivity createResult = result.get(0);
        assertEquals("CREATE", createResult.getAction());
        assertEquals("BATCH", createResult.getEntityType());
        assertEquals("admin", createResult.getChangedBy());
        assertTrue(createResult.getDescription().contains("Created"));

        // Verify STATUS_CHANGE action
        DashboardDTO.AuditActivity statusResult = result.get(1);
        assertEquals("STATUS_CHANGE", statusResult.getAction());
        assertEquals("OPERATION", statusResult.getEntityType());
        assertTrue(statusResult.getDescription().contains("READY"));
        assertTrue(statusResult.getDescription().contains("CONFIRMED"));
    }

    @Test
    @DisplayName("Should format audit descriptions correctly for different actions")
    void getRecentAuditActivity_FormatsDescriptionsCorrectly() {
        // Arrange
        AuditTrail holdAudit = AuditTrail.builder()
                .auditId(3L)
                .entityType("INVENTORY")
                .entityId(5L)
                .action("HOLD")
                .changedBy("supervisor")
                .timestamp(LocalDateTime.now())
                .build();

        AuditTrail releaseAudit = AuditTrail.builder()
                .auditId(4L)
                .entityType("BATCH")
                .entityId(6L)
                .action("RELEASE")
                .changedBy("supervisor")
                .timestamp(LocalDateTime.now())
                .build();

        when(auditService.getRecentActivity(10)).thenReturn(List.of(holdAudit, releaseAudit));

        // Act
        List<DashboardDTO.AuditActivity> result = dashboardService.getRecentAuditActivity(10);

        // Assert
        assertEquals(2, result.size());
        assertTrue(result.get(0).getDescription().contains("hold"));
        assertTrue(result.get(1).getDescription().contains("Released"));
    }
}
