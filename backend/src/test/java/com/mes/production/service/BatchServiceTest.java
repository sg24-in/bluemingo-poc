package com.mes.production.service;

import com.mes.production.dto.BatchDTO;
import com.mes.production.entity.*;
import com.mes.production.repository.BatchRelationRepository;
import com.mes.production.repository.BatchRepository;
import com.mes.production.repository.OperationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BatchServiceTest {

    @Mock
    private BatchRepository batchRepository;

    @Mock
    private BatchRelationRepository batchRelationRepository;

    @Mock
    private OperationRepository operationRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private BatchNumberService batchNumberService;

    @InjectMocks
    private BatchService batchService;

    private Batch testBatch;
    private Batch parentBatch;
    private Batch childBatch;
    private BatchRelation parentRelation;
    private BatchRelation childRelation;

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

        parentBatch = Batch.builder()
                .batchId(2L)
                .batchNumber("BATCH-002")
                .materialId("RM-001")
                .materialName("Iron Ore")
                .quantity(new BigDecimal("100.00"))
                .unit("KG")
                .status("CONSUMED")
                .createdOn(LocalDateTime.now().minusDays(1))
                .build();

        childBatch = Batch.builder()
                .batchId(3L)
                .batchNumber("BATCH-003")
                .materialId("FG-001")
                .materialName("Steel Rod")
                .quantity(new BigDecimal("450.00"))
                .unit("KG")
                .status("AVAILABLE")
                .createdOn(LocalDateTime.now().plusDays(1))
                .build();

        parentRelation = BatchRelation.builder()
                .relationId(1L)
                .parentBatch(parentBatch)
                .childBatch(testBatch)
                .relationType("TRANSFORM")
                .quantityConsumed(new BigDecimal("100.00"))
                .build();

        childRelation = BatchRelation.builder()
                .relationId(2L)
                .parentBatch(testBatch)
                .childBatch(childBatch)
                .relationType("TRANSFORM")
                .quantityConsumed(new BigDecimal("500.00"))
                .build();
    }

    @Test
    @DisplayName("Should get all batches")
    void getAllBatches_ReturnsBatches() {
        // Arrange
        when(batchRepository.findAll()).thenReturn(List.of(testBatch, parentBatch, childBatch));

        // Act
        List<BatchDTO> result = batchService.getAllBatches();

        // Assert
        assertNotNull(result);
        assertEquals(3, result.size());

        verify(batchRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should get batch by ID")
    void getBatchById_ValidId_ReturnsBatch() {
        // Arrange
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));

        // Act
        BatchDTO result = batchService.getBatchById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getBatchId());
        assertEquals("BATCH-001", result.getBatchNumber());
        assertEquals("IM-001", result.getMaterialId());

        verify(batchRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should throw exception when batch not found")
    void getBatchById_NotFound_ThrowsException() {
        // Arrange
        when(batchRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> batchService.getBatchById(999L));

        assertTrue(exception.getMessage().contains("Batch not found"));
    }

    @Test
    @DisplayName("Should get batch genealogy with parents and children")
    void getBatchGenealogy_ValidBatch_ReturnsGenealogy() {
        // Arrange
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(batchRelationRepository.findParentRelations(1L)).thenReturn(List.of(parentRelation));
        when(batchRelationRepository.findChildRelations(1L)).thenReturn(List.of(childRelation));

        // Create operation with full hierarchy
        Order order = Order.builder().orderId(1L).customerId("CUST-001").status("IN_PROGRESS").build();
        OrderLineItem lineItem = OrderLineItem.builder().orderLineId(1L).order(order).productSku("STEEL-001").build();
        com.mes.production.entity.Process process = com.mes.production.entity.Process.builder().processId(1L).stageName("Melting").orderLineItem(lineItem).build();
        Operation operation = Operation.builder()
                .operationId(1L)
                .operationName("Melt Iron")
                .process(process)
                .build();

        when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(operation));

        // Act
        BatchDTO.Genealogy result = batchService.getBatchGenealogy(1L);

        // Assert
        assertNotNull(result);
        assertEquals("BATCH-001", result.getBatch().getBatchNumber());

        // Check parents
        assertEquals(1, result.getParentBatches().size());
        assertEquals("BATCH-002", result.getParentBatches().get(0).getBatchNumber());
        assertEquals("Iron Ore", result.getParentBatches().get(0).getMaterialName());

        // Check children
        assertEquals(1, result.getChildBatches().size());
        assertEquals("BATCH-003", result.getChildBatches().get(0).getBatchNumber());
        assertEquals("Steel Rod", result.getChildBatches().get(0).getMaterialName());

        // Check production info
        assertNotNull(result.getProductionInfo());
        assertEquals("Melt Iron", result.getProductionInfo().getOperationName());
        assertEquals("Melting", result.getProductionInfo().getProcessName());
    }

    @Test
    @DisplayName("Should get genealogy without production info when operation not found")
    void getBatchGenealogy_NoOperation_NoProductionInfo() {
        // Arrange
        testBatch.setGeneratedAtOperationId(null);
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(batchRelationRepository.findParentRelations(1L)).thenReturn(List.of());
        when(batchRelationRepository.findChildRelations(1L)).thenReturn(List.of());

        // Act
        BatchDTO.Genealogy result = batchService.getBatchGenealogy(1L);

        // Assert
        assertNotNull(result);
        assertNull(result.getProductionInfo());
    }

    @Test
    @DisplayName("Should throw exception when getting genealogy for non-existent batch")
    void getBatchGenealogy_NotFound_ThrowsException() {
        // Arrange
        when(batchRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> batchService.getBatchGenealogy(999L));

        assertTrue(exception.getMessage().contains("Batch not found"));
    }

    @Test
    @DisplayName("Should get available batches by material ID")
    void getAvailableBatchesByMaterial_ValidMaterial_ReturnsBatches() {
        // Arrange
        when(batchRepository.findAvailableByMaterialId("RM-001"))
                .thenReturn(List.of(parentBatch));

        // Act
        List<BatchDTO> result = batchService.getAvailableBatchesByMaterial("RM-001");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("RM-001", result.get(0).getMaterialId());

        verify(batchRepository, times(1)).findAvailableByMaterialId("RM-001");
    }

    @Test
    @DisplayName("Should return empty list when no batches available for material")
    void getAvailableBatchesByMaterial_NoMatch_ReturnsEmptyList() {
        // Arrange
        when(batchRepository.findAvailableByMaterialId("UNKNOWN"))
                .thenReturn(List.of());

        // Act
        List<BatchDTO> result = batchService.getAvailableBatchesByMaterial("UNKNOWN");

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should correctly map all batch fields to DTO")
    void convertToDTO_AllFields_MapsCorrectly() {
        // Arrange
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));

        // Act
        BatchDTO result = batchService.getBatchById(1L);

        // Assert
        assertEquals(1L, result.getBatchId());
        assertEquals("BATCH-001", result.getBatchNumber());
        assertEquals("IM-001", result.getMaterialId());
        assertEquals("Steel Billet", result.getMaterialName());
        assertEquals(new BigDecimal("500.00"), result.getQuantity());
        assertEquals("KG", result.getUnit());
        assertEquals("AVAILABLE", result.getStatus());
        assertNotNull(result.getCreatedOn());
    }

    @Test
    @DisplayName("Should handle genealogy with no parents")
    void getBatchGenealogy_NoParents_ReturnsEmptyParentList() {
        // Arrange
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(batchRelationRepository.findParentRelations(1L)).thenReturn(List.of());
        when(batchRelationRepository.findChildRelations(1L)).thenReturn(List.of(childRelation));
        when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.empty());

        // Act
        BatchDTO.Genealogy result = batchService.getBatchGenealogy(1L);

        // Assert
        assertNotNull(result);
        assertTrue(result.getParentBatches().isEmpty());
        assertEquals(1, result.getChildBatches().size());
    }

    @Test
    @DisplayName("Should handle genealogy with no children")
    void getBatchGenealogy_NoChildren_ReturnsEmptyChildList() {
        // Arrange
        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(batchRelationRepository.findParentRelations(1L)).thenReturn(List.of(parentRelation));
        when(batchRelationRepository.findChildRelations(1L)).thenReturn(List.of());
        when(operationRepository.findByIdWithDetails(1L)).thenReturn(Optional.empty());

        // Act
        BatchDTO.Genealogy result = batchService.getBatchGenealogy(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getParentBatches().size());
        assertTrue(result.getChildBatches().isEmpty());
    }

    // Split Tests
    @Test
    @DisplayName("Should split batch successfully")
    void splitBatch_ValidRequest_ReturnsNewBatches() {
        // Arrange
        BatchDTO.SplitRequest request = BatchDTO.SplitRequest.builder()
                .sourceBatchId(1L)
                .portions(List.of(
                        BatchDTO.SplitPortion.builder().quantity(new BigDecimal("200")).batchNumberSuffix("A").build(),
                        BatchDTO.SplitPortion.builder().quantity(new BigDecimal("150")).batchNumberSuffix("B").build()
                ))
                .reason("Quality check")
                .build();

        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
            Batch b = i.getArgument(0);
            if (b.getBatchId() == null) {
                b.setBatchId(10L + Math.abs(b.getBatchNumber().hashCode() % 100));
            }
            return b;
        });
        when(batchRelationRepository.save(any(BatchRelation.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        BatchDTO.SplitResponse result = batchService.splitBatch(request, "test-user");

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getSourceBatchId());
        assertEquals("SUCCESS", result.getStatus());
        assertEquals(2, result.getNewBatches().size());
        assertEquals(new BigDecimal("150.00"), result.getRemainingQuantity());

        verify(batchRepository, times(3)).save(any(Batch.class)); // 2 new + 1 update
        verify(batchRelationRepository, times(2)).save(any(BatchRelation.class));
    }

    @Test
    @DisplayName("Should throw exception when split exceeds quantity")
    void splitBatch_ExceedsQuantity_ThrowsException() {
        // Arrange
        BatchDTO.SplitRequest request = BatchDTO.SplitRequest.builder()
                .sourceBatchId(1L)
                .portions(List.of(
                        BatchDTO.SplitPortion.builder().quantity(new BigDecimal("400")).batchNumberSuffix("A").build(),
                        BatchDTO.SplitPortion.builder().quantity(new BigDecimal("200")).batchNumberSuffix("B").build()
                ))
                .build();

        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> batchService.splitBatch(request, "test-user"));

        assertTrue(exception.getMessage().contains("exceed"));
    }

    @Test
    @DisplayName("Should throw exception when splitting non-available batch")
    void splitBatch_NotAvailable_ThrowsException() {
        // Arrange
        testBatch.setStatus("CONSUMED");
        BatchDTO.SplitRequest request = BatchDTO.SplitRequest.builder()
                .sourceBatchId(1L)
                .portions(List.of(
                        BatchDTO.SplitPortion.builder().quantity(new BigDecimal("100")).build()
                ))
                .build();

        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> batchService.splitBatch(request, "test-user"));

        assertTrue(exception.getMessage().contains("AVAILABLE"));
    }

    @Test
    @DisplayName("Should mark source batch as SPLIT when fully split")
    void splitBatch_FullySplit_MarksAsSplit() {
        // Arrange
        BatchDTO.SplitRequest request = BatchDTO.SplitRequest.builder()
                .sourceBatchId(1L)
                .portions(List.of(
                        BatchDTO.SplitPortion.builder().quantity(new BigDecimal("250")).batchNumberSuffix("A").build(),
                        BatchDTO.SplitPortion.builder().quantity(new BigDecimal("250")).batchNumberSuffix("B").build()
                ))
                .build();

        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
            Batch b = i.getArgument(0);
            if (b.getBatchId() == null) {
                b.setBatchId(10L);
            }
            return b;
        });
        when(batchRelationRepository.save(any(BatchRelation.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        BatchDTO.SplitResponse result = batchService.splitBatch(request, "test-user");

        // Assert
        assertEquals(new BigDecimal("0.00"), result.getRemainingQuantity());
        verify(batchRepository).save(argThat(b ->
                b.getBatchId() != null && b.getBatchId() == 1L && "SPLIT".equals(b.getStatus())
        ));
    }

    // Merge Tests
    @Test
    @DisplayName("Should merge batches successfully")
    void mergeBatches_ValidRequest_ReturnsMergedBatch() {
        // Arrange
        Batch batch2 = Batch.builder()
                .batchId(2L)
                .batchNumber("BATCH-002")
                .materialId("IM-001")
                .materialName("Steel Billet")
                .quantity(new BigDecimal("300.00"))
                .unit("KG")
                .status("AVAILABLE")
                .build();

        BatchDTO.MergeRequest request = BatchDTO.MergeRequest.builder()
                .sourceBatchIds(List.of(1L, 2L))
                .reason("Consolidation")
                .build();

        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(batchRepository.findById(2L)).thenReturn(Optional.of(batch2));
        when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
            Batch b = i.getArgument(0);
            if (b.getBatchId() == null) {
                b.setBatchId(100L);
            }
            return b;
        });
        when(batchRelationRepository.save(any(BatchRelation.class))).thenAnswer(i -> i.getArgument(0));
        when(batchNumberService.generateMergeBatchNumber()).thenReturn("MERGE-001");

        // Act
        BatchDTO.MergeResponse result = batchService.mergeBatches(request, "test-user");

        // Assert
        assertNotNull(result);
        assertEquals("SUCCESS", result.getStatus());
        assertEquals(new BigDecimal("800.00"), result.getTotalQuantity()); // 500 + 300
        assertNotNull(result.getMergedBatch());
        assertEquals(2, result.getSourceBatches().size());

        verify(batchRepository, times(3)).save(any(Batch.class)); // 1 merged + 2 source updates
        verify(batchRelationRepository, times(2)).save(any(BatchRelation.class));
    }

    @Test
    @DisplayName("Should throw exception when merging with less than 2 batches")
    void mergeBatches_TooFewBatches_ThrowsException() {
        // Arrange
        BatchDTO.MergeRequest request = BatchDTO.MergeRequest.builder()
                .sourceBatchIds(List.of(1L))
                .build();

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> batchService.mergeBatches(request, "test-user"));

        assertTrue(exception.getMessage().contains("At least 2"));
    }

    @Test
    @DisplayName("Should throw exception when merging different materials")
    void mergeBatches_DifferentMaterials_ThrowsException() {
        // Arrange
        Batch differentMaterial = Batch.builder()
                .batchId(2L)
                .batchNumber("BATCH-002")
                .materialId("DIFFERENT-001")
                .quantity(new BigDecimal("100.00"))
                .unit("KG")
                .status("AVAILABLE")
                .build();

        BatchDTO.MergeRequest request = BatchDTO.MergeRequest.builder()
                .sourceBatchIds(List.of(1L, 2L))
                .build();

        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(batchRepository.findById(2L)).thenReturn(Optional.of(differentMaterial));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> batchService.mergeBatches(request, "test-user"));

        assertTrue(exception.getMessage().contains("same material"));
    }

    @Test
    @DisplayName("Should throw exception when merging non-available batch")
    void mergeBatches_NotAvailable_ThrowsException() {
        // Arrange
        Batch consumedBatch = Batch.builder()
                .batchId(2L)
                .batchNumber("BATCH-002")
                .materialId("IM-001")
                .quantity(new BigDecimal("100.00"))
                .unit("KG")
                .status("CONSUMED")
                .build();

        BatchDTO.MergeRequest request = BatchDTO.MergeRequest.builder()
                .sourceBatchIds(List.of(1L, 2L))
                .build();

        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(batchRepository.findById(2L)).thenReturn(Optional.of(consumedBatch));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> batchService.mergeBatches(request, "test-user"));

        assertTrue(exception.getMessage().contains("AVAILABLE"));
    }

    @Test
    @DisplayName("Should use custom batch number when provided")
    void mergeBatches_CustomBatchNumber_UsesCustomNumber() {
        // Arrange
        Batch batch2 = Batch.builder()
                .batchId(2L)
                .batchNumber("BATCH-002")
                .materialId("IM-001")
                .materialName("Steel Billet")
                .quantity(new BigDecimal("100.00"))
                .unit("KG")
                .status("AVAILABLE")
                .build();

        BatchDTO.MergeRequest request = BatchDTO.MergeRequest.builder()
                .sourceBatchIds(List.of(1L, 2L))
                .targetBatchNumber("CUSTOM-MERGED-001")
                .build();

        when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
        when(batchRepository.findById(2L)).thenReturn(Optional.of(batch2));
        when(batchRepository.save(any(Batch.class))).thenAnswer(i -> {
            Batch b = i.getArgument(0);
            if (b.getBatchId() == null) {
                b.setBatchId(100L);
            }
            return b;
        });
        when(batchRelationRepository.save(any(BatchRelation.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        BatchDTO.MergeResponse result = batchService.mergeBatches(request, "test-user");

        // Assert
        assertEquals("CUSTOM-MERGED-001", result.getMergedBatch().getBatchNumber());
    }
}
