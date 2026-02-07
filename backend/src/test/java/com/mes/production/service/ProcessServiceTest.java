package com.mes.production.service;

import com.mes.production.dto.ProcessDTO;
import com.mes.production.entity.Operation;
import com.mes.production.entity.Process;
import com.mes.production.entity.ProcessStatus;
import com.mes.production.repository.OperationRepository;
import com.mes.production.repository.ProcessRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests for ProcessService - design-time Process template management.
 *
 * Process Status Model (Design-Time Only):
 * - DRAFT: Process being defined, not ready for use
 * - ACTIVE: Process approved and usable for execution
 * - INACTIVE: Process retired/disabled, historical access only
 *
 * Valid Transitions:
 * - DRAFT → ACTIVE (via activateProcess)
 * - INACTIVE → ACTIVE (via activateProcess)
 * - ACTIVE → INACTIVE (via deactivateProcess or deleteProcess)
 *
 * Blocked Transitions:
 * - ACTIVE → DRAFT (not allowed)
 * - INACTIVE → DRAFT (not allowed)
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ProcessServiceTest {

    @Mock
    private ProcessRepository processRepository;

    @Mock
    private OperationRepository operationRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private ProcessService processService;

    private Process testProcess;

    @BeforeEach
    void setUp() {
        // Setup security context
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("admin@mes.com");
        SecurityContextHolder.setContext(securityContext);

        // Setup test data - Process is design-time only (DRAFT/ACTIVE/INACTIVE)
        testProcess = Process.builder()
                .processId(1L)
                .processName("Melting Process")
                .status(ProcessStatus.DRAFT)
                .createdOn(LocalDateTime.now())
                .createdBy("admin@mes.com")
                .build();
    }

    // ==================== CRUD Operations ====================

    @Nested
    @DisplayName("CRUD Operations")
    class CrudOperations {

        @Test
        @DisplayName("Should get process by ID with operations")
        void getProcessById_ValidId_ReturnsProcess() {
            Operation operation = Operation.builder()
                    .operationId(1L)
                    .operationName("Melt Iron")
                    .status("READY")
                    .sequenceNumber(1)
                    .build();
            testProcess.setOperations(List.of(operation));

            when(processRepository.findByIdWithOperations(1L)).thenReturn(Optional.of(testProcess));

            ProcessDTO.Response result = processService.getProcessById(1L);

            assertNotNull(result);
            assertEquals(1L, result.getProcessId());
            assertEquals("Melting Process", result.getProcessName());
            assertEquals("DRAFT", result.getStatus());
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
        @DisplayName("Should create process with DRAFT status by default")
        void createProcess_NoStatus_DefaultsToDraft() {
            ProcessDTO.CreateRequest request = ProcessDTO.CreateRequest.builder()
                    .processName("New Process")
                    .build();

            when(processRepository.save(any(Process.class))).thenAnswer(inv -> {
                Process p = inv.getArgument(0);
                p.setProcessId(2L);
                return p;
            });

            ProcessDTO.Response result = processService.createProcess(request);

            assertNotNull(result);
            assertEquals("DRAFT", result.getStatus());
            verify(auditService, times(1)).logCreate(eq("PROCESS"), eq(2L), eq("New Process"));
        }

        @Test
        @DisplayName("Should update process name")
        void updateProcess_ValidUpdate_Success() {
            when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
            when(processRepository.save(any(Process.class))).thenReturn(testProcess);

            ProcessDTO.UpdateRequest request = ProcessDTO.UpdateRequest.builder()
                    .processName("Updated Melting Process")
                    .build();

            ProcessDTO.Response result = processService.updateProcess(1L, request);

            assertNotNull(result);
            assertEquals("Updated Melting Process", result.getProcessName());
            verify(auditService, times(1)).logUpdate(eq("PROCESS"), eq(1L), eq("processName"),
                    eq("Melting Process"), eq("Updated Melting Process"));
        }

        @Test
        @DisplayName("Should soft delete process (set INACTIVE)")
        void deleteProcess_NoOperations_SetsInactive() {
            when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
            when(operationRepository.findByProcessIdOrderBySequence(1L)).thenReturn(Collections.emptyList());
            when(processRepository.save(any(Process.class))).thenReturn(testProcess);

            processService.deleteProcess(1L);

            assertEquals(ProcessStatus.INACTIVE, testProcess.getStatus());
            verify(auditService, times(1)).logDelete(eq("PROCESS"), eq(1L), eq("Melting Process"));
        }

        @Test
        @DisplayName("Should not delete process with existing operations")
        void deleteProcess_HasOperations_ThrowsException() {
            Operation operation = Operation.builder().operationId(1L).build();
            when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
            when(operationRepository.findByProcessIdOrderBySequence(1L)).thenReturn(List.of(operation));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> processService.deleteProcess(1L));

            assertTrue(exception.getMessage().contains("Cannot delete process with existing operations"));
        }
    }

    // ==================== Status Transitions ====================

    @Nested
    @DisplayName("Status Transitions - Valid")
    class ValidStatusTransitions {

        @Test
        @DisplayName("Should activate DRAFT process")
        void activateProcess_FromDraft_Success() {
            testProcess.setStatus(ProcessStatus.DRAFT);
            when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
            when(processRepository.save(any(Process.class))).thenReturn(testProcess);

            ProcessDTO.Response result = processService.activateProcess(1L);

            assertNotNull(result);
            assertEquals("ACTIVE", result.getStatus());
            verify(auditService, times(1)).logStatusChange(eq("PROCESS"), eq(1L),
                    eq("DRAFT"), eq("ACTIVE"));
        }

        @Test
        @DisplayName("Should reactivate INACTIVE process")
        void activateProcess_FromInactive_Success() {
            testProcess.setStatus(ProcessStatus.INACTIVE);
            when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
            when(processRepository.save(any(Process.class))).thenReturn(testProcess);

            ProcessDTO.Response result = processService.activateProcess(1L);

            assertNotNull(result);
            assertEquals("ACTIVE", result.getStatus());
            verify(auditService, times(1)).logStatusChange(eq("PROCESS"), eq(1L),
                    eq("INACTIVE"), eq("ACTIVE"));
        }

        @Test
        @DisplayName("Should deactivate ACTIVE process")
        void deactivateProcess_FromActive_Success() {
            testProcess.setStatus(ProcessStatus.ACTIVE);
            when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
            when(processRepository.save(any(Process.class))).thenReturn(testProcess);

            ProcessDTO.Response result = processService.deactivateProcess(1L);

            assertNotNull(result);
            assertEquals("INACTIVE", result.getStatus());
            verify(auditService, times(1)).logStatusChange(eq("PROCESS"), eq(1L),
                    eq("ACTIVE"), eq("INACTIVE"));
        }
    }

    @Nested
    @DisplayName("Status Transitions - Invalid")
    class InvalidStatusTransitions {

        @Test
        @DisplayName("Should not activate already ACTIVE process")
        void activateProcess_AlreadyActive_ThrowsException() {
            testProcess.setStatus(ProcessStatus.ACTIVE);
            when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> processService.activateProcess(1L));

            assertTrue(exception.getMessage().contains("must be DRAFT or INACTIVE to activate"));
            verify(processRepository, never()).save(any(Process.class));
        }

        @Test
        @DisplayName("Should not deactivate DRAFT process")
        void deactivateProcess_FromDraft_ThrowsException() {
            testProcess.setStatus(ProcessStatus.DRAFT);
            when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> processService.deactivateProcess(1L));

            assertTrue(exception.getMessage().contains("must be ACTIVE to deactivate"));
            verify(processRepository, never()).save(any(Process.class));
        }

        @Test
        @DisplayName("Should not deactivate INACTIVE process")
        void deactivateProcess_FromInactive_ThrowsException() {
            testProcess.setStatus(ProcessStatus.INACTIVE);
            when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> processService.deactivateProcess(1L));

            assertTrue(exception.getMessage().contains("must be ACTIVE to deactivate"));
            verify(processRepository, never()).save(any(Process.class));
        }
    }

    // ==================== Query Operations ====================

    @Nested
    @DisplayName("Query Operations")
    class QueryOperations {

        @Test
        @DisplayName("Should get all processes")
        void getAllProcesses_ReturnsAll() {
            Process draftProcess = Process.builder().processId(1L).processName("Draft").status(ProcessStatus.DRAFT).build();
            Process activeProcess = Process.builder().processId(2L).processName("Active").status(ProcessStatus.ACTIVE).build();
            Process inactiveProcess = Process.builder().processId(3L).processName("Inactive").status(ProcessStatus.INACTIVE).build();

            when(processRepository.findAll()).thenReturn(List.of(draftProcess, activeProcess, inactiveProcess));

            List<ProcessDTO.Response> result = processService.getAllProcesses();

            assertEquals(3, result.size());
        }

        @Test
        @DisplayName("Should get active processes only")
        void getActiveProcesses_ReturnsOnlyActive() {
            Process activeProcess = Process.builder().processId(1L).processName("Active").status(ProcessStatus.ACTIVE).build();

            when(processRepository.findByStatus(ProcessStatus.ACTIVE)).thenReturn(List.of(activeProcess));

            List<ProcessDTO.Response> result = processService.getActiveProcesses();

            assertEquals(1, result.size());
            assertEquals("ACTIVE", result.get(0).getStatus());
        }

        @Test
        @DisplayName("Should get processes by DRAFT status")
        void getProcessesByStatus_Draft_ReturnsDraftProcesses() {
            when(processRepository.findByStatus(ProcessStatus.DRAFT)).thenReturn(List.of(testProcess));

            List<ProcessDTO.Response> result = processService.getProcessesByStatus("DRAFT");

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("DRAFT", result.get(0).getStatus());
        }

        @Test
        @DisplayName("Should get processes by INACTIVE status")
        void getProcessesByStatus_Inactive_ReturnsInactiveProcesses() {
            testProcess.setStatus(ProcessStatus.INACTIVE);
            when(processRepository.findByStatus(ProcessStatus.INACTIVE)).thenReturn(List.of(testProcess));

            List<ProcessDTO.Response> result = processService.getProcessesByStatus("INACTIVE");

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("INACTIVE", result.get(0).getStatus());
        }

        @Test
        @DisplayName("Should throw exception for invalid status")
        void getProcessesByStatus_InvalidStatus_ThrowsException() {
            assertThrows(IllegalArgumentException.class,
                    () -> processService.getProcessesByStatus("INVALID_STATUS"));
        }
    }

    // ==================== Audit Trail ====================

    @Nested
    @DisplayName("Audit Trail")
    class AuditTrail {

        @Test
        @DisplayName("Should log create event")
        void createProcess_LogsAudit() {
            ProcessDTO.CreateRequest request = ProcessDTO.CreateRequest.builder()
                    .processName("Audited Process")
                    .build();

            when(processRepository.save(any(Process.class))).thenAnswer(inv -> {
                Process p = inv.getArgument(0);
                p.setProcessId(5L);
                return p;
            });

            processService.createProcess(request);

            verify(auditService, times(1)).logCreate(eq("PROCESS"), eq(5L), eq("Audited Process"));
        }

        @Test
        @DisplayName("Should log update event")
        void updateProcess_LogsAudit() {
            when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
            when(processRepository.save(any(Process.class))).thenReturn(testProcess);

            ProcessDTO.UpdateRequest request = ProcessDTO.UpdateRequest.builder()
                    .processName("New Name")
                    .build();

            processService.updateProcess(1L, request);

            verify(auditService, times(1)).logUpdate(eq("PROCESS"), eq(1L), eq("processName"),
                    eq("Melting Process"), eq("New Name"));
        }

        @Test
        @DisplayName("Should log status change on activate")
        void activateProcess_LogsStatusChange() {
            testProcess.setStatus(ProcessStatus.DRAFT);
            when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
            when(processRepository.save(any(Process.class))).thenReturn(testProcess);

            processService.activateProcess(1L);

            verify(auditService, times(1)).logStatusChange(eq("PROCESS"), eq(1L),
                    eq("DRAFT"), eq("ACTIVE"));
        }

        @Test
        @DisplayName("Should log status change on deactivate")
        void deactivateProcess_LogsStatusChange() {
            testProcess.setStatus(ProcessStatus.ACTIVE);
            when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
            when(processRepository.save(any(Process.class))).thenReturn(testProcess);

            processService.deactivateProcess(1L);

            verify(auditService, times(1)).logStatusChange(eq("PROCESS"), eq(1L),
                    eq("ACTIVE"), eq("INACTIVE"));
        }

        @Test
        @DisplayName("Should log delete event")
        void deleteProcess_LogsAudit() {
            when(processRepository.findById(1L)).thenReturn(Optional.of(testProcess));
            when(operationRepository.findByProcessIdOrderBySequence(1L)).thenReturn(Collections.emptyList());
            when(processRepository.save(any(Process.class))).thenReturn(testProcess);

            processService.deleteProcess(1L);

            verify(auditService, times(1)).logDelete(eq("PROCESS"), eq(1L), eq("Melting Process"));
        }
    }

    // ==================== Design-Time Behavior Validation ====================

    @Nested
    @DisplayName("Design-Time Entity Behavior")
    class DesignTimeBehavior {

        @Test
        @DisplayName("DRAFT process should not be available for execution queries")
        void draftProcess_NotInActiveList() {
            testProcess.setStatus(ProcessStatus.DRAFT);
            when(processRepository.findByStatus(ProcessStatus.ACTIVE)).thenReturn(Collections.emptyList());

            List<ProcessDTO.Response> result = processService.getActiveProcesses();

            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("INACTIVE process should not be available for execution queries")
        void inactiveProcess_NotInActiveList() {
            testProcess.setStatus(ProcessStatus.INACTIVE);
            when(processRepository.findByStatus(ProcessStatus.ACTIVE)).thenReturn(Collections.emptyList());

            List<ProcessDTO.Response> result = processService.getActiveProcesses();

            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("Only ACTIVE process should be in active list")
        void onlyActiveProcess_InActiveList() {
            Process activeProcess = Process.builder()
                    .processId(1L)
                    .processName("Active Process")
                    .status(ProcessStatus.ACTIVE)
                    .build();

            when(processRepository.findByStatus(ProcessStatus.ACTIVE)).thenReturn(List.of(activeProcess));

            List<ProcessDTO.Response> result = processService.getActiveProcesses();

            assertEquals(1, result.size());
            assertEquals("Active Process", result.get(0).getProcessName());
            assertEquals("ACTIVE", result.get(0).getStatus());
        }

        @Test
        @DisplayName("Process status should use enum (not strings)")
        void processStatus_UsesEnum() {
            assertNotNull(ProcessStatus.DRAFT);
            assertNotNull(ProcessStatus.ACTIVE);
            assertNotNull(ProcessStatus.INACTIVE);
            assertEquals(3, ProcessStatus.values().length);
        }

        @Test
        @DisplayName("New process should default to DRAFT status")
        void newProcess_DefaultsToDraft() {
            ProcessDTO.CreateRequest request = ProcessDTO.CreateRequest.builder()
                    .processName("Default Status Test")
                    .build();

            when(processRepository.save(any(Process.class))).thenAnswer(inv -> {
                Process p = inv.getArgument(0);
                assertEquals(ProcessStatus.DRAFT, p.getStatus());
                p.setProcessId(10L);
                return p;
            });

            ProcessDTO.Response result = processService.createProcess(request);

            assertEquals("DRAFT", result.getStatus());
        }
    }
}
