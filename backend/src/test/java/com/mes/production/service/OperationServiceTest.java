package com.mes.production.service;

import com.mes.production.dto.OperationDTO;
import com.mes.production.entity.Operation;
import com.mes.production.entity.Process;
import com.mes.production.repository.OperationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OperationServiceTest {

    @Mock
    private OperationRepository operationRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private OperationService operationService;

    private Operation testOperation;
    private Process testProcess;

    @BeforeEach
    void setUp() {
        testProcess = Process.builder()
                .processId(1L)
                .processName("Melting Process")
                .build();

        testOperation = Operation.builder()
                .operationId(1L)
                .process(testProcess)
                .operationName("Melting")
                .operationCode("OP-001")
                .operationType("MELTING")
                .sequenceNumber(1)
                .status(Operation.STATUS_READY)
                .targetQty(new BigDecimal("100.00"))
                .confirmedQty(BigDecimal.ZERO)
                .build();
    }

    private void setupSecurityContext() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("admin@mes.com");
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    @DisplayName("Should get all operations")
    void getAllOperations_ReturnsAllOperations() {
        when(operationRepository.findAll()).thenReturn(List.of(testOperation));

        List<OperationDTO> result = operationService.getAllOperations();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("OP-001", result.get(0).getOperationCode());
    }

    @Test
    @DisplayName("Should get operations by status")
    void getOperationsByStatus_ReturnsFilteredOperations() {
        when(operationRepository.findByStatus(Operation.STATUS_READY)).thenReturn(List.of(testOperation));

        List<OperationDTO> result = operationService.getOperationsByStatus(Operation.STATUS_READY);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("READY", result.get(0).getStatus());
    }

    @Nested
    @DisplayName("Block Operation Tests")
    class BlockOperationTests {

        @Test
        @DisplayName("Should block ready operation")
        void blockOperation_ReadyOperation_BlocksSuccessfully() {
            setupSecurityContext();
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
            when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

            OperationDTO.StatusUpdateResponse result = operationService.blockOperation(1L, "Material shortage");

            assertEquals(1L, result.getOperationId());
            assertEquals("READY", result.getPreviousStatus());
            assertEquals("BLOCKED", result.getNewStatus());
            assertEquals("admin@mes.com", result.getUpdatedBy());
            assertTrue(result.getMessage().contains("Material shortage"));

            verify(operationRepository, times(1)).save(any(Operation.class));
            verify(auditService, times(1)).logStatusChange("OPERATION", 1L, "READY", "BLOCKED");
        }

        @Test
        @DisplayName("Should block in-progress operation")
        void blockOperation_InProgressOperation_BlocksSuccessfully() {
            setupSecurityContext();
            testOperation.setStatus(Operation.STATUS_IN_PROGRESS);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
            when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

            OperationDTO.StatusUpdateResponse result = operationService.blockOperation(1L, "Quality issue");

            assertEquals("IN_PROGRESS", result.getPreviousStatus());
            assertEquals("BLOCKED", result.getNewStatus());
        }

        @Test
        @DisplayName("Should throw exception when blocking confirmed operation")
        void blockOperation_ConfirmedOperation_ThrowsException() {
            setupSecurityContext();
            testOperation.setStatus(Operation.STATUS_CONFIRMED);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> operationService.blockOperation(1L, "Block confirmed"));

            assertTrue(exception.getMessage().contains("confirmed"));
        }

        @Test
        @DisplayName("Should throw exception when blocking already blocked operation")
        void blockOperation_AlreadyBlocked_ThrowsException() {
            setupSecurityContext();
            testOperation.setStatus(Operation.STATUS_BLOCKED);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> operationService.blockOperation(1L, "Block again"));

            assertTrue(exception.getMessage().contains("already blocked"));
        }

        @Test
        @DisplayName("Should get blocked operations")
        void getBlockedOperations_ReturnsBlockedOnly() {
            testOperation.setStatus(Operation.STATUS_BLOCKED);
            when(operationRepository.findByStatus(Operation.STATUS_BLOCKED))
                    .thenReturn(List.of(testOperation));

            List<OperationDTO> result = operationService.getBlockedOperations();

            assertEquals(1, result.size());
            assertEquals("BLOCKED", result.get(0).getStatus());
        }
    }

    @Nested
    @DisplayName("Unblock Operation Tests")
    class UnblockOperationTests {

        @Test
        @DisplayName("Should unblock blocked operation")
        void unblockOperation_BlockedOperation_UnblocksSuccessfully() {
            setupSecurityContext();
            testOperation.setStatus(Operation.STATUS_BLOCKED);
            testOperation.setBlockReason("Material shortage");
            testOperation.setBlockedBy("admin@mes.com");
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
            when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

            OperationDTO.StatusUpdateResponse result = operationService.unblockOperation(1L);

            assertEquals(1L, result.getOperationId());
            assertEquals("BLOCKED", result.getPreviousStatus());
            assertEquals("READY", result.getNewStatus());

            verify(operationRepository, times(1)).save(any(Operation.class));
            verify(auditService, times(1)).logStatusChange("OPERATION", 1L, "BLOCKED", "READY");
        }

        @Test
        @DisplayName("Should throw exception when unblocking non-blocked operation")
        void unblockOperation_NotBlocked_ThrowsException() {
            setupSecurityContext();
            testOperation.setStatus(Operation.STATUS_READY);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> operationService.unblockOperation(1L));

            assertTrue(exception.getMessage().contains("not blocked"));
        }
    }

    @Test
    @DisplayName("Should throw exception when operation not found")
    void getOperationById_NotFound_ThrowsException() {
        when(operationRepository.findByIdWithDetails(999L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> operationService.getOperationById(999L));

        assertTrue(exception.getMessage().contains("not found"));
    }

    // ==================== NEW TESTS: Pause Operation (R-11) ====================

    @Nested
    @DisplayName("Pause Operation Tests (R-11)")
    class PauseOperationTests {

        @Test
        @DisplayName("Should pause IN_PROGRESS operation successfully")
        void pauseOperation_InProgressOperation_PausesSuccessfully() {
            setupSecurityContext();
            testOperation.setStatus(Operation.STATUS_IN_PROGRESS);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
            when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

            OperationDTO.StatusUpdateResponse result = operationService.pauseOperation(1L);

            assertEquals(1L, result.getOperationId());
            assertEquals("IN_PROGRESS", result.getPreviousStatus());
            assertEquals("PAUSED", result.getNewStatus());
            assertEquals("admin@mes.com", result.getUpdatedBy());
            assertTrue(result.getMessage().contains("paused"));

            verify(operationRepository, times(1)).save(any(Operation.class));
            verify(auditService, times(1)).logStatusChange("OPERATION", 1L, "IN_PROGRESS", "PAUSED");
        }

        @Test
        @DisplayName("Should throw exception when pausing READY operation")
        void pauseOperation_ReadyOperation_ThrowsException() {
            setupSecurityContext();
            testOperation.setStatus(Operation.STATUS_READY);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> operationService.pauseOperation(1L));

            assertTrue(exception.getMessage().contains("Cannot pause"));
            assertTrue(exception.getMessage().contains("IN_PROGRESS"));
            verify(operationRepository, never()).save(any(Operation.class));
            verify(auditService, never()).logStatusChange(anyString(), anyLong(), anyString(), anyString());
        }

        @Test
        @DisplayName("Should throw exception when pausing CONFIRMED operation")
        void pauseOperation_ConfirmedOperation_ThrowsException() {
            setupSecurityContext();
            testOperation.setStatus(Operation.STATUS_CONFIRMED);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> operationService.pauseOperation(1L));

            assertTrue(exception.getMessage().contains("Cannot pause"));
        }

        @Test
        @DisplayName("Should throw exception when pausing BLOCKED operation")
        void pauseOperation_BlockedOperation_ThrowsException() {
            setupSecurityContext();
            testOperation.setStatus(Operation.STATUS_BLOCKED);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> operationService.pauseOperation(1L));

            assertTrue(exception.getMessage().contains("Cannot pause"));
        }

        @Test
        @DisplayName("Should throw exception when pausing NOT_STARTED operation")
        void pauseOperation_NotStartedOperation_ThrowsException() {
            setupSecurityContext();
            testOperation.setStatus(Operation.STATUS_NOT_STARTED);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> operationService.pauseOperation(1L));

            assertTrue(exception.getMessage().contains("Cannot pause"));
        }

        @Test
        @DisplayName("Should throw exception when pausing non-existent operation")
        void pauseOperation_NotFound_ThrowsException() {
            setupSecurityContext();
            when(operationRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> operationService.pauseOperation(999L));
        }
    }

    // ==================== NEW TESTS: Resume Operation (R-11) ====================

    @Nested
    @DisplayName("Resume Operation Tests (R-11)")
    class ResumeOperationTests {

        @Test
        @DisplayName("Should resume PAUSED operation to IN_PROGRESS")
        void resumeOperation_PausedOperation_ResumesSuccessfully() {
            setupSecurityContext();
            testOperation.setStatus(Operation.STATUS_PAUSED);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
            when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

            OperationDTO.StatusUpdateResponse result = operationService.resumeOperation(1L);

            assertEquals(1L, result.getOperationId());
            assertEquals("PAUSED", result.getPreviousStatus());
            assertEquals("IN_PROGRESS", result.getNewStatus());
            assertEquals("admin@mes.com", result.getUpdatedBy());
            assertTrue(result.getMessage().contains("resumed"));

            verify(operationRepository, times(1)).save(any(Operation.class));
            verify(auditService, times(1)).logStatusChange("OPERATION", 1L, "PAUSED", "IN_PROGRESS");
        }

        @Test
        @DisplayName("Should throw exception when resuming READY operation")
        void resumeOperation_ReadyOperation_ThrowsException() {
            setupSecurityContext();
            testOperation.setStatus(Operation.STATUS_READY);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> operationService.resumeOperation(1L));

            assertTrue(exception.getMessage().contains("Cannot resume"));
            assertTrue(exception.getMessage().contains("PAUSED"));
            verify(operationRepository, never()).save(any(Operation.class));
            verify(auditService, never()).logStatusChange(anyString(), anyLong(), anyString(), anyString());
        }

        @Test
        @DisplayName("Should throw exception when resuming IN_PROGRESS operation")
        void resumeOperation_InProgressOperation_ThrowsException() {
            setupSecurityContext();
            testOperation.setStatus(Operation.STATUS_IN_PROGRESS);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> operationService.resumeOperation(1L));

            assertTrue(exception.getMessage().contains("Cannot resume"));
        }

        @Test
        @DisplayName("Should throw exception when resuming BLOCKED operation")
        void resumeOperation_BlockedOperation_ThrowsException() {
            setupSecurityContext();
            testOperation.setStatus(Operation.STATUS_BLOCKED);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> operationService.resumeOperation(1L));

            assertTrue(exception.getMessage().contains("Cannot resume"));
        }

        @Test
        @DisplayName("Should throw exception when resuming non-existent operation")
        void resumeOperation_NotFound_ThrowsException() {
            setupSecurityContext();
            when(operationRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> operationService.resumeOperation(999L));
        }
    }

    // ==================== NEW TESTS: Audit Verification ====================

    @Nested
    @DisplayName("Audit Logging Verification Tests")
    class AuditLoggingTests {

        @Test
        @DisplayName("Should log audit for block operation with correct statuses")
        void blockOperation_ShouldLogAudit_WithCorrectStatuses() {
            setupSecurityContext();
            testOperation.setStatus(Operation.STATUS_READY);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
            when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

            operationService.blockOperation(1L, "Material shortage");

            verify(auditService, times(1)).logStatusChange("OPERATION", 1L, "READY", "BLOCKED");
        }

        @Test
        @DisplayName("Should log audit for unblock operation with correct statuses")
        void unblockOperation_ShouldLogAudit_WithCorrectStatuses() {
            setupSecurityContext();
            testOperation.setStatus(Operation.STATUS_BLOCKED);
            testOperation.setBlockReason("Material shortage");
            testOperation.setBlockedBy("admin@mes.com");
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
            when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

            operationService.unblockOperation(1L);

            verify(auditService, times(1)).logStatusChange("OPERATION", 1L, "BLOCKED", "READY");
        }

        @Test
        @DisplayName("Should log audit for pause operation")
        void pauseOperation_ShouldLogAudit() {
            setupSecurityContext();
            testOperation.setStatus(Operation.STATUS_IN_PROGRESS);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
            when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

            operationService.pauseOperation(1L);

            verify(auditService, times(1)).logStatusChange("OPERATION", 1L, "IN_PROGRESS", "PAUSED");
        }

        @Test
        @DisplayName("Should log audit for resume operation")
        void resumeOperation_ShouldLogAudit() {
            setupSecurityContext();
            testOperation.setStatus(Operation.STATUS_PAUSED);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
            when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

            operationService.resumeOperation(1L);

            verify(auditService, times(1)).logStatusChange("OPERATION", 1L, "PAUSED", "IN_PROGRESS");
        }

        @Test
        @DisplayName("Should NOT log audit when pause fails due to invalid status")
        void pauseOperation_InvalidStatus_NoAuditLogged() {
            setupSecurityContext();
            testOperation.setStatus(Operation.STATUS_READY);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));

            assertThrows(RuntimeException.class, () -> operationService.pauseOperation(1L));

            verify(auditService, never()).logStatusChange(anyString(), anyLong(), anyString(), anyString());
        }
    }

    // ==================== NEW TESTS: getOperationsByStatus ====================

    @Nested
    @DisplayName("Get Operations By Status Tests")
    class GetOperationsByStatusTests {

        @Test
        @DisplayName("Should return PAUSED operations")
        void getOperationsByStatus_Paused_ReturnsPausedOperations() {
            Operation pausedOp = Operation.builder()
                    .operationId(2L)
                    .process(testProcess)
                    .operationName("Casting")
                    .operationCode("OP-002")
                    .operationType("CASTING")
                    .sequenceNumber(2)
                    .status(Operation.STATUS_PAUSED)
                    .build();

            when(operationRepository.findByStatus(Operation.STATUS_PAUSED)).thenReturn(List.of(pausedOp));

            List<OperationDTO> result = operationService.getOperationsByStatus(Operation.STATUS_PAUSED);

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("PAUSED", result.get(0).getStatus());
            assertEquals("OP-002", result.get(0).getOperationCode());
        }

        @Test
        @DisplayName("Should return empty list when no operations match status")
        void getOperationsByStatus_NoMatch_ReturnsEmptyList() {
            when(operationRepository.findByStatus("PAUSED")).thenReturn(List.of());

            List<OperationDTO> result = operationService.getOperationsByStatus("PAUSED");

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("Should return multiple operations for the same status")
        void getOperationsByStatus_MultipleMatches_ReturnsAll() {
            Operation readyOp1 = Operation.builder()
                    .operationId(1L).process(testProcess)
                    .operationName("Melting").operationCode("OP-001")
                    .sequenceNumber(1).status(Operation.STATUS_READY).build();

            Operation readyOp2 = Operation.builder()
                    .operationId(3L).process(testProcess)
                    .operationName("Rolling").operationCode("OP-003")
                    .sequenceNumber(3).status(Operation.STATUS_READY).build();

            when(operationRepository.findByStatus(Operation.STATUS_READY)).thenReturn(List.of(readyOp1, readyOp2));

            List<OperationDTO> result = operationService.getOperationsByStatus(Operation.STATUS_READY);

            assertEquals(2, result.size());
        }
    }
}
