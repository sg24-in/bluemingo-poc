package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.BatchDTO;
import com.mes.production.security.JwtService;
import com.mes.production.service.BatchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.mes.production.config.TestSecurityConfig;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.http.MediaType;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class BatchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BatchService batchService;

    @MockBean
    private JwtService jwtService;

    private BatchDTO testBatch;
    private BatchDTO.Genealogy testGenealogy;

    @BeforeEach
    void setUp() {
        testBatch = BatchDTO.builder()
                .batchId(1L)
                .batchNumber("BATCH-001")
                .materialId("IM-001")
                .materialName("Steel Billet")
                .quantity(new BigDecimal("500.00"))
                .unit("KG")
                .status("AVAILABLE")
                .createdOn(LocalDateTime.now())
                .build();

        BatchDTO.ParentBatchInfo parentBatch = BatchDTO.ParentBatchInfo.builder()
                .batchId(2L)
                .batchNumber("BATCH-002")
                .materialName("Iron Ore")
                .quantityConsumed(new BigDecimal("100.00"))
                .unit("KG")
                .relationType("TRANSFORM")
                .build();

        BatchDTO.ChildBatchInfo childBatch = BatchDTO.ChildBatchInfo.builder()
                .batchId(3L)
                .batchNumber("BATCH-003")
                .materialName("Steel Rod")
                .quantity(new BigDecimal("450.00"))
                .unit("KG")
                .relationType("TRANSFORM")
                .build();

        BatchDTO.ProductionInfo productionInfo = BatchDTO.ProductionInfo.builder()
                .operationId(1L)
                .operationName("Melting")
                .processName("Melting Stage")
                .orderId("1")
                .productionDate(LocalDateTime.now())
                .build();

        testGenealogy = BatchDTO.Genealogy.builder()
                .batch(testBatch)
                .parentBatches(List.of(parentBatch))
                .childBatches(List.of(childBatch))
                .productionInfo(productionInfo)
                .build();
    }

    @Test
    @DisplayName("Should get all batches")
    @WithMockUser(username = "admin@mes.com")
    void getAllBatches_ReturnsBatches() throws Exception {
        when(batchService.getAllBatches()).thenReturn(List.of(testBatch));

        mockMvc.perform(get("/api/batches"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].batchId").value(1))
                .andExpect(jsonPath("$[0].batchNumber").value("BATCH-001"))
                .andExpect(jsonPath("$[0].materialId").value("IM-001"));

        verify(batchService, times(1)).getAllBatches();
    }

    @Test
    @DisplayName("Should get batch by ID")
    @WithMockUser(username = "admin@mes.com")
    void getBatchById_ValidId_ReturnsBatch() throws Exception {
        when(batchService.getBatchById(1L)).thenReturn(testBatch);

        mockMvc.perform(get("/api/batches/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.batchId").value(1))
                .andExpect(jsonPath("$.batchNumber").value("BATCH-001"));

        verify(batchService, times(1)).getBatchById(1L);
    }

    @Test
    @DisplayName("Should get batch genealogy")
    @WithMockUser(username = "admin@mes.com")
    void getBatchGenealogy_ValidId_ReturnsGenealogy() throws Exception {
        when(batchService.getBatchGenealogy(1L)).thenReturn(testGenealogy);

        mockMvc.perform(get("/api/batches/1/genealogy"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.batch.batchId").value(1))
                .andExpect(jsonPath("$.parentBatches[0].batchNumber").value("BATCH-002"))
                .andExpect(jsonPath("$.childBatches[0].batchNumber").value("BATCH-003"))
                .andExpect(jsonPath("$.productionInfo.operationName").value("Melting"));

        verify(batchService, times(1)).getBatchGenealogy(1L);
    }

    @Test
    @DisplayName("Should get available batches")
    @WithMockUser(username = "admin@mes.com")
    void getAvailableBatches_ReturnsAvailable() throws Exception {
        when(batchService.getAllBatches()).thenReturn(List.of(testBatch));

        mockMvc.perform(get("/api/batches/available"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].batchId").value(1));

        verify(batchService, times(1)).getAllBatches();
    }

    @Test
    @DisplayName("Should get available batches by material ID")
    @WithMockUser(username = "admin@mes.com")
    void getAvailableBatchesByMaterial_ReturnsFiltered() throws Exception {
        when(batchService.getAvailableBatchesByMaterial("IM-001")).thenReturn(List.of(testBatch));

        mockMvc.perform(get("/api/batches/available")
                        .param("materialId", "IM-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].materialId").value("IM-001"));

        verify(batchService, times(1)).getAvailableBatchesByMaterial("IM-001");
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void getAllBatches_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/batches"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should handle batch not found")
    @WithMockUser(username = "admin@mes.com")
    void getBatchById_NotFound_ReturnsError() throws Exception {
        when(batchService.getBatchById(999L))
                .thenThrow(new RuntimeException("Batch not found"));

        mockMvc.perform(get("/api/batches/999"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return empty list when no batches")
    @WithMockUser(username = "admin@mes.com")
    void getAllBatches_NoBatches_ReturnsEmptyList() throws Exception {
        when(batchService.getAllBatches()).thenReturn(List.of());

        mockMvc.perform(get("/api/batches"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    // ========================================
    // CRUD Tests
    // ========================================

    @Test
    @WithMockUser(username = "admin@mes.com")
    @DisplayName("Should create batch and return 201")
    void createBatch_Returns201() throws Exception {
        BatchDTO.CreateBatchRequest request = BatchDTO.CreateBatchRequest.builder()
                .batchNumber("NEW-BATCH-001")
                .materialId("RM-001")
                .materialName("Iron Ore")
                .quantity(new BigDecimal("1000.00"))
                .unit("KG")
                .build();

        when(batchService.createBatch(any(BatchDTO.CreateBatchRequest.class)))
                .thenReturn(testBatch);

        mockMvc.perform(post("/api/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.batchId").value(1))
                .andExpect(jsonPath("$.batchNumber").value("BATCH-001"));

        verify(batchService).createBatch(any(BatchDTO.CreateBatchRequest.class));
    }

    @Test
    @WithMockUser(username = "admin@mes.com")
    @DisplayName("Should return error when creating batch with duplicate number")
    void createBatch_DuplicateReturnsError() throws Exception {
        BatchDTO.CreateBatchRequest request = BatchDTO.CreateBatchRequest.builder()
                .batchNumber("BATCH-001")
                .materialId("RM-001")
                .quantity(new BigDecimal("100.00"))
                .build();

        when(batchService.createBatch(any(BatchDTO.CreateBatchRequest.class)))
                .thenThrow(new RuntimeException("Batch number already exists: BATCH-001"));

        mockMvc.perform(post("/api/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin@mes.com")
    @DisplayName("Should update batch and return 200")
    void updateBatch_Returns200() throws Exception {
        BatchDTO.UpdateBatchRequest request = BatchDTO.UpdateBatchRequest.builder()
                .materialName("Updated Steel Billet")
                .quantity(new BigDecimal("600.00"))
                .build();

        when(batchService.updateBatch(eq(1L), any(BatchDTO.UpdateBatchRequest.class)))
                .thenReturn(testBatch);

        mockMvc.perform(put("/api/batches/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.batchId").value(1));

        verify(batchService).updateBatch(eq(1L), any(BatchDTO.UpdateBatchRequest.class));
    }

    @Test
    @WithMockUser(username = "admin@mes.com")
    @DisplayName("Should delete batch and return 200")
    void deleteBatch_Returns200() throws Exception {
        BatchDTO.StatusUpdateResponse response = BatchDTO.StatusUpdateResponse.builder()
                .batchId(1L)
                .batchNumber("BATCH-001")
                .previousStatus("AVAILABLE")
                .newStatus("SCRAPPED")
                .message("Batch deleted (scrapped)")
                .updatedBy("admin")
                .updatedOn(LocalDateTime.now())
                .build();

        when(batchService.deleteBatch(1L)).thenReturn(response);

        mockMvc.perform(delete("/api/batches/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.previousStatus").value("AVAILABLE"))
                .andExpect(jsonPath("$.newStatus").value("SCRAPPED"));

        verify(batchService).deleteBatch(1L);
    }

    @Test
    @WithMockUser(username = "admin@mes.com")
    @DisplayName("Should return error when deleting consumed batch")
    void deleteBatch_ConsumedReturnsError() throws Exception {
        when(batchService.deleteBatch(1L))
                .thenThrow(new RuntimeException("Cannot delete consumed batch"));

        mockMvc.perform(delete("/api/batches/1"))
                .andExpect(status().isBadRequest());
    }

    // ========================================
    // Batch Immutability Tests (B05 - Phase 8A)
    // ========================================

    @Test
    @WithMockUser(username = "admin@mes.com")
    @DisplayName("Should adjust quantity successfully")
    void adjustQuantity_Returns200() throws Exception {
        BatchDTO.AdjustQuantityRequest request = BatchDTO.AdjustQuantityRequest.builder()
                .newQuantity(new BigDecimal("480.00"))
                .adjustmentType("CORRECTION")
                .reason("Physical inventory count revealed 20kg discrepancy")
                .build();

        BatchDTO.AdjustQuantityResponse response = BatchDTO.AdjustQuantityResponse.builder()
                .batchId(1L)
                .batchNumber("BATCH-001")
                .previousQuantity(new BigDecimal("500.00"))
                .newQuantity(new BigDecimal("480.00"))
                .quantityDifference(new BigDecimal("-20.00"))
                .adjustmentType("CORRECTION")
                .reason("Physical inventory count revealed 20kg discrepancy")
                .adjustedBy("admin@mes.com")
                .adjustedOn(LocalDateTime.now())
                .message("Quantity adjusted successfully")
                .build();

        when(batchService.adjustQuantity(eq(1L), any(BatchDTO.AdjustQuantityRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/batches/1/adjust-quantity")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.batchId").value(1))
                .andExpect(jsonPath("$.previousQuantity").value(500.00))
                .andExpect(jsonPath("$.newQuantity").value(480.00))
                .andExpect(jsonPath("$.quantityDifference").value(-20.00))
                .andExpect(jsonPath("$.adjustmentType").value("CORRECTION"));

        verify(batchService).adjustQuantity(eq(1L), any(BatchDTO.AdjustQuantityRequest.class));
    }

    @Test
    @WithMockUser(username = "admin@mes.com")
    @DisplayName("Should reject adjustment for consumed batch")
    void adjustQuantity_ConsumedBatch_ReturnsError() throws Exception {
        BatchDTO.AdjustQuantityRequest request = BatchDTO.AdjustQuantityRequest.builder()
                .newQuantity(new BigDecimal("400.00"))
                .adjustmentType("CORRECTION")
                .reason("Testing consumed batch")
                .build();

        when(batchService.adjustQuantity(eq(1L), any(BatchDTO.AdjustQuantityRequest.class)))
                .thenThrow(new RuntimeException("Cannot adjust quantity of consumed batch"));

        mockMvc.perform(post("/api/batches/1/adjust-quantity")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin@mes.com")
    @DisplayName("Should return adjustment history")
    void getAdjustmentHistory_Returns200() throws Exception {
        List<BatchDTO.QuantityAdjustmentHistory> history = List.of(
                BatchDTO.QuantityAdjustmentHistory.builder()
                        .adjustmentId(1L)
                        .oldQuantity(new BigDecimal("500.00"))
                        .newQuantity(new BigDecimal("480.00"))
                        .difference(new BigDecimal("-20.00"))
                        .adjustmentType("CORRECTION")
                        .reason("Physical count discrepancy")
                        .adjustedBy("admin")
                        .adjustedOn(LocalDateTime.now())
                        .build(),
                BatchDTO.QuantityAdjustmentHistory.builder()
                        .adjustmentId(2L)
                        .oldQuantity(new BigDecimal("480.00"))
                        .newQuantity(new BigDecimal("475.00"))
                        .difference(new BigDecimal("-5.00"))
                        .adjustmentType("DAMAGE")
                        .reason("Handling damage")
                        .adjustedBy("operator1")
                        .adjustedOn(LocalDateTime.now().minusHours(1))
                        .build()
        );

        when(batchService.getAdjustmentHistory(1L)).thenReturn(history);

        mockMvc.perform(get("/api/batches/1/adjustments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].adjustmentId").value(1))
                .andExpect(jsonPath("$[0].adjustmentType").value("CORRECTION"))
                .andExpect(jsonPath("$[1].adjustmentId").value(2))
                .andExpect(jsonPath("$[1].adjustmentType").value("DAMAGE"));

        verify(batchService).getAdjustmentHistory(1L);
    }

    @Test
    @WithMockUser(username = "admin@mes.com")
    @DisplayName("Should return empty adjustment history")
    void getAdjustmentHistory_Empty_ReturnsEmptyList() throws Exception {
        when(batchService.getAdjustmentHistory(1L)).thenReturn(List.of());

        mockMvc.perform(get("/api/batches/1/adjustments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());

        verify(batchService).getAdjustmentHistory(1L);
    }

    @Test
    @WithMockUser(username = "admin@mes.com")
    @DisplayName("Should return error when batch not found for adjustment")
    void adjustQuantity_NotFound_ReturnsError() throws Exception {
        BatchDTO.AdjustQuantityRequest request = BatchDTO.AdjustQuantityRequest.builder()
                .newQuantity(new BigDecimal("100.00"))
                .adjustmentType("CORRECTION")
                .reason("Testing not found")
                .build();

        when(batchService.adjustQuantity(eq(999L), any(BatchDTO.AdjustQuantityRequest.class)))
                .thenThrow(new RuntimeException("Batch not found: 999"));

        mockMvc.perform(post("/api/batches/999/adjust-quantity")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin@mes.com")
    @DisplayName("Should return error for invalid adjustment type")
    void adjustQuantity_InvalidType_ReturnsError() throws Exception {
        BatchDTO.AdjustQuantityRequest request = BatchDTO.AdjustQuantityRequest.builder()
                .newQuantity(new BigDecimal("400.00"))
                .adjustmentType("INVALID_TYPE")
                .reason("Testing invalid type")
                .build();

        when(batchService.adjustQuantity(eq(1L), any(BatchDTO.AdjustQuantityRequest.class)))
                .thenThrow(new RuntimeException("Invalid adjustment type: INVALID_TYPE"));

        mockMvc.perform(post("/api/batches/1/adjust-quantity")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return 401 for adjust-quantity when not authenticated")
    void adjustQuantity_NotAuthenticated_Returns401() throws Exception {
        BatchDTO.AdjustQuantityRequest request = BatchDTO.AdjustQuantityRequest.builder()
                .newQuantity(new BigDecimal("400.00"))
                .adjustmentType("CORRECTION")
                .reason("Testing unauthenticated")
                .build();

        mockMvc.perform(post("/api/batches/1/adjust-quantity")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should return 401 for adjustments when not authenticated")
    void getAdjustmentHistory_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/batches/1/adjustments"))
                .andExpect(status().isUnauthorized());
    }
}
