package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.entity.BatchSizeConfig;
import com.mes.production.repository.BatchSizeConfigRepository;
import com.mes.production.security.JwtService;
import com.mes.production.service.AuditService;
import com.mes.production.service.BatchSizeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.mes.production.config.TestSecurityConfig;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class BatchSizeConfigControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BatchSizeConfigRepository repository;

    @MockBean
    private BatchSizeService batchSizeService;

    @MockBean
    private AuditService auditService;

    @MockBean
    private JwtService jwtService;

    private BatchSizeConfig testConfig;

    @BeforeEach
    void setUp() {
        testConfig = BatchSizeConfig.builder()
                .configId(1L)
                .operationType("FURNACE")
                .materialId("MAT-001")
                .minBatchSize(new BigDecimal("10.0000"))
                .maxBatchSize(new BigDecimal("100.0000"))
                .preferredBatchSize(new BigDecimal("50.0000"))
                .unit("T")
                .allowPartialBatch(true)
                .isActive(true)
                .priority(1)
                .build();
    }

    @Nested
    @DisplayName("GET /api/batch-size-config/paged")
    class GetPagedTests {

        @Test
        @DisplayName("Should return paginated batch size configs")
        @WithMockUser(username = "admin@mes.com")
        void getPaged_ReturnsPagedResponse() throws Exception {
            Page<BatchSizeConfig> page = new PageImpl<>(
                    List.of(testConfig),
                    PageRequest.of(0, 20),
                    1
            );

            when(repository.findByFilters(any(), any(), any(), any(), any(Pageable.class)))
                    .thenReturn(page);

            mockMvc.perform(get("/api/batch-size-config/paged")
                            .param("page", "0")
                            .param("size", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].configId").value(1))
                    .andExpect(jsonPath("$.content[0].operationType").value("FURNACE"))
                    .andExpect(jsonPath("$.totalElements").value(1))
                    .andExpect(jsonPath("$.totalPages").value(1));

            verify(repository).findByFilters(any(), any(), any(), any(), any(Pageable.class));
        }

        @Test
        @DisplayName("Should filter by search term")
        @WithMockUser(username = "admin@mes.com")
        void getPaged_WithSearch_FiltersResults() throws Exception {
            Page<BatchSizeConfig> page = new PageImpl<>(
                    List.of(testConfig),
                    PageRequest.of(0, 20),
                    1
            );

            when(repository.findByFilters(any(), any(), any(), eq("%furnace%"), any(Pageable.class)))
                    .thenReturn(page);

            mockMvc.perform(get("/api/batch-size-config/paged")
                            .param("page", "0")
                            .param("size", "20")
                            .param("search", "furnace"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isNotEmpty());
        }

        @Test
        @DisplayName("Should filter by active status")
        @WithMockUser(username = "admin@mes.com")
        void getPaged_WithActiveFilter_ReturnsFiltered() throws Exception {
            Page<BatchSizeConfig> page = new PageImpl<>(
                    List.of(testConfig),
                    PageRequest.of(0, 20),
                    1
            );

            when(repository.findByFilters(any(), any(), eq(true), any(), any(Pageable.class)))
                    .thenReturn(page);

            mockMvc.perform(get("/api/batch-size-config/paged")
                            .param("page", "0")
                            .param("size", "20")
                            .param("isActive", "true"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].isActive").value(true));
        }

        @Test
        @DisplayName("Should return empty page when no configs match")
        @WithMockUser(username = "admin@mes.com")
        void getPaged_NoMatch_ReturnsEmptyPage() throws Exception {
            Page<BatchSizeConfig> emptyPage = new PageImpl<>(
                    List.of(),
                    PageRequest.of(0, 20),
                    0
            );

            when(repository.findByFilters(any(), any(), any(), any(), any(Pageable.class)))
                    .thenReturn(emptyPage);

            mockMvc.perform(get("/api/batch-size-config/paged")
                            .param("page", "0")
                            .param("size", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isEmpty())
                    .andExpect(jsonPath("$.totalElements").value(0));
        }
    }

    @Nested
    @DisplayName("GET /api/batch-size-config")
    class GetAllTests {

        @Test
        @DisplayName("Should get all batch size configs")
        @WithMockUser(username = "admin@mes.com")
        void getAll_ReturnsConfigs() throws Exception {
            when(repository.findAll()).thenReturn(List.of(testConfig));

            mockMvc.perform(get("/api/batch-size-config"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].configId").value(1))
                    .andExpect(jsonPath("$[0].operationType").value("FURNACE"));

            verify(repository).findAll();
        }
    }

    @Nested
    @DisplayName("GET /api/batch-size-config/{id}")
    class GetByIdTests {

        @Test
        @DisplayName("Should get config by ID")
        @WithMockUser(username = "admin@mes.com")
        void getById_ValidId_ReturnsConfig() throws Exception {
            when(repository.findById(1L)).thenReturn(Optional.of(testConfig));

            mockMvc.perform(get("/api/batch-size-config/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.configId").value(1));

            verify(repository).findById(1L);
        }

        @Test
        @DisplayName("Should return 404 for non-existent ID")
        @WithMockUser(username = "admin@mes.com")
        void getById_NotFound_Returns404() throws Exception {
            when(repository.findById(999L)).thenReturn(Optional.empty());

            mockMvc.perform(get("/api/batch-size-config/999"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("POST /api/batch-size-config")
    class CreateTests {

        @Test
        @DisplayName("Should create batch size config")
        @WithMockUser(username = "admin@mes.com")
        void create_ValidData_ReturnsOk() throws Exception {
            BatchSizeConfig newConfig = BatchSizeConfig.builder()
                    .operationType("CASTER")
                    .maxBatchSize(new BigDecimal("200.0000"))
                    .unit("T")
                    .build();

            when(repository.save(any(BatchSizeConfig.class))).thenReturn(testConfig);

            mockMvc.perform(post("/api/batch-size-config")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(newConfig)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.configId").value(1));
        }

        @Test
        @DisplayName("Should reject when max batch size is zero")
        @WithMockUser(username = "admin@mes.com")
        void create_ZeroMaxSize_ReturnsBadRequest() throws Exception {
            BatchSizeConfig invalid = BatchSizeConfig.builder()
                    .operationType("CASTER")
                    .maxBatchSize(BigDecimal.ZERO)
                    .build();

            mockMvc.perform(post("/api/batch-size-config")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalid)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").exists());
        }

        @Test
        @DisplayName("Should reject when min > max batch size")
        @WithMockUser(username = "admin@mes.com")
        void create_MinGreaterThanMax_ReturnsBadRequest() throws Exception {
            BatchSizeConfig invalid = BatchSizeConfig.builder()
                    .operationType("CASTER")
                    .minBatchSize(new BigDecimal("200.0000"))
                    .maxBatchSize(new BigDecimal("100.0000"))
                    .build();

            mockMvc.perform(post("/api/batch-size-config")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalid)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").exists());
        }
    }

    @Nested
    @DisplayName("DELETE /api/batch-size-config/{id}")
    class DeleteTests {

        @Test
        @DisplayName("Should deactivate batch size config")
        @WithMockUser(username = "admin@mes.com")
        void delete_ValidId_Deactivates() throws Exception {
            when(repository.findById(1L)).thenReturn(Optional.of(testConfig));
            when(repository.save(any(BatchSizeConfig.class))).thenReturn(testConfig);

            mockMvc.perform(delete("/api/batch-size-config/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").exists());
        }

        @Test
        @DisplayName("Should return 404 for non-existent config")
        @WithMockUser(username = "admin@mes.com")
        void delete_NotFound_Returns404() throws Exception {
            when(repository.findById(999L)).thenReturn(Optional.empty());

            mockMvc.perform(delete("/api/batch-size-config/999"))
                    .andExpect(status().isNotFound());
        }
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void getConfigs_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/batch-size-config"))
                .andExpect(status().isUnauthorized());
    }
}
