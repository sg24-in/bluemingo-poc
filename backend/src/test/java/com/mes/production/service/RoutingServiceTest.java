package com.mes.production.service;

import com.mes.production.dto.RoutingDTO;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests for RoutingService.
 *
 * Per MES architecture:
 * - RoutingStep is a TEMPLATE entity with status ACTIVE/INACTIVE
 * - Operation is a RUNTIME entity that tracks execution status
 * - RoutingSteps do NOT reference Operations (one-way relationship: Operation → RoutingStep)
 */
@ExtendWith(MockitoExtension.class)
class RoutingServiceTest {

    @Mock
    private RoutingRepository routingRepository;

    @Mock
    private RoutingStepRepository routingStepRepository;

    @Mock
    private ProcessRepository processRepository;

    @Mock
    private OperationRepository operationRepository;

    @InjectMocks
    private RoutingService routingService;

    private Process testProcess;
    private Routing testRouting;
    private RoutingStep testStep1;
    private RoutingStep testStep2;
    private RoutingStep testStep3;
    private OrderLineItem testOrderLineItem;
    private Operation testOperation1;
    private Operation testOperation2;
    private Operation testOperation3;

    @BeforeEach
    void setUp() {
        testProcess = Process.builder()
                .processId(1L)
                .processName("Melting Stage")
                .status(ProcessStatus.ACTIVE)
                .build();

        testOrderLineItem = OrderLineItem.builder()
                .orderLineId(1L)
                .build();

        testRouting = Routing.builder()
                .routingId(1L)
                .process(testProcess)
                .routingName("Standard Melting Route")
                .routingType(Routing.TYPE_SEQUENTIAL)
                .status(Routing.STATUS_ACTIVE)
                .createdOn(LocalDateTime.now())
                .routingSteps(new ArrayList<>())
                .build();

        // RoutingSteps are TEMPLATES - status is ACTIVE/INACTIVE
        testStep1 = RoutingStep.builder()
                .routingStepId(1L)
                .routing(testRouting)
                .operationName("Melting")
                .operationType("MELTING")
                .sequenceNumber(1)
                .isParallel(false)
                .mandatoryFlag(true)
                .status(RoutingStep.STATUS_ACTIVE)
                .build();

        testStep2 = RoutingStep.builder()
                .routingStepId(2L)
                .routing(testRouting)
                .operationName("Casting")
                .operationType("CASTING")
                .sequenceNumber(2)
                .isParallel(false)
                .mandatoryFlag(true)
                .status(RoutingStep.STATUS_ACTIVE)
                .build();

        testStep3 = RoutingStep.builder()
                .routingStepId(3L)
                .routing(testRouting)
                .operationName("Rolling")
                .operationType("HOT_ROLLING")
                .sequenceNumber(3)
                .isParallel(false)
                .mandatoryFlag(false)
                .status(RoutingStep.STATUS_ACTIVE)
                .build();

        testRouting.getRoutingSteps().add(testStep1);
        testRouting.getRoutingSteps().add(testStep2);
        testRouting.getRoutingSteps().add(testStep3);

        // Operations are RUNTIME entities that reference RoutingSteps
        testOperation1 = Operation.builder()
                .operationId(1L)
                .operationName("Melting")
                .routingStepId(1L)
                .orderLineItem(testOrderLineItem)
                .sequenceNumber(1)
                .status(Operation.STATUS_CONFIRMED)
                .build();

        testOperation2 = Operation.builder()
                .operationId(2L)
                .operationName("Casting")
                .routingStepId(2L)
                .orderLineItem(testOrderLineItem)
                .sequenceNumber(2)
                .status(Operation.STATUS_READY)
                .build();

        testOperation3 = Operation.builder()
                .operationId(3L)
                .operationName("Rolling")
                .routingStepId(3L)
                .orderLineItem(testOrderLineItem)
                .sequenceNumber(3)
                .status(Operation.STATUS_NOT_STARTED)
                .build();
    }

