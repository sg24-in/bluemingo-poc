package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.entity.Equipment;
import com.mes.production.entity.Operator;
import com.mes.production.repository.EquipmentRepository;
import com.mes.production.repository.OperatorRepository;
import com.mes.production.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MasterDataControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EquipmentRepository equipmentRepository;

    @MockBean
    private OperatorRepository operatorRepository;

    @MockBean
    private JdbcTemplate jdbcTemplate;

    @MockBean
    private JwtService jwtService;

    private Equipment testEquipment;
    private Operator testOperator;

    @BeforeEach
    void setUp() {
        testEquipment = Equipment.builder()
                .equipmentId(1L)
                .equipmentCode("EQ-001")
                .name("Furnace 1")
                .equipmentType("FURNACE")
                .status("AVAILABLE")
                .location("Plant A")
                .build();

        testOperator = Operator.builder()
                .operatorId(1L)
                .operatorCode("OP-001")
                .name("John Doe")
                .shift("DAY")
                .status("ACTIVE")
                .build();
    }

    @Test
    @DisplayName("Should get all equipment")
    @WithMockUser(username = "admin@mes.com")
    void getAllEquipment_ReturnsEquipment() throws Exception {
        when(equipmentRepository.findAll()).thenReturn(List.of(testEquipment));

        mockMvc.perform(get("/api/master/equipment"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].equipmentId").value(1))
                .andExpect(jsonPath("$[0].equipmentCode").value("EQ-001"))
                .andExpect(jsonPath("$[0].name").value("Furnace 1"));

        verify(equipmentRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should get available equipment")
    @WithMockUser(username = "admin@mes.com")
    void getAvailableEquipment_ReturnsAvailable() throws Exception {
        when(equipmentRepository.findByStatus("AVAILABLE")).thenReturn(List.of(testEquipment));

        mockMvc.perform(get("/api/master/equipment/available"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("AVAILABLE"));

        verify(equipmentRepository, times(1)).findByStatus("AVAILABLE");
    }

    @Test
    @DisplayName("Should get all operators")
    @WithMockUser(username = "admin@mes.com")
    void getAllOperators_ReturnsOperators() throws Exception {
        when(operatorRepository.findAll()).thenReturn(List.of(testOperator));

        mockMvc.perform(get("/api/master/operators"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].operatorId").value(1))
                .andExpect(jsonPath("$[0].operatorCode").value("OP-001"))
                .andExpect(jsonPath("$[0].name").value("John Doe"));

        verify(operatorRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should get active operators")
    @WithMockUser(username = "admin@mes.com")
    void getActiveOperators_ReturnsActive() throws Exception {
        when(operatorRepository.findByStatus("ACTIVE")).thenReturn(List.of(testOperator));

        mockMvc.perform(get("/api/master/operators/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));

        verify(operatorRepository, times(1)).findByStatus("ACTIVE");
    }

    @Test
    @DisplayName("Should get delay reasons")
    @WithMockUser(username = "admin@mes.com")
    void getDelayReasons_ReturnsReasons() throws Exception {
        List<Map<String, Object>> reasons = List.of(
                Map.of("reason_code", "MAINT", "reason_description", "Maintenance"),
                Map.of("reason_code", "BREAK", "reason_description", "Equipment Breakdown")
        );
        when(jdbcTemplate.queryForList(contains("delay_reasons"))).thenReturn(reasons);

        mockMvc.perform(get("/api/master/delay-reasons"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].reason_code").value("MAINT"))
                .andExpect(jsonPath("$[1].reason_code").value("BREAK"));
    }

    @Test
    @DisplayName("Should get hold reasons")
    @WithMockUser(username = "admin@mes.com")
    void getHoldReasons_ReturnsReasons() throws Exception {
        List<Map<String, Object>> reasons = List.of(
                Map.of("reason_code", "QUALITY", "reason_description", "Quality Issue", "applicable_to", "ALL"),
                Map.of("reason_code", "EQUIPMENT", "reason_description", "Equipment Failure", "applicable_to", "OPERATION")
        );
        when(jdbcTemplate.queryForList(contains("hold_reasons"))).thenReturn(reasons);

        mockMvc.perform(get("/api/master/hold-reasons"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].reason_code").value("QUALITY"))
                .andExpect(jsonPath("$[1].reason_code").value("EQUIPMENT"));
    }

    @Test
    @DisplayName("Should get process parameters")
    @WithMockUser(username = "admin@mes.com")
    void getProcessParameters_ReturnsParameters() throws Exception {
        List<Map<String, Object>> params = List.of(
                Map.of(
                        "config_id", 1,
                        "operation_type", "TRANSFORM",
                        "parameter_name", "Temperature",
                        "parameter_type", "NUMERIC",
                        "unit", "°C"
                )
        );
        when(jdbcTemplate.queryForList(contains("process_parameters_config"), any(Object[].class)))
                .thenReturn(params);

        mockMvc.perform(get("/api/master/process-parameters"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].parameter_name").value("Temperature"));
    }

    @Test
    @DisplayName("Should get process parameters with filters")
    @WithMockUser(username = "admin@mes.com")
    void getProcessParameters_WithFilters_ReturnsFiltered() throws Exception {
        List<Map<String, Object>> params = List.of(
                Map.of(
                        "config_id", 1,
                        "operation_type", "TRANSFORM",
                        "product_sku", "STEEL-001",
                        "parameter_name", "Temperature"
                )
        );
        when(jdbcTemplate.queryForList(anyString(), any(Object[].class))).thenReturn(params);

        mockMvc.perform(get("/api/master/process-parameters")
                        .param("operationType", "TRANSFORM")
                        .param("productSku", "STEEL-001"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void getAllEquipment_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/master/equipment"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should return empty list when no equipment")
    @WithMockUser(username = "admin@mes.com")
    void getAllEquipment_NoEquipment_ReturnsEmptyList() throws Exception {
        when(equipmentRepository.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/master/equipment"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }
}
