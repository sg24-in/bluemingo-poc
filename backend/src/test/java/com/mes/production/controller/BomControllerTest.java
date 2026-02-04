package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.BomDTO;
import com.mes.production.security.JwtService;
import com.mes.production.service.BomValidationService;
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
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BomControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BomValidationService bomValidationService;

    @MockBean
    private JwtService jwtService;

    private BomDTO.BomTreeResponse bomTreeResponse;
    private BomDTO.BomValidationResult validationResult;

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
}
