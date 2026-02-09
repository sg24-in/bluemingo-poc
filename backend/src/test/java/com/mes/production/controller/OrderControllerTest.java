package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.OrderDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
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
    private OrderDTO.OrderLineDTO testLineItem;

    @BeforeEach
    void setUp() {
        OrderDTO.OperationDTO operationDTO = OrderDTO.OperationDTO.builder()
                .operationId(1L)
                .operationName("Melt Iron")
                .operationCode("MLT-001")
                .status("READY")
                .processId(1L)
                .processName("Melting")
                .build();

        testLineItem = OrderDTO.OrderLineDTO.builder()
                .orderLineId(1L)
                .productSku("STEEL-001")
                .productName("Steel Rod")
                .quantity(new BigDecimal("1000"))
                .operations(List.of(operationDTO))
                .build();

        testOrder = OrderDTO.builder()
                .orderId(1L)
                .customerId("CUST-001")
                .customerName("Test Customer")
                .status("IN_PROGRESS")
                .lineItems(List.of(testLineItem))
                .build();
    }

    @Nested
    @DisplayName("GET /api/orders Tests")
    class GetAllOrdersTests {

        @Test
        @DisplayName("should_returnActiveOrders_when_authenticatedUserRequests")
        @WithMockUser(username = "admin@mes.com")
        void should_returnActiveOrders_when_authenticatedUserRequests() throws Exception {
            when(orderService.getActiveOrders()).thenReturn(List.of(testOrder));

            mockMvc.perform(get("/api/orders"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].orderId").value(1))
                    .andExpect(jsonPath("$[0].customerId").value("CUST-001"))
                    .andExpect(jsonPath("$[0].status").value("IN_PROGRESS"));

            verify(orderService, times(1)).getActiveOrders();
        }

        @Test
        @DisplayName("should_returnEmptyList_when_noOrdersExist")
        @WithMockUser(username = "admin@mes.com")
        void should_returnEmptyList_when_noOrdersExist() throws Exception {
            when(orderService.getActiveOrders()).thenReturn(List.of());

            mockMvc.perform(get("/api/orders"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            mockMvc.perform(get("/api/orders"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should_returnMultipleOrders_when_multipleExist")
        @WithMockUser(username = "admin@mes.com")
        void should_returnMultipleOrders_when_multipleExist() throws Exception {
            OrderDTO order2 = OrderDTO.builder()
                    .orderId(2L)
                    .customerId("CUST-002")
                    .customerName("Second Customer")
                    .status("PENDING")
                    .lineItems(List.of())
                    .build();

            when(orderService.getActiveOrders()).thenReturn(List.of(testOrder, order2));

            mockMvc.perform(get("/api/orders"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].orderId").value(1))
                    .andExpect(jsonPath("$[1].orderId").value(2));
        }
    }

    @Nested
    @DisplayName("GET /api/orders/paged Tests")
    class GetOrdersPagedTests {

        @Test
        @DisplayName("should_returnPagedOrders_when_defaultPaginationUsed")
        @WithMockUser(username = "admin@mes.com")
        void should_returnPagedOrders_when_defaultPaginationUsed() throws Exception {
            PagedResponseDTO<OrderDTO> pagedResponse = PagedResponseDTO.<OrderDTO>builder()
                    .content(List.of(testOrder))
                    .page(0)
                    .size(20)
                    .totalElements(1L)
                    .totalPages(1)
                    .first(true)
                    .last(true)
                    .hasNext(false)
                    .hasPrevious(false)
                    .build();

            when(orderService.getOrdersPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/orders/paged"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].orderId").value(1))
                    .andExpect(jsonPath("$.page").value(0))
                    .andExpect(jsonPath("$.size").value(20))
                    .andExpect(jsonPath("$.totalElements").value(1))
                    .andExpect(jsonPath("$.first").value(true))
                    .andExpect(jsonPath("$.last").value(true));
        }

        @Test
        @DisplayName("should_returnPagedOrders_when_customPaginationProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_returnPagedOrders_when_customPaginationProvided() throws Exception {
            PagedResponseDTO<OrderDTO> pagedResponse = PagedResponseDTO.<OrderDTO>builder()
                    .content(List.of(testOrder))
                    .page(1)
                    .size(10)
                    .totalElements(15L)
                    .totalPages(2)
                    .first(false)
                    .last(true)
                    .hasNext(false)
                    .hasPrevious(true)
                    .build();

            when(orderService.getOrdersPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/orders/paged")
                            .param("page", "1")
                            .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.page").value(1))
                    .andExpect(jsonPath("$.size").value(10))
                    .andExpect(jsonPath("$.hasPrevious").value(true));
        }

        @Test
        @DisplayName("should_filterByStatus_when_statusProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_filterByStatus_when_statusProvided() throws Exception {
            PagedResponseDTO<OrderDTO> pagedResponse = PagedResponseDTO.<OrderDTO>builder()
                    .content(List.of(testOrder))
                    .page(0)
                    .size(20)
                    .totalElements(1L)
                    .totalPages(1)
                    .build();

            when(orderService.getOrdersPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/orders/paged")
                            .param("status", "IN_PROGRESS"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].status").value("IN_PROGRESS"));

            verify(orderService).getOrdersPaged(argThat(req -> "IN_PROGRESS".equals(req.getStatus())));
        }

        @Test
        @DisplayName("should_searchOrders_when_searchTermProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_searchOrders_when_searchTermProvided() throws Exception {
            PagedResponseDTO<OrderDTO> pagedResponse = PagedResponseDTO.<OrderDTO>builder()
                    .content(List.of(testOrder))
                    .page(0)
                    .size(20)
                    .totalElements(1L)
                    .totalPages(1)
                    .build();

            when(orderService.getOrdersPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/orders/paged")
                            .param("search", "Test Customer"))
                    .andExpect(status().isOk());

            verify(orderService).getOrdersPaged(argThat(req -> "Test Customer".equals(req.getSearch())));
        }

        @Test
        @DisplayName("should_sortOrders_when_sortParametersProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_sortOrders_when_sortParametersProvided() throws Exception {
            PagedResponseDTO<OrderDTO> pagedResponse = PagedResponseDTO.<OrderDTO>builder()
                    .content(List.of(testOrder))
                    .page(0)
                    .size(20)
                    .totalElements(1L)
                    .totalPages(1)
                    .sortBy("orderDate")
                    .sortDirection("DESC")
                    .build();

            when(orderService.getOrdersPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/orders/paged")
                            .param("sortBy", "orderDate")
                            .param("sortDirection", "DESC"))
                    .andExpect(status().isOk());

            verify(orderService).getOrdersPaged(argThat(req ->
                    "orderDate".equals(req.getSortBy()) && "DESC".equals(req.getSortDirection())));
        }
    }

    @Nested
    @DisplayName("GET /api/orders/{id} Tests")
    class GetOrderByIdTests {

        @Test
        @DisplayName("should_returnOrder_when_validIdProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_returnOrder_when_validIdProvided() throws Exception {
            when(orderService.getOrderById(1L)).thenReturn(testOrder);

            mockMvc.perform(get("/api/orders/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.orderId").value(1))
                    .andExpect(jsonPath("$.customerId").value("CUST-001"))
                    .andExpect(jsonPath("$.customerName").value("Test Customer"))
                    .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                    .andExpect(jsonPath("$.lineItems[0].productSku").value("STEEL-001"));

            verify(orderService, times(1)).getOrderById(1L);
        }

        @Test
        @DisplayName("should_returnOrderWithOperations_when_lineItemsHaveOperations")
        @WithMockUser(username = "admin@mes.com")
        void should_returnOrderWithOperations_when_lineItemsHaveOperations() throws Exception {
            when(orderService.getOrderById(1L)).thenReturn(testOrder);

            mockMvc.perform(get("/api/orders/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.lineItems[0].operations[0].operationId").value(1))
                    .andExpect(jsonPath("$.lineItems[0].operations[0].operationName").value("Melt Iron"))
                    .andExpect(jsonPath("$.lineItems[0].operations[0].status").value("READY"));
        }

        @Test
        @DisplayName("should_returnBadRequest_when_orderNotFound")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBadRequest_when_orderNotFound() throws Exception {
            when(orderService.getOrderById(999L))
                    .thenThrow(new RuntimeException("Order not found"));

            mockMvc.perform(get("/api/orders/999"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            mockMvc.perform(get("/api/orders/1"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/orders/available Tests")
    class GetAvailableOrdersTests {

        @Test
        @DisplayName("should_returnAvailableOrders_when_ordersWithReadyOperationsExist")
        @WithMockUser(username = "admin@mes.com")
        void should_returnAvailableOrders_when_ordersWithReadyOperationsExist() throws Exception {
            when(orderService.getAvailableOrders()).thenReturn(List.of(testOrder));

            mockMvc.perform(get("/api/orders/available"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].orderId").value(1))
                    .andExpect(jsonPath("$[0].customerId").value("CUST-001"))
                    .andExpect(jsonPath("$[0].status").value("IN_PROGRESS"));

            verify(orderService, times(1)).getAvailableOrders();
        }

        @Test
        @DisplayName("should_returnEmptyList_when_noAvailableOrders")
        @WithMockUser(username = "admin@mes.com")
        void should_returnEmptyList_when_noAvailableOrders() throws Exception {
            when(orderService.getAvailableOrders()).thenReturn(List.of());

            mockMvc.perform(get("/api/orders/available"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }
    }

    @Nested
    @DisplayName("POST /api/orders Tests")
    class CreateOrderTests {

        @Test
        @DisplayName("should_createOrder_when_validDataProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_createOrder_when_validDataProvided() throws Exception {
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
        @DisplayName("should_returnBadRequest_when_customerIdBlank")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBadRequest_when_customerIdBlank() throws Exception {
            CreateOrderRequest request = CreateOrderRequest.builder()
                    .customerId("")
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

            mockMvc.perform(post("/api/orders")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should_returnBadRequest_when_noLineItems")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBadRequest_when_noLineItems() throws Exception {
            CreateOrderRequest request = CreateOrderRequest.builder()
                    .customerId("CUST-001")
                    .customerName("Test Customer")
                    .orderDate(LocalDate.now())
                    .lineItems(List.of())
                    .build();

            mockMvc.perform(post("/api/orders")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            CreateOrderRequest request = CreateOrderRequest.builder()
                    .customerId("CUST-001")
                    .customerName("Test Customer")
                    .orderDate(LocalDate.now())
                    .lineItems(List.of())
                    .build();

            mockMvc.perform(post("/api/orders")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("PUT /api/orders/{id} Tests")
    class UpdateOrderTests {

        @Test
        @DisplayName("should_updateOrder_when_validDataProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_updateOrder_when_validDataProvided() throws Exception {
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
        @DisplayName("should_returnBadRequest_when_orderNotFound")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBadRequest_when_orderNotFound() throws Exception {
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

        @Test
        @DisplayName("should_updateOrderStatus_when_statusProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_updateOrderStatus_when_statusProvided() throws Exception {
            UpdateOrderRequest request = UpdateOrderRequest.builder()
                    .customerId("CUST-001")
                    .customerName("Test Customer")
                    .status("COMPLETED")
                    .build();

            OrderDTO updatedOrder = OrderDTO.builder()
                    .orderId(1L)
                    .customerId("CUST-001")
                    .customerName("Test Customer")
                    .status("COMPLETED")
                    .lineItems(testOrder.getLineItems())
                    .build();

            when(orderService.updateOrder(eq(1L), any(UpdateOrderRequest.class))).thenReturn(updatedOrder);

            mockMvc.perform(put("/api/orders/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("COMPLETED"));
        }
    }

    @Nested
    @DisplayName("DELETE /api/orders/{id} Tests")
    class DeleteOrderTests {

        @Test
        @DisplayName("should_deleteOrder_when_validIdProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_deleteOrder_when_validIdProvided() throws Exception {
            doNothing().when(orderService).deleteOrder(1L);

            mockMvc.perform(delete("/api/orders/1"))
                    .andExpect(status().isNoContent());

            verify(orderService).deleteOrder(1L);
        }

        @Test
        @DisplayName("should_returnBadRequest_when_orderCannotBeDeleted")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBadRequest_when_orderCannotBeDeleted() throws Exception {
            doThrow(new RuntimeException("Cannot delete order with status: IN_PROGRESS"))
                    .when(orderService).deleteOrder(1L);

            mockMvc.perform(delete("/api/orders/1"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should_returnBadRequest_when_orderNotFound")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBadRequest_when_orderNotFound() throws Exception {
            doThrow(new RuntimeException("Order not found"))
                    .when(orderService).deleteOrder(999L);

            mockMvc.perform(delete("/api/orders/999"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Line Item Operation Tests")
    class LineItemTests {

        @Test
        @DisplayName("should_addLineItem_when_validDataProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_addLineItem_when_validDataProvided() throws Exception {
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
        @DisplayName("should_updateLineItem_when_validDataProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_updateLineItem_when_validDataProvided() throws Exception {
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
        @DisplayName("should_deleteLineItem_when_validIdsProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_deleteLineItem_when_validIdsProvided() throws Exception {
            when(orderService.deleteLineItem(1L, 1L)).thenReturn(testOrder);

            mockMvc.perform(delete("/api/orders/1/line-items/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.orderId").value(1));

            verify(orderService).deleteLineItem(1L, 1L);
        }

        @Test
        @DisplayName("should_returnBadRequest_when_lineItemNotFound")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBadRequest_when_lineItemNotFound() throws Exception {
            when(orderService.deleteLineItem(1L, 999L))
                    .thenThrow(new RuntimeException("Line item not found"));

            mockMvc.perform(delete("/api/orders/1/line-items/999"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should_returnBadRequest_when_addingToNonExistentOrder")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBadRequest_when_addingToNonExistentOrder() throws Exception {
            LineItemRequest request = LineItemRequest.builder()
                    .productSku("PROD-002")
                    .productName("New Product")
                    .quantity(BigDecimal.valueOf(50))
                    .unit("KG")
                    .build();

            when(orderService.addLineItem(eq(999L), any(LineItemRequest.class)))
                    .thenThrow(new RuntimeException("Order not found"));

            mockMvc.perform(post("/api/orders/999/line-items")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }
}
