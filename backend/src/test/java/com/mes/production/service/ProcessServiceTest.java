package com.mes.production.service;

import com.mes.production.dto.ProcessDTO;
import com.mes.production.entity.Operation;
import com.mes.production.entity.OrderLineItem;
import com.mes.production.entity.Process;
import com.mes.production.repository.HoldRecordRepository;
import com.mes.production.repository.OperationRepository;
import com.mes.production.repository.ProcessRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ProcessServiceTest {

    @Mock
    private ProcessRepository processRepository;

    @Mock
    private OperationRepository operationRepository;

    @Mock
    private HoldRecordRepository holdRecordRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private ProcessService processService;

    private Process testProcess;
    private OrderLineItem testOrderLineItem;

    @BeforeEach
    void setUp() {
        // Setup security context
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("admin@mes.com");
        SecurityContextHolder.setContext(securityContext);

        // Setup test data
        testOrderLineItem = OrderLineItem.builder()
                .orderLineId(1L)
                .productSku("STEEL-001")
                .build();

        testProcess = Process.builder()
                .processId(1L)
                .orderLineItem(testOrderLineItem)
                .processName("Melting")
                .stageSequence(1)
                .status(Process.STATUS_IN_PROGRESS)
                .createdOn(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should get process by ID with operations")
    void getProcessById_ValidId_ReturnsProcess() {
        Operation operation = Operation.builder()
                .operationId(1L)
                .operationName("Melt Iron")
                .status("CONFIRMED")
                .sequenceNumber(1)
                .build();
        testProcess.setOperations(List.of(operation));

        when(processRepository.findByIdWithOperations(1L)).thenReturn(Optional.of(testProcess));

        ProcessDTO.Response result = processService.getProcessById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getProcessId());
        assertEquals("Melting", result.getProcessName());
        assertEquals(Process.STATUS_IN_PROGRESS, result.getStatus());
        assertNotNull(result.getOperations());
        assertEquals(1, result.getOperations().size());

        verify(processRepository, times(1)).findByIdWithOperations(1L);
    }

    @Test
    @DisplayName("Should throw exception when process not found")
    void getProcessById_NotFound_ThrowsException() {
        when(processRepository.findByIdWithOperations(999L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> processService.getProcessById(999L));

        assertEquals("Process not found: 999", exception.getMessage());
    }

    @Test
    @DisplayName("Should transition process to QUALITY_PENDING")
    void transitionToQualityPending_ValidProcess_Success() {
        when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("PROCESS", 1L, "ACTIVE"))
                .thenReturn(false);
        when(processRepository.save(any(Process.class))).thenReturn(testProcess);

        ProcessDTO.StatusUpdateResponse result = processService.transitionToQualityPending(1L, "Ready for QC");

        assertNotNull(result);
        assertEquals(1L, result.getProcessId());
        assertEquals(Process.STATUS_IN_PROGRESS, result.getPreviousStatus());
        assertEquals(Process.STATUS_QUALITY_PENDING, result.getNewStatus());
        assertEquals(Process.DECISION_PENDING, result.getUsageDecision());

        verify(processRepository, times(1)).save(any(Process.class));
        verify(auditService, times(1)).logStatusChange(eq("PROCESS"), eq(1L),
                eq(Process.STATUS_IN_PROGRESS), eq(Process.STATUS_QUALITY_PENDING));
    }

    @Test
    @DisplayName("Should throw exception when transitioning from invalid status")
    void transitionToQualityPending_InvalidStatus_ThrowsException() {
        testProcess.setStatus(Process.STATUS_READY);
        when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> processService.transitionToQualityPending(1L, null));

        assertTrue(exception.getMessage().contains("must be IN_PROGRESS or COMPLETED"));
    }

    @Test
    @DisplayName("Should throw exception when process is on hold")
    void transitionToQualityPending_OnHold_ThrowsException() {
        when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("PROCESS", 1L, "ACTIVE"))
                .thenReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> processService.transitionToQualityPending(1L, null));

        assertEquals("Process is on hold and cannot be updated", exception.getMessage());
    }

    @Test
    @DisplayName("Should accept process and transition to COMPLETED")
    void makeQualityDecision_Accept_Success() {
        testProcess.setStatus(Process.STATUS_QUALITY_PENDING);
        when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("PROCESS", 1L, "ACTIVE"))
                .thenReturn(false);
        when(processRepository.save(any(Process.class))).thenReturn(testProcess);

        ProcessDTO.QualityDecisionRequest request = ProcessDTO.QualityDecisionRequest.builder()
                .processId(1L)
                .decision("ACCEPT")
                .notes("Quality approved")
                .build();

        ProcessDTO.StatusUpdateResponse result = processService.makeQualityDecision(request);

        assertNotNull(result);
        assertEquals(Process.STATUS_QUALITY_PENDING, result.getPreviousStatus());
        assertEquals(Process.STATUS_COMPLETED, result.getNewStatus());
        assertEquals(Process.DECISION_ACCEPT, result.getUsageDecision());
        assertTrue(result.getMessage().contains("accepted"));

        verify(auditService, times(1)).logStatusChange(eq("PROCESS"), eq(1L),
                eq(Process.STATUS_QUALITY_PENDING), eq(Process.STATUS_COMPLETED));
    }

    @Test
    @DisplayName("Should reject process and transition to REJECTED")
    void makeQualityDecision_Reject_Success() {
        testProcess.setStatus(Process.STATUS_QUALITY_PENDING);
        when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("PROCESS", 1L, "ACTIVE"))
                .thenReturn(false);
        when(processRepository.save(any(Process.class))).thenReturn(testProcess);

        ProcessDTO.QualityDecisionRequest request = ProcessDTO.QualityDecisionRequest.builder()
                .processId(1L)
                .decision("REJECT")
                .reason("Quality defects found")
                .build();

        ProcessDTO.StatusUpdateResponse result = processService.makeQualityDecision(request);

        assertNotNull(result);
        assertEquals(Process.STATUS_QUALITY_PENDING, result.getPreviousStatus());
        assertEquals(Process.STATUS_REJECTED, result.getNewStatus());
        assertEquals(Process.DECISION_REJECT, result.getUsageDecision());
        assertTrue(result.getMessage().contains("rejected"));

        verify(auditService, times(1)).logStatusChange(eq("PROCESS"), eq(1L),
                eq(Process.STATUS_QUALITY_PENDING), eq(Process.STATUS_REJECTED));
    }

    @Test
    @DisplayName("Should throw exception for invalid decision")
    void makeQualityDecision_InvalidDecision_ThrowsException() {
        testProcess.setStatus(Process.STATUS_QUALITY_PENDING);
        when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("PROCESS", 1L, "ACTIVE"))
                .thenReturn(false);

        ProcessDTO.QualityDecisionRequest request = ProcessDTO.QualityDecisionRequest.builder()
                .processId(1L)
                .decision("INVALID")
                .build();

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> processService.makeQualityDecision(request));

        assertTrue(exception.getMessage().contains("Invalid decision"));
    }

    @Test
    @DisplayName("Should throw exception when making decision on non-QUALITY_PENDING process")
    void makeQualityDecision_WrongStatus_ThrowsException() {
        testProcess.setStatus(Process.STATUS_IN_PROGRESS);
        when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));

        ProcessDTO.QualityDecisionRequest request = ProcessDTO.QualityDecisionRequest.builder()
                .processId(1L)
                .decision("ACCEPT")
                .build();

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> processService.makeQualityDecision(request));

        assertTrue(exception.getMessage().contains("must be in QUALITY_PENDING status"));
    }

    @Test
    @DisplayName("Should update process status with valid transition")
    void updateStatus_ValidTransition_Success() {
        testProcess.setStatus(Process.STATUS_READY);
        when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("PROCESS", 1L, "ACTIVE"))
                .thenReturn(false);
        when(processRepository.save(any(Process.class))).thenReturn(testProcess);

        ProcessDTO.StatusUpdateRequest request = ProcessDTO.StatusUpdateRequest.builder()
                .processId(1L)
                .newStatus("IN_PROGRESS")
                .build();

        ProcessDTO.StatusUpdateResponse result = processService.updateStatus(request);

        assertNotNull(result);
        assertEquals(Process.STATUS_READY, result.getPreviousStatus());
        assertEquals(Process.STATUS_IN_PROGRESS, result.getNewStatus());
    }

    @Test
    @DisplayName("Should throw exception for invalid status transition")
    void updateStatus_InvalidTransition_ThrowsException() {
        testProcess.setStatus(Process.STATUS_READY);
        when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("PROCESS", 1L, "ACTIVE"))
                .thenReturn(false);

        ProcessDTO.StatusUpdateRequest request = ProcessDTO.StatusUpdateRequest.builder()
                .processId(1L)
                .newStatus("COMPLETED") // Invalid: READY cannot go directly to COMPLETED
                .build();

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> processService.updateStatus(request));

        assertTrue(exception.getMessage().contains("Invalid status transition"));
    }

    @Test
    @DisplayName("Should check if all operations are confirmed - true")
    void areAllOperationsConfirmed_AllConfirmed_ReturnsTrue() {
        Operation op1 = Operation.builder().operationId(1L).status("CONFIRMED").build();
        Operation op2 = Operation.builder().operationId(2L).status("CONFIRMED").build();
        testProcess.setOperations(List.of(op1, op2));

        when(processRepository.findByIdWithOperations(1L)).thenReturn(Optional.of(testProcess));

        boolean result = processService.areAllOperationsConfirmed(1L);

        assertTrue(result);
    }

    @Test
    @DisplayName("Should check if all operations are confirmed - false")
    void areAllOperationsConfirmed_NotAllConfirmed_ReturnsFalse() {
        Operation op1 = Operation.builder().operationId(1L).status("CONFIRMED").build();
        Operation op2 = Operation.builder().operationId(2L).status("IN_PROGRESS").build();
        testProcess.setOperations(List.of(op1, op2));

        when(processRepository.findByIdWithOperations(1L)).thenReturn(Optional.of(testProcess));

        boolean result = processService.areAllOperationsConfirmed(1L);

        assertFalse(result);
    }

    @Test
    @DisplayName("Should get processes by status")
    void getProcessesByStatus_ValidStatus_ReturnsProcesses() {
        when(processRepository.findByStatus(Process.STATUS_QUALITY_PENDING))
                .thenReturn(List.of(testProcess));

        List<ProcessDTO.Response> result = processService.getProcessesByStatus(Process.STATUS_QUALITY_PENDING);

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(processRepository, times(1)).findByStatus(Process.STATUS_QUALITY_PENDING);
    }

    @Test
    @DisplayName("Should allow retry - REJECTED to QUALITY_PENDING transition")
    void updateStatus_RejectedToQualityPending_Success() {
        testProcess.setStatus(Process.STATUS_REJECTED);
        when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("PROCESS", 1L, "ACTIVE"))
                .thenReturn(false);
        when(processRepository.save(any(Process.class))).thenReturn(testProcess);

        ProcessDTO.StatusUpdateRequest request = ProcessDTO.StatusUpdateRequest.builder()
                .processId(1L)
                .newStatus("QUALITY_PENDING")
                .build();

        ProcessDTO.StatusUpdateResponse result = processService.updateStatus(request);

        assertNotNull(result);
        assertEquals(Process.STATUS_REJECTED, result.getPreviousStatus());
        assertEquals(Process.STATUS_QUALITY_PENDING, result.getNewStatus());

        verify(processRepository, times(1)).save(any(Process.class));
        verify(auditService, times(1)).logStatusChange(eq("PROCESS"), eq(1L),
                eq(Process.STATUS_REJECTED), eq(Process.STATUS_QUALITY_PENDING));
    }

    @Test
    @DisplayName("Should allow REJECTED to ON_HOLD transition")
    void updateStatus_RejectedToOnHold_Success() {
        testProcess.setStatus(Process.STATUS_REJECTED);
        when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
        when(processRepository.save(any(Process.class))).thenReturn(testProcess);

        ProcessDTO.StatusUpdateRequest request = ProcessDTO.StatusUpdateRequest.builder()
                .processId(1L)
                .newStatus("ON_HOLD")
                .build();

        ProcessDTO.StatusUpdateResponse result = processService.updateStatus(request);

        assertNotNull(result);
        assertEquals(Process.STATUS_REJECTED, result.getPreviousStatus());
        assertEquals(Process.STATUS_ON_HOLD, result.getNewStatus());
    }

    @Test
    @DisplayName("Should get processes by REJECTED status")
    void getProcessesByStatus_Rejected_ReturnsProcesses() {
        testProcess.setStatus(Process.STATUS_REJECTED);
        when(processRepository.findByStatus(Process.STATUS_REJECTED))
                .thenReturn(List.of(testProcess));

        List<ProcessDTO.Response> result = processService.getProcessesByStatus(Process.STATUS_REJECTED);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(Process.STATUS_REJECTED, result.get(0).getStatus());
        verify(processRepository, times(1)).findByStatus(Process.STATUS_REJECTED);
    }
}
