package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.InventoryDTO;
import com.mes.production.security.JwtService;
import com.mes.production.service.InventoryService;
import com.mes.production.service.ReceiveMaterialService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.http.MediaType;
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
class InventoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private InventoryService inventoryService;

    @MockBean
    private ReceiveMaterialService receiveMaterialService;

    @MockBean
    private JwtService jwtService;

    private InventoryDTO testInventory;

    @BeforeEach
    void setUp() {
        testInventory = InventoryDTO.builder()
                .inventoryId(1L)
                .materialId("RM-001")
                .materialName("Iron Ore")
                .inventoryType("RM")
                .state("AVAILABLE")
                .quantity(new BigDecimal("100.00"))
                .unit("KG")
                .location("WH-01")
                .batchId(1L)
                .batchNumber("BATCH-001")
                .build();
    }

    @Test
    @DisplayName("Should get all inventory")
    @WithMockUser(username = "admin@mes.com")
    void getAllInventory_ReturnsInventory() throws Exception {
        when(inventoryService.getAllInventory()).thenReturn(List.of(testInventory));

        mockMvc.perform(get("/api/inventory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].inventoryId").value(1))
                .andExpect(jsonPath("$[0].materialId").value("RM-001"))
                .andExpect(jsonPath("$[0].state").value("AVAILABLE"));

        verify(inventoryService, times(1)).getAllInventory();
    }

    @Test
    @DisplayName("Should get available inventory for consumption")
    @WithMockUser(username = "admin@mes.com")
    void getAvailableForConsumption_ReturnsAvailable() throws Exception {
        when(inventoryService.getAvailableForConsumption()).thenReturn(List.of(testInventory));

        mockMvc.perform(get("/api/inventory/available"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].inventoryId").value(1))
                .andExpect(jsonPath("$[0].state").value("AVAILABLE"));

        verify(inventoryService, times(1)).getAvailableForConsumption();
    }

    @Test
    @DisplayName("Should get available inventory by material ID")
    @WithMockUser(username = "admin@mes.com")
    void getAvailableByMaterialId_ReturnsFiltered() throws Exception {
        when(inventoryService.getAvailableByMaterialId("RM-001")).thenReturn(List.of(testInventory));

        mockMvc.perform(get("/api/inventory/available")
                        .param("materialId", "RM-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].materialId").value("RM-001"));

        verify(inventoryService, times(1)).getAvailableByMaterialId("RM-001");
    }

    @Test
    @DisplayName("Should get inventory by state")
    @WithMockUser(username = "admin@mes.com")
    void getInventoryByState_ReturnsFiltered() throws Exception {
        when(inventoryService.getInventoryByState("AVAILABLE")).thenReturn(List.of(testInventory));

        mockMvc.perform(get("/api/inventory/state/AVAILABLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].state").value("AVAILABLE"));

        verify(inventoryService, times(1)).getInventoryByState("AVAILABLE");
    }

    @Test
    @DisplayName("Should get inventory by type")
    @WithMockUser(username = "admin@mes.com")
    void getInventoryByType_ReturnsFiltered() throws Exception {
        when(inventoryService.getInventoryByType("RM")).thenReturn(List.of(testInventory));

        mockMvc.perform(get("/api/inventory/type/RM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].inventoryType").value("RM"));

        verify(inventoryService, times(1)).getInventoryByType("RM");
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void getAllInventory_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/inventory"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should return empty list when no inventory")
    @WithMockUser(username = "admin@mes.com")
    void getAllInventory_NoInventory_ReturnsEmptyList() throws Exception {
        when(inventoryService.getAllInventory()).thenReturn(List.of());

        mockMvc.perform(get("/api/inventory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("Should get inventory by ID")
    @WithMockUser(username = "admin@mes.com")
    void getInventoryById_ReturnsInventory() throws Exception {
        when(inventoryService.getInventoryById(1L)).thenReturn(testInventory);

        mockMvc.perform(get("/api/inventory/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inventoryId").value(1))
                .andExpect(jsonPath("$.materialId").value("RM-001"));

        verify(inventoryService, times(1)).getInventoryById(1L);
    }

    @Test
    @DisplayName("Should get blocked inventory")
    @WithMockUser(username = "admin@mes.com")
    void getBlockedInventory_ReturnsBlockedOnly() throws Exception {
        InventoryDTO blockedInventory = InventoryDTO.builder()
                .inventoryId(2L)
                .materialId("RM-002")
                .state("BLOCKED")
                .blockReason("Quality issue")
                .blockedBy("admin@mes.com")
                .build();
        when(inventoryService.getBlockedInventory()).thenReturn(List.of(blockedInventory));

        mockMvc.perform(get("/api/inventory/blocked"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].state").value("BLOCKED"))
                .andExpect(jsonPath("$[0].blockReason").value("Quality issue"));

        verify(inventoryService, times(1)).getBlockedInventory();
    }

    @Test
    @DisplayName("Should get scrapped inventory")
    @WithMockUser(username = "admin@mes.com")
    void getScrappedInventory_ReturnsScrappedOnly() throws Exception {
        InventoryDTO scrappedInventory = InventoryDTO.builder()
                .inventoryId(3L)
                .materialId("RM-003")
                .state("SCRAPPED")
                .scrapReason("Damaged")
                .scrappedBy("admin@mes.com")
                .build();
        when(inventoryService.getScrappedInventory()).thenReturn(List.of(scrappedInventory));

        mockMvc.perform(get("/api/inventory/scrapped"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].state").value("SCRAPPED"))
                .andExpect(jsonPath("$[0].scrapReason").value("Damaged"));

        verify(inventoryService, times(1)).getScrappedInventory();
    }

    @Test
    @DisplayName("Should block inventory")
    @WithMockUser(username = "admin@mes.com")
    void blockInventory_ValidRequest_BlocksSuccessfully() throws Exception {
        InventoryDTO.StateUpdateResponse response = InventoryDTO.StateUpdateResponse.builder()
                .inventoryId(1L)
                .previousState("AVAILABLE")
                .newState("BLOCKED")
                .message("Inventory blocked. Reason: Quality issue")
                .updatedBy("admin@mes.com")
                .updatedOn(LocalDateTime.now())
                .build();
        when(inventoryService.blockInventory(eq(1L), eq("Quality issue"))).thenReturn(response);

        InventoryDTO.BlockRequest request = InventoryDTO.BlockRequest.builder()
                .inventoryId(1L)
                .reason("Quality issue")
                .build();

        mockMvc.perform(post("/api/inventory/1/block")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inventoryId").value(1))
                .andExpect(jsonPath("$.previousState").value("AVAILABLE"))
                .andExpect(jsonPath("$.newState").value("BLOCKED"))
                .andExpect(jsonPath("$.updatedBy").value("admin@mes.com"));

        verify(inventoryService, times(1)).blockInventory(1L, "Quality issue");
    }

    @Test
    @DisplayName("Should unblock inventory")
    @WithMockUser(username = "admin@mes.com")
    void unblockInventory_ValidRequest_UnblocksSuccessfully() throws Exception {
        InventoryDTO.StateUpdateResponse response = InventoryDTO.StateUpdateResponse.builder()
                .inventoryId(1L)
                .previousState("BLOCKED")
                .newState("AVAILABLE")
                .message("Inventory unblocked and available")
                .updatedBy("admin@mes.com")
                .updatedOn(LocalDateTime.now())
                .build();
        when(inventoryService.unblockInventory(1L)).thenReturn(response);

        mockMvc.perform(post("/api/inventory/1/unblock")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inventoryId").value(1))
                .andExpect(jsonPath("$.previousState").value("BLOCKED"))
                .andExpect(jsonPath("$.newState").value("AVAILABLE"));

        verify(inventoryService, times(1)).unblockInventory(1L);
    }

    @Test
    @DisplayName("Should scrap inventory")
    @WithMockUser(username = "admin@mes.com")
    void scrapInventory_ValidRequest_ScrapsSuccessfully() throws Exception {
        InventoryDTO.StateUpdateResponse response = InventoryDTO.StateUpdateResponse.builder()
                .inventoryId(1L)
                .previousState("AVAILABLE")
                .newState("SCRAPPED")
                .message("Inventory scrapped. Reason: Damaged")
                .updatedBy("admin@mes.com")
                .updatedOn(LocalDateTime.now())
                .build();
        when(inventoryService.scrapInventory(eq(1L), eq("Damaged"))).thenReturn(response);

        InventoryDTO.ScrapRequest request = InventoryDTO.ScrapRequest.builder()
                .inventoryId(1L)
                .reason("Damaged")
                .build();

        mockMvc.perform(post("/api/inventory/1/scrap")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inventoryId").value(1))
                .andExpect(jsonPath("$.previousState").value("AVAILABLE"))
                .andExpect(jsonPath("$.newState").value("SCRAPPED"));

        verify(inventoryService, times(1)).scrapInventory(1L, "Damaged");
    }

    @Test
    @DisplayName("Should return 401 when blocking inventory without authentication")
    void blockInventory_NotAuthenticated_Returns401() throws Exception {
        InventoryDTO.BlockRequest request = InventoryDTO.BlockRequest.builder()
                .inventoryId(1L)
                .reason("Quality issue")
                .build();

        mockMvc.perform(post("/api/inventory/1/block")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // ========================================
    // CRUD Tests
    // ========================================

    @Test
    @WithMockUser(username = "admin")
    @DisplayName("Should create inventory and return 201")
    void createInventory_Returns201() throws Exception {
        InventoryDTO.CreateInventoryRequest request = InventoryDTO.CreateInventoryRequest.builder()
                .materialId("RM-002")
                .materialName("Copper Wire")
                .inventoryType("RM")
                .quantity(new BigDecimal("500.00"))
                .unit("KG")
                .location("WH-02")
                .build();

        when(inventoryService.createInventory(any(InventoryDTO.CreateInventoryRequest.class)))
                .thenReturn(testInventory);

        mockMvc.perform(post("/api/inventory")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.inventoryId").value(1))
                .andExpect(jsonPath("$.materialId").value("RM-001"));

        verify(inventoryService).createInventory(any(InventoryDTO.CreateInventoryRequest.class));
    }

    @Test
    @WithMockUser(username = "admin")
    @DisplayName("Should update inventory and return 200")
    void updateInventory_Returns200() throws Exception {
        InventoryDTO.UpdateInventoryRequest request = InventoryDTO.UpdateInventoryRequest.builder()
                .materialName("Updated Iron Ore")
                .quantity(new BigDecimal("200.00"))
                .build();

        when(inventoryService.updateInventory(eq(1L), any(InventoryDTO.UpdateInventoryRequest.class)))
                .thenReturn(testInventory);

        mockMvc.perform(put("/api/inventory/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inventoryId").value(1));

        verify(inventoryService).updateInventory(eq(1L), any(InventoryDTO.UpdateInventoryRequest.class));
    }

    @Test
    @WithMockUser(username = "admin")
    @DisplayName("Should delete inventory and return 200")
    void deleteInventory_Returns200() throws Exception {
        InventoryDTO.StateUpdateResponse response = InventoryDTO.StateUpdateResponse.builder()
                .inventoryId(1L)
                .previousState("AVAILABLE")
                .newState("SCRAPPED")
                .message("Inventory deleted (scrapped)")
                .updatedBy("admin")
                .updatedOn(LocalDateTime.now())
                .build();

        when(inventoryService.deleteInventory(1L)).thenReturn(response);

        mockMvc.perform(delete("/api/inventory/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.previousState").value("AVAILABLE"))
                .andExpect(jsonPath("$.newState").value("SCRAPPED"));

        verify(inventoryService).deleteInventory(1L);
    }

    @Test
    @WithMockUser(username = "admin")
    @DisplayName("Should return error when deleting consumed inventory")
    void deleteInventory_ConsumedReturnsError() throws Exception {
        when(inventoryService.deleteInventory(1L))
                .thenThrow(new RuntimeException("Cannot delete consumed inventory"));

        mockMvc.perform(delete("/api/inventory/1"))
                .andExpect(status().isBadRequest());
    }

    // ========================================
    // Receive Material Tests (RM Entry)
    // ========================================

    @Test
    @WithMockUser(username = "admin@mes.com")
    @DisplayName("Should receive raw material and return 201")
    void receiveMaterial_ValidRequest_Returns201() throws Exception {
        InventoryDTO.ReceiveMaterialRequest request = InventoryDTO.ReceiveMaterialRequest.builder()
                .materialId("RM-001")
                .materialName("Iron Ore")
                .quantity(new BigDecimal("1000.00"))
                .unit("KG")
                .supplierBatchNumber("SUP-BATCH-001")
                .supplierId("SUP-001")
                .location("WH-01")
                .notes("Quality check required")
                .build();

        InventoryDTO.ReceiveMaterialResponse response = InventoryDTO.ReceiveMaterialResponse.builder()
                .batchId(1L)
                .batchNumber("RM-RM001-20260206-001")
                .inventoryId(1L)
                .batchStatus("QUALITY_PENDING")
                .inventoryState("AVAILABLE")
                .quantity(new BigDecimal("1000.00"))
                .unit("KG")
                .message("Raw material received successfully. Batch pending quality approval.")
                .build();

        when(receiveMaterialService.receiveMaterial(any(InventoryDTO.ReceiveMaterialRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/inventory/receive-material")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.batchId").value(1))
                .andExpect(jsonPath("$.batchNumber").value("RM-RM001-20260206-001"))
                .andExpect(jsonPath("$.inventoryId").value(1))
                .andExpect(jsonPath("$.batchStatus").value("QUALITY_PENDING"))
                .andExpect(jsonPath("$.inventoryState").value("AVAILABLE"))
                .andExpect(jsonPath("$.quantity").value(1000.00))
                .andExpect(jsonPath("$.unit").value("KG"));

        verify(receiveMaterialService).receiveMaterial(any(InventoryDTO.ReceiveMaterialRequest.class));
    }

    @Test
    @WithMockUser(username = "admin@mes.com")
    @DisplayName("Should receive material with minimal fields")
    void receiveMaterial_MinimalFields_Returns201() throws Exception {
        InventoryDTO.ReceiveMaterialRequest request = InventoryDTO.ReceiveMaterialRequest.builder()
                .materialId("RM-002")
                .quantity(new BigDecimal("500.00"))
                .build();

        InventoryDTO.ReceiveMaterialResponse response = InventoryDTO.ReceiveMaterialResponse.builder()
                .batchId(2L)
                .batchNumber("RM-RM002-20260206-001")
                .inventoryId(2L)
                .batchStatus("QUALITY_PENDING")
                .inventoryState("AVAILABLE")
                .quantity(new BigDecimal("500.00"))
                .unit("KG")
                .message("Raw material received successfully. Batch pending quality approval.")
                .build();

        when(receiveMaterialService.receiveMaterial(any(InventoryDTO.ReceiveMaterialRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/inventory/receive-material")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.batchId").value(2))
                .andExpect(jsonPath("$.batchStatus").value("QUALITY_PENDING"));

        verify(receiveMaterialService).receiveMaterial(any(InventoryDTO.ReceiveMaterialRequest.class));
    }

    @Test
    @DisplayName("Should return 401 when receiving material without authentication")
    void receiveMaterial_NotAuthenticated_Returns401() throws Exception {
        InventoryDTO.ReceiveMaterialRequest request = InventoryDTO.ReceiveMaterialRequest.builder()
                .materialId("RM-001")
                .quantity(new BigDecimal("100.00"))
                .build();

        mockMvc.perform(post("/api/inventory/receive-material")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "admin@mes.com")
    @DisplayName("Should return 400 when material ID is missing")
    void receiveMaterial_MissingMaterialId_Returns400() throws Exception {
        InventoryDTO.ReceiveMaterialRequest request = InventoryDTO.ReceiveMaterialRequest.builder()
                .quantity(new BigDecimal("100.00"))
                .build();

        mockMvc.perform(post("/api/inventory/receive-material")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin@mes.com")
    @DisplayName("Should return 400 when quantity is missing")
    void receiveMaterial_MissingQuantity_Returns400() throws Exception {
        InventoryDTO.ReceiveMaterialRequest request = InventoryDTO.ReceiveMaterialRequest.builder()
                .materialId("RM-001")
                .build();

        mockMvc.perform(post("/api/inventory/receive-material")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin@mes.com")
    @DisplayName("Should return 400 when quantity is zero or negative")
    void receiveMaterial_InvalidQuantity_Returns400() throws Exception {
        InventoryDTO.ReceiveMaterialRequest request = InventoryDTO.ReceiveMaterialRequest.builder()
                .materialId("RM-001")
                .quantity(new BigDecimal("-10.00"))
                .build();

        mockMvc.perform(post("/api/inventory/receive-material")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
