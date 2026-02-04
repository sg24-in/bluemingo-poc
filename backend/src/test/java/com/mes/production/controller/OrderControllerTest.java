package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.OrderDTO;
import com.mes.production.security.JwtService;
import com.mes.production.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderService orderService;

    @MockBean
    private JwtService jwtService;

    private OrderDTO testOrder;

    @BeforeEach
    void setUp() {
        OrderDTO.ProcessDTO processDTO = OrderDTO.ProcessDTO.builder()
                .processId(1L)
                .stageName("Melting")
                .stageSequence(1)
                .status("IN_PROGRESS")
                .operations(List.of(
                        OrderDTO.OperationDTO.builder()
                                .operationId(1L)
                                .operationName("Melt Iron")
                                .operationCode("MLT-001")
                                .status("READY")
                                .build()
                ))
                .build();

        OrderDTO.OrderLineDTO lineItem = OrderDTO.OrderLineDTO.builder()
                .orderLineId(1L)
                .productSku("STEEL-001")
                .productName("Steel Rod")
                .quantity(new BigDecimal("1000"))
                .processes(List.of(processDTO))
                .build();

        testOrder = OrderDTO.builder()
                .orderId(1L)
                .customerId("CUST-001")
                .customerName("Test Customer")
                .status("IN_PROGRESS")
                .lineItems(List.of(lineItem))
                .build();
    }

    @Test
    @DisplayName("Should get available orders")
    @WithMockUser(username = "admin@mes.com")
    void getAvailableOrders_ReturnsOrders() throws Exception {
        when(orderService.getAvailableOrders()).thenReturn(List.of(testOrder));

        mockMvc.perform(get("/api/orders/available"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].orderId").value(1))
                .andExpect(jsonPath("$[0].customerId").value("CUST-001"))
                .andExpect(jsonPath("$[0].status").value("IN_PROGRESS"));

        verify(orderService, times(1)).getAvailableOrders();
    }

    @Test
    @DisplayName("Should get active orders")
    @WithMockUser(username = "admin@mes.com")
    void getActiveOrders_ReturnsOrders() throws Exception {
        when(orderService.getActiveOrders()).thenReturn(List.of(testOrder));

        mockMvc.perform(get("/api/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].orderId").value(1));

        verify(orderService, times(1)).getActiveOrders();
    }

    @Test
    @DisplayName("Should get order by ID")
    @WithMockUser(username = "admin@mes.com")
    void getOrderById_ValidId_ReturnsOrder() throws Exception {
        when(orderService.getOrderById(1L)).thenReturn(testOrder);

        mockMvc.perform(get("/api/orders/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(1))
                .andExpect(jsonPath("$.customerId").value("CUST-001"))
                .andExpect(jsonPath("$.lineItems[0].productSku").value("STEEL-001"));

        verify(orderService, times(1)).getOrderById(1L);
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void getOrders_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/orders"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should handle not found exception")
    @WithMockUser(username = "admin@mes.com")
    void getOrderById_NotFound_ReturnsError() throws Exception {
        when(orderService.getOrderById(999L))
                .thenThrow(new RuntimeException("Order not found"));

        mockMvc.perform(get("/api/orders/999"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return empty list when no available orders")
    @WithMockUser(username = "admin@mes.com")
    void getAvailableOrders_NoOrders_ReturnsEmptyList() throws Exception {
        when(orderService.getAvailableOrders()).thenReturn(List.of());

        mockMvc.perform(get("/api/orders/available"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }
}
