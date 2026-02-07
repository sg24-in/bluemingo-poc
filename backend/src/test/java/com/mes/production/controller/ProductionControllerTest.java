package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.ProductionConfirmationDTO;
import com.mes.production.entity.*;
import com.mes.production.security.JwtService;
import com.mes.production.service.ProductionService;
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

import java.math.BigDecimal;
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
class ProductionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductionService productionService;

    @MockBean
    private JwtService jwtService;

    private ProductionConfirmationDTO.Request testRequest;
    private ProductionConfirmationDTO.Response testResponse;

    @BeforeEach
    void setUp() {
        testRequest = ProductionConfirmationDTO.Request.builder()
                .operationId(1L)
                .producedQty(new BigDecimal("100.00"))
                .materialsConsumed(List.of(
                        ProductionConfirmationDTO.MaterialConsumption.builder()
                                .batchId(1L)
                                .inventoryId(1L)
                                .quantity(new BigDecimal("50.00"))
                                .build()
                ))
                .equipmentIds(List.of(1L))
                .operatorIds(List.of(1L))
                .startTime(LocalDateTime.now().minusHours(1))
                .endTime(LocalDateTime.now())
                .build();

        testResponse = ProductionConfirmationDTO.Response.builder()
                .confirmationId(1L)
                .operationId(1L)
                .operationName("Melting")
                .producedQty(new BigDecimal("100.00"))
                .status("CONFIRMED")
                .createdOn(LocalDateTime.now())
                .outputBatch(ProductionConfirmationDTO.BatchInfo.builder()
                        .batchId(2L)
                        .batchNumber("BATCH-OUT-001")
                        .materialId("IM-MELT")
                        .quantity(new BigDecimal("100.00"))
                        .build())
                .build();
    }

    @Test
    @DisplayName("Should confirm production successfully")
    @WithMockUser(username = "admin@mes.com")
    void confirmProduction_ValidRequest_ReturnsSuccess() throws Exception {
        when(productionService.confirmProduction(any(ProductionConfirmationDTO.Request.class)))
                .thenReturn(testResponse);

        mockMvc.perform(post("/api/production/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.confirmationId").value(1))
                .andExpect(jsonPath("$.operationName").value("Melting"))
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.outputBatch.batchNumber").value("BATCH-OUT-001"));

        verify(productionService, times(1)).confirmProduction(any());
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void confirmProduction_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(post("/api/production/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should get operation details successfully")
    @WithMockUser(username = "admin@mes.com")
    void getOperationDetails_ValidId_ReturnsOperation() throws Exception {
        Order order = Order.builder().orderId(1L).status("IN_PROGRESS").build();
        OrderLineItem lineItem = OrderLineItem.builder()
                .orderLineId(1L)
                .productSku("STEEL-001")
                .productName("Steel Rod")
                .quantity(new BigDecimal("1000"))
                .order(order)
                .build();
        // Process is design-time only (no OrderLineItem reference)
        com.mes.production.entity.Process process = com.mes.production.entity.Process.builder()
                .processId(1L)
                .processName("Melting")
                .build();
        // Operation links to both Process (design-time) and OrderLineItem (runtime)
        Operation operation = Operation.builder()
                .operationId(1L)
                .operationName("Melt Iron")
                .operationCode("MLT-001")
                .operationType("TRANSFORM")
                .status("READY")
                .process(process)
                .orderLineItem(lineItem)
                .build();

        when(productionService.getOperationDetails(1L)).thenReturn(operation);

        mockMvc.perform(get("/api/production/operations/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operationId").value(1))
                .andExpect(jsonPath("$.operationName").value("Melt Iron"))
                .andExpect(jsonPath("$.status").value("READY"));

        verify(productionService, times(1)).getOperationDetails(1L);
    }

    @Test
    @DisplayName("Should handle service exception")
    @WithMockUser(username = "admin@mes.com")
    void confirmProduction_ServiceException_ReturnsError() throws Exception {
        when(productionService.confirmProduction(any()))
                .thenThrow(new RuntimeException("Operation is on hold"));

        mockMvc.perform(post("/api/production/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testRequest)))
                .andExpect(status().isBadRequest());
    }

    // ==================== Production History Tests (#115) ====================

    @Test
    @DisplayName("Should get confirmation by ID")
    @WithMockUser(username = "admin@mes.com")
    void getConfirmation_ValidId_ReturnsConfirmation() throws Exception {
        when(productionService.getConfirmationById(1L)).thenReturn(testResponse);

        mockMvc.perform(get("/api/production/confirmations/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.confirmationId").value(1))
                .andExpect(jsonPath("$.operationName").value("Melting"))
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        verify(productionService, times(1)).getConfirmationById(1L);
    }

    @Test
    @DisplayName("Should get confirmations by status")
    @WithMockUser(username = "admin@mes.com")
    void getConfirmationsByStatus_ValidStatus_ReturnsConfirmations() throws Exception {
        when(productionService.getConfirmationsByStatus("CONFIRMED"))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/production/confirmations/status/CONFIRMED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].confirmationId").value(1))
                .andExpect(jsonPath("$[0].status").value("CONFIRMED"));

        verify(productionService, times(1)).getConfirmationsByStatus("CONFIRMED");
    }

    @Test
    @DisplayName("Should get confirmations by status - case insensitive")
    @WithMockUser(username = "admin@mes.com")
    void getConfirmationsByStatus_LowerCase_ReturnsConfirmations() throws Exception {
        when(productionService.getConfirmationsByStatus("CONFIRMED"))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/production/confirmations/status/confirmed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("CONFIRMED"));

        verify(productionService, times(1)).getConfirmationsByStatus("CONFIRMED");
    }

    @Test
    @DisplayName("Should get rejected confirmations")
    @WithMockUser(username = "admin@mes.com")
    void getRejectedConfirmations_ReturnsRejected() throws Exception {
        ProductionConfirmationDTO.Response rejectedResponse = ProductionConfirmationDTO.Response.builder()
                .confirmationId(2L)
                .operationId(2L)
                .operationName("Casting")
                .producedQty(new BigDecimal("50.00"))
                .status("REJECTED")
                .createdOn(LocalDateTime.now())
                .build();

        when(productionService.getConfirmationsByStatus("REJECTED"))
                .thenReturn(List.of(rejectedResponse));

        mockMvc.perform(get("/api/production/confirmations/rejected"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].confirmationId").value(2))
                .andExpect(jsonPath("$[0].status").value("REJECTED"));

        verify(productionService, times(1)).getConfirmationsByStatus("REJECTED");
    }

    @Test
    @DisplayName("Should reject confirmation successfully")
    @WithMockUser(username = "admin@mes.com")
    void rejectConfirmation_ValidRequest_ReturnsSuccess() throws Exception {
        ProductionConfirmationDTO.StatusUpdateResponse updateResponse =
                ProductionConfirmationDTO.StatusUpdateResponse.builder()
                        .confirmationId(1L)
                        .previousStatus("PENDING")
                        .newStatus("REJECTED")
                        .message("Confirmation rejected successfully")
                        .build();

        when(productionService.rejectConfirmation(any(ProductionConfirmationDTO.RejectionRequest.class)))
                .thenReturn(updateResponse);

        String requestBody = "{\"reason\":\"Quality issue\",\"notes\":\"Material defect\"}";

        mockMvc.perform(post("/api/production/confirmations/1/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.confirmationId").value(1))
                .andExpect(jsonPath("$.newStatus").value("REJECTED"));

        verify(productionService, times(1)).rejectConfirmation(any());
    }

    @Test
    @DisplayName("Should return empty list when no confirmations found")
    @WithMockUser(username = "admin@mes.com")
    void getConfirmationsByStatus_NoResults_ReturnsEmptyList() throws Exception {
        when(productionService.getConfirmationsByStatus("PENDING"))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/production/confirmations/status/PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());

        verify(productionService, times(1)).getConfirmationsByStatus("PENDING");
    }

    @Test
    @DisplayName("Should handle confirmation not found")
    @WithMockUser(username = "admin@mes.com")
    void getConfirmation_NotFound_ReturnsError() throws Exception {
        when(productionService.getConfirmationById(999L))
                .thenThrow(new RuntimeException("Confirmation not found"));

        mockMvc.perform(get("/api/production/confirmations/999"))
                .andExpect(status().isBadRequest());

        verify(productionService, times(1)).getConfirmationById(999L);
    }

    @Test
    @DisplayName("Should return 401 for confirmations when not authenticated")
    void getConfirmations_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/production/confirmations/1"))
                .andExpect(status().isUnauthorized());
    }
}
