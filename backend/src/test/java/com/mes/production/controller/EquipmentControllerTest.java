package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.EquipmentDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.security.JwtService;
import com.mes.production.service.EquipmentService;
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
import java.time.LocalDateTime;
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
class EquipmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EquipmentService equipmentService;

    @MockBean
    private JwtService jwtService;

    private EquipmentDTO testEquipment;

    @BeforeEach
    void setUp() {
        testEquipment = EquipmentDTO.builder()
                .equipmentId(1L)
                .equipmentCode("EQ-001")
                .name("Furnace 1")
                .equipmentType("FURNACE")
                .capacity(new BigDecimal("100.00"))
                .capacityUnit("T")
                .location("Plant A")
                .status("AVAILABLE")
                .build();
    }

    @Test
    @DisplayName("Should get all equipment")
    @WithMockUser(username = "admin@mes.com")
    void getAllEquipment_ReturnsEquipment() throws Exception {
        when(equipmentService.getAllEquipment()).thenReturn(List.of(testEquipment));

        mockMvc.perform(get("/api/equipment"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].equipmentId").value(1))
                .andExpect(jsonPath("$[0].equipmentCode").value("EQ-001"))
                .andExpect(jsonPath("$[0].status").value("AVAILABLE"));

        verify(equipmentService, times(1)).getAllEquipment();
    }

    @Test
    @DisplayName("Should get equipment by ID")
    @WithMockUser(username = "admin@mes.com")
    void getEquipmentById_ReturnsEquipment() throws Exception {
        when(equipmentService.getEquipmentById(1L)).thenReturn(testEquipment);

        mockMvc.perform(get("/api/equipment/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.equipmentId").value(1))
                .andExpect(jsonPath("$.equipmentCode").value("EQ-001"));

        verify(equipmentService, times(1)).getEquipmentById(1L);
    }

    @Test
    @DisplayName("Should get equipment by status")
    @WithMockUser(username = "admin@mes.com")
    void getEquipmentByStatus_ReturnsFiltered() throws Exception {
        when(equipmentService.getEquipmentByStatus("AVAILABLE")).thenReturn(List.of(testEquipment));

        mockMvc.perform(get("/api/equipment/status/AVAILABLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("AVAILABLE"));

        verify(equipmentService, times(1)).getEquipmentByStatus("AVAILABLE");
    }

    @Test
    @DisplayName("Should get maintenance equipment")
    @WithMockUser(username = "admin@mes.com")
    void getMaintenanceEquipment_ReturnsMaintenanceOnly() throws Exception {
        EquipmentDTO maintenanceEquipment = EquipmentDTO.builder()
                .equipmentId(2L)
                .equipmentCode("EQ-002")
                .status("MAINTENANCE")
                .maintenanceReason("Scheduled maintenance")
                .build();
        when(equipmentService.getMaintenanceEquipment()).thenReturn(List.of(maintenanceEquipment));

        mockMvc.perform(get("/api/equipment/maintenance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("MAINTENANCE"))
                .andExpect(jsonPath("$[0].maintenanceReason").value("Scheduled maintenance"));

        verify(equipmentService, times(1)).getMaintenanceEquipment();
    }

    @Test
    @DisplayName("Should get on-hold equipment")
    @WithMockUser(username = "admin@mes.com")
    void getOnHoldEquipment_ReturnsOnHoldOnly() throws Exception {
        EquipmentDTO onHoldEquipment = EquipmentDTO.builder()
                .equipmentId(3L)
                .equipmentCode("EQ-003")
                .status("ON_HOLD")
                .holdReason("Pending inspection")
                .build();
        when(equipmentService.getOnHoldEquipment()).thenReturn(List.of(onHoldEquipment));

        mockMvc.perform(get("/api/equipment/on-hold"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("ON_HOLD"))
                .andExpect(jsonPath("$[0].holdReason").value("Pending inspection"));

        verify(equipmentService, times(1)).getOnHoldEquipment();
    }

    @Test
    @DisplayName("Should start maintenance")
    @WithMockUser(username = "admin@mes.com")
    void startMaintenance_ValidRequest_StartsSuccessfully() throws Exception {
        EquipmentDTO.StatusUpdateResponse response = EquipmentDTO.StatusUpdateResponse.builder()
                .equipmentId(1L)
                .equipmentCode("EQ-001")
                .previousStatus("AVAILABLE")
                .newStatus("MAINTENANCE")
                .message("Equipment maintenance started")
                .updatedBy("admin@mes.com")
                .updatedOn(LocalDateTime.now())
                .build();
        when(equipmentService.startMaintenance(eq(1L), eq("Scheduled maintenance"), any())).thenReturn(response);

        EquipmentDTO.MaintenanceRequest request = EquipmentDTO.MaintenanceRequest.builder()
                .equipmentId(1L)
                .reason("Scheduled maintenance")
                .expectedEndTime(LocalDateTime.now().plusDays(1))
                .build();

        mockMvc.perform(post("/api/equipment/1/maintenance/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.equipmentId").value(1))
                .andExpect(jsonPath("$.previousStatus").value("AVAILABLE"))
                .andExpect(jsonPath("$.newStatus").value("MAINTENANCE"));

        verify(equipmentService, times(1)).startMaintenance(eq(1L), eq("Scheduled maintenance"), any());
    }

    @Test
    @DisplayName("Should end maintenance")
    @WithMockUser(username = "admin@mes.com")
    void endMaintenance_ValidRequest_EndsSuccessfully() throws Exception {
        EquipmentDTO.StatusUpdateResponse response = EquipmentDTO.StatusUpdateResponse.builder()
                .equipmentId(1L)
                .equipmentCode("EQ-001")
                .previousStatus("MAINTENANCE")
                .newStatus("AVAILABLE")
                .message("Equipment maintenance completed")
                .updatedBy("admin@mes.com")
                .updatedOn(LocalDateTime.now())
                .build();
        when(equipmentService.endMaintenance(1L)).thenReturn(response);

        mockMvc.perform(post("/api/equipment/1/maintenance/end")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.previousStatus").value("MAINTENANCE"))
                .andExpect(jsonPath("$.newStatus").value("AVAILABLE"));

        verify(equipmentService, times(1)).endMaintenance(1L);
    }

    @Test
    @DisplayName("Should put equipment on hold")
    @WithMockUser(username = "admin@mes.com")
    void putOnHold_ValidRequest_HoldsSuccessfully() throws Exception {
        EquipmentDTO.StatusUpdateResponse response = EquipmentDTO.StatusUpdateResponse.builder()
                .equipmentId(1L)
                .equipmentCode("EQ-001")
                .previousStatus("AVAILABLE")
                .newStatus("ON_HOLD")
                .message("Equipment put on hold")
                .updatedBy("admin@mes.com")
                .updatedOn(LocalDateTime.now())
                .build();
        when(equipmentService.putOnHold(eq(1L), eq("Pending inspection"))).thenReturn(response);

        EquipmentDTO.HoldRequest request = EquipmentDTO.HoldRequest.builder()
                .equipmentId(1L)
                .reason("Pending inspection")
                .build();

        mockMvc.perform(post("/api/equipment/1/hold")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.previousStatus").value("AVAILABLE"))
                .andExpect(jsonPath("$.newStatus").value("ON_HOLD"));

        verify(equipmentService, times(1)).putOnHold(1L, "Pending inspection");
    }

    @Test
    @DisplayName("Should release equipment from hold")
    @WithMockUser(username = "admin@mes.com")
    void releaseFromHold_ValidRequest_ReleasesSuccessfully() throws Exception {
        EquipmentDTO.StatusUpdateResponse response = EquipmentDTO.StatusUpdateResponse.builder()
                .equipmentId(1L)
                .equipmentCode("EQ-001")
                .previousStatus("ON_HOLD")
                .newStatus("AVAILABLE")
                .message("Equipment released from hold")
                .updatedBy("admin@mes.com")
                .updatedOn(LocalDateTime.now())
                .build();
        when(equipmentService.releaseFromHold(1L)).thenReturn(response);

        mockMvc.perform(post("/api/equipment/1/release")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.previousStatus").value("ON_HOLD"))
                .andExpect(jsonPath("$.newStatus").value("AVAILABLE"));

        verify(equipmentService, times(1)).releaseFromHold(1L);
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void getAllEquipment_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/equipment"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should get paginated equipment")
    @WithMockUser(username = "admin@mes.com")
    void getEquipmentPaged_ReturnsPagedResult() throws Exception {
        PagedResponseDTO<EquipmentDTO> pagedResponse = PagedResponseDTO.<EquipmentDTO>builder()
                .content(List.of(testEquipment))
                .page(0)
                .size(20)
                .totalElements(1)
                .totalPages(1)
                .hasNext(false)
                .hasPrevious(false)
                .build();

        when(equipmentService.getEquipmentPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

        mockMvc.perform(get("/api/equipment/paged")
                        .param("page", "0")
                        .param("size", "20")
                        .param("sortBy", "equipmentCode")
                        .param("sortDirection", "ASC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].equipmentId").value(1))
                .andExpect(jsonPath("$.content[0].equipmentCode").value("EQ-001"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.page").value(0));

        verify(equipmentService, times(1)).getEquipmentPaged(any(PageRequestDTO.class));
    }

    @Test
    @DisplayName("Should get paginated equipment with status filter")
    @WithMockUser(username = "admin@mes.com")
    void getEquipmentPaged_WithStatusFilter_ReturnsFiltered() throws Exception {
        PagedResponseDTO<EquipmentDTO> pagedResponse = PagedResponseDTO.<EquipmentDTO>builder()
                .content(List.of(testEquipment))
                .page(0)
                .size(20)
                .totalElements(1)
                .totalPages(1)
                .hasNext(false)
                .hasPrevious(false)
                .build();

        when(equipmentService.getEquipmentPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

        mockMvc.perform(get("/api/equipment/paged")
                        .param("page", "0")
                        .param("size", "20")
                        .param("status", "AVAILABLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("AVAILABLE"));

        verify(equipmentService, times(1)).getEquipmentPaged(any(PageRequestDTO.class));
    }

    @Test
    @DisplayName("Should get paginated equipment with type filter")
    @WithMockUser(username = "admin@mes.com")
    void getEquipmentPaged_WithTypeFilter_ReturnsFiltered() throws Exception {
        PagedResponseDTO<EquipmentDTO> pagedResponse = PagedResponseDTO.<EquipmentDTO>builder()
                .content(List.of(testEquipment))
                .page(0)
                .size(20)
                .totalElements(1)
                .totalPages(1)
                .hasNext(false)
                .hasPrevious(false)
                .build();

        when(equipmentService.getEquipmentPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

        mockMvc.perform(get("/api/equipment/paged")
                        .param("page", "0")
                        .param("size", "20")
                        .param("type", "FURNACE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].equipmentType").value("FURNACE"));

        verify(equipmentService, times(1)).getEquipmentPaged(any(PageRequestDTO.class));
    }

    @Test
    @DisplayName("Should get paginated equipment with search")
    @WithMockUser(username = "admin@mes.com")
    void getEquipmentPaged_WithSearch_ReturnsFiltered() throws Exception {
        PagedResponseDTO<EquipmentDTO> pagedResponse = PagedResponseDTO.<EquipmentDTO>builder()
                .content(List.of(testEquipment))
                .page(0)
                .size(20)
                .totalElements(1)
                .totalPages(1)
                .hasNext(false)
                .hasPrevious(false)
                .build();

        when(equipmentService.getEquipmentPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

        mockMvc.perform(get("/api/equipment/paged")
                        .param("page", "0")
                        .param("size", "20")
                        .param("search", "Furnace"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Furnace 1"));

        verify(equipmentService, times(1)).getEquipmentPaged(any(PageRequestDTO.class));
    }

    @Nested
    @DisplayName("Create Equipment Tests")
    class CreateEquipmentTests {

        @Test
        @DisplayName("Should create equipment successfully")
        @WithMockUser(username = "admin@mes.com")
        void createEquipment_ValidData_ReturnsCreated() throws Exception {
            EquipmentDTO.CreateEquipmentRequest request = EquipmentDTO.CreateEquipmentRequest.builder()
                    .equipmentCode("EQ-002")
                    .name("Caster 1")
                    .equipmentType("CASTER")
                    .capacity(new BigDecimal("50.00"))
                    .capacityUnit("T")
                    .location("Plant B")
                    .build();

            when(equipmentService.createEquipment(any(EquipmentDTO.CreateEquipmentRequest.class))).thenReturn(testEquipment);

            mockMvc.perform(post("/api/equipment")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.equipmentId").value(1));

            verify(equipmentService).createEquipment(any(EquipmentDTO.CreateEquipmentRequest.class));
        }

        @Test
        @DisplayName("Should return bad request for invalid data")
        @WithMockUser(username = "admin@mes.com")
        void createEquipment_InvalidData_ReturnsBadRequest() throws Exception {
            EquipmentDTO.CreateEquipmentRequest request = EquipmentDTO.CreateEquipmentRequest.builder()
                    .equipmentCode("")  // Invalid - blank
                    .name("")           // Invalid - blank
                    .equipmentType("")  // Invalid - blank
                    .build();

            mockMvc.perform(post("/api/equipment")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return bad request for duplicate code")
        @WithMockUser(username = "admin@mes.com")
        void createEquipment_DuplicateCode_ReturnsBadRequest() throws Exception {
            EquipmentDTO.CreateEquipmentRequest request = EquipmentDTO.CreateEquipmentRequest.builder()
                    .equipmentCode("EQ-001")
                    .name("Duplicate")
                    .equipmentType("FURNACE")
                    .build();

            when(equipmentService.createEquipment(any(EquipmentDTO.CreateEquipmentRequest.class)))
                    .thenThrow(new RuntimeException("Equipment code already exists"));

            mockMvc.perform(post("/api/equipment")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Update Equipment Tests")
    class UpdateEquipmentTests {

        @Test
        @DisplayName("Should update equipment successfully")
        @WithMockUser(username = "admin@mes.com")
        void updateEquipment_ValidData_ReturnsOk() throws Exception {
            EquipmentDTO.UpdateEquipmentRequest request = EquipmentDTO.UpdateEquipmentRequest.builder()
                    .equipmentCode("EQ-001")
                    .name("Furnace 1 Updated")
                    .equipmentType("FURNACE")
                    .build();

            EquipmentDTO updatedEquipment = EquipmentDTO.builder()
                    .equipmentId(1L)
                    .equipmentCode("EQ-001")
                    .name("Furnace 1 Updated")
                    .equipmentType("FURNACE")
                    .status("AVAILABLE")
                    .build();

            when(equipmentService.updateEquipment(eq(1L), any(EquipmentDTO.UpdateEquipmentRequest.class)))
                    .thenReturn(updatedEquipment);

            mockMvc.perform(put("/api/equipment/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Furnace 1 Updated"));

            verify(equipmentService).updateEquipment(eq(1L), any(EquipmentDTO.UpdateEquipmentRequest.class));
        }

        @Test
        @DisplayName("Should return bad request for non-existent equipment")
        @WithMockUser(username = "admin@mes.com")
        void updateEquipment_NotFound_ReturnsBadRequest() throws Exception {
            EquipmentDTO.UpdateEquipmentRequest request = EquipmentDTO.UpdateEquipmentRequest.builder()
                    .equipmentCode("EQ-999")
                    .name("Not Found")
                    .equipmentType("FURNACE")
                    .build();

            when(equipmentService.updateEquipment(eq(999L), any(EquipmentDTO.UpdateEquipmentRequest.class)))
                    .thenThrow(new RuntimeException("Equipment not found"));

            mockMvc.perform(put("/api/equipment/999")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Delete Equipment Tests")
    class DeleteEquipmentTests {

        @Test
        @DisplayName("Should delete equipment successfully")
        @WithMockUser(username = "admin@mes.com")
        void deleteEquipment_ValidId_ReturnsOk() throws Exception {
            doNothing().when(equipmentService).deleteEquipment(1L);

            mockMvc.perform(delete("/api/equipment/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Equipment deleted successfully"));

            verify(equipmentService).deleteEquipment(1L);
        }

        @Test
        @DisplayName("Should return bad request for equipment in use")
        @WithMockUser(username = "admin@mes.com")
        void deleteEquipment_InUse_ReturnsBadRequest() throws Exception {
            doThrow(new RuntimeException("Cannot delete equipment that is currently in use"))
                    .when(equipmentService).deleteEquipment(1L);

            mockMvc.perform(delete("/api/equipment/1"))
                    .andExpect(status().isBadRequest());
        }
    }
}
