package com.mes.production.service;

import com.mes.production.dto.RoutingDTO;
import com.mes.production.entity.Operation;
import com.mes.production.entity.Process;
import com.mes.production.entity.Routing;
import com.mes.production.entity.RoutingStep;
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

@ExtendWith(MockitoExtension.class)
class RoutingServiceTest {

    @Mock
    private RoutingRepository routingRepository;

    @Mock
    private RoutingStepRepository routingStepRepository;

    @Mock
    private ProcessRepository processRepository;

    @InjectMocks
    private RoutingService routingService;

    private Process testProcess;
    private Routing testRouting;
    private RoutingStep testStep1;
    private RoutingStep testStep2;
    private RoutingStep testStep3;
    private Operation testOperation1;
    private Operation testOperation2;
    private Operation testOperation3;

    @BeforeEach
    void setUp() {
        testProcess = Process.builder()
                .processId(1L)
                .processName("Melting Stage")
                .status(Process.STATUS_READY)
                .build();

        testOperation1 = Operation.builder()
                .operationId(1L)
                .operationName("Melting")
                .build();

        testOperation2 = Operation.builder()
                .operationId(2L)
                .operationName("Casting")
                .build();

        testOperation3 = Operation.builder()
                .operationId(3L)
                .operationName("Rolling")
                .build();

        testRouting = Routing.builder()
                .routingId(1L)
                .process(testProcess)
                .routingName("Standard Melting Route")
                .routingType(Routing.TYPE_SEQUENTIAL)
                .status("ACTIVE")
                .createdOn(LocalDateTime.now())
                .routingSteps(new ArrayList<>())
                .build();

        testStep1 = RoutingStep.builder()
                .routingStepId(1L)
                .routing(testRouting)
                .operation(testOperation1)
                .sequenceNumber(1)
                .isParallel(false)
                .mandatoryFlag(true)
                .status(RoutingStep.STATUS_COMPLETED)
                .build();

        testStep2 = RoutingStep.builder()
                .routingStepId(2L)
                .routing(testRouting)
                .operation(testOperation2)
                .sequenceNumber(2)
                .isParallel(false)
                .mandatoryFlag(true)
                .status(RoutingStep.STATUS_READY)
                .build();

        testStep3 = RoutingStep.builder()
                .routingStepId(3L)
                .routing(testRouting)
                .operation(testOperation3)
                .sequenceNumber(3)
                .isParallel(false)
                .mandatoryFlag(false)
                .status(RoutingStep.STATUS_READY)
                .build();

        testRouting.getRoutingSteps().add(testStep1);
        testRouting.getRoutingSteps().add(testStep2);
        testRouting.getRoutingSteps().add(testStep3);
    }

