package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.HoldDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.security.JwtService;
import com.mes.production.service.HoldService;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class HoldControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private HoldService holdService;

    @MockBean
    private JwtService jwtService;

    private HoldDTO.ApplyHoldRequest applyRequest;
    private HoldDTO.HoldResponse holdResponse;

    @BeforeEach
    void setUp() {
        applyRequest = HoldDTO.ApplyHoldRequest.builder()
                .entityType("OPERATION")
                .entityId(1L)
                .reason("Equipment Breakdown")
                .comments("Furnace malfunction")
                .build();

        holdResponse = HoldDTO.HoldResponse.builder()
                .holdId(1L)
                .entityType("OPERATION")
                .entityId(1L)
                .entityName("Melt Iron")
                .reason("Equipment Breakdown")
                .status("ACTIVE")
                .appliedBy("admin@mes.com")
                .appliedOn(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should apply hold successfully")
    @WithMockUser(username = "admin@mes.com")
    void applyHold_ValidRequest_ReturnsSuccess() throws Exception {
        when(holdService.applyHold(any(HoldDTO.ApplyHoldRequest.class), anyString()))
                .thenReturn(holdResponse);

        mockMvc.perform(post("/api/holds")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(applyRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.holdId").value(1))
                .andExpect(jsonPath("$.entityType").value("OPERATION"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        verify(holdService, times(1)).applyHold(any(), eq("admin@mes.com"));
    }

    @Test
    @DisplayName("Should release hold successfully")
    @WithMockUser(username = "admin@mes.com")
    void releaseHold_ValidRequest_ReturnsSuccess() throws Exception {
        HoldDTO.ReleaseHoldRequest releaseRequest = HoldDTO.ReleaseHoldRequest.builder()
                .releaseComments("Issue resolved")
                .build();

        HoldDTO.HoldResponse releasedResponse = HoldDTO.HoldResponse.builder()
                .holdId(1L)
                .entityType("OPERATION")
                .entityId(1L)
                .status("RELEASED")
                .releaseComments("Issue resolved")
                .releasedBy("admin@mes.com")
                .releasedOn(LocalDateTime.now())
                .build();

        when(holdService.releaseHold(eq(1L), any(), anyString()))
                .thenReturn(releasedResponse);

        mockMvc.perform(put("/api/holds/1/release")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(releaseRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.holdId").value(1))
                .andExpect(jsonPath("$.status").value("RELEASED"));

        verify(holdService, times(1)).releaseHold(eq(1L), any(), eq("admin@mes.com"));
    }

    @Test
    @DisplayName("Should get active holds")
    @WithMockUser(username = "admin@mes.com")
    void getActiveHolds_ReturnsHolds() throws Exception {
        when(holdService.getActiveHolds()).thenReturn(List.of(holdResponse));

        mockMvc.perform(get("/api/holds/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].holdId").value(1))
                .andExpect(jsonPath("$[0].entityType").value("OPERATION"));

        verify(holdService, times(1)).getActiveHolds();
    }

    @Test
    @DisplayName("Should get active hold count")
    @WithMockUser(username = "admin@mes.com")
    void getActiveHoldCount_ReturnsCount() throws Exception {
        when(holdService.getActiveHoldCount()).thenReturn(5L);

        mockMvc.perform(get("/api/holds/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeHolds").value(5));

        verify(holdService, times(1)).getActiveHoldCount();
    }

    @Test
    @DisplayName("Should check if entity is on hold")
    @WithMockUser(username = "admin@mes.com")
    void checkEntityOnHold_ReturnsStatus() throws Exception {
        when(holdService.isEntityOnHold("OPERATION", 1L)).thenReturn(true);

        mockMvc.perform(get("/api/holds/check/OPERATION/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.onHold").value(true));

        verify(holdService, times(1)).isEntityOnHold("OPERATION", 1L);
    }

    @Test
    @DisplayName("Should get holds by entity")
    @WithMockUser(username = "admin@mes.com")
    void getHoldsByEntity_ReturnsHolds() throws Exception {
        when(holdService.getHoldsByEntity("OPERATION", 1L)).thenReturn(List.of(holdResponse));

        mockMvc.perform(get("/api/holds/entity/OPERATION/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].holdId").value(1));

        verify(holdService, times(1)).getHoldsByEntity("OPERATION", 1L);
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void applyHold_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(post("/api/holds")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(applyRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should handle already on hold exception")
    @WithMockUser(username = "admin@mes.com")
    void applyHold_AlreadyOnHold_ReturnsError() throws Exception {
        when(holdService.applyHold(any(), anyString()))
                .thenThrow(new RuntimeException("Entity is already on hold"));

        mockMvc.perform(post("/api/holds")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(applyRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should get paginated holds")
    @WithMockUser(username = "admin@mes.com")
    void getHoldsPaged_ReturnsPagedResult() throws Exception {
        PagedResponseDTO<HoldDTO.HoldResponse> pagedResponse = PagedResponseDTO.<HoldDTO.HoldResponse>builder()
                .content(List.of(holdResponse))
                .page(0)
                .size(20)
                .totalElements(1)
                .totalPages(1)
                .hasNext(false)
                .hasPrevious(false)
                .build();

        when(holdService.getHoldsPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

        mockMvc.perform(get("/api/holds/paged")
                        .param("page", "0")
                        .param("size", "20")
                        .param("sortBy", "appliedOn")
                        .param("sortDirection", "DESC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].holdId").value(1))
                .andExpect(jsonPath("$.content[0].entityType").value("OPERATION"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.page").value(0));

        verify(holdService, times(1)).getHoldsPaged(any(PageRequestDTO.class));
    }

    @Test
    @DisplayName("Should get paginated holds with status filter")
    @WithMockUser(username = "admin@mes.com")
    void getHoldsPaged_WithStatusFilter_ReturnsFiltered() throws Exception {
        PagedResponseDTO<HoldDTO.HoldResponse> pagedResponse = PagedResponseDTO.<HoldDTO.HoldResponse>builder()
                .content(List.of(holdResponse))
                .page(0)
                .size(20)
                .totalElements(1)
                .totalPages(1)
                .hasNext(false)
                .hasPrevious(false)
                .build();

        when(holdService.getHoldsPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

        mockMvc.perform(get("/api/holds/paged")
                        .param("page", "0")
                        .param("size", "20")
                        .param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("ACTIVE"));

        verify(holdService, times(1)).getHoldsPaged(any(PageRequestDTO.class));
    }

    @Test
    @DisplayName("Should get paginated holds with entity type filter")
    @WithMockUser(username = "admin@mes.com")
    void getHoldsPaged_WithEntityTypeFilter_ReturnsFiltered() throws Exception {
        PagedResponseDTO<HoldDTO.HoldResponse> pagedResponse = PagedResponseDTO.<HoldDTO.HoldResponse>builder()
                .content(List.of(holdResponse))
                .page(0)
                .size(20)
                .totalElements(1)
                .totalPages(1)
                .hasNext(false)
                .hasPrevious(false)
                .build();

        when(holdService.getHoldsPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

        mockMvc.perform(get("/api/holds/paged")
                        .param("page", "0")
                        .param("size", "20")
                        .param("type", "OPERATION"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].entityType").value("OPERATION"));

        verify(holdService, times(1)).getHoldsPaged(any(PageRequestDTO.class));
    }

    @Test
    @DisplayName("Should get paginated holds with search")
    @WithMockUser(username = "admin@mes.com")
    void getHoldsPaged_WithSearch_ReturnsFiltered() throws Exception {
        PagedResponseDTO<HoldDTO.HoldResponse> pagedResponse = PagedResponseDTO.<HoldDTO.HoldResponse>builder()
                .content(List.of(holdResponse))
                .page(0)
                .size(20)
                .totalElements(1)
                .totalPages(1)
                .hasNext(false)
                .hasPrevious(false)
                .build();

        when(holdService.getHoldsPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

        mockMvc.perform(get("/api/holds/paged")
                        .param("page", "0")
                        .param("size", "20")
                        .param("search", "Breakdown"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].reason").value("Equipment Breakdown"));

        verify(holdService, times(1)).getHoldsPaged(any(PageRequestDTO.class));
    }
}
