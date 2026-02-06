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
}
