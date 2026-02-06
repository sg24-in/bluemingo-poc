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
}
