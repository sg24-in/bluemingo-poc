package com.mes.production.controller;

import com.mes.production.entity.AuditTrail;
import com.mes.production.security.JwtService;
import com.mes.production.service.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuditControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuditService auditService;

    @MockBean
    private JwtService jwtService;

    private AuditTrail testAuditEntry;
    private List<AuditTrail> testEntries;
    private LocalDateTime testTime;

    @BeforeEach
    void setUp() {
        testTime = LocalDateTime.of(2024, 1, 15, 10, 30);

        testAuditEntry = AuditTrail.builder()
                .auditId(1L)
                .entityType("BATCH")
                .entityId(100L)
                .fieldName("status")
                .oldValue("AVAILABLE")
                .newValue("CONSUMED")
                .action(AuditTrail.ACTION_STATUS_CHANGE)
                .changedBy("admin@mes.com")
                .timestamp(testTime)
                .build();

        AuditTrail entry2 = AuditTrail.builder()
                .auditId(2L)
                .entityType("BATCH")
                .entityId(100L)
                .fieldName("quantity")
                .oldValue("100")
                .newValue("80")
                .action(AuditTrail.ACTION_UPDATE)
                .changedBy("admin@mes.com")
                .timestamp(testTime.minusMinutes(10))
                .build();

        testEntries = List.of(testAuditEntry, entry2);
    }

    @Test
    @DisplayName("Should get entity history")
    @WithMockUser(username = "admin@mes.com", roles = {"USER"})
    void getEntityHistory_ValidEntity_ReturnsHistory() throws Exception {
        when(auditService.getEntityHistory("BATCH", 100L)).thenReturn(testEntries);

        mockMvc.perform(get("/api/audit/entity/BATCH/100")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.entityType", is("BATCH")))
                .andExpect(jsonPath("$.entityId", is(100)))
                .andExpect(jsonPath("$.totalEntries", is(2)))
                .andExpect(jsonPath("$.entries", hasSize(2)))
                .andExpect(jsonPath("$.entries[0].fieldName", is("status")));

        verify(auditService, times(1)).getEntityHistory("BATCH", 100L);
    }

    @Test
    @DisplayName("Should handle lowercase entity type")
    @WithMockUser(username = "admin@mes.com", roles = {"USER"})
    void getEntityHistory_LowercaseEntityType_ConvertsToUppercase() throws Exception {
        when(auditService.getEntityHistory("INVENTORY", 50L)).thenReturn(List.of());

        mockMvc.perform(get("/api/audit/entity/inventory/50")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.entityType", is("INVENTORY")));

        verify(auditService, times(1)).getEntityHistory("INVENTORY", 50L);
    }

    @Test
    @DisplayName("Should get recent activity with default limit")
    @WithMockUser(username = "admin@mes.com", roles = {"USER"})
    void getRecentActivity_NoLimit_UsesDefault() throws Exception {
        when(auditService.getRecentActivity(50)).thenReturn(testEntries);

        mockMvc.perform(get("/api/audit/recent")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        verify(auditService, times(1)).getRecentActivity(50);
    }

    @Test
    @DisplayName("Should get recent activity with custom limit")
    @WithMockUser(username = "admin@mes.com", roles = {"USER"})
    void getRecentActivity_CustomLimit_UsesProvidedLimit() throws Exception {
        when(auditService.getRecentActivity(20)).thenReturn(testEntries);

        mockMvc.perform(get("/api/audit/recent")
                        .param("limit", "20")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(auditService, times(1)).getRecentActivity(20);
    }

    @Test
    @DisplayName("Should cap limit at 500")
    @WithMockUser(username = "admin@mes.com", roles = {"USER"})
    void getRecentActivity_ExcessiveLimit_CapsAt500() throws Exception {
        when(auditService.getRecentActivity(500)).thenReturn(List.of());

        mockMvc.perform(get("/api/audit/recent")
                        .param("limit", "1000")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(auditService, times(1)).getRecentActivity(500);
    }

    @Test
    @DisplayName("Should get recent production confirmations")
    @WithMockUser(username = "admin@mes.com", roles = {"USER"})
    void getRecentProductionConfirmations_ReturnsEntries() throws Exception {
        AuditTrail confirmation = AuditTrail.builder()
                .auditId(3L)
                .entityType("PRODUCTION_CONFIRMATION")
                .entityId(1L)
                .action(AuditTrail.ACTION_CREATE)
                .changedBy("admin@mes.com")
                .timestamp(testTime)
                .build();

        when(auditService.getRecentProductionConfirmations(10)).thenReturn(List.of(confirmation));

        mockMvc.perform(get("/api/audit/production-confirmations")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].entityType", is("PRODUCTION_CONFIRMATION")));

        verify(auditService, times(1)).getRecentProductionConfirmations(10);
    }

    @Test
    @DisplayName("Should get activity by user")
    @WithMockUser(username = "admin@mes.com", roles = {"USER"})
    void getActivityByUser_ValidUser_ReturnsActivity() throws Exception {
        when(auditService.getActivityByUser("admin@mes.com", 50)).thenReturn(testEntries);

        mockMvc.perform(get("/api/audit/user/admin@mes.com")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].changedBy", is("admin@mes.com")));

        verify(auditService, times(1)).getActivityByUser("admin@mes.com", 50);
    }

    @Test
    @DisplayName("Should get activity by date range")
    @WithMockUser(username = "admin@mes.com", roles = {"USER"})
    void getActivityByDateRange_ValidRange_ReturnsActivity() throws Exception {
        LocalDateTime startDate = LocalDateTime.of(2024, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2024, 1, 31, 23, 59, 59);

        when(auditService.getActivityByDateRange(startDate, endDate)).thenReturn(testEntries);

        mockMvc.perform(get("/api/audit/range")
                        .param("startDate", "2024-01-01T00:00:00")
                        .param("endDate", "2024-01-31T23:59:59")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        verify(auditService, times(1)).getActivityByDateRange(startDate, endDate);
    }

    @Test
    @DisplayName("Should get audit summary")
    @WithMockUser(username = "admin@mes.com", roles = {"USER"})
    void getAuditSummary_ReturnsSummary() throws Exception {
        when(auditService.countTodaysActivity()).thenReturn(25L);
        when(auditService.getRecentActivity(10)).thenReturn(testEntries);

        mockMvc.perform(get("/api/audit/summary")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.todaysActivityCount", is(25)))
                .andExpect(jsonPath("$.recentActivity", hasSize(2)));

        verify(auditService, times(1)).countTodaysActivity();
        verify(auditService, times(1)).getRecentActivity(10);
    }

    @Test
    @DisplayName("Should get entity types")
    @WithMockUser(username = "admin@mes.com", roles = {"USER"})
    void getEntityTypes_ReturnsAllTypes() throws Exception {
        mockMvc.perform(get("/api/audit/entity-types")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(8)))
                .andExpect(jsonPath("$", hasItem("PRODUCTION_CONFIRMATION")))
                .andExpect(jsonPath("$", hasItem("BATCH")))
                .andExpect(jsonPath("$", hasItem("INVENTORY")));
    }

    @Test
    @DisplayName("Should get action types")
    @WithMockUser(username = "admin@mes.com", roles = {"USER"})
    void getActionTypes_ReturnsAllTypes() throws Exception {
        mockMvc.perform(get("/api/audit/action-types")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(8)))
                .andExpect(jsonPath("$", hasItem("CREATE")))
                .andExpect(jsonPath("$", hasItem("UPDATE")))
                .andExpect(jsonPath("$", hasItem("STATUS_CHANGE")));
    }

    @Test
    @DisplayName("Should require authentication for entity history")
    void getEntityHistory_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/audit/entity/BATCH/100")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should require authentication for recent activity")
    void getRecentActivity_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/audit/recent")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}
