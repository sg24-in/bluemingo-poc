package com.mes.production.service;

import com.mes.production.dto.OrderDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.dto.order.CreateOrderRequest;
import com.mes.production.dto.order.LineItemRequest;
import com.mes.production.dto.order.UpdateOrderRequest;
import com.mes.production.entity.Operation;
import com.mes.production.entity.Order;
import com.mes.production.entity.OrderLineItem;
import com.mes.production.entity.Process;
import com.mes.production.entity.ProcessStatus;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.OperationRepository;
import com.mes.production.repository.OrderLineItemRepository;
import com.mes.production.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Comprehensive test suite for OrderService.
 *
 * Test Categories:
 * 1. getAllOrders() - Basic listing
 * 2. getOrderById() - Success and not found
 * 3. createOrder() - With line items
 * 4. updateOrder() - Various update scenarios
 * 5. getAvailableOrders() - Orders with READY operations
 * 6. Paginated Methods - Pagination and filtering
 * 7. Line Item Operations - CRUD for line items
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("OrderService Comprehensive Tests")
class OrderServiceComprehensiveTest {

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

    private Order testOrder;
    private OrderLineItem testOrderLine;
    private Operation testOperation;

    @BeforeEach
    void setUp() {
        setupSecurityContext();

        Process testProcess = Process.builder()
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
                .status("CREATED")
                .operations(new ArrayList<>(List.of(testOperation)))
                .build();
        testOperation.setOrderLineItem(testOrderLine);

        testOrder = Order.builder()
                .orderId(1L)
                .orderNumber("ORD-00001")
                .customerId("CUST001")
                .customerName("Test Customer")
                .orderDate(LocalDate.now())
                .status("CREATED")
                .lineItems(new ArrayList<>(List.of(testOrderLine)))
                .build();
        testOrderLine.setOrder(testOrder);
    }

