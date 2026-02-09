package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.BatchDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.security.JwtService;
import com.mes.production.service.BatchNumberService;
import com.mes.production.service.BatchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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

import static org.hamcrest.Matchers.containsString;
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
    private BatchNumberService batchNumberService;

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

    @Nested
    @DisplayName("GET /api/batches Tests")
    class GetAllBatchesTests {

        @Test
        @DisplayName("should_returnAllBatches_when_authenticatedUserRequests")
        @WithMockUser(username = "admin@mes.com")
        void should_returnAllBatches_when_authenticatedUserRequests() throws Exception {
            when(batchService.getAllBatches()).thenReturn(List.of(testBatch));

            mockMvc.perform(get("/api/batches"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].batchId").value(1))
                    .andExpect(jsonPath("$[0].batchNumber").value("BATCH-001"))
                    .andExpect(jsonPath("$[0].materialId").value("IM-001"))
                    .andExpect(jsonPath("$[0].status").value("AVAILABLE"));

            verify(batchService, times(1)).getAllBatches();
        }

        @Test
        @DisplayName("should_returnEmptyList_when_noBatchesExist")
        @WithMockUser(username = "admin@mes.com")
        void should_returnEmptyList_when_noBatchesExist() throws Exception {
            when(batchService.getAllBatches()).thenReturn(List.of());

            mockMvc.perform(get("/api/batches"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            mockMvc.perform(get("/api/batches"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should_returnMultipleBatches_when_multipleExist")
        @WithMockUser(username = "admin@mes.com")
        void should_returnMultipleBatches_when_multipleExist() throws Exception {
            BatchDTO batch2 = BatchDTO.builder()
                    .batchId(2L)
                    .batchNumber("BATCH-002")
                    .materialId("RM-001")
                    .materialName("Iron Ore")
                    .quantity(new BigDecimal("1000.00"))
                    .unit("KG")
                    .status("CONSUMED")
                    .build();

            when(batchService.getAllBatches()).thenReturn(List.of(testBatch, batch2));

            mockMvc.perform(get("/api/batches"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].batchId").value(1))
                    .andExpect(jsonPath("$[1].batchId").value(2));
        }
    }

    @Nested
    @DisplayName("GET /api/batches/paged Tests")
    class GetBatchesPagedTests {

        @Test
        @DisplayName("should_returnPagedBatches_when_defaultPaginationUsed")
        @WithMockUser(username = "admin@mes.com")
        void should_returnPagedBatches_when_defaultPaginationUsed() throws Exception {
            PagedResponseDTO<BatchDTO> pagedResponse = PagedResponseDTO.<BatchDTO>builder()
                    .content(List.of(testBatch))
                    .page(0)
                    .size(20)
                    .totalElements(1L)
                    .totalPages(1)
                    .first(true)
                    .last(true)
                    .hasNext(false)
                    .hasPrevious(false)
                    .build();

            when(batchService.getBatchesPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/batches/paged"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].batchId").value(1))
                    .andExpect(jsonPath("$.page").value(0))
                    .andExpect(jsonPath("$.size").value(20))
                    .andExpect(jsonPath("$.totalElements").value(1))
                    .andExpect(jsonPath("$.first").value(true))
                    .andExpect(jsonPath("$.last").value(true));
        }

        @Test
        @DisplayName("should_filterByStatus_when_statusProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_filterByStatus_when_statusProvided() throws Exception {
            PagedResponseDTO<BatchDTO> pagedResponse = PagedResponseDTO.<BatchDTO>builder()
                    .content(List.of(testBatch))
                    .page(0)
                    .size(20)
                    .totalElements(1L)
                    .totalPages(1)
                    .build();

            when(batchService.getBatchesPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/batches/paged")
                            .param("status", "AVAILABLE"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].status").value("AVAILABLE"));

            verify(batchService).getBatchesPaged(argThat(req -> "AVAILABLE".equals(req.getStatus())));
        }

        @Test
        @DisplayName("should_searchBatches_when_searchTermProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_searchBatches_when_searchTermProvided() throws Exception {
            PagedResponseDTO<BatchDTO> pagedResponse = PagedResponseDTO.<BatchDTO>builder()
                    .content(List.of(testBatch))
                    .page(0)
                    .size(20)
                    .totalElements(1L)
                    .totalPages(1)
                    .build();

            when(batchService.getBatchesPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/batches/paged")
                            .param("search", "BATCH-001"))
                    .andExpect(status().isOk());

            verify(batchService).getBatchesPaged(argThat(req -> "BATCH-001".equals(req.getSearch())));
        }

        @Test
        @DisplayName("should_sortBatches_when_sortParametersProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_sortBatches_when_sortParametersProvided() throws Exception {
            PagedResponseDTO<BatchDTO> pagedResponse = PagedResponseDTO.<BatchDTO>builder()
                    .content(List.of(testBatch))
                    .page(0)
                    .size(20)
                    .totalElements(1L)
                    .totalPages(1)
                    .sortBy("createdOn")
                    .sortDirection("DESC")
                    .build();

            when(batchService.getBatchesPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/batches/paged")
                            .param("sortBy", "createdOn")
                            .param("sortDirection", "DESC"))
                    .andExpect(status().isOk());

            verify(batchService).getBatchesPaged(argThat(req ->
                    "createdOn".equals(req.getSortBy()) && "DESC".equals(req.getSortDirection())));
        }
    }

    @Nested
    @DisplayName("GET /api/batches/{id} Tests")
    class GetBatchByIdTests {

        @Test
        @DisplayName("should_returnBatch_when_validIdProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBatch_when_validIdProvided() throws Exception {
            when(batchService.getBatchById(1L)).thenReturn(testBatch);

            mockMvc.perform(get("/api/batches/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.batchId").value(1))
                    .andExpect(jsonPath("$.batchNumber").value("BATCH-001"))
                    .andExpect(jsonPath("$.materialId").value("IM-001"))
                    .andExpect(jsonPath("$.quantity").value(500.00))
                    .andExpect(jsonPath("$.status").value("AVAILABLE"));

            verify(batchService, times(1)).getBatchById(1L);
        }

        @Test
        @DisplayName("should_returnBadRequest_when_batchNotFound")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBadRequest_when_batchNotFound() throws Exception {
            when(batchService.getBatchById(999L))
                    .thenThrow(new RuntimeException("Batch not found"));

            mockMvc.perform(get("/api/batches/999"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/batches/{id}/genealogy Tests")
    class GetBatchGenealogyTests {

        @Test
        @DisplayName("should_returnGenealogy_when_validBatchIdProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_returnGenealogy_when_validBatchIdProvided() throws Exception {
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
        @DisplayName("should_returnGenealogyWithProductionInfo_when_batchHasProduction")
        @WithMockUser(username = "admin@mes.com")
        void should_returnGenealogyWithProductionInfo_when_batchHasProduction() throws Exception {
            when(batchService.getBatchGenealogy(1L)).thenReturn(testGenealogy);

            mockMvc.perform(get("/api/batches/1/genealogy"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.productionInfo.operationId").value(1))
                    .andExpect(jsonPath("$.productionInfo.processName").value("Melting Stage"))
                    .andExpect(jsonPath("$.productionInfo.orderId").value("1"));
        }

        @Test
        @DisplayName("should_returnEmptyParentBatches_when_noParents")
        @WithMockUser(username = "admin@mes.com")
        void should_returnEmptyParentBatches_when_noParents() throws Exception {
            BatchDTO.Genealogy genealogyNoParents = BatchDTO.Genealogy.builder()
                    .batch(testBatch)
                    .parentBatches(List.of())
                    .childBatches(List.of())
                    .build();

            when(batchService.getBatchGenealogy(1L)).thenReturn(genealogyNoParents);

            mockMvc.perform(get("/api/batches/1/genealogy"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.parentBatches").isArray())
                    .andExpect(jsonPath("$.parentBatches").isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /api/batches/preview-number Tests")
    class PreviewBatchNumberTests {

        @Test
        @DisplayName("should_returnPreviewNumber_when_noParametersProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_returnPreviewNumber_when_noParametersProvided() throws Exception {
            when(batchNumberService.previewBatchNumber(null, null))
                    .thenReturn("BATCH-2026-001");

            mockMvc.perform(get("/api/batches/preview-number"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.previewBatchNumber").value("BATCH-2026-001"));
        }

        @Test
        @DisplayName("should_returnPreviewNumber_when_operationTypeProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_returnPreviewNumber_when_operationTypeProvided() throws Exception {
            when(batchNumberService.previewBatchNumber("FURNACE", null))
                    .thenReturn("FURN-2026-001");

            mockMvc.perform(get("/api/batches/preview-number")
                            .param("operationType", "FURNACE"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.previewBatchNumber").value("FURN-2026-001"))
                    .andExpect(jsonPath("$.operationType").value("FURNACE"));
        }

        @Test
        @DisplayName("should_returnPreviewNumber_when_productSkuProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_returnPreviewNumber_when_productSkuProvided() throws Exception {
            when(batchNumberService.previewBatchNumber(null, "STEEL-001"))
                    .thenReturn("STEEL-2026-001");

            mockMvc.perform(get("/api/batches/preview-number")
                            .param("productSku", "STEEL-001"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.previewBatchNumber").value("STEEL-2026-001"))
                    .andExpect(jsonPath("$.productSku").value("STEEL-001"));
        }

        @Test
        @DisplayName("should_returnPreviewNumber_when_bothParametersProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_returnPreviewNumber_when_bothParametersProvided() throws Exception {
            when(batchNumberService.previewBatchNumber("ROLLING", "STEEL-001"))
                    .thenReturn("ROLL-STEEL-2026-001");

            mockMvc.perform(get("/api/batches/preview-number")
                            .param("operationType", "ROLLING")
                            .param("productSku", "STEEL-001"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.previewBatchNumber").value("ROLL-STEEL-2026-001"))
                    .andExpect(jsonPath("$.operationType").value("ROLLING"))
                    .andExpect(jsonPath("$.productSku").value("STEEL-001"));
        }
    }

    @Nested
    @DisplayName("GET /api/batches/status/{status} Tests")
    class GetBatchesByStatusTests {

        @Test
        @DisplayName("should_returnBatchesByStatus_when_statusIsAvailable")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBatchesByStatus_when_statusIsAvailable() throws Exception {
            when(batchService.getBatchesByStatus("AVAILABLE")).thenReturn(List.of(testBatch));

            mockMvc.perform(get("/api/batches/status/AVAILABLE"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].status").value("AVAILABLE"));

            verify(batchService).getBatchesByStatus("AVAILABLE");
        }

        @Test
        @DisplayName("should_returnEmptyList_when_noBatchesWithStatus")
        @WithMockUser(username = "admin@mes.com")
        void should_returnEmptyList_when_noBatchesWithStatus() throws Exception {
            when(batchService.getBatchesByStatus("SCRAPPED")).thenReturn(List.of());

            mockMvc.perform(get("/api/batches/status/SCRAPPED"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }

        @Test
        @DisplayName("should_returnConsumedBatches_when_statusIsConsumed")
        @WithMockUser(username = "admin@mes.com")
        void should_returnConsumedBatches_when_statusIsConsumed() throws Exception {
            BatchDTO consumedBatch = BatchDTO.builder()
                    .batchId(2L)
                    .batchNumber("BATCH-002")
                    .status("CONSUMED")
                    .build();

            when(batchService.getBatchesByStatus("CONSUMED")).thenReturn(List.of(consumedBatch));

            mockMvc.perform(get("/api/batches/status/CONSUMED"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].status").value("CONSUMED"));
        }
    }

    @Nested
    @DisplayName("GET /api/batches/available Tests")
    class GetAvailableBatchesTests {

        @Test
        @DisplayName("should_returnAllBatches_when_noMaterialIdProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_returnAllBatches_when_noMaterialIdProvided() throws Exception {
            when(batchService.getAllBatches()).thenReturn(List.of(testBatch));

            mockMvc.perform(get("/api/batches/available"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].batchId").value(1));

            verify(batchService, times(1)).getAllBatches();
        }

        @Test
        @DisplayName("should_returnFilteredBatches_when_materialIdProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_returnFilteredBatches_when_materialIdProvided() throws Exception {
            when(batchService.getAvailableBatchesByMaterial("IM-001")).thenReturn(List.of(testBatch));

            mockMvc.perform(get("/api/batches/available")
                            .param("materialId", "IM-001"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].materialId").value("IM-001"));

            verify(batchService, times(1)).getAvailableBatchesByMaterial("IM-001");
        }
    }

    @Nested
    @DisplayName("GET /api/batches/produced Tests")
    class GetProducedBatchesTests {

        @Test
        @DisplayName("should_returnProducedBatches_when_batchesPendingApproval")
        @WithMockUser(username = "admin@mes.com")
        void should_returnProducedBatches_when_batchesPendingApproval() throws Exception {
            BatchDTO producedBatch = BatchDTO.builder()
                    .batchId(3L)
                    .batchNumber("BATCH-003")
                    .status("PRODUCED")
                    .build();

            when(batchService.getProducedBatches()).thenReturn(List.of(producedBatch));

            mockMvc.perform(get("/api/batches/produced"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].batchId").value(3))
                    .andExpect(jsonPath("$[0].status").value("PRODUCED"));

            verify(batchService).getProducedBatches();
        }

        @Test
        @DisplayName("should_returnEmptyList_when_noProducedBatches")
        @WithMockUser(username = "admin@mes.com")
        void should_returnEmptyList_when_noProducedBatches() throws Exception {
            when(batchService.getProducedBatches()).thenReturn(List.of());

            mockMvc.perform(get("/api/batches/produced"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }
    }

    @Nested
    @DisplayName("POST /api/batches Tests - Manual Creation Blocked")
    class CreateBatchBlockedTests {

        @Test
        @WithMockUser(username = "admin@mes.com")
        @DisplayName("should_blockManualCreation_when_postRequestMade")
        void should_blockManualCreation_when_postRequestMade() throws Exception {
            BatchDTO.CreateBatchRequest request = BatchDTO.CreateBatchRequest.builder()
                    .batchNumber("MANUAL-BATCH-001")
                    .materialId("RM-001")
                    .materialName("Iron Ore")
                    .quantity(new BigDecimal("1000.00"))
                    .unit("KG")
                    .build();

            mockMvc.perform(post("/api/batches")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(containsString("Manual batch creation is not allowed")));

            verify(batchService, never()).createBatch(any(BatchDTO.CreateBatchRequest.class));
        }
    }

    @Nested
    @DisplayName("PUT /api/batches/{id} Tests")
    class UpdateBatchTests {

        @Test
        @WithMockUser(username = "admin@mes.com")
        @DisplayName("should_updateBatch_when_validDataProvided")
        void should_updateBatch_when_validDataProvided() throws Exception {
            BatchDTO.UpdateBatchRequest request = BatchDTO.UpdateBatchRequest.builder()
                    .materialName("Updated Steel Billet")
                    .unit("LBS")
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
        @DisplayName("should_returnBadRequest_when_batchNotFound")
        void should_returnBadRequest_when_batchNotFound() throws Exception {
            BatchDTO.UpdateBatchRequest request = BatchDTO.UpdateBatchRequest.builder()
                    .materialName("Updated Steel Billet")
                    .build();

            when(batchService.updateBatch(eq(999L), any(BatchDTO.UpdateBatchRequest.class)))
                    .thenThrow(new RuntimeException("Batch not found"));

            mockMvc.perform(put("/api/batches/999")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("DELETE /api/batches/{id} Tests")
    class DeleteBatchTests {

        @Test
        @WithMockUser(username = "admin@mes.com")
        @DisplayName("should_deleteBatch_when_validIdProvided")
        void should_deleteBatch_when_validIdProvided() throws Exception {
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
        @DisplayName("should_returnBadRequest_when_deletingConsumedBatch")
        void should_returnBadRequest_when_deletingConsumedBatch() throws Exception {
            when(batchService.deleteBatch(1L))
                    .thenThrow(new RuntimeException("Cannot delete consumed batch"));

            mockMvc.perform(delete("/api/batches/1"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @WithMockUser(username = "admin@mes.com")
        @DisplayName("should_returnBadRequest_when_batchNotFound")
        void should_returnBadRequest_when_batchNotFound() throws Exception {
            when(batchService.deleteBatch(999L))
                    .thenThrow(new RuntimeException("Batch not found"));

            mockMvc.perform(delete("/api/batches/999"))
                    .andExpect(status().isBadRequest());
        }
    }
}
