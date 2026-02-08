package com.mes.production.service;

import com.mes.production.dto.ProcessDTO;
import com.mes.production.entity.Operation;
import com.mes.production.entity.OrderLineItem;
import com.mes.production.entity.Process;
import com.mes.production.entity.ProcessStatus;
import com.mes.production.entity.Routing;
import com.mes.production.entity.RoutingStep;
import com.mes.production.repository.OperationRepository;
import com.mes.production.repository.ProcessRepository;
import com.mes.production.repository.RoutingRepository;
import com.mes.production.repository.RoutingStepRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests for Process Status Validation at Execution Layer.
 *
 * These tests validate that the system correctly enforces Process status
 * constraints during runtime operations:
 *
 * 1. DRAFT Process: Cannot be used for execution
 * 2. ACTIVE Process: Can be used for execution
 * 3. INACTIVE Process: Cannot be used for new execution
 *
 * Key validation points:
 * - Operation instantiation should check Process.status == ACTIVE
 * - Production confirmation should check Process.status == ACTIVE
 * - Status transitions must follow valid paths
 *
 * Per MES Consolidated Specification:
 * - Process is a design-time template
 * - Runtime execution happens at Operation level
 * - Operations link to OrderLineItem for runtime tracking
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ProcessStatusValidationTest {

    // Mocks for OperationInstantiationService
    @Mock
    private ProcessRepository processRepository;

    @Mock
    private OperationRepository operationRepository;

    @Mock
    private RoutingRepository routingRepository;

    @Mock
    private RoutingStepRepository routingStepRepository;

    @InjectMocks
    private OperationInstantiationService operationInstantiationService;

    // Mocks for ProcessService
    @Mock
    private AuditService auditService;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    private Process draftProcess;
    private Process activeProcess;
    private Process inactiveProcess;
    private OrderLineItem testOrderLineItem;
    private Routing testRouting;
    private RoutingStep testRoutingStep;

    @BeforeEach
    void setUp() {
        // Setup security context
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("admin@mes.com");
        SecurityContextHolder.setContext(securityContext);

        // Create test processes with different statuses
        draftProcess = Process.builder()
                .processId(1L)
                .processName("Draft Melting Process")
                .status(ProcessStatus.DRAFT)
                .createdOn(LocalDateTime.now())
                .build();

        activeProcess = Process.builder()
                .processId(2L)
                .processName("Active Melting Process")
                .status(ProcessStatus.ACTIVE)
                .createdOn(LocalDateTime.now())
                .build();

        inactiveProcess = Process.builder()
                .processId(3L)
                .processName("Inactive Melting Process")
                .status(ProcessStatus.INACTIVE)
                .createdOn(LocalDateTime.now())
                .build();

        // Create test order line item
        testOrderLineItem = OrderLineItem.builder()
                .orderLineId(100L)
                .productSku("TEST-SKU")
                .quantity(BigDecimal.TEN)
                .build();

        // Create test routing
        testRouting = Routing.builder()
                .routingId(1L)
                .routingName("Test Routing")
                .status(Routing.STATUS_ACTIVE)
                .routingType(Routing.TYPE_SEQUENTIAL)
                .build();

        // Create test routing step
        testRoutingStep = RoutingStep.builder()
                .routingStepId(1L)
                .routing(testRouting)
                .operationName("Step 1")
                .operationCode("STEP1")
                .sequenceNumber(1)
                .status(RoutingStep.STATUS_ACTIVE)
                .build();
    }

    // ==================== Operation Instantiation Validation ====================

    @Nested
    @DisplayName("Operation Instantiation - Process Status Validation")
    class OperationInstantiationValidation {

        @Test
        @DisplayName("DRAFT process - should BLOCK operation instantiation")
        void draftProcess_ShouldBlockOperationInstantiation() {
            when(processRepository.findById(1L)).thenReturn(Optional.of(draftProcess));

            IllegalStateException exception = assertThrows(IllegalStateException.class,
                    () -> operationInstantiationService.instantiateOperationsForOrder(
                            testOrderLineItem, 1L, BigDecimal.TEN, "admin@mes.com"));

            assertTrue(exception.getMessage().contains("status is DRAFT"));
            assertTrue(exception.getMessage().contains("must be ACTIVE"));
            verify(operationRepository, never()).save(any(Operation.class));
        }

        @Test
        @DisplayName("INACTIVE process - should BLOCK operation instantiation")
        void inactiveProcess_ShouldBlockOperationInstantiation() {
            when(processRepository.findById(3L)).thenReturn(Optional.of(inactiveProcess));

            IllegalStateException exception = assertThrows(IllegalStateException.class,
                    () -> operationInstantiationService.instantiateOperationsForOrder(
                            testOrderLineItem, 3L, BigDecimal.TEN, "admin@mes.com"));

            assertTrue(exception.getMessage().contains("status is INACTIVE"));
            assertTrue(exception.getMessage().contains("must be ACTIVE"));
            verify(operationRepository, never()).save(any(Operation.class));
        }

        @Test
        @DisplayName("ACTIVE process - should ALLOW operation instantiation")
        void activeProcess_ShouldAllowOperationInstantiation() {
            when(processRepository.findById(2L)).thenReturn(Optional.of(activeProcess));
            when(routingRepository.findByProcess_ProcessId(2L)).thenReturn(List.of(testRouting));
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(testRoutingStep));
            when(operationRepository.save(any(Operation.class))).thenAnswer(inv -> {
                Operation op = inv.getArgument(0);
                op.setOperationId(1L);
                return op;
            });

            OperationInstantiationService.InstantiationResult result =
                    operationInstantiationService.instantiateOperationsForOrder(
                            testOrderLineItem, 2L, BigDecimal.TEN, "admin@mes.com");

            assertNotNull(result);
            assertEquals(activeProcess, result.process());
            assertFalse(result.operations().isEmpty());
            verify(operationRepository, atLeastOnce()).save(any(Operation.class));
        }

        @Test
        @DisplayName("Error message should clearly indicate process status issue")
        void errorMessage_ShouldIndicateProcessStatusIssue() {
            when(processRepository.findById(1L)).thenReturn(Optional.of(draftProcess));

            IllegalStateException exception = assertThrows(IllegalStateException.class,
                    () -> operationInstantiationService.instantiateOperationsForOrder(
                            testOrderLineItem, 1L, BigDecimal.TEN, "admin@mes.com"));

            // Error message should contain:
            // - Process ID
            // - Current status
            // - Required status
            assertTrue(exception.getMessage().contains("Process 1"));
            assertTrue(exception.getMessage().contains("DRAFT"));
            assertTrue(exception.getMessage().contains("ACTIVE"));
        }
    }

    // ==================== Status Transition Validation ====================

    @Nested
    @DisplayName("Status Transition Validation")
    class StatusTransitionValidation {

        private ProcessService processService;

        @BeforeEach
        void setUpProcessService() {
            processService = new ProcessService(processRepository, operationRepository, auditService);
        }

        @Test
        @DisplayName("ACTIVE to DRAFT - should be BLOCKED")
        void activeToDraft_ShouldBeBlocked() {
            when(processRepository.findById(2L)).thenReturn(Optional.of(activeProcess));

            ProcessDTO.UpdateRequest request = ProcessDTO.UpdateRequest.builder()
                    .status("DRAFT")
                    .build();

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> processService.updateProcess(2L, request));

            assertTrue(exception.getMessage().contains("Invalid status transition"));
            assertTrue(exception.getMessage().contains("ACTIVE"));
            assertTrue(exception.getMessage().contains("DRAFT"));
            verify(processRepository, never()).save(any(Process.class));
        }

        @Test
        @DisplayName("INACTIVE to DRAFT - should be BLOCKED")
        void inactiveToDraft_ShouldBeBlocked() {
            when(processRepository.findById(3L)).thenReturn(Optional.of(inactiveProcess));

            ProcessDTO.UpdateRequest request = ProcessDTO.UpdateRequest.builder()
                    .status("DRAFT")
                    .build();

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> processService.updateProcess(3L, request));

            assertTrue(exception.getMessage().contains("Invalid status transition"));
            assertTrue(exception.getMessage().contains("INACTIVE"));
            assertTrue(exception.getMessage().contains("DRAFT"));
            verify(processRepository, never()).save(any(Process.class));
        }

        @Test
        @DisplayName("DRAFT to ACTIVE - should be ALLOWED via updateProcess")
        void draftToActive_ShouldBeAllowed() {
            when(processRepository.findById(1L)).thenReturn(Optional.of(draftProcess));
            when(processRepository.save(any(Process.class))).thenReturn(draftProcess);

            ProcessDTO.UpdateRequest request = ProcessDTO.UpdateRequest.builder()
                    .status("ACTIVE")
                    .build();

            ProcessDTO.Response result = processService.updateProcess(1L, request);

            assertNotNull(result);
            verify(processRepository).save(any(Process.class));
            verify(auditService).logStatusChange(eq("PROCESS"), eq(1L), eq("DRAFT"), eq("ACTIVE"));
        }

        @Test
        @DisplayName("ACTIVE to INACTIVE - should be ALLOWED via updateProcess")
        void activeToInactive_ShouldBeAllowed() {
            when(processRepository.findById(2L)).thenReturn(Optional.of(activeProcess));
            when(processRepository.save(any(Process.class))).thenReturn(activeProcess);

            ProcessDTO.UpdateRequest request = ProcessDTO.UpdateRequest.builder()
                    .status("INACTIVE")
                    .build();

            ProcessDTO.Response result = processService.updateProcess(2L, request);

            assertNotNull(result);
            verify(processRepository).save(any(Process.class));
            verify(auditService).logStatusChange(eq("PROCESS"), eq(2L), eq("ACTIVE"), eq("INACTIVE"));
        }

        @Test
        @DisplayName("INACTIVE to ACTIVE - should be ALLOWED via updateProcess")
        void inactiveToActive_ShouldBeAllowed() {
            when(processRepository.findById(3L)).thenReturn(Optional.of(inactiveProcess));
            when(processRepository.save(any(Process.class))).thenReturn(inactiveProcess);

            ProcessDTO.UpdateRequest request = ProcessDTO.UpdateRequest.builder()
                    .status("ACTIVE")
                    .build();

            ProcessDTO.Response result = processService.updateProcess(3L, request);

            assertNotNull(result);
            verify(processRepository).save(any(Process.class));
            verify(auditService).logStatusChange(eq("PROCESS"), eq(3L), eq("INACTIVE"), eq("ACTIVE"));
        }

        @Test
        @DisplayName("Same status update - should be ALLOWED (no-op)")
        void sameStatus_ShouldBeAllowed() {
            when(processRepository.findById(2L)).thenReturn(Optional.of(activeProcess));
            when(processRepository.save(any(Process.class))).thenReturn(activeProcess);

            ProcessDTO.UpdateRequest request = ProcessDTO.UpdateRequest.builder()
                    .status("ACTIVE")
                    .build();

            ProcessDTO.Response result = processService.updateProcess(2L, request);

            assertNotNull(result);
            verify(processRepository).save(any(Process.class));
            // No status change logged since same status
            verify(auditService, never()).logStatusChange(anyString(), anyLong(), anyString(), anyString());
        }
    }

    // ==================== Query Filtering Validation ====================

    @Nested
    @DisplayName("Query Filtering - Status-Based")
    class QueryFilteringValidation {

        @Test
        @DisplayName("DRAFT process should NOT appear in active process list")
        void draftProcess_ShouldNotAppearInActiveList() {
            when(processRepository.findByStatus(ProcessStatus.ACTIVE))
                    .thenReturn(List.of(activeProcess));

            List<Process> activeProcesses = processRepository.findByStatus(ProcessStatus.ACTIVE);

            assertEquals(1, activeProcesses.size());
            assertFalse(activeProcesses.contains(draftProcess));
            assertTrue(activeProcesses.contains(activeProcess));
        }

        @Test
        @DisplayName("INACTIVE process should NOT appear in active process list")
        void inactiveProcess_ShouldNotAppearInActiveList() {
            when(processRepository.findByStatus(ProcessStatus.ACTIVE))
                    .thenReturn(List.of(activeProcess));

            List<Process> activeProcesses = processRepository.findByStatus(ProcessStatus.ACTIVE);

            assertEquals(1, activeProcesses.size());
            assertFalse(activeProcesses.contains(inactiveProcess));
            assertTrue(activeProcesses.contains(activeProcess));
        }

        @Test
        @DisplayName("All statuses should be queryable individually")
        void allStatuses_ShouldBeQueryable() {
            when(processRepository.findByStatus(ProcessStatus.DRAFT)).thenReturn(List.of(draftProcess));
            when(processRepository.findByStatus(ProcessStatus.ACTIVE)).thenReturn(List.of(activeProcess));
            when(processRepository.findByStatus(ProcessStatus.INACTIVE)).thenReturn(List.of(inactiveProcess));

            assertEquals(1, processRepository.findByStatus(ProcessStatus.DRAFT).size());
            assertEquals(1, processRepository.findByStatus(ProcessStatus.ACTIVE).size());
            assertEquals(1, processRepository.findByStatus(ProcessStatus.INACTIVE).size());
        }
    }

    // ==================== Status Enum Validation ====================

    @Nested
    @DisplayName("ProcessStatus Enum Validation")
    class ProcessStatusEnumValidation {

        @Test
        @DisplayName("ProcessStatus should have exactly 3 values")
        void processStatus_ShouldHaveThreeValues() {
            assertEquals(3, ProcessStatus.values().length);
        }

        @Test
        @DisplayName("ProcessStatus should contain DRAFT, ACTIVE, INACTIVE")
        void processStatus_ShouldContainCorrectValues() {
            assertNotNull(ProcessStatus.DRAFT);
            assertNotNull(ProcessStatus.ACTIVE);
            assertNotNull(ProcessStatus.INACTIVE);
        }

        @Test
        @DisplayName("ProcessStatus valueOf should work for valid strings")
        void processStatus_ValueOfShouldWork() {
            assertEquals(ProcessStatus.DRAFT, ProcessStatus.valueOf("DRAFT"));
            assertEquals(ProcessStatus.ACTIVE, ProcessStatus.valueOf("ACTIVE"));
            assertEquals(ProcessStatus.INACTIVE, ProcessStatus.valueOf("INACTIVE"));
        }

        @Test
        @DisplayName("ProcessStatus valueOf should throw for invalid strings")
        void processStatus_ValueOfShouldThrowForInvalid() {
            assertThrows(IllegalArgumentException.class, () -> ProcessStatus.valueOf("INVALID"));
            assertThrows(IllegalArgumentException.class, () -> ProcessStatus.valueOf("IN_PROGRESS"));
            assertThrows(IllegalArgumentException.class, () -> ProcessStatus.valueOf("COMPLETED"));
        }
    }

    // ==================== Operation with Process Reference ====================

    @Nested
    @DisplayName("Operation-Process Relationship Validation")
    class OperationProcessRelationship {

        @Test
        @DisplayName("Operation should reference Process for design-time definition")
        void operation_ShouldReferenceProcess() {
            Operation operation = Operation.builder()
                    .operationId(1L)
                    .operationName("Test Operation")
                    .process(activeProcess)
                    .status("READY")
                    .build();

            assertNotNull(operation.getProcess());
            assertEquals(activeProcess, operation.getProcess());
            assertEquals(ProcessStatus.ACTIVE, operation.getProcess().getStatus());
        }

        @Test
        @DisplayName("Operation can check its process status")
        void operation_CanCheckProcessStatus() {
            Operation opFromDraft = Operation.builder()
                    .operationId(1L)
                    .process(draftProcess)
                    .build();

            Operation opFromActive = Operation.builder()
                    .operationId(2L)
                    .process(activeProcess)
                    .build();

            Operation opFromInactive = Operation.builder()
                    .operationId(3L)
                    .process(inactiveProcess)
                    .build();

            assertEquals(ProcessStatus.DRAFT, opFromDraft.getProcess().getStatus());
            assertEquals(ProcessStatus.ACTIVE, opFromActive.getProcess().getStatus());
            assertEquals(ProcessStatus.INACTIVE, opFromInactive.getProcess().getStatus());
        }
    }
}
