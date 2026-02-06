package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.ProcessDTO;
import com.mes.production.entity.Process;
import com.mes.production.security.JwtService;
import com.mes.production.service.ProcessService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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

import java.time.LocalDateTime;
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
class ProcessControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProcessService processService;

    @MockBean
    private JwtService jwtService;

    private ProcessDTO.Response testProcessResponse;
    private ProcessDTO.StatusUpdateResponse statusUpdateResponse;

    @BeforeEach
    void setUp() {
        testProcessResponse = ProcessDTO.Response.builder()
                .processId(1L)
                .orderLineId(1L)
                .processName("Melting")
                .stageSequence(1)
                .status(Process.STATUS_IN_PROGRESS)
                .createdOn(LocalDateTime.now())
                .operations(List.of(
                        ProcessDTO.OperationSummary.builder()
                                .operationId(1L)
                                .operationName("Melt Iron")
                                .operationCode("MLT-001")
                                .status("CONFIRMED")
                                .sequenceNumber(1)
                                .build()
                ))
                .build();

        statusUpdateResponse = ProcessDTO.StatusUpdateResponse.builder()
                .processId(1L)
                .processName("Melting")
                .previousStatus(Process.STATUS_IN_PROGRESS)
                .newStatus(Process.STATUS_QUALITY_PENDING)
                .usageDecision(Process.DECISION_PENDING)
                .updatedBy("admin@mes.com")
                .updatedOn(LocalDateTime.now())
                .message("Process moved to quality pending status")
                .build();
    }

    @Test
    @DisplayName("Should get process by ID")
    @WithMockUser(username = "admin@mes.com")
    void getProcessById_ValidId_ReturnsProcess() throws Exception {
        when(processService.getProcessById(1L)).thenReturn(testProcessResponse);

        mockMvc.perform(get("/api/processes/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.processId").value(1))
                .andExpect(jsonPath("$.processName").value("Melting"))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        verify(processService, times(1)).getProcessById(1L);
    }

    @Test
    @DisplayName("Should get processes by status")
    @WithMockUser(username = "admin@mes.com")
    void getProcessesByStatus_ValidStatus_ReturnsProcesses() throws Exception {
        when(processService.getProcessesByStatus("QUALITY_PENDING"))
                .thenReturn(List.of(testProcessResponse));

        mockMvc.perform(get("/api/processes/status/QUALITY_PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].processId").value(1));

        verify(processService, times(1)).getProcessesByStatus("QUALITY_PENDING");
    }

    @Test
    @DisplayName("Should get quality pending processes")
    @WithMockUser(username = "admin@mes.com")
    void getQualityPendingProcesses_ReturnsProcesses() throws Exception {
        ProcessDTO.Response qualityPendingProcess = ProcessDTO.Response.builder()
                .processId(1L)
                .processName("Melting")
                .status(Process.STATUS_QUALITY_PENDING)
                .build();

        when(processService.getQualityPendingProcesses())
                .thenReturn(List.of(qualityPendingProcess));

        mockMvc.perform(get("/api/processes/quality-pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("QUALITY_PENDING"));

        verify(processService, times(1)).getQualityPendingProcesses();
    }

    @Test
    @DisplayName("Should transition process to quality pending")
    @WithMockUser(username = "admin@mes.com")
    void transitionToQualityPending_ValidProcess_ReturnsSuccess() throws Exception {
        when(processService.transitionToQualityPending(eq(1L), anyString()))
                .thenReturn(statusUpdateResponse);

        mockMvc.perform(post("/api/processes/1/quality-pending")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("notes", "Ready for quality check"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.processId").value(1))
                .andExpect(jsonPath("$.previousStatus").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.newStatus").value("QUALITY_PENDING"))
                .andExpect(jsonPath("$.usageDecision").value("PENDING"));

        verify(processService, times(1)).transitionToQualityPending(eq(1L), anyString());
    }

    @Test
    @DisplayName("Should make quality decision - ACCEPT")
    @WithMockUser(username = "admin@mes.com")
    void makeQualityDecision_Accept_ReturnsSuccess() throws Exception {
        ProcessDTO.StatusUpdateResponse acceptResponse = ProcessDTO.StatusUpdateResponse.builder()
                .processId(1L)
                .processName("Melting")
                .previousStatus(Process.STATUS_QUALITY_PENDING)
                .newStatus(Process.STATUS_COMPLETED)
                .usageDecision(Process.DECISION_ACCEPT)
                .updatedBy("admin@mes.com")
                .updatedOn(LocalDateTime.now())
                .message("Process accepted and marked as completed")
                .build();

        when(processService.makeQualityDecision(any(ProcessDTO.QualityDecisionRequest.class)))
                .thenReturn(acceptResponse);

        ProcessDTO.QualityDecisionRequest request = ProcessDTO.QualityDecisionRequest.builder()
                .processId(1L)
                .decision("ACCEPT")
                .notes("Quality approved")
                .build();

        mockMvc.perform(post("/api/processes/quality-decision")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.newStatus").value("COMPLETED"))
                .andExpect(jsonPath("$.usageDecision").value("ACCEPT"));

        verify(processService, times(1)).makeQualityDecision(any());
    }

    @Test
    @DisplayName("Should make quality decision - REJECT")
    @WithMockUser(username = "admin@mes.com")
    void makeQualityDecision_Reject_ReturnsSuccess() throws Exception {
        ProcessDTO.StatusUpdateResponse rejectResponse = ProcessDTO.StatusUpdateResponse.builder()
                .processId(1L)
                .processName("Melting")
                .previousStatus(Process.STATUS_QUALITY_PENDING)
                .newStatus(Process.STATUS_REJECTED)
                .usageDecision(Process.DECISION_REJECT)
                .updatedBy("admin@mes.com")
                .updatedOn(LocalDateTime.now())
                .message("Process rejected. Reason: Quality defects found")
                .build();

        when(processService.makeQualityDecision(any(ProcessDTO.QualityDecisionRequest.class)))
                .thenReturn(rejectResponse);

        ProcessDTO.QualityDecisionRequest request = ProcessDTO.QualityDecisionRequest.builder()
                .processId(1L)
                .decision("REJECT")
                .reason("Quality defects found")
                .build();

        mockMvc.perform(post("/api/processes/quality-decision")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.newStatus").value("REJECTED"))
                .andExpect(jsonPath("$.usageDecision").value("REJECT"));

        verify(processService, times(1)).makeQualityDecision(any());
    }

    @Test
    @DisplayName("Should accept process using shorthand endpoint")
    @WithMockUser(username = "admin@mes.com")
    void acceptProcess_ValidProcess_ReturnsSuccess() throws Exception {
        ProcessDTO.StatusUpdateResponse acceptResponse = ProcessDTO.StatusUpdateResponse.builder()
                .processId(1L)
                .newStatus(Process.STATUS_COMPLETED)
                .usageDecision(Process.DECISION_ACCEPT)
                .build();

        when(processService.makeQualityDecision(any(ProcessDTO.QualityDecisionRequest.class)))
                .thenReturn(acceptResponse);

        mockMvc.perform(post("/api/processes/1/accept")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("notes", "Approved"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.newStatus").value("COMPLETED"))
                .andExpect(jsonPath("$.usageDecision").value("ACCEPT"));
    }

    @Test
    @DisplayName("Should reject process using shorthand endpoint")
    @WithMockUser(username = "admin@mes.com")
    void rejectProcess_ValidProcess_ReturnsSuccess() throws Exception {
        ProcessDTO.StatusUpdateResponse rejectResponse = ProcessDTO.StatusUpdateResponse.builder()
                .processId(1L)
                .newStatus(Process.STATUS_REJECTED)
                .usageDecision(Process.DECISION_REJECT)
                .build();

        when(processService.makeQualityDecision(any(ProcessDTO.QualityDecisionRequest.class)))
                .thenReturn(rejectResponse);

        mockMvc.perform(post("/api/processes/1/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reason", "Defects found"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.newStatus").value("REJECTED"));
    }

    @Test
    @DisplayName("Should update process status")
    @WithMockUser(username = "admin@mes.com")
    void updateStatus_ValidRequest_ReturnsSuccess() throws Exception {
        ProcessDTO.StatusUpdateResponse response = ProcessDTO.StatusUpdateResponse.builder()
                .processId(1L)
                .previousStatus(Process.STATUS_READY)
                .newStatus(Process.STATUS_IN_PROGRESS)
                .message("Process status updated successfully")
                .build();

        when(processService.updateStatus(any(ProcessDTO.StatusUpdateRequest.class)))
                .thenReturn(response);

        ProcessDTO.StatusUpdateRequest request = ProcessDTO.StatusUpdateRequest.builder()
                .processId(1L)
                .newStatus("IN_PROGRESS")
                .build();

        mockMvc.perform(put("/api/processes/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.newStatus").value("IN_PROGRESS"));

        verify(processService, times(1)).updateStatus(any());
    }

    @Test
    @DisplayName("Should check if all operations are confirmed")
    @WithMockUser(username = "admin@mes.com")
    void checkAllOperationsConfirmed_ReturnsResult() throws Exception {
        when(processService.areAllOperationsConfirmed(1L)).thenReturn(true);

        mockMvc.perform(get("/api/processes/1/all-confirmed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.processId").value(1))
                .andExpect(jsonPath("$.allOperationsConfirmed").value(true));

        verify(processService, times(1)).areAllOperationsConfirmed(1L);
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void getProcess_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/processes/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should handle process not found")
    @WithMockUser(username = "admin@mes.com")
    void getProcessById_NotFound_ReturnsError() throws Exception {
        when(processService.getProcessById(999L))
                .thenThrow(new RuntimeException("Process not found: 999"));

        mockMvc.perform(get("/api/processes/999"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should handle invalid status transition")
    @WithMockUser(username = "admin@mes.com")
    void transitionToQualityPending_InvalidStatus_ReturnsError() throws Exception {
        when(processService.transitionToQualityPending(eq(1L), any()))
                .thenThrow(new RuntimeException("Process must be IN_PROGRESS or COMPLETED to transition to QUALITY_PENDING"));

        mockMvc.perform(post("/api/processes/1/quality-pending")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should handle process on hold")
    @WithMockUser(username = "admin@mes.com")
    void transitionToQualityPending_OnHold_ReturnsError() throws Exception {
        when(processService.transitionToQualityPending(eq(1L), any()))
                .thenThrow(new RuntimeException("Process is on hold and cannot be updated"));

        mockMvc.perform(post("/api/processes/1/quality-pending")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
