package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.EquipmentUsageDTO;
import com.mes.production.entity.Equipment;
import com.mes.production.entity.Operation;
import com.mes.production.entity.OperationEquipmentUsage;
import com.mes.production.entity.Operator;
import com.mes.production.security.JwtService;
import com.mes.production.service.EquipmentUsageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.mes.production.config.TestSecurityConfig;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class EquipmentUsageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EquipmentUsageService equipmentUsageService;

    @MockBean
    private JwtService jwtService;

    private Operation testOperation;
    private Equipment testEquipment;
    private Operator testOperator;
    private OperationEquipmentUsage testUsage;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @BeforeEach
    void setUp() {
        startTime = LocalDateTime.now().minusHours(4);
        endTime = LocalDateTime.now();

        testOperation = new Operation();
        testOperation.setOperationId(1L);
        testOperation.setOperationName("Melting");

        testEquipment = new Equipment();
        testEquipment.setEquipmentId(1L);
        testEquipment.setEquipmentCode("EQ-001");
        testEquipment.setName("Furnace 1");

        testOperator = new Operator();
        testOperator.setOperatorId(1L);
        testOperator.setOperatorCode("OP-001");
        testOperator.setName("John Smith");

        testUsage = new OperationEquipmentUsage();
        testUsage.setUsageId(1L);
        testUsage.setOperation(testOperation);
        testUsage.setEquipment(testEquipment);
        testUsage.setOperator(testOperator);
        testUsage.setStartTime(startTime);
        testUsage.setEndTime(endTime);
        testUsage.setStatus("ACTIVE");
        testUsage.setCreatedOn(LocalDateTime.now());
    }

    @Test
    @DisplayName("Should log equipment usage")
    @WithMockUser(username = "admin@mes.com")
    void logUsage_ValidRequest_ReturnsUsageInfo() throws Exception {
        EquipmentUsageDTO.LogUsageRequest request = EquipmentUsageDTO.LogUsageRequest.builder()
                .operationId(1L)
                .equipmentId(1L)
                .operatorId(1L)
                .startTime(startTime)
                .endTime(endTime)
                .build();

        when(equipmentUsageService.logEquipmentUsage(eq(1L), eq(1L), eq(1L), any(), any()))
                .thenReturn(testUsage);

        mockMvc.perform(post("/api/equipment-usage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usageId").value(1))
                .andExpect(jsonPath("$.operationId").value(1))
                .andExpect(jsonPath("$.operationName").value("Melting"))
                .andExpect(jsonPath("$.equipmentId").value(1))
                .andExpect(jsonPath("$.equipmentCode").value("EQ-001"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        verify(equipmentUsageService, times(1)).logEquipmentUsage(eq(1L), eq(1L), eq(1L), any(), any());
    }

    @Test
    @DisplayName("Should log bulk equipment usage")
    @WithMockUser(username = "admin@mes.com")
    void logBulkUsage_ValidRequest_ReturnsOk() throws Exception {
        EquipmentUsageDTO.BulkLogRequest request = EquipmentUsageDTO.BulkLogRequest.builder()
                .operationId(1L)
                .equipmentIds(List.of(1L, 2L))
                .operatorIds(List.of(1L))
                .startTime(startTime)
                .endTime(endTime)
                .build();

        doNothing().when(equipmentUsageService).logEquipmentUsagesForConfirmation(
                eq(1L), anyList(), anyList(), any(), any());

        mockMvc.perform(post("/api/equipment-usage/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(equipmentUsageService, times(1)).logEquipmentUsagesForConfirmation(
                eq(1L), anyList(), anyList(), any(), any());
    }

    @Test
    @DisplayName("Should get usage records for operation")
    @WithMockUser(username = "admin@mes.com")
    void getOperationUsage_ValidId_ReturnsUsages() throws Exception {
        when(equipmentUsageService.getUsageForOperation(1L)).thenReturn(List.of(testUsage));

        mockMvc.perform(get("/api/equipment-usage/operation/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usageId").value(1))
                .andExpect(jsonPath("$[0].operationId").value(1))
                .andExpect(jsonPath("$[0].equipmentCode").value("EQ-001"));

        verify(equipmentUsageService, times(1)).getUsageForOperation(1L);
    }

    @Test
    @DisplayName("Should get equipment usage history")
    @WithMockUser(username = "admin@mes.com")
    void getEquipmentUsageHistory_ValidId_ReturnsHistory() throws Exception {
        when(equipmentUsageService.getEquipmentUsageHistory(1L)).thenReturn(List.of(testUsage));

        mockMvc.perform(get("/api/equipment-usage/equipment/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usageId").value(1))
                .andExpect(jsonPath("$[0].equipmentId").value(1))
                .andExpect(jsonPath("$[0].equipmentName").value("Furnace 1"));

        verify(equipmentUsageService, times(1)).getEquipmentUsageHistory(1L);
    }

    @Test
    @DisplayName("Should get operator usage history")
    @WithMockUser(username = "admin@mes.com")
    void getOperatorUsageHistory_ValidId_ReturnsHistory() throws Exception {
        when(equipmentUsageService.getOperatorUsageHistory(1L)).thenReturn(List.of(testUsage));

        mockMvc.perform(get("/api/equipment-usage/operator/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usageId").value(1))
                .andExpect(jsonPath("$[0].operatorId").value(1))
                .andExpect(jsonPath("$[0].operatorName").value("John Smith"));

        verify(equipmentUsageService, times(1)).getOperatorUsageHistory(1L);
    }

    @Test
    @DisplayName("Should check if equipment is in use")
    @WithMockUser(username = "admin@mes.com")
    void isEquipmentInUse_EquipmentInUse_ReturnsTrue() throws Exception {
        when(equipmentUsageService.isEquipmentInUse(1L)).thenReturn(true);

        mockMvc.perform(get("/api/equipment-usage/equipment/1/in-use"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));

        verify(equipmentUsageService, times(1)).isEquipmentInUse(1L);
    }

    @Test
    @DisplayName("Should check if equipment is not in use")
    @WithMockUser(username = "admin@mes.com")
    void isEquipmentInUse_EquipmentNotInUse_ReturnsFalse() throws Exception {
        when(equipmentUsageService.isEquipmentInUse(1L)).thenReturn(false);

        mockMvc.perform(get("/api/equipment-usage/equipment/1/in-use"))
                .andExpect(status().isOk())
                .andExpect(content().string("false"));

        verify(equipmentUsageService, times(1)).isEquipmentInUse(1L);
    }

    @Test
    @DisplayName("Should confirm usage record")
    @WithMockUser(username = "admin@mes.com")
    void confirmUsage_ValidId_ReturnsConfirmedUsage() throws Exception {
        testUsage.setStatus("CONFIRMED");
        when(equipmentUsageService.confirmUsage(1L)).thenReturn(testUsage);

        mockMvc.perform(put("/api/equipment-usage/1/confirm"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usageId").value(1))
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        verify(equipmentUsageService, times(1)).confirmUsage(1L);
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void logUsage_NotAuthenticated_Returns401() throws Exception {
        EquipmentUsageDTO.LogUsageRequest request = EquipmentUsageDTO.LogUsageRequest.builder()
                .operationId(1L)
                .equipmentId(1L)
                .operatorId(1L)
                .startTime(startTime)
                .endTime(endTime)
                .build();

        mockMvc.perform(post("/api/equipment-usage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should return empty list when no usage records for operation")
    @WithMockUser(username = "admin@mes.com")
    void getOperationUsage_NoRecords_ReturnsEmptyList() throws Exception {
        when(equipmentUsageService.getUsageForOperation(999L)).thenReturn(List.of());

        mockMvc.perform(get("/api/equipment-usage/operation/999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());

        verify(equipmentUsageService, times(1)).getUsageForOperation(999L);
    }

    @Test
    @DisplayName("Should return empty list when no usage history for equipment")
    @WithMockUser(username = "admin@mes.com")
    void getEquipmentUsageHistory_NoHistory_ReturnsEmptyList() throws Exception {
        when(equipmentUsageService.getEquipmentUsageHistory(999L)).thenReturn(List.of());

        mockMvc.perform(get("/api/equipment-usage/equipment/999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());

        verify(equipmentUsageService, times(1)).getEquipmentUsageHistory(999L);
    }
}
