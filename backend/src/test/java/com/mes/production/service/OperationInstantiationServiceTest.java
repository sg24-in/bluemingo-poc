package com.mes.production.service;

import com.mes.production.entity.Operation;
import com.mes.production.entity.OperationTemplate;
import com.mes.production.entity.OrderLineItem;
import com.mes.production.entity.Process;
import com.mes.production.entity.ProcessStatus;
import com.mes.production.entity.Routing;
import com.mes.production.entity.RoutingStep;
import com.mes.production.repository.OperationRepository;
import com.mes.production.repository.ProcessRepository;
import com.mes.production.repository.RoutingRepository;
import com.mes.production.repository.RoutingStepRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests for OperationInstantiationService.
 *
 * Per MES architecture:
 * - Process is a TEMPLATE entity (design-time only)
 * - RoutingStep is a TEMPLATE entity (design-time only)
 * - OperationTemplate is a TEMPLATE entity (reusable operation definition)
 * - Operations are RUNTIME instances linked to OrderLineItem
 *
 * This test covers:
 * - instantiateOperationsForOrder: successful instantiation, status handling, error cases
 * - isRoutingLocked: locked/unlocked detection
 * - getNextOperationToExecute: finding READY operations
 * - progressToNextOperation: advancing operation sequence
 */
@ExtendWith(MockitoExtension.class)
class OperationInstantiationServiceTest {

    @Mock
    private ProcessRepository processRepository;

    @Mock
    private RoutingRepository routingRepository;

    @Mock
    private RoutingStepRepository routingStepRepository;

    @Mock
    private OperationRepository operationRepository;

    @InjectMocks
    private OperationInstantiationService operationInstantiationService;

    private Process activeProcess;
    private Process draftProcess;
    private Routing activeRouting;
    private Routing inactiveRouting;
    private RoutingStep step1;
    private RoutingStep step2;
    private RoutingStep step3;
    private RoutingStep inactiveStep;
    private OrderLineItem orderLineItem;
    private OperationTemplate meltingTemplate;
    private OperationTemplate castingTemplate;

    @BeforeEach
    void setUp() {
        activeProcess = Process.builder()
                .processId(1L)
                .processName("Steel Production")
                .status(ProcessStatus.ACTIVE)
                .build();

        draftProcess = Process.builder()
                .processId(2L)
                .processName("Draft Process")
                .status(ProcessStatus.DRAFT)
                .build();

        orderLineItem = OrderLineItem.builder()
                .orderLineId(10L)
                .productSku("STEEL-001")
                .productName("Steel Billet")
                .quantity(new BigDecimal("100.0000"))
                .unit("T")
                .status(OrderLineItem.STATUS_CREATED)
                .build();

        // OperationTemplates for design-time references
        meltingTemplate = OperationTemplate.builder()
                .operationTemplateId(100L)
                .operationName("Melting Operation")
                .operationType("FURNACE")
                .operationCode("MELT-01")
                .status(OperationTemplate.STATUS_ACTIVE)
                .build();

        castingTemplate = OperationTemplate.builder()
                .operationTemplateId(101L)
                .operationName("Casting Operation")
                .operationType("CASTER")
                .operationCode("CAST-01")
                .status(OperationTemplate.STATUS_ACTIVE)
                .build();

        activeRouting = Routing.builder()
                .routingId(1L)
                .process(activeProcess)
                .routingName("Standard Steel Route")
                .routingType(Routing.TYPE_SEQUENTIAL)
                .status(Routing.STATUS_ACTIVE)
                .routingSteps(new ArrayList<>())
                .build();

        inactiveRouting = Routing.builder()
                .routingId(2L)
                .process(activeProcess)
                .routingName("Old Route")
                .routingType(Routing.TYPE_SEQUENTIAL)
                .status(Routing.STATUS_INACTIVE)
                .routingSteps(new ArrayList<>())
                .build();

        // RoutingSteps with OperationTemplate references
        step1 = RoutingStep.builder()
                .routingStepId(1L)
                .routing(activeRouting)
                .operationTemplate(meltingTemplate)
                .operationName("Melting")
                .operationType("FURNACE")
                .operationCode("MELT-01")
                .sequenceNumber(1)
                .isParallel(false)
                .mandatoryFlag(true)
                .status(RoutingStep.STATUS_ACTIVE)
                .targetQty(new BigDecimal("110.0000"))
                .build();

        step2 = RoutingStep.builder()
                .routingStepId(2L)
                .routing(activeRouting)
                .operationTemplate(castingTemplate)
                .operationName("Casting")
                .operationType("CASTER")
                .operationCode("CAST-01")
                .sequenceNumber(2)
                .isParallel(false)
                .mandatoryFlag(true)
                .status(RoutingStep.STATUS_ACTIVE)
                .targetQty(new BigDecimal("105.0000"))
                .build();

        // Step3 uses legacy fields (no OperationTemplate)
        step3 = RoutingStep.builder()
                .routingStepId(3L)
                .routing(activeRouting)
                .operationTemplate(null)
                .operationName("Rolling")
                .operationType("HOT_ROLLING")
                .operationCode("ROLL-01")
                .sequenceNumber(3)
                .isParallel(false)
                .mandatoryFlag(false)
                .status(RoutingStep.STATUS_ACTIVE)
                .targetQty(null)
                .build();

        inactiveStep = RoutingStep.builder()
                .routingStepId(4L)
                .routing(activeRouting)
                .operationName("Inspection")
                .operationType("QC")
                .sequenceNumber(4)
                .status(RoutingStep.STATUS_INACTIVE)
                .build();
    }

