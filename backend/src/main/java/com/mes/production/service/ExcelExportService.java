package com.mes.production.service;

import com.mes.production.entity.Inventory;
import com.mes.production.entity.Order;
import com.mes.production.repository.InventoryRepository;
import com.mes.production.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Service for generating Excel exports using Apache POI.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExcelExportService {

    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;

    /**
     * Export orders to Excel (.xlsx).
     */
    public byte[] exportOrders() {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Orders");

            // Header style
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dateStyle = createDateStyle(workbook);

            // Header row
            Row header = sheet.createRow(0);
            String[] columns = {"ID", "Order Number", "Customer", "Status", "Order Date", "Delivery Date", "Notes"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            List<Order> orders = orderRepository.findAll();
            int rowNum = 1;
            for (Order order : orders) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(order.getOrderId());
                row.createCell(1).setCellValue(order.getOrderNumber() != null ? order.getOrderNumber() : "");
                row.createCell(2).setCellValue(order.getCustomerName() != null ? order.getCustomerName() : "");
                row.createCell(3).setCellValue(order.getStatus() != null ? order.getStatus() : "");
                Cell dateCell = row.createCell(4);
                if (order.getOrderDate() != null) {
                    dateCell.setCellValue(order.getOrderDate().toString());
                }
                Cell deliveryCell = row.createCell(5);
                if (order.getDeliveryDate() != null) {
                    deliveryCell.setCellValue(order.getDeliveryDate().toString());
                }
                row.createCell(6).setCellValue(order.getNotes() != null ? order.getNotes() : "");
            }

            // Auto-size columns
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Add metadata sheet
            addMetadataSheet(workbook, "Orders Export", orders.size());

            workbook.write(baos);
            log.info("Exported {} orders to Excel", orders.size());
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error exporting orders to Excel", e);
            throw new RuntimeException("Failed to export to Excel", e);
        }
    }

    /**
     * Export inventory to Excel (.xlsx).
     */
    public byte[] exportInventory() {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Inventory");

            CellStyle headerStyle = createHeaderStyle(workbook);

            Row header = sheet.createRow(0);
            String[] columns = {"ID", "Material ID", "Material Name", "Type", "Quantity", "Unit", "State", "Location", "Batch Number"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            List<Inventory> items = inventoryRepository.findAll();
            int rowNum = 1;
            for (Inventory inv : items) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(inv.getInventoryId());
                row.createCell(1).setCellValue(inv.getMaterialId() != null ? inv.getMaterialId() : "");
                row.createCell(2).setCellValue(inv.getMaterialName() != null ? inv.getMaterialName() : "");
                row.createCell(3).setCellValue(inv.getInventoryType() != null ? inv.getInventoryType() : "");
                if (inv.getQuantity() != null) {
                    row.createCell(4).setCellValue(inv.getQuantity().doubleValue());
                }
                row.createCell(5).setCellValue(inv.getUnit() != null ? inv.getUnit() : "");
                row.createCell(6).setCellValue(inv.getState() != null ? inv.getState() : "");
                row.createCell(7).setCellValue(inv.getLocation() != null ? inv.getLocation() : "");
                row.createCell(8).setCellValue(inv.getBatchNumber() != null ? inv.getBatchNumber() : "");
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            addMetadataSheet(workbook, "Inventory Export", items.size());

            workbook.write(baos);
            log.info("Exported {} inventory items to Excel", items.size());
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error exporting inventory to Excel", e);
            throw new RuntimeException("Failed to export to Excel", e);
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        return style;
    }

    private CellStyle createDateStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        CreationHelper helper = workbook.getCreationHelper();
        style.setDataFormat(helper.createDataFormat().getFormat("yyyy-mm-dd"));
        return style;
    }

    private void addMetadataSheet(Workbook workbook, String reportName, int recordCount) {
        Sheet meta = workbook.createSheet("_Metadata");
        Row r0 = meta.createRow(0);
        r0.createCell(0).setCellValue("Report");
        r0.createCell(1).setCellValue(reportName);

        Row r1 = meta.createRow(1);
        r1.createCell(0).setCellValue("Generated");
        r1.createCell(1).setCellValue(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        Row r2 = meta.createRow(2);
        r2.createCell(0).setCellValue("Records");
        r2.createCell(1).setCellValue(recordCount);

        Row r3 = meta.createRow(3);
        r3.createCell(0).setCellValue("System");
        r3.createCell(1).setCellValue("MES Production Confirmation");
    }
}
