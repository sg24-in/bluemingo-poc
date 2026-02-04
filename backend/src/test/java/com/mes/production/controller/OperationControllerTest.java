package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.OperationDTO;
import com.mes.production.security.JwtService;
import com.mes.production.service.OperationService;
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

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OperationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OperationService operationService;

    @MockBean
    private JwtService jwtService;

    private OperationDTO testOperation;

    @BeforeEach
    void setUp() {
        testOperation = OperationDTO.builder()
                .operationId(1L)
                .processId(1L)
                .operationName("Melting")
                .operationCode("OP-001")
                .operationType("MELTING")
                .sequenceNumber(1)
                .status("READY")
                .targetQty(new BigDecimal("100.00"))
                .confirmedQty(BigDecimal.ZERO)
                .build();
    }

    @Test
    @DisplayName("Should get all operations")
    @WithMockUser(username = "admin@mes.com")
    void getAllOperations_ReturnsOperations() throws Exception {
        when(operationService.getAllOperations()).thenReturn(List.of(testOperation));

        mockMvc.perform(get("/api/operations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].operationId").value(1))
                .andExpect(jsonPath("$[0].operationCode").value("OP-001"))
                .andExpect(jsonPath("$[0].status").value("READY"));

        verify(operationService, times(1)).getAllOperations();
    }

    @Test
    @DisplayName("Should get operation by ID")
    @WithMockUser(username = "admin@mes.com")
    void getOperationById_ReturnsOperation() throws Exception {
        when(operationService.getOperationById(1L)).thenReturn(testOperation);

        mockMvc.perform(get("/api/operations/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operationId").value(1))
                .andExpect(jsonPath("$.operationCode").value("OP-001"));

        verify(operationService, times(1)).getOperationById(1L);
    }

    @Test
    @DisplayName("Should get operations by status")
    @WithMockUser(username = "admin@mes.com")
    void getOperationsByStatus_ReturnsFiltered() throws Exception {
        when(operationService.getOperationsByStatus("READY")).thenReturn(List.of(testOperation));

        mockMvc.perform(get("/api/operations/status/READY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("READY"));

        verify(operationService, times(1)).getOperationsByStatus("READY");
    }

    @Test
    @DisplayName("Should get blocked operations")
    @WithMockUser(username = "admin@mes.com")
    void getBlockedOperations_ReturnsBlockedOnly() throws Exception {
        OperationDTO blockedOperation = OperationDTO.builder()
                .operationId(2L)
                .operationCode("OP-002")
                .status("BLOCKED")
                .blockReason("Material shortage")
                .build();
        when(operationService.getBlockedOperations()).thenReturn(List.of(blockedOperation));

        mockMvc.perform(get("/api/operations/blocked"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("BLOCKED"))
                .andExpect(jsonPath("$[0].blockReason").value("Material shortage"));

        verify(operationService, times(1)).getBlockedOperations();
    }

    @Test
    @DisplayName("Should block operation")
    @WithMockUser(username = "admin@mes.com")
    void blockOperation_ValidRequest_BlocksSuccessfully() throws Exception {
        OperationDTO.StatusUpdateResponse response = OperationDTO.StatusUpdateResponse.builder()
                .operationId(1L)
                .previousStatus("READY")
                .newStatus("BLOCKED")
                .message("Operation blocked. Reason: Material shortage")
                .updatedBy("admin@mes.com")
                .updatedOn(LocalDateTime.now())
                .build();
        when(operationService.blockOperation(eq(1L), eq("Material shortage"))).thenReturn(response);

        OperationDTO.BlockRequest request = OperationDTO.BlockRequest.builder()
                .operationId(1L)
                .reason("Material shortage")
                .build();

        mockMvc.perform(post("/api/operations/1/block")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operationId").value(1))
                .andExpect(jsonPath("$.previousStatus").value("READY"))
                .andExpect(jsonPath("$.newStatus").value("BLOCKED"));

        verify(operationService, times(1)).blockOperation(1L, "Material shortage");
    }

    @Test
    @DisplayName("Should unblock operation")
    @WithMockUser(username = "admin@mes.com")
    void unblockOperation_ValidRequest_UnblocksSuccessfully() throws Exception {
        OperationDTO.StatusUpdateResponse response = OperationDTO.StatusUpdateResponse.builder()
                .operationId(1L)
                .previousStatus("BLOCKED")
                .newStatus("READY")
                .message("Operation unblocked and ready for processing")
                .updatedBy("admin@mes.com")
                .updatedOn(LocalDateTime.now())
                .build();
        when(operationService.unblockOperation(1L)).thenReturn(response);

        mockMvc.perform(post("/api/operations/1/unblock")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.previousStatus").value("BLOCKED"))
                .andExpect(jsonPath("$.newStatus").value("READY"));

        verify(operationService, times(1)).unblockOperation(1L);
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void getAllOperations_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/operations"))
                .andExpect(status().isUnauthorized());
    }
}