    // ============ instantiateOperationsForOrder Tests ============

    @Nested
    @DisplayName("Instantiate Operations for Order Tests")
    class InstantiateOperationsTests {

        @Test
        @DisplayName("Should instantiate operations from all active routing steps")
        void shouldInstantiateOperationsFromActiveRoutingSteps() {
            when(processRepository.findById(1L)).thenReturn(Optional.of(activeProcess));
            when(routingRepository.findByProcess_ProcessId(1L)).thenReturn(List.of(activeRouting));
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(step1, step2, step3));
            when(operationRepository.save(any(Operation.class))).thenAnswer(invocation -> {
                Operation op = invocation.getArgument(0);
                op.setOperationId((long) op.getSequenceNumber() * 10);
                return op;
            });

            OperationInstantiationService.InstantiationResult result =
                    operationInstantiationService.instantiateOperationsForOrder(
                            orderLineItem, 1L, new BigDecimal("100.0000"), "admin");

            assertNotNull(result);
            assertEquals(activeProcess, result.process());
            assertEquals(activeRouting, result.routing());
            assertEquals(3, result.operations().size());
            // 3 operations saved + 1 additional save for setting first to READY
            verify(operationRepository, times(4)).save(any(Operation.class));
        }

        @Test
        @DisplayName("Should set first operation status to READY and rest to NOT_STARTED")
        void shouldSetFirstOperationToReadyAndRestToNotStarted() {
            when(processRepository.findById(1L)).thenReturn(Optional.of(activeProcess));
            when(routingRepository.findByProcess_ProcessId(1L)).thenReturn(List.of(activeRouting));
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(step1, step2, step3));
            when(operationRepository.save(any(Operation.class))).thenAnswer(invocation -> {
                Operation op = invocation.getArgument(0);
                op.setOperationId((long) op.getSequenceNumber() * 10);
                return op;
            });

            OperationInstantiationService.InstantiationResult result =
                    operationInstantiationService.instantiateOperationsForOrder(
                            orderLineItem, 1L, new BigDecimal("100.0000"), "admin");

