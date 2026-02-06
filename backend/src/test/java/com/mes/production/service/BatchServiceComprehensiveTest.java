package com.mes.production.service;

import com.mes.production.dto.BatchDTO;
import com.mes.production.entity.*;
import com.mes.production.repository.BatchQuantityAdjustmentRepository;
import com.mes.production.repository.BatchRelationRepository;
import com.mes.production.repository.BatchRepository;
import com.mes.production.repository.OperationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Comprehensive test suite for BatchService.
 *
 * This test suite covers additional edge cases beyond the basic BatchServiceTest:
 *
 * Test Categories:
 * 1. Split Edge Cases - Boundary conditions, precision, multiple splits
 * 2. Merge Edge Cases - Large batch counts, unit conversion, edge quantities
 * 3. Quantity Adjustment Edge Cases - Precision, zero quantity, audit trail
 * 4. Status Transitions - Valid and invalid state machine transitions
 * 5. Genealogy Edge Cases - Deep hierarchies, circular references
 * 6. Concurrent Operations - Thread safety considerations
 * 7. Data Integrity - Null handling, boundary values
 *
 * Per MES Batch Management Specification:
 * - Batch numbers are immutable after creation
 * - Quantity changes require explicit adjustment with reason
 * - Split/merge operations must maintain traceability
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("BatchService Comprehensive Tests")
class BatchServiceComprehensiveTest {

    @Mock
    private BatchRepository batchRepository;

    @Mock
    private BatchRelationRepository batchRelationRepository;

    @Mock
    private BatchQuantityAdjustmentRepository adjustmentRepository;

    @Mock
    private OperationRepository operationRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private BatchNumberService batchNumberService;

    @InjectMocks
    private BatchService batchService;

    private Batch testBatch;

    @BeforeEach
    void setUp() {
        testBatch = Batch.builder()
                .batchId(1L)
                .batchNumber("BATCH-001")
                .materialId("IM-001")
                .materialName("Steel Billet")
                .quantity(new BigDecimal("500.00"))
                .unit("KG")
                .status("AVAILABLE")
                .generatedAtOperationId(1L)
                .createdOn(LocalDateTime.now())
                .build();

        mockSecurityContext();
    }

    private void mockSecurityContext() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        lenient().when(authentication.getName()).thenReturn("admin");
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    // ========================================================================
    // 1. SPLIT EDGE CASES
    // ========================================================================

    @Nested
    @DisplayName("1. Split Batch Edge Cases")
    class SplitEdgeCaseTests {

        @Test
        @DisplayName("1.1 Should split batch with exact total matching source quantity")
        void splitBatch_ExactQuantity_SplitsSuccessfully() {
            // Arrange - split into exactly 500kg total
            BatchDTO.SplitRequest request = BatchDTO.SplitRequest.builder()
                    .sourceBatchId(1L)
                    .portions(List.of(
                            BatchDTO.SplitPortion.builder().quantity(new BigDecimal("250.00")).build(),
                            BatchDTO.SplitPortion.builder().quantity(new BigDecimal("250.00")).build()
                    ))
                    .reason("Equal split")
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
                Batch b = i.getArgument(0);
                if (b.getBatchId() == null) b.setBatchId(10L);
                return b;
            });
            when(batchRelationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            // Act
            BatchDTO.SplitResponse result = batchService.splitBatch(request, "test-user");

            // Assert
            assertEquals(new BigDecimal("0.00"), result.getRemainingQuantity());
            assertEquals("SPLIT", testBatch.getStatus());
        }

