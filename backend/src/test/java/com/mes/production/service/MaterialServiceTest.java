package com.mes.production.service;

import com.mes.production.dto.MaterialDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.entity.Material;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.MaterialRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaterialServiceTest {

    @Mock
    private MaterialRepository materialRepository;

    @Mock
    private AuditTrailRepository auditTrailRepository;

    @InjectMocks
    private MaterialService materialService;

    private Material testMaterial;
    private MaterialDTO testMaterialDTO;

    @BeforeEach
    void setUp() {
        testMaterial = Material.builder()
                .materialId(1L)
                .materialCode("MAT-001")
                .materialName("Steel Rod")
                .description("10mm steel rod")
                .materialType(Material.TYPE_RM)
                .baseUnit("KG")
                .materialGroup("STEEL")
                .sku("SKU-MAT-001")
                .standardCost(new BigDecimal("100.00"))
                .costCurrency("USD")
                .minStockLevel(new BigDecimal("50.00"))
                .maxStockLevel(new BigDecimal("500.00"))
                .reorderPoint(new BigDecimal("100.00"))
                .leadTimeDays(7)
                .status(Material.STATUS_ACTIVE)
                .build();

        testMaterialDTO = MaterialDTO.builder()
                .materialCode("MAT-001")
                .materialName("Steel Rod")
                .description("10mm steel rod")
                .materialType(Material.TYPE_RM)
                .baseUnit("KG")
                .materialGroup("STEEL")
                .sku("SKU-MAT-001")
                .standardCost(new BigDecimal("100.00"))
                .costCurrency("USD")
                .build();
    }

    private void setupSecurityContext() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("admin@mes.com");
        SecurityContextHolder.setContext(securityContext);
    }

    @Nested
    @DisplayName("Get Materials Tests")
    class GetMaterialsTests {

        @Test
        @DisplayName("Should get all materials")
        void getAllMaterials_ReturnsAllMaterials() {
            when(materialRepository.findAll()).thenReturn(List.of(testMaterial));

            List<MaterialDTO> result = materialService.getAllMaterials();

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("MAT-001", result.get(0).getMaterialCode());
            assertEquals("Steel Rod", result.get(0).getMaterialName());
        }

        @Test
        @DisplayName("Should get active materials only")
        void getActiveMaterials_ReturnsActiveOnly() {
            when(materialRepository.findAllActiveMaterials()).thenReturn(List.of(testMaterial));

            List<MaterialDTO> result = materialService.getActiveMaterials();

            assertNotNull(result);
            assertEquals(1, result.size());
            verify(materialRepository).findAllActiveMaterials();
        }

        @Test
        @DisplayName("Should get active materials by type")
        void getActiveMaterialsByType_ReturnsFilteredMaterials() {
            when(materialRepository.findActiveMaterialsByType(Material.TYPE_RM))
                    .thenReturn(List.of(testMaterial));

            List<MaterialDTO> result = materialService.getActiveMaterialsByType(Material.TYPE_RM);

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals(Material.TYPE_RM, result.get(0).getMaterialType());
        }

        @Test
        @DisplayName("Should get consumable materials")
        void getConsumableMaterials_ReturnsRMAndIM() {
            when(materialRepository.findConsumableMaterials()).thenReturn(List.of(testMaterial));

            List<MaterialDTO> result = materialService.getConsumableMaterials();

            assertNotNull(result);
            verify(materialRepository).findConsumableMaterials();
        }

        @Test
        @DisplayName("Should get material by ID")
        void getMaterialById_ExistingId_ReturnsMaterial() {
            when(materialRepository.findById(1L)).thenReturn(Optional.of(testMaterial));

            MaterialDTO result = materialService.getMaterialById(1L);

            assertNotNull(result);
            assertEquals("MAT-001", result.getMaterialCode());
        }

        @Test
        @DisplayName("Should throw exception when material not found by ID")
        void getMaterialById_NotFound_ThrowsException() {
            when(materialRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> materialService.getMaterialById(999L));

            assertTrue(exception.getMessage().contains("not found"));
        }

        @Test
        @DisplayName("Should get material by code")
        void getMaterialByCode_ExistingCode_ReturnsMaterial() {
            when(materialRepository.findByMaterialCode("MAT-001")).thenReturn(Optional.of(testMaterial));

            MaterialDTO result = materialService.getMaterialByCode("MAT-001");

            assertNotNull(result);
            assertEquals("Steel Rod", result.getMaterialName());
        }
    }

    @Nested
    @DisplayName("Pagination Tests")
    class PaginationTests {

        @Test
        @DisplayName("Should get materials with pagination")
        void getMaterialsPaged_ReturnsPagedResponse() {
            Page<Material> page = new PageImpl<>(List.of(testMaterial));
            when(materialRepository.findByFilters(anyString(), anyString(), anyString(), any(Pageable.class)))
                    .thenReturn(page);

            PageRequestDTO request = PageRequestDTO.builder()
                    .page(0)
                    .size(20)
                    .search("")
                    .status("ACTIVE")
                    .type("RM")
                    .build();

            PagedResponseDTO<MaterialDTO> result = materialService.getMaterialsPaged(request);

            assertNotNull(result);
            assertEquals(1, result.getContent().size());
            assertEquals(0, result.getPage());
        }
    }

    @Nested
    @DisplayName("Create Material Tests")
    class CreateMaterialTests {

        @Test
        @DisplayName("Should create material successfully")
        void createMaterial_ValidData_CreatesSuccessfully() {
            setupSecurityContext();
            when(materialRepository.existsByMaterialCode("MAT-001")).thenReturn(false);
            when(materialRepository.save(any(Material.class))).thenAnswer(i -> {
                Material m = i.getArgument(0);
                m.setMaterialId(1L);
                return m;
            });

            MaterialDTO result = materialService.createMaterial(testMaterialDTO);

            assertNotNull(result);
            assertEquals("MAT-001", result.getMaterialCode());
            verify(materialRepository).save(any(Material.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception for duplicate material code")
        void createMaterial_DuplicateCode_ThrowsException() {
            setupSecurityContext();
            when(materialRepository.existsByMaterialCode("MAT-001")).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> materialService.createMaterial(testMaterialDTO));

            assertTrue(exception.getMessage().contains("already exists"));
            verify(materialRepository, never()).save(any(Material.class));
        }
    }

    @Nested
    @DisplayName("Update Material Tests")
    class UpdateMaterialTests {

        @Test
        @DisplayName("Should update material successfully")
        void updateMaterial_ValidData_UpdatesSuccessfully() {
            setupSecurityContext();
            when(materialRepository.findById(1L)).thenReturn(Optional.of(testMaterial));
            when(materialRepository.save(any(Material.class))).thenAnswer(i -> i.getArgument(0));

            testMaterialDTO.setMaterialName("Updated Steel Rod");

            MaterialDTO result = materialService.updateMaterial(1L, testMaterialDTO);

            assertNotNull(result);
            assertEquals("Updated Steel Rod", result.getMaterialName());
            verify(materialRepository).save(any(Material.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception when updating non-existent material")
        void updateMaterial_NotFound_ThrowsException() {
            setupSecurityContext();
            when(materialRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> materialService.updateMaterial(999L, testMaterialDTO));

            assertTrue(exception.getMessage().contains("not found"));
        }

        @Test
        @DisplayName("Should throw exception when changing to duplicate code")
        void updateMaterial_DuplicateCode_ThrowsException() {
            setupSecurityContext();
            when(materialRepository.findById(1L)).thenReturn(Optional.of(testMaterial));

            testMaterialDTO.setMaterialCode("MAT-002");
            when(materialRepository.existsByMaterialCode("MAT-002")).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> materialService.updateMaterial(1L, testMaterialDTO));

            assertTrue(exception.getMessage().contains("already exists"));
        }
    }

    @Nested
    @DisplayName("Delete Material Tests")
    class DeleteMaterialTests {

        @Test
        @DisplayName("Should soft delete material successfully")
        void deleteMaterial_ExistingMaterial_SoftDeletes() {
            setupSecurityContext();
            when(materialRepository.findById(1L)).thenReturn(Optional.of(testMaterial));
            when(materialRepository.save(any(Material.class))).thenAnswer(i -> i.getArgument(0));

            materialService.deleteMaterial(1L);

            verify(materialRepository).save(argThat(material ->
                Material.STATUS_INACTIVE.equals(material.getStatus())
            ));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception when deleting non-existent material")
        void deleteMaterial_NotFound_ThrowsException() {
            setupSecurityContext();
            when(materialRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> materialService.deleteMaterial(999L));

            assertTrue(exception.getMessage().contains("not found"));
        }
    }

    @Nested
    @DisplayName("Material Type Tests")
    class MaterialTypeTests {

        @Test
        @DisplayName("Should support raw material type")
        void materialType_RM_IsValid() {
            testMaterial.setMaterialType(Material.TYPE_RM);
            assertEquals("RM", testMaterial.getMaterialType());
        }

        @Test
        @DisplayName("Should support intermediate material type")
        void materialType_IM_IsValid() {
            testMaterial.setMaterialType(Material.TYPE_IM);
            assertEquals("IM", testMaterial.getMaterialType());
        }

        @Test
        @DisplayName("Should support finished goods type")
        void materialType_FG_IsValid() {
            testMaterial.setMaterialType(Material.TYPE_FG);
            assertEquals("FG", testMaterial.getMaterialType());
        }

        @Test
        @DisplayName("Should support work in progress type")
        void materialType_WIP_IsValid() {
            testMaterial.setMaterialType(Material.TYPE_WIP);
            assertEquals("WIP", testMaterial.getMaterialType());
        }
    }
}
