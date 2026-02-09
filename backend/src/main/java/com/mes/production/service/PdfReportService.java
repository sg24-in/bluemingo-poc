package com.mes.production.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.mes.production.entity.Order;
import com.mes.production.entity.Inventory;
import com.mes.production.repository.OrderRepository;
import com.mes.production.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Service for generating PDF reports using OpenPDF.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PdfReportService {

    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;

    private static final Font TITLE_FONT = new Font(Font.HELVETICA, 18, Font.BOLD, new Color(33, 37, 41));
    private static final Font HEADER_FONT = new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE);
    private static final Font CELL_FONT = new Font(Font.HELVETICA, 9, Font.NORMAL);
    private static final Font SUBTITLE_FONT = new Font(Font.HELVETICA, 12, Font.BOLD, new Color(108, 117, 125));

    /**
     * Generate order summary PDF report.
     */
    public byte[] generateOrderReport() {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 54, 36);
            PdfWriter.getInstance(document, baos);
            document.open();

            addReportHeader(document, "Order Summary Report");

            List<Order> orders = orderRepository.findAll();

            document.add(new Paragraph(String.format("Total Orders: %d", orders.size()), SUBTITLE_FONT));
            document.add(Chunk.NEWLINE);

            PdfPTable table = new PdfPTable(new float[]{1f, 2f, 2f, 1.5f, 1.5f});
            table.setWidthPercentage(100);
            addTableHeader(table, "ID", "Order #", "Customer", "Status", "Date");

            for (Order order : orders) {
                table.addCell(createCell(String.valueOf(order.getOrderId())));
                table.addCell(createCell(order.getOrderNumber() != null ? order.getOrderNumber() : "-"));
                table.addCell(createCell(order.getCustomerName() != null ? order.getCustomerName() : "-"));
                table.addCell(createCell(order.getStatus() != null ? order.getStatus() : "-"));
                table.addCell(createCell(order.getOrderDate() != null ? order.getOrderDate().toString() : "-"));
            }
            document.add(table);

            addReportFooter(document);
            document.close();

            log.info("Generated order PDF report with {} records", orders.size());
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error generating order PDF report", e);
            throw new RuntimeException("Failed to generate PDF report", e);
        }
    }

    /**
     * Generate inventory summary PDF report.
     */
    public byte[] generateInventoryReport() {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 36, 36, 54, 36);
            PdfWriter.getInstance(document, baos);
            document.open();

            addReportHeader(document, "Inventory Summary Report");

            List<Inventory> items = inventoryRepository.findAll();

            document.add(new Paragraph(String.format("Total Inventory Items: %d", items.size()), SUBTITLE_FONT));
            document.add(Chunk.NEWLINE);

            PdfPTable table = new PdfPTable(new float[]{1f, 2f, 2f, 1.5f, 1.5f, 1f, 1.5f});
            table.setWidthPercentage(100);
            addTableHeader(table, "ID", "Material", "Type", "Quantity", "Unit", "State", "Location");

            for (Inventory inv : items) {
                table.addCell(createCell(String.valueOf(inv.getInventoryId())));
                table.addCell(createCell(inv.getMaterialId() != null ? inv.getMaterialId() : "-"));
                table.addCell(createCell(inv.getInventoryType() != null ? inv.getInventoryType() : "-"));
                table.addCell(createCell(inv.getQuantity() != null ? inv.getQuantity().toPlainString() : "0"));
                table.addCell(createCell(inv.getUnit() != null ? inv.getUnit() : "-"));
                table.addCell(createCell(inv.getState() != null ? inv.getState() : "-"));
                table.addCell(createCell(inv.getLocation() != null ? inv.getLocation() : "-"));
            }
            document.add(table);

            addReportFooter(document);
            document.close();

            log.info("Generated inventory PDF report with {} records", items.size());
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error generating inventory PDF report", e);
            throw new RuntimeException("Failed to generate PDF report", e);
        }
    }

    private void addReportHeader(Document document, String title) throws DocumentException {
        Paragraph titleParagraph = new Paragraph(title, TITLE_FONT);
        titleParagraph.setAlignment(Element.ALIGN_CENTER);
        document.add(titleParagraph);

        Paragraph dateParagraph = new Paragraph(
                "Generated: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                SUBTITLE_FONT);
        dateParagraph.setAlignment(Element.ALIGN_CENTER);
        document.add(dateParagraph);
        document.add(Chunk.NEWLINE);
    }

    private void addTableHeader(PdfPTable table, String... headers) {
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, HEADER_FONT));
            cell.setBackgroundColor(new Color(52, 58, 64));
            cell.setPadding(6);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }
    }

    private PdfPCell createCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, CELL_FONT));
        cell.setPadding(5);
        return cell;
    }

    private void addReportFooter(Document document) throws DocumentException {
        document.add(Chunk.NEWLINE);
        Paragraph footer = new Paragraph("MES Production Confirmation System",
                new Font(Font.HELVETICA, 8, Font.ITALIC, Color.GRAY));
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);
    }
}
