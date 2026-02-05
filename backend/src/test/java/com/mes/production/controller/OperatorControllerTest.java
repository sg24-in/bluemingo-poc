package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.OperatorDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.security.JwtService;
import com.mes.production.service.OperatorService;
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
class OperatorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OperatorService operatorService;

    @MockBean
    private JwtService jwtService;

    private OperatorDTO testOperator;

    @BeforeEach
    void setUp() {
        testOperator = OperatorDTO.builder()
                .operatorId(1L)
                .operatorCode("OP-001")
                .name("John Smith")
                .department("Production")
                .shift("DAY")
                .status("ACTIVE")
                .build();
    }

    @Test
    @DisplayName("Should get all operators")
    @WithMockUser(username = "admin@mes.com")
    void getAllOperators_ReturnsOperators() throws Exception {
        when(operatorService.getAllOperators()).thenReturn(List.of(testOperator));

        mockMvc.perform(get("/api/operators"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].operatorId").value(1))
                .andExpect(jsonPath("$[0].operatorCode").value("OP-001"))
                .andExpect(jsonPath("$[0].name").value("John Smith"))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));

        verify(operatorService, times(1)).getAllOperators();
    }

    @Test
    @DisplayName("Should get active operators")
    @WithMockUser(username = "admin@mes.com")
    void getActiveOperators_ReturnsActiveOnly() throws Exception {
        when(operatorService.getActiveOperators()).thenReturn(List.of(testOperator));

        mockMvc.perform(get("/api/operators/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));

        verify(operatorService, times(1)).getActiveOperators();
    }

    @Test
    @DisplayName("Should get operator by ID")
    @WithMockUser(username = "admin@mes.com")
    void getOperatorById_ReturnsOperator() throws Exception {
        when(operatorService.getOperatorById(1L)).thenReturn(testOperator);

        mockMvc.perform(get("/api/operators/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operatorId").value(1))
                .andExpect(jsonPath("$.operatorCode").value("OP-001"))
                .andExpect(jsonPath("$.name").value("John Smith"));

        verify(operatorService, times(1)).getOperatorById(1L);
    }

    @Test
    @DisplayName("Should return bad request when operator not found")
    @WithMockUser(username = "admin@mes.com")
    void getOperatorById_NotFound_ReturnsBadRequest() throws Exception {
        when(operatorService.getOperatorById(999L))
                .thenThrow(new RuntimeException("Operator not found"));

        mockMvc.perform(get("/api/operators/999"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void getAllOperators_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/operators"))
                .andExpect(status().isUnauthorized());
    }

    @Nested
    @DisplayName("Paginated Operators Tests")
    class PaginatedOperatorsTests {

        @Test
        @DisplayName("Should get paginated operators")
        @WithMockUser(username = "admin@mes.com")
        void getOperatorsPaged_ReturnsPagedResult() throws Exception {
            PagedResponseDTO<OperatorDTO> pagedResponse = PagedResponseDTO.<OperatorDTO>builder()
                    .content(List.of(testOperator))
                    .page(0)
                    .size(20)
                    .totalElements(1)
                    .totalPages(1)
                    .hasNext(false)
                    .hasPrevious(false)
                    .build();

            when(operatorService.getOperatorsPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/operators/paged")
                            .param("page", "0")
                            .param("size", "20")
                            .param("sortBy", "operatorCode")
                            .param("sortDirection", "ASC"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].operatorId").value(1))
                    .andExpect(jsonPath("$.content[0].operatorCode").value("OP-001"))
                    .andExpect(jsonPath("$.totalElements").value(1))
                    .andExpect(jsonPath("$.page").value(0));

            verify(operatorService, times(1)).getOperatorsPaged(any(PageRequestDTO.class));
        }

        @Test
        @DisplayName("Should get paginated operators with status filter")
        @WithMockUser(username = "admin@mes.com")
        void getOperatorsPaged_WithStatusFilter_ReturnsFiltered() throws Exception {
            PagedResponseDTO<OperatorDTO> pagedResponse = PagedResponseDTO.<OperatorDTO>builder()
                    .content(List.of(testOperator))
                    .page(0)
                    .size(20)
                    .totalElements(1)
                    .totalPages(1)
                    .hasNext(false)
                    .hasPrevious(false)
                    .build();

            when(operatorService.getOperatorsPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/operators/paged")
                            .param("page", "0")
                            .param("size", "20")
                            .param("status", "ACTIVE"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].status").value("ACTIVE"));

            verify(operatorService, times(1)).getOperatorsPaged(any(PageRequestDTO.class));
        }

        @Test
        @DisplayName("Should get paginated operators with search")
        @WithMockUser(username = "admin@mes.com")
        void getOperatorsPaged_WithSearch_ReturnsFiltered() throws Exception {
            PagedResponseDTO<OperatorDTO> pagedResponse = PagedResponseDTO.<OperatorDTO>builder()
                    .content(List.of(testOperator))
                    .page(0)
                    .size(20)
                    .totalElements(1)
                    .totalPages(1)
                    .hasNext(false)
                    .hasPrevious(false)
                    .build();

            when(operatorService.getOperatorsPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/operators/paged")
                            .param("page", "0")
                            .param("size", "20")
                            .param("search", "Smith"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].name").value("John Smith"));

            verify(operatorService, times(1)).getOperatorsPaged(any(PageRequestDTO.class));
        }
    }

    @Nested
    @DisplayName("Create Operator Tests")
    class CreateOperatorTests {

        @Test
        @DisplayName("Should create operator successfully")
        @WithMockUser(username = "admin@mes.com")
        void createOperator_ValidData_ReturnsCreated() throws Exception {
            OperatorDTO request = OperatorDTO.builder()
                    .operatorCode("OP-002")
                    .name("Jane Doe")
                    .department("Quality")
                    .shift("NIGHT")
                    .build();

            OperatorDTO created = OperatorDTO.builder()
                    .operatorId(2L)
                    .operatorCode("OP-002")
                    .name("Jane Doe")
                    .department("Quality")
                    .shift("NIGHT")
                    .status("ACTIVE")
                    .build();

            when(operatorService.createOperator(any(OperatorDTO.class))).thenReturn(created);

            mockMvc.perform(post("/api/operators")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.operatorId").value(2))
                    .andExpect(jsonPath("$.operatorCode").value("OP-002"))
                    .andExpect(jsonPath("$.name").value("Jane Doe"));

            verify(operatorService).createOperator(any(OperatorDTO.class));
        }

        @Test
        @DisplayName("Should return bad request for invalid data")
        @WithMockUser(username = "admin@mes.com")
        void createOperator_InvalidData_ReturnsBadRequest() throws Exception {
            OperatorDTO request = OperatorDTO.builder()
                    .operatorCode("")  // Invalid - blank
                    .name("")          // Invalid - blank
                    .build();

            mockMvc.perform(post("/api/operators")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return bad request for duplicate operator code")
        @WithMockUser(username = "admin@mes.com")
        void createOperator_DuplicateCode_ReturnsBadRequest() throws Exception {
            OperatorDTO request = OperatorDTO.builder()
                    .operatorCode("OP-001")
                    .name("Duplicate")
                    .build();

            when(operatorService.createOperator(any(OperatorDTO.class)))
                    .thenThrow(new RuntimeException("Operator code already exists"));

            mockMvc.perform(post("/api/operators")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Update Operator Tests")
    class UpdateOperatorTests {

        @Test
        @DisplayName("Should update operator successfully")
        @WithMockUser(username = "admin@mes.com")
        void updateOperator_ValidData_ReturnsOk() throws Exception {
            OperatorDTO request = OperatorDTO.builder()
                    .operatorCode("OP-001")
                    .name("John Smith Updated")
                    .department("Quality")
                    .shift("NIGHT")
                    .build();

            OperatorDTO updated = OperatorDTO.builder()
                    .operatorId(1L)
                    .operatorCode("OP-001")
                    .name("John Smith Updated")
                    .department("Quality")
                    .shift("NIGHT")
                    .status("ACTIVE")
                    .build();

            when(operatorService.updateOperator(eq(1L), any(OperatorDTO.class))).thenReturn(updated);

            mockMvc.perform(put("/api/operators/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("John Smith Updated"))
                    .andExpect(jsonPath("$.department").value("Quality"));

            verify(operatorService).updateOperator(eq(1L), any(OperatorDTO.class));
        }

        @Test
        @DisplayName("Should return bad request for non-existent operator")
        @WithMockUser(username = "admin@mes.com")
        void updateOperator_NotFound_ReturnsBadRequest() throws Exception {
            OperatorDTO request = OperatorDTO.builder()
                    .operatorCode("OP-999")
                    .name("Not Found")
                    .build();

            when(operatorService.updateOperator(eq(999L), any(OperatorDTO.class)))
                    .thenThrow(new RuntimeException("Operator not found"));

            mockMvc.perform(put("/api/operators/999")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Delete Operator Tests")
    class DeleteOperatorTests {

        @Test
        @DisplayName("Should delete operator successfully")
        @WithMockUser(username = "admin@mes.com")
        void deleteOperator_ValidId_ReturnsOk() throws Exception {
            doNothing().when(operatorService).deleteOperator(1L);

            mockMvc.perform(delete("/api/operators/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Operator deleted successfully"));

            verify(operatorService).deleteOperator(1L);
        }

        @Test
        @DisplayName("Should return bad request when operator not found for delete")
        @WithMockUser(username = "admin@mes.com")
        void deleteOperator_NotFound_ReturnsBadRequest() throws Exception {
            doThrow(new RuntimeException("Operator not found"))
                    .when(operatorService).deleteOperator(999L);

            mockMvc.perform(delete("/api/operators/999"))
                    .andExpect(status().isBadRequest());
        }
    }
}
