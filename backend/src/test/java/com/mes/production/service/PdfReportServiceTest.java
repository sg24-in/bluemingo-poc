package com.mes.production.service;

import com.mes.production.entity.Inventory;
import com.mes.production.entity.Order;
import com.mes.production.repository.InventoryRepository;
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
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PdfReportServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @InjectMocks
    private PdfReportService pdfReportService;

    private Order testOrder;
    private Inventory testInventory;

    @BeforeEach
    void setUp() {
        testOrder = new Order();
        testOrder.setOrderId(1L);
        testOrder.setOrderNumber("ORD-001");
        testOrder.setCustomerName("Test Customer");
        testOrder.setStatus("IN_PROGRESS");
        testOrder.setOrderDate(LocalDate.now());

        testInventory = new Inventory();
        testInventory.setInventoryId(1L);
        testInventory.setMaterialId("MAT-001");
        testInventory.setInventoryType("RM");
        testInventory.setQuantity(new BigDecimal("1000"));
        testInventory.setUnit("KG");
        testInventory.setState("AVAILABLE");
        testInventory.setLocation("Warehouse A");
    }

    @Test
    @DisplayName("Should generate order PDF report with data")
    void generateOrderReport_WithData_ReturnsPdf() {
        when(orderRepository.findAll()).thenReturn(List.of(testOrder));

        byte[] result = pdfReportService.generateOrderReport();

        assertNotNull(result);
        assertTrue(result.length > 0);
        // PDF files start with %PDF
        assertEquals('%', (char) result[0]);
        assertEquals('P', (char) result[1]);
        assertEquals('D', (char) result[2]);
        assertEquals('F', (char) result[3]);
    }

    @Test
    @DisplayName("Should generate order PDF report with empty data")
    void generateOrderReport_EmptyData_ReturnsPdf() {
        when(orderRepository.findAll()).thenReturn(Collections.emptyList());

        byte[] result = pdfReportService.generateOrderReport();

        assertNotNull(result);
        assertTrue(result.length > 0);
    }

    @Test
    @DisplayName("Should generate inventory PDF report with data")
    void generateInventoryReport_WithData_ReturnsPdf() {
        when(inventoryRepository.findAll()).thenReturn(List.of(testInventory));

        byte[] result = pdfReportService.generateInventoryReport();

        assertNotNull(result);
        assertTrue(result.length > 0);
        assertEquals('%', (char) result[0]);
    }

    @Test
    @DisplayName("Should generate inventory PDF report with empty data")
    void generateInventoryReport_EmptyData_ReturnsPdf() {
        when(inventoryRepository.findAll()).thenReturn(Collections.emptyList());

        byte[] result = pdfReportService.generateInventoryReport();

        assertNotNull(result);
        assertTrue(result.length > 0);
    }

    @Test
    @DisplayName("Should handle null fields in order data")
    void generateOrderReport_NullFields_HandlesGracefully() {
        Order orderWithNulls = new Order();
        orderWithNulls.setOrderId(2L);
        when(orderRepository.findAll()).thenReturn(List.of(orderWithNulls));

        byte[] result = pdfReportService.generateOrderReport();

        assertNotNull(result);
        assertTrue(result.length > 0);
    }

    @Test
    @DisplayName("Should handle null fields in inventory data")
    void generateInventoryReport_NullFields_HandlesGracefully() {
        Inventory invWithNulls = new Inventory();
        invWithNulls.setInventoryId(2L);
        when(inventoryRepository.findAll()).thenReturn(List.of(invWithNulls));

        byte[] result = pdfReportService.generateInventoryReport();

        assertNotNull(result);
        assertTrue(result.length > 0);
    }
}
