package com.mes.production.service;

import com.mes.production.dto.OrderDTO;
import com.mes.production.entity.Order;
import com.mes.production.entity.OrderLineItem;
import com.mes.production.entity.Process;
import com.mes.production.entity.Operation;
import com.mes.production.repository.OperationRepository;
import com.mes.production.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OperationRepository operationRepository;

    @InjectMocks
    private OrderService orderService;

    private Order testOrder;
    private OrderLineItem testOrderLine;
    private Process testProcess;
    private Operation testOperation;

    @BeforeEach
    void setUp() {
        testOperation = Operation.builder()
                .operationId(1L)
                .operationName("Melting")
                .operationCode("MELT001")
                .operationType("MELTING")
                .sequenceNumber(1)
                .status("READY")
                .build();

        testProcess = Process.builder()
                .processId(1L)
                .stageName("Melting Stage")
                .stageSequence(1)
                .status("IN_PROGRESS")
                .operations(new ArrayList<>(List.of(testOperation)))
                .build();
        testOperation.setProcess(testProcess);

        testOrderLine = OrderLineItem.builder()
                .orderLineId(1L)
                .productSku("STEEL-001")
                .productName("Steel Coil")
                .quantity(BigDecimal.valueOf(100))
                .unit("T")
                .status("IN_PROGRESS")
                .processes(new ArrayList<>(List.of(testProcess)))
                .build();
        testProcess.setOrderLineItem(testOrderLine);

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
    @DisplayName("Should include processes in order response")
    void getOrderById_IncludesProcesses() {
        // Arrange
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        // Act
        OrderDTO result = orderService.getOrderById(1L);

        // Assert
        assertNotNull(result);
        assertNotNull(result.getLineItems());
        assertFalse(result.getLineItems().isEmpty());
        assertNotNull(result.getLineItems().get(0).getProcesses());
    }

    @Test
    @DisplayName("Should include operations in process response")
    void getOrderById_IncludesOperations() {
        // Arrange
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        // Act
        OrderDTO result = orderService.getOrderById(1L);

        // Assert
        assertNotNull(result);
        assertNotNull(result.getLineItems());
        assertFalse(result.getLineItems().isEmpty());

        var processes = result.getLineItems().get(0).getProcesses();
        assertNotNull(processes);
        assertFalse(processes.isEmpty());
        assertNotNull(processes.get(0).getOperations());
    }
}
