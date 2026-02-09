package com.mes.production.service;

import com.mes.production.dto.ReportAnalyticsDTO;
import com.mes.production.entity.*;
import com.mes.production.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportAnalyticsServiceTest {

    @Mock
    private ProductionConfirmationRepository confirmationRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private HoldRecordRepository holdRecordRepository;

    @Mock
    private OperationRepository operationRepository;

    @InjectMocks
    private ReportAnalyticsService reportAnalyticsService;

    private LocalDate startDate;
    private LocalDate endDate;
    private Operation meltingOperation;
    private Operation castingOperation;
    private ProductionConfirmation confirmation1;
    private ProductionConfirmation confirmation2;
    private OrderLineItem lineItem;

    @BeforeEach
    void setUp() {
        startDate = LocalDate.of(2026, 1, 1);
        endDate = LocalDate.of(2026, 1, 31);

        lineItem = OrderLineItem.builder()
                .orderLineId(1L)
                .productSku("STEEL-001")
                .productName("Steel Rod")
                .deliveryDate(LocalDate.of(2026, 2, 15))
                .build();

        meltingOperation = Operation.builder()
                .operationId(1L)
                .operationName("Melting")
                .operationType("FURNACE")
                .orderLineItem(lineItem)
                .build();

        castingOperation = Operation.builder()
                .operationId(2L)
                .operationName("Casting")
                .operationType("CASTER")
                .orderLineItem(lineItem)
                .build();

        confirmation1 = ProductionConfirmation.builder()
                .confirmationId(1L)
                .operation(meltingOperation)
                .producedQty(new BigDecimal("100.00"))
                .scrapQty(new BigDecimal("5.00"))
                .startTime(LocalDateTime.of(2026, 1, 15, 8, 0))
                .endTime(LocalDateTime.of(2026, 1, 15, 10, 30))
                .status("CONFIRMED")
                .createdOn(LocalDateTime.of(2026, 1, 15, 10, 30))
                .build();

        confirmation2 = ProductionConfirmation.builder()
                .confirmationId(2L)
                .operation(castingOperation)
                .producedQty(new BigDecimal("90.00"))
                .scrapQty(new BigDecimal("10.00"))
                .startTime(LocalDateTime.of(2026, 1, 16, 9, 0))
                .endTime(LocalDateTime.of(2026, 1, 16, 12, 0))
                .status("CONFIRMED")
                .createdOn(LocalDateTime.of(2026, 1, 16, 12, 0))
                .build();
    }

    // ========== getProductionSummary ==========

    @Test
    @DisplayName("Should return production summary with correct totals")
    void getProductionSummary_WithData_ReturnsCorrectTotals() {
        when(confirmationRepository.findByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(confirmation1, confirmation2));

        ReportAnalyticsDTO.ProductionSummary result = reportAnalyticsService.getProductionSummary(startDate, endDate);

        assertNotNull(result);
        assertEquals(startDate, result.getStartDate());
        assertEquals(endDate, result.getEndDate());
        assertEquals(new BigDecimal("190.00"), result.getTotalProduced());
        assertEquals(new BigDecimal("15.00"), result.getTotalScrap());
        assertEquals(2L, result.getConfirmationCount());
        // Yield = 190 / (190+15) * 100 = 92.68%
        assertTrue(result.getYieldPercentage().compareTo(BigDecimal.ZERO) > 0);
        assertTrue(result.getAvgCycleTimeMinutes().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    @DisplayName("Should return zero production summary when no confirmations")
    void getProductionSummary_NoData_ReturnsZeros() {
        when(confirmationRepository.findByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());

        ReportAnalyticsDTO.ProductionSummary result = reportAnalyticsService.getProductionSummary(startDate, endDate);

        assertNotNull(result);
        assertEquals(BigDecimal.ZERO, result.getTotalProduced());
        assertEquals(BigDecimal.ZERO, result.getTotalScrap());
        assertEquals(BigDecimal.ZERO, result.getYieldPercentage());
        assertEquals(BigDecimal.ZERO, result.getAvgCycleTimeMinutes());
        assertEquals(0L, result.getConfirmationCount());
    }

    @Test
    @DisplayName("Should calculate yield percentage correctly")
    void getProductionSummary_CalculatesYieldCorrectly() {
        // 100 produced + 5 scrap = 105 total input -> yield = 100/105 * 100 = 95.24%
        when(confirmationRepository.findByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(confirmation1));

        ReportAnalyticsDTO.ProductionSummary result = reportAnalyticsService.getProductionSummary(startDate, endDate);

        // 100 / (100 + 5) * 100 = 95.24
        assertEquals(0, new BigDecimal("95.24").compareTo(result.getYieldPercentage()));
    }

    // ========== getProductionByOperation ==========

    @Test
    @DisplayName("Should return production grouped by operation type")
    void getProductionByOperation_WithData_ReturnsGrouped() {
        when(confirmationRepository.findByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(confirmation1, confirmation2));

        ReportAnalyticsDTO.ProductionByOperation result =
                reportAnalyticsService.getProductionByOperation(startDate, endDate);

        assertNotNull(result);
        assertEquals(2, result.getEntries().size());

        // Find FURNACE entry
        ReportAnalyticsDTO.OperationProductionEntry furnace = result.getEntries().stream()
                .filter(e -> "FURNACE".equals(e.getOperationType()))
                .findFirst().orElse(null);
        assertNotNull(furnace);
        assertEquals(1L, furnace.getConfirmationCount());
        assertEquals(new BigDecimal("100.00"), furnace.getTotalProduced());

        // Find CASTER entry
        ReportAnalyticsDTO.OperationProductionEntry caster = result.getEntries().stream()
                .filter(e -> "CASTER".equals(e.getOperationType()))
                .findFirst().orElse(null);
        assertNotNull(caster);
        assertEquals(1L, caster.getConfirmationCount());
        assertEquals(new BigDecimal("90.00"), caster.getTotalProduced());
    }

    @Test
    @DisplayName("Should return empty entries when no confirmations")
    void getProductionByOperation_NoData_ReturnsEmpty() {
        when(confirmationRepository.findByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());

        ReportAnalyticsDTO.ProductionByOperation result =
                reportAnalyticsService.getProductionByOperation(startDate, endDate);

        assertNotNull(result);
        assertTrue(result.getEntries().isEmpty());
    }

    @Test
    @DisplayName("Should group confirmations with null operation type as UNKNOWN")
    void getProductionByOperation_NullOperationType_GroupsAsUnknown() {
        Operation unknownOp = Operation.builder().operationId(99L).operationName("Test").build();
        ProductionConfirmation pc = ProductionConfirmation.builder()
                .confirmationId(99L)
                .operation(unknownOp)
                .producedQty(new BigDecimal("50.00"))
                .scrapQty(BigDecimal.ZERO)
                .startTime(LocalDateTime.of(2026, 1, 20, 8, 0))
                .endTime(LocalDateTime.of(2026, 1, 20, 10, 0))
                .build();

        when(confirmationRepository.findByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(pc));

        ReportAnalyticsDTO.ProductionByOperation result =
                reportAnalyticsService.getProductionByOperation(startDate, endDate);

        assertEquals(1, result.getEntries().size());
        assertEquals("UNKNOWN", result.getEntries().get(0).getOperationType());
    }

    // ========== getScrapAnalysis ==========

    @Test
    @DisplayName("Should return scrap analysis with product and operation breakdowns")
    void getScrapAnalysis_WithData_ReturnsBreakdowns() {
        when(confirmationRepository.findByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(confirmation1, confirmation2));

        ReportAnalyticsDTO.ScrapAnalysis result = reportAnalyticsService.getScrapAnalysis(startDate, endDate);

        assertNotNull(result);
        assertEquals(new BigDecimal("15.00"), result.getTotalScrap());
        assertFalse(result.getScrapByProduct().isEmpty());
        assertFalse(result.getScrapByOperation().isEmpty());

        // Both confirmations share same product SKU
        assertEquals(1, result.getScrapByProduct().size());
        assertEquals("STEEL-001", result.getScrapByProduct().get(0).getProductSku());

        // Two different operation types
        assertEquals(2, result.getScrapByOperation().size());
    }

    @Test
    @DisplayName("Should return empty scrap analysis when no confirmations")
    void getScrapAnalysis_NoData_ReturnsEmpty() {
        when(confirmationRepository.findByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());

        ReportAnalyticsDTO.ScrapAnalysis result = reportAnalyticsService.getScrapAnalysis(startDate, endDate);

        assertNotNull(result);
        assertEquals(BigDecimal.ZERO, result.getTotalScrap());
        assertTrue(result.getScrapByProduct().isEmpty());
        assertTrue(result.getScrapByOperation().isEmpty());
    }

    @Test
    @DisplayName("Should calculate scrap percentage correctly")
    void getScrapAnalysis_CalculatesPercentageCorrectly() {
        when(confirmationRepository.findByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(confirmation1));

        ReportAnalyticsDTO.ScrapAnalysis result = reportAnalyticsService.getScrapAnalysis(startDate, endDate);

        // Scrap % for FURNACE = 5 / (100 + 5) * 100 = 4.76%
        ReportAnalyticsDTO.ScrapByOperationEntry furnaceScrap = result.getScrapByOperation().stream()
                .filter(e -> "FURNACE".equals(e.getOperationType()))
                .findFirst().orElse(null);
        assertNotNull(furnaceScrap);
        assertEquals(0, new BigDecimal("4.76").compareTo(furnaceScrap.getScrapPercentage()));
    }

    // ========== getOrderFulfillment ==========

    @Test
    @DisplayName("Should return order fulfillment with completion percentage")
    void getOrderFulfillment_WithData_ReturnsMetrics() {
        when(orderRepository.count()).thenReturn(10L);
        when(orderRepository.countByStatus("COMPLETED")).thenReturn(6L);
        when(orderRepository.countByStatusIn(List.of("CREATED", "IN_PROGRESS"))).thenReturn(4L);
        when(orderRepository.findActiveOrders()).thenReturn(List.of());

        ReportAnalyticsDTO.OrderFulfillment result = reportAnalyticsService.getOrderFulfillment();

        assertNotNull(result);
        assertEquals(10L, result.getTotalOrders());
        assertEquals(6L, result.getCompletedOrders());
        assertEquals(4L, result.getInProgressOrders());
        assertEquals(0L, result.getOverdueOrders());
        // 6/10 * 100 = 60%
        assertEquals(0, new BigDecimal("60.00").compareTo(result.getCompletionPercentage()));
    }

    @Test
    @DisplayName("Should detect overdue orders based on delivery date")
    void getOrderFulfillment_WithOverdueOrders_CountsOverdue() {
        OrderLineItem overdueLineItem = OrderLineItem.builder()
                .orderLineId(10L)
                .deliveryDate(LocalDate.of(2020, 1, 1)) // Past date
                .build();
        Order overdueOrder = Order.builder()
                .orderId(1L)
                .status("IN_PROGRESS")
                .lineItems(List.of(overdueLineItem))
                .build();

        when(orderRepository.count()).thenReturn(1L);
        when(orderRepository.countByStatus("COMPLETED")).thenReturn(0L);
        when(orderRepository.countByStatusIn(List.of("CREATED", "IN_PROGRESS"))).thenReturn(1L);
        when(orderRepository.findActiveOrders()).thenReturn(List.of(overdueOrder));

        ReportAnalyticsDTO.OrderFulfillment result = reportAnalyticsService.getOrderFulfillment();

        assertEquals(1L, result.getOverdueOrders());
    }

    @Test
    @DisplayName("Should handle zero orders gracefully")
    void getOrderFulfillment_NoOrders_ReturnsZeros() {
        when(orderRepository.count()).thenReturn(0L);
        when(orderRepository.countByStatus("COMPLETED")).thenReturn(0L);
        when(orderRepository.countByStatusIn(List.of("CREATED", "IN_PROGRESS"))).thenReturn(0L);
        when(orderRepository.findActiveOrders()).thenReturn(List.of());

        ReportAnalyticsDTO.OrderFulfillment result = reportAnalyticsService.getOrderFulfillment();

        assertNotNull(result);
        assertEquals(0L, result.getTotalOrders());
        assertEquals(BigDecimal.ZERO, result.getCompletionPercentage());
    }

    // ========== getInventoryBalance ==========

    @Test
    @DisplayName("Should return inventory balance grouped by type and state")
    void getInventoryBalance_WithData_ReturnsGrouped() {
        Inventory inv1 = Inventory.builder()
                .inventoryId(1L).materialId("MAT-001").inventoryType("RM")
                .state("AVAILABLE").quantity(new BigDecimal("500.00")).unit("T").build();
        Inventory inv2 = Inventory.builder()
                .inventoryId(2L).materialId("MAT-002").inventoryType("RM")
                .state("BLOCKED").quantity(new BigDecimal("100.00")).unit("T").build();
        Inventory inv3 = Inventory.builder()
                .inventoryId(3L).materialId("MAT-003").inventoryType("FG")
                .state("AVAILABLE").quantity(new BigDecimal("200.00")).unit("T").build();

        when(inventoryRepository.findAll()).thenReturn(List.of(inv1, inv2, inv3));

        ReportAnalyticsDTO.InventoryBalance result = reportAnalyticsService.getInventoryBalance();

        assertNotNull(result);
        assertEquals(new BigDecimal("800.00"), result.getTotalQuantity());

        // 2 types: RM and FG
        assertEquals(2, result.getByType().size());
        // 2 states: AVAILABLE and BLOCKED
        assertEquals(2, result.getByState().size());

        // RM should have 600 total (500 + 100)
        ReportAnalyticsDTO.InventoryByTypeEntry rmEntry = result.getByType().stream()
                .filter(e -> "RM".equals(e.getInventoryType()))
                .findFirst().orElse(null);
        assertNotNull(rmEntry);
        assertEquals(2L, rmEntry.getItemCount());
        assertEquals(new BigDecimal("600.00"), rmEntry.getTotalQuantity());
    }

    @Test
    @DisplayName("Should return empty inventory balance when no items")
    void getInventoryBalance_NoData_ReturnsEmpty() {
        when(inventoryRepository.findAll()).thenReturn(List.of());

        ReportAnalyticsDTO.InventoryBalance result = reportAnalyticsService.getInventoryBalance();

        assertNotNull(result);
        assertEquals(BigDecimal.ZERO, result.getTotalQuantity());
        assertTrue(result.getByType().isEmpty());
        assertTrue(result.getByState().isEmpty());
    }

    // ========== getOperationCycleTimes ==========

    @Test
    @DisplayName("Should return cycle times grouped by operation type")
    void getOperationCycleTimes_WithData_ReturnsGrouped() {
        when(confirmationRepository.findByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(confirmation1, confirmation2));

        ReportAnalyticsDTO.OperationCycleTimes result =
                reportAnalyticsService.getOperationCycleTimes(startDate, endDate);

        assertNotNull(result);
        assertEquals(2, result.getEntries().size());

        // FURNACE: 8:00 to 10:30 = 150 minutes
        ReportAnalyticsDTO.CycleTimeEntry furnace = result.getEntries().stream()
                .filter(e -> "FURNACE".equals(e.getOperationType()))
                .findFirst().orElse(null);
        assertNotNull(furnace);
        assertEquals(1L, furnace.getConfirmationCount());
        assertEquals(0, new BigDecimal("150.00").compareTo(furnace.getAvgCycleTimeMinutes()));
        assertEquals(0, new BigDecimal("150").compareTo(furnace.getMinCycleTimeMinutes()));
        assertEquals(0, new BigDecimal("150").compareTo(furnace.getMaxCycleTimeMinutes()));

        // CASTER: 9:00 to 12:00 = 180 minutes
        ReportAnalyticsDTO.CycleTimeEntry caster = result.getEntries().stream()
                .filter(e -> "CASTER".equals(e.getOperationType()))
                .findFirst().orElse(null);
        assertNotNull(caster);
        assertEquals(0, new BigDecimal("180.00").compareTo(caster.getAvgCycleTimeMinutes()));
    }

    @Test
    @DisplayName("Should skip confirmations without start or end time")
    void getOperationCycleTimes_MissingTimes_SkipsEntry() {
        ProductionConfirmation noTimePc = ProductionConfirmation.builder()
                .confirmationId(99L)
                .operation(meltingOperation)
                .producedQty(new BigDecimal("50.00"))
                .scrapQty(BigDecimal.ZERO)
                .startTime(null) // No start time
                .endTime(null)   // No end time
                .build();

        when(confirmationRepository.findByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(noTimePc));

        ReportAnalyticsDTO.OperationCycleTimes result =
                reportAnalyticsService.getOperationCycleTimes(startDate, endDate);

        assertNotNull(result);
        assertTrue(result.getEntries().isEmpty());
    }

    @Test
    @DisplayName("Should return empty cycle times when no confirmations")
    void getOperationCycleTimes_NoData_ReturnsEmpty() {
        when(confirmationRepository.findByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());

        ReportAnalyticsDTO.OperationCycleTimes result =
                reportAnalyticsService.getOperationCycleTimes(startDate, endDate);

        assertNotNull(result);
        assertTrue(result.getEntries().isEmpty());
    }

    // ========== getHoldAnalysis ==========

    @Test
    @DisplayName("Should return hold analysis with entity type and reason breakdowns")
    void getHoldAnalysis_WithData_ReturnsBreakdowns() {
        HoldRecord hold1 = HoldRecord.builder()
                .holdId(1L).entityType("BATCH").entityId(1L)
                .reason("Quality Issue").status("ACTIVE")
                .appliedBy("admin").appliedOn(LocalDateTime.now()).build();
        HoldRecord hold2 = HoldRecord.builder()
                .holdId(2L).entityType("BATCH").entityId(2L)
                .reason("Quality Issue").status("RELEASED")
                .appliedBy("admin").appliedOn(LocalDateTime.now()).build();
        HoldRecord hold3 = HoldRecord.builder()
                .holdId(3L).entityType("INVENTORY").entityId(5L)
                .reason("Contamination").status("ACTIVE")
                .appliedBy("admin").appliedOn(LocalDateTime.now()).build();

        when(holdRecordRepository.findAll()).thenReturn(List.of(hold1, hold2, hold3));

        ReportAnalyticsDTO.HoldAnalysis result = reportAnalyticsService.getHoldAnalysis();

        assertNotNull(result);
        assertEquals(2L, result.getTotalActiveHolds());
        assertEquals(1L, result.getTotalReleasedHolds());
        assertEquals(2, result.getByEntityType().size());

        // BATCH should have 1 active, 1 released
        ReportAnalyticsDTO.HoldByEntityTypeEntry batchEntry = result.getByEntityType().stream()
                .filter(e -> "BATCH".equals(e.getEntityType()))
                .findFirst().orElse(null);
        assertNotNull(batchEntry);
        assertEquals(1L, batchEntry.getActiveCount());
        assertEquals(1L, batchEntry.getReleasedCount());
        assertEquals(2L, batchEntry.getTotalCount());

        // Top reasons
        assertEquals(2, result.getTopReasons().size());
        // "Quality Issue" should appear twice
        ReportAnalyticsDTO.HoldReasonEntry qualityReason = result.getTopReasons().stream()
                .filter(r -> "Quality Issue".equals(r.getReason()))
                .findFirst().orElse(null);
        assertNotNull(qualityReason);
        assertEquals(2L, qualityReason.getCount());
    }

    @Test
    @DisplayName("Should return empty hold analysis when no holds")
    void getHoldAnalysis_NoData_ReturnsEmpty() {
        when(holdRecordRepository.findAll()).thenReturn(List.of());

        ReportAnalyticsDTO.HoldAnalysis result = reportAnalyticsService.getHoldAnalysis();

        assertNotNull(result);
        assertEquals(0L, result.getTotalActiveHolds());
        assertEquals(0L, result.getTotalReleasedHolds());
        assertTrue(result.getByEntityType().isEmpty());
        assertTrue(result.getTopReasons().isEmpty());
    }

    @Test
    @DisplayName("Should limit top reasons to 10")
    void getHoldAnalysis_ManyReasons_LimitsToTen() {
        List<HoldRecord> holds = new java.util.ArrayList<>();
        for (int i = 0; i < 15; i++) {
            holds.add(HoldRecord.builder()
                    .holdId((long) i).entityType("BATCH").entityId((long) i)
                    .reason("Reason " + i).status("ACTIVE")
                    .appliedBy("admin").appliedOn(LocalDateTime.now()).build());
        }

        when(holdRecordRepository.findAll()).thenReturn(holds);

        ReportAnalyticsDTO.HoldAnalysis result = reportAnalyticsService.getHoldAnalysis();

        assertTrue(result.getTopReasons().size() <= 10);
    }

    // ========== getExecutiveDashboard ==========

    @Test
    @DisplayName("Should return executive dashboard with all sections populated")
    void getExecutiveDashboard_ReturnsAllSections() {
        // Mock confirmations for production summary and cycle times
        when(confirmationRepository.findByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(confirmation1, confirmation2));

        // Mock orders for fulfillment
        when(orderRepository.count()).thenReturn(10L);
        when(orderRepository.countByStatus("COMPLETED")).thenReturn(5L);
        when(orderRepository.countByStatusIn(List.of("CREATED", "IN_PROGRESS"))).thenReturn(5L);
        when(orderRepository.findActiveOrders()).thenReturn(List.of());

        // Mock inventory
        Inventory inv = Inventory.builder()
                .inventoryId(1L).materialId("MAT-001").inventoryType("RM")
                .state("AVAILABLE").quantity(new BigDecimal("500.00")).unit("T").build();
        when(inventoryRepository.findAll()).thenReturn(List.of(inv));

        // Mock holds
        HoldRecord hold = HoldRecord.builder()
                .holdId(1L).entityType("BATCH").entityId(1L)
                .reason("Quality Issue").status("ACTIVE")
                .appliedBy("admin").appliedOn(LocalDateTime.now()).build();
        when(holdRecordRepository.findAll()).thenReturn(List.of(hold));

        ReportAnalyticsDTO.ExecutiveDashboard result = reportAnalyticsService.getExecutiveDashboard();

        assertNotNull(result);
        assertNotNull(result.getProductionSummary());
        assertNotNull(result.getOrderFulfillment());
        assertNotNull(result.getInventoryBalance());
        assertNotNull(result.getHoldAnalysis());
        assertNotNull(result.getTopCycleTimes());

        // Verify production summary has data
        assertTrue(result.getProductionSummary().getConfirmationCount() > 0);
        // Verify order fulfillment has data
        assertEquals(10L, result.getOrderFulfillment().getTotalOrders());
    }

    @Test
    @DisplayName("Should limit top cycle times to 5 in executive dashboard")
    void getExecutiveDashboard_LimitsCycleTimesToFive() {
        when(confirmationRepository.findByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(confirmation1, confirmation2));
        when(orderRepository.count()).thenReturn(0L);
        when(orderRepository.countByStatus("COMPLETED")).thenReturn(0L);
        when(orderRepository.countByStatusIn(anyList())).thenReturn(0L);
        when(orderRepository.findActiveOrders()).thenReturn(List.of());
        when(inventoryRepository.findAll()).thenReturn(List.of());
        when(holdRecordRepository.findAll()).thenReturn(List.of());

        ReportAnalyticsDTO.ExecutiveDashboard result = reportAnalyticsService.getExecutiveDashboard();

        assertNotNull(result.getTopCycleTimes());
        assertTrue(result.getTopCycleTimes().size() <= 5);
    }

    // ========== Edge cases ==========

    @Test
    @DisplayName("Should handle null scrap qty in production summary")
    void getProductionSummary_NullScrap_DefaultsToZero() {
        ProductionConfirmation pcNoScrap = ProductionConfirmation.builder()
                .confirmationId(10L)
                .operation(meltingOperation)
                .producedQty(new BigDecimal("200.00"))
                .scrapQty(null) // null scrap
                .startTime(LocalDateTime.of(2026, 1, 20, 8, 0))
                .endTime(LocalDateTime.of(2026, 1, 20, 10, 0))
                .build();

        when(confirmationRepository.findByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(pcNoScrap));

        ReportAnalyticsDTO.ProductionSummary result = reportAnalyticsService.getProductionSummary(startDate, endDate);

        assertEquals(new BigDecimal("200.00"), result.getTotalProduced());
        assertEquals(BigDecimal.ZERO, result.getTotalScrap());
        // Yield should be 100% when no scrap
        assertEquals(0, new BigDecimal("100.00").compareTo(result.getYieldPercentage()));
    }

    @Test
    @DisplayName("Should handle null produced qty in production summary")
    void getProductionSummary_NullProduced_DefaultsToZero() {
        ProductionConfirmation pcNoProduced = ProductionConfirmation.builder()
                .confirmationId(10L)
                .operation(meltingOperation)
                .producedQty(null) // null produced
                .scrapQty(new BigDecimal("5.00"))
                .startTime(LocalDateTime.of(2026, 1, 20, 8, 0))
                .endTime(LocalDateTime.of(2026, 1, 20, 10, 0))
                .build();

        when(confirmationRepository.findByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(pcNoProduced));

        ReportAnalyticsDTO.ProductionSummary result = reportAnalyticsService.getProductionSummary(startDate, endDate);

        assertEquals(BigDecimal.ZERO, result.getTotalProduced());
        assertEquals(new BigDecimal("5.00"), result.getTotalScrap());
    }
}
