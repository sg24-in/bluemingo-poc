package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.DashboardDTO;
import com.mes.production.security.JwtService;
import com.mes.production.service.DashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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

    @Test
    @DisplayName("Should get dashboard summary")
    @WithMockUser(username = "admin@mes.com")
    void getDashboardSummary_ReturnsSummary() throws Exception {
        when(dashboardService.getDashboardSummary()).thenReturn(testSummary);

        mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalOrders").value(10))
                .andExpect(jsonPath("$.ordersInProgress").value(5))
                .andExpect(jsonPath("$.operationsReady").value(8))
                .andExpect(jsonPath("$.activeHolds").value(2))
                .andExpect(jsonPath("$.todayConfirmations").value(15));

        verify(dashboardService, times(1)).getDashboardSummary();
    }

    @Test
    @DisplayName("Should get recent activity with default limit")
    @WithMockUser(username = "admin@mes.com")
    void getRecentActivity_DefaultLimit_ReturnsActivity() throws Exception {
        when(dashboardService.getRecentActivity(5)).thenReturn(List.of(testActivity));

        mockMvc.perform(get("/api/dashboard/recent-activity"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].confirmationId").value(1))
                .andExpect(jsonPath("$[0].operationName").value("Melting"))
                .andExpect(jsonPath("$[0].productSku").value("STEEL-001"));

        verify(dashboardService, times(1)).getRecentActivity(5);
    }

    @Test
    @DisplayName("Should get recent activity with custom limit")
    @WithMockUser(username = "admin@mes.com")
    void getRecentActivity_CustomLimit_ReturnsActivity() throws Exception {
        when(dashboardService.getRecentActivity(10)).thenReturn(List.of(testActivity));

        mockMvc.perform(get("/api/dashboard/recent-activity")
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].confirmationId").value(1));

        verify(dashboardService, times(1)).getRecentActivity(10);
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void getDashboardSummary_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should return empty list when no recent activity")
    @WithMockUser(username = "admin@mes.com")
    void getRecentActivity_NoActivity_ReturnsEmptyList() throws Exception {
        when(dashboardService.getRecentActivity(5)).thenReturn(List.of());

        mockMvc.perform(get("/api/dashboard/recent-activity"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }
}
