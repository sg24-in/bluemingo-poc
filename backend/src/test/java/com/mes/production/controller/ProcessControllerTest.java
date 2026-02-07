package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.ProcessDTO;
import com.mes.production.entity.ProcessStatus;
import com.mes.production.security.JwtService;
import com.mes.production.service.ProcessService;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests for ProcessController - design-time Process template management.
 *
 * Process Status Model (Design-Time Only):
 * - DRAFT: Process being defined, not ready for use
 * - ACTIVE: Process approved and usable for execution
 * - INACTIVE: Process retired/disabled, historical access only
 */
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

    private ProcessDTO.Response draftProcessResponse;
    private ProcessDTO.Response activeProcessResponse;
    private ProcessDTO.Response inactiveProcessResponse;

    @BeforeEach
    void setUp() {
        draftProcessResponse = ProcessDTO.Response.builder()
                .processId(1L)
                .processName("Melting Process")
                .status("DRAFT")
                .createdOn(LocalDateTime.now())
                .createdBy("admin@mes.com")
                .operations(List.of(
                        ProcessDTO.OperationSummary.builder()
                                .operationId(1L)
                                .operationName("Melt Iron")
                                .operationCode("MLT-001")
                                .status("NOT_STARTED")
                                .sequenceNumber(1)
                                .build()
                ))
                .build();

        activeProcessResponse = ProcessDTO.Response.builder()
                .processId(2L)
                .processName("Casting Process")
                .status("ACTIVE")
                .createdOn(LocalDateTime.now())
                .createdBy("admin@mes.com")
                .build();

        inactiveProcessResponse = ProcessDTO.Response.builder()
                .processId(3L)
                .processName("Old Rolling Process")
                .status("INACTIVE")
                .createdOn(LocalDateTime.now())
                .createdBy("admin@mes.com")
                .build();
    }

    // ==================== GET Endpoints ====================

    @Nested
    @DisplayName("GET Endpoints")
    class GetEndpoints {

        @Test
        @DisplayName("Should get process by ID")
        @WithMockUser(username = "admin@mes.com")
        void getProcessById_ValidId_ReturnsProcess() throws Exception {
            when(processService.getProcessById(1L)).thenReturn(draftProcessResponse);

            mockMvc.perform(get("/api/processes/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.processId").value(1))
                    .andExpect(jsonPath("$.processName").value("Melting Process"))
                    .andExpect(jsonPath("$.status").value("DRAFT"));

            verify(processService, times(1)).getProcessById(1L);
        }

        @Test
        @DisplayName("Should get all processes")
        @WithMockUser(username = "admin@mes.com")
        void getAllProcesses_ReturnsAllProcesses() throws Exception {
            when(processService.getAllProcesses())
                    .thenReturn(List.of(draftProcessResponse, activeProcessResponse, inactiveProcessResponse));

            mockMvc.perform(get("/api/processes"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(3));

            verify(processService, times(1)).getAllProcesses();
        }

        @Test
        @DisplayName("Should get processes by DRAFT status")
        @WithMockUser(username = "admin@mes.com")
        void getProcessesByStatus_Draft_ReturnsDraftProcesses() throws Exception {
            when(processService.getProcessesByStatus("DRAFT"))
                    .thenReturn(List.of(draftProcessResponse));

            mockMvc.perform(get("/api/processes/status/DRAFT"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].processId").value(1))
                    .andExpect(jsonPath("$[0].status").value("DRAFT"));

            verify(processService, times(1)).getProcessesByStatus("DRAFT");
        }

        @Test
        @DisplayName("Should get active processes only")
        @WithMockUser(username = "admin@mes.com")
        void getActiveProcesses_ReturnsActiveOnly() throws Exception {
            when(processService.getActiveProcesses())
                    .thenReturn(List.of(activeProcessResponse));

            mockMvc.perform(get("/api/processes/active"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].processId").value(2))
                    .andExpect(jsonPath("$[0].status").value("ACTIVE"));

            verify(processService, times(1)).getActiveProcesses();
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
    }

    // ==================== CREATE/UPDATE Endpoints ====================

    @Nested
    @DisplayName("CREATE/UPDATE Endpoints")
    class CreateUpdateEndpoints {

        @Test
        @DisplayName("Should create process with DRAFT status")
        @WithMockUser(username = "admin@mes.com")
        void createProcess_DefaultDraft_ReturnsCreated() throws Exception {
            ProcessDTO.CreateRequest request = ProcessDTO.CreateRequest.builder()
                    .processName("New Process")
                    .build();

            when(processService.createProcess(any(ProcessDTO.CreateRequest.class)))
                    .thenReturn(draftProcessResponse);

            mockMvc.perform(post("/api/processes")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.processName").value("Melting Process"))
                    .andExpect(jsonPath("$.status").value("DRAFT"));

            verify(processService, times(1)).createProcess(any(ProcessDTO.CreateRequest.class));
        }

        @Test
        @DisplayName("Should update process name")
        @WithMockUser(username = "admin@mes.com")
        void updateProcess_ValidRequest_ReturnsUpdated() throws Exception {
            ProcessDTO.UpdateRequest request = ProcessDTO.UpdateRequest.builder()
                    .processName("Updated Process Name")
                    .build();

            ProcessDTO.Response updatedResponse = ProcessDTO.Response.builder()
                    .processId(1L)
                    .processName("Updated Process Name")
                    .status("DRAFT")
                    .build();

            when(processService.updateProcess(eq(1L), any(ProcessDTO.UpdateRequest.class)))
                    .thenReturn(updatedResponse);

            mockMvc.perform(put("/api/processes/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.processName").value("Updated Process Name"));

            verify(processService, times(1)).updateProcess(eq(1L), any(ProcessDTO.UpdateRequest.class));
        }

        @Test
        @DisplayName("Should delete process (soft delete to INACTIVE)")
        @WithMockUser(username = "admin@mes.com")
        void deleteProcess_ValidId_ReturnsNoContent() throws Exception {
            doNothing().when(processService).deleteProcess(1L);

            mockMvc.perform(delete("/api/processes/1"))
                    .andExpect(status().isNoContent());

            verify(processService, times(1)).deleteProcess(1L);
        }
    }

    // ==================== Activate/Deactivate Endpoints ====================

    @Nested
    @DisplayName("Activate/Deactivate Endpoints")
    class ActivateDeactivateEndpoints {

        @Test
        @DisplayName("Should activate DRAFT process")
        @WithMockUser(username = "admin@mes.com")
        void activateProcess_FromDraft_ReturnsActive() throws Exception {
            ProcessDTO.Response activatedResponse = ProcessDTO.Response.builder()
                    .processId(1L)
                    .processName("Melting Process")
                    .status("ACTIVE")
                    .updatedBy("admin@mes.com")
                    .updatedOn(LocalDateTime.now())
                    .build();

            when(processService.activateProcess(1L)).thenReturn(activatedResponse);

            mockMvc.perform(post("/api/processes/1/activate"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.processId").value(1))
                    .andExpect(jsonPath("$.status").value("ACTIVE"));

            verify(processService, times(1)).activateProcess(1L);
        }

        @Test
        @DisplayName("Should reactivate INACTIVE process")
        @WithMockUser(username = "admin@mes.com")
        void activateProcess_FromInactive_ReturnsActive() throws Exception {
            ProcessDTO.Response reactivatedResponse = ProcessDTO.Response.builder()
                    .processId(3L)
                    .processName("Old Rolling Process")
                    .status("ACTIVE")
                    .updatedBy("admin@mes.com")
                    .updatedOn(LocalDateTime.now())
                    .build();

            when(processService.activateProcess(3L)).thenReturn(reactivatedResponse);

            mockMvc.perform(post("/api/processes/3/activate"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.processId").value(3))
                    .andExpect(jsonPath("$.status").value("ACTIVE"));

            verify(processService, times(1)).activateProcess(3L);
        }

        @Test
        @DisplayName("Should deactivate ACTIVE process")
        @WithMockUser(username = "admin@mes.com")
        void deactivateProcess_FromActive_ReturnsInactive() throws Exception {
            ProcessDTO.Response deactivatedResponse = ProcessDTO.Response.builder()
                    .processId(2L)
                    .processName("Casting Process")
                    .status("INACTIVE")
                    .updatedBy("admin@mes.com")
                    .updatedOn(LocalDateTime.now())
                    .build();

            when(processService.deactivateProcess(2L)).thenReturn(deactivatedResponse);

            mockMvc.perform(post("/api/processes/2/deactivate"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.processId").value(2))
                    .andExpect(jsonPath("$.status").value("INACTIVE"));

            verify(processService, times(1)).deactivateProcess(2L);
        }

        @Test
        @DisplayName("Should fail to activate already ACTIVE process")
        @WithMockUser(username = "admin@mes.com")
        void activateProcess_AlreadyActive_ReturnsError() throws Exception {
            when(processService.activateProcess(2L))
                    .thenThrow(new RuntimeException("Process must be DRAFT or INACTIVE to activate. Current status: ACTIVE"));

            mockMvc.perform(post("/api/processes/2/activate"))
                    .andExpect(status().isBadRequest());

            verify(processService, times(1)).activateProcess(2L);
        }

        @Test
        @DisplayName("Should fail to deactivate DRAFT process")
        @WithMockUser(username = "admin@mes.com")
        void deactivateProcess_FromDraft_ReturnsError() throws Exception {
            when(processService.deactivateProcess(1L))
                    .thenThrow(new RuntimeException("Process must be ACTIVE to deactivate. Current status: DRAFT"));

            mockMvc.perform(post("/api/processes/1/deactivate"))
                    .andExpect(status().isBadRequest());

            verify(processService, times(1)).deactivateProcess(1L);
        }
    }

    // ==================== Authentication ====================

    @Nested
    @DisplayName("Authentication")
    class Authentication {

        @Test
        @DisplayName("Should return 401 when not authenticated")
        void getProcess_NotAuthenticated_Returns401() throws Exception {
            mockMvc.perform(get("/api/processes/1"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Should return 401 for activate when not authenticated")
        void activateProcess_NotAuthenticated_Returns401() throws Exception {
            mockMvc.perform(post("/api/processes/1/activate"))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==================== Error Handling ====================

    @Nested
    @DisplayName("Error Handling")
    class ErrorHandling {

        @Test
        @DisplayName("Should handle delete with existing operations")
        @WithMockUser(username = "admin@mes.com")
        void deleteProcess_HasOperations_ReturnsError() throws Exception {
            doThrow(new RuntimeException("Cannot delete process with existing operations. Found 3 operations."))
                    .when(processService).deleteProcess(1L);

            mockMvc.perform(delete("/api/processes/1"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should handle invalid status in request")
        @WithMockUser(username = "admin@mes.com")
        void updateProcess_InvalidStatus_ReturnsError() throws Exception {
            ProcessDTO.UpdateRequest request = ProcessDTO.UpdateRequest.builder()
                    .status("INVALID_STATUS")
                    .build();

            when(processService.updateProcess(eq(1L), any(ProcessDTO.UpdateRequest.class)))
                    .thenThrow(new IllegalArgumentException("No enum constant ProcessStatus.INVALID_STATUS"));

            mockMvc.perform(put("/api/processes/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should handle invalid status transition")
        @WithMockUser(username = "admin@mes.com")
        void updateProcess_InvalidTransition_ReturnsError() throws Exception {
            ProcessDTO.UpdateRequest request = ProcessDTO.UpdateRequest.builder()
                    .status("DRAFT")
                    .build();

            when(processService.updateProcess(eq(2L), any(ProcessDTO.UpdateRequest.class)))
                    .thenThrow(new RuntimeException("Invalid status transition: Cannot change Process status from ACTIVE to DRAFT"));

            mockMvc.perform(put("/api/processes/2")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }
}
