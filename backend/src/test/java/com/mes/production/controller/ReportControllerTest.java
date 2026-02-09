package com.mes.production.controller;

import com.mes.production.config.TestSecurityConfig;
import com.mes.production.security.JwtService;
import com.mes.production.service.ChartService;
import com.mes.production.service.ExcelExportService;
import com.mes.production.service.ImageProcessingService;
import com.mes.production.service.PdfReportService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PdfReportService pdfReportService;

    @MockBean
    private ExcelExportService excelExportService;

    @MockBean
    private ChartService chartService;

    @MockBean
    private ImageProcessingService imageProcessingService;

    @MockBean
    private JwtService jwtService;

    @Nested
    @DisplayName("PDF Reports")
    class PdfReports {

        @Test
        @DisplayName("Should export orders as PDF")
        @WithMockUser(username = "admin@mes.com")
        void exportOrdersPdf_ReturnsAttachment() throws Exception {
            byte[] fakePdf = "%PDF-1.4 fake content".getBytes();
            when(pdfReportService.generateOrderReport()).thenReturn(fakePdf);

            mockMvc.perform(get("/api/reports/pdf/orders"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                    .andExpect(header().string("Content-Disposition", "attachment; filename=orders-report.pdf"));
        }

        @Test
        @DisplayName("Should export inventory as PDF")
        @WithMockUser(username = "admin@mes.com")
        void exportInventoryPdf_ReturnsAttachment() throws Exception {
            byte[] fakePdf = "%PDF-1.4 fake content".getBytes();
            when(pdfReportService.generateInventoryReport()).thenReturn(fakePdf);

            mockMvc.perform(get("/api/reports/pdf/inventory"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                    .andExpect(header().string("Content-Disposition", "attachment; filename=inventory-report.pdf"));
        }
    }

    @Nested
    @DisplayName("Excel Exports")
    class ExcelExports {

        @Test
        @DisplayName("Should export orders as Excel")
        @WithMockUser(username = "admin@mes.com")
        void exportOrdersExcel_ReturnsXlsx() throws Exception {
            byte[] fakeExcel = new byte[]{0x50, 0x4B, 0x03, 0x04}; // ZIP magic bytes (xlsx is a zip)
            when(excelExportService.exportOrders()).thenReturn(fakeExcel);

            mockMvc.perform(get("/api/reports/excel/orders"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Content-Disposition", "attachment; filename=orders-export.xlsx"));
        }

        @Test
        @DisplayName("Should export inventory as Excel")
        @WithMockUser(username = "admin@mes.com")
        void exportInventoryExcel_ReturnsXlsx() throws Exception {
            byte[] fakeExcel = new byte[]{0x50, 0x4B, 0x03, 0x04};
            when(excelExportService.exportInventory()).thenReturn(fakeExcel);

            mockMvc.perform(get("/api/reports/excel/inventory"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Content-Disposition", "attachment; filename=inventory-export.xlsx"));
        }
    }

    @Nested
    @DisplayName("Charts")
    class Charts {

        @Test
        @DisplayName("Should generate order status chart")
        @WithMockUser(username = "admin@mes.com")
        void orderStatusChart_ReturnsPng() throws Exception {
            byte[] fakeChart = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47}; // PNG magic bytes
            when(chartService.generateOrderStatusChart(anyInt(), anyInt())).thenReturn(fakeChart);

            mockMvc.perform(get("/api/reports/charts/order-status"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.IMAGE_PNG));
        }

        @Test
        @DisplayName("Should generate order status chart with custom dimensions")
        @WithMockUser(username = "admin@mes.com")
        void orderStatusChart_CustomDimensions_ReturnsPng() throws Exception {
            byte[] fakeChart = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47};
            when(chartService.generateOrderStatusChart(800, 600)).thenReturn(fakeChart);

            mockMvc.perform(get("/api/reports/charts/order-status")
                            .param("width", "800")
                            .param("height", "600"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Should generate inventory type chart")
        @WithMockUser(username = "admin@mes.com")
        void inventoryTypeChart_ReturnsPng() throws Exception {
            byte[] fakeChart = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47};
            when(chartService.generateInventoryTypeChart(anyInt(), anyInt())).thenReturn(fakeChart);

            mockMvc.perform(get("/api/reports/charts/inventory-type"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.IMAGE_PNG));
        }

        @Test
        @DisplayName("Should generate inventory state chart")
        @WithMockUser(username = "admin@mes.com")
        void inventoryStateChart_ReturnsPng() throws Exception {
            byte[] fakeChart = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47};
            when(chartService.generateInventoryStateChart(anyInt(), anyInt())).thenReturn(fakeChart);

            mockMvc.perform(get("/api/reports/charts/inventory-state"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.IMAGE_PNG));
        }
    }

    @Nested
    @DisplayName("Image Processing")
    class ImageProcessing {

        @Test
        @DisplayName("Should convert image to grayscale")
        @WithMockUser(username = "admin@mes.com")
        void convertToGrayscale_ReturnsProcessedImage() throws Exception {
            byte[] fakeResult = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47};
            when(imageProcessingService.convertToGrayscale(any())).thenReturn(fakeResult);

            MockMultipartFile file = new MockMultipartFile("file", "test.png", MediaType.IMAGE_PNG_VALUE, new byte[]{1, 2, 3});

            mockMvc.perform(multipart("/api/reports/image/grayscale").file(file))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.IMAGE_PNG));
        }

        @Test
        @DisplayName("Should resize image")
        @WithMockUser(username = "admin@mes.com")
        void resizeImage_ReturnsResized() throws Exception {
            byte[] fakeResult = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47};
            when(imageProcessingService.resizeImage(any(), anyInt(), anyInt())).thenReturn(fakeResult);

            MockMultipartFile file = new MockMultipartFile("file", "test.png", MediaType.IMAGE_PNG_VALUE, new byte[]{1, 2, 3});

            mockMvc.perform(multipart("/api/reports/image/resize").file(file)
                            .param("width", "100")
                            .param("height", "100"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.IMAGE_PNG));
        }

        @Test
        @DisplayName("Should generate thumbnail")
        @WithMockUser(username = "admin@mes.com")
        void generateThumbnail_ReturnsThumbnail() throws Exception {
            byte[] fakeResult = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47};
            when(imageProcessingService.generateThumbnail(any(), anyInt())).thenReturn(fakeResult);

            MockMultipartFile file = new MockMultipartFile("file", "test.png", MediaType.IMAGE_PNG_VALUE, new byte[]{1, 2, 3});

            mockMvc.perform(multipart("/api/reports/image/thumbnail").file(file)
                            .param("maxDimension", "150"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Should get image metadata")
        @WithMockUser(username = "admin@mes.com")
        void getImageMetadata_ReturnsMetadata() throws Exception {
            when(imageProcessingService.getImageMetadata(any()))
                    .thenReturn(new ImageProcessingService.ImageMetadata(200, 150, 5, 1024));

            MockMultipartFile file = new MockMultipartFile("file", "test.png", MediaType.IMAGE_PNG_VALUE, new byte[]{1, 2, 3});

            mockMvc.perform(multipart("/api/reports/image/metadata").file(file))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.width").value(200))
                    .andExpect(jsonPath("$.height").value(150))
                    .andExpect(jsonPath("$.sizeBytes").value(1024));
        }
    }

    @Nested
    @DisplayName("Demo & Auth")
    class DemoAndAuth {

        @Test
        @DisplayName("Should return demo info")
        @WithMockUser(username = "admin@mes.com")
        void demo_ReturnsAvailableReports() throws Exception {
            mockMvc.perform(get("/api/reports/demo"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("ok"))
                    .andExpect(jsonPath("$.availableReports.pdf").isArray())
                    .andExpect(jsonPath("$.availableReports.excel").isArray())
                    .andExpect(jsonPath("$.availableReports.charts").isArray())
                    .andExpect(jsonPath("$.libraries.pdf").value("OpenPDF 2.0.3"))
                    .andExpect(jsonPath("$.libraries.excel").value("Apache POI 5.2.5"));
        }

        @Test
        @DisplayName("Should require authentication for reports")
        void exportPdf_NotAuthenticated_Returns401() throws Exception {
            mockMvc.perform(get("/api/reports/pdf/orders"))
                    .andExpect(status().isUnauthorized());
        }
    }
}
