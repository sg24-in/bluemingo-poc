package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.OperationDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.security.JwtService;
import com.mes.production.service.OperationService;
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

    @Nested
    @DisplayName("GET /api/operations Tests")
    class GetAllOperationsTests {

        @Test
        @DisplayName("should_returnAllOperations_when_authenticatedUserRequests")
        @WithMockUser(username = "admin@mes.com")
        void should_returnAllOperations_when_authenticatedUserRequests() throws Exception {
            when(operationService.getAllOperations()).thenReturn(List.of(testOperation));

            mockMvc.perform(get("/api/operations"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].operationId").value(1))
                    .andExpect(jsonPath("$[0].operationCode").value("OP-001"))
                    .andExpect(jsonPath("$[0].operationName").value("Melting"))
                    .andExpect(jsonPath("$[0].status").value("READY"));

            verify(operationService, times(1)).getAllOperations();
        }

        @Test
        @DisplayName("should_returnEmptyList_when_noOperationsExist")
        @WithMockUser(username = "admin@mes.com")
        void should_returnEmptyList_when_noOperationsExist() throws Exception {
            when(operationService.getAllOperations()).thenReturn(List.of());

            mockMvc.perform(get("/api/operations"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            mockMvc.perform(get("/api/operations"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should_returnMultipleOperations_when_multipleExist")
        @WithMockUser(username = "admin@mes.com")
        void should_returnMultipleOperations_when_multipleExist() throws Exception {
            OperationDTO op2 = OperationDTO.builder()
                    .operationId(2L)
                    .operationCode("OP-002")
                    .operationName("Casting")
                    .status("NOT_STARTED")
                    .build();

            when(operationService.getAllOperations()).thenReturn(List.of(testOperation, op2));

            mockMvc.perform(get("/api/operations"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].operationId").value(1))
                    .andExpect(jsonPath("$[1].operationId").value(2));
        }
    }

    @Nested
    @DisplayName("GET /api/operations/paged Tests")
    class GetOperationsPagedTests {

        @Test
        @DisplayName("should_returnPagedOperations_when_defaultPaginationUsed")
        @WithMockUser(username = "admin@mes.com")
        void should_returnPagedOperations_when_defaultPaginationUsed() throws Exception {
            PagedResponseDTO<OperationDTO> pagedResponse = PagedResponseDTO.<OperationDTO>builder()
                    .content(List.of(testOperation))
                    .page(0)
                    .size(20)
                    .totalElements(1L)
                    .totalPages(1)
                    .first(true)
                    .last(true)
                    .hasNext(false)
                    .hasPrevious(false)
                    .build();

            when(operationService.getOperationsPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/operations/paged"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].operationId").value(1))
                    .andExpect(jsonPath("$.page").value(0))
                    .andExpect(jsonPath("$.size").value(20))
                    .andExpect(jsonPath("$.totalElements").value(1))
                    .andExpect(jsonPath("$.first").value(true))
                    .andExpect(jsonPath("$.last").value(true));
        }

        @Test
        @DisplayName("should_filterByStatus_when_statusProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_filterByStatus_when_statusProvided() throws Exception {
            PagedResponseDTO<OperationDTO> pagedResponse = PagedResponseDTO.<OperationDTO>builder()
                    .content(List.of(testOperation))
                    .page(0)
                    .size(20)
                    .totalElements(1L)
                    .totalPages(1)
                    .build();

            when(operationService.getOperationsPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/operations/paged")
                            .param("status", "READY"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].status").value("READY"));

            verify(operationService).getOperationsPaged(argThat(req -> "READY".equals(req.getStatus())));
        }

        @Test
        @DisplayName("should_filterByType_when_typeProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_filterByType_when_typeProvided() throws Exception {
            PagedResponseDTO<OperationDTO> pagedResponse = PagedResponseDTO.<OperationDTO>builder()
                    .content(List.of(testOperation))
                    .page(0)
                    .size(20)
                    .totalElements(1L)
                    .totalPages(1)
                    .build();

            when(operationService.getOperationsPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/operations/paged")
                            .param("type", "MELTING"))
                    .andExpect(status().isOk());

            verify(operationService).getOperationsPaged(argThat(req -> "MELTING".equals(req.getType())));
        }

        @Test
        @DisplayName("should_searchOperations_when_searchTermProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_searchOperations_when_searchTermProvided() throws Exception {
            PagedResponseDTO<OperationDTO> pagedResponse = PagedResponseDTO.<OperationDTO>builder()
                    .content(List.of(testOperation))
                    .page(0)
                    .size(20)
                    .totalElements(1L)
                    .totalPages(1)
                    .build();

            when(operationService.getOperationsPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/operations/paged")
                            .param("search", "Melting"))
                    .andExpect(status().isOk());

            verify(operationService).getOperationsPaged(argThat(req -> "Melting".equals(req.getSearch())));
        }

        @Test
        @DisplayName("should_sortOperations_when_sortParametersProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_sortOperations_when_sortParametersProvided() throws Exception {
            PagedResponseDTO<OperationDTO> pagedResponse = PagedResponseDTO.<OperationDTO>builder()
                    .content(List.of(testOperation))
                    .page(0)
                    .size(20)
                    .totalElements(1L)
                    .totalPages(1)
                    .sortBy("sequenceNumber")
                    .sortDirection("ASC")
                    .build();

            when(operationService.getOperationsPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/operations/paged")
                            .param("sortBy", "sequenceNumber")
                            .param("sortDirection", "ASC"))
                    .andExpect(status().isOk());

            verify(operationService).getOperationsPaged(argThat(req ->
                    "sequenceNumber".equals(req.getSortBy()) && "ASC".equals(req.getSortDirection())));
        }
    }

    @Nested
    @DisplayName("GET /api/operations/{id} Tests")
    class GetOperationByIdTests {

        @Test
        @DisplayName("should_returnOperation_when_validIdProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_returnOperation_when_validIdProvided() throws Exception {
            when(operationService.getOperationById(1L)).thenReturn(testOperation);

            mockMvc.perform(get("/api/operations/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.operationId").value(1))
                    .andExpect(jsonPath("$.operationCode").value("OP-001"))
                    .andExpect(jsonPath("$.operationName").value("Melting"))
                    .andExpect(jsonPath("$.operationType").value("MELTING"))
                    .andExpect(jsonPath("$.sequenceNumber").value(1));

            verify(operationService, times(1)).getOperationById(1L);
        }

        @Test
        @DisplayName("should_returnBadRequest_when_operationNotFound")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBadRequest_when_operationNotFound() throws Exception {
            when(operationService.getOperationById(999L))
                    .thenThrow(new RuntimeException("Operation not found"));

            mockMvc.perform(get("/api/operations/999"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            mockMvc.perform(get("/api/operations/1"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/operations/status/{status} Tests")
    class GetOperationsByStatusTests {

        @Test
        @DisplayName("should_returnOperationsByStatus_when_statusIsReady")
        @WithMockUser(username = "admin@mes.com")
        void should_returnOperationsByStatus_when_statusIsReady() throws Exception {
            when(operationService.getOperationsByStatus("READY")).thenReturn(List.of(testOperation));

            mockMvc.perform(get("/api/operations/status/READY"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].status").value("READY"));

            verify(operationService, times(1)).getOperationsByStatus("READY");
        }

        @Test
        @DisplayName("should_returnEmptyList_when_noOperationsWithStatus")
        @WithMockUser(username = "admin@mes.com")
        void should_returnEmptyList_when_noOperationsWithStatus() throws Exception {
            when(operationService.getOperationsByStatus("COMPLETED")).thenReturn(List.of());

            mockMvc.perform(get("/api/operations/status/COMPLETED"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }

        @Test
        @DisplayName("should_returnInProgressOperations_when_statusIsInProgress")
        @WithMockUser(username = "admin@mes.com")
        void should_returnInProgressOperations_when_statusIsInProgress() throws Exception {
            OperationDTO inProgressOp = OperationDTO.builder()
                    .operationId(2L)
                    .operationCode("OP-002")
                    .status("IN_PROGRESS")
                    .confirmedQty(new BigDecimal("50.00"))
                    .targetQty(new BigDecimal("100.00"))
                    .build();

            when(operationService.getOperationsByStatus("IN_PROGRESS")).thenReturn(List.of(inProgressOp));

            mockMvc.perform(get("/api/operations/status/IN_PROGRESS"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].status").value("IN_PROGRESS"))
                    .andExpect(jsonPath("$[0].confirmedQty").value(50.00));
        }
    }

    @Nested
    @DisplayName("GET /api/operations/blocked Tests")
    class GetBlockedOperationsTests {

        @Test
        @DisplayName("should_returnBlockedOperations_when_blockedExist")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBlockedOperations_when_blockedExist() throws Exception {
            OperationDTO blockedOperation = OperationDTO.builder()
                    .operationId(2L)
                    .operationCode("OP-002")
                    .operationName("Casting")
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
        @DisplayName("should_returnEmptyList_when_noBlockedOperations")
        @WithMockUser(username = "admin@mes.com")
        void should_returnEmptyList_when_noBlockedOperations() throws Exception {
            when(operationService.getBlockedOperations()).thenReturn(List.of());

            mockMvc.perform(get("/api/operations/blocked"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }

        @Test
        @DisplayName("should_returnMultipleBlocked_when_multipleExist")
        @WithMockUser(username = "admin@mes.com")
        void should_returnMultipleBlocked_when_multipleExist() throws Exception {
            OperationDTO blocked1 = OperationDTO.builder()
                    .operationId(1L)
                    .status("BLOCKED")
                    .blockReason("Quality issue")
                    .build();
            OperationDTO blocked2 = OperationDTO.builder()
                    .operationId(2L)
                    .status("BLOCKED")
                    .blockReason("Equipment failure")
                    .build();

            when(operationService.getBlockedOperations()).thenReturn(List.of(blocked1, blocked2));

            mockMvc.perform(get("/api/operations/blocked"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].blockReason").value("Quality issue"))
                    .andExpect(jsonPath("$[1].blockReason").value("Equipment failure"));
        }
    }

    @Nested
    @DisplayName("POST /api/operations/{id}/block Tests")
    class BlockOperationTests {

        @Test
        @DisplayName("should_blockOperation_when_validRequestProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_blockOperation_when_validRequestProvided() throws Exception {
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
        @DisplayName("should_returnBadRequest_when_operationAlreadyBlocked")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBadRequest_when_operationAlreadyBlocked() throws Exception {
            when(operationService.blockOperation(eq(1L), any()))
                    .thenThrow(new RuntimeException("Operation is already blocked"));

            OperationDTO.BlockRequest request = OperationDTO.BlockRequest.builder()
                    .operationId(1L)
                    .reason("Material shortage")
                    .build();

            mockMvc.perform(post("/api/operations/1/block")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should_returnBadRequest_when_operationNotFound")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBadRequest_when_operationNotFound() throws Exception {
            when(operationService.blockOperation(eq(999L), any()))
                    .thenThrow(new RuntimeException("Operation not found"));

            OperationDTO.BlockRequest request = OperationDTO.BlockRequest.builder()
                    .operationId(999L)
                    .reason("Material shortage")
                    .build();

            mockMvc.perform(post("/api/operations/999/block")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            OperationDTO.BlockRequest request = OperationDTO.BlockRequest.builder()
                    .operationId(1L)
                    .reason("Material shortage")
                    .build();

            mockMvc.perform(post("/api/operations/1/block")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("POST /api/operations/{id}/unblock Tests")
    class UnblockOperationTests {

        @Test
        @DisplayName("should_unblockOperation_when_validIdProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_unblockOperation_when_validIdProvided() throws Exception {
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
        @DisplayName("should_returnBadRequest_when_operationNotBlocked")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBadRequest_when_operationNotBlocked() throws Exception {
            when(operationService.unblockOperation(1L))
                    .thenThrow(new RuntimeException("Operation is not blocked"));

            mockMvc.perform(post("/api/operations/1/unblock")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should_returnBadRequest_when_operationNotFound")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBadRequest_when_operationNotFound() throws Exception {
            when(operationService.unblockOperation(999L))
                    .thenThrow(new RuntimeException("Operation not found"));

            mockMvc.perform(post("/api/operations/999/unblock")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            mockMvc.perform(post("/api/operations/1/unblock")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized());
        }
    }
}