    @Test
    @DisplayName("Should get routing with steps")
    void getRoutingWithSteps_ValidId_ReturnsRouting() {
        when(routingRepository.findByIdWithSteps(1L)).thenReturn(Optional.of(testRouting));

        Optional<Routing> result = routingService.getRoutingWithSteps(1L);

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getRoutingId());
        assertEquals(3, result.get().getRoutingSteps().size());
    }

    @Test
    @DisplayName("Should return empty when routing not found")
    void getRoutingWithSteps_NotFound_ReturnsEmpty() {
        when(routingRepository.findByIdWithSteps(999L)).thenReturn(Optional.empty());

        Optional<Routing> result = routingService.getRoutingWithSteps(999L);

        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should get active routing for process")
    void getActiveRoutingForProcess_ValidId_ReturnsRouting() {
        when(routingRepository.findActiveRoutingByProcessWithSteps(1L)).thenReturn(Optional.of(testRouting));

        Optional<Routing> result = routingService.getActiveRoutingForProcess(1L);

        assertTrue(result.isPresent());
        assertEquals("Standard Melting Route", result.get().getRoutingName());
    }

    @Test
    @DisplayName("Should get routing steps in order")
    void getRoutingStepsInOrder_ValidId_ReturnsSteps() {
        when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                .thenReturn(List.of(testStep1, testStep2, testStep3));

        List<RoutingStep> result = routingService.getRoutingStepsInOrder(1L);

        assertNotNull(result);
        assertEquals(3, result.size());
        assertEquals(1, result.get(0).getSequenceNumber());
        assertEquals(2, result.get(1).getSequenceNumber());
        assertEquals(3, result.get(2).getSequenceNumber());
    }

    @Test
    @DisplayName("Should get next steps after current sequence")
    void getNextSteps_ValidSequence_ReturnsNextSteps() {
        when(routingStepRepository.findNextSteps(1L, 1)).thenReturn(List.of(testStep2, testStep3));

        List<RoutingStep> result = routingService.getNextSteps(1L, 1);

        assertNotNull(result);
        assertEquals(2, result.size());
    }

    @Test
    @DisplayName("Should get parallel steps at same level")
    void getParallelSteps_ValidSequence_ReturnsParallelSteps() {
        when(routingStepRepository.findParallelSteps(1L, 2)).thenReturn(List.of(testStep2));

        List<RoutingStep> result = routingService.getParallelSteps(1L, 2);

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("Should return true when routing is complete (has active steps and is active)")
    void isRoutingComplete_ActiveRoutingWithSteps_ReturnsTrue() {
        when(routingStepRepository.findActiveSteps(1L)).thenReturn(List.of(testStep1, testStep2, testStep3));
        when(routingRepository.findById(1L)).thenReturn(Optional.of(testRouting));

        boolean result = routingService.isRoutingComplete(1L);

        assertTrue(result);
    }

    @Test
    @DisplayName("Should return false when routing has no active steps")
    void isRoutingComplete_NoActiveSteps_ReturnsFalse() {
        when(routingStepRepository.findActiveSteps(1L)).thenReturn(List.of());

        boolean result = routingService.isRoutingComplete(1L);

        assertFalse(result);
    }

    @Test
    @DisplayName("Should get step for operation via routingStepId")
    void getStepForOperation_ValidId_ReturnsStep() {
        when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation1));
        when(routingStepRepository.findById(1L)).thenReturn(Optional.of(testStep1));

        Optional<RoutingStep> result = routingService.getStepForOperation(1L);

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getRoutingStepId());
    }

    @Test
    @DisplayName("Should return empty when operation has no routingStepId")
    void getStepForOperation_NoRoutingStepId_ReturnsEmpty() {
        Operation operationWithoutStep = Operation.builder()
                .operationId(100L)
                .operationName("Standalone")
                .routingStepId(null)
                .build();
        when(operationRepository.findById(100L)).thenReturn(Optional.of(operationWithoutStep));

        Optional<RoutingStep> result = routingService.getStepForOperation(100L);

        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should allow operation when status is READY")
    void canOperationProceed_OperationReady_ReturnsTrue() {
        when(operationRepository.findById(2L)).thenReturn(Optional.of(testOperation2));
        when(routingStepRepository.findById(2L)).thenReturn(Optional.of(testStep2));
        when(operationRepository.findByOrderLineItem_OrderLineIdOrderBySequenceNumberAsc(1L))
                .thenReturn(List.of(testOperation1, testOperation2, testOperation3));

        boolean result = routingService.canOperationProceed(2L);

        assertTrue(result);
    }

    @Test
    @DisplayName("Should block operation when status is not READY")
    void canOperationProceed_OperationNotReady_ReturnsFalse() {
        Operation notReadyOperation = Operation.builder()
                .operationId(2L)
                .status(Operation.STATUS_NOT_STARTED)
                .build();
        when(operationRepository.findById(2L)).thenReturn(Optional.of(notReadyOperation));

        boolean result = routingService.canOperationProceed(2L);

        assertFalse(result);
    }

    @Test
    @DisplayName("Should allow first operation in sequence")
    void canOperationProceed_FirstOperation_ReturnsTrue() {
        Operation firstOp = Operation.builder()
                .operationId(1L)
                .status(Operation.STATUS_READY)
                .sequenceNumber(1)
                .routingStepId(1L)
                .orderLineItem(testOrderLineItem)
                .build();
        when(operationRepository.findById(1L)).thenReturn(Optional.of(firstOp));
        when(routingStepRepository.findById(1L)).thenReturn(Optional.of(testStep1));

        boolean result = routingService.canOperationProceed(1L);

        assertTrue(result);
    }

    @Test
    @DisplayName("Should block operation when previous operations incomplete")
    void canOperationProceed_PreviousIncomplete_ReturnsFalse() {
        // First operation is NOT_STARTED
        Operation firstOp = Operation.builder()
                .operationId(1L)
                .status(Operation.STATUS_NOT_STARTED)
                .sequenceNumber(1)
                .routingStepId(1L)
                .orderLineItem(testOrderLineItem)
                .build();

        Operation secondOp = Operation.builder()
                .operationId(2L)
                .status(Operation.STATUS_READY)
                .sequenceNumber(2)
                .routingStepId(2L)
                .orderLineItem(testOrderLineItem)
                .build();

        when(operationRepository.findById(2L)).thenReturn(Optional.of(secondOp));
        when(routingStepRepository.findById(2L)).thenReturn(Optional.of(testStep2));
        when(operationRepository.findByOrderLineItem_OrderLineIdOrderBySequenceNumberAsc(1L))
                .thenReturn(List.of(firstOp, secondOp));

        boolean result = routingService.canOperationProceed(2L);

        assertFalse(result);
    }

    @Test
    @DisplayName("Should check routing completion for order line")
    void isRoutingCompleteForOrderLine_AllConfirmed_ReturnsTrue() {
        Operation op1 = Operation.builder().operationId(1L).status(Operation.STATUS_CONFIRMED).build();
        Operation op2 = Operation.builder().operationId(2L).status(Operation.STATUS_CONFIRMED).build();

        when(operationRepository.findByOrderLineItem_OrderLineIdOrderBySequenceNumberAsc(1L))
                .thenReturn(List.of(op1, op2));

        boolean result = routingService.isRoutingCompleteForOrderLine(1L);

        assertTrue(result);
    }

    @Test
    @DisplayName("Should return false when some operations not confirmed")
    void isRoutingCompleteForOrderLine_NotAllConfirmed_ReturnsFalse() {
        Operation op1 = Operation.builder().operationId(1L).status(Operation.STATUS_CONFIRMED).build();
        Operation op2 = Operation.builder().operationId(2L).status(Operation.STATUS_READY).build();

        when(operationRepository.findByOrderLineItem_OrderLineIdOrderBySequenceNumberAsc(1L))
                .thenReturn(List.of(op1, op2));

        boolean result = routingService.isRoutingCompleteForOrderLine(1L);

        assertFalse(result);
    }

    @Test
    @DisplayName("Should get next operation to ready")
    void getNextOperationToReady_HasNotStarted_ReturnsOperation() {
        when(operationRepository.findByOrderLineItem_OrderLineIdOrderBySequenceNumberAsc(1L))
                .thenReturn(List.of(testOperation1, testOperation2, testOperation3));

        Optional<Operation> result = routingService.getNextOperationToReady(1L);

        assertTrue(result.isPresent());
        assertEquals(3L, result.get().getOperationId()); // testOperation3 is NOT_STARTED
    }

    @Test
    @DisplayName("Should return empty when all operations started")
    void getNextOperationToReady_AllStarted_ReturnsEmpty() {
        Operation op1 = Operation.builder().operationId(1L).status(Operation.STATUS_CONFIRMED).build();
        Operation op2 = Operation.builder().operationId(2L).status(Operation.STATUS_IN_PROGRESS).build();

        when(operationRepository.findByOrderLineItem_OrderLineIdOrderBySequenceNumberAsc(1L))
                .thenReturn(List.of(op1, op2));

        Optional<Operation> result = routingService.getNextOperationToReady(1L);

        assertTrue(result.isEmpty());
    }

    // ============ CRUD Operation Tests ============

    @Nested
    @DisplayName("Create Routing Tests")
    class CreateRoutingTests {

        @Test
        @DisplayName("Should create routing successfully")
        void shouldCreateRoutingSuccessfully() {
            RoutingDTO.CreateRoutingRequest request = RoutingDTO.CreateRoutingRequest.builder()
                    .processId(1L)
                    .routingName("New Routing")
                    .routingType(Routing.TYPE_SEQUENTIAL)
                    .activateImmediately(false)
                    .build();

            when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
            when(routingRepository.save(any(Routing.class))).thenAnswer(invocation -> {
                Routing r = invocation.getArgument(0);
                r.setRoutingId(2L);
                return r;
            });

            Routing result = routingService.createRouting(request, "testuser");

            assertNotNull(result);
            assertEquals("New Routing", result.getRoutingName());
            assertEquals(Routing.STATUS_DRAFT, result.getStatus());
            verify(routingRepository).save(any(Routing.class));
        }

        @Test
        @DisplayName("Should create and activate routing immediately")
        void shouldCreateAndActivateRoutingImmediately() {
            RoutingDTO.CreateRoutingRequest request = RoutingDTO.CreateRoutingRequest.builder()
                    .processId(1L)
                    .routingName("Active Routing")
                    .activateImmediately(true)
                    .build();

            when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
            when(routingRepository.findByProcess_ProcessIdAndStatus(1L, Routing.STATUS_ACTIVE))
                    .thenReturn(List.of());
            when(routingRepository.save(any(Routing.class))).thenAnswer(invocation -> {
                Routing r = invocation.getArgument(0);
                r.setRoutingId(2L);
                return r;
            });

            Routing result = routingService.createRouting(request, "testuser");

            assertEquals(Routing.STATUS_ACTIVE, result.getStatus());
        }

        @Test
        @DisplayName("Should throw exception for invalid process")
        void shouldThrowExceptionForInvalidProcess() {
            RoutingDTO.CreateRoutingRequest request = RoutingDTO.CreateRoutingRequest.builder()
                    .processId(999L)
                    .routingName("New Routing")
                    .build();

            when(processRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class, () ->
                    routingService.createRouting(request, "testuser"));
        }
    }

    @Nested
    @DisplayName("Update Routing Tests")
    class UpdateRoutingTests {

        @Test
        @DisplayName("Should update routing successfully")
        void shouldUpdateRoutingSuccessfully() {
            testRouting.setStatus(Routing.STATUS_DRAFT);
            RoutingDTO.UpdateRoutingRequest request = RoutingDTO.UpdateRoutingRequest.builder()
                    .routingName("Updated Name")
                    .routingType(Routing.TYPE_PARALLEL)
                    .build();

            when(routingRepository.findById(1L)).thenReturn(Optional.of(testRouting));
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(testStep1, testStep2, testStep3));
            when(operationRepository.findByRoutingStepId(anyLong())).thenReturn(List.of());
            when(routingRepository.save(any(Routing.class))).thenReturn(testRouting);

            Routing result = routingService.updateRouting(1L, request, "testuser");

            assertEquals("Updated Name", result.getRoutingName());
            assertEquals(Routing.TYPE_PARALLEL, result.getRoutingType());
        }

        @Test
        @DisplayName("Should reject update of locked routing")
        void shouldRejectUpdateOfLockedRouting() {
            // Create an operation that's IN_PROGRESS (locks the routing)
            Operation inProgressOp = Operation.builder()
                    .operationId(1L)
                    .status(Operation.STATUS_IN_PROGRESS)
                    .build();

            RoutingDTO.UpdateRoutingRequest request = RoutingDTO.UpdateRoutingRequest.builder()
                    .routingName("Updated Name")
                    .build();

            when(routingRepository.findById(1L)).thenReturn(Optional.of(testRouting));
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(testStep1, testStep2, testStep3));
            when(operationRepository.findByRoutingStepId(1L)).thenReturn(List.of(inProgressOp));

            assertThrows(IllegalStateException.class, () ->
                    routingService.updateRouting(1L, request, "testuser"));
        }
    }

    @Nested
    @DisplayName("Activation Tests")
    class ActivationTests {

        @Test
        @DisplayName("Should activate routing")
        void shouldActivateRouting() {
            testRouting.setStatus(Routing.STATUS_DRAFT);

            when(routingRepository.findById(1L)).thenReturn(Optional.of(testRouting));
            when(routingRepository.save(any(Routing.class))).thenReturn(testRouting);

            Routing result = routingService.activateRouting(1L, false, "testuser");

            assertEquals(Routing.STATUS_ACTIVE, result.getStatus());
        }

        @Test
        @DisplayName("Should deactivate other routings when activating")
        void shouldDeactivateOtherRoutingsWhenActivating() {
            testRouting.setStatus(Routing.STATUS_DRAFT);
            Routing otherRouting = Routing.builder()
                    .routingId(2L)
                    .process(testProcess)
                    .routingName("Other Routing")
                    .status(Routing.STATUS_ACTIVE)
                    .build();

            when(routingRepository.findById(1L)).thenReturn(Optional.of(testRouting));
            when(routingRepository.findByProcess_ProcessIdAndStatus(1L, Routing.STATUS_ACTIVE))
                    .thenReturn(List.of(otherRouting));
            when(routingRepository.save(any(Routing.class))).thenAnswer(i -> i.getArgument(0));

            routingService.activateRouting(1L, true, "testuser");

            assertEquals(Routing.STATUS_INACTIVE, otherRouting.getStatus());
            verify(routingRepository, times(2)).save(any(Routing.class));
        }
    }

    @Nested
    @DisplayName("Deactivation Tests")
    class DeactivationTests {

        @Test
        @DisplayName("Should deactivate active routing")
        void shouldDeactivateActiveRouting() {
            testRouting.setStatus(Routing.STATUS_ACTIVE);

            when(routingRepository.findById(1L)).thenReturn(Optional.of(testRouting));
            when(routingRepository.save(any(Routing.class))).thenReturn(testRouting);

            Routing result = routingService.deactivateRouting(1L, "testuser");

            assertEquals(Routing.STATUS_INACTIVE, result.getStatus());
        }

        @Test
        @DisplayName("Should reject deactivation of non-active routing")
        void shouldRejectDeactivationOfNonActiveRouting() {
            testRouting.setStatus(Routing.STATUS_DRAFT);

            when(routingRepository.findById(1L)).thenReturn(Optional.of(testRouting));

            assertThrows(IllegalStateException.class, () ->
                    routingService.deactivateRouting(1L, "testuser"));
        }
    }

    @Nested
    @DisplayName("Delete Routing Tests")
    class DeleteRoutingTests {

        @Test
        @DisplayName("Should delete DRAFT routing")
        void shouldDeleteDraftRouting() {
            testRouting.setStatus(Routing.STATUS_DRAFT);

            when(routingRepository.findById(1L)).thenReturn(Optional.of(testRouting));
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(testStep1, testStep2, testStep3));
            when(operationRepository.findByRoutingStepId(anyLong())).thenReturn(List.of());

            routingService.deleteRouting(1L);

            verify(routingStepRepository).deleteAll(anyList());
            verify(routingRepository).delete(testRouting);
        }

        @Test
        @DisplayName("Should reject deletion of ACTIVE routing")
        void shouldRejectDeletionOfActiveRouting() {
            testRouting.setStatus(Routing.STATUS_ACTIVE);

            when(routingRepository.findById(1L)).thenReturn(Optional.of(testRouting));

            assertThrows(IllegalStateException.class, () ->
                    routingService.deleteRouting(1L));

            verify(routingRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("Hold/Release Tests")
    class HoldReleaseTests {

        @Test
        @DisplayName("Should put routing on hold")
        void shouldPutRoutingOnHold() {
            when(routingRepository.findById(1L)).thenReturn(Optional.of(testRouting));
            when(routingRepository.save(any(Routing.class))).thenReturn(testRouting);

            Routing result = routingService.putRoutingOnHold(1L, "Quality issue", "testuser");

            assertEquals(Routing.STATUS_ON_HOLD, result.getStatus());
        }

        @Test
        @DisplayName("Should release routing from hold")
        void shouldReleaseRoutingFromHold() {
            testRouting.setStatus(Routing.STATUS_ON_HOLD);

            when(routingRepository.findById(1L)).thenReturn(Optional.of(testRouting));
            when(routingRepository.save(any(Routing.class))).thenReturn(testRouting);

            Routing result = routingService.releaseRoutingFromHold(1L, "testuser");

            assertEquals(Routing.STATUS_ACTIVE, result.getStatus());
        }

        @Test
        @DisplayName("Should reject release if not on hold")
        void shouldRejectReleaseIfNotOnHold() {
            testRouting.setStatus(Routing.STATUS_ACTIVE);

            when(routingRepository.findById(1L)).thenReturn(Optional.of(testRouting));

            assertThrows(IllegalStateException.class, () ->
                    routingService.releaseRoutingFromHold(1L, "testuser"));
        }
    }

    @Nested
    @DisplayName("Status and Lock Tests")
    class StatusAndLockTests {

        @Test
        @DisplayName("Should detect locked routing when operations executed")
        void shouldDetectLockedRouting() {
            Operation confirmedOp = Operation.builder()
                    .operationId(1L)
                    .status(Operation.STATUS_CONFIRMED)
                    .build();

            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(testStep1, testStep2, testStep3));
            when(operationRepository.findByRoutingStepId(1L)).thenReturn(List.of(confirmedOp));

            assertTrue(routingService.isRoutingLocked(1L));
        }

        @Test
        @DisplayName("Should detect unlocked routing when no operations executed")
        void shouldDetectUnlockedRouting() {
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(testStep1, testStep2, testStep3));
            when(operationRepository.findByRoutingStepId(anyLong())).thenReturn(List.of());

            assertFalse(routingService.isRoutingLocked(1L));
        }

        @Test
        @DisplayName("Should return routing status summary")
        void shouldReturnRoutingStatusSummary() {
            when(routingRepository.findByIdWithSteps(1L)).thenReturn(Optional.of(testRouting));
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(testStep1, testStep2, testStep3));
            when(operationRepository.findByRoutingStepId(anyLong())).thenReturn(List.of());

            RoutingDTO.RoutingStatus status = routingService.getRoutingStatus(1L);

            assertEquals(3, status.getTotalSteps());
            assertFalse(status.getIsLocked());
        }
    }
}
