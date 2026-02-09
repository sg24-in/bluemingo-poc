package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.config.TestSecurityConfig;
import com.mes.production.dto.ReportAnalyticsDTO;
import com.mes.production.security.JwtService;
import com.mes.production.service.ReportAnalyticsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class ReportAnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReportAnalyticsService reportAnalyticsService;

    @MockBean
    private JwtService jwtService;

    private ReportAnalyticsDTO.ProductionSummary testProductionSummary;
    private ReportAnalyticsDTO.ProductionByOperation testProductionByOperation;
    private ReportAnalyticsDTO.ScrapAnalysis testScrapAnalysis;
    private ReportAnalyticsDTO.OrderFulfillment testOrderFulfillment;
    private ReportAnalyticsDTO.InventoryBalance testInventoryBalance;
    private ReportAnalyticsDTO.OperationCycleTimes testCycleTimes;
    private ReportAnalyticsDTO.HoldAnalysis testHoldAnalysis;
    private ReportAnalyticsDTO.ExecutiveDashboard testExecutiveDashboard;

    @BeforeEach
    void setUp() {
        LocalDate startDate = LocalDate.of(2026, 1, 1);
        LocalDate endDate = LocalDate.of(2026, 1, 31);

        testProductionSummary = ReportAnalyticsDTO.ProductionSummary.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalProduced(new BigDecimal("1000.00"))
                .totalScrap(new BigDecimal("50.00"))
                .yieldPercentage(new BigDecimal("95.24"))
                .avgCycleTimeMinutes(new BigDecimal("120.00"))
                .confirmationCount(25L)
                .build();

        testProductionByOperation = ReportAnalyticsDTO.ProductionByOperation.builder()
                .startDate(startDate)
                .endDate(endDate)
                .entries(List.of(
                        ReportAnalyticsDTO.OperationProductionEntry.builder()
                                .operationType("FURNACE")
                                .confirmationCount(10L)
                                .totalProduced(new BigDecimal("500.00"))
                                .totalScrap(new BigDecimal("25.00"))
                                .yieldPercentage(new BigDecimal("95.24"))
                                .build()
                ))
                .build();

        testScrapAnalysis = ReportAnalyticsDTO.ScrapAnalysis.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalScrap(new BigDecimal("50.00"))
                .scrapByProduct(List.of(
                        ReportAnalyticsDTO.ScrapByProductEntry.builder()
                                .productSku("STEEL-001")
                                .productName("Steel Rod")
                                .scrapQty(new BigDecimal("50.00"))
                                .producedQty(new BigDecimal("1000.00"))
                                .scrapPercentage(new BigDecimal("4.76"))
                                .build()
                ))
                .scrapByOperation(List.of(
                        ReportAnalyticsDTO.ScrapByOperationEntry.builder()
                                .operationType("FURNACE")
                                .scrapQty(new BigDecimal("50.00"))
                                .producedQty(new BigDecimal("1000.00"))
                                .scrapPercentage(new BigDecimal("4.76"))
                                .build()
                ))
                .build();

        testOrderFulfillment = ReportAnalyticsDTO.OrderFulfillment.builder()
                .totalOrders(10L)
                .completedOrders(6L)
                .inProgressOrders(3L)
                .overdueOrders(1L)
                .completionPercentage(new BigDecimal("60.00"))
                .build();

        testInventoryBalance = ReportAnalyticsDTO.InventoryBalance.builder()
                .totalQuantity(new BigDecimal("5000.00"))
                .byType(List.of(
                        ReportAnalyticsDTO.InventoryByTypeEntry.builder()
                                .inventoryType("RM")
                                .itemCount(10L)
                                .totalQuantity(new BigDecimal("3000.00"))
                                .build()
                ))
                .byState(List.of(
                        ReportAnalyticsDTO.InventoryByStateEntry.builder()
                                .state("AVAILABLE")
                                .itemCount(8L)
                                .totalQuantity(new BigDecimal("4000.00"))
                                .build()
                ))
                .build();

        testCycleTimes = ReportAnalyticsDTO.OperationCycleTimes.builder()
                .startDate(startDate)
                .endDate(endDate)
                .entries(List.of(
                        ReportAnalyticsDTO.CycleTimeEntry.builder()
                                .operationType("FURNACE")
                                .confirmationCount(10L)
                                .avgCycleTimeMinutes(new BigDecimal("150.00"))
                                .minCycleTimeMinutes(new BigDecimal("120.00"))
                                .maxCycleTimeMinutes(new BigDecimal("180.00"))
                                .build()
                ))
                .build();

        testHoldAnalysis = ReportAnalyticsDTO.HoldAnalysis.builder()
                .totalActiveHolds(5L)
                .totalReleasedHolds(3L)
                .byEntityType(List.of(
                        ReportAnalyticsDTO.HoldByEntityTypeEntry.builder()
                                .entityType("BATCH")
                                .activeCount(3L)
                                .releasedCount(2L)
                                .totalCount(5L)
                                .build()
                ))
                .topReasons(List.of(
                        ReportAnalyticsDTO.HoldReasonEntry.builder()
                                .reason("Quality Issue")
                                .count(4L)
                                .build()
                ))
                .build();

        testExecutiveDashboard = ReportAnalyticsDTO.ExecutiveDashboard.builder()
                .productionSummary(testProductionSummary)
                .orderFulfillment(testOrderFulfillment)
                .inventoryBalance(testInventoryBalance)
                .holdAnalysis(testHoldAnalysis)
                .topCycleTimes(testCycleTimes.getEntries())
                .build();
    }

    // ========== Production Summary ==========

    @Test
    @DisplayName("Should get production summary with date parameters")
    @WithMockUser(username = "admin@mes.com")
    void getProductionSummary_WithDates_ReturnsSummary() throws Exception {
        when(reportAnalyticsService.getProductionSummary(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(testProductionSummary);

        mockMvc.perform(get("/api/reports/analytics/production/summary")
                        .param("startDate", "2026-01-01")
                        .param("endDate", "2026-01-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalProduced").value(1000.00))
                .andExpect(jsonPath("$.totalScrap").value(50.00))
                .andExpect(jsonPath("$.yieldPercentage").value(95.24))
                .andExpect(jsonPath("$.confirmationCount").value(25));

        verify(reportAnalyticsService, times(1))
                .getProductionSummary(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31));
    }

    @Test
    @DisplayName("Should return error when production summary missing date parameters")
    @WithMockUser(username = "admin@mes.com")
    void getProductionSummary_MissingDates_ReturnsError() throws Exception {
        mockMvc.perform(get("/api/reports/analytics/production/summary"))
                .andExpect(status().is5xxServerError());
    }

    @Test
    @DisplayName("Should return 401 when not authenticated for production summary")
    void getProductionSummary_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/reports/analytics/production/summary")
                        .param("startDate", "2026-01-01")
                        .param("endDate", "2026-01-31"))
                .andExpect(status().isUnauthorized());
    }

    // ========== Production By Operation ==========

    @Test
    @DisplayName("Should get production by operation")
    @WithMockUser(username = "admin@mes.com")
    void getProductionByOperation_WithDates_ReturnsGrouped() throws Exception {
        when(reportAnalyticsService.getProductionByOperation(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(testProductionByOperation);

        mockMvc.perform(get("/api/reports/analytics/production/by-operation")
                        .param("startDate", "2026-01-01")
                        .param("endDate", "2026-01-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.entries[0].operationType").value("FURNACE"))
                .andExpect(jsonPath("$.entries[0].confirmationCount").value(10))
                .andExpect(jsonPath("$.entries[0].totalProduced").value(500.00));

        verify(reportAnalyticsService, times(1))
                .getProductionByOperation(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31));
    }

    // ========== Scrap Analysis ==========

    @Test
    @DisplayName("Should get scrap analysis")
    @WithMockUser(username = "admin@mes.com")
    void getScrapAnalysis_WithDates_ReturnsAnalysis() throws Exception {
        when(reportAnalyticsService.getScrapAnalysis(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(testScrapAnalysis);

        mockMvc.perform(get("/api/reports/analytics/quality/scrap-analysis")
                        .param("startDate", "2026-01-01")
                        .param("endDate", "2026-01-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalScrap").value(50.00))
                .andExpect(jsonPath("$.scrapByProduct[0].productSku").value("STEEL-001"))
                .andExpect(jsonPath("$.scrapByOperation[0].operationType").value("FURNACE"));

        verify(reportAnalyticsService, times(1))
                .getScrapAnalysis(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31));
    }

    // ========== Order Fulfillment ==========

    @Test
    @DisplayName("Should get order fulfillment")
    @WithMockUser(username = "admin@mes.com")
    void getOrderFulfillment_ReturnsMetrics() throws Exception {
        when(reportAnalyticsService.getOrderFulfillment()).thenReturn(testOrderFulfillment);

        mockMvc.perform(get("/api/reports/analytics/orders/fulfillment"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalOrders").value(10))
                .andExpect(jsonPath("$.completedOrders").value(6))
                .andExpect(jsonPath("$.inProgressOrders").value(3))
                .andExpect(jsonPath("$.overdueOrders").value(1))
                .andExpect(jsonPath("$.completionPercentage").value(60.00));

        verify(reportAnalyticsService, times(1)).getOrderFulfillment();
    }

    @Test
    @DisplayName("Should return 401 when not authenticated for order fulfillment")
    void getOrderFulfillment_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/reports/analytics/orders/fulfillment"))
                .andExpect(status().isUnauthorized());
    }

    // ========== Inventory Balance ==========

    @Test
    @DisplayName("Should get inventory balance")
    @WithMockUser(username = "admin@mes.com")
    void getInventoryBalance_ReturnsBalance() throws Exception {
        when(reportAnalyticsService.getInventoryBalance()).thenReturn(testInventoryBalance);

        mockMvc.perform(get("/api/reports/analytics/inventory/balance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalQuantity").value(5000.00))
                .andExpect(jsonPath("$.byType[0].inventoryType").value("RM"))
                .andExpect(jsonPath("$.byType[0].itemCount").value(10))
                .andExpect(jsonPath("$.byState[0].state").value("AVAILABLE"));

        verify(reportAnalyticsService, times(1)).getInventoryBalance();
    }

    // ========== Operation Cycle Times ==========

    @Test
    @DisplayName("Should get operation cycle times")
    @WithMockUser(username = "admin@mes.com")
    void getOperationCycleTimes_WithDates_ReturnsCycleTimes() throws Exception {
        when(reportAnalyticsService.getOperationCycleTimes(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(testCycleTimes);

        mockMvc.perform(get("/api/reports/analytics/operations/cycle-times")
                        .param("startDate", "2026-01-01")
                        .param("endDate", "2026-01-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.entries[0].operationType").value("FURNACE"))
                .andExpect(jsonPath("$.entries[0].avgCycleTimeMinutes").value(150.00))
                .andExpect(jsonPath("$.entries[0].minCycleTimeMinutes").value(120.00))
                .andExpect(jsonPath("$.entries[0].maxCycleTimeMinutes").value(180.00));

        verify(reportAnalyticsService, times(1))
                .getOperationCycleTimes(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31));
    }

    @Test
    @DisplayName("Should return error when cycle times missing date parameters")
    @WithMockUser(username = "admin@mes.com")
    void getOperationCycleTimes_MissingDates_ReturnsError() throws Exception {
        mockMvc.perform(get("/api/reports/analytics/operations/cycle-times"))
                .andExpect(status().is5xxServerError());
    }

    // ========== Hold Analysis ==========

    @Test
    @DisplayName("Should get hold analysis")
    @WithMockUser(username = "admin@mes.com")
    void getHoldAnalysis_ReturnsAnalysis() throws Exception {
        when(reportAnalyticsService.getHoldAnalysis()).thenReturn(testHoldAnalysis);

        mockMvc.perform(get("/api/reports/analytics/operations/holds"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalActiveHolds").value(5))
                .andExpect(jsonPath("$.totalReleasedHolds").value(3))
                .andExpect(jsonPath("$.byEntityType[0].entityType").value("BATCH"))
                .andExpect(jsonPath("$.topReasons[0].reason").value("Quality Issue"))
                .andExpect(jsonPath("$.topReasons[0].count").value(4));

        verify(reportAnalyticsService, times(1)).getHoldAnalysis();
    }

    // ========== Executive Dashboard ==========

    @Test
    @DisplayName("Should get executive dashboard with all sections")
    @WithMockUser(username = "admin@mes.com")
    void getExecutiveDashboard_ReturnsAllSections() throws Exception {
        when(reportAnalyticsService.getExecutiveDashboard()).thenReturn(testExecutiveDashboard);

        mockMvc.perform(get("/api/reports/analytics/executive/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productionSummary").exists())
                .andExpect(jsonPath("$.productionSummary.totalProduced").value(1000.00))
                .andExpect(jsonPath("$.orderFulfillment").exists())
                .andExpect(jsonPath("$.orderFulfillment.totalOrders").value(10))
                .andExpect(jsonPath("$.inventoryBalance").exists())
                .andExpect(jsonPath("$.inventoryBalance.totalQuantity").value(5000.00))
                .andExpect(jsonPath("$.holdAnalysis").exists())
                .andExpect(jsonPath("$.holdAnalysis.totalActiveHolds").value(5))
                .andExpect(jsonPath("$.topCycleTimes").isArray());

        verify(reportAnalyticsService, times(1)).getExecutiveDashboard();
    }

    @Test
    @DisplayName("Should return 401 when not authenticated for executive dashboard")
    void getExecutiveDashboard_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/reports/analytics/executive/dashboard"))
                .andExpect(status().isUnauthorized());
    }
}
