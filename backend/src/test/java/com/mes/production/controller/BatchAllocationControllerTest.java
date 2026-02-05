package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.BatchAllocationDTO;
import com.mes.production.entity.Batch;
import com.mes.production.entity.BatchOrderAllocation;
import com.mes.production.entity.Order;
import com.mes.production.entity.OrderLineItem;
import com.mes.production.repository.BatchRepository;
import com.mes.production.security.JwtService;
import com.mes.production.service.BatchAllocationService;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
class BatchAllocationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BatchAllocationService allocationService;

    @MockBean
    private BatchRepository batchRepository;

    @MockBean
    private JwtService jwtService;

    private Batch testBatch;
    private OrderLineItem testOrderLine;
    private BatchOrderAllocation testAllocation;

    @BeforeEach
    void setUp() {
        testBatch = new Batch();
        testBatch.setBatchId(1L);
        testBatch.setBatchNumber("BATCH-001");
        testBatch.setMaterialId("IM-001");
        testBatch.setMaterialName("Steel Billet");
        testBatch.setQuantity(new BigDecimal("500.00"));
        testBatch.setUnit("KG");
        testBatch.setStatus("AVAILABLE");

        Order testOrder = new Order();
        testOrder.setOrderId(1L);
        testOrder.setOrderNumber("ORD-001");

        testOrderLine = new OrderLineItem();
        testOrderLine.setOrderLineId(1L);
        testOrderLine.setProductSku("PROD-001");
        testOrderLine.setProductName("Steel Rod");
        testOrderLine.setOrder(testOrder);

        testAllocation = new BatchOrderAllocation();
        testAllocation.setAllocationId(1L);
        testAllocation.setBatch(testBatch);
        testAllocation.setOrderLineItem(testOrderLine);
        testAllocation.setAllocatedQty(new BigDecimal("100.00"));
        testAllocation.setStatus("ACTIVE");
        testAllocation.setTimestamp(LocalDateTime.now());
        testAllocation.setCreatedBy("admin@mes.com");
    }

    @Test
    @DisplayName("Should allocate batch to order line")
    @WithMockUser(username = "admin@mes.com")
    void allocate_ValidRequest_ReturnsAllocation() throws Exception {
        BatchAllocationDTO.AllocateRequest request = BatchAllocationDTO.AllocateRequest.builder()
                .batchId(1L)
                .orderLineId(1L)
                .quantity(new BigDecimal("100.00"))
                .build();

        when(allocationService.allocateBatchToOrder(eq(1L), eq(1L), any(BigDecimal.class)))
                .thenReturn(testAllocation);

        mockMvc.perform(post("/api/batch-allocations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allocationId").value(1))
                .andExpect(jsonPath("$.batchId").value(1))
                .andExpect(jsonPath("$.batchNumber").value("BATCH-001"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        verify(allocationService, times(1)).allocateBatchToOrder(eq(1L), eq(1L), any(BigDecimal.class));
    }

    @Test
    @DisplayName("Should release allocation")
    @WithMockUser(username = "admin@mes.com")
    void release_ValidId_ReturnsReleasedAllocation() throws Exception {
        testAllocation.setStatus("RELEASED");
        when(allocationService.releaseAllocation(1L)).thenReturn(testAllocation);

        mockMvc.perform(put("/api/batch-allocations/1/release"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allocationId").value(1))
                .andExpect(jsonPath("$.status").value("RELEASED"));

        verify(allocationService, times(1)).releaseAllocation(1L);
    }

    @Test
    @DisplayName("Should update allocation quantity")
    @WithMockUser(username = "admin@mes.com")
    void updateQuantity_ValidRequest_ReturnsUpdatedAllocation() throws Exception {
        BatchAllocationDTO.UpdateQuantityRequest request = BatchAllocationDTO.UpdateQuantityRequest.builder()
                .quantity(new BigDecimal("150.00"))
                .build();

        testAllocation.setAllocatedQty(new BigDecimal("150.00"));
        when(allocationService.updateAllocationQuantity(eq(1L), any(BigDecimal.class)))
                .thenReturn(testAllocation);

        mockMvc.perform(put("/api/batch-allocations/1/quantity")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allocationId").value(1))
                .andExpect(jsonPath("$.allocatedQty").value(150.00));

        verify(allocationService, times(1)).updateAllocationQuantity(eq(1L), any(BigDecimal.class));
    }

    @Test
    @DisplayName("Should get allocations for a batch")
    @WithMockUser(username = "admin@mes.com")
    void getBatchAllocations_ValidBatchId_ReturnsAllocations() throws Exception {
        when(allocationService.getBatchAllocations(1L)).thenReturn(List.of(testAllocation));

        mockMvc.perform(get("/api/batch-allocations/batch/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].allocationId").value(1))
                .andExpect(jsonPath("$[0].batchId").value(1))
                .andExpect(jsonPath("$[0].batchNumber").value("BATCH-001"));

        verify(allocationService, times(1)).getBatchAllocations(1L);
    }

    @Test
    @DisplayName("Should get allocations for an order line")
    @WithMockUser(username = "admin@mes.com")
    void getOrderLineAllocations_ValidOrderLineId_ReturnsAllocations() throws Exception {
        when(allocationService.getOrderLineAllocations(1L)).thenReturn(List.of(testAllocation));

        mockMvc.perform(get("/api/batch-allocations/order-line/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].allocationId").value(1))
                .andExpect(jsonPath("$[0].orderLineId").value(1))
                .andExpect(jsonPath("$[0].productSku").value("PROD-001"));

        verify(allocationService, times(1)).getOrderLineAllocations(1L);
    }

    @Test
    @DisplayName("Should get batch availability")
    @WithMockUser(username = "admin@mes.com")
    void getBatchAvailability_ValidBatchId_ReturnsAvailability() throws Exception {
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(allocationService.getTotalAllocatedForBatch(1L)).thenReturn(new BigDecimal("100.00"));
        when(allocationService.getAvailableQuantityForBatch(1L)).thenReturn(new BigDecimal("400.00"));
        when(allocationService.isBatchFullyAllocated(1L)).thenReturn(false);

        mockMvc.perform(get("/api/batch-allocations/batch/1/availability"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.batchId").value(1))
                .andExpect(jsonPath("$.batchNumber").value("BATCH-001"))
                .andExpect(jsonPath("$.totalQuantity").value(500.00))
                .andExpect(jsonPath("$.allocatedQuantity").value(100.00))
                .andExpect(jsonPath("$.availableQuantity").value(400.00))
                .andExpect(jsonPath("$.fullyAllocated").value(false));

        verify(batchRepository, times(1)).findById(1L);
        verify(allocationService, times(1)).getTotalAllocatedForBatch(1L);
        verify(allocationService, times(1)).getAvailableQuantityForBatch(1L);
        verify(allocationService, times(1)).isBatchFullyAllocated(1L);
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void allocate_NotAuthenticated_Returns401() throws Exception {
        BatchAllocationDTO.AllocateRequest request = BatchAllocationDTO.AllocateRequest.builder()
                .batchId(1L)
                .orderLineId(1L)
                .quantity(new BigDecimal("100.00"))
                .build();

        mockMvc.perform(post("/api/batch-allocations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should return empty list when no allocations for batch")
    @WithMockUser(username = "admin@mes.com")
    void getBatchAllocations_NoAllocations_ReturnsEmptyList() throws Exception {
        when(allocationService.getBatchAllocations(999L)).thenReturn(List.of());

        mockMvc.perform(get("/api/batch-allocations/batch/999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());

        verify(allocationService, times(1)).getBatchAllocations(999L);
    }

    @Test
    @DisplayName("Should handle batch not found for availability")
    @WithMockUser(username = "admin@mes.com")
    void getBatchAvailability_BatchNotFound_ReturnsError() throws Exception {
        when(batchRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/batch-allocations/batch/999/availability"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return fully allocated status")
    @WithMockUser(username = "admin@mes.com")
    void getBatchAvailability_FullyAllocated_ReturnsTrue() throws Exception {
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(allocationService.getTotalAllocatedForBatch(1L)).thenReturn(new BigDecimal("500.00"));
        when(allocationService.getAvailableQuantityForBatch(1L)).thenReturn(BigDecimal.ZERO);
        when(allocationService.isBatchFullyAllocated(1L)).thenReturn(true);

        mockMvc.perform(get("/api/batch-allocations/batch/1/availability"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullyAllocated").value(true))
                .andExpect(jsonPath("$.availableQuantity").value(0));
    }
}
