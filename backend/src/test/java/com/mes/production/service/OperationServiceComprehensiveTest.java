package com.mes.production.service;

import com.mes.production.dto.OperationDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.entity.Operation;
import com.mes.production.entity.Order;
import com.mes.production.entity.OrderLineItem;
import com.mes.production.entity.Process;
import com.mes.production.repository.OperationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
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
 * Comprehensive test suite for OperationService.
 *
 * Test Categories:
 * 1. getOperationById() - Success and not found
 * 2. getReadyOperations() / getOperationsByStatus()
 * 3. updateOperationStatus() - Block and unblock
 * 4. getAllOperations() - Listing all operations
 * 5. Paginated Operations - Pagination and filtering
 * 6. Edge Cases - Null handling, status transitions
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("OperationService Comprehensive Tests")
class OperationServiceComprehensiveTest {

    @Mock
    private OperationRepository operationRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private OperationService operationService;

    private Operation testOperation;
    private Process testProcess;
    private OrderLineItem testOrderLine;

    @BeforeEach
    void setUp() {
        setupSecurityContext();
        setupTestEntities();
    }

    private void setupSecurityContext() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("admin@mes.com");
        SecurityContextHolder.setContext(securityContext);
    }

    private void setupTestEntities() {
        Order testOrder = Order.builder()
                .orderId(1L)
                .orderNumber("ORD-001")
                .build();

        testOrderLine = OrderLineItem.builder()
                .orderLineId(1L)
                .order(testOrder)
                .productSku("STEEL-001")
                .productName("Steel Coil")
                .build();

        testProcess = Process.builder()
                .processId(1L)
                .processName("Melting Process")
                .build();

        testOperation = Operation.builder()
                .operationId(1L)
                .process(testProcess)
                .orderLineItem(testOrderLine)
                .operationName("Melting")
                .operationCode("OP-001")
                .operationType("MELTING")
                .sequenceNumber(1)
                .status(Operation.STATUS_READY)
                .targetQty(new BigDecimal("100.00"))
                .confirmedQty(BigDecimal.ZERO)
                .build();
    }

    // ========================================================================
    // 1. GET OPERATION BY ID
    // ========================================================================

    @Nested
    @DisplayName("1. Get Operation By ID Tests")
    class GetOperationByIdTests {

        @Test
        @DisplayName("1.1 should_returnOperation_when_operationExists")
        void should_returnOperation_when_operationExists() {
            // Arrange
            when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));

            // Act
            OperationDTO result = operationService.getOperationById(1L);

            // Assert
            assertNotNull(result);
            assertEquals(1L, result.getOperationId());
            assertEquals("Melting", result.getOperationName());
            assertEquals("OP-001", result.getOperationCode());
            assertEquals("MELTING", result.getOperationType());
            assertEquals(1, result.getSequenceNumber());
            assertEquals("READY", result.getStatus());
        }

        @Test
        @DisplayName("1.2 should_throwException_when_operationNotFound")
        void should_throwException_when_operationNotFound() {
            // Arrange
            when(operationRepository.findByIdWithDetails(999L)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> operationService.getOperationById(999L));

            assertTrue(exception.getMessage().contains("not found"));
        }

        @Test
        @DisplayName("1.3 should_includeProcessInfo_when_processExists")
        void should_includeProcessInfo_when_processExists() {
            // Arrange
            when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));

            // Act
            OperationDTO result = operationService.getOperationById(1L);

            // Assert
            assertEquals(1L, result.getProcessId());
            assertEquals("Melting Process", result.getProcessName());
        }

        @Test
        @DisplayName("1.4 should_includeProductInfo_when_orderLineExists")
        void should_includeProductInfo_when_orderLineExists() {
            // Arrange
            when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));

            // Act
            OperationDTO result = operationService.getOperationById(1L);

            // Assert
            assertEquals("STEEL-001", result.getProductSku());
        }
    }

    // ========================================================================
    // 2. GET OPERATIONS BY STATUS
    // ========================================================================

    @Nested
    @DisplayName("2. Get Operations By Status Tests")
    class GetOperationsByStatusTests {

        @Test
        @DisplayName("2.1 should_returnOperations_when_statusMatches")
        void should_returnOperations_when_statusMatches() {
            // Arrange
            when(operationRepository.findByStatus(Operation.STATUS_READY))
                    .thenReturn(List.of(testOperation));

            // Act
            List<OperationDTO> result = operationService.getOperationsByStatus(Operation.STATUS_READY);

            // Assert
            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("READY", result.get(0).getStatus());
        }

        @Test
        @DisplayName("2.2 should_returnEmptyList_when_noMatchingStatus")
        void should_returnEmptyList_when_noMatchingStatus() {
            // Arrange
            when(operationRepository.findByStatus("UNKNOWN")).thenReturn(List.of());

            // Act
            List<OperationDTO> result = operationService.getOperationsByStatus("UNKNOWN");

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("2.3 should_returnBlockedOperations_when_callingGetBlockedOperations")
        void should_returnBlockedOperations_when_callingGetBlockedOperations() {
            // Arrange
            testOperation.setStatus(Operation.STATUS_BLOCKED);
            when(operationRepository.findByStatus(Operation.STATUS_BLOCKED))
                    .thenReturn(List.of(testOperation));

            // Act
            List<OperationDTO> result = operationService.getBlockedOperations();

            // Assert
            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("BLOCKED", result.get(0).getStatus());
        }

        @Test
        @DisplayName("2.4 should_returnMultipleOperations_when_multipleMatch")
        void should_returnMultipleOperations_when_multipleMatch() {
            // Arrange
            Operation op2 = Operation.builder()
                    .operationId(2L)
                    .operationName("Casting")
                    .operationCode("OP-002")
                    .status(Operation.STATUS_READY)
                    .process(testProcess)
                    .build();

            when(operationRepository.findByStatus(Operation.STATUS_READY))
                    .thenReturn(List.of(testOperation, op2));

            // Act
            List<OperationDTO> result = operationService.getOperationsByStatus(Operation.STATUS_READY);

            // Assert
            assertEquals(2, result.size());
        }
    }

    // ========================================================================
    // 3. BLOCK / UNBLOCK OPERATION
    // ========================================================================

    @Nested
    @DisplayName("3. Block Operation Tests")
    class BlockOperationTests {

        @Test
        @DisplayName("3.1 should_blockOperation_when_statusIsReady")
        void should_blockOperation_when_statusIsReady() {
            // Arrange
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
            when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            OperationDTO.StatusUpdateResponse result = operationService.blockOperation(1L, "Material shortage");

            // Assert
            assertEquals(1L, result.getOperationId());
            assertEquals("READY", result.getPreviousStatus());
            assertEquals("BLOCKED", result.getNewStatus());
            assertEquals("admin@mes.com", result.getUpdatedBy());
            assertTrue(result.getMessage().contains("Material shortage"));

            verify(auditService).logStatusChange("OPERATION", 1L, "READY", "BLOCKED");
        }

        @Test
        @DisplayName("3.2 should_blockOperation_when_statusIsInProgress")
        void should_blockOperation_when_statusIsInProgress() {
            // Arrange
            testOperation.setStatus(Operation.STATUS_IN_PROGRESS);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
            when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            OperationDTO.StatusUpdateResponse result = operationService.blockOperation(1L, "Quality issue");

            // Assert
            assertEquals("IN_PROGRESS", result.getPreviousStatus());
            assertEquals("BLOCKED", result.getNewStatus());
        }

        @Test
        @DisplayName("3.3 should_throwException_when_blockingConfirmedOperation")
        void should_throwException_when_blockingConfirmedOperation() {
            // Arrange
            testOperation.setStatus(Operation.STATUS_CONFIRMED);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> operationService.blockOperation(1L, "Test block"));

            assertTrue(exception.getMessage().contains("confirmed"));
            verify(operationRepository, never()).save(any(Operation.class));
        }

        @Test
        @DisplayName("3.4 should_throwException_when_blockingAlreadyBlockedOperation")
        void should_throwException_when_blockingAlreadyBlockedOperation() {
            // Arrange
            testOperation.setStatus(Operation.STATUS_BLOCKED);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> operationService.blockOperation(1L, "Test block"));

            assertTrue(exception.getMessage().contains("already blocked"));
        }

        @Test
        @DisplayName("3.5 should_throwException_when_operationNotFoundForBlock")
        void should_throwException_when_operationNotFoundForBlock() {
            // Arrange
            when(operationRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThrows(RuntimeException.class,
                    () -> operationService.blockOperation(999L, "Test"));
        }
    }

    @Nested
    @DisplayName("4. Unblock Operation Tests")
    class UnblockOperationTests {

        @Test
        @DisplayName("4.1 should_unblockOperation_when_statusIsBlocked")
        void should_unblockOperation_when_statusIsBlocked() {
            // Arrange
            testOperation.setStatus(Operation.STATUS_BLOCKED);
            testOperation.setBlockReason("Material shortage");
            testOperation.setBlockedBy("admin@mes.com");
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
            when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            OperationDTO.StatusUpdateResponse result = operationService.unblockOperation(1L);

            // Assert
            assertEquals(1L, result.getOperationId());
            assertEquals("BLOCKED", result.getPreviousStatus());
            assertEquals("READY", result.getNewStatus());

            verify(auditService).logStatusChange("OPERATION", 1L, "BLOCKED", "READY");
        }

        @Test
        @DisplayName("4.2 should_throwException_when_unblockingNonBlockedOperation")
        void should_throwException_when_unblockingNonBlockedOperation() {
            // Arrange
            testOperation.setStatus(Operation.STATUS_READY);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> operationService.unblockOperation(1L));

            assertTrue(exception.getMessage().contains("not blocked"));
        }

        @ParameterizedTest
        @ValueSource(strings = {"READY", "IN_PROGRESS", "CONFIRMED", "NOT_STARTED"})
        @DisplayName("4.3 should_throwException_when_unblockingNonBlockedStatuses")
        void should_throwException_when_unblockingNonBlockedStatuses(String status) {
            // Arrange
            testOperation.setStatus(status);
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> operationService.unblockOperation(1L));

            assertTrue(exception.getMessage().contains("not blocked"));
        }

        @Test
        @DisplayName("4.4 should_clearBlockFields_when_unblocking")
        void should_clearBlockFields_when_unblocking() {
            // Arrange
            testOperation.setStatus(Operation.STATUS_BLOCKED);
            testOperation.setBlockReason("Material shortage");
            testOperation.setBlockedBy("admin@mes.com");
            testOperation.setBlockedOn(LocalDateTime.now());
            when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
            when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            operationService.unblockOperation(1L);

            // Assert
            verify(operationRepository).save(argThat(op ->
                    op.getBlockReason() == null &&
                    op.getBlockedBy() == null &&
                    op.getBlockedOn() == null
            ));
        }
    }

    // ========================================================================
    // 5. GET ALL OPERATIONS
    // ========================================================================

    @Nested
    @DisplayName("5. Get All Operations Tests")
    class GetAllOperationsTests {

        @Test
        @DisplayName("5.1 should_returnAllOperations_when_operationsExist")
        void should_returnAllOperations_when_operationsExist() {
            // Arrange
            Operation op2 = Operation.builder()
                    .operationId(2L)
                    .operationName("Casting")
                    .operationCode("OP-002")
                    .status("IN_PROGRESS")
                    .process(testProcess)
                    .build();

            when(operationRepository.findAll()).thenReturn(List.of(testOperation, op2));

            // Act
            List<OperationDTO> result = operationService.getAllOperations();

            // Assert
            assertNotNull(result);
            assertEquals(2, result.size());
        }

        @Test
        @DisplayName("5.2 should_returnEmptyList_when_noOperationsExist")
        void should_returnEmptyList_when_noOperationsExist() {
            // Arrange
            when(operationRepository.findAll()).thenReturn(List.of());

            // Act
            List<OperationDTO> result = operationService.getAllOperations();

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    // ========================================================================
    // 6. PAGINATED OPERATIONS
    // ========================================================================

    @Nested
    @DisplayName("6. Paginated Operations Tests")
    class PaginatedOperationsTests {

        @Test
        @DisplayName("6.1 should_returnPagedOperations_when_noFilters")
        void should_returnPagedOperations_when_noFilters() {
            // Arrange
            PageRequestDTO pageRequest = PageRequestDTO.builder()
                    .page(0)
                    .size(10)
                    .build();

            Page<Operation> operationPage = new PageImpl<>(List.of(testOperation));
            when(operationRepository.findAll(any(Pageable.class))).thenReturn(operationPage);

            // Act
            PagedResponseDTO<OperationDTO> result = operationService.getOperationsPaged(pageRequest);

            // Assert
            assertNotNull(result);
            assertEquals(1, result.getContent().size());
            assertEquals(1, result.getTotalElements());
        }

        @Test
        @DisplayName("6.2 should_filterByStatus_when_statusProvided")
        void should_filterByStatus_when_statusProvided() {
            // Arrange
            PageRequestDTO pageRequest = PageRequestDTO.builder()
                    .page(0)
                    .size(10)
                    .status("READY")
                    .build();

            Page<Operation> operationPage = new PageImpl<>(List.of(testOperation));
            when(operationRepository.findByFilters(eq("READY"), isNull(), isNull(), any(Pageable.class)))
                    .thenReturn(operationPage);

            // Act
            PagedResponseDTO<OperationDTO> result = operationService.getOperationsPaged(pageRequest);

            // Assert
            assertNotNull(result);
            verify(operationRepository).findByFilters(eq("READY"), isNull(), isNull(), any(Pageable.class));
        }

        @Test
        @DisplayName("6.3 should_filterByType_when_typeProvided")
        void should_filterByType_when_typeProvided() {
            // Arrange
            PageRequestDTO pageRequest = PageRequestDTO.builder()
                    .page(0)
                    .size(10)
                    .type("MELTING")
                    .build();

            Page<Operation> operationPage = new PageImpl<>(List.of(testOperation));
            when(operationRepository.findByFilters(isNull(), eq("MELTING"), isNull(), any(Pageable.class)))
                    .thenReturn(operationPage);

            // Act
            PagedResponseDTO<OperationDTO> result = operationService.getOperationsPaged(pageRequest);

            // Assert
            assertNotNull(result);
            verify(operationRepository).findByFilters(isNull(), eq("MELTING"), isNull(), any(Pageable.class));
        }

        @Test
        @DisplayName("6.4 should_searchByPattern_when_searchProvided")
        void should_searchByPattern_when_searchProvided() {
            // Arrange
            PageRequestDTO pageRequest = PageRequestDTO.builder()
                    .page(0)
                    .size(10)
                    .search("Melt")
                    .build();

            Page<Operation> operationPage = new PageImpl<>(List.of(testOperation));
            // Note: getSearchPattern() lowercases the search term
            when(operationRepository.findByFilters(isNull(), isNull(), eq("%melt%"), any(Pageable.class)))
                    .thenReturn(operationPage);

            // Act
            PagedResponseDTO<OperationDTO> result = operationService.getOperationsPaged(pageRequest);

            // Assert
            assertNotNull(result);
            verify(operationRepository).findByFilters(isNull(), isNull(), eq("%melt%"), any(Pageable.class));
        }

        @Test
        @DisplayName("6.5 should_returnEmptyPage_when_noMatchingOperations")
        void should_returnEmptyPage_when_noMatchingOperations() {
            // Arrange
            PageRequestDTO pageRequest = PageRequestDTO.builder()
                    .page(0)
                    .size(10)
                    .status("NONEXISTENT")
                    .build();

            Page<Operation> emptyPage = new PageImpl<>(List.of());
            when(operationRepository.findByFilters(eq("NONEXISTENT"), isNull(), isNull(), any(Pageable.class)))
                    .thenReturn(emptyPage);

            // Act
            PagedResponseDTO<OperationDTO> result = operationService.getOperationsPaged(pageRequest);

            // Assert
            assertNotNull(result);
            assertTrue(result.getContent().isEmpty());
            assertEquals(0, result.getTotalElements());
        }

        @Test
        @DisplayName("6.6 should_combineFilters_when_multipleFiltersProvided")
        void should_combineFilters_when_multipleFiltersProvided() {
            // Arrange
            PageRequestDTO pageRequest = PageRequestDTO.builder()
                    .page(0)
                    .size(10)
                    .status("READY")
                    .type("MELTING")
                    .search("Steel")
                    .build();

            Page<Operation> operationPage = new PageImpl<>(List.of(testOperation));
            // Note: getSearchPattern() lowercases the search term
            when(operationRepository.findByFilters(eq("READY"), eq("MELTING"), eq("%steel%"), any(Pageable.class)))
                    .thenReturn(operationPage);

            // Act
            PagedResponseDTO<OperationDTO> result = operationService.getOperationsPaged(pageRequest);

            // Assert
            assertNotNull(result);
            verify(operationRepository).findByFilters(eq("READY"), eq("MELTING"), eq("%steel%"), any(Pageable.class));
        }
    }

    // ========================================================================
    // 7. EDGE CASES
    // ========================================================================

    @Nested
    @DisplayName("7. Edge Cases")
    class EdgeCaseTests {

        @Test
        @DisplayName("7.1 should_handleNullProcess_when_mappingToDTO")
        void should_handleNullProcess_when_mappingToDTO() {
            // Arrange
            testOperation.setProcess(null);
            when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));

            // Act
            OperationDTO result = operationService.getOperationById(1L);

            // Assert
            assertNotNull(result);
            assertNull(result.getProcessId());
            assertNull(result.getProcessName());
        }

        @Test
        @DisplayName("7.2 should_handleNullOrderLine_when_mappingToDTO")
        void should_handleNullOrderLine_when_mappingToDTO() {
            // Arrange
            testOperation.setOrderLineItem(null);
            when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));

            // Act
            OperationDTO result = operationService.getOperationById(1L);

            // Assert
            assertNotNull(result);
            assertNull(result.getProductSku());
        }

        @Test
        @DisplayName("7.3 should_includeBlockInfo_when_operationIsBlocked")
        void should_includeBlockInfo_when_operationIsBlocked() {
            // Arrange
            LocalDateTime blockedTime = LocalDateTime.now();
            testOperation.setStatus(Operation.STATUS_BLOCKED);
            testOperation.setBlockReason("Material shortage");
            testOperation.setBlockedBy("supervisor");
            testOperation.setBlockedOn(blockedTime);
            when(operationRepository.findByStatus(Operation.STATUS_BLOCKED))
                    .thenReturn(List.of(testOperation));

            // Act
            List<OperationDTO> result = operationService.getBlockedOperations();

            // Assert
            assertFalse(result.isEmpty());
            OperationDTO dto = result.get(0);
            assertEquals("Material shortage", dto.getBlockReason());
            assertEquals("supervisor", dto.getBlockedBy());
            assertEquals(blockedTime, dto.getBlockedOn());
        }

        @Test
        @DisplayName("7.4 should_includeQuantityInfo_when_operationHasQuantities")
        void should_includeQuantityInfo_when_operationHasQuantities() {
            // Arrange
            testOperation.setTargetQty(new BigDecimal("100.00"));
            testOperation.setConfirmedQty(new BigDecimal("50.00"));
            when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testOperation));

            // Act
            OperationDTO result = operationService.getOperationById(1L);

            // Assert
            assertEquals(new BigDecimal("100.00"), result.getTargetQty());
            assertEquals(new BigDecimal("50.00"), result.getConfirmedQty());
        }
    }
}
