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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
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
                .relationType("TRANSFORM")
                .build();

        BatchDTO.ChildBatchInfo childBatch = BatchDTO.ChildBatchInfo.builder()
                .batchId(3L)
                .batchNumber("BATCH-003")
                .materialName("Steel Rod")
                .quantity(new BigDecimal("450.00"))
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
}
