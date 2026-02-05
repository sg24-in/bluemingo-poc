package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.BomDTO;
import com.mes.production.security.JwtService;
import com.mes.production.service.BomService;
import com.mes.production.service.BomValidationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.mes.production.config.TestSecurityConfig;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class BomControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BomValidationService bomValidationService;

    @MockBean
    private BomService bomService;

    @MockBean
    private JwtService jwtService;

    private BomDTO.BomTreeResponse bomTreeResponse;
    private BomDTO.BomValidationResult validationResult;
    private BomDTO.BomTreeFullResponse bomTreeFullResponse;
    private BomDTO.BomTreeNode treeNode;

    @BeforeEach
    void setUp() {
        BomDTO.BomRequirement requirement = BomDTO.BomRequirement.builder()
                .bomId(1L)
                .productSku("STEEL-001")
                .materialId("RM-001")
                .materialName("Iron Ore")
                .quantityRequired(new BigDecimal("100.00"))
                .unit("KG")
                .yieldLossRatio(new BigDecimal("1.05"))
                .sequenceLevel(1)
                .build();

        bomTreeResponse = BomDTO.BomTreeResponse.builder()
                .productSku("STEEL-001")
                .requirements(List.of(requirement))
                .levels(List.of(1))
                .build();

        BomDTO.RequirementCheck check = BomDTO.RequirementCheck.builder()
                .materialId("RM-001")
                .materialName("Iron Ore")
                .requiredQuantity(new BigDecimal("100.00"))
                .actualQuantity(new BigDecimal("100.00"))
                .variancePercent(BigDecimal.ZERO)
                .status("MET")
                .build();

        validationResult = BomDTO.BomValidationResult.builder()
                .valid(true)
                .productSku("STEEL-001")
                .requirementChecks(List.of(check))
                .warnings(List.of())
                .errors(List.of())
                .build();

        treeNode = BomDTO.BomTreeNode.builder()
                .bomId(1L)
                .productSku("STEEL-001")
                .bomVersion("V1")
                .materialId("RM-001")
                .materialName("Iron Ore")
                .quantityRequired(new BigDecimal("100.00"))
                .unit("KG")
                .yieldLossRatio(new BigDecimal("1.05"))
                .sequenceLevel(1)
                .status("ACTIVE")
                .children(List.of())
                .build();

        bomTreeFullResponse = BomDTO.BomTreeFullResponse.builder()
                .productSku("STEEL-001")
                .bomVersion("V1")
                .tree(List.of(treeNode))
                .totalNodes(1)
                .maxDepth(1)
                .build();
    }

    @Test
    @DisplayName("Should get BOM requirements for product")
    @WithMockUser(username = "admin@mes.com")
    void getBomRequirements_ValidSku_ReturnsRequirements() throws Exception {
        when(bomValidationService.getBomRequirements("STEEL-001")).thenReturn(bomTreeResponse);

        mockMvc.perform(get("/api/bom/STEEL-001/requirements"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productSku").value("STEEL-001"))
                .andExpect(jsonPath("$.requirements[0].materialId").value("RM-001"))
                .andExpect(jsonPath("$.requirements[0].materialName").value("Iron Ore"));

        verify(bomValidationService, times(1)).getBomRequirements("STEEL-001");
    }

    @Test
    @DisplayName("Should validate BOM consumption")
    @WithMockUser(username = "admin@mes.com")
    void validateBomConsumption_ValidRequest_ReturnsResult() throws Exception {
        BomDTO.BomValidationRequest request = BomDTO.BomValidationRequest.builder()
                .productSku("STEEL-001")
                .materialsConsumed(List.of(
                        BomDTO.MaterialConsumption.builder()
                                .materialId("RM-001")
                                .quantity(new BigDecimal("100.00"))
                                .build()
                ))
                .build();

        when(bomValidationService.validateConsumption(any(BomDTO.BomValidationRequest.class)))
                .thenReturn(validationResult);

        mockMvc.perform(post("/api/bom/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true))
                .andExpect(jsonPath("$.productSku").value("STEEL-001"))
                .andExpect(jsonPath("$.requirementChecks[0].status").value("MET"));

        verify(bomValidationService, times(1)).validateConsumption(any());
    }

    @Test
    @DisplayName("Should return validation with warnings")
    @WithMockUser(username = "admin@mes.com")
    void validateBomConsumption_WithWarnings_ReturnsWarnings() throws Exception {
        BomDTO.RequirementCheck warningCheck = BomDTO.RequirementCheck.builder()
                .materialId("RM-001")
                .materialName("Iron Ore")
                .requiredQuantity(new BigDecimal("100.00"))
                .actualQuantity(new BigDecimal("120.00"))
                .variancePercent(new BigDecimal("20.00"))
                .status("WARNING")
                .build();

        BomDTO.BomValidationResult warningResult = BomDTO.BomValidationResult.builder()
                .valid(true)
                .productSku("STEEL-001")
                .requirementChecks(List.of(warningCheck))
                .warnings(List.of("Variance for Iron Ore exceeds 5%: 20.00%"))
                .errors(List.of())
                .build();

        when(bomValidationService.validateConsumption(any())).thenReturn(warningResult);

        BomDTO.BomValidationRequest request = BomDTO.BomValidationRequest.builder()
                .productSku("STEEL-001")
                .materialsConsumed(List.of(
                        BomDTO.MaterialConsumption.builder()
                                .materialId("RM-001")
                                .quantity(new BigDecimal("120.00"))
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/bom/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true))
                .andExpect(jsonPath("$.warnings[0]").value("Variance for Iron Ore exceeds 5%: 20.00%"))
                .andExpect(jsonPath("$.requirementChecks[0].status").value("WARNING"));
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void getBomRequirements_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/bom/STEEL-001/requirements"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should return empty requirements for unknown product")
    @WithMockUser(username = "admin@mes.com")
    void getBomRequirements_UnknownProduct_ReturnsEmpty() throws Exception {
        BomDTO.BomTreeResponse emptyResponse = BomDTO.BomTreeResponse.builder()
                .productSku("UNKNOWN")
                .requirements(List.of())
                .levels(List.of())
                .build();

        when(bomValidationService.getBomRequirements("UNKNOWN")).thenReturn(emptyResponse);

        mockMvc.perform(get("/api/bom/UNKNOWN/requirements"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productSku").value("UNKNOWN"))
                .andExpect(jsonPath("$.requirements").isEmpty());
    }

    // =====================================================
    // BOM Tree CRUD Endpoint Tests
    // =====================================================

    @Nested
    @DisplayName("GET /api/bom/{productSku}/tree")
    class GetBomTreeTests {

        @Test
        @DisplayName("Should return BOM tree")
        @WithMockUser(username = "admin@mes.com")
        void getBomTree_ReturnsTree() throws Exception {
            when(bomService.getBomTree("STEEL-001")).thenReturn(bomTreeFullResponse);

            mockMvc.perform(get("/api/bom/STEEL-001/tree"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.productSku").value("STEEL-001"))
                    .andExpect(jsonPath("$.bomVersion").value("V1"))
                    .andExpect(jsonPath("$.totalNodes").value(1))
                    .andExpect(jsonPath("$.tree[0].materialId").value("RM-001"));

            verify(bomService).getBomTree("STEEL-001");
        }

        @Test
        @DisplayName("Should return 401 when not authenticated")
        void getBomTree_NotAuthenticated_Returns401() throws Exception {
            mockMvc.perform(get("/api/bom/STEEL-001/tree"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/bom/{productSku}/tree/version/{version}")
    class GetBomTreeByVersionTests {

        @Test
        @DisplayName("Should return BOM tree for specific version")
        @WithMockUser(username = "admin@mes.com")
        void getBomTreeByVersion_ReturnsTree() throws Exception {
            when(bomService.getBomTreeByVersion("STEEL-001", "V1")).thenReturn(bomTreeFullResponse);

            mockMvc.perform(get("/api/bom/STEEL-001/tree/version/V1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.bomVersion").value("V1"));

            verify(bomService).getBomTreeByVersion("STEEL-001", "V1");
        }
    }

    @Nested
    @DisplayName("GET /api/bom/{productSku}/list")
    class GetBomListTests {

        @Test
        @DisplayName("Should return flat BOM list")
        @WithMockUser(username = "admin@mes.com")
        void getBomList_ReturnsList() throws Exception {
            BomDTO.BomListResponse listItem = BomDTO.BomListResponse.builder()
                    .bomId(1L)
                    .productSku("STEEL-001")
                    .materialId("RM-001")
                    .materialName("Iron Ore")
                    .quantityRequired(new BigDecimal("100.00"))
                    .unit("KG")
                    .sequenceLevel(1)
                    .status("ACTIVE")
                    .childCount(0)
                    .build();

            when(bomService.getBomList("STEEL-001")).thenReturn(List.of(listItem));

            mockMvc.perform(get("/api/bom/STEEL-001/list"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].bomId").value(1))
                    .andExpect(jsonPath("$[0].materialId").value("RM-001"));
        }
    }

    @Nested
    @DisplayName("GET /api/bom/node/{bomId}")
    class GetBomNodeTests {

        @Test
        @DisplayName("Should return single BOM node")
        @WithMockUser(username = "admin@mes.com")
        void getBomNode_ReturnsNode() throws Exception {
            when(bomService.getBomNode(1L)).thenReturn(treeNode);

            mockMvc.perform(get("/api/bom/node/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.bomId").value(1))
                    .andExpect(jsonPath("$.materialId").value("RM-001"));
        }

        @Test
        @DisplayName("Should return 400 when node not found")
        @WithMockUser(username = "admin@mes.com")
        void getBomNode_NotFound_Returns400() throws Exception {
            when(bomService.getBomNode(999L)).thenThrow(new RuntimeException("BOM not found: 999"));

            mockMvc.perform(get("/api/bom/node/999"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("BOM not found: 999"));
        }
    }

    @Nested
    @DisplayName("GET /api/bom/products")
    class GetAllProductsTests {

        @Test
        @DisplayName("Should return all products with BOMs")
        @WithMockUser(username = "admin@mes.com")
        void getAllProducts_ReturnsProducts() throws Exception {
            BomDTO.BomProductSummary summary = BomDTO.BomProductSummary.builder()
                    .productSku("STEEL-001")
                    .bomVersion("V1")
                    .totalNodes(5)
                    .maxLevel(3)
                    .status("ACTIVE")
                    .build();

            when(bomService.getAllProducts()).thenReturn(List.of(summary));

            mockMvc.perform(get("/api/bom/products"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].productSku").value("STEEL-001"))
                    .andExpect(jsonPath("$[0].totalNodes").value(5));
        }
    }

    @Nested
    @DisplayName("GET /api/bom/{productSku}/versions")
    class GetVersionsTests {

        @Test
        @DisplayName("Should return versions for product")
        @WithMockUser(username = "admin@mes.com")
        void getVersions_ReturnsVersionList() throws Exception {
            when(bomService.getVersionsForProduct("STEEL-001")).thenReturn(List.of("V1", "V2"));

            mockMvc.perform(get("/api/bom/STEEL-001/versions"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0]").value("V1"))
                    .andExpect(jsonPath("$[1]").value("V2"));
        }
    }

    @Nested
    @DisplayName("POST /api/bom/node")
    class CreateBomNodeTests {

        @Test
        @DisplayName("Should create new BOM node")
        @WithMockUser(username = "admin@mes.com")
        void createBomNode_ReturnsCreatedNode() throws Exception {
            BomDTO.CreateBomNodeRequest request = BomDTO.CreateBomNodeRequest.builder()
                    .productSku("STEEL-001")
                    .bomVersion("V1")
                    .materialId("RM-NEW-001")
                    .materialName("New Material")
                    .quantityRequired(new BigDecimal("75.00"))
                    .unit("KG")
                    .build();

            BomDTO.BomTreeNode created = BomDTO.BomTreeNode.builder()
                    .bomId(10L)
                    .productSku("STEEL-001")
                    .bomVersion("V1")
                    .materialId("RM-NEW-001")
                    .materialName("New Material")
                    .quantityRequired(new BigDecimal("75.00"))
                    .unit("KG")
                    .status("ACTIVE")
                    .children(List.of())
                    .build();

            when(bomService.createBomNode(any(BomDTO.CreateBomNodeRequest.class))).thenReturn(created);

            mockMvc.perform(post("/api/bom/node")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.bomId").value(10))
                    .andExpect(jsonPath("$.materialId").value("RM-NEW-001"));
        }

        @Test
        @DisplayName("Should return 401 when not authenticated")
        void createBomNode_NotAuthenticated_Returns401() throws Exception {
            mockMvc.perform(post("/api/bom/node")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("POST /api/bom/tree")
    class CreateBomTreeTests {

        @Test
        @DisplayName("Should create full BOM tree")
        @WithMockUser(username = "admin@mes.com")
        void createBomTree_ReturnsTree() throws Exception {
            BomDTO.CreateBomTreeRequest request = BomDTO.CreateBomTreeRequest.builder()
                    .productSku("STEEL-001")
                    .bomVersion("V1")
                    .nodes(List.of(
                            BomDTO.CreateBomNodeRequest.builder()
                                    .materialId("RM-001")
                                    .materialName("Material 1")
                                    .quantityRequired(new BigDecimal("100"))
                                    .unit("KG")
                                    .sequenceLevel(1)
                                    .build()
                    ))
                    .build();

            when(bomService.createBomTree(any(BomDTO.CreateBomTreeRequest.class))).thenReturn(bomTreeFullResponse);

            mockMvc.perform(post("/api/bom/tree")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.productSku").value("STEEL-001"))
                    .andExpect(jsonPath("$.totalNodes").value(1));
        }
    }

    @Nested
    @DisplayName("PUT /api/bom/node/{bomId}")
    class UpdateBomNodeTests {

        @Test
        @DisplayName("Should update BOM node")
        @WithMockUser(username = "admin@mes.com")
        void updateBomNode_ReturnsUpdatedNode() throws Exception {
            BomDTO.UpdateBomNodeRequest request = BomDTO.UpdateBomNodeRequest.builder()
                    .materialName("Updated Material")
                    .quantityRequired(new BigDecimal("200.00"))
                    .build();

            BomDTO.BomTreeNode updated = BomDTO.BomTreeNode.builder()
                    .bomId(1L)
                    .productSku("STEEL-001")
                    .materialId("RM-001")
                    .materialName("Updated Material")
                    .quantityRequired(new BigDecimal("200.00"))
                    .unit("KG")
                    .status("ACTIVE")
                    .children(List.of())
                    .build();

            when(bomService.updateBomNode(eq(1L), any(BomDTO.UpdateBomNodeRequest.class))).thenReturn(updated);

            mockMvc.perform(put("/api/bom/node/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.materialName").value("Updated Material"))
                    .andExpect(jsonPath("$.quantityRequired").value(200.00));
        }
    }

    @Nested
    @DisplayName("PUT /api/bom/{productSku}/settings")
    class UpdateBomSettingsTests {

        @Test
        @DisplayName("Should update BOM settings")
        @WithMockUser(username = "admin@mes.com")
        void updateBomSettings_ReturnsResponse() throws Exception {
            BomDTO.UpdateBomSettingsRequest request = BomDTO.UpdateBomSettingsRequest.builder()
                    .bomVersion("V2")
                    .status("DRAFT")
                    .build();

            BomDTO.UpdateBomSettingsResponse response = BomDTO.UpdateBomSettingsResponse.builder()
                    .productSku("STEEL-001")
                    .bomVersion("V2")
                    .status("DRAFT")
                    .nodesUpdated(5)
                    .build();

            when(bomService.updateBomSettings(eq("STEEL-001"), any(BomDTO.UpdateBomSettingsRequest.class)))
                    .thenReturn(response);

            mockMvc.perform(put("/api/bom/STEEL-001/settings")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.bomVersion").value("V2"))
                    .andExpect(jsonPath("$.status").value("DRAFT"))
                    .andExpect(jsonPath("$.nodesUpdated").value(5));
        }
    }

    @Nested
    @DisplayName("PUT /api/bom/node/{bomId}/move")
    class MoveBomNodeTests {

        @Test
        @DisplayName("Should move BOM node")
        @WithMockUser(username = "admin@mes.com")
        void moveBomNode_ReturnsMovedNode() throws Exception {
            BomDTO.MoveBomNodeRequest request = BomDTO.MoveBomNodeRequest.builder()
                    .newParentBomId(3L)
                    .newSequenceLevel(2)
                    .build();

            when(bomService.moveBomNode(eq(1L), any(BomDTO.MoveBomNodeRequest.class))).thenReturn(treeNode);

            mockMvc.perform(put("/api/bom/node/1/move")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.bomId").value(1));
        }
    }

    @Nested
    @DisplayName("DELETE /api/bom/node/{bomId}")
    class DeleteBomNodeTests {

        @Test
        @DisplayName("Should delete BOM node")
        @WithMockUser(username = "admin@mes.com")
        void deleteBomNode_ReturnsSuccess() throws Exception {
            doNothing().when(bomService).deleteBomNode(1L);

            mockMvc.perform(delete("/api/bom/node/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("BOM node deleted successfully"));

            verify(bomService).deleteBomNode(1L);
        }

        @Test
        @DisplayName("Should return 400 when node has children")
        @WithMockUser(username = "admin@mes.com")
        void deleteBomNode_HasChildren_Returns400() throws Exception {
            doThrow(new RuntimeException("Cannot delete BOM node with children"))
                    .when(bomService).deleteBomNode(1L);

            mockMvc.perform(delete("/api/bom/node/1"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Cannot delete BOM node with children"));
        }
    }

    @Nested
    @DisplayName("DELETE /api/bom/node/{bomId}/cascade")
    class DeleteBomNodeCascadeTests {

        @Test
        @DisplayName("Should cascade delete BOM node")
        @WithMockUser(username = "admin@mes.com")
        void deleteBomNodeCascade_ReturnsCount() throws Exception {
            when(bomService.deleteBomNodeCascade(1L)).thenReturn(3);

            mockMvc.perform(delete("/api/bom/node/1/cascade"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("BOM node and children deleted successfully"))
                    .andExpect(jsonPath("$.deletedCount").value(3));
        }
    }

    @Nested
    @DisplayName("DELETE /api/bom/{productSku}/tree")
    class DeleteBomTreeTests {

        @Test
        @DisplayName("Should delete entire BOM tree")
        @WithMockUser(username = "admin@mes.com")
        void deleteBomTree_ReturnsCount() throws Exception {
            when(bomService.deleteBomTree("STEEL-001")).thenReturn(5);

            mockMvc.perform(delete("/api/bom/STEEL-001/tree"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("BOM tree deleted successfully"))
                    .andExpect(jsonPath("$.deletedCount").value(5));
        }
    }
}
