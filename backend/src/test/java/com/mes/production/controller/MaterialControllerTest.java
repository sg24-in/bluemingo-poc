package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.MaterialDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.security.JwtService;
import com.mes.production.service.MaterialService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.mes.production.config.TestSecurityConfig;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class MaterialControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MaterialService materialService;

    @MockBean
    private JwtService jwtService;

    private MaterialDTO testMaterial;

    @BeforeEach
    void setUp() {
        testMaterial = MaterialDTO.builder()
                .materialId(1L)
                .materialCode("MAT-001")
                .materialName("Steel Rod")
                .description("10mm steel rod")
                .materialType("RM")
                .baseUnit("KG")
                .materialGroup("STEEL")
                .standardCost(new BigDecimal("100.00"))
                .costCurrency("USD")
                .status("ACTIVE")
                .build();
    }

    @Nested
    @DisplayName("Get Materials Tests")
    class GetMaterialsTests {

        @Test
        @DisplayName("Should get all materials")
        @WithMockUser(username = "admin@mes.com")
        void getAllMaterials_ReturnsMaterials() throws Exception {
            when(materialService.getAllMaterials()).thenReturn(List.of(testMaterial));

            mockMvc.perform(get("/api/materials"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].materialId").value(1))
                    .andExpect(jsonPath("$[0].materialCode").value("MAT-001"))
                    .andExpect(jsonPath("$[0].materialName").value("Steel Rod"));

            verify(materialService).getAllMaterials();
        }

        @Test
        @DisplayName("Should get active materials")
        @WithMockUser(username = "admin@mes.com")
        void getActiveMaterials_ReturnsActiveMaterials() throws Exception {
            when(materialService.getActiveMaterials()).thenReturn(List.of(testMaterial));

            mockMvc.perform(get("/api/materials/active"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].status").value("ACTIVE"));

            verify(materialService).getActiveMaterials();
        }

        @Test
        @DisplayName("Should get material by ID")
        @WithMockUser(username = "admin@mes.com")
        void getMaterialById_ValidId_ReturnsMaterial() throws Exception {
            when(materialService.getMaterialById(1L)).thenReturn(testMaterial);

            mockMvc.perform(get("/api/materials/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.materialId").value(1))
                    .andExpect(jsonPath("$.materialCode").value("MAT-001"));

            verify(materialService).getMaterialById(1L);
        }

        @Test
        @DisplayName("Should return bad request for non-existent material")
        @WithMockUser(username = "admin@mes.com")
        void getMaterialById_NotFound_ReturnsBadRequest() throws Exception {
            when(materialService.getMaterialById(999L))
                    .thenThrow(new RuntimeException("Material not found"));

            mockMvc.perform(get("/api/materials/999"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should get materials with pagination")
        @WithMockUser(username = "admin@mes.com")
        void getMaterialsPaged_ReturnsPagedResponse() throws Exception {
            PagedResponseDTO<MaterialDTO> pagedResponse = PagedResponseDTO.<MaterialDTO>builder()
                    .content(List.of(testMaterial))
                    .page(0)
                    .size(20)
                    .totalElements(1)
                    .totalPages(1)
                    .first(true)
                    .last(true)
                    .hasNext(false)
                    .hasPrevious(false)
                    .build();

            when(materialService.getMaterialsPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/materials/paged")
                            .param("page", "0")
                            .param("size", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].materialCode").value("MAT-001"))
                    .andExpect(jsonPath("$.totalElements").value(1));

            verify(materialService).getMaterialsPaged(any(PageRequestDTO.class));
        }

        @Test
        @DisplayName("Should get materials by type")
        @WithMockUser(username = "admin@mes.com")
        void getMaterialsByType_ReturnsFilteredMaterials() throws Exception {
            when(materialService.getActiveMaterialsByType("RM")).thenReturn(List.of(testMaterial));

            mockMvc.perform(get("/api/materials/type/RM"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].materialType").value("RM"));

            verify(materialService).getActiveMaterialsByType("RM");
        }

        @Test
        @DisplayName("Should get consumable materials")
        @WithMockUser(username = "admin@mes.com")
        void getConsumableMaterials_ReturnsMaterials() throws Exception {
            when(materialService.getConsumableMaterials()).thenReturn(List.of(testMaterial));

            mockMvc.perform(get("/api/materials/consumable"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].materialCode").value("MAT-001"));

            verify(materialService).getConsumableMaterials();
        }
    }

    @Nested
    @DisplayName("Create Material Tests")
    class CreateMaterialTests {

        @Test
        @DisplayName("Should create material successfully")
        @WithMockUser(username = "admin@mes.com")
        void createMaterial_ValidData_ReturnsCreated() throws Exception {
            MaterialDTO createRequest = MaterialDTO.builder()
                    .materialCode("MAT-002")
                    .materialName("Copper Wire")
                    .materialType("RM")
                    .baseUnit("KG")
                    .build();

            when(materialService.createMaterial(any(MaterialDTO.class))).thenReturn(testMaterial);

            mockMvc.perform(post("/api/materials")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.materialId").value(1));

            verify(materialService).createMaterial(any(MaterialDTO.class));
        }

        @Test
        @DisplayName("Should return bad request for invalid data")
        @WithMockUser(username = "admin@mes.com")
        void createMaterial_InvalidData_ReturnsBadRequest() throws Exception {
            MaterialDTO invalidRequest = MaterialDTO.builder()
                    .materialCode("")  // Invalid - blank
                    .materialName("")  // Invalid - blank
                    .build();

            mockMvc.perform(post("/api/materials")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalidRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return bad request for duplicate code")
        @WithMockUser(username = "admin@mes.com")
        void createMaterial_DuplicateCode_ReturnsBadRequest() throws Exception {
            MaterialDTO createRequest = MaterialDTO.builder()
                    .materialCode("MAT-001")
                    .materialName("Duplicate Material")
                    .materialType("RM")
                    .baseUnit("KG")
                    .build();

            when(materialService.createMaterial(any(MaterialDTO.class)))
                    .thenThrow(new RuntimeException("Material code already exists"));

            mockMvc.perform(post("/api/materials")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Update Material Tests")
    class UpdateMaterialTests {

        @Test
        @DisplayName("Should update material successfully")
        @WithMockUser(username = "admin@mes.com")
        void updateMaterial_ValidData_ReturnsOk() throws Exception {
            MaterialDTO updateRequest = MaterialDTO.builder()
                    .materialCode("MAT-001")
                    .materialName("Updated Steel Rod")
                    .materialType("RM")
                    .baseUnit("KG")
                    .build();

            MaterialDTO updatedMaterial = MaterialDTO.builder()
                    .materialId(1L)
                    .materialCode("MAT-001")
                    .materialName("Updated Steel Rod")
                    .materialType("RM")
                    .baseUnit("KG")
                    .status("ACTIVE")
                    .build();

            when(materialService.updateMaterial(eq(1L), any(MaterialDTO.class))).thenReturn(updatedMaterial);

            mockMvc.perform(put("/api/materials/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.materialName").value("Updated Steel Rod"));

            verify(materialService).updateMaterial(eq(1L), any(MaterialDTO.class));
        }

        @Test
        @DisplayName("Should return bad request for non-existent material")
        @WithMockUser(username = "admin@mes.com")
        void updateMaterial_NotFound_ReturnsBadRequest() throws Exception {
            MaterialDTO updateRequest = MaterialDTO.builder()
                    .materialCode("MAT-001")
                    .materialName("Updated Material")
                    .materialType("RM")
                    .baseUnit("KG")
                    .build();

            when(materialService.updateMaterial(eq(999L), any(MaterialDTO.class)))
                    .thenThrow(new RuntimeException("Material not found"));

            mockMvc.perform(put("/api/materials/999")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Delete Material Tests")
    class DeleteMaterialTests {

        @Test
        @DisplayName("Should delete material successfully")
        @WithMockUser(username = "admin@mes.com")
        void deleteMaterial_ValidId_ReturnsNoContent() throws Exception {
            doNothing().when(materialService).deleteMaterial(1L);

            mockMvc.perform(delete("/api/materials/1"))
                    .andExpect(status().isNoContent());

            verify(materialService).deleteMaterial(1L);
        }

        @Test
        @DisplayName("Should return bad request for non-existent material")
        @WithMockUser(username = "admin@mes.com")
        void deleteMaterial_NotFound_ReturnsBadRequest() throws Exception {
            doThrow(new RuntimeException("Material not found"))
                    .when(materialService).deleteMaterial(999L);

            mockMvc.perform(delete("/api/materials/999"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void getMaterials_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/materials"))
                .andExpect(status().isUnauthorized());
    }
}
