package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.entity.Equipment;
import com.mes.production.entity.Operator;
import com.mes.production.repository.EquipmentRepository;
import com.mes.production.repository.OperatorRepository;
import com.mes.production.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.mes.production.config.TestSecurityConfig;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
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

    @Nested
    @DisplayName("GET /api/master/equipment Tests")
    class GetAllEquipmentTests {

        @Test
        @DisplayName("should_returnAllEquipment_when_authenticatedUserRequests")
        @WithMockUser(username = "admin@mes.com")
        void should_returnAllEquipment_when_authenticatedUserRequests() throws Exception {
            when(equipmentRepository.findAll()).thenReturn(List.of(testEquipment));

            mockMvc.perform(get("/api/master/equipment"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].equipmentId").value(1))
                    .andExpect(jsonPath("$[0].equipmentCode").value("EQ-001"))
                    .andExpect(jsonPath("$[0].name").value("Furnace 1"))
                    .andExpect(jsonPath("$[0].equipmentType").value("FURNACE"))
                    .andExpect(jsonPath("$[0].status").value("AVAILABLE"))
                    .andExpect(jsonPath("$[0].location").value("Plant A"));

            verify(equipmentRepository, times(1)).findAll();
        }

        @Test
        @DisplayName("should_returnEmptyList_when_noEquipmentExists")
        @WithMockUser(username = "admin@mes.com")
        void should_returnEmptyList_when_noEquipmentExists() throws Exception {
            when(equipmentRepository.findAll()).thenReturn(List.of());

            mockMvc.perform(get("/api/master/equipment"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            mockMvc.perform(get("/api/master/equipment"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should_returnMultipleEquipment_when_multipleExist")
        @WithMockUser(username = "admin@mes.com")
        void should_returnMultipleEquipment_when_multipleExist() throws Exception {
            Equipment eq2 = Equipment.builder()
                    .equipmentId(2L)
                    .equipmentCode("EQ-002")
                    .name("Caster 1")
                    .equipmentType("CASTER")
                    .status("IN_USE")
                    .location("Plant B")
                    .build();

            when(equipmentRepository.findAll()).thenReturn(List.of(testEquipment, eq2));

            mockMvc.perform(get("/api/master/equipment"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].equipmentId").value(1))
                    .andExpect(jsonPath("$[1].equipmentId").value(2))
                    .andExpect(jsonPath("$[1].equipmentType").value("CASTER"));
        }
    }

    @Nested
    @DisplayName("GET /api/master/equipment/available Tests")
    class GetAvailableEquipmentTests {

        @Test
        @DisplayName("should_returnAvailableEquipment_when_availableExists")
        @WithMockUser(username = "admin@mes.com")
        void should_returnAvailableEquipment_when_availableExists() throws Exception {
            when(equipmentRepository.findByStatus("AVAILABLE")).thenReturn(List.of(testEquipment));

            mockMvc.perform(get("/api/master/equipment/available"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].status").value("AVAILABLE"));

            verify(equipmentRepository, times(1)).findByStatus("AVAILABLE");
        }

        @Test
        @DisplayName("should_returnEmptyList_when_noAvailableEquipment")
        @WithMockUser(username = "admin@mes.com")
        void should_returnEmptyList_when_noAvailableEquipment() throws Exception {
            when(equipmentRepository.findByStatus("AVAILABLE")).thenReturn(List.of());

            mockMvc.perform(get("/api/master/equipment/available"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            mockMvc.perform(get("/api/master/equipment/available"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/master/operators Tests")
    class GetAllOperatorsTests {

        @Test
        @DisplayName("should_returnAllOperators_when_authenticatedUserRequests")
        @WithMockUser(username = "admin@mes.com")
        void should_returnAllOperators_when_authenticatedUserRequests() throws Exception {
            when(operatorRepository.findAll()).thenReturn(List.of(testOperator));

            mockMvc.perform(get("/api/master/operators"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].operatorId").value(1))
                    .andExpect(jsonPath("$[0].operatorCode").value("OP-001"))
                    .andExpect(jsonPath("$[0].name").value("John Doe"))
                    .andExpect(jsonPath("$[0].shift").value("DAY"))
                    .andExpect(jsonPath("$[0].status").value("ACTIVE"));

            verify(operatorRepository, times(1)).findAll();
        }

        @Test
        @DisplayName("should_returnEmptyList_when_noOperatorsExist")
        @WithMockUser(username = "admin@mes.com")
        void should_returnEmptyList_when_noOperatorsExist() throws Exception {
            when(operatorRepository.findAll()).thenReturn(List.of());

            mockMvc.perform(get("/api/master/operators"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            mockMvc.perform(get("/api/master/operators"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should_returnMultipleOperators_when_multipleExist")
        @WithMockUser(username = "admin@mes.com")
        void should_returnMultipleOperators_when_multipleExist() throws Exception {
            Operator operator2 = Operator.builder()
                    .operatorId(2L)
                    .operatorCode("OP-002")
                    .name("Jane Smith")
                    .shift("NIGHT")
                    .status("ACTIVE")
                    .build();

            when(operatorRepository.findAll()).thenReturn(List.of(testOperator, operator2));

            mockMvc.perform(get("/api/master/operators"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].name").value("John Doe"))
                    .andExpect(jsonPath("$[1].name").value("Jane Smith"))
                    .andExpect(jsonPath("$[1].shift").value("NIGHT"));
        }
    }

    @Nested
    @DisplayName("GET /api/master/operators/active Tests")
    class GetActiveOperatorsTests {

        @Test
        @DisplayName("should_returnActiveOperators_when_activeExists")
        @WithMockUser(username = "admin@mes.com")
        void should_returnActiveOperators_when_activeExists() throws Exception {
            when(operatorRepository.findByStatus("ACTIVE")).thenReturn(List.of(testOperator));

            mockMvc.perform(get("/api/master/operators/active"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].status").value("ACTIVE"));

            verify(operatorRepository, times(1)).findByStatus("ACTIVE");
        }

        @Test
        @DisplayName("should_returnEmptyList_when_noActiveOperators")
        @WithMockUser(username = "admin@mes.com")
        void should_returnEmptyList_when_noActiveOperators() throws Exception {
            when(operatorRepository.findByStatus("ACTIVE")).thenReturn(List.of());

            mockMvc.perform(get("/api/master/operators/active"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            mockMvc.perform(get("/api/master/operators/active"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/master/delay-reasons Tests")
    class GetDelayReasonsTests {

        @Test
        @DisplayName("should_returnDelayReasons_when_reasonsExist")
        @WithMockUser(username = "admin@mes.com")
        void should_returnDelayReasons_when_reasonsExist() throws Exception {
            List<Map<String, Object>> reasons = List.of(
                    Map.of("reason_code", "MAINT", "reason_description", "Maintenance"),
                    Map.of("reason_code", "BREAK", "reason_description", "Equipment Breakdown")
            );
            when(jdbcTemplate.queryForList(contains("delay_reasons"))).thenReturn(reasons);

            mockMvc.perform(get("/api/master/delay-reasons"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].reason_code").value("MAINT"))
                    .andExpect(jsonPath("$[0].reason_description").value("Maintenance"))
                    .andExpect(jsonPath("$[1].reason_code").value("BREAK"))
                    .andExpect(jsonPath("$[1].reason_description").value("Equipment Breakdown"));
        }

        @Test
        @DisplayName("should_returnEmptyList_when_noDelayReasons")
        @WithMockUser(username = "admin@mes.com")
        void should_returnEmptyList_when_noDelayReasons() throws Exception {
            when(jdbcTemplate.queryForList(contains("delay_reasons"))).thenReturn(List.of());

            mockMvc.perform(get("/api/master/delay-reasons"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            mockMvc.perform(get("/api/master/delay-reasons"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/master/hold-reasons Tests")
    class GetHoldReasonsTests {

        @Test
        @DisplayName("should_returnHoldReasons_when_reasonsExist")
        @WithMockUser(username = "admin@mes.com")
        void should_returnHoldReasons_when_reasonsExist() throws Exception {
            List<Map<String, Object>> reasons = List.of(
                    Map.of("reason_code", "QUALITY", "reason_description", "Quality Issue", "applicable_to", "ALL"),
                    Map.of("reason_code", "EQUIPMENT", "reason_description", "Equipment Failure", "applicable_to", "OPERATION")
            );
            when(jdbcTemplate.queryForList(contains("hold_reasons"))).thenReturn(reasons);

            mockMvc.perform(get("/api/master/hold-reasons"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].reason_code").value("QUALITY"))
                    .andExpect(jsonPath("$[0].reason_description").value("Quality Issue"))
                    .andExpect(jsonPath("$[0].applicable_to").value("ALL"))
                    .andExpect(jsonPath("$[1].reason_code").value("EQUIPMENT"));
        }

        @Test
        @DisplayName("should_returnEmptyList_when_noHoldReasons")
        @WithMockUser(username = "admin@mes.com")
        void should_returnEmptyList_when_noHoldReasons() throws Exception {
            when(jdbcTemplate.queryForList(contains("hold_reasons"))).thenReturn(List.of());

            mockMvc.perform(get("/api/master/hold-reasons"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            mockMvc.perform(get("/api/master/hold-reasons"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/master/process-parameters Tests")
    class GetProcessParametersTests {

        @Test
        @DisplayName("should_returnProcessParameters_when_parametersExist")
        @WithMockUser(username = "admin@mes.com")
        void should_returnProcessParameters_when_parametersExist() throws Exception {
            List<Map<String, Object>> params = List.of(
                    Map.of(
                            "config_id", 1,
                            "operation_type", "TRANSFORM",
                            "parameter_name", "Temperature",
                            "parameter_type", "NUMERIC",
                            "unit", "C"
                    )
            );
            when(jdbcTemplate.queryForList(contains("process_parameters_config"), any(Object[].class)))
                    .thenReturn(params);

            mockMvc.perform(get("/api/master/process-parameters"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].parameter_name").value("Temperature"))
                    .andExpect(jsonPath("$[0].parameter_type").value("NUMERIC"))
                    .andExpect(jsonPath("$[0].unit").value("C"));
        }

        @Test
        @DisplayName("should_filterByOperationType_when_operationTypeProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_filterByOperationType_when_operationTypeProvided() throws Exception {
            List<Map<String, Object>> params = List.of(
                    Map.of(
                            "config_id", 1,
                            "operation_type", "TRANSFORM",
                            "parameter_name", "Temperature"
                    )
            );
            when(jdbcTemplate.queryForList(anyString(), any(Object[].class))).thenReturn(params);

            mockMvc.perform(get("/api/master/process-parameters")
                            .param("operationType", "TRANSFORM"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].operation_type").value("TRANSFORM"));
        }

        @Test
        @DisplayName("should_filterByProductSku_when_productSkuProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_filterByProductSku_when_productSkuProvided() throws Exception {
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
                            .param("productSku", "STEEL-001"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].product_sku").value("STEEL-001"));
        }

        @Test
        @DisplayName("should_filterByBothParams_when_bothProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_filterByBothParams_when_bothProvided() throws Exception {
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
        @DisplayName("should_returnParametersWithMinMax_when_limitsConfigured")
        @WithMockUser(username = "admin@mes.com")
        void should_returnParametersWithMinMax_when_limitsConfigured() throws Exception {
            List<Map<String, Object>> params = List.of(
                    Map.of(
                            "config_id", 1,
                            "parameter_name", "Temperature",
                            "parameter_type", "NUMERIC",
                            "unit", "C",
                            "min_value", new BigDecimal("1000.00"),
                            "max_value", new BigDecimal("1800.00"),
                            "default_value", new BigDecimal("1500.00"),
                            "is_required", true
                    )
            );
            when(jdbcTemplate.queryForList(anyString(), any(Object[].class))).thenReturn(params);

            mockMvc.perform(get("/api/master/process-parameters"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].min_value").value(1000.00))
                    .andExpect(jsonPath("$[0].max_value").value(1800.00))
                    .andExpect(jsonPath("$[0].default_value").value(1500.00))
                    .andExpect(jsonPath("$[0].is_required").value(true));
        }

        @Test
        @DisplayName("should_returnEmptyList_when_noParameters")
        @WithMockUser(username = "admin@mes.com")
        void should_returnEmptyList_when_noParameters() throws Exception {
            when(jdbcTemplate.queryForList(anyString(), any(Object[].class))).thenReturn(List.of());

            mockMvc.perform(get("/api/master/process-parameters"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            mockMvc.perform(get("/api/master/process-parameters"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should_returnMultipleParameters_when_multipleExist")
        @WithMockUser(username = "admin@mes.com")
        void should_returnMultipleParameters_when_multipleExist() throws Exception {
            List<Map<String, Object>> params = List.of(
                    Map.of("config_id", 1, "parameter_name", "Temperature", "display_order", 1),
                    Map.of("config_id", 2, "parameter_name", "Pressure", "display_order", 2),
                    Map.of("config_id", 3, "parameter_name", "Speed", "display_order", 3)
            );
            when(jdbcTemplate.queryForList(anyString(), any(Object[].class))).thenReturn(params);

            mockMvc.perform(get("/api/master/process-parameters"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(3))
                    .andExpect(jsonPath("$[0].parameter_name").value("Temperature"))
                    .andExpect(jsonPath("$[1].parameter_name").value("Pressure"))
                    .andExpect(jsonPath("$[2].parameter_name").value("Speed"));
        }
    }
}