    @Test
    @DisplayName("Should get routing with steps")
    void getRoutingWithSteps_ValidId_ReturnsRouting() {
        // Arrange
        when(routingRepository.findByIdWithSteps(1L)).thenReturn(Optional.of(testRouting));

        // Act
        Optional<Routing> result = routingService.getRoutingWithSteps(1L);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getRoutingId());
        assertEquals(3, result.get().getRoutingSteps().size());
    }

    @Test
    @DisplayName("Should return empty when routing not found")
    void getRoutingWithSteps_NotFound_ReturnsEmpty() {
        // Arrange
        when(routingRepository.findByIdWithSteps(999L)).thenReturn(Optional.empty());

        // Act
        Optional<Routing> result = routingService.getRoutingWithSteps(999L);

        // Assert
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should get active routing for process")
    void getActiveRoutingForTemplate_ValidId_ReturnsRouting() {
        // Arrange
        when(routingRepository.findActiveRoutingByTemplateWithSteps(1L)).thenReturn(Optional.of(testRouting));

        // Act
        Optional<Routing> result = routingService.getActiveRoutingForTemplate(1L);

        // Assert
        assertTrue(result.isPresent());
        assertEquals("Standard Melting Route", result.get().getRoutingName());
    }

    @Test
    @DisplayName("Should get routing steps in order")
    void getRoutingStepsInOrder_ValidId_ReturnsSteps() {
        // Arrange
        when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                .thenReturn(List.of(testStep1, testStep2, testStep3));

        // Act
        List<RoutingStep> result = routingService.getRoutingStepsInOrder(1L);

        // Assert
        assertNotNull(result);
        assertEquals(3, result.size());
        assertEquals(1, result.get(0).getSequenceNumber());
        assertEquals(2, result.get(1).getSequenceNumber());
        assertEquals(3, result.get(2).getSequenceNumber());
    }

    @Test
    @DisplayName("Should get next steps after current sequence")
    void getNextSteps_ValidSequence_ReturnsNextSteps() {
        // Arrange
        when(routingStepRepository.findNextSteps(1L, 1)).thenReturn(List.of(testStep2, testStep3));

        // Act
        List<RoutingStep> result = routingService.getNextSteps(1L, 1);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
    }

    @Test
    @DisplayName("Should get parallel steps at same level")
    void getParallelSteps_ValidSequence_ReturnsParallelSteps() {
        // Arrange
        when(routingStepRepository.findParallelSteps(1L, 2)).thenReturn(List.of(testStep2));

        // Act
        List<RoutingStep> result = routingService.getParallelSteps(1L, 2);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("Should return true when routing is complete")
    void isRoutingComplete_AllComplete_ReturnsTrue() {
        // Arrange
        when(routingStepRepository.findIncompleteMandatorySteps(1L)).thenReturn(List.of());

        // Act
        boolean result = routingService.isRoutingComplete(1L);

        // Assert
        assertTrue(result);
    }

    @Test
    @DisplayName("Should return false when routing is not complete")
    void isRoutingComplete_IncompleteMandatorySteps_ReturnsFalse() {
        // Arrange
        when(routingStepRepository.findIncompleteMandatorySteps(1L)).thenReturn(List.of(testStep2));

        // Act
        boolean result = routingService.isRoutingComplete(1L);

        // Assert
        assertFalse(result);
    }

    @Test
    @DisplayName("Should get next operation to ready")
    void getNextOperationToReady_ValidSequence_ReturnsNextOperation() {
        // Arrange
        when(routingStepRepository.findNextSteps(1L, 1)).thenReturn(List.of(testStep2));

        // Act
        Optional<Operation> result = routingService.getNextOperationToReady(1L, 1);

        // Assert
        assertTrue(result.isPresent());
        assertEquals("Casting", result.get().getOperationName());
    }

    @Test
    @DisplayName("Should return empty when no next steps")
    void getNextOperationToReady_NoNextSteps_ReturnsEmpty() {
        // Arrange
        when(routingStepRepository.findNextSteps(1L, 3)).thenReturn(List.of());

        // Act
        Optional<Operation> result = routingService.getNextOperationToReady(1L, 3);

        // Assert
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should update routing step status")
    void updateStepStatus_ValidRequest_UpdatesStatus() {
        // Arrange
        when(routingStepRepository.findById(2L)).thenReturn(Optional.of(testStep2));
        when(routingStepRepository.save(any(RoutingStep.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        RoutingStep result = routingService.updateStepStatus(2L, RoutingStep.STATUS_COMPLETED, "admin@mes.com");

        // Assert
        assertNotNull(result);
        assertEquals(RoutingStep.STATUS_COMPLETED, result.getStatus());
        assertEquals("admin@mes.com", result.getUpdatedBy());
    }

    @Test
    @DisplayName("Should throw exception when step not found")
    void updateStepStatus_NotFound_ThrowsException() {
        // Arrange
        when(routingStepRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> routingService.updateStepStatus(999L, RoutingStep.STATUS_COMPLETED, "admin"));

        assertTrue(exception.getMessage().contains("Routing step not found"));
    }

    @Test
    @DisplayName("Should get step for operation")
    void getStepForOperation_ValidId_ReturnsStep() {
        // Arrange
        when(routingStepRepository.findByOperation_OperationId(1L)).thenReturn(Optional.of(testStep1));

        // Act
        Optional<RoutingStep> result = routingService.getStepForOperation(1L);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getRoutingStepId());
    }

    @Test
    @DisplayName("Should allow first step to proceed in sequential routing")
    void canOperationProceed_FirstStep_ReturnsTrue() {
        // Arrange
        when(routingStepRepository.findByOperation_OperationId(1L)).thenReturn(Optional.of(testStep1));

        // Act
        boolean result = routingService.canOperationProceed(1L);

        // Assert
        assertTrue(result);
    }

    @Test
    @DisplayName("Should allow operation when no routing step exists")
    void canOperationProceed_NoRoutingStep_ReturnsTrue() {
        // Arrange
        when(routingStepRepository.findByOperation_OperationId(100L)).thenReturn(Optional.empty());

        // Act
        boolean result = routingService.canOperationProceed(100L);

        // Assert
        assertTrue(result);
    }

    @Test
    @DisplayName("Should allow operation when previous mandatory steps complete")
    void canOperationProceed_PreviousStepsComplete_ReturnsTrue() {
        // Arrange
        when(routingStepRepository.findByOperation_OperationId(2L)).thenReturn(Optional.of(testStep2));
        when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                .thenReturn(List.of(testStep1, testStep2, testStep3));

        // Act
        boolean result = routingService.canOperationProceed(2L);

        // Assert
        assertTrue(result);
    }

    @Test
    @DisplayName("Should block operation when previous mandatory steps incomplete")
    void canOperationProceed_PreviousStepsIncomplete_ReturnsFalse() {
        // Arrange
        testStep1.setStatus(RoutingStep.STATUS_IN_PROGRESS); // Not COMPLETED
        when(routingStepRepository.findByOperation_OperationId(2L)).thenReturn(Optional.of(testStep2));
        when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                .thenReturn(List.of(testStep1, testStep2, testStep3));

        // Act
        boolean result = routingService.canOperationProceed(2L);

        // Assert
        assertFalse(result);
    }

    @Test
    @DisplayName("Should allow parallel routing step when status is READY")
    void canOperationProceed_ParallelRoutingReady_ReturnsTrue() {
        // Arrange
        testRouting.setRoutingType(Routing.TYPE_PARALLEL);
        testStep2.setStatus(RoutingStep.STATUS_READY);
        when(routingStepRepository.findByOperation_OperationId(2L)).thenReturn(Optional.of(testStep2));

        // Act
        boolean result = routingService.canOperationProceed(2L);

        // Assert
        assertTrue(result);
    }

    @Test
    @DisplayName("Should block parallel routing step when status is not READY")
    void canOperationProceed_ParallelRoutingNotReady_ReturnsFalse() {
        // Arrange
        testRouting.setRoutingType(Routing.TYPE_PARALLEL);
        testStep2.setStatus(RoutingStep.STATUS_ON_HOLD); // Not READY
        when(routingStepRepository.findByOperation_OperationId(2L)).thenReturn(Optional.of(testStep2));

        // Act
        boolean result = routingService.canOperationProceed(2L);

        // Assert
        assertFalse(result);
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
            when(routingRepository.save(any(Routing.class))).thenReturn(testRouting);

            // Set all steps to READY to avoid locked status
            testStep1.setStatus(RoutingStep.STATUS_READY);
            testStep2.setStatus(RoutingStep.STATUS_READY);
            testStep3.setStatus(RoutingStep.STATUS_READY);

            Routing result = routingService.updateRouting(1L, request, "testuser");

            assertEquals("Updated Name", result.getRoutingName());
            assertEquals(Routing.TYPE_PARALLEL, result.getRoutingType());
        }

        @Test
        @DisplayName("Should reject update of locked routing")
        void shouldRejectUpdateOfLockedRouting() {
            testStep1.setStatus(RoutingStep.STATUS_COMPLETED);

            RoutingDTO.UpdateRoutingRequest request = RoutingDTO.UpdateRoutingRequest.builder()
                    .routingName("Updated Name")
                    .build();

            when(routingRepository.findById(1L)).thenReturn(Optional.of(testRouting));
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(testStep1, testStep2, testStep3));

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
            testStep1.setStatus(RoutingStep.STATUS_READY);
            testStep2.setStatus(RoutingStep.STATUS_READY);
            testStep3.setStatus(RoutingStep.STATUS_READY);

            when(routingRepository.findById(1L)).thenReturn(Optional.of(testRouting));
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(testStep1, testStep2, testStep3));

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
        @DisplayName("Should detect locked routing")
        void shouldDetectLockedRouting() {
            testStep1.setStatus(RoutingStep.STATUS_COMPLETED);

            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(testStep1, testStep2, testStep3));

            assertTrue(routingService.isRoutingLocked(1L));
        }

        @Test
        @DisplayName("Should detect unlocked routing")
        void shouldDetectUnlockedRouting() {
            testStep1.setStatus(RoutingStep.STATUS_READY);
            testStep2.setStatus(RoutingStep.STATUS_READY);
            testStep3.setStatus(RoutingStep.STATUS_READY);

            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(testStep1, testStep2, testStep3));

            assertFalse(routingService.isRoutingLocked(1L));
        }

        @Test
        @DisplayName("Should return routing status summary")
        void shouldReturnRoutingStatusSummary() {
            testStep1.setStatus(RoutingStep.STATUS_COMPLETED);
            testStep2.setStatus(RoutingStep.STATUS_IN_PROGRESS);
            testStep3.setStatus(RoutingStep.STATUS_READY);

            when(routingRepository.findByIdWithSteps(1L)).thenReturn(Optional.of(testRouting));
            when(routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(1L))
                    .thenReturn(List.of(testStep1, testStep2, testStep3));

            RoutingDTO.RoutingStatus status = routingService.getRoutingStatus(1L);

            assertEquals(3, status.getTotalSteps());
            assertEquals(1, status.getCompletedSteps());
            assertEquals(1, status.getInProgressSteps());
            assertTrue(status.getIsLocked());
            assertFalse(status.getIsComplete());
        }
    }
}
