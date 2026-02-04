package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.InventoryMovementDTO;
import com.mes.production.entity.Inventory;
import com.mes.production.entity.InventoryMovement;
import com.mes.production.entity.Operation;
import com.mes.production.security.JwtService;
import com.mes.production.service.InventoryMovementService;
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
import java.time.format.DateTimeFormatter;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class InventoryMovementControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private InventoryMovementService movementService;

    @MockBean
    private JwtService jwtService;

    private Inventory testInventory;
    private Operation testOperation;
    private InventoryMovement testMovement;
    private LocalDateTime timestamp;

    @BeforeEach
    void setUp() {
        timestamp = LocalDateTime.now();

        testInventory = new Inventory();
        testInventory.setInventoryId(1L);
        testInventory.setMaterialId("RM-001");
        testInventory.setMaterialName("Iron Ore");
        testInventory.setUnit("KG");

        testOperation = new Operation();
        testOperation.setOperationId(1L);
        testOperation.setOperationName("Melting");

        testMovement = new InventoryMovement();
        testMovement.setMovementId(1L);
        testMovement.setInventory(testInventory);
        testMovement.setOperation(testOperation);
        testMovement.setMovementType("CONSUMPTION");
        testMovement.setQuantity(new BigDecimal("100.00"));
        testMovement.setTimestamp(timestamp);
        testMovement.setReason("Production consumption");
        testMovement.setStatus("COMPLETED");
        testMovement.setCreatedBy("admin@mes.com");
    }

    @Test
    @DisplayName("Should record movement")
    @WithMockUser(username = "admin@mes.com")
    void recordMovement_ValidRequest_ReturnsMovementInfo() throws Exception {
        InventoryMovementDTO.RecordMovementRequest request = InventoryMovementDTO.RecordMovementRequest.builder()
                .inventoryId(1L)
                .operationId(1L)
                .movementType("CONSUMPTION")
                .quantity(new BigDecimal("100.00"))
                .reason("Production consumption")
                .build();

        when(movementService.recordMovement(eq(1L), eq(1L), eq("CONSUMPTION"), any(BigDecimal.class), anyString()))
                .thenReturn(testMovement);

        mockMvc.perform(post("/api/inventory-movements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movementId").value(1))
                .andExpect(jsonPath("$.inventoryId").value(1))
                .andExpect(jsonPath("$.materialId").value("RM-001"))
                .andExpect(jsonPath("$.movementType").value("CONSUMPTION"))
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        verify(movementService, times(1)).recordMovement(eq(1L), eq(1L), eq("CONSUMPTION"), any(BigDecimal.class), anyString());
    }

    @Test
    @DisplayName("Should get inventory movements")
    @WithMockUser(username = "admin@mes.com")
    void getInventoryMovements_ValidId_ReturnsMovements() throws Exception {
        when(movementService.getInventoryMovementHistory(1L)).thenReturn(List.of(testMovement));

        mockMvc.perform(get("/api/inventory-movements/inventory/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].movementId").value(1))
                .andExpect(jsonPath("$[0].inventoryId").value(1))
                .andExpect(jsonPath("$[0].materialName").value("Iron Ore"));

        verify(movementService, times(1)).getInventoryMovementHistory(1L);
    }

    @Test
    @DisplayName("Should get operation movements")
    @WithMockUser(username = "admin@mes.com")
    void getOperationMovements_ValidId_ReturnsMovements() throws Exception {
        when(movementService.getOperationMovements(1L)).thenReturn(List.of(testMovement));

        mockMvc.perform(get("/api/inventory-movements/operation/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].movementId").value(1))
                .andExpect(jsonPath("$[0].operationId").value(1))
                .andExpect(jsonPath("$[0].operationName").value("Melting"));

        verify(movementService, times(1)).getOperationMovements(1L);
    }

    @Test
    @DisplayName("Should get batch movements")
    @WithMockUser(username = "admin@mes.com")
    void getBatchMovements_ValidId_ReturnsMovements() throws Exception {
        when(movementService.getBatchMovements(1L)).thenReturn(List.of(testMovement));

        mockMvc.perform(get("/api/inventory-movements/batch/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].movementId").value(1))
                .andExpect(jsonPath("$[0].movementType").value("CONSUMPTION"));

        verify(movementService, times(1)).getBatchMovements(1L);
    }

    @Test
    @DisplayName("Should get movements in time range")
    @WithMockUser(username = "admin@mes.com")
    void getMovementsInRange_ValidRange_ReturnsMovements() throws Exception {
        LocalDateTime startTime = LocalDateTime.now().minusHours(24);
        LocalDateTime endTime = LocalDateTime.now();
        String startTimeStr = startTime.format(DateTimeFormatter.ISO_DATE_TIME);
        String endTimeStr = endTime.format(DateTimeFormatter.ISO_DATE_TIME);

        when(movementService.getMovementsInTimeRange(any(), any())).thenReturn(List.of(testMovement));

        mockMvc.perform(get("/api/inventory-movements/range")
                        .param("startTime", startTimeStr)
                        .param("endTime", endTimeStr))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].movementId").value(1));

        verify(movementService, times(1)).getMovementsInTimeRange(any(), any());
    }

    @Test
    @DisplayName("Should get recent movements")
    @WithMockUser(username = "admin@mes.com")
    void getRecentMovements_ValidLimit_ReturnsMovements() throws Exception {
        when(movementService.getRecentMovements(10)).thenReturn(List.of(testMovement));

        mockMvc.perform(get("/api/inventory-movements/recent")
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].movementId").value(1));

        verify(movementService, times(1)).getRecentMovements(10);
    }

    @Test
    @DisplayName("Should get recent movements with default limit")
    @WithMockUser(username = "admin@mes.com")
    void getRecentMovements_DefaultLimit_ReturnsMovements() throws Exception {
        when(movementService.getRecentMovements(10)).thenReturn(List.of(testMovement));

        mockMvc.perform(get("/api/inventory-movements/recent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].movementId").value(1));

        verify(movementService, times(1)).getRecentMovements(10);
    }

    @Test
    @DisplayName("Should get pending movements")
    @WithMockUser(username = "admin@mes.com")
    void getPendingMovements_ReturnsPendingMovements() throws Exception {
        testMovement.setStatus("PENDING");
        when(movementService.getPendingMovements()).thenReturn(List.of(testMovement));

        mockMvc.perform(get("/api/inventory-movements/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].movementId").value(1))
                .andExpect(jsonPath("$[0].status").value("PENDING"));

        verify(movementService, times(1)).getPendingMovements();
    }

    @Test
    @DisplayName("Should execute pending movement")
    @WithMockUser(username = "admin@mes.com")
    void executeMovement_ValidId_ReturnsExecutedMovement() throws Exception {
        testMovement.setStatus("EXECUTED");
        when(movementService.executeMovement(1L)).thenReturn(testMovement);

        mockMvc.perform(put("/api/inventory-movements/1/execute"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movementId").value(1))
                .andExpect(jsonPath("$.status").value("EXECUTED"));

        verify(movementService, times(1)).executeMovement(1L);
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void recordMovement_NotAuthenticated_Returns401() throws Exception {
        InventoryMovementDTO.RecordMovementRequest request = InventoryMovementDTO.RecordMovementRequest.builder()
                .inventoryId(1L)
                .movementType("CONSUMPTION")
                .quantity(new BigDecimal("100.00"))
                .build();

        mockMvc.perform(post("/api/inventory-movements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should return empty list when no movements for inventory")
    @WithMockUser(username = "admin@mes.com")
    void getInventoryMovements_NoMovements_ReturnsEmptyList() throws Exception {
        when(movementService.getInventoryMovementHistory(999L)).thenReturn(List.of());

        mockMvc.perform(get("/api/inventory-movements/inventory/999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());

        verify(movementService, times(1)).getInventoryMovementHistory(999L);
    }

    @Test
    @DisplayName("Should return empty list when no pending movements")
    @WithMockUser(username = "admin@mes.com")
    void getPendingMovements_NoPending_ReturnsEmptyList() throws Exception {
        when(movementService.getPendingMovements()).thenReturn(List.of());

        mockMvc.perform(get("/api/inventory-movements/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());

        verify(movementService, times(1)).getPendingMovements();
    }
}