    private void setupSecurityContext() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("admin@mes.com");
        SecurityContextHolder.setContext(securityContext);
    }

    // ========================================================================
    // 1. GET ALL ORDERS (via getActiveOrders)
    // ========================================================================

    @Nested
    @DisplayName("1. Get Active Orders Tests")
    class GetActiveOrdersTests {

        @Test
        @DisplayName("1.1 should_returnAllActiveOrders_when_ordersExist")
        void should_returnAllActiveOrders_when_ordersExist() {
            // Arrange
            Order order2 = Order.builder()
                    .orderId(2L)
                    .orderNumber("ORD-00002")
                    .customerId("CUST002")
                    .status("IN_PROGRESS")
                    .lineItems(new ArrayList<>())
                    .build();

            when(orderRepository.findActiveOrders()).thenReturn(List.of(testOrder, order2));

            // Act
            List<OrderDTO> result = orderService.getActiveOrders();

            // Assert
            assertNotNull(result);
            assertEquals(2, result.size());
            verify(orderRepository).findActiveOrders();
        }

        @Test
        @DisplayName("1.2 should_returnEmptyList_when_noActiveOrdersExist")
        void should_returnEmptyList_when_noActiveOrdersExist() {
            // Arrange
            when(orderRepository.findActiveOrders()).thenReturn(List.of());

            // Act
            List<OrderDTO> result = orderService.getActiveOrders();

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    // ========================================================================
    // 2. GET ORDER BY ID
    // ========================================================================

    @Nested
    @DisplayName("2. Get Order By ID Tests")
    class GetOrderByIdTests {

        @Test
        @DisplayName("2.1 should_returnOrder_when_orderExists")
        void should_returnOrder_when_orderExists() {
            // Arrange
            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

            // Act
            OrderDTO result = orderService.getOrderById(1L);

            // Assert
            assertNotNull(result);
            assertEquals(1L, result.getOrderId());
            assertEquals("ORD-00001", result.getOrderNumber());
            assertEquals("CUST001", result.getCustomerId());
            assertEquals("Test Customer", result.getCustomerName());
        }

        @Test
        @DisplayName("2.2 should_throwException_when_orderNotFound")
        void should_throwException_when_orderNotFound() {
            // Arrange
            when(orderRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> orderService.getOrderById(999L));

            assertTrue(exception.getMessage().contains("not found"));
        }

        @Test
        @DisplayName("2.3 should_includeLineItems_when_orderHasLineItems")
        void should_includeLineItems_when_orderHasLineItems() {
            // Arrange
            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

            // Act
            OrderDTO result = orderService.getOrderById(1L);

            // Assert
            assertNotNull(result.getLineItems());
            assertFalse(result.getLineItems().isEmpty());
            assertEquals("STEEL-001", result.getLineItems().get(0).getProductSku());
        }

        @Test
        @DisplayName("2.4 should_includeOperations_when_lineItemHasOperations")
        void should_includeOperations_when_lineItemHasOperations() {
            // Arrange
            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

            // Act
            OrderDTO result = orderService.getOrderById(1L);

            // Assert
            assertNotNull(result.getLineItems().get(0).getOperations());
            assertFalse(result.getLineItems().get(0).getOperations().isEmpty());
            assertEquals("Melting", result.getLineItems().get(0).getOperations().get(0).getOperationName());
        }

        @Test
        @DisplayName("2.5 should_identifyCurrentOperation_when_operationIsReady")
        void should_identifyCurrentOperation_when_operationIsReady() {
            // Arrange
            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

            // Act
            OrderDTO result = orderService.getOrderById(1L);

            // Assert
            assertNotNull(result.getLineItems().get(0).getCurrentOperation());
            assertEquals("READY", result.getLineItems().get(0).getCurrentOperation().getStatus());
        }
    }

    // ========================================================================
    // 3. CREATE ORDER
    // ========================================================================

    @Nested
    @DisplayName("3. Create Order Tests")
    class CreateOrderTests {

        @Test
        @DisplayName("3.1 should_createOrder_when_validDataProvided")
        void should_createOrder_when_validDataProvided() {
            // Arrange
            CreateOrderRequest request = CreateOrderRequest.builder()
                    .customerId("CUST-NEW")
                    .customerName("New Customer")
                    .orderDate(LocalDate.now())
                    .lineItems(List.of(
                            CreateOrderRequest.LineItemRequest.builder()
                                    .productSku("PROD-001")
                                    .productName("Test Product")
                                    .quantity(BigDecimal.valueOf(50))
                                    .unit("KG")
                                    .build()
                    ))
                    .build();

            when(orderRepository.findMaxOrderNumberSequence()).thenReturn(10);
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> {
                Order o = i.getArgument(0);
                o.setOrderId(100L);
                return o;
            });
            when(orderLineItemRepository.save(any(OrderLineItem.class))).thenAnswer(i -> {
                OrderLineItem li = i.getArgument(0);
                li.setOrderLineId(200L);
                return li;
            });

            // Act
            OrderDTO result = orderService.createOrder(request);

            // Assert
            assertNotNull(result);
            assertEquals("CUST-NEW", result.getCustomerId());
            verify(orderRepository).save(any(Order.class));
            verify(orderLineItemRepository).save(any(OrderLineItem.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("3.2 should_autoGenerateOrderNumber_when_notProvided")
        void should_autoGenerateOrderNumber_when_notProvided() {
            // Arrange
            CreateOrderRequest request = CreateOrderRequest.builder()
                    .customerId("CUST-001")
                    .customerName("Customer")
                    .orderDate(LocalDate.now())
                    .orderNumber(null) // Not provided
                    .lineItems(List.of(
                            CreateOrderRequest.LineItemRequest.builder()
                                    .productSku("PROD-001")
                                    .productName("Product")
                                    .quantity(BigDecimal.ONE)
                                    .unit("PC")
                                    .build()
                    ))
                    .build();

            when(orderRepository.findMaxOrderNumberSequence()).thenReturn(99);
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> {
                Order o = i.getArgument(0);
                o.setOrderId(1L);
                return o;
            });
            when(orderLineItemRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            // Act
            orderService.createOrder(request);

            // Assert
            verify(orderRepository).findMaxOrderNumberSequence();
            verify(orderRepository).save(argThat(order ->
                    order.getOrderNumber() != null &&
                    order.getOrderNumber().startsWith("ORD-")
            ));
        }

        @Test
        @DisplayName("3.3 should_throwException_when_duplicateOrderNumber")
        void should_throwException_when_duplicateOrderNumber() {
            // Arrange
            CreateOrderRequest request = CreateOrderRequest.builder()
                    .customerId("CUST-001")
                    .customerName("Customer")
                    .orderDate(LocalDate.now())
                    .orderNumber("ORD-00001")
                    .lineItems(List.of(
                            CreateOrderRequest.LineItemRequest.builder()
                                    .productSku("PROD-001")
                                    .productName("Product")
                                    .quantity(BigDecimal.ONE)
                                    .unit("PC")
                                    .build()
                    ))
                    .build();

            when(orderRepository.existsByOrderNumber("ORD-00001")).thenReturn(true);

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> orderService.createOrder(request));

            assertTrue(exception.getMessage().contains("already exists"));
            verify(orderRepository, never()).save(any(Order.class));
        }

        @Test
        @DisplayName("3.4 should_setStatusToCreated_when_orderIsNew")
        void should_setStatusToCreated_when_orderIsNew() {
            // Arrange
            CreateOrderRequest request = CreateOrderRequest.builder()
                    .customerId("CUST-001")
                    .customerName("Customer")
                    .orderDate(LocalDate.now())
                    .lineItems(List.of(
                            CreateOrderRequest.LineItemRequest.builder()
                                    .productSku("PROD-001")
                                    .productName("Product")
                                    .quantity(BigDecimal.ONE)
                                    .unit("PC")
                                    .build()
                    ))
                    .build();

            when(orderRepository.findMaxOrderNumberSequence()).thenReturn(0);
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> {
                Order o = i.getArgument(0);
                o.setOrderId(1L);
                return o;
            });
            when(orderLineItemRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            // Act
            OrderDTO result = orderService.createOrder(request);

            // Assert
            assertEquals("CREATED", result.getStatus());
        }
    }

    // ========================================================================
    // 4. UPDATE ORDER
    // ========================================================================

    @Nested
    @DisplayName("4. Update Order Tests")
    class UpdateOrderTests {

        @Test
        @DisplayName("4.1 should_updateOrder_when_validDataProvided")
        void should_updateOrder_when_validDataProvided() {
            // Arrange
            UpdateOrderRequest request = UpdateOrderRequest.builder()
                    .customerId("CUST-UPDATED")
                    .customerName("Updated Customer")
                    .status("IN_PROGRESS")
                    .build();

            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            OrderDTO result = orderService.updateOrder(1L, request);

            // Assert
            assertNotNull(result);
            assertEquals("CUST-UPDATED", result.getCustomerId());
            assertEquals("Updated Customer", result.getCustomerName());
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("4.2 should_throwException_when_updatingNonExistentOrder")
        void should_throwException_when_updatingNonExistentOrder() {
            // Arrange
            UpdateOrderRequest request = UpdateOrderRequest.builder()
                    .customerId("CUST-001")
                    .customerName("Customer")
                    .build();

            when(orderRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> orderService.updateOrder(999L, request));

            assertTrue(exception.getMessage().contains("not found"));
        }

        @Test
        @DisplayName("4.3 should_updatePartialFields_when_onlySomeFieldsProvided")
        void should_updatePartialFields_when_onlySomeFieldsProvided() {
            // Arrange
            UpdateOrderRequest request = UpdateOrderRequest.builder()
                    .customerName("New Name Only")
                    .build();

            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            OrderDTO result = orderService.updateOrder(1L, request);

            // Assert
            assertEquals("New Name Only", result.getCustomerName());
            // Original customer ID should be updated to null since request has null
        }
    }

    // ========================================================================
    // 5. GET AVAILABLE ORDERS
    // ========================================================================

    @Nested
    @DisplayName("5. Get Available Orders Tests")
    class GetAvailableOrdersTests {

        @Test
        @DisplayName("5.1 should_returnOrdersWithReadyOperations_when_theyExist")
        void should_returnOrdersWithReadyOperations_when_theyExist() {
            // Arrange
            when(operationRepository.findReadyOperationsWithDetails())
                    .thenReturn(List.of(testOperation));

            // Act
            List<OrderDTO> result = orderService.getAvailableOrders();

            // Assert
            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("ORD-00001", result.get(0).getOrderNumber());
        }

        @Test
        @DisplayName("5.2 should_returnEmptyList_when_noReadyOperations")
        void should_returnEmptyList_when_noReadyOperations() {
            // Arrange
            when(operationRepository.findReadyOperationsWithDetails())
                    .thenReturn(List.of());

            // Act
            List<OrderDTO> result = orderService.getAvailableOrders();

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("5.3 should_returnDistinctOrders_when_multipleReadyOpsPerOrder")
        void should_returnDistinctOrders_when_multipleReadyOpsPerOrder() {
            // Arrange
            Operation op2 = Operation.builder()
                    .operationId(2L)
                    .operationName("Casting")
                    .status("READY")
                    .orderLineItem(testOrderLine)
                    .build();

            when(operationRepository.findReadyOperationsWithDetails())
                    .thenReturn(List.of(testOperation, op2));

            // Act
            List<OrderDTO> result = orderService.getAvailableOrders();

            // Assert
            assertEquals(1, result.size()); // Same order, should be deduplicated
        }
    }

    // ========================================================================
    // 6. PAGINATED METHODS
    // ========================================================================

    @Nested
    @DisplayName("6. Paginated Methods Tests")
    class PaginatedMethodsTests {

        @Test
        @DisplayName("6.1 should_returnPagedOrders_when_noFilters")
        void should_returnPagedOrders_when_noFilters() {
            // Arrange
            PageRequestDTO pageRequest = PageRequestDTO.builder()
                    .page(0)
                    .size(10)
                    .build();

            Page<Order> orderPage = new PageImpl<>(List.of(testOrder));
            when(orderRepository.findAll(any(Pageable.class))).thenReturn(orderPage);

            // Act
            PagedResponseDTO<OrderDTO> result = orderService.getOrdersPaged(pageRequest);

            // Assert
            assertNotNull(result);
            assertEquals(1, result.getContent().size());
            assertEquals(1, result.getTotalElements());
        }

        @Test
        @DisplayName("6.2 should_filterByStatus_when_statusProvided")
        void should_filterByStatus_when_statusProvided() {
            // Arrange
            PageRequestDTO pageRequest = PageRequestDTO.builder()
                    .page(0)
                    .size(10)
                    .status("IN_PROGRESS")
                    .build();

            Page<Order> orderPage = new PageImpl<>(List.of(testOrder));
            when(orderRepository.findByFilters(eq("IN_PROGRESS"), isNull(), any(Pageable.class)))
                    .thenReturn(orderPage);

            // Act
            PagedResponseDTO<OrderDTO> result = orderService.getOrdersPaged(pageRequest);

            // Assert
            assertNotNull(result);
            verify(orderRepository).findByFilters(eq("IN_PROGRESS"), isNull(), any(Pageable.class));
        }

        @Test
        @DisplayName("6.3 should_searchByPattern_when_searchProvided")
        void should_searchByPattern_when_searchProvided() {
            // Arrange
            PageRequestDTO pageRequest = PageRequestDTO.builder()
                    .page(0)
                    .size(10)
                    .search("CUST")
                    .build();

            Page<Order> orderPage = new PageImpl<>(List.of(testOrder));
            // Note: getSearchPattern() lowercases the search term
            when(orderRepository.findByFilters(isNull(), eq("%cust%"), any(Pageable.class)))
                    .thenReturn(orderPage);

            // Act
            PagedResponseDTO<OrderDTO> result = orderService.getOrdersPaged(pageRequest);

            // Assert
            assertNotNull(result);
            verify(orderRepository).findByFilters(isNull(), eq("%cust%"), any(Pageable.class));
        }

        @Test
        @DisplayName("6.4 should_returnEmptyPage_when_noMatchingOrders")
        void should_returnEmptyPage_when_noMatchingOrders() {
            // Arrange
            PageRequestDTO pageRequest = PageRequestDTO.builder()
                    .page(0)
                    .size(10)
                    .status("CANCELLED")
                    .build();

            Page<Order> emptyPage = new PageImpl<>(List.of());
            when(orderRepository.findByFilters(eq("CANCELLED"), isNull(), any(Pageable.class)))
                    .thenReturn(emptyPage);

            // Act
            PagedResponseDTO<OrderDTO> result = orderService.getOrdersPaged(pageRequest);

            // Assert
            assertNotNull(result);
            assertTrue(result.getContent().isEmpty());
            assertEquals(0, result.getTotalElements());
        }

        @Test
        @DisplayName("6.5 should_applySorting_when_sortByProvided")
        void should_applySorting_when_sortByProvided() {
            // Arrange
            PageRequestDTO pageRequest = PageRequestDTO.builder()
                    .page(0)
                    .size(10)
                    .sortBy("orderDate")
                    .sortDirection("DESC")
                    .build();

            Page<Order> orderPage = new PageImpl<>(List.of(testOrder));
            when(orderRepository.findAll(any(Pageable.class))).thenReturn(orderPage);

            // Act
            PagedResponseDTO<OrderDTO> result = orderService.getOrdersPaged(pageRequest);

            // Assert
            assertNotNull(result);
            assertEquals("orderDate", result.getSortBy());
            assertEquals("DESC", result.getSortDirection());
        }
    }

    // ========================================================================
    // 7. LINE ITEM OPERATIONS
    // ========================================================================

    @Nested
    @DisplayName("7. Line Item Operations Tests")
    class LineItemOperationsTests {

        @Test
        @DisplayName("7.1 should_addLineItem_when_orderIsCreated")
        void should_addLineItem_when_orderIsCreated() {
            // Arrange
            LineItemRequest request = LineItemRequest.builder()
                    .productSku("PROD-NEW")
                    .productName("New Product")
                    .quantity(BigDecimal.valueOf(25))
                    .unit("KG")
                    .build();

            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(orderLineItemRepository.save(any(OrderLineItem.class))).thenAnswer(i -> {
                OrderLineItem li = i.getArgument(0);
                li.setOrderLineId(2L);
                return li;
            });

            // Act
            OrderDTO result = orderService.addLineItem(1L, request);

            // Assert
            assertNotNull(result);
            verify(orderLineItemRepository).save(any(OrderLineItem.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("7.2 should_throwException_when_addingToNonCreatedOrder")
        void should_throwException_when_addingToNonCreatedOrder() {
            // Arrange
            testOrder.setStatus("IN_PROGRESS");
            LineItemRequest request = LineItemRequest.builder()
                    .productSku("PROD-001")
                    .productName("Product")
                    .quantity(BigDecimal.ONE)
                    .unit("PC")
                    .build();

            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> orderService.addLineItem(1L, request));

            assertTrue(exception.getMessage().contains("Cannot add line item"));
        }

        @Test
        @DisplayName("7.3 should_updateLineItem_when_lineItemIsCreated")
        void should_updateLineItem_when_lineItemIsCreated() {
            // Arrange
            LineItemRequest request = LineItemRequest.builder()
                    .productSku("PROD-UPDATED")
                    .productName("Updated Product")
                    .quantity(BigDecimal.valueOf(150))
                    .unit("KG")
                    .build();

            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(orderLineItemRepository.findById(1L)).thenReturn(Optional.of(testOrderLine));
            when(orderLineItemRepository.save(any(OrderLineItem.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            OrderDTO result = orderService.updateLineItem(1L, 1L, request);

            // Assert
            assertNotNull(result);
            verify(orderLineItemRepository).save(any(OrderLineItem.class));
        }

        @Test
        @DisplayName("7.4 should_throwException_when_updatingNonCreatedLineItem")
        void should_throwException_when_updatingNonCreatedLineItem() {
            // Arrange
            testOrderLine.setStatus("IN_PROGRESS");
            LineItemRequest request = LineItemRequest.builder()
                    .productSku("PROD-001")
                    .productName("Product")
                    .quantity(BigDecimal.ONE)
                    .unit("PC")
                    .build();

            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(orderLineItemRepository.findById(1L)).thenReturn(Optional.of(testOrderLine));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> orderService.updateLineItem(1L, 1L, request));

            assertTrue(exception.getMessage().contains("Cannot update line item"));
        }

        @Test
        @DisplayName("7.5 should_throwException_when_lineItemBelongsToWrongOrder")
        void should_throwException_when_lineItemBelongsToWrongOrder() {
            // Arrange
            Order otherOrder = Order.builder().orderId(99L).build();
            testOrderLine.setOrder(otherOrder);

            LineItemRequest request = LineItemRequest.builder()
                    .productSku("PROD-001")
                    .productName("Product")
                    .quantity(BigDecimal.ONE)
                    .unit("PC")
                    .build();

            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(orderLineItemRepository.findById(1L)).thenReturn(Optional.of(testOrderLine));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> orderService.updateLineItem(1L, 1L, request));

            assertTrue(exception.getMessage().contains("does not belong to order"));
        }

        @Test
        @DisplayName("7.6 should_deleteLineItem_when_notLastItem")
        void should_deleteLineItem_when_notLastItem() {
            // Arrange
            OrderLineItem secondLine = OrderLineItem.builder()
                    .orderLineId(2L)
                    .productSku("PROD-002")
                    .status("CREATED")
                    .order(testOrder)
                    .build();
            testOrder.setLineItems(new ArrayList<>(List.of(testOrderLine, secondLine)));

            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(orderLineItemRepository.findById(1L)).thenReturn(Optional.of(testOrderLine));

            // Act
            OrderDTO result = orderService.deleteLineItem(1L, 1L);

            // Assert
            assertNotNull(result);
            verify(orderLineItemRepository).delete(testOrderLine);
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("7.7 should_throwException_when_deletingLastLineItem")
        void should_throwException_when_deletingLastLineItem() {
            // Arrange (testOrder has only one line item)
            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(orderLineItemRepository.findById(1L)).thenReturn(Optional.of(testOrderLine));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> orderService.deleteLineItem(1L, 1L));

            assertTrue(exception.getMessage().contains("Cannot delete the last line item"));
        }
    }

    // ========================================================================
    // 8. DELETE ORDER TESTS
    // ========================================================================

    @Nested
    @DisplayName("8. Delete Order Tests")
    class DeleteOrderTests {

        @Test
        @DisplayName("8.1 should_softDeleteOrder_when_statusIsCreated")
        void should_softDeleteOrder_when_statusIsCreated() {
            // Arrange
            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            orderService.deleteOrder(1L);

            // Assert
            verify(orderRepository).save(argThat(order ->
                    "CANCELLED".equals(order.getStatus())
            ));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("8.2 should_throwException_when_deletingNonCreatedOrder")
        void should_throwException_when_deletingNonCreatedOrder() {
            // Arrange
            testOrder.setStatus("IN_PROGRESS");
            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> orderService.deleteOrder(1L));

            assertTrue(exception.getMessage().contains("Cannot delete"));
            verify(orderRepository, never()).save(any(Order.class));
        }

        @ParameterizedTest
        @ValueSource(strings = {"IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"})
        @DisplayName("8.3 should_throwException_when_deletingOrderWithNonCreatedStatus")
        void should_throwException_when_deletingOrderWithNonCreatedStatus(String status) {
            // Arrange
            testOrder.setStatus(status);
            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> orderService.deleteOrder(1L));

            assertTrue(exception.getMessage().contains("Cannot delete") ||
                       exception.getMessage().contains("status"));
        }
    }
}
