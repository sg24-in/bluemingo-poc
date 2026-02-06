package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.config.TestSecurityConfig;
import com.mes.production.dto.*;
import com.mes.production.security.JwtService;
import com.mes.production.service.BatchNumberConfigService;
import com.mes.production.service.DelayReasonService;
import com.mes.production.service.HoldReasonService;
import com.mes.production.service.ProcessParametersConfigService;
import com.mes.production.service.QuantityTypeConfigService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

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
class ConfigControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private HoldReasonService holdReasonService;

    @MockBean
    private DelayReasonService delayReasonService;

    @MockBean
    private ProcessParametersConfigService processParametersConfigService;

    @MockBean
    private BatchNumberConfigService batchNumberConfigService;

    @MockBean
    private QuantityTypeConfigService quantityTypeConfigService;

    @MockBean
    private JwtService jwtService;

    private HoldReasonDTO testHoldReason;
    private DelayReasonDTO testDelayReason;

    @BeforeEach
    void setUp() {
        testHoldReason = HoldReasonDTO.builder()
                .reasonId(1L)
                .reasonCode("QUALITY_HOLD")
                .reasonDescription("Quality inspection required")
                .applicableTo("BATCH,INVENTORY")
                .status("ACTIVE")
                .build();

        testDelayReason = DelayReasonDTO.builder()
                .reasonId(1L)
                .reasonCode("MATERIAL_SHORTAGE")
                .reasonDescription("Material shortage delay")
                .status("ACTIVE")
                .build();
    }

    // ===== Hold Reasons Tests =====

    @Nested
    @DisplayName("Hold Reasons - GET Tests")
    class HoldReasonsGetTests {

        @Test
        @DisplayName("Should get all hold reasons")
        @WithMockUser(username = "admin@mes.com")
        void getAllHoldReasons_ReturnsReasons() throws Exception {
            when(holdReasonService.getAllHoldReasons()).thenReturn(List.of(testHoldReason));

            mockMvc.perform(get("/api/config/hold-reasons"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].reasonId").value(1))
                    .andExpect(jsonPath("$[0].reasonCode").value("QUALITY_HOLD"))
                    .andExpect(jsonPath("$[0].reasonDescription").value("Quality inspection required"));

            verify(holdReasonService).getAllHoldReasons();
        }

        @Test
        @DisplayName("Should get active hold reasons")
        @WithMockUser(username = "admin@mes.com")
        void getActiveHoldReasons_ReturnsActive() throws Exception {
            when(holdReasonService.getActiveHoldReasons()).thenReturn(List.of(testHoldReason));

            mockMvc.perform(get("/api/config/hold-reasons/active"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].status").value("ACTIVE"));

            verify(holdReasonService).getActiveHoldReasons();
        }

        @Test
        @DisplayName("Should get active hold reasons by applicable to")
        @WithMockUser(username = "admin@mes.com")
        void getActiveHoldReasons_WithApplicableTo_ReturnsFiltered() throws Exception {
            when(holdReasonService.getActiveByApplicableTo("BATCH")).thenReturn(List.of(testHoldReason));

            mockMvc.perform(get("/api/config/hold-reasons/active")
                            .param("applicableTo", "BATCH"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].applicableTo").value("BATCH,INVENTORY"));

            verify(holdReasonService).getActiveByApplicableTo("BATCH");
        }

        @Test
        @DisplayName("Should get hold reason by ID")
        @WithMockUser(username = "admin@mes.com")
        void getHoldReasonById_ValidId_ReturnsReason() throws Exception {
            when(holdReasonService.getHoldReasonById(1L)).thenReturn(testHoldReason);

            mockMvc.perform(get("/api/config/hold-reasons/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.reasonCode").value("QUALITY_HOLD"));

            verify(holdReasonService).getHoldReasonById(1L);
        }

        @Test
        @DisplayName("Should get hold reasons with pagination")
        @WithMockUser(username = "admin@mes.com")
        void getHoldReasonsPaged_ReturnsPagedResponse() throws Exception {
            PagedResponseDTO<HoldReasonDTO> pagedResponse = PagedResponseDTO.<HoldReasonDTO>builder()
                    .content(List.of(testHoldReason))
                    .page(0).size(20).totalElements(1).totalPages(1)
                    .first(true).last(true).build();

            when(holdReasonService.getHoldReasonsPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/config/hold-reasons/paged")
                            .param("page", "0").param("size", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].reasonCode").value("QUALITY_HOLD"))
                    .andExpect(jsonPath("$.totalElements").value(1));
        }
    }

    @Nested
    @DisplayName("Hold Reasons - Create Tests")
    class HoldReasonsCreateTests {

        @Test
        @DisplayName("Should create hold reason successfully")
        @WithMockUser(username = "admin@mes.com")
        void createHoldReason_ValidData_ReturnsCreated() throws Exception {
            HoldReasonDTO createRequest = HoldReasonDTO.builder()
                    .reasonCode("NEW_HOLD")
                    .reasonDescription("New hold reason")
                    .applicableTo("ORDER")
                    .build();

            when(holdReasonService.createHoldReason(any(HoldReasonDTO.class))).thenReturn(testHoldReason);

            mockMvc.perform(post("/api/config/hold-reasons")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.reasonId").value(1));

            verify(holdReasonService).createHoldReason(any(HoldReasonDTO.class));
        }

        @Test
        @DisplayName("Should return bad request for invalid data")
        @WithMockUser(username = "admin@mes.com")
        void createHoldReason_InvalidData_ReturnsBadRequest() throws Exception {
            HoldReasonDTO invalidRequest = HoldReasonDTO.builder()
                    .reasonCode("")
                    .reasonDescription("")
                    .build();

            mockMvc.perform(post("/api/config/hold-reasons")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalidRequest)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Hold Reasons - Update Tests")
    class HoldReasonsUpdateTests {

        @Test
        @DisplayName("Should update hold reason successfully")
        @WithMockUser(username = "admin@mes.com")
        void updateHoldReason_ValidData_ReturnsOk() throws Exception {
            HoldReasonDTO updateRequest = HoldReasonDTO.builder()
                    .reasonCode("QUALITY_HOLD")
                    .reasonDescription("Updated description")
                    .applicableTo("BATCH")
                    .build();

            when(holdReasonService.updateHoldReason(eq(1L), any(HoldReasonDTO.class))).thenReturn(testHoldReason);

            mockMvc.perform(put("/api/config/hold-reasons/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isOk());

            verify(holdReasonService).updateHoldReason(eq(1L), any(HoldReasonDTO.class));
        }
    }

    @Nested
    @DisplayName("Hold Reasons - Delete Tests")
    class HoldReasonsDeleteTests {

        @Test
        @DisplayName("Should delete hold reason successfully")
        @WithMockUser(username = "admin@mes.com")
        void deleteHoldReason_ValidId_ReturnsOk() throws Exception {
            doNothing().when(holdReasonService).deleteHoldReason(1L);

            mockMvc.perform(delete("/api/config/hold-reasons/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Hold reason deleted successfully"));

            verify(holdReasonService).deleteHoldReason(1L);
        }

        @Test
        @DisplayName("Should return bad request for non-existent hold reason")
        @WithMockUser(username = "admin@mes.com")
        void deleteHoldReason_NotFound_ReturnsBadRequest() throws Exception {
            doThrow(new RuntimeException("Hold reason not found"))
                    .when(holdReasonService).deleteHoldReason(999L);

            mockMvc.perform(delete("/api/config/hold-reasons/999"))
                    .andExpect(status().isBadRequest());
        }
    }

    // ===== Delay Reasons Tests =====

    @Nested
    @DisplayName("Delay Reasons - GET Tests")
    class DelayReasonsGetTests {

        @Test
        @DisplayName("Should get all delay reasons")
        @WithMockUser(username = "admin@mes.com")
        void getAllDelayReasons_ReturnsReasons() throws Exception {
            when(delayReasonService.getAllDelayReasons()).thenReturn(List.of(testDelayReason));

            mockMvc.perform(get("/api/config/delay-reasons"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].reasonCode").value("MATERIAL_SHORTAGE"));

            verify(delayReasonService).getAllDelayReasons();
        }

        @Test
        @DisplayName("Should get active delay reasons")
        @WithMockUser(username = "admin@mes.com")
        void getActiveDelayReasons_ReturnsActive() throws Exception {
            when(delayReasonService.getActiveDelayReasons()).thenReturn(List.of(testDelayReason));

            mockMvc.perform(get("/api/config/delay-reasons/active"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].status").value("ACTIVE"));
        }

        @Test
        @DisplayName("Should get delay reason by ID")
        @WithMockUser(username = "admin@mes.com")
        void getDelayReasonById_ValidId_ReturnsReason() throws Exception {
            when(delayReasonService.getDelayReasonById(1L)).thenReturn(testDelayReason);

            mockMvc.perform(get("/api/config/delay-reasons/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.reasonCode").value("MATERIAL_SHORTAGE"));
        }

        @Test
        @DisplayName("Should get delay reasons with pagination")
        @WithMockUser(username = "admin@mes.com")
        void getDelayReasonsPaged_ReturnsPagedResponse() throws Exception {
            PagedResponseDTO<DelayReasonDTO> pagedResponse = PagedResponseDTO.<DelayReasonDTO>builder()
                    .content(List.of(testDelayReason))
                    .page(0).size(20).totalElements(1).totalPages(1)
                    .first(true).last(true).build();

            when(delayReasonService.getDelayReasonsPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/config/delay-reasons/paged")
                            .param("page", "0").param("size", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].reasonCode").value("MATERIAL_SHORTAGE"));
        }
    }

    @Nested
    @DisplayName("Delay Reasons - Create Tests")
    class DelayReasonsCreateTests {

        @Test
        @DisplayName("Should create delay reason successfully")
        @WithMockUser(username = "admin@mes.com")
        void createDelayReason_ValidData_ReturnsCreated() throws Exception {
            DelayReasonDTO createRequest = DelayReasonDTO.builder()
                    .reasonCode("NEW_DELAY")
                    .reasonDescription("New delay reason")
                    .build();

            when(delayReasonService.createDelayReason(any(DelayReasonDTO.class))).thenReturn(testDelayReason);

            mockMvc.perform(post("/api/config/delay-reasons")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.reasonId").value(1));

            verify(delayReasonService).createDelayReason(any(DelayReasonDTO.class));
        }

        @Test
        @DisplayName("Should return bad request for invalid data")
        @WithMockUser(username = "admin@mes.com")
        void createDelayReason_InvalidData_ReturnsBadRequest() throws Exception {
            DelayReasonDTO invalidRequest = DelayReasonDTO.builder()
                    .reasonCode("")
                    .reasonDescription("")
                    .build();

            mockMvc.perform(post("/api/config/delay-reasons")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalidRequest)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Delay Reasons - Update Tests")
    class DelayReasonsUpdateTests {

        @Test
        @DisplayName("Should update delay reason successfully")
        @WithMockUser(username = "admin@mes.com")
        void updateDelayReason_ValidData_ReturnsOk() throws Exception {
            DelayReasonDTO updateRequest = DelayReasonDTO.builder()
                    .reasonCode("MATERIAL_SHORTAGE")
                    .reasonDescription("Updated description")
                    .build();

            when(delayReasonService.updateDelayReason(eq(1L), any(DelayReasonDTO.class))).thenReturn(testDelayReason);

            mockMvc.perform(put("/api/config/delay-reasons/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isOk());

            verify(delayReasonService).updateDelayReason(eq(1L), any(DelayReasonDTO.class));
        }
    }

    @Nested
    @DisplayName("Delay Reasons - Delete Tests")
    class DelayReasonsDeleteTests {

        @Test
        @DisplayName("Should delete delay reason successfully")
        @WithMockUser(username = "admin@mes.com")
        void deleteDelayReason_ValidId_ReturnsOk() throws Exception {
            doNothing().when(delayReasonService).deleteDelayReason(1L);

            mockMvc.perform(delete("/api/config/delay-reasons/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Delay reason deleted successfully"));
        }

        @Test
        @DisplayName("Should return bad request for non-existent delay reason")
        @WithMockUser(username = "admin@mes.com")
        void deleteDelayReason_NotFound_ReturnsBadRequest() throws Exception {
            doThrow(new RuntimeException("Delay reason not found"))
                    .when(delayReasonService).deleteDelayReason(999L);

            mockMvc.perform(delete("/api/config/delay-reasons/999"))
                    .andExpect(status().isBadRequest());
        }
    }

    // ===== Process Parameters Config Tests =====

    @Nested
    @DisplayName("Process Parameters Config Tests")
    class ProcessParametersConfigTests {

        @Test
        @DisplayName("Should get all process parameter configs")
        @WithMockUser(username = "admin@mes.com")
        void getAllProcessParams_ReturnsConfigs() throws Exception {
            ProcessParametersConfigDTO config = ProcessParametersConfigDTO.builder()
                    .configId(1L).operationType("ROLLING").parameterName("Temperature")
                    .parameterType("DECIMAL").unit("C").status("ACTIVE").build();

            when(processParametersConfigService.getAllConfigs()).thenReturn(List.of(config));

            mockMvc.perform(get("/api/config/process-parameters"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].operationType").value("ROLLING"))
                    .andExpect(jsonPath("$[0].parameterName").value("Temperature"));
        }

        @Test
        @DisplayName("Should create process parameter config")
        @WithMockUser(username = "admin@mes.com")
        void createProcessParam_ValidData_ReturnsCreated() throws Exception {
            ProcessParametersConfigDTO request = ProcessParametersConfigDTO.builder()
                    .operationType("FURNACE").parameterName("Pressure").build();

            ProcessParametersConfigDTO response = ProcessParametersConfigDTO.builder()
                    .configId(1L).operationType("FURNACE").parameterName("Pressure")
                    .status("ACTIVE").build();

            when(processParametersConfigService.createConfig(any())).thenReturn(response);

            mockMvc.perform(post("/api/config/process-parameters")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.configId").value(1));
        }

        @Test
        @DisplayName("Should delete process parameter config")
        @WithMockUser(username = "admin@mes.com")
        void deleteProcessParam_ValidId_ReturnsOk() throws Exception {
            doNothing().when(processParametersConfigService).deleteConfig(1L);

            mockMvc.perform(delete("/api/config/process-parameters/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Process parameter config deleted successfully"));
        }
    }

    // ===== Batch Number Config Tests =====

    @Nested
    @DisplayName("Batch Number Config Tests")
    class BatchNumberConfigTests {

        @Test
        @DisplayName("Should get all batch number configs")
        @WithMockUser(username = "admin@mes.com")
        void getAllBatchNumberConfigs_ReturnsConfigs() throws Exception {
            BatchNumberConfigDTO config = BatchNumberConfigDTO.builder()
                    .configId(1L).configName("FURNACE_OP").prefix("FUR")
                    .status("ACTIVE").build();

            when(batchNumberConfigService.getAllConfigs()).thenReturn(List.of(config));

            mockMvc.perform(get("/api/config/batch-number"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].configName").value("FURNACE_OP"));
        }

        @Test
        @DisplayName("Should create batch number config")
        @WithMockUser(username = "admin@mes.com")
        void createBatchNumberConfig_ValidData_ReturnsCreated() throws Exception {
            BatchNumberConfigDTO request = BatchNumberConfigDTO.builder()
                    .configName("NEW_CONFIG").prefix("NEW").build();

            BatchNumberConfigDTO response = BatchNumberConfigDTO.builder()
                    .configId(1L).configName("NEW_CONFIG").prefix("NEW")
                    .status("ACTIVE").build();

            when(batchNumberConfigService.createConfig(any())).thenReturn(response);

            mockMvc.perform(post("/api/config/batch-number")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.configId").value(1));
        }

        @Test
        @DisplayName("Should delete batch number config")
        @WithMockUser(username = "admin@mes.com")
        void deleteBatchNumberConfig_ValidId_ReturnsOk() throws Exception {
            doNothing().when(batchNumberConfigService).deleteConfig(1L);

            mockMvc.perform(delete("/api/config/batch-number/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Batch number config deleted successfully"));
        }
    }

    // ===== Quantity Type Config Tests =====

    @Nested
    @DisplayName("Quantity Type Config Tests")
    class QuantityTypeConfigTests {

        @Test
        @DisplayName("Should get all quantity type configs")
        @WithMockUser(username = "admin@mes.com")
        void getAllQuantityTypeConfigs_ReturnsConfigs() throws Exception {
            QuantityTypeConfigDTO config = QuantityTypeConfigDTO.builder()
                    .configId(1L).configName("FURNACE_WEIGHT").quantityType("DECIMAL")
                    .decimalPrecision(2).unit("MT").status("ACTIVE").build();

            when(quantityTypeConfigService.getAllConfigs()).thenReturn(List.of(config));

            mockMvc.perform(get("/api/config/quantity-types"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].configName").value("FURNACE_WEIGHT"))
                    .andExpect(jsonPath("$[0].quantityType").value("DECIMAL"));
        }

        @Test
        @DisplayName("Should create quantity type config")
        @WithMockUser(username = "admin@mes.com")
        void createQuantityTypeConfig_ValidData_ReturnsCreated() throws Exception {
            QuantityTypeConfigDTO request = QuantityTypeConfigDTO.builder()
                    .configName("NEW_QTY").quantityType("INTEGER").build();

            QuantityTypeConfigDTO response = QuantityTypeConfigDTO.builder()
                    .configId(1L).configName("NEW_QTY").quantityType("INTEGER")
                    .decimalPrecision(0).status("ACTIVE").build();

            when(quantityTypeConfigService.createConfig(any())).thenReturn(response);

            mockMvc.perform(post("/api/config/quantity-types")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.configId").value(1));
        }

        @Test
        @DisplayName("Should delete quantity type config")
        @WithMockUser(username = "admin@mes.com")
        void deleteQuantityTypeConfig_ValidId_ReturnsOk() throws Exception {
            doNothing().when(quantityTypeConfigService).deleteConfig(1L);

            mockMvc.perform(delete("/api/config/quantity-types/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Quantity type config deleted successfully"));
        }
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void getConfigEndpoint_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/config/hold-reasons"))
                .andExpect(status().isUnauthorized());
    }
}
