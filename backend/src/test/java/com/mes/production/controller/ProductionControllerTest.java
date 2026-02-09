package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.ProductionConfirmationDTO;
import com.mes.production.entity.*;
import com.mes.production.security.JwtService;
import com.mes.production.service.ProductionService;
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
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class ProductionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductionService productionService;

    @MockBean
    private JwtService jwtService;

    private ProductionConfirmationDTO.Request testRequest;
    private ProductionConfirmationDTO.Response testResponse;
    private Operation testOperation;

    @BeforeEach
    void setUp() {
        testRequest = ProductionConfirmationDTO.Request.builder()
                .operationId(1L)
                .producedQty(new BigDecimal("100.00"))
                .materialsConsumed(List.of(
                        ProductionConfirmationDTO.MaterialConsumption.builder()
                                .batchId(1L)
                                .inventoryId(1L)
                                .quantity(new BigDecimal("50.00"))
                                .build()
                ))
                .equipmentIds(List.of(1L))
                .operatorIds(List.of(1L))
                .startTime(LocalDateTime.now().minusHours(1))
                .endTime(LocalDateTime.now())
                .build();

        testResponse = ProductionConfirmationDTO.Response.builder()
                .confirmationId(1L)
                .operationId(1L)
                .operationName("Melting")
                .producedQty(new BigDecimal("100.00"))
                .status("CONFIRMED")
                .createdOn(LocalDateTime.now())
                .outputBatch(ProductionConfirmationDTO.BatchInfo.builder()
                        .batchId(2L)
                        .batchNumber("BATCH-OUT-001")
                        .materialId("IM-MELT")
                        .quantity(new BigDecimal("100.00"))
                        .build())
                .build();

        Order order = Order.builder().orderId(1L).status("IN_PROGRESS").build();
        OrderLineItem lineItem = OrderLineItem.builder()
                .orderLineId(1L)
                .productSku("STEEL-001")
                .productName("Steel Rod")
                .quantity(new BigDecimal("1000"))
                .order(order)
                .build();
        com.mes.production.entity.Process process = com.mes.production.entity.Process.builder()
                .processId(1L)
                .processName("Melting")
                .build();
        testOperation = Operation.builder()
                .operationId(1L)
                .operationName("Melt Iron")
                .operationCode("MLT-001")
                .operationType("TRANSFORM")
                .status("READY")
                .process(process)
                .orderLineItem(lineItem)
                .build();
    }

    @Nested
    @DisplayName("POST /api/production/confirm Tests")
    class ConfirmProductionTests {

        @Test
        @DisplayName("should_confirmProduction_when_validRequestProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_confirmProduction_when_validRequestProvided() throws Exception {
            when(productionService.confirmProduction(any(ProductionConfirmationDTO.Request.class)))
                    .thenReturn(testResponse);

            mockMvc.perform(post("/api/production/confirm")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(testRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.confirmationId").value(1))
                    .andExpect(jsonPath("$.operationName").value("Melting"))
                    .andExpect(jsonPath("$.status").value("CONFIRMED"))
                    .andExpect(jsonPath("$.outputBatch.batchNumber").value("BATCH-OUT-001"));

            verify(productionService, times(1)).confirmProduction(any());
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            mockMvc.perform(post("/api/production/confirm")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(testRequest)))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should_returnBadRequest_when_operationOnHold")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBadRequest_when_operationOnHold() throws Exception {
            when(productionService.confirmProduction(any()))
                    .thenThrow(new RuntimeException("Operation is on hold"));

            mockMvc.perform(post("/api/production/confirm")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(testRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should_returnBadRequest_when_insufficientMaterial")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBadRequest_when_insufficientMaterial() throws Exception {
            when(productionService.confirmProduction(any()))
                    .thenThrow(new RuntimeException("Insufficient material quantity"));

            mockMvc.perform(post("/api/production/confirm")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(testRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should_returnBadRequest_when_operationNotFound")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBadRequest_when_operationNotFound() throws Exception {
            when(productionService.confirmProduction(any()))
                    .thenThrow(new RuntimeException("Operation not found"));

            mockMvc.perform(post("/api/production/confirm")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(testRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should_confirmWithMultipleMaterials_when_multipleConsumed")
        @WithMockUser(username = "admin@mes.com")
        void should_confirmWithMultipleMaterials_when_multipleConsumed() throws Exception {
            ProductionConfirmationDTO.Request multiMaterialRequest = ProductionConfirmationDTO.Request.builder()
                    .operationId(1L)
                    .producedQty(new BigDecimal("100.00"))
                    .materialsConsumed(List.of(
                            ProductionConfirmationDTO.MaterialConsumption.builder()
                                    .batchId(1L)
                                    .inventoryId(1L)
                                    .quantity(new BigDecimal("30.00"))
                                    .build(),
                            ProductionConfirmationDTO.MaterialConsumption.builder()
                                    .batchId(2L)
                                    .inventoryId(2L)
                                    .quantity(new BigDecimal("20.00"))
                                    .build()
                    ))
                    .equipmentIds(List.of(1L, 2L))
                    .operatorIds(List.of(1L))
                    .startTime(LocalDateTime.now().minusHours(1))
                    .endTime(LocalDateTime.now())
                    .build();

            when(productionService.confirmProduction(any())).thenReturn(testResponse);

            mockMvc.perform(post("/api/production/confirm")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(multiMaterialRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.confirmationId").value(1));
        }
    }

    @Nested
    @DisplayName("GET /api/production/operations/{id} Tests")
    class GetOperationDetailsTests {

        @Test
        @DisplayName("should_returnOperationDetails_when_validIdProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_returnOperationDetails_when_validIdProvided() throws Exception {
            when(productionService.getOperationDetails(1L)).thenReturn(testOperation);

            mockMvc.perform(get("/api/production/operations/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.operationId").value(1))
                    .andExpect(jsonPath("$.operationName").value("Melt Iron"))
                    .andExpect(jsonPath("$.status").value("READY"));

            verify(productionService, times(1)).getOperationDetails(1L);
        }

        @Test
        @DisplayName("should_returnProcessInfo_when_operationHasProcess")
        @WithMockUser(username = "admin@mes.com")
        void should_returnProcessInfo_when_operationHasProcess() throws Exception {
            when(productionService.getOperationDetails(1L)).thenReturn(testOperation);

            mockMvc.perform(get("/api/production/operations/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.process.processId").value(1))
                    .andExpect(jsonPath("$.process.processName").value("Melting"));
        }

        @Test
        @DisplayName("should_returnOrderInfo_when_operationHasOrderLineItem")
        @WithMockUser(username = "admin@mes.com")
        void should_returnOrderInfo_when_operationHasOrderLineItem() throws Exception {
            when(productionService.getOperationDetails(1L)).thenReturn(testOperation);

            mockMvc.perform(get("/api/production/operations/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.order.orderId").value(1))
                    .andExpect(jsonPath("$.order.productSku").value("STEEL-001"))
                    .andExpect(jsonPath("$.order.productName").value("Steel Rod"));
        }

        @Test
        @DisplayName("should_returnBadRequest_when_operationNotFound")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBadRequest_when_operationNotFound() throws Exception {
            when(productionService.getOperationDetails(999L))
                    .thenThrow(new RuntimeException("Operation not found"));

            mockMvc.perform(get("/api/production/operations/999"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            mockMvc.perform(get("/api/production/operations/1"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/production/confirmations/{id} Tests")
    class GetConfirmationByIdTests {

        @Test
        @DisplayName("should_returnConfirmation_when_validIdProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_returnConfirmation_when_validIdProvided() throws Exception {
            when(productionService.getConfirmationById(1L)).thenReturn(testResponse);

            mockMvc.perform(get("/api/production/confirmations/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.confirmationId").value(1))
                    .andExpect(jsonPath("$.operationName").value("Melting"))
                    .andExpect(jsonPath("$.status").value("CONFIRMED"));

            verify(productionService, times(1)).getConfirmationById(1L);
        }

        @Test
        @DisplayName("should_returnConfirmationWithOutputBatch_when_batchCreated")
        @WithMockUser(username = "admin@mes.com")
        void should_returnConfirmationWithOutputBatch_when_batchCreated() throws Exception {
            when(productionService.getConfirmationById(1L)).thenReturn(testResponse);

            mockMvc.perform(get("/api/production/confirmations/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.outputBatch.batchId").value(2))
                    .andExpect(jsonPath("$.outputBatch.batchNumber").value("BATCH-OUT-001"))
                    .andExpect(jsonPath("$.outputBatch.materialId").value("IM-MELT"));
        }

        @Test
        @DisplayName("should_returnBadRequest_when_confirmationNotFound")
        @WithMockUser(username = "admin@mes.com")
        void should_returnBadRequest_when_confirmationNotFound() throws Exception {
            when(productionService.getConfirmationById(999L))
                    .thenThrow(new RuntimeException("Confirmation not found"));

            mockMvc.perform(get("/api/production/confirmations/999"))
                    .andExpect(status().isBadRequest());

            verify(productionService, times(1)).getConfirmationById(999L);
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            mockMvc.perform(get("/api/production/confirmations/1"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/production/confirmations/status/{status} Tests")
    class GetConfirmationsByStatusTests {

        @Test
        @DisplayName("should_returnConfirmations_when_statusIsConfirmed")
        @WithMockUser(username = "admin@mes.com")
        void should_returnConfirmations_when_statusIsConfirmed() throws Exception {
            when(productionService.getConfirmationsByStatus("CONFIRMED"))
                    .thenReturn(List.of(testResponse));

            mockMvc.perform(get("/api/production/confirmations/status/CONFIRMED"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].confirmationId").value(1))
                    .andExpect(jsonPath("$[0].status").value("CONFIRMED"));

            verify(productionService, times(1)).getConfirmationsByStatus("CONFIRMED");
        }

        @Test
        @DisplayName("should_handleCaseInsensitiveStatus_when_lowerCaseProvided")
        @WithMockUser(username = "admin@mes.com")
        void should_handleCaseInsensitiveStatus_when_lowerCaseProvided() throws Exception {
            when(productionService.getConfirmationsByStatus("CONFIRMED"))
                    .thenReturn(List.of(testResponse));

            mockMvc.perform(get("/api/production/confirmations/status/confirmed"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].status").value("CONFIRMED"));

            verify(productionService, times(1)).getConfirmationsByStatus("CONFIRMED");
        }

        @Test
        @DisplayName("should_returnEmptyList_when_noConfirmationsWithStatus")
        @WithMockUser(username = "admin@mes.com")
        void should_returnEmptyList_when_noConfirmationsWithStatus() throws Exception {
            when(productionService.getConfirmationsByStatus("PENDING"))
                    .thenReturn(List.of());

            mockMvc.perform(get("/api/production/confirmations/status/PENDING"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());

            verify(productionService, times(1)).getConfirmationsByStatus("PENDING");
        }

        @Test
        @DisplayName("should_returnMultipleConfirmations_when_multipleExist")
        @WithMockUser(username = "admin@mes.com")
        void should_returnMultipleConfirmations_when_multipleExist() throws Exception {
            ProductionConfirmationDTO.Response response2 = ProductionConfirmationDTO.Response.builder()
                    .confirmationId(2L)
                    .operationId(2L)
                    .operationName("Casting")
                    .status("CONFIRMED")
                    .build();

            when(productionService.getConfirmationsByStatus("CONFIRMED"))
                    .thenReturn(List.of(testResponse, response2));

            mockMvc.perform(get("/api/production/confirmations/status/CONFIRMED"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].confirmationId").value(1))
                    .andExpect(jsonPath("$[1].confirmationId").value(2));
        }
    }

    @Nested
    @DisplayName("GET /api/production/confirmations/partial Tests")
    class GetPartialConfirmationsTests {

        @Test
        @DisplayName("should_returnPartialConfirmations_when_partialConfirmationsExist")
        @WithMockUser(username = "admin@mes.com")
        void should_returnPartialConfirmations_when_partialConfirmationsExist() throws Exception {
            ProductionConfirmationDTO.Response partialResponse = ProductionConfirmationDTO.Response.builder()
                    .confirmationId(3L)
                    .operationId(1L)
                    .operationName("Melting")
                    .status("PARTIAL")
                    .producedQty(new BigDecimal("50.00"))
                    .build();

            when(productionService.getConfirmationsByStatus("PARTIAL"))
                    .thenReturn(List.of(partialResponse));

            mockMvc.perform(get("/api/production/confirmations/partial"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].confirmationId").value(3))
                    .andExpect(jsonPath("$[0].status").value("PARTIAL"));

            verify(productionService).getConfirmationsByStatus("PARTIAL");
        }

        @Test
        @DisplayName("should_returnEmptyList_when_noPartialConfirmations")
        @WithMockUser(username = "admin@mes.com")
        void should_returnEmptyList_when_noPartialConfirmations() throws Exception {
            when(productionService.getConfirmationsByStatus("PARTIAL"))
                    .thenReturn(List.of());

            mockMvc.perform(get("/api/production/confirmations/partial"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /api/production/operations/continuable Tests")
    class GetContinuableOperationsTests {

        @Test
        @DisplayName("should_returnContinuableOperations_when_operationsWithPartialProgress")
        @WithMockUser(username = "admin@mes.com")
        void should_returnContinuableOperations_when_operationsWithPartialProgress() throws Exception {
            Map<String, Object> continuableOp = Map.of(
                    "operationId", 1L,
                    "operationName", "Melting",
                    "status", "IN_PROGRESS",
                    "confirmedQty", new BigDecimal("50.00"),
                    "targetQty", new BigDecimal("100.00"),
                    "remainingQty", new BigDecimal("50.00")
            );

            when(productionService.getContinuableOperations())
                    .thenReturn(List.of(continuableOp));

            mockMvc.perform(get("/api/production/operations/continuable"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].operationId").value(1))
                    .andExpect(jsonPath("$[0].operationName").value("Melting"))
                    .andExpect(jsonPath("$[0].status").value("IN_PROGRESS"));

            verify(productionService).getContinuableOperations();
        }

        @Test
        @DisplayName("should_returnEmptyList_when_noContinuableOperations")
        @WithMockUser(username = "admin@mes.com")
        void should_returnEmptyList_when_noContinuableOperations() throws Exception {
            when(productionService.getContinuableOperations())
                    .thenReturn(List.of());

            mockMvc.perform(get("/api/production/operations/continuable"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }

        @Test
        @DisplayName("should_returnMultipleContinuable_when_multipleInProgress")
        @WithMockUser(username = "admin@mes.com")
        void should_returnMultipleContinuable_when_multipleInProgress() throws Exception {
            Map<String, Object> op1 = Map.of(
                    "operationId", 1L,
                    "operationName", "Melting",
                    "status", "IN_PROGRESS"
            );
            Map<String, Object> op2 = Map.of(
                    "operationId", 2L,
                    "operationName", "Casting",
                    "status", "IN_PROGRESS"
            );

            when(productionService.getContinuableOperations())
                    .thenReturn(List.of(op1, op2));

            mockMvc.perform(get("/api/production/operations/continuable"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2));
        }

        @Test
        @DisplayName("should_return401_when_notAuthenticated")
        void should_return401_when_notAuthenticated() throws Exception {
            mockMvc.perform(get("/api/production/operations/continuable"))
                    .andExpect(status().isUnauthorized());
        }
    }
}
