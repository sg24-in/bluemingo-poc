package com.mes.production.service;

import com.mes.production.dto.OrderDTO;
import com.mes.production.dto.order.CreateOrderRequest;
import com.mes.production.dto.order.LineItemRequest;
import com.mes.production.dto.order.UpdateOrderRequest;
import com.mes.production.entity.Order;
import com.mes.production.entity.OrderLineItem;
import com.mes.production.entity.Process;
import com.mes.production.entity.ProcessStatus;
import com.mes.production.entity.Operation;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.OperationRepository;
import com.mes.production.repository.OrderLineItemRepository;
import com.mes.production.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OperationRepository operationRepository;

    @Mock
    private OrderLineItemRepository orderLineItemRepository;

    @Mock
    private AuditTrailRepository auditTrailRepository;

    @InjectMocks
    private OrderService orderService;

    private void setupSecurityContext() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("admin@mes.com");
        SecurityContextHolder.setContext(securityContext);
    }

    private Order testOrder;
    private OrderLineItem testOrderLine;
    private Process testProcess;
    private Operation testOperation;

    @BeforeEach
    void setUp() {
        // Process is design-time only entity (no OrderLineItem reference)
        testProcess = Process.builder()
                .processId(1L)
                .processName("Melting Stage")
                .status(ProcessStatus.ACTIVE)
                .build();

        testOperation = Operation.builder()
                .operationId(1L)
                .operationName("Melting")
                .operationCode("MELT001")
                .operationType("MELTING")
                .sequenceNumber(1)
                .status("READY")
                .process(testProcess)
                .build();

        testOrderLine = OrderLineItem.builder()
                .orderLineId(1L)
                .productSku("STEEL-001")
                .productName("Steel Coil")
                .quantity(BigDecimal.valueOf(100))
                .unit("T")
                .status("IN_PROGRESS")
                .operations(new ArrayList<>(List.of(testOperation)))
                .build();
        testOperation.setOrderLineItem(testOrderLine);

        testOrder = Order.builder()
                .orderId(1L)
                .customerId("CUST001")
                .customerName("Test Customer")
                .orderDate(LocalDate.now())
                .status("IN_PROGRESS")
                .lineItems(new ArrayList<>(List.of(testOrderLine)))
                .build();
        testOrderLine.setOrder(testOrder);
    }

    @Test
    @DisplayName("Should return orders with READY operations")
    void getAvailableOrders_ReturnsOrdersWithReadyOperations() {
        // Arrange
        when(operationRepository.findReadyOperationsWithDetails()).thenReturn(List.of(testOperation));

        // Act
        List<OrderDTO> result = orderService.getAvailableOrders();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getOrderId());
        assertEquals("IN_PROGRESS", result.get(0).getStatus());

        verify(operationRepository, times(1)).findReadyOperationsWithDetails();
    }

    @Test
    @DisplayName("Should return empty list when no orders with READY operations")
    void getAvailableOrders_NoReadyOperations_ReturnsEmptyList() {
        // Arrange
        when(operationRepository.findReadyOperationsWithDetails()).thenReturn(List.of());

        // Act
        List<OrderDTO> result = orderService.getAvailableOrders();

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should return order by ID successfully")
    void getOrderById_ValidId_ReturnsOrder() {
        // Arrange
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        // Act
        OrderDTO result = orderService.getOrderById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getOrderId());
        assertEquals("Test Customer", result.getCustomerName());
        assertEquals("IN_PROGRESS", result.getStatus());
    }

    @Test
    @DisplayName("Should throw exception when order not found")
    void getOrderById_InvalidId_ThrowsException() {
        // Arrange
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> orderService.getOrderById(999L));

        assertTrue(exception.getMessage().contains("not found"));
    }

    @Test
    @DisplayName("Should return all active orders")
    void getActiveOrders_ReturnsActiveOrders() {
        // Arrange
        when(orderRepository.findActiveOrders()).thenReturn(List.of(testOrder));

        // Act
        List<OrderDTO> result = orderService.getActiveOrders();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("IN_PROGRESS", result.get(0).getStatus());

        verify(orderRepository, times(1)).findActiveOrders();
    }

    @Test
    @DisplayName("Should include operations in order line item response")
    void getOrderById_IncludesOperations() {
        // Arrange
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        // Act
        OrderDTO result = orderService.getOrderById(1L);

        // Assert
        assertNotNull(result);
        assertNotNull(result.getLineItems());
        assertFalse(result.getLineItems().isEmpty());
        // Operations are now directly on OrderLineItem (not via Process)
        assertNotNull(result.getLineItems().get(0).getOperations());
        assertFalse(result.getLineItems().get(0).getOperations().isEmpty());
    }

    @Nested
    @DisplayName("Create Order Tests")
    class CreateOrderTests {

        @Test
        @DisplayName("Should create order successfully")
        void createOrder_ValidData_CreatesSuccessfully() {
            setupSecurityContext();

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

            when(orderRepository.save(any(Order.class))).thenAnswer(i -> {
                Order o = i.getArgument(0);
                o.setOrderId(1L);
                return o;
            });
            when(orderLineItemRepository.save(any(OrderLineItem.class))).thenAnswer(i -> {
                OrderLineItem li = i.getArgument(0);
                li.setOrderLineId(1L);
                return li;
            });

            OrderDTO result = orderService.createOrder(request);

            assertNotNull(result);
            assertEquals("CUST-001", result.getCustomerId());
            verify(orderRepository).save(any(Order.class));
            verify(orderLineItemRepository).save(any(OrderLineItem.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should auto-generate order number when not provided")
        void createOrder_NoOrderNumber_AutoGenerates() {
            setupSecurityContext();

            CreateOrderRequest request = CreateOrderRequest.builder()
                    .customerId("CUST-001")
                    .customerName("Test Customer")
                    .orderDate(LocalDate.now())
                    .orderNumber(null)
                    .lineItems(List.of(
                            CreateOrderRequest.LineItemRequest.builder()
                                    .productSku("PROD-001")
                                    .productName("Test Product")
                                    .quantity(BigDecimal.valueOf(100))
                                    .unit("KG")
                                    .build()
                    ))
                    .build();

            when(orderRepository.findMaxOrderNumberSequence()).thenReturn(5);
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> {
                Order o = i.getArgument(0);
                o.setOrderId(1L);
                return o;
            });
            when(orderLineItemRepository.save(any(OrderLineItem.class))).thenAnswer(i -> i.getArgument(0));

            OrderDTO result = orderService.createOrder(request);

            assertNotNull(result);
            verify(orderRepository).findMaxOrderNumberSequence();
        }

        @Test
        @DisplayName("Should throw exception for duplicate order number")
        void createOrder_DuplicateOrderNumber_ThrowsException() {
            setupSecurityContext();

            CreateOrderRequest request = CreateOrderRequest.builder()
                    .customerId("CUST-001")
                    .customerName("Test Customer")
                    .orderDate(LocalDate.now())
                    .orderNumber("ORD-00001")
                    .lineItems(List.of(
                            CreateOrderRequest.LineItemRequest.builder()
                                    .productSku("PROD-001")
                                    .productName("Test Product")
                                    .quantity(BigDecimal.valueOf(100))
                                    .unit("KG")
                                    .build()
                    ))
                    .build();

            when(orderRepository.existsByOrderNumber("ORD-00001")).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> orderService.createOrder(request));

            assertTrue(exception.getMessage().contains("already exists"));
            verify(orderRepository, never()).save(any(Order.class));
        }
    }

    @Nested
    @DisplayName("Update Order Tests")
    class UpdateOrderTests {

        @Test
        @DisplayName("Should update order successfully")
        void updateOrder_ValidData_UpdatesSuccessfully() {
            setupSecurityContext();

            UpdateOrderRequest request = UpdateOrderRequest.builder()
                    .customerId("CUST-002")
                    .customerName("Updated Customer")
                    .status("IN_PROGRESS")
                    .build();

            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

            OrderDTO result = orderService.updateOrder(1L, request);

            assertNotNull(result);
            assertEquals("CUST-002", result.getCustomerId());
            assertEquals("Updated Customer", result.getCustomerName());
            verify(orderRepository).save(any(Order.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception when updating non-existent order")
        void updateOrder_NotFound_ThrowsException() {
            setupSecurityContext();

            UpdateOrderRequest request = UpdateOrderRequest.builder()
                    .customerId("CUST-002")
                    .customerName("Updated Customer")
                    .build();

            when(orderRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> orderService.updateOrder(999L, request));

            assertTrue(exception.getMessage().contains("not found"));
        }
    }

    @Nested
    @DisplayName("Delete Order Tests")
    class DeleteOrderTests {

        @Test
        @DisplayName("Should soft delete order with CREATED status")
        void deleteOrder_CreatedStatus_SoftDeletes() {
            setupSecurityContext();

            testOrder.setStatus("CREATED");
            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

            orderService.deleteOrder(1L);

            verify(orderRepository).save(argThat(order ->
                    "CANCELLED".equals(order.getStatus())
            ));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception when deleting non-CREATED order")
        void deleteOrder_NotCreatedStatus_ThrowsException() {
            setupSecurityContext();

            testOrder.setStatus("IN_PROGRESS");
            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> orderService.deleteOrder(1L));

            assertTrue(exception.getMessage().contains("Cannot delete"));
            verify(orderRepository, never()).save(any(Order.class));
        }

        @Test
        @DisplayName("Should throw exception when deleting non-existent order")
        void deleteOrder_NotFound_ThrowsException() {
            setupSecurityContext();

            when(orderRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> orderService.deleteOrder(999L));

            assertTrue(exception.getMessage().contains("not found"));
        }
    }

    @Nested
    @DisplayName("Line Item Tests")
    class LineItemTests {

        @Test
        @DisplayName("Should add line item to order")
        void addLineItem_ValidData_AddsSuccessfully() {
            setupSecurityContext();

            testOrder.setStatus("CREATED");
            LineItemRequest request = LineItemRequest.builder()
                    .productSku("PROD-002")
                    .productName("New Product")
                    .quantity(BigDecimal.valueOf(50))
                    .unit("KG")
                    .build();

            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(orderLineItemRepository.save(any(OrderLineItem.class))).thenAnswer(i -> {
                OrderLineItem li = i.getArgument(0);
                li.setOrderLineId(2L);
                return li;
            });

            OrderDTO result = orderService.addLineItem(1L, request);

            assertNotNull(result);
            verify(orderLineItemRepository).save(any(OrderLineItem.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception when adding line item to non-CREATED order")
        void addLineItem_NotCreatedStatus_ThrowsException() {
            setupSecurityContext();

            testOrder.setStatus("IN_PROGRESS");
            LineItemRequest request = LineItemRequest.builder()
                    .productSku("PROD-002")
                    .productName("New Product")
                    .quantity(BigDecimal.valueOf(50))
                    .unit("KG")
                    .build();

            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> orderService.addLineItem(1L, request));

            assertTrue(exception.getMessage().contains("Cannot add line item"));
        }

        @Test
        @DisplayName("Should update line item successfully")
        void updateLineItem_ValidData_UpdatesSuccessfully() {
            setupSecurityContext();

            testOrderLine.setStatus("CREATED");
            LineItemRequest request = LineItemRequest.builder()
                    .productSku("PROD-002")
                    .productName("Updated Product")
                    .quantity(BigDecimal.valueOf(200))
                    .unit("KG")
                    .build();

            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(orderLineItemRepository.findById(1L)).thenReturn(Optional.of(testOrderLine));
            when(orderLineItemRepository.save(any(OrderLineItem.class))).thenAnswer(i -> i.getArgument(0));

            OrderDTO result = orderService.updateLineItem(1L, 1L, request);

            assertNotNull(result);
            verify(orderLineItemRepository).save(any(OrderLineItem.class));
        }

        @Test
        @DisplayName("Should throw exception when updating non-CREATED line item")
        void updateLineItem_NotCreatedStatus_ThrowsException() {
            setupSecurityContext();

            testOrderLine.setStatus("IN_PROGRESS");
            LineItemRequest request = LineItemRequest.builder()
                    .productSku("PROD-002")
                    .productName("Updated Product")
                    .quantity(BigDecimal.valueOf(200))
                    .unit("KG")
                    .build();

            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(orderLineItemRepository.findById(1L)).thenReturn(Optional.of(testOrderLine));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> orderService.updateLineItem(1L, 1L, request));

            assertTrue(exception.getMessage().contains("Cannot update line item"));
        }

        @Test
        @DisplayName("Should delete line item successfully")
        void deleteLineItem_ValidData_DeletesSuccessfully() {
            setupSecurityContext();

            testOrderLine.setStatus("CREATED");
            // Add another line item to prevent "last line item" error
            OrderLineItem secondLine = OrderLineItem.builder()
                    .orderLineId(2L)
                    .productSku("PROD-002")
                    .status("CREATED")
                    .order(testOrder)
                    .build();
            testOrder.setLineItems(new ArrayList<>(List.of(testOrderLine, secondLine)));

            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(orderLineItemRepository.findById(1L)).thenReturn(Optional.of(testOrderLine));

            OrderDTO result = orderService.deleteLineItem(1L, 1L);

            assertNotNull(result);
            verify(orderLineItemRepository).delete(testOrderLine);
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception when deleting last line item")
        void deleteLineItem_LastLineItem_ThrowsException() {
            setupSecurityContext();

            testOrderLine.setStatus("CREATED");
            testOrder.setLineItems(new ArrayList<>(List.of(testOrderLine)));

            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(orderLineItemRepository.findById(1L)).thenReturn(Optional.of(testOrderLine));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> orderService.deleteLineItem(1L, 1L));

            assertTrue(exception.getMessage().contains("Cannot delete the last line item"));
        }

        @Test
        @DisplayName("Should throw exception when line item does not belong to order")
        void updateLineItem_WrongOrder_ThrowsException() {
            setupSecurityContext();

            Order otherOrder = Order.builder().orderId(2L).build();
            testOrderLine.setOrder(otherOrder);

            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(orderLineItemRepository.findById(1L)).thenReturn(Optional.of(testOrderLine));

            LineItemRequest request = LineItemRequest.builder()
                    .productSku("PROD-002")
                    .productName("Updated Product")
                    .quantity(BigDecimal.valueOf(200))
                    .unit("KG")
                    .build();

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> orderService.updateLineItem(1L, 1L, request));

            assertTrue(exception.getMessage().contains("does not belong to order"));
        }
    }
}
