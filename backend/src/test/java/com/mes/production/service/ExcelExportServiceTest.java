package com.mes.production.service;

import com.mes.production.entity.Inventory;
import com.mes.production.entity.Order;
import com.mes.production.repository.InventoryRepository;
import com.mes.production.repository.OrderRepository;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExcelExportServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @InjectMocks
    private ExcelExportService excelExportService;

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
        testInventory.setMaterialName("Test Material");
        testInventory.setInventoryType("RM");
        testInventory.setQuantity(new BigDecimal("1000"));
        testInventory.setUnit("KG");
        testInventory.setState("AVAILABLE");
        testInventory.setLocation("Warehouse A");
        testInventory.setBatchNumber("BATCH-001");
    }

    @Test
    @DisplayName("Should export orders to Excel with data")
    void exportOrders_WithData_ReturnsXlsx() throws Exception {
        when(orderRepository.findAll()).thenReturn(List.of(testOrder));

        byte[] result = excelExportService.exportOrders();

        assertNotNull(result);
        assertTrue(result.length > 0);

        // Parse the result to verify it's a valid XLSX
        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(result))) {
            Sheet ordersSheet = wb.getSheet("Orders");
            assertNotNull(ordersSheet);
            assertEquals(1, ordersSheet.getLastRowNum()); // header + 1 data row

            // Verify header
            assertEquals("ID", ordersSheet.getRow(0).getCell(0).getStringCellValue());
            assertEquals("Order Number", ordersSheet.getRow(0).getCell(1).getStringCellValue());

            // Verify data
            assertEquals(1.0, ordersSheet.getRow(1).getCell(0).getNumericCellValue());
            assertEquals("ORD-001", ordersSheet.getRow(1).getCell(1).getStringCellValue());

            // Verify metadata sheet
            Sheet metaSheet = wb.getSheet("_Metadata");
            assertNotNull(metaSheet);
            assertEquals("Orders Export", metaSheet.getRow(0).getCell(1).getStringCellValue());
        }
    }

    @Test
    @DisplayName("Should export orders with empty data")
    void exportOrders_EmptyData_ReturnsHeaderOnly() throws Exception {
        when(orderRepository.findAll()).thenReturn(Collections.emptyList());

        byte[] result = excelExportService.exportOrders();

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(result))) {
            Sheet sheet = wb.getSheet("Orders");
            assertNotNull(sheet);
            assertEquals(0, sheet.getLastRowNum()); // header only
        }
    }

    @Test
    @DisplayName("Should export inventory to Excel with data")
    void exportInventory_WithData_ReturnsXlsx() throws Exception {
        when(inventoryRepository.findAll()).thenReturn(List.of(testInventory));

        byte[] result = excelExportService.exportInventory();

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(result))) {
            Sheet sheet = wb.getSheet("Inventory");
            assertNotNull(sheet);
            assertEquals(1, sheet.getLastRowNum());

            // Verify headers
            assertEquals("Material ID", sheet.getRow(0).getCell(1).getStringCellValue());

            // Verify data
            assertEquals("MAT-001", sheet.getRow(1).getCell(1).getStringCellValue());
            assertEquals(1000.0, sheet.getRow(1).getCell(4).getNumericCellValue());
        }
    }

    @Test
    @DisplayName("Should export inventory with empty data")
    void exportInventory_EmptyData_ReturnsHeaderOnly() throws Exception {
        when(inventoryRepository.findAll()).thenReturn(Collections.emptyList());

        byte[] result = excelExportService.exportInventory();

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(result))) {
            Sheet sheet = wb.getSheet("Inventory");
            assertNotNull(sheet);
            assertEquals(0, sheet.getLastRowNum());
        }
    }

    @Test
    @DisplayName("Should handle null fields in order export")
    void exportOrders_NullFields_HandlesGracefully() throws Exception {
        Order orderWithNulls = new Order();
        orderWithNulls.setOrderId(2L);
        when(orderRepository.findAll()).thenReturn(List.of(orderWithNulls));

        byte[] result = excelExportService.exportOrders();

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(result))) {
            Sheet sheet = wb.getSheet("Orders");
            assertNotNull(sheet);
            assertEquals(1, sheet.getLastRowNum());
        }
    }

    @Test
    @DisplayName("Should handle null fields in inventory export")
    void exportInventory_NullFields_HandlesGracefully() throws Exception {
        Inventory invWithNulls = new Inventory();
        invWithNulls.setInventoryId(2L);
        when(inventoryRepository.findAll()).thenReturn(List.of(invWithNulls));

        byte[] result = excelExportService.exportInventory();

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(result))) {
            Sheet sheet = wb.getSheet("Inventory");
            assertNotNull(sheet);
        }
    }

    @Test
    @DisplayName("Should include metadata sheet with record count")
    void exportOrders_VerifyMetadata_ContainsRecordCount() throws Exception {
        when(orderRepository.findAll()).thenReturn(List.of(testOrder, testOrder));

        byte[] result = excelExportService.exportOrders();

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(result))) {
            Sheet meta = wb.getSheet("_Metadata");
            assertNotNull(meta);
            assertEquals(2.0, meta.getRow(2).getCell(1).getNumericCellValue());
        }
    }
}
