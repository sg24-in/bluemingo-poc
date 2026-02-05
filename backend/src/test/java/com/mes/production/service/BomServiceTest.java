package com.mes.production.service;

import com.mes.production.dto.BomDTO;
import com.mes.production.entity.BillOfMaterial;
import com.mes.production.repository.BomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BomServiceTest {

    @Mock
    private BomRepository bomRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private BomService bomService;

    private BillOfMaterial rootBom;
    private BillOfMaterial childBom;

    @BeforeEach
    void setUp() {
        rootBom = BillOfMaterial.builder()
                .bomId(1L)
                .productSku("STEEL-001")
                .bomVersion("V1")
                .materialId("RM-IRON-001")
                .materialName("Iron Ore")
                .quantityRequired(new BigDecimal("100.00"))
                .unit("KG")
                .yieldLossRatio(new BigDecimal("1.05"))
                .sequenceLevel(1)
                .parentBomId(null)
                .status("ACTIVE")
                .createdBy("admin")
                .build();

        childBom = BillOfMaterial.builder()
                .bomId(2L)
                .productSku("STEEL-001")
                .bomVersion("V1")
                .materialId("RM-COAL-001")
                .materialName("Coal")
                .quantityRequired(new BigDecimal("50.00"))
                .unit("KG")
                .yieldLossRatio(new BigDecimal("1.00"))
                .sequenceLevel(2)
                .parentBomId(1L)
                .status("ACTIVE")
                .createdBy("admin")
                .build();
    }

    private void setupSecurityContext() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("admin@mes.com");
        SecurityContextHolder.setContext(securityContext);
    }

    // =====================================================
    // READ Operations Tests
    // =====================================================

    @Nested
    @DisplayName("getBomTree Tests")
    class GetBomTreeTests {

        @Test
        @DisplayName("Should return BOM tree for product")
        void getBomTree_ValidProduct_ReturnsTree() {
            when(bomRepository.findActiveByProductSkuOrderByLevel("STEEL-001"))
                    .thenReturn(List.of(rootBom, childBom));

            BomDTO.BomTreeFullResponse result = bomService.getBomTree("STEEL-001");

            assertNotNull(result);
            assertEquals("STEEL-001", result.getProductSku());
            assertEquals("V1", result.getBomVersion());
            assertEquals(2, result.getTotalNodes());
            assertEquals(1, result.getTree().size());
            assertEquals("RM-IRON-001", result.getTree().get(0).getMaterialId());
            // Verify child is nested under root
            assertEquals(1, result.getTree().get(0).getChildren().size());
            assertEquals("RM-COAL-001", result.getTree().get(0).getChildren().get(0).getMaterialId());
        }

        @Test
        @DisplayName("Should return empty tree for unknown product")
        void getBomTree_UnknownProduct_ReturnsEmptyTree() {
            when(bomRepository.findActiveByProductSkuOrderByLevel("UNKNOWN"))
                    .thenReturn(List.of());

            BomDTO.BomTreeFullResponse result = bomService.getBomTree("UNKNOWN");

            assertNotNull(result);
            assertEquals("UNKNOWN", result.getProductSku());
            assertEquals(0, result.getTotalNodes());
            assertTrue(result.getTree().isEmpty());
        }

        @Test
        @DisplayName("Should calculate correct max depth")
        void getBomTree_WithChildren_CalculatesMaxDepth() {
            when(bomRepository.findActiveByProductSkuOrderByLevel("STEEL-001"))
                    .thenReturn(List.of(rootBom, childBom));

            BomDTO.BomTreeFullResponse result = bomService.getBomTree("STEEL-001");

            assertEquals(2, result.getMaxDepth());
        }
    }

    @Nested
    @DisplayName("getBomTreeByVersion Tests")
    class GetBomTreeByVersionTests {

        @Test
        @DisplayName("Should return BOM tree for specific version")
        void getBomTreeByVersion_ValidVersion_ReturnsTree() {
            when(bomRepository.findActiveByProductSkuAndBomVersion("STEEL-001", "V1"))
                    .thenReturn(List.of(rootBom));

            BomDTO.BomTreeFullResponse result = bomService.getBomTreeByVersion("STEEL-001", "V1");

            assertNotNull(result);
            assertEquals("V1", result.getBomVersion());
            assertEquals(1, result.getTotalNodes());
        }

        @Test
        @DisplayName("Should return empty tree for unknown version")
        void getBomTreeByVersion_UnknownVersion_ReturnsEmptyTree() {
            when(bomRepository.findActiveByProductSkuAndBomVersion("STEEL-001", "V99"))
                    .thenReturn(List.of());

            BomDTO.BomTreeFullResponse result = bomService.getBomTreeByVersion("STEEL-001", "V99");

            assertNotNull(result);
            assertEquals("V99", result.getBomVersion());
            assertEquals(0, result.getTotalNodes());
        }
    }

    @Nested
    @DisplayName("getBomNode Tests")
    class GetBomNodeTests {

        @Test
        @DisplayName("Should return single BOM node")
        void getBomNode_ValidId_ReturnsNode() {
            when(bomRepository.findById(1L)).thenReturn(Optional.of(rootBom));
            when(bomRepository.findByParentBomId(1L)).thenReturn(List.of(childBom));
            when(bomRepository.findByParentBomId(2L)).thenReturn(List.of());

            BomDTO.BomTreeNode result = bomService.getBomNode(1L);

            assertNotNull(result);
            assertEquals(1L, result.getBomId());
            assertEquals("RM-IRON-001", result.getMaterialId());
            assertEquals(1, result.getChildren().size());
        }

        @Test
        @DisplayName("Should throw exception for unknown node")
        void getBomNode_UnknownId_ThrowsException() {
            when(bomRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> bomService.getBomNode(999L));

            assertTrue(exception.getMessage().contains("BOM not found"));
        }
    }

    @Nested
    @DisplayName("getAllProducts Tests")
    class GetAllProductsTests {

        @Test
        @DisplayName("Should return all products with BOMs")
        void getAllProducts_ReturnsProductList() {
            when(bomRepository.findDistinctProductSkus())
                    .thenReturn(List.of("STEEL-001", "STEEL-002"));
            when(bomRepository.findActiveByProductSkuOrderByLevel("STEEL-001"))
                    .thenReturn(List.of(rootBom));
            when(bomRepository.findActiveByProductSkuOrderByLevel("STEEL-002"))
                    .thenReturn(List.of());
            when(bomRepository.findMaxSequenceLevelByProductSku("STEEL-001"))
                    .thenReturn(2);

            List<BomDTO.BomProductSummary> result = bomService.getAllProducts();

            assertNotNull(result);
            assertEquals(2, result.size());
            assertEquals("STEEL-001", result.get(0).getProductSku());
        }

        @Test
        @DisplayName("Should return empty list when no BOMs")
        void getAllProducts_NoBoms_ReturnsEmptyList() {
            when(bomRepository.findDistinctProductSkus())
                    .thenReturn(List.of());

            List<BomDTO.BomProductSummary> result = bomService.getAllProducts();

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    @Nested
    @DisplayName("getVersionsForProduct Tests")
    class GetVersionsForProductTests {

        @Test
        @DisplayName("Should return versions for product")
        void getVersionsForProduct_ReturnsVersions() {
            when(bomRepository.findDistinctVersionsByProductSku("STEEL-001"))
                    .thenReturn(List.of("V1", "V2"));

            List<String> result = bomService.getVersionsForProduct("STEEL-001");

            assertEquals(2, result.size());
            assertTrue(result.contains("V1"));
            assertTrue(result.contains("V2"));
        }
    }

    @Nested
    @DisplayName("getBomList Tests")
    class GetBomListTests {

        @Test
        @DisplayName("Should return flat BOM list")
        void getBomList_ReturnsFlat() {
            when(bomRepository.findActiveByProductSkuOrderByLevel("STEEL-001"))
                    .thenReturn(List.of(rootBom, childBom));
            when(bomRepository.countChildrenByParentBomId(1L)).thenReturn(1);
            when(bomRepository.countChildrenByParentBomId(2L)).thenReturn(0);

            List<BomDTO.BomListResponse> result = bomService.getBomList("STEEL-001");

            assertEquals(2, result.size());
            assertEquals(1, result.get(0).getChildCount());
            assertEquals(0, result.get(1).getChildCount());
        }
    }

    // =====================================================
    // CREATE Operations Tests
    // =====================================================

    @Nested
    @DisplayName("createBomNode Tests")
    class CreateBomNodeTests {

        @Test
        @DisplayName("Should create new root BOM node")
        void createBomNode_RootNode_CreatesSuccessfully() {
            setupSecurityContext();

            BomDTO.CreateBomNodeRequest request = BomDTO.CreateBomNodeRequest.builder()
                    .productSku("STEEL-001")
                    .bomVersion("V1")
                    .materialId("RM-NEW-001")
                    .materialName("New Material")
                    .quantityRequired(new BigDecimal("75.00"))
                    .unit("KG")
                    .yieldLossRatio(new BigDecimal("1.02"))
                    .sequenceLevel(1)
                    .parentBomId(null)
                    .build();

            BillOfMaterial savedBom = BillOfMaterial.builder()
                    .bomId(10L)
                    .productSku("STEEL-001")
                    .bomVersion("V1")
                    .materialId("RM-NEW-001")
                    .materialName("New Material")
                    .quantityRequired(new BigDecimal("75.00"))
                    .unit("KG")
                    .yieldLossRatio(new BigDecimal("1.02"))
                    .sequenceLevel(1)
                    .status("ACTIVE")
                    .build();

            when(bomRepository.save(any(BillOfMaterial.class))).thenReturn(savedBom);

            BomDTO.BomTreeNode result = bomService.createBomNode(request);

            assertNotNull(result);
            assertEquals(10L, result.getBomId());
            assertEquals("RM-NEW-001", result.getMaterialId());
            verify(auditService).logCreate(eq("BOM"), eq(10L), anyString());
        }

        @Test
        @DisplayName("Should create child BOM node with parent validation")
        void createBomNode_WithParent_ValidatesParent() {
            setupSecurityContext();

            BomDTO.CreateBomNodeRequest request = BomDTO.CreateBomNodeRequest.builder()
                    .productSku("STEEL-001")
                    .materialId("RM-CHILD-001")
                    .materialName("Child Material")
                    .quantityRequired(new BigDecimal("25.00"))
                    .unit("KG")
                    .parentBomId(1L)
                    .build();

            when(bomRepository.findById(1L)).thenReturn(Optional.of(rootBom));

            BillOfMaterial savedBom = BillOfMaterial.builder()
                    .bomId(11L)
                    .productSku("STEEL-001")
                    .bomVersion("V1")
                    .materialId("RM-CHILD-001")
                    .materialName("Child Material")
                    .quantityRequired(new BigDecimal("25.00"))
                    .unit("KG")
                    .parentBomId(1L)
                    .sequenceLevel(1)
                    .status("ACTIVE")
                    .build();

            when(bomRepository.save(any(BillOfMaterial.class))).thenReturn(savedBom);

            BomDTO.BomTreeNode result = bomService.createBomNode(request);

            assertNotNull(result);
            assertEquals(1L, result.getParentBomId());
            verify(bomRepository).findById(1L);
        }

        @Test
        @DisplayName("Should throw exception for invalid parent")
        void createBomNode_InvalidParent_ThrowsException() {
            BomDTO.CreateBomNodeRequest request = BomDTO.CreateBomNodeRequest.builder()
                    .productSku("STEEL-001")
                    .materialId("RM-001")
                    .materialName("Material")
                    .quantityRequired(new BigDecimal("10"))
                    .unit("KG")
                    .parentBomId(999L)
                    .build();

            when(bomRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> bomService.createBomNode(request));

            assertTrue(exception.getMessage().contains("Parent BOM not found"));
        }
    }

    @Nested
    @DisplayName("createBomTree Tests")
    class CreateBomTreeTests {

        @Test
        @DisplayName("Should create full BOM tree")
        void createBomTree_CreatesMultipleNodes() {
            setupSecurityContext();

            BomDTO.CreateBomNodeRequest node1 = BomDTO.CreateBomNodeRequest.builder()
                    .materialId("RM-001")
                    .materialName("Material 1")
                    .quantityRequired(new BigDecimal("100"))
                    .unit("KG")
                    .sequenceLevel(1)
                    .build();

            BomDTO.CreateBomNodeRequest node2 = BomDTO.CreateBomNodeRequest.builder()
                    .materialId("RM-002")
                    .materialName("Material 2")
                    .quantityRequired(new BigDecimal("50"))
                    .unit("KG")
                    .sequenceLevel(2)
                    .build();

            BomDTO.CreateBomTreeRequest request = BomDTO.CreateBomTreeRequest.builder()
                    .productSku("STEEL-001")
                    .bomVersion("V1")
                    .nodes(List.of(node1, node2))
                    .build();

            when(bomRepository.save(any(BillOfMaterial.class)))
                    .thenReturn(rootBom)
                    .thenReturn(childBom);
            when(bomRepository.findActiveByProductSkuOrderByLevel("STEEL-001"))
                    .thenReturn(List.of(rootBom, childBom));

            BomDTO.BomTreeFullResponse result = bomService.createBomTree(request);

            assertNotNull(result);
            verify(bomRepository, times(2)).save(any(BillOfMaterial.class));
            verify(auditService).createAuditEntry(eq("BOM"), isNull(), isNull(), isNull(), contains("2 nodes"), eq("CREATE_TREE"));
        }
    }

    // =====================================================
    // UPDATE Operations Tests
    // =====================================================

    @Nested
    @DisplayName("updateBomNode Tests")
    class UpdateBomNodeTests {

        @Test
        @DisplayName("Should update BOM node fields")
        void updateBomNode_ValidRequest_UpdatesFields() {
            setupSecurityContext();

            BomDTO.UpdateBomNodeRequest request = BomDTO.UpdateBomNodeRequest.builder()
                    .materialId("RM-UPDATED-001")
                    .materialName("Updated Material")
                    .quantityRequired(new BigDecimal("150.00"))
                    .status("DRAFT")
                    .build();

            BillOfMaterial updatedBom = BillOfMaterial.builder()
                    .bomId(1L)
                    .productSku("STEEL-001")
                    .bomVersion("V1")
                    .materialId("RM-UPDATED-001")
                    .materialName("Updated Material")
                    .quantityRequired(new BigDecimal("150.00"))
                    .unit("KG")
                    .status("DRAFT")
                    .build();

            when(bomRepository.findById(1L)).thenReturn(Optional.of(rootBom));
            when(bomRepository.save(any(BillOfMaterial.class))).thenReturn(updatedBom);
            when(bomRepository.findByParentBomId(1L)).thenReturn(List.of());

            BomDTO.BomTreeNode result = bomService.updateBomNode(1L, request);

            assertNotNull(result);
            assertEquals("RM-UPDATED-001", result.getMaterialId());
            assertEquals("Updated Material", result.getMaterialName());
            assertEquals(new BigDecimal("150.00"), result.getQuantityRequired());
            verify(auditService).createAuditEntry(eq("BOM"), eq(1L), isNull(), isNull(), anyString(), eq("UPDATE"));
        }

        @Test
        @DisplayName("Should throw exception for unknown node")
        void updateBomNode_UnknownId_ThrowsException() {
            BomDTO.UpdateBomNodeRequest request = BomDTO.UpdateBomNodeRequest.builder()
                    .materialName("Updated")
                    .build();

            when(bomRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> bomService.updateBomNode(999L, request));

            assertTrue(exception.getMessage().contains("BOM not found"));
        }
    }

    @Nested
    @DisplayName("moveBomNode Tests")
    class MoveBomNodeTests {

        @Test
        @DisplayName("Should move BOM node to new parent")
        void moveBomNode_ValidMove_UpdatesParent() {
            setupSecurityContext();

            BillOfMaterial newParent = BillOfMaterial.builder()
                    .bomId(3L)
                    .productSku("STEEL-001")
                    .parentBomId(null)
                    .build();

            BomDTO.MoveBomNodeRequest request = BomDTO.MoveBomNodeRequest.builder()
                    .newParentBomId(3L)
                    .newSequenceLevel(2)
                    .build();

            when(bomRepository.findById(2L)).thenReturn(Optional.of(childBom));
            when(bomRepository.findById(3L)).thenReturn(Optional.of(newParent));
            when(bomRepository.save(any(BillOfMaterial.class))).thenReturn(childBom);
            when(bomRepository.findByParentBomId(2L)).thenReturn(List.of());

            BomDTO.BomTreeNode result = bomService.moveBomNode(2L, request);

            assertNotNull(result);
            verify(auditService).createAuditEntry(eq("BOM"), eq(2L), eq("parentBomId"), anyString(), eq("3"), eq("MOVE"));
        }

        @Test
        @DisplayName("Should prevent cycle in hierarchy")
        void moveBomNode_CreatesCycle_ThrowsException() {
            // Try to move root to be child of its own child
            BomDTO.MoveBomNodeRequest request = BomDTO.MoveBomNodeRequest.builder()
                    .newParentBomId(2L)
                    .build();

            when(bomRepository.findById(1L)).thenReturn(Optional.of(rootBom));
            when(bomRepository.findById(2L)).thenReturn(Optional.of(childBom));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> bomService.moveBomNode(1L, request));

            assertTrue(exception.getMessage().contains("cycle"));
        }
    }

    @Nested
    @DisplayName("updateBomSettings Tests")
    class UpdateBomSettingsTests {

        @Test
        @DisplayName("Should update version for all nodes")
        void updateBomSettings_UpdatesVersion() {
            setupSecurityContext();

            BomDTO.UpdateBomSettingsRequest request = BomDTO.UpdateBomSettingsRequest.builder()
                    .bomVersion("V2")
                    .build();

            when(bomRepository.findByProductSku("STEEL-001"))
                    .thenReturn(List.of(rootBom, childBom));

            BomDTO.UpdateBomSettingsResponse result = bomService.updateBomSettings("STEEL-001", request);

            assertNotNull(result);
            assertEquals("V2", result.getBomVersion());
            assertEquals(2, result.getNodesUpdated());
            verify(bomRepository).saveAll(anyList());
        }

        @Test
        @DisplayName("Should update product SKU for all nodes")
        void updateBomSettings_UpdatesProductSku() {
            setupSecurityContext();

            BomDTO.UpdateBomSettingsRequest request = BomDTO.UpdateBomSettingsRequest.builder()
                    .newProductSku("STEEL-002")
                    .build();

            when(bomRepository.findByProductSku("STEEL-001"))
                    .thenReturn(List.of(rootBom, childBom));

            BomDTO.UpdateBomSettingsResponse result = bomService.updateBomSettings("STEEL-001", request);

            assertNotNull(result);
            assertEquals("STEEL-002", result.getProductSku());
            assertEquals(2, result.getNodesUpdated());
        }

        @Test
        @DisplayName("Should update status for all nodes")
        void updateBomSettings_UpdatesStatus() {
            setupSecurityContext();

            BomDTO.UpdateBomSettingsRequest request = BomDTO.UpdateBomSettingsRequest.builder()
                    .status("DRAFT")
                    .build();

            when(bomRepository.findByProductSku("STEEL-001"))
                    .thenReturn(List.of(rootBom, childBom));

            BomDTO.UpdateBomSettingsResponse result = bomService.updateBomSettings("STEEL-001", request);

            assertNotNull(result);
            assertEquals("DRAFT", result.getStatus());
        }

        @Test
        @DisplayName("Should throw exception for unknown product")
        void updateBomSettings_UnknownProduct_ThrowsException() {
            BomDTO.UpdateBomSettingsRequest request = BomDTO.UpdateBomSettingsRequest.builder()
                    .bomVersion("V2")
                    .build();

            when(bomRepository.findByProductSku("UNKNOWN")).thenReturn(List.of());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> bomService.updateBomSettings("UNKNOWN", request));

            assertTrue(exception.getMessage().contains("No BOM found"));
        }
    }

    // =====================================================
    // DELETE Operations Tests
    // =====================================================

    @Nested
    @DisplayName("deleteBomNode Tests")
    class DeleteBomNodeTests {

        @Test
        @DisplayName("Should soft delete BOM node")
        void deleteBomNode_NoChildren_SoftDeletes() {
            setupSecurityContext();

            when(bomRepository.findById(2L)).thenReturn(Optional.of(childBom));
            when(bomRepository.countChildrenByParentBomId(2L)).thenReturn(0);

            bomService.deleteBomNode(2L);

            verify(bomRepository).save(argThat(bom -> "INACTIVE".equals(bom.getStatus())));
            verify(auditService).logStatusChange("BOM", 2L, "ACTIVE", "INACTIVE");
        }

        @Test
        @DisplayName("Should prevent delete when has children")
        void deleteBomNode_HasChildren_ThrowsException() {
            when(bomRepository.findById(1L)).thenReturn(Optional.of(rootBom));
            when(bomRepository.countChildrenByParentBomId(1L)).thenReturn(1);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> bomService.deleteBomNode(1L));

            assertTrue(exception.getMessage().contains("Cannot delete BOM node with children"));
        }

        @Test
        @DisplayName("Should throw exception for unknown node")
        void deleteBomNode_UnknownId_ThrowsException() {
            when(bomRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> bomService.deleteBomNode(999L));

            assertTrue(exception.getMessage().contains("BOM not found"));
        }
    }

    @Nested
    @DisplayName("deleteBomNodeCascade Tests")
    class DeleteBomNodeCascadeTests {

        @Test
        @DisplayName("Should cascade delete node and children")
        void deleteBomNodeCascade_DeletesAll() {
            setupSecurityContext();

            when(bomRepository.findById(1L)).thenReturn(Optional.of(rootBom));
            when(bomRepository.findByParentBomIdOrderBySequenceLevelAsc(1L))
                    .thenReturn(List.of(childBom));
            when(bomRepository.findByParentBomIdOrderBySequenceLevelAsc(2L))
                    .thenReturn(List.of());
            when(bomRepository.findById(2L)).thenReturn(Optional.of(childBom));

            int deletedCount = bomService.deleteBomNodeCascade(1L);

            assertEquals(2, deletedCount);
            verify(bomRepository, times(2)).save(any(BillOfMaterial.class));
            verify(auditService).createAuditEntry(eq("BOM"), eq(1L), isNull(), isNull(), contains("Cascade deleted"), eq("DELETE_CASCADE"));
        }
    }

    @Nested
    @DisplayName("deleteBomTree Tests")
    class DeleteBomTreeTests {

        @Test
        @DisplayName("Should delete entire BOM tree for product")
        void deleteBomTree_DeletesAllNodes() {
            setupSecurityContext();

            when(bomRepository.findByProductSku("STEEL-001"))
                    .thenReturn(List.of(rootBom, childBom));

            int deletedCount = bomService.deleteBomTree("STEEL-001");

            assertEquals(2, deletedCount);
            verify(bomRepository).saveAll(anyList());
            verify(auditService).createAuditEntry(eq("BOM"), isNull(), isNull(), isNull(), contains("2 nodes"), eq("DELETE_TREE"));
        }

        @Test
        @DisplayName("Should return zero for unknown product")
        void deleteBomTree_UnknownProduct_ReturnsZero() {
            setupSecurityContext();

            when(bomRepository.findByProductSku("UNKNOWN"))
                    .thenReturn(List.of());

            int deletedCount = bomService.deleteBomTree("UNKNOWN");

            assertEquals(0, deletedCount);
        }
    }
}
