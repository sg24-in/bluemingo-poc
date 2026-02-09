package com.mes.production.controller;

import com.mes.production.service.ChartService;
import com.mes.production.service.ExcelExportService;
import com.mes.production.service.ImageProcessingService;
import com.mes.production.service.PdfReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * REST controller for reports, exports, charts, and image processing.
 * Integrates OpenPDF, Apache POI, JFreeChart, and image processing.
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {

    private final PdfReportService pdfReportService;
    private final ExcelExportService excelExportService;
    private final ChartService chartService;
    private final ImageProcessingService imageProcessingService;

    // ─── PDF Reports ───

    @GetMapping("/pdf/orders")
    public ResponseEntity<byte[]> exportOrdersPdf() {
        log.info("GET /api/reports/pdf/orders");
        byte[] pdf = pdfReportService.generateOrderReport();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=orders-report.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/pdf/inventory")
    public ResponseEntity<byte[]> exportInventoryPdf() {
        log.info("GET /api/reports/pdf/inventory");
        byte[] pdf = pdfReportService.generateInventoryReport();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=inventory-report.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    // ─── Excel Exports ───

    @GetMapping("/excel/orders")
    public ResponseEntity<byte[]> exportOrdersExcel() {
        log.info("GET /api/reports/excel/orders");
        byte[] excel = excelExportService.exportOrders();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=orders-export.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
    }

    @GetMapping("/excel/inventory")
    public ResponseEntity<byte[]> exportInventoryExcel() {
        log.info("GET /api/reports/excel/inventory");
        byte[] excel = excelExportService.exportInventory();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=inventory-export.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
    }

    // ─── Charts ───

    @GetMapping("/charts/order-status")
    public ResponseEntity<byte[]> orderStatusChart(
            @RequestParam(defaultValue = "600") int width,
            @RequestParam(defaultValue = "400") int height) {
        log.info("GET /api/reports/charts/order-status ({}x{})", width, height);
        byte[] chart = chartService.generateOrderStatusChart(width, height);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(chart);
    }

    @GetMapping("/charts/inventory-type")
    public ResponseEntity<byte[]> inventoryTypeChart(
            @RequestParam(defaultValue = "600") int width,
            @RequestParam(defaultValue = "400") int height) {
        log.info("GET /api/reports/charts/inventory-type ({}x{})", width, height);
        byte[] chart = chartService.generateInventoryTypeChart(width, height);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(chart);
    }

    @GetMapping("/charts/inventory-state")
    public ResponseEntity<byte[]> inventoryStateChart(
            @RequestParam(defaultValue = "600") int width,
            @RequestParam(defaultValue = "400") int height) {
        log.info("GET /api/reports/charts/inventory-state ({}x{})", width, height);
        byte[] chart = chartService.generateInventoryStateChart(width, height);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(chart);
    }

    // ─── Image Processing ───

    @PostMapping("/image/grayscale")
    public ResponseEntity<byte[]> convertToGrayscale(@RequestParam("file") MultipartFile file) {
        try {
            log.info("POST /api/reports/image/grayscale - file: {}", file.getOriginalFilename());
            byte[] result = imageProcessingService.convertToGrayscale(file.getBytes());
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(result);
        } catch (Exception e) {
            log.error("Error processing image", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/image/resize")
    public ResponseEntity<byte[]> resizeImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam int width,
            @RequestParam int height) {
        try {
            log.info("POST /api/reports/image/resize - {}x{}", width, height);
            byte[] result = imageProcessingService.resizeImage(file.getBytes(), width, height);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(result);
        } catch (Exception e) {
            log.error("Error resizing image", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/image/thumbnail")
    public ResponseEntity<byte[]> generateThumbnail(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "150") int maxDimension) {
        try {
            log.info("POST /api/reports/image/thumbnail - max: {}", maxDimension);
            byte[] result = imageProcessingService.generateThumbnail(file.getBytes(), maxDimension);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(result);
        } catch (Exception e) {
            log.error("Error generating thumbnail", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/image/metadata")
    public ResponseEntity<?> getImageMetadata(@RequestParam("file") MultipartFile file) {
        try {
            log.info("POST /api/reports/image/metadata - file: {}", file.getOriginalFilename());
            ImageProcessingService.ImageMetadata metadata = imageProcessingService.getImageMetadata(file.getBytes());
            return ResponseEntity.ok(Map.of(
                    "width", metadata.width(),
                    "height", metadata.height(),
                    "colorType", metadata.colorType(),
                    "sizeBytes", metadata.sizeBytes()
            ));
        } catch (Exception e) {
            log.error("Error reading image metadata", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── Demo / Health Check ───

    @GetMapping("/demo")
    public ResponseEntity<?> demo() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "availableReports", Map.of(
                        "pdf", new String[]{"orders", "inventory"},
                        "excel", new String[]{"orders", "inventory"},
                        "charts", new String[]{"order-status", "inventory-type", "inventory-state"},
                        "imageProcessing", new String[]{"grayscale", "resize", "thumbnail", "metadata"}
                ),
                "libraries", Map.of(
                        "pdf", "OpenPDF 2.0.3",
                        "excel", "Apache POI 5.2.5",
                        "charts", "JFreeChart 1.5.5",
                        "imageProcessing", "Java AWT + OpenCV 4.9.0"
                )
        ));
    }
}