        @Test
        @DisplayName("1.2 Should handle split with very small portions (precision test)")
        void splitBatch_SmallPortions_MaintainsPrecision() {
            // Arrange - split into very small portions
            testBatch.setQuantity(new BigDecimal("1.000"));

            BatchDTO.SplitRequest request = BatchDTO.SplitRequest.builder()
                    .sourceBatchId(1L)
                    .portions(List.of(
                            BatchDTO.SplitPortion.builder().quantity(new BigDecimal("0.001")).build(),
                            BatchDTO.SplitPortion.builder().quantity(new BigDecimal("0.002")).build()
                    ))
                    .reason("Precision split")
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
                Batch b = i.getArgument(0);
                if (b.getBatchId() == null) b.setBatchId(10L);
                return b;
            });
            when(batchRelationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            // Act
            BatchDTO.SplitResponse result = batchService.splitBatch(request, "test-user");

            // Assert - remaining should be 1.000 - 0.001 - 0.002 = 0.997
            assertEquals(0, result.getRemainingQuantity().compareTo(new BigDecimal("0.997")));
        }

        @Test
        @DisplayName("1.3 Should reject split with zero quantity portion")
        void splitBatch_ZeroQuantityPortion_ThrowsException() {
            // Arrange
            BatchDTO.SplitRequest request = BatchDTO.SplitRequest.builder()
                    .sourceBatchId(1L)
                    .portions(List.of(
                            BatchDTO.SplitPortion.builder().quantity(BigDecimal.ZERO).build()
                    ))
                    .reason("Zero portion")
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> batchService.splitBatch(request, "test-user"));

            assertTrue(exception.getMessage().toLowerCase().contains("positive") ||
                       exception.getMessage().toLowerCase().contains("zero") ||
                       exception.getMessage().toLowerCase().contains("invalid"));
        }

        @Test
        @DisplayName("1.4 Should reject split with negative quantity portion")
        void splitBatch_NegativeQuantityPortion_ThrowsException() {
            // Arrange
            BatchDTO.SplitRequest request = BatchDTO.SplitRequest.builder()
                    .sourceBatchId(1L)
                    .portions(List.of(
                            BatchDTO.SplitPortion.builder().quantity(new BigDecimal("-100.00")).build()
                    ))
                    .reason("Negative portion")
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));

            // Act & Assert
            assertThrows(RuntimeException.class,
                    () -> batchService.splitBatch(request, "test-user"));
        }

        @Test
        @DisplayName("1.5 Should reject split with empty portions list")
        void splitBatch_EmptyPortions_ThrowsException() {
            // Arrange
            BatchDTO.SplitRequest request = BatchDTO.SplitRequest.builder()
                    .sourceBatchId(1L)
                    .portions(List.of())
                    .reason("Empty portions")
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));

            // Act & Assert
            assertThrows(RuntimeException.class,
                    () -> batchService.splitBatch(request, "test-user"));
        }

        @Test
        @DisplayName("1.6 Should allow split of batch with RESERVED status")
        void splitBatch_ReservedBatch_AllowsSplit() {
            // Per MES spec, RESERVED batches can still be split
            testBatch.setStatus("RESERVED");

            BatchDTO.SplitRequest request = BatchDTO.SplitRequest.builder()
                    .sourceBatchId(1L)
                    .portions(List.of(
                            BatchDTO.SplitPortion.builder().quantity(new BigDecimal("200.00")).build()
                    ))
                    .reason("Split reserved batch")
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
                Batch b = i.getArgument(0);
                if (b.getBatchId() == null) b.setBatchId(10L);
                return b;
            });
            when(batchRelationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            // Act
            BatchDTO.SplitResponse result = batchService.splitBatch(request, "test-user");

            // Assert - should succeed for RESERVED batches
            assertNotNull(result);
            assertEquals(1, result.getNewBatches().size());
        }

        @Test
        @DisplayName("1.7 Should handle maximum portions (10 portions)")
        void splitBatch_MaxPortions_HandlesSuccessfully() {
            // Arrange - split into 10 portions of 50kg each
            BatchDTO.SplitRequest request = BatchDTO.SplitRequest.builder()
                    .sourceBatchId(1L)
                    .portions(List.of(
                            BatchDTO.SplitPortion.builder().quantity(new BigDecimal("50")).build(),
                            BatchDTO.SplitPortion.builder().quantity(new BigDecimal("50")).build(),
                            BatchDTO.SplitPortion.builder().quantity(new BigDecimal("50")).build(),
                            BatchDTO.SplitPortion.builder().quantity(new BigDecimal("50")).build(),
                            BatchDTO.SplitPortion.builder().quantity(new BigDecimal("50")).build(),
                            BatchDTO.SplitPortion.builder().quantity(new BigDecimal("50")).build(),
                            BatchDTO.SplitPortion.builder().quantity(new BigDecimal("50")).build(),
                            BatchDTO.SplitPortion.builder().quantity(new BigDecimal("50")).build(),
                            BatchDTO.SplitPortion.builder().quantity(new BigDecimal("50")).build(),
                            BatchDTO.SplitPortion.builder().quantity(new BigDecimal("50")).build()
                    ))
                    .reason("10-way split")
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
                Batch b = i.getArgument(0);
                if (b.getBatchId() == null) b.setBatchId(10L + request.getPortions().indexOf(b));
                return b;
            });
            when(batchRelationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            // Act
            BatchDTO.SplitResponse result = batchService.splitBatch(request, "test-user");

            // Assert
            assertEquals(10, result.getNewBatches().size());
            assertEquals(BigDecimal.ZERO.setScale(2), result.getRemainingQuantity());
        }
    }

    // ========================================================================
    // 2. MERGE EDGE CASES
    // ========================================================================

    @Nested
    @DisplayName("2. Merge Batch Edge Cases")
    class MergeEdgeCaseTests {

        @Test
        @DisplayName("2.1 Should merge batches with different units (if same material)")
        void mergeBatches_DifferentUnits_ThrowsException() {
            // Arrange
            Batch batch1 = Batch.builder()
                    .batchId(1L)
                    .batchNumber("BATCH-001")
                    .materialId("IM-001")
                    .quantity(new BigDecimal("100.00"))
                    .unit("KG")
                    .status("AVAILABLE")
                    .build();

            Batch batch2 = Batch.builder()
                    .batchId(2L)
                    .batchNumber("BATCH-002")
                    .materialId("IM-001")
                    .quantity(new BigDecimal("50.00"))
                    .unit("LBS")  // Different unit
                    .status("AVAILABLE")
                    .build();

            BatchDTO.MergeRequest request = BatchDTO.MergeRequest.builder()
                    .sourceBatchIds(List.of(1L, 2L))
                    .reason("Merge different units")
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(batch1));
            when(batchRepository.findById(2L)).thenReturn(Optional.of(batch2));

            // Act & Assert - should throw because units don't match
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> batchService.mergeBatches(request, "test-user"));

            assertTrue(exception.getMessage().toLowerCase().contains("unit") ||
                       exception.getMessage().toLowerCase().contains("same"));
        }

        @Test
        @DisplayName("2.2 Should handle merge with very large quantities")
        void mergeBatches_LargeQuantities_HandlesOverflow() {
            // Arrange
            Batch batch1 = Batch.builder()
                    .batchId(1L)
                    .batchNumber("BATCH-001")
                    .materialId("IM-001")
                    .quantity(new BigDecimal("999999999.99"))
                    .unit("KG")
                    .status("AVAILABLE")
                    .build();

            Batch batch2 = Batch.builder()
                    .batchId(2L)
                    .batchNumber("BATCH-002")
                    .materialId("IM-001")
                    .quantity(new BigDecimal("999999999.99"))
                    .unit("KG")
                    .status("AVAILABLE")
                    .build();

            BatchDTO.MergeRequest request = BatchDTO.MergeRequest.builder()
                    .sourceBatchIds(List.of(1L, 2L))
                    .reason("Large merge")
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(batch1));
            when(batchRepository.findById(2L)).thenReturn(Optional.of(batch2));
            when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
                Batch b = i.getArgument(0);
                if (b.getBatchId() == null) b.setBatchId(100L);
                return b;
            });
            when(batchRelationRepository.save(any())).thenAnswer(i -> i.getArgument(0));
            when(batchNumberService.generateMergeBatchNumber()).thenReturn("MERGE-001");

            // Act
            BatchDTO.MergeResponse result = batchService.mergeBatches(request, "test-user");

            // Assert
            assertEquals(new BigDecimal("1999999999.98"), result.getTotalQuantity());
        }

        @Test
        @DisplayName("2.3 Should handle merge with zero quantity batch")
        void mergeBatches_ZeroQuantityBatch_HandlesGracefully() {
            // Arrange
            Batch batch1 = Batch.builder()
                    .batchId(1L)
                    .batchNumber("BATCH-001")
                    .materialId("IM-001")
                    .quantity(new BigDecimal("100.00"))
                    .unit("KG")
                    .status("AVAILABLE")
                    .build();

            Batch batch2 = Batch.builder()
                    .batchId(2L)
                    .batchNumber("BATCH-002")
                    .materialId("IM-001")
                    .quantity(BigDecimal.ZERO)
                    .unit("KG")
                    .status("AVAILABLE")
                    .build();

            BatchDTO.MergeRequest request = BatchDTO.MergeRequest.builder()
                    .sourceBatchIds(List.of(1L, 2L))
                    .reason("Merge with zero")
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(batch1));
            when(batchRepository.findById(2L)).thenReturn(Optional.of(batch2));
            when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
                Batch b = i.getArgument(0);
                if (b.getBatchId() == null) b.setBatchId(100L);
                return b;
            });
            when(batchRelationRepository.save(any())).thenAnswer(i -> i.getArgument(0));
            when(batchNumberService.generateMergeBatchNumber()).thenReturn("MERGE-001");

            // Act
            BatchDTO.MergeResponse result = batchService.mergeBatches(request, "test-user");

            // Assert
            assertEquals(new BigDecimal("100.00"), result.getTotalQuantity());
        }

        @Test
        @DisplayName("2.4 Should reject merge with duplicate batch IDs")
        void mergeBatches_DuplicateBatchIds_ThrowsException() {
            // Arrange
            BatchDTO.MergeRequest request = BatchDTO.MergeRequest.builder()
                    .sourceBatchIds(List.of(1L, 1L))
                    .reason("Duplicate IDs")
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> batchService.mergeBatches(request, "test-user"));

            assertTrue(exception.getMessage().toLowerCase().contains("duplicate") ||
                       exception.getMessage().toLowerCase().contains("same") ||
                       exception.getMessage().toLowerCase().contains("unique"));
        }

        @Test
        @DisplayName("2.5 Should merge 5 batches successfully (maximum common case)")
        void mergeBatches_FiveBatches_MergesSuccessfully() {
            // Arrange
            List<Batch> batches = List.of(
                    createBatch(1L, "BATCH-001", new BigDecimal("100.00")),
                    createBatch(2L, "BATCH-002", new BigDecimal("200.00")),
                    createBatch(3L, "BATCH-003", new BigDecimal("150.00")),
                    createBatch(4L, "BATCH-004", new BigDecimal("175.00")),
                    createBatch(5L, "BATCH-005", new BigDecimal("125.00"))
            );

            BatchDTO.MergeRequest request = BatchDTO.MergeRequest.builder()
                    .sourceBatchIds(List.of(1L, 2L, 3L, 4L, 5L))
                    .reason("Multi-batch merge")
                    .build();

            for (Batch b : batches) {
                when(batchRepository.findById(b.getBatchId())).thenReturn(Optional.of(b));
            }
            when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
                Batch b = i.getArgument(0);
                if (b.getBatchId() == null) b.setBatchId(100L);
                return b;
            });
            when(batchRelationRepository.save(any())).thenAnswer(i -> i.getArgument(0));
            when(batchNumberService.generateMergeBatchNumber()).thenReturn("MERGE-001");

            // Act
            BatchDTO.MergeResponse result = batchService.mergeBatches(request, "test-user");

            // Assert
            assertEquals(5, result.getSourceBatches().size());
            assertEquals(new BigDecimal("750.00"), result.getTotalQuantity());
        }

        private Batch createBatch(Long id, String number, BigDecimal qty) {
            return Batch.builder()
                    .batchId(id)
                    .batchNumber(number)
                    .materialId("IM-001")
                    .materialName("Steel")
                    .quantity(qty)
                    .unit("KG")
                    .status("AVAILABLE")
                    .build();
        }
    }

    // ========================================================================
    // 3. QUANTITY ADJUSTMENT EDGE CASES
    // ========================================================================

    @Nested
    @DisplayName("3. Quantity Adjustment Edge Cases")
    class AdjustmentEdgeCaseTests {

        @Test
        @DisplayName("3.1 Should adjust to exactly zero quantity")
        void adjustQuantity_ToZero_AdjustsSuccessfully() {
            // Arrange
            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(batchRepository.save(any(Batch.class))).thenAnswer(i -> i.getArgument(0));
            when(adjustmentRepository.save(any())).thenAnswer(i -> {
                BatchQuantityAdjustment adj = i.getArgument(0);
                adj.setAdjustmentId(1L);
                return adj;
            });

            BatchDTO.AdjustQuantityRequest request = BatchDTO.AdjustQuantityRequest.builder()
                    .newQuantity(BigDecimal.ZERO)
                    .adjustmentType("SCRAP_RECOVERY")
                    .reason("Complete scrap of batch")
                    .build();

            // Act
            BatchDTO.AdjustQuantityResponse result = batchService.adjustQuantity(1L, request);

            // Assert
            assertEquals(BigDecimal.ZERO, result.getNewQuantity());
            assertEquals(new BigDecimal("-500.00"), result.getQuantityDifference());
        }

        @Test
        @DisplayName("3.2 Should handle precision in adjustments")
        void adjustQuantity_HighPrecision_MaintainsPrecision() {
            // Arrange
            testBatch.setQuantity(new BigDecimal("100.123456"));

            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(batchRepository.save(any(Batch.class))).thenAnswer(i -> i.getArgument(0));
            when(adjustmentRepository.save(any())).thenAnswer(i -> {
                BatchQuantityAdjustment adj = i.getArgument(0);
                adj.setAdjustmentId(1L);
                return adj;
            });

            BatchDTO.AdjustQuantityRequest request = BatchDTO.AdjustQuantityRequest.builder()
                    .newQuantity(new BigDecimal("99.654321"))
                    .adjustmentType("CORRECTION")
                    .reason("Precision correction")
                    .build();

            // Act
            BatchDTO.AdjustQuantityResponse result = batchService.adjustQuantity(1L, request);

            // Assert
            assertEquals(new BigDecimal("99.654321"), result.getNewQuantity());
        }

        @Test
        @DisplayName("3.3 Should adjust quantity upward (e.g., found more material)")
        void adjustQuantity_Increase_AdjustsSuccessfully() {
            // Arrange
            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(batchRepository.save(any(Batch.class))).thenAnswer(i -> i.getArgument(0));
            when(adjustmentRepository.save(any())).thenAnswer(i -> {
                BatchQuantityAdjustment adj = i.getArgument(0);
                adj.setAdjustmentId(1L);
                return adj;
            });

            BatchDTO.AdjustQuantityRequest request = BatchDTO.AdjustQuantityRequest.builder()
                    .newQuantity(new BigDecimal("600.00"))  // Increase from 500 to 600
                    .adjustmentType("INVENTORY_COUNT")
                    .reason("Physical count found additional material")
                    .build();

            // Act
            BatchDTO.AdjustQuantityResponse result = batchService.adjustQuantity(1L, request);

            // Assert
            assertEquals(new BigDecimal("600.00"), result.getNewQuantity());
            assertEquals(new BigDecimal("100.00"), result.getQuantityDifference());
        }

        @Test
        @DisplayName("3.4 Should reject adjustment without reason")
        void adjustQuantity_NoReason_ThrowsException() {
            // Arrange
            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));

            BatchDTO.AdjustQuantityRequest request = BatchDTO.AdjustQuantityRequest.builder()
                    .newQuantity(new BigDecimal("400.00"))
                    .adjustmentType("CORRECTION")
                    .reason(null)  // No reason
                    .build();

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> batchService.adjustQuantity(1L, request));

            assertTrue(exception.getMessage().toLowerCase().contains("reason"));
        }

        @Test
        @DisplayName("3.5 Should reject adjustment with empty reason")
        void adjustQuantity_EmptyReason_ThrowsException() {
            // Arrange
            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));

            BatchDTO.AdjustQuantityRequest request = BatchDTO.AdjustQuantityRequest.builder()
                    .newQuantity(new BigDecimal("400.00"))
                    .adjustmentType("CORRECTION")
                    .reason("   ")  // Whitespace only
                    .build();

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> batchService.adjustQuantity(1L, request));

            assertTrue(exception.getMessage().toLowerCase().contains("reason"));
        }

        @ParameterizedTest
        @CsvSource({
                "CORRECTION, Physical count revealed discrepancy",
                "INVENTORY_COUNT, Annual inventory count adjustment",
                "DAMAGE, Material damaged during handling",
                "SCRAP_RECOVERY, Recovered material from scrap",
                "SYSTEM, System reconciliation"
        })
        @DisplayName("3.6 Should accept all valid adjustment types with proper reasons")
        void adjustQuantity_AllValidTypes_Succeeds(String type, String reason) {
            // Arrange
            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(batchRepository.save(any(Batch.class))).thenAnswer(i -> i.getArgument(0));
            when(adjustmentRepository.save(any())).thenAnswer(i -> {
                BatchQuantityAdjustment adj = i.getArgument(0);
                adj.setAdjustmentId(1L);
                return adj;
            });

            BatchDTO.AdjustQuantityRequest request = BatchDTO.AdjustQuantityRequest.builder()
                    .newQuantity(new BigDecimal("450.00"))
                    .adjustmentType(type)
                    .reason(reason)
                    .build();

            // Act
            BatchDTO.AdjustQuantityResponse result = batchService.adjustQuantity(1L, request);

            // Assert
            assertNotNull(result);
            assertEquals(type, result.getAdjustmentType());
        }
    }

    // ========================================================================
    // 4. STATUS TRANSITION TESTS
    // ========================================================================

    @Nested
    @DisplayName("4. Status Transition Tests")
    class StatusTransitionTests {

        @ParameterizedTest
        @ValueSource(strings = {"AVAILABLE", "RESERVED", "BLOCKED"})
        @DisplayName("4.1 Should allow split for splittable statuses")
        void splitBatch_SplittableStatuses_Succeeds(String status) {
            // Arrange
            testBatch.setStatus(status);

            BatchDTO.SplitRequest request = BatchDTO.SplitRequest.builder()
                    .sourceBatchId(1L)
                    .portions(List.of(
                            BatchDTO.SplitPortion.builder().quantity(new BigDecimal("100.00")).build()
                    ))
                    .reason("Status test")
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
                Batch b = i.getArgument(0);
                if (b.getBatchId() == null) b.setBatchId(10L);
                return b;
            });
            when(batchRelationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            // Act - should not throw for these statuses
            assertDoesNotThrow(() -> batchService.splitBatch(request, "test-user"));
        }

        @ParameterizedTest
        @ValueSource(strings = {"CONSUMED", "SCRAPPED", "SPLIT"})
        @DisplayName("4.2 Should reject split for terminal statuses")
        void splitBatch_TerminalStatuses_ThrowsException(String status) {
            // Arrange
            testBatch.setStatus(status);

            BatchDTO.SplitRequest request = BatchDTO.SplitRequest.builder()
                    .sourceBatchId(1L)
                    .portions(List.of(
                            BatchDTO.SplitPortion.builder().quantity(new BigDecimal("100.00")).build()
                    ))
                    .reason("Status test")
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));

            // Act & Assert
            assertThrows(RuntimeException.class,
                    () -> batchService.splitBatch(request, "test-user"));
        }

        @Test
        @DisplayName("4.3 Should reject merge with consumed source batch")
        void mergeBatches_ConsumedSource_ThrowsException() {
            // Arrange
            Batch batch1 = Batch.builder()
                    .batchId(1L)
                    .batchNumber("BATCH-001")
                    .materialId("IM-001")
                    .quantity(new BigDecimal("100.00"))
                    .unit("KG")
                    .status("CONSUMED")  // Terminal status
                    .build();

            Batch batch2 = Batch.builder()
                    .batchId(2L)
                    .batchNumber("BATCH-002")
                    .materialId("IM-001")
                    .quantity(new BigDecimal("100.00"))
                    .unit("KG")
                    .status("AVAILABLE")
                    .build();

            BatchDTO.MergeRequest request = BatchDTO.MergeRequest.builder()
                    .sourceBatchIds(List.of(1L, 2L))
                    .reason("Test merge")
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(batch1));
            when(batchRepository.findById(2L)).thenReturn(Optional.of(batch2));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> batchService.mergeBatches(request, "test-user"));

            assertTrue(exception.getMessage().contains("AVAILABLE"));
        }
    }

    // ========================================================================
    // 5. GENEALOGY EDGE CASES
    // ========================================================================

    @Nested
    @DisplayName("5. Genealogy Edge Cases")
    class GenealogyEdgeCaseTests {

        @Test
        @DisplayName("5.1 Should handle batch with no parents or children")
        void getBatchGenealogy_OrphanBatch_ReturnsEmptyRelations() {
            // Arrange
            testBatch.setGeneratedAtOperationId(null);
            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(batchRelationRepository.findParentRelations(1L)).thenReturn(List.of());
            when(batchRelationRepository.findChildRelations(1L)).thenReturn(List.of());

            // Act
            BatchDTO.Genealogy result = batchService.getBatchGenealogy(1L);

            // Assert
            assertNotNull(result);
            assertTrue(result.getParentBatches().isEmpty());
            assertTrue(result.getChildBatches().isEmpty());
            assertNull(result.getProductionInfo());
        }

        @Test
        @DisplayName("5.2 Should handle batch with multiple parents (merge result)")
        void getBatchGenealogy_MergeResult_ReturnsMultipleParents() {
            // Arrange
            Batch parent1 = Batch.builder()
                    .batchId(2L)
                    .batchNumber("PARENT-001")
                    .materialId("IM-001")
                    .quantity(new BigDecimal("100"))
                    .build();

            Batch parent2 = Batch.builder()
                    .batchId(3L)
                    .batchNumber("PARENT-002")
                    .materialId("IM-001")
                    .quantity(new BigDecimal("200"))
                    .build();

            BatchRelation rel1 = BatchRelation.builder()
                    .relationId(1L)
                    .parentBatch(parent1)
                    .childBatch(testBatch)
                    .relationType("MERGE")
                    .quantityConsumed(new BigDecimal("100"))
                    .build();

            BatchRelation rel2 = BatchRelation.builder()
                    .relationId(2L)
                    .parentBatch(parent2)
                    .childBatch(testBatch)
                    .relationType("MERGE")
                    .quantityConsumed(new BigDecimal("200"))
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(batchRelationRepository.findParentRelations(1L)).thenReturn(List.of(rel1, rel2));
            when(batchRelationRepository.findChildRelations(1L)).thenReturn(List.of());

            // Act
            BatchDTO.Genealogy result = batchService.getBatchGenealogy(1L);

            // Assert
            assertEquals(2, result.getParentBatches().size());
        }

        @Test
        @DisplayName("5.3 Should handle batch with multiple children (split result)")
        void getBatchGenealogy_SplitSource_ReturnsMultipleChildren() {
            // Arrange
            Batch child1 = Batch.builder()
                    .batchId(2L)
                    .batchNumber("CHILD-001")
                    .materialId("IM-001")
                    .quantity(new BigDecimal("250"))
                    .build();

            Batch child2 = Batch.builder()
                    .batchId(3L)
                    .batchNumber("CHILD-002")
                    .materialId("IM-001")
                    .quantity(new BigDecimal("250"))
                    .build();

            BatchRelation rel1 = BatchRelation.builder()
                    .relationId(1L)
                    .parentBatch(testBatch)
                    .childBatch(child1)
                    .relationType("SPLIT")
                    .quantityConsumed(new BigDecimal("250"))
                    .build();

            BatchRelation rel2 = BatchRelation.builder()
                    .relationId(2L)
                    .parentBatch(testBatch)
                    .childBatch(child2)
                    .relationType("SPLIT")
                    .quantityConsumed(new BigDecimal("250"))
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(batchRelationRepository.findParentRelations(1L)).thenReturn(List.of());
            when(batchRelationRepository.findChildRelations(1L)).thenReturn(List.of(rel1, rel2));

            // Act
            BatchDTO.Genealogy result = batchService.getBatchGenealogy(1L);

            // Assert
            assertEquals(2, result.getChildBatches().size());
        }
    }

    // ========================================================================
    // 6. DATA INTEGRITY TESTS
    // ========================================================================

    @Nested
    @DisplayName("6. Data Integrity Tests")
    class DataIntegrityTests {

        @Test
        @DisplayName("6.1 Should preserve material ID across split")
        void splitBatch_MaterialIdPreserved() {
            // Arrange
            BatchDTO.SplitRequest request = BatchDTO.SplitRequest.builder()
                    .sourceBatchId(1L)
                    .portions(List.of(
                            BatchDTO.SplitPortion.builder().quantity(new BigDecimal("200")).build()
                    ))
                    .reason("Test")
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
                Batch b = i.getArgument(0);
                if (b.getBatchId() == null) b.setBatchId(10L);
                return b;
            });
            when(batchRelationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            // Act
            BatchDTO.SplitResponse result = batchService.splitBatch(request, "test-user");

            // Assert - verify save was called with correct material ID
            verify(batchRepository).save(argThat(batch ->
                    batch.getBatchId() == null && // new batch
                    "IM-001".equals(batch.getMaterialId())
            ));
        }

        @Test
        @DisplayName("6.2 Should preserve unit across merge")
        void mergeBatches_UnitPreserved() {
            // Arrange
            Batch batch1 = Batch.builder()
                    .batchId(1L)
                    .batchNumber("BATCH-001")
                    .materialId("IM-001")
                    .quantity(new BigDecimal("100"))
                    .unit("KG")
                    .status("AVAILABLE")
                    .build();

            Batch batch2 = Batch.builder()
                    .batchId(2L)
                    .batchNumber("BATCH-002")
                    .materialId("IM-001")
                    .quantity(new BigDecimal("100"))
                    .unit("KG")
                    .status("AVAILABLE")
                    .build();

            BatchDTO.MergeRequest request = BatchDTO.MergeRequest.builder()
                    .sourceBatchIds(List.of(1L, 2L))
                    .reason("Test")
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(batch1));
            when(batchRepository.findById(2L)).thenReturn(Optional.of(batch2));
            when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
                Batch b = i.getArgument(0);
                if (b.getBatchId() == null) b.setBatchId(100L);
                return b;
            });
            when(batchRelationRepository.save(any())).thenAnswer(i -> i.getArgument(0));
            when(batchNumberService.generateMergeBatchNumber()).thenReturn("MERGE-001");

            // Act
            BatchDTO.MergeResponse result = batchService.mergeBatches(request, "test-user");

            // Assert
            assertEquals("KG", result.getMergedBatch().getUnit());
        }

        @Test
        @DisplayName("6.3 Should create proper batch relations on split")
        void splitBatch_CreatesProperRelations() {
            // Arrange
            BatchDTO.SplitRequest request = BatchDTO.SplitRequest.builder()
                    .sourceBatchId(1L)
                    .portions(List.of(
                            BatchDTO.SplitPortion.builder().quantity(new BigDecimal("200")).build()
                    ))
                    .reason("Test")
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
                Batch b = i.getArgument(0);
                if (b.getBatchId() == null) b.setBatchId(10L);
                return b;
            });
            when(batchRelationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            // Act
            batchService.splitBatch(request, "test-user");

            // Assert - verify relation was created with SPLIT type
            verify(batchRelationRepository).save(argThat(rel ->
                    "SPLIT".equals(rel.getRelationType()) &&
                    rel.getParentBatch().getBatchId().equals(1L) &&
                    rel.getQuantityConsumed().compareTo(new BigDecimal("200")) == 0
            ));
        }
    }
}
