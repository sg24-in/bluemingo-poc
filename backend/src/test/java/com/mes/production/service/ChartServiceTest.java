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

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChartServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @InjectMocks
    private ChartService chartService;

    private Order testOrder1;
    private Order testOrder2;
    private Inventory testInventory1;
    private Inventory testInventory2;

    @BeforeEach
    void setUp() {
        testOrder1 = new Order();
        testOrder1.setOrderId(1L);
        testOrder1.setStatus("IN_PROGRESS");

        testOrder2 = new Order();
        testOrder2.setOrderId(2L);
        testOrder2.setStatus("COMPLETED");

        testInventory1 = new Inventory();
        testInventory1.setInventoryId(1L);
        testInventory1.setInventoryType("RM");
        testInventory1.setState("AVAILABLE");

        testInventory2 = new Inventory();
        testInventory2.setInventoryId(2L);
        testInventory2.setInventoryType("FG");
        testInventory2.setState("BLOCKED");
    }

    @Test
    @DisplayName("Should generate order status pie chart")
    void generateOrderStatusChart_WithData_ReturnsPng() throws Exception {
        when(orderRepository.findAll()).thenReturn(List.of(testOrder1, testOrder2));

        byte[] result = chartService.generateOrderStatusChart(600, 400);

        assertNotNull(result);
        assertTrue(result.length > 0);

        // Verify it's a valid PNG
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(result));
        assertNotNull(image);
        assertEquals(600, image.getWidth());
        assertEquals(400, image.getHeight());
    }

    @Test
    @DisplayName("Should generate order status chart with empty data")
    void generateOrderStatusChart_EmptyData_ReturnsPng() throws Exception {
        when(orderRepository.findAll()).thenReturn(Collections.emptyList());

        byte[] result = chartService.generateOrderStatusChart(400, 300);

        assertNotNull(result);
        assertTrue(result.length > 0);
    }

    @Test
    @DisplayName("Should generate inventory type bar chart")
    void generateInventoryTypeChart_WithData_ReturnsPng() throws Exception {
        when(inventoryRepository.findAll()).thenReturn(List.of(testInventory1, testInventory2));

        byte[] result = chartService.generateInventoryTypeChart(600, 400);

        assertNotNull(result);
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(result));
        assertNotNull(image);
        assertEquals(600, image.getWidth());
    }

    @Test
    @DisplayName("Should generate inventory state pie chart")
    void generateInventoryStateChart_WithData_ReturnsPng() throws Exception {
        when(inventoryRepository.findAll()).thenReturn(List.of(testInventory1, testInventory2));

        byte[] result = chartService.generateInventoryStateChart(500, 400);

        assertNotNull(result);
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(result));
        assertNotNull(image);
        assertEquals(500, image.getWidth());
    }

    @Test
    @DisplayName("Should handle null status values in orders")
    void generateOrderStatusChart_NullStatus_UsesUnknown() throws Exception {
        Order nullStatusOrder = new Order();
        nullStatusOrder.setOrderId(3L);
        when(orderRepository.findAll()).thenReturn(List.of(nullStatusOrder));

        byte[] result = chartService.generateOrderStatusChart(400, 300);

        assertNotNull(result);
        assertTrue(result.length > 0);
    }

    @Test
    @DisplayName("Should handle null type values in inventory")
    void generateInventoryTypeChart_NullType_UsesUnknown() throws Exception {
        Inventory nullTypeInv = new Inventory();
        nullTypeInv.setInventoryId(3L);
        when(inventoryRepository.findAll()).thenReturn(List.of(nullTypeInv));

        byte[] result = chartService.generateInventoryTypeChart(400, 300);

        assertNotNull(result);
        assertTrue(result.length > 0);
    }

    @Test
    @DisplayName("Should respect custom chart dimensions")
    void generateOrderStatusChart_CustomDimensions_MatchesSize() throws Exception {
        when(orderRepository.findAll()).thenReturn(List.of(testOrder1));

        byte[] result = chartService.generateOrderStatusChart(800, 600);

        BufferedImage image = ImageIO.read(new ByteArrayInputStream(result));
        assertEquals(800, image.getWidth());
        assertEquals(600, image.getHeight());
    }
}
