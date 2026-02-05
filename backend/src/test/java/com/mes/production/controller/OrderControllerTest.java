package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.OrderDTO;
import com.mes.production.dto.order.CreateOrderRequest;
import com.mes.production.dto.order.LineItemRequest;
import com.mes.production.dto.order.UpdateOrderRequest;
import com.mes.production.security.JwtService;
import com.mes.production.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
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

    @Nested
    @DisplayName("Create Order Tests")
    class CreateOrderTests {

        @Test
        @DisplayName("Should create order successfully")
        @WithMockUser(username = "admin@mes.com")
        void createOrder_ValidData_ReturnsCreated() throws Exception {
            CreateOrderRequest request = CreateOrderRequest.builder()
                    .customerId("CUST-001")
                    .customerName("Test Customer")
                    .orderDate(LocalDate.now())
                    .lineItems(List.of(
                            CreateOrderRequest.LineItemRequest.builder()
                                    .productSku("PROD-001")
                                    .productName("Test Product")
                                    .quantity(BigDecimal.valueOf(100))
                                    .unit("KG")
                                    .build()
                    ))
                    .build();

            when(orderService.createOrder(any(CreateOrderRequest.class))).thenReturn(testOrder);

            mockMvc.perform(post("/api/orders")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.orderId").value(1))
                    .andExpect(jsonPath("$.customerId").value("CUST-001"));

            verify(orderService).createOrder(any(CreateOrderRequest.class));
        }

        @Test
        @DisplayName("Should return bad request for invalid data")
        @WithMockUser(username = "admin@mes.com")
        void createOrder_InvalidData_ReturnsBadRequest() throws Exception {
            CreateOrderRequest request = CreateOrderRequest.builder()
                    .customerId("")  // Invalid - blank
                    .customerName("Test Customer")
                    .orderDate(LocalDate.now())
                    .lineItems(List.of())  // Invalid - empty
                    .build();

            mockMvc.perform(post("/api/orders")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Update Order Tests")
    class UpdateOrderTests {

        @Test
        @DisplayName("Should update order successfully")
        @WithMockUser(username = "admin@mes.com")
        void updateOrder_ValidData_ReturnsOk() throws Exception {
            UpdateOrderRequest request = UpdateOrderRequest.builder()
                    .customerId("CUST-002")
                    .customerName("Updated Customer")
                    .status("IN_PROGRESS")
                    .build();

            OrderDTO updatedOrder = OrderDTO.builder()
                    .orderId(1L)
                    .customerId("CUST-002")
                    .customerName("Updated Customer")
                    .status("IN_PROGRESS")
                    .lineItems(testOrder.getLineItems())
                    .build();

            when(orderService.updateOrder(eq(1L), any(UpdateOrderRequest.class))).thenReturn(updatedOrder);

            mockMvc.perform(put("/api/orders/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.customerId").value("CUST-002"))
                    .andExpect(jsonPath("$.customerName").value("Updated Customer"));

            verify(orderService).updateOrder(eq(1L), any(UpdateOrderRequest.class));
        }

        @Test
        @DisplayName("Should return bad request for non-existent order")
        @WithMockUser(username = "admin@mes.com")
        void updateOrder_NotFound_ReturnsBadRequest() throws Exception {
            UpdateOrderRequest request = UpdateOrderRequest.builder()
                    .customerId("CUST-002")
                    .customerName("Updated Customer")
                    .build();

            when(orderService.updateOrder(eq(999L), any(UpdateOrderRequest.class)))
                    .thenThrow(new RuntimeException("Order not found"));

            mockMvc.perform(put("/api/orders/999")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Delete Order Tests")
    class DeleteOrderTests {

        @Test
        @DisplayName("Should delete order successfully")
        @WithMockUser(username = "admin@mes.com")
        void deleteOrder_ValidId_ReturnsNoContent() throws Exception {
            doNothing().when(orderService).deleteOrder(1L);

            mockMvc.perform(delete("/api/orders/1"))
                    .andExpect(status().isNoContent());

            verify(orderService).deleteOrder(1L);
        }

        @Test
        @DisplayName("Should return bad request for non-deletable order")
        @WithMockUser(username = "admin@mes.com")
        void deleteOrder_NotDeletable_ReturnsBadRequest() throws Exception {
            doThrow(new RuntimeException("Cannot delete order with status: IN_PROGRESS"))
                    .when(orderService).deleteOrder(1L);

            mockMvc.perform(delete("/api/orders/1"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Line Item Tests")
    class LineItemTests {

        @Test
        @DisplayName("Should add line item successfully")
        @WithMockUser(username = "admin@mes.com")
        void addLineItem_ValidData_ReturnsOk() throws Exception {
            LineItemRequest request = LineItemRequest.builder()
                    .productSku("PROD-002")
                    .productName("New Product")
                    .quantity(BigDecimal.valueOf(50))
                    .unit("KG")
                    .build();

            when(orderService.addLineItem(eq(1L), any(LineItemRequest.class))).thenReturn(testOrder);

            mockMvc.perform(post("/api/orders/1/line-items")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.orderId").value(1));

            verify(orderService).addLineItem(eq(1L), any(LineItemRequest.class));
        }

        @Test
        @DisplayName("Should update line item successfully")
        @WithMockUser(username = "admin@mes.com")
        void updateLineItem_ValidData_ReturnsOk() throws Exception {
            LineItemRequest request = LineItemRequest.builder()
                    .productSku("PROD-002")
                    .productName("Updated Product")
                    .quantity(BigDecimal.valueOf(200))
                    .unit("KG")
                    .build();

            when(orderService.updateLineItem(eq(1L), eq(1L), any(LineItemRequest.class))).thenReturn(testOrder);

            mockMvc.perform(put("/api/orders/1/line-items/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.orderId").value(1));

            verify(orderService).updateLineItem(eq(1L), eq(1L), any(LineItemRequest.class));
        }

        @Test
        @DisplayName("Should delete line item successfully")
        @WithMockUser(username = "admin@mes.com")
        void deleteLineItem_ValidData_ReturnsOk() throws Exception {
            when(orderService.deleteLineItem(1L, 1L)).thenReturn(testOrder);

            mockMvc.perform(delete("/api/orders/1/line-items/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.orderId").value(1));

            verify(orderService).deleteLineItem(1L, 1L);
        }
    }
}
