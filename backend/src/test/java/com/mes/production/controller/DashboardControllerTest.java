package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.DashboardDTO;
import com.mes.production.security.JwtService;
import com.mes.production.service.DashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.mes.production.config.TestSecurityConfig;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DashboardService dashboardService;

    @MockBean
    private JwtService jwtService;

    private DashboardDTO.Summary testSummary;
    private DashboardDTO.RecentActivity testActivity;

    @BeforeEach
    void setUp() {
        testSummary = DashboardDTO.Summary.builder()
                .totalOrders(10L)
                .ordersInProgress(5L)
                .operationsReady(8L)
                .operationsInProgress(3L)
                .activeHolds(2L)
                .todayConfirmations(15L)
                .build();

        testActivity = DashboardDTO.RecentActivity.builder()
                .confirmationId(1L)
                .operationName("Melting")
                .productSku("STEEL-001")
                .producedQty(new BigDecimal("100.00"))
                .operatorName("Admin User")
                .confirmedAt(LocalDateTime.now())
                .batchNumber("BATCH-001")
                .build();
    }

    @Nested
    @DisplayName("GET /api/dashboard/summary Tests")
    class GetDashboardSummaryTests {

        @Test
        @DisplayName("should_returnDashboardSummary_when_authenticatedUserRequests")
        @WithMockUser(username = "admin@mes.com")
        void should_returnDashboardSummary_when_authenticatedUserRequests() throws Exception {
            when(dashboardService.getDashboardSummary()).thenReturn(testSummary);

            mockMvc.perform(get("/api/dashboard/summary"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalOrders").value(10))
                    .andExpect(jsonPath("$.ordersInProgress").value(5))
                    .andExpect(jsonPath("$.operationsReady").value(8))
                    .andExpect(jsonPath("$.operationsInProgress").value(3))
                    .andExpect(jsonPath("$.activeHolds").value(2))
                    .andExpect(jsonPath("$.todayConfirmations").value(15));

            verify(dashboardService, times(1)).getDashboardSummary();
        }

        @Test
        @DisplayName("should_returnAllMetricFields_when_summaryRequested")
        @WithMockUser(username = "admin@mes.com")
        void should_returnAllMetricFields_when_summaryRequested() throws Exception {
            DashboardDTO.Summary fullSummary = DashboardDTO.Summary.builder()
                    .totalOrders(100L)
                    .ordersInProgress(25L)
                    .operationsReady(50L)
                    .operationsInProgress(15L)
                    .activeHolds(5L)
                    .todayConfirmations(30L)
                    .build();

            when(dashboardService.getDashboardSummary()).thenReturn(fullSummary);

            mockMvc.perform(get("/api/dashboard/summary"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalOrders").exists())
                    .andExpect(jsonPath("$.ordersInProgress").exists())
                    .andExpect(jsonPath("$.operationsReady").exists())
                    .andExpect(jsonPath("$.operationsInProgress").exists())
                    .andExpect(jsonPath("$.activeHolds").exists())
                    .andExpect(jsonPath("$.todayConfirmations").exists());
        }

        @Test
        @DisplayName("should_returnZeroMetrics_when_noDataExists")
        @WithMockUser(username = "admin@mes.com")
        void should_returnZeroMetrics_when_noDataExists() throws Exception {
            DashboardDTO.Summary emptySummary = DashboardDTO.Summary.builder()
                    .totalOrders(0L)
                    .ordersInProgress(0L)
                    .operationsReady(0L)
                    .operationsInProgress(0L)
                    .activeHolds(0L)
                    .todayConfirmations(0L)
                    .build();

            when(dashboardService.getDashboardSummary()).thenReturn(emptySummary);

            mockMvc.perform(get("/api/dashboard/summary"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalOrders").value(0))
                    .andExpect(jsonPath("$.ordersInProgress").value(0))
                    .andExpect(jsonPath("$.activeHolds").value(0));
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            mockMvc.perform(get("/api/dashboard/summary"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should_handleServiceException_when_errorOccurs")
        @WithMockUser(username = "admin@mes.com")
        void should_handleServiceException_when_errorOccurs() throws Exception {
            when(dashboardService.getDashboardSummary())
                    .thenThrow(new RuntimeException("Database connection error"));

            mockMvc.perform(get("/api/dashboard/summary"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/dashboard/recent-activity Tests")
    class GetRecentActivityTests {

        @Test
        @DisplayName("should_returnRecentActivity_when_defaultLimitUsed")
        @WithMockUser(username = "admin@mes.com")
        void should_returnRecentActivity_when_defaultLimitUsed() throws Exception {
            when(dashboardService.getRecentActivity(5)).thenReturn(List.of(testActivity));

            mockMvc.perform(get("/api/dashboard/recent-activity"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].confirmationId").value(1))
                    .andExpect(jsonPath("$[0].operationName").value("Melting"))
                    .andExpect(jsonPath("$[0].productSku").value("STEEL-001"))
                    .andExpect(jsonPath("$[0].batchNumber").value("BATCH-001"));

            verify(dashboardService, times(1)).getRecentActivity(5);
        }

        @Test
        @DisplayName("should_returnRecentActivity_when_customLimitProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_returnRecentActivity_when_customLimitProvided() throws Exception {
            when(dashboardService.getRecentActivity(10)).thenReturn(List.of(testActivity));

            mockMvc.perform(get("/api/dashboard/recent-activity")
                            .param("limit", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].confirmationId").value(1));

            verify(dashboardService, times(1)).getRecentActivity(10);
        }

        @Test
        @DisplayName("should_returnEmptyList_when_noRecentActivity")
        @WithMockUser(username = "admin@mes.com")
        void should_returnEmptyList_when_noRecentActivity() throws Exception {
            when(dashboardService.getRecentActivity(5)).thenReturn(List.of());

            mockMvc.perform(get("/api/dashboard/recent-activity"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }

        @Test
        @DisplayName("should_returnMultipleActivities_when_multipleExist")
        @WithMockUser(username = "admin@mes.com")
        void should_returnMultipleActivities_when_multipleExist() throws Exception {
            DashboardDTO.RecentActivity activity2 = DashboardDTO.RecentActivity.builder()
                    .confirmationId(2L)
                    .operationName("Casting")
                    .productSku("STEEL-002")
                    .producedQty(new BigDecimal("200.00"))
                    .operatorName("Operator 2")
                    .confirmedAt(LocalDateTime.now().minusHours(1))
                    .batchNumber("BATCH-002")
                    .build();

            when(dashboardService.getRecentActivity(5)).thenReturn(List.of(testActivity, activity2));

            mockMvc.perform(get("/api/dashboard/recent-activity"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].confirmationId").value(1))
                    .andExpect(jsonPath("$[1].confirmationId").value(2));
        }

        @Test
        @DisplayName("should_verifyAllActivityFields_when_activityReturned")
        @WithMockUser(username = "admin@mes.com")
        void should_verifyAllActivityFields_when_activityReturned() throws Exception {
            when(dashboardService.getRecentActivity(5)).thenReturn(List.of(testActivity));

            mockMvc.perform(get("/api/dashboard/recent-activity"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].confirmationId").exists())
                    .andExpect(jsonPath("$[0].operationName").exists())
                    .andExpect(jsonPath("$[0].productSku").exists())
                    .andExpect(jsonPath("$[0].producedQty").exists())
                    .andExpect(jsonPath("$[0].operatorName").exists())
                    .andExpect(jsonPath("$[0].confirmedAt").exists())
                    .andExpect(jsonPath("$[0].batchNumber").exists());
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            mockMvc.perform(get("/api/dashboard/recent-activity"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should_useLargeLimit_when_requestedHighNumber")
        @WithMockUser(username = "admin@mes.com")
        void should_useLargeLimit_when_requestedHighNumber() throws Exception {
            when(dashboardService.getRecentActivity(100)).thenReturn(List.of());

            mockMvc.perform(get("/api/dashboard/recent-activity")
                            .param("limit", "100"))
                    .andExpect(status().isOk());

            verify(dashboardService, times(1)).getRecentActivity(100);
        }
    }
}