            List<Operation> ops = result.operations();
            // First operation should be set to READY (via additional save)
            assertEquals(Operation.STATUS_READY, ops.get(0).getStatus());
            // Remaining operations should be NOT_STARTED
            assertEquals(Operation.STATUS_NOT_STARTED, ops.get(1).getStatus());
            assertEquals(Operation.STATUS_NOT_STARTED, ops.get(2).getStatus());
        }

        @Test
        @DisplayName("Should copy operation details from OperationTemplate when available")
        void shouldCopyDetailsFromOperationTemplate() {
            when(processRepository.findById(1L)).thenReturn(Optional.of(activeProcess));
            when(routingRepository.findByProcess_ProcessId(1L)).thenReturn(List.of(activeRouting));
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(step1));

            ArgumentCaptor<Operation> captor = ArgumentCaptor.forClass(Operation.class);
            when(operationRepository.save(captor.capture())).thenAnswer(invocation -> {
                Operation op = invocation.getArgument(0);
                op.setOperationId(1L);
                return op;
            });

            operationInstantiationService.instantiateOperationsForOrder(
                    orderLineItem, 1L, new BigDecimal("100.0000"), "admin");

            // First captured save is the initial operation creation
            Operation savedOp = captor.getAllValues().get(0);
            // Step1 has an OperationTemplate, so effective fields come from the template
            assertEquals("Melting Operation", savedOp.getOperationName());
            assertEquals("FURNACE", savedOp.getOperationType());
            assertEquals("MELT-01", savedOp.getOperationCode());
            assertEquals(100L, savedOp.getOperationTemplateId());
        }

        @Test
        @DisplayName("Should use legacy fields when OperationTemplate is null")
        void shouldUseLegacyFieldsWhenNoOperationTemplate() {
            when(processRepository.findById(1L)).thenReturn(Optional.of(activeProcess));
            when(routingRepository.findByProcess_ProcessId(1L)).thenReturn(List.of(activeRouting));
            // Only step3 which has no OperationTemplate
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(step3));

            ArgumentCaptor<Operation> captor = ArgumentCaptor.forClass(Operation.class);
            when(operationRepository.save(captor.capture())).thenAnswer(invocation -> {
                Operation op = invocation.getArgument(0);
                op.setOperationId(1L);
                return op;
            });

            operationInstantiationService.instantiateOperationsForOrder(
                    orderLineItem, 1L, new BigDecimal("100.0000"), "admin");

            Operation savedOp = captor.getAllValues().get(0);
            // Step3 has no OperationTemplate, uses legacy fields
            assertEquals("Rolling", savedOp.getOperationName());
            assertEquals("HOT_ROLLING", savedOp.getOperationType());
            assertEquals("ROLL-01", savedOp.getOperationCode());
            assertNull(savedOp.getOperationTemplateId());
        }

        @Test
        @DisplayName("Should set correct sequence numbers from routing steps")
        void shouldSetCorrectSequenceNumbers() {
            when(processRepository.findById(1L)).thenReturn(Optional.of(activeProcess));
            when(routingRepository.findByProcess_ProcessId(1L)).thenReturn(List.of(activeRouting));
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(step1, step2, step3));
            when(operationRepository.save(any(Operation.class))).thenAnswer(invocation -> {
                Operation op = invocation.getArgument(0);
                op.setOperationId((long) op.getSequenceNumber());
                return op;
            });

            OperationInstantiationService.InstantiationResult result =
                    operationInstantiationService.instantiateOperationsForOrder(
                            orderLineItem, 1L, new BigDecimal("100.0000"), "admin");

            List<Operation> ops = result.operations();
            assertEquals(1, ops.get(0).getSequenceNumber());
            assertEquals(2, ops.get(1).getSequenceNumber());
            assertEquals(3, ops.get(2).getSequenceNumber());
        }

        @Test
        @DisplayName("Should link operations to correct OrderLineItem and Process")
        void shouldLinkOperationsToOrderLineItemAndProcess() {
            when(processRepository.findById(1L)).thenReturn(Optional.of(activeProcess));
            when(routingRepository.findByProcess_ProcessId(1L)).thenReturn(List.of(activeRouting));
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(step1));

            ArgumentCaptor<Operation> captor = ArgumentCaptor.forClass(Operation.class);
            when(operationRepository.save(captor.capture())).thenAnswer(invocation -> {
                Operation op = invocation.getArgument(0);
                op.setOperationId(1L);
                return op;
            });

            operationInstantiationService.instantiateOperationsForOrder(
                    orderLineItem, 1L, new BigDecimal("100.0000"), "admin");

            Operation savedOp = captor.getAllValues().get(0);
            assertSame(activeProcess, savedOp.getProcess());
            assertSame(orderLineItem, savedOp.getOrderLineItem());
            assertEquals(1L, savedOp.getRoutingStepId());
        }

        @Test
        @DisplayName("Should use routing step targetQty when available, fallback to provided quantity")
        void shouldUseRoutingStepTargetQtyOrFallback() {
            when(processRepository.findById(1L)).thenReturn(Optional.of(activeProcess));
            when(routingRepository.findByProcess_ProcessId(1L)).thenReturn(List.of(activeRouting));
            // step1 has targetQty=110, step3 has targetQty=null
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(step1, step3));

            ArgumentCaptor<Operation> captor = ArgumentCaptor.forClass(Operation.class);
            when(operationRepository.save(captor.capture())).thenAnswer(invocation -> {
                Operation op = invocation.getArgument(0);
                op.setOperationId((long) op.getSequenceNumber());
                return op;
            });

            BigDecimal fallbackQty = new BigDecimal("100.0000");
            operationInstantiationService.instantiateOperationsForOrder(
                    orderLineItem, 1L, fallbackQty, "admin");

            List<Operation> savedOps = captor.getAllValues();
            // First op (step1) should use step's targetQty
            assertEquals(new BigDecimal("110.0000"), savedOps.get(0).getTargetQty());
            // Second op (step3, targetQty=null) should fall back to provided quantity
            assertEquals(fallbackQty, savedOps.get(1).getTargetQty());
        }

        @Test
        @DisplayName("Should set createdBy on all instantiated operations")
        void shouldSetCreatedByOnOperations() {
            when(processRepository.findById(1L)).thenReturn(Optional.of(activeProcess));
            when(routingRepository.findByProcess_ProcessId(1L)).thenReturn(List.of(activeRouting));
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(step1, step2));

            ArgumentCaptor<Operation> captor = ArgumentCaptor.forClass(Operation.class);
            when(operationRepository.save(captor.capture())).thenAnswer(invocation -> {
                Operation op = invocation.getArgument(0);
                op.setOperationId((long) op.getSequenceNumber());
                return op;
            });

            operationInstantiationService.instantiateOperationsForOrder(
                    orderLineItem, 1L, new BigDecimal("100.0000"), "operator1");

            // Check first two saves (operation creation), skip the third (READY status update)
            assertEquals("operator1", captor.getAllValues().get(0).getCreatedBy());
            assertEquals("operator1", captor.getAllValues().get(1).getCreatedBy());
        }

        @Test
        @DisplayName("Should skip INACTIVE routing steps during instantiation")
        void shouldSkipInactiveRoutingSteps() {
            when(processRepository.findById(1L)).thenReturn(Optional.of(activeProcess));
            when(routingRepository.findByProcess_ProcessId(1L)).thenReturn(List.of(activeRouting));
            // Include an inactive step in the list
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(step1, inactiveStep));
            when(operationRepository.save(any(Operation.class))).thenAnswer(invocation -> {
                Operation op = invocation.getArgument(0);
                op.setOperationId(1L);
                return op;
            });

            OperationInstantiationService.InstantiationResult result =
                    operationInstantiationService.instantiateOperationsForOrder(
                            orderLineItem, 1L, new BigDecimal("100.0000"), "admin");

            // Only 1 active step should be instantiated, not the inactive one
            assertEquals(1, result.operations().size());
            // 1 creation save + 1 READY status save = 2 total saves
            verify(operationRepository, times(2)).save(any(Operation.class));
        }

        @Test
        @DisplayName("Should prefer ACTIVE routing when multiple routings exist")
        void shouldPreferActiveRouting() {
            when(processRepository.findById(1L)).thenReturn(Optional.of(activeProcess));
            // Return both inactive and active routings
            when(routingRepository.findByProcess_ProcessId(1L))
                    .thenReturn(List.of(inactiveRouting, activeRouting));
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(step1));
            when(operationRepository.save(any(Operation.class))).thenAnswer(invocation -> {
                Operation op = invocation.getArgument(0);
                op.setOperationId(1L);
                return op;
            });

            OperationInstantiationService.InstantiationResult result =
                    operationInstantiationService.instantiateOperationsForOrder(
                            orderLineItem, 1L, new BigDecimal("100.0000"), "admin");

            // Should have selected the active routing (id=1), not inactive (id=2)
            assertEquals(1L, result.routing().getRoutingId());
            assertEquals(Routing.STATUS_ACTIVE, result.routing().getStatus());
        }

        @Test
        @DisplayName("Should return routing steps in the result")
        void shouldReturnRoutingStepsInResult() {
            when(processRepository.findById(1L)).thenReturn(Optional.of(activeProcess));
            when(routingRepository.findByProcess_ProcessId(1L)).thenReturn(List.of(activeRouting));
            List<RoutingStep> steps = List.of(step1, step2, step3);
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(steps);
            when(operationRepository.save(any(Operation.class))).thenAnswer(invocation -> {
                Operation op = invocation.getArgument(0);
                op.setOperationId((long) op.getSequenceNumber());
                return op;
            });

            OperationInstantiationService.InstantiationResult result =
                    operationInstantiationService.instantiateOperationsForOrder(
                            orderLineItem, 1L, new BigDecimal("100.0000"), "admin");

            assertEquals(3, result.routingSteps().size());
            assertSame(steps, result.routingSteps());
        }
    }

    // ============ Error Handling Tests ============

    @Nested
    @DisplayName("Instantiation Error Handling Tests")
    class InstantiationErrorTests {

        @Test
        @DisplayName("Should throw exception when process not found")
        void shouldThrowExceptionWhenProcessNotFound() {
            when(processRepository.findById(999L)).thenReturn(Optional.empty());

            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                    operationInstantiationService.instantiateOperationsForOrder(
                            orderLineItem, 999L, new BigDecimal("100.0000"), "admin"));

            assertTrue(exception.getMessage().contains("Process not found: 999"));
            verify(routingRepository, never()).findByProcess_ProcessId(anyLong());
            verify(operationRepository, never()).save(any(Operation.class));
        }

        @Test
        @DisplayName("Should throw exception when process is not ACTIVE")
        void shouldThrowExceptionWhenProcessNotActive() {
            when(processRepository.findById(2L)).thenReturn(Optional.of(draftProcess));

            IllegalStateException exception = assertThrows(IllegalStateException.class, () ->
                    operationInstantiationService.instantiateOperationsForOrder(
                            orderLineItem, 2L, new BigDecimal("100.0000"), "admin"));

            assertTrue(exception.getMessage().contains("must be ACTIVE"));
            assertTrue(exception.getMessage().contains("DRAFT"));
            verify(routingRepository, never()).findByProcess_ProcessId(anyLong());
        }

        @Test
        @DisplayName("Should throw exception when no routing found for process")
        void shouldThrowExceptionWhenNoRoutingFound() {
            when(processRepository.findById(1L)).thenReturn(Optional.of(activeProcess));
            when(routingRepository.findByProcess_ProcessId(1L)).thenReturn(List.of());

            IllegalStateException exception = assertThrows(IllegalStateException.class, () ->
                    operationInstantiationService.instantiateOperationsForOrder(
                            orderLineItem, 1L, new BigDecimal("100.0000"), "admin"));

            assertTrue(exception.getMessage().contains("No routing found for process: 1"));
            verify(operationRepository, never()).save(any(Operation.class));
        }

        @Test
        @DisplayName("Should throw exception when routing has no steps")
        void shouldThrowExceptionWhenRoutingHasNoSteps() {
            when(processRepository.findById(1L)).thenReturn(Optional.of(activeProcess));
            when(routingRepository.findByProcess_ProcessId(1L)).thenReturn(List.of(activeRouting));
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of());

            IllegalStateException exception = assertThrows(IllegalStateException.class, () ->
                    operationInstantiationService.instantiateOperationsForOrder(
                            orderLineItem, 1L, new BigDecimal("100.0000"), "admin"));

            assertTrue(exception.getMessage().contains("No routing steps defined"));
            verify(operationRepository, never()).save(any(Operation.class));
        }

        @Test
        @DisplayName("Should use fallback operation name when step has null operation name")
        void shouldUseFallbackOperationNameWhenNull() {
            RoutingStep stepWithNoName = RoutingStep.builder()
                    .routingStepId(5L)
                    .routing(activeRouting)
                    .operationTemplate(null)
                    .operationName(null)
                    .operationType("GENERIC")
                    .sequenceNumber(7)
                    .status(RoutingStep.STATUS_ACTIVE)
                    .build();

            when(processRepository.findById(1L)).thenReturn(Optional.of(activeProcess));
            when(routingRepository.findByProcess_ProcessId(1L)).thenReturn(List.of(activeRouting));
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(stepWithNoName));

            ArgumentCaptor<Operation> captor = ArgumentCaptor.forClass(Operation.class);
            when(operationRepository.save(captor.capture())).thenAnswer(invocation -> {
                Operation op = invocation.getArgument(0);
                op.setOperationId(1L);
                return op;
            });

            operationInstantiationService.instantiateOperationsForOrder(
                    orderLineItem, 1L, new BigDecimal("100.0000"), "admin");

            // Should use fallback "Step {sequenceNumber}" when operationName is null
            assertEquals("Step 7", captor.getAllValues().get(0).getOperationName());
        }
    }

    // ============ isRoutingLocked Tests ============

    @Nested
    @DisplayName("Routing Lock Detection Tests")
    class RoutingLockTests {

        @Test
        @DisplayName("Should detect locked routing when operation is IN_PROGRESS")
        void shouldDetectLockedWhenOperationInProgress() {
            Operation inProgressOp = Operation.builder()
                    .operationId(1L)
                    .status(Operation.STATUS_IN_PROGRESS)
                    .build();

            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(step1, step2));
            when(operationRepository.findByRoutingStepId(1L)).thenReturn(List.of(inProgressOp));

            assertTrue(operationInstantiationService.isRoutingLocked(1L));
        }

        @Test
        @DisplayName("Should detect locked routing when operation is CONFIRMED")
        void shouldDetectLockedWhenOperationConfirmed() {
            Operation confirmedOp = Operation.builder()
                    .operationId(1L)
                    .status(Operation.STATUS_CONFIRMED)
                    .build();

            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(step1));
            when(operationRepository.findByRoutingStepId(1L)).thenReturn(List.of(confirmedOp));

            assertTrue(operationInstantiationService.isRoutingLocked(1L));
        }

        @Test
        @DisplayName("Should detect locked routing when operation is PARTIALLY_CONFIRMED")
        void shouldDetectLockedWhenOperationPartiallyConfirmed() {
            Operation partialOp = Operation.builder()
                    .operationId(1L)
                    .status(Operation.STATUS_PARTIALLY_CONFIRMED)
                    .build();

            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(step1));
            when(operationRepository.findByRoutingStepId(1L)).thenReturn(List.of(partialOp));

            assertTrue(operationInstantiationService.isRoutingLocked(1L));
        }

        @Test
        @DisplayName("Should detect unlocked routing when no operations exist")
        void shouldDetectUnlockedWhenNoOperations() {
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(step1, step2, step3));
            when(operationRepository.findByRoutingStepId(anyLong())).thenReturn(List.of());

            assertFalse(operationInstantiationService.isRoutingLocked(1L));
        }

        @Test
        @DisplayName("Should detect unlocked routing when operations are NOT_STARTED or READY")
        void shouldDetectUnlockedWhenOperationsNotStarted() {
            Operation notStartedOp = Operation.builder()
                    .operationId(1L)
                    .status(Operation.STATUS_NOT_STARTED)
                    .build();
            Operation readyOp = Operation.builder()
                    .operationId(2L)
                    .status(Operation.STATUS_READY)
                    .build();

            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(step1, step2));
            when(operationRepository.findByRoutingStepId(1L)).thenReturn(List.of(notStartedOp));
            when(operationRepository.findByRoutingStepId(2L)).thenReturn(List.of(readyOp));

            assertFalse(operationInstantiationService.isRoutingLocked(1L));
        }

        @Test
        @DisplayName("Should return false for routing with no steps")
        void shouldReturnFalseForRoutingWithNoSteps() {
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(99L))
                    .thenReturn(List.of());

            assertFalse(operationInstantiationService.isRoutingLocked(99L));
        }
    }

    // ============ getNextOperationToExecute Tests ============

    @Nested
    @DisplayName("Get Next Operation to Execute Tests")
    class GetNextOperationTests {

        @Test
        @DisplayName("Should return READY operation when available")
        void shouldReturnReadyOperation() {
            Operation readyOp = Operation.builder()
                    .operationId(2L)
                    .operationName("Casting")
                    .status(Operation.STATUS_READY)
                    .sequenceNumber(2)
                    .build();
            Operation notStartedOp = Operation.builder()
                    .operationId(3L)
                    .operationName("Rolling")
                    .status(Operation.STATUS_NOT_STARTED)
                    .sequenceNumber(3)
                    .build();

            when(operationRepository.findByOrderLineItem_OrderLineIdOrderBySequenceNumberAsc(10L))
                    .thenReturn(List.of(readyOp, notStartedOp));

            Optional<Operation> result = operationInstantiationService.getNextOperationToExecute(10L);

            assertTrue(result.isPresent());
            assertEquals(2L, result.get().getOperationId());
            assertEquals(Operation.STATUS_READY, result.get().getStatus());
        }

        @Test
        @DisplayName("Should return empty when no READY operation exists")
        void shouldReturnEmptyWhenNoReadyOperation() {
            Operation confirmedOp = Operation.builder()
                    .operationId(1L)
                    .status(Operation.STATUS_CONFIRMED)
                    .build();
            Operation notStartedOp = Operation.builder()
                    .operationId(2L)
                    .status(Operation.STATUS_NOT_STARTED)
                    .build();

            when(operationRepository.findByOrderLineItem_OrderLineIdOrderBySequenceNumberAsc(10L))
                    .thenReturn(List.of(confirmedOp, notStartedOp));

            Optional<Operation> result = operationInstantiationService.getNextOperationToExecute(10L);

            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("Should return empty when no operations exist for order line")
        void shouldReturnEmptyWhenNoOperationsExist() {
            when(operationRepository.findByOrderLineItem_OrderLineIdOrderBySequenceNumberAsc(999L))
                    .thenReturn(List.of());

            Optional<Operation> result = operationInstantiationService.getNextOperationToExecute(999L);

            assertTrue(result.isEmpty());
        }
    }

    // ============ progressToNextOperation Tests ============

    @Nested
    @DisplayName("Progress to Next Operation Tests")
    class ProgressToNextOperationTests {

        @Test
        @DisplayName("Should set next NOT_STARTED operation to READY after completion")
        void shouldSetNextOperationToReady() {
            Operation completedOp = Operation.builder()
                    .operationId(1L)
                    .operationName("Melting")
                    .status(Operation.STATUS_CONFIRMED)
                    .sequenceNumber(1)
                    .orderLineItem(orderLineItem)
                    .build();
            Operation nextOp = Operation.builder()
                    .operationId(2L)
                    .operationName("Casting")
                    .status(Operation.STATUS_NOT_STARTED)
                    .sequenceNumber(2)
                    .orderLineItem(orderLineItem)
                    .build();

            when(operationRepository.findById(1L)).thenReturn(Optional.of(completedOp));
            when(operationRepository.findByOrderLineItem_OrderLineIdOrderBySequenceNumberAsc(10L))
                    .thenReturn(List.of(completedOp, nextOp));
            when(operationRepository.save(any(Operation.class))).thenReturn(nextOp);

            operationInstantiationService.progressToNextOperation(1L, "admin");

            assertEquals(Operation.STATUS_READY, nextOp.getStatus());
            assertEquals("admin", nextOp.getUpdatedBy());
            verify(operationRepository).save(nextOp);
        }

        @Test
        @DisplayName("Should skip non-NOT_STARTED operations when progressing")
        void shouldSkipNonNotStartedOperations() {
            Operation completedOp = Operation.builder()
                    .operationId(1L)
                    .status(Operation.STATUS_CONFIRMED)
                    .sequenceNumber(1)
                    .orderLineItem(orderLineItem)
                    .build();
            Operation inProgressOp = Operation.builder()
                    .operationId(2L)
                    .status(Operation.STATUS_IN_PROGRESS)
                    .sequenceNumber(2)
                    .orderLineItem(orderLineItem)
                    .build();
            Operation notStartedOp = Operation.builder()
                    .operationId(3L)
                    .status(Operation.STATUS_NOT_STARTED)
                    .sequenceNumber(3)
                    .orderLineItem(orderLineItem)
                    .build();

            when(operationRepository.findById(1L)).thenReturn(Optional.of(completedOp));
            when(operationRepository.findByOrderLineItem_OrderLineIdOrderBySequenceNumberAsc(10L))
                    .thenReturn(List.of(completedOp, inProgressOp, notStartedOp));
            when(operationRepository.save(any(Operation.class))).thenReturn(notStartedOp);

            operationInstantiationService.progressToNextOperation(1L, "admin");

            assertEquals(Operation.STATUS_READY, notStartedOp.getStatus());
            // inProgressOp should not be modified
            assertEquals(Operation.STATUS_IN_PROGRESS, inProgressOp.getStatus());
        }

        @Test
        @DisplayName("Should do nothing when completed operation has no order line item")
        void shouldDoNothingWhenNoOrderLineItem() {
            Operation orphanOp = Operation.builder()
                    .operationId(1L)
                    .status(Operation.STATUS_CONFIRMED)
                    .orderLineItem(null)
                    .build();

            when(operationRepository.findById(1L)).thenReturn(Optional.of(orphanOp));

            operationInstantiationService.progressToNextOperation(1L, "admin");

            verify(operationRepository, never()).save(any(Operation.class));
            verify(operationRepository, never()).findByOrderLineItem_OrderLineIdOrderBySequenceNumberAsc(anyLong());
        }

        @Test
        @DisplayName("Should throw exception when completed operation not found")
        void shouldThrowExceptionWhenCompletedOperationNotFound() {
            when(operationRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class, () ->
                    operationInstantiationService.progressToNextOperation(999L, "admin"));
        }

        @Test
        @DisplayName("Should do nothing when there is no next NOT_STARTED operation (all done)")
        void shouldDoNothingWhenNoNextOperation() {
            Operation completedOp1 = Operation.builder()
                    .operationId(1L)
                    .status(Operation.STATUS_CONFIRMED)
                    .sequenceNumber(1)
                    .orderLineItem(orderLineItem)
                    .build();
            Operation completedOp2 = Operation.builder()
                    .operationId(2L)
                    .status(Operation.STATUS_CONFIRMED)
                    .sequenceNumber(2)
                    .orderLineItem(orderLineItem)
                    .build();

            when(operationRepository.findById(1L)).thenReturn(Optional.of(completedOp1));
            when(operationRepository.findByOrderLineItem_OrderLineIdOrderBySequenceNumberAsc(10L))
                    .thenReturn(List.of(completedOp1, completedOp2));

            operationInstantiationService.progressToNextOperation(1L, "admin");

            // No save should occur because no NOT_STARTED operation follows
            verify(operationRepository, never()).save(any(Operation.class));
        }
    }
}
