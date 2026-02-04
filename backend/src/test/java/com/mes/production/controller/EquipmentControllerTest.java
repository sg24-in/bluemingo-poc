package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.EquipmentDTO;
import com.mes.production.security.JwtService;
import com.mes.production.service.EquipmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

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
}
