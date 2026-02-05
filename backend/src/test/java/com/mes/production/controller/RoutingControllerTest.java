package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.entity.Operation;
import com.mes.production.entity.Process;
import com.mes.production.entity.Routing;
import com.mes.production.entity.RoutingStep;
import com.mes.production.security.JwtService;
import com.mes.production.service.RoutingService;
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
import org.springframework.test.web.servlet.MockMvc;

import com.mes.production.config.TestSecurityConfig;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class RoutingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RoutingService routingService;

    @MockBean
    private JwtService jwtService;

    private Process testProcess;
    private Routing testRouting;
    private RoutingStep testStep1;
    private RoutingStep testStep2;
    private Operation testOperation1;
    private Operation testOperation2;

    @BeforeEach
    void setUp() {
        testProcess = new Process();
        testProcess.setProcessId(1L);
        testProcess.setStageName("Melting Stage");

        testOperation1 = new Operation();
        testOperation1.setOperationId(1L);
        testOperation1.setOperationName("Melting");

        testOperation2 = new Operation();
        testOperation2.setOperationId(2L);
        testOperation2.setOperationName("Casting");

        testRouting = new Routing();
        testRouting.setRoutingId(1L);
        testRouting.setProcess(testProcess);
        testRouting.setRoutingName("Standard Melting Route");
        testRouting.setRoutingType("SEQUENTIAL");
        testRouting.setStatus("ACTIVE");
        testRouting.setCreatedOn(LocalDateTime.now());
        testRouting.setRoutingSteps(new ArrayList<>());

        testStep1 = new RoutingStep();
        testStep1.setRoutingStepId(1L);
        testStep1.setRouting(testRouting);
        testStep1.setOperation(testOperation1);
        testStep1.setSequenceNumber(1);
        testStep1.setIsParallel(false);
        testStep1.setMandatoryFlag(true);
        testStep1.setStatus("COMPLETED");

        testStep2 = new RoutingStep();
        testStep2.setRoutingStepId(2L);
        testStep2.setRouting(testRouting);
        testStep2.setOperation(testOperation2);
        testStep2.setSequenceNumber(2);
        testStep2.setIsParallel(false);
        testStep2.setMandatoryFlag(true);
        testStep2.setStatus("PENDING");

        testRouting.getRoutingSteps().add(testStep1);
        testRouting.getRoutingSteps().add(testStep2);
    }

    @Test
    @DisplayName("Should get routing by ID")
    @WithMockUser(username = "admin@mes.com")
    void getRouting_ValidId_ReturnsRouting() throws Exception {
        when(routingService.getRoutingWithSteps(1L)).thenReturn(Optional.of(testRouting));

        mockMvc.perform(get("/api/routing/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.routingId").value(1))
                .andExpect(jsonPath("$.routingName").value("Standard Melting Route"))
                .andExpect(jsonPath("$.routingType").value("SEQUENTIAL"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.steps[0].operationName").value("Melting"))
                .andExpect(jsonPath("$.steps[1].operationName").value("Casting"));

        verify(routingService, times(1)).getRoutingWithSteps(1L);
    }

    @Test
    @DisplayName("Should return 404 when routing not found")
    @WithMockUser(username = "admin@mes.com")
    void getRouting_NotFound_Returns404() throws Exception {
        when(routingService.getRoutingWithSteps(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/routing/999"))
                .andExpect(status().isNotFound());

        verify(routingService, times(1)).getRoutingWithSteps(999L);
    }

    @Test
    @DisplayName("Should get routing for process")
    @WithMockUser(username = "admin@mes.com")
    void getRoutingForProcess_ValidId_ReturnsRouting() throws Exception {
        when(routingService.getActiveRoutingForProcess(1L)).thenReturn(Optional.of(testRouting));

        mockMvc.perform(get("/api/routing/process/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.routingId").value(1))
                .andExpect(jsonPath("$.processId").value(1))
                .andExpect(jsonPath("$.routingName").value("Standard Melting Route"));

        verify(routingService, times(1)).getActiveRoutingForProcess(1L);
    }

    @Test
    @DisplayName("Should return 404 when no routing for process")
    @WithMockUser(username = "admin@mes.com")
    void getRoutingForProcess_NotFound_Returns404() throws Exception {
        when(routingService.getActiveRoutingForProcess(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/routing/process/999"))
                .andExpect(status().isNotFound());

        verify(routingService, times(1)).getActiveRoutingForProcess(999L);
    }

    @Test
    @DisplayName("Should get routing steps in order")
    @WithMockUser(username = "admin@mes.com")
    void getRoutingSteps_ValidId_ReturnsSteps() throws Exception {
        when(routingService.getRoutingStepsInOrder(1L)).thenReturn(List.of(testStep1, testStep2));

        mockMvc.perform(get("/api/routing/1/steps"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].routingStepId").value(1))
                .andExpect(jsonPath("$[0].operationName").value("Melting"))
                .andExpect(jsonPath("$[0].sequenceNumber").value(1))
                .andExpect(jsonPath("$[1].routingStepId").value(2))
                .andExpect(jsonPath("$[1].operationName").value("Casting"))
                .andExpect(jsonPath("$[1].sequenceNumber").value(2));

        verify(routingService, times(1)).getRoutingStepsInOrder(1L);
    }

    @Test
    @DisplayName("Should return empty list when no routing steps")
    @WithMockUser(username = "admin@mes.com")
    void getRoutingSteps_NoSteps_ReturnsEmptyList() throws Exception {
        when(routingService.getRoutingStepsInOrder(999L)).thenReturn(List.of());

        mockMvc.perform(get("/api/routing/999/steps"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());

        verify(routingService, times(1)).getRoutingStepsInOrder(999L);
    }

    @Test
    @DisplayName("Should check if operation can proceed - true")
    @WithMockUser(username = "admin@mes.com")
    void canOperationProceed_CanProceed_ReturnsTrue() throws Exception {
        when(routingService.canOperationProceed(2L)).thenReturn(true);

        mockMvc.perform(get("/api/routing/operation/2/can-proceed"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));

        verify(routingService, times(1)).canOperationProceed(2L);
    }

    @Test
    @DisplayName("Should check if operation can proceed - false")
    @WithMockUser(username = "admin@mes.com")
    void canOperationProceed_CannotProceed_ReturnsFalse() throws Exception {
        when(routingService.canOperationProceed(2L)).thenReturn(false);

        mockMvc.perform(get("/api/routing/operation/2/can-proceed"))
                .andExpect(status().isOk())
                .andExpect(content().string("false"));

        verify(routingService, times(1)).canOperationProceed(2L);
    }

    @Test
    @DisplayName("Should check if routing is complete - true")
    @WithMockUser(username = "admin@mes.com")
    void isRoutingComplete_Complete_ReturnsTrue() throws Exception {
        when(routingService.isRoutingComplete(1L)).thenReturn(true);

        mockMvc.perform(get("/api/routing/1/complete"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));

        verify(routingService, times(1)).isRoutingComplete(1L);
    }

    @Test
    @DisplayName("Should check if routing is complete - false")
    @WithMockUser(username = "admin@mes.com")
    void isRoutingComplete_NotComplete_ReturnsFalse() throws Exception {
        when(routingService.isRoutingComplete(1L)).thenReturn(false);

        mockMvc.perform(get("/api/routing/1/complete"))
                .andExpect(status().isOk())
                .andExpect(content().string("false"));

        verify(routingService, times(1)).isRoutingComplete(1L);
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void getRouting_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/routing/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should include step details in routing response")
    @WithMockUser(username = "admin@mes.com")
    void getRouting_WithSteps_IncludesStepDetails() throws Exception {
        when(routingService.getRoutingWithSteps(1L)).thenReturn(Optional.of(testRouting));

        mockMvc.perform(get("/api/routing/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.steps").isArray())
                .andExpect(jsonPath("$.steps.length()").value(2))
                .andExpect(jsonPath("$.steps[0].isParallel").value(false))
                .andExpect(jsonPath("$.steps[0].mandatoryFlag").value(true))
                .andExpect(jsonPath("$.steps[0].status").value("COMPLETED"))
                .andExpect(jsonPath("$.steps[1].status").value("PENDING"));

        verify(routingService, times(1)).getRoutingWithSteps(1L);
    }
}
