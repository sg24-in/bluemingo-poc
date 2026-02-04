package com.mes.production.service;

import com.mes.production.entity.Inventory;
import com.mes.production.entity.InventoryMovement;
import com.mes.production.entity.Operation;
import com.mes.production.repository.InventoryMovementRepository;
import com.mes.production.repository.InventoryRepository;
import com.mes.production.repository.OperationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryMovementServiceTest {

    @Mock
    private InventoryMovementRepository movementRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private OperationRepository operationRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private InventoryMovementService movementService;

    private Inventory testInventory;
    private Operation testOperation;
    private InventoryMovement testMovement;
    private LocalDateTime timestamp;

    @BeforeEach
    void setUp() {
        timestamp = LocalDateTime.now();

        testInventory = Inventory.builder()
                .inventoryId(1L)
                .materialId("RM-001")
                .materialName("Iron Ore")
                .quantity(new BigDecimal("1000.00"))
                .unit("KG")
                .state("AVAILABLE")
                .build();

        testOperation = Operation.builder()
                .operationId(1L)
                .operationName("Melting")
                .status("IN_PROGRESS")
                .build();

        testMovement = InventoryMovement.builder()
                .movementId(1L)
                .inventory(testInventory)
                .operation(testOperation)
                .movementType(InventoryMovement.TYPE_CONSUME)
                .quantity(new BigDecimal("100.00"))
                .timestamp(timestamp)
                .reason("Production consumption")
                .status(InventoryMovement.STATUS_EXECUTED)
                .createdBy("admin@mes.com")
                .build();
    }

    @Test
    @DisplayName("Should record consume movement")
    void recordConsume_ValidRequest_ReturnsMovement() {
        // Arrange
        when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
        when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
        when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(i -> {
            InventoryMovement m = i.getArgument(0);
            m.setMovementId(1L);
            return m;
        });

        // Act
        InventoryMovement result = movementService.recordConsume(1L, 1L, new BigDecimal("100.00"), "Production");

        // Assert
        assertNotNull(result);
        assertEquals(InventoryMovement.TYPE_CONSUME, result.getMovementType());
        assertEquals(InventoryMovement.STATUS_EXECUTED, result.getStatus());
        verify(auditService, times(1)).logCreate(eq("INVENTORY_MOVEMENT"), any(), anyString());
    }

    @Test
    @DisplayName("Should record produce movement")
    void recordProduce_ValidRequest_ReturnsMovement() {
        // Arrange
        when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
        when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
        when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(i -> {
            InventoryMovement m = i.getArgument(0);
            m.setMovementId(1L);
            return m;
        });

        // Act
        InventoryMovement result = movementService.recordProduce(1L, 1L, new BigDecimal("200.00"), "Production output");

        // Assert
        assertNotNull(result);
        assertEquals(InventoryMovement.TYPE_PRODUCE, result.getMovementType());
    }

    @Test
    @DisplayName("Should record hold movement without operation")
    void recordHold_ValidRequest_ReturnsMovement() {
        // Arrange
        when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
        when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(i -> {
            InventoryMovement m = i.getArgument(0);
            m.setMovementId(1L);
            return m;
        });

        // Act
        InventoryMovement result = movementService.recordHold(1L, new BigDecimal("50.00"), "Quality hold");

        // Assert
        assertNotNull(result);
        assertEquals(InventoryMovement.TYPE_HOLD, result.getMovementType());
        assertNull(result.getOperation());
    }

    @Test
    @DisplayName("Should record release movement without operation")
    void recordRelease_ValidRequest_ReturnsMovement() {
        // Arrange
        when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
        when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(i -> {
            InventoryMovement m = i.getArgument(0);
            m.setMovementId(1L);
            return m;
        });

        // Act
        InventoryMovement result = movementService.recordRelease(1L, new BigDecimal("50.00"), "Quality approved");

        // Assert
        assertNotNull(result);
        assertEquals(InventoryMovement.TYPE_RELEASE, result.getMovementType());
    }

    @Test
    @DisplayName("Should record scrap movement")
    void recordScrap_ValidRequest_ReturnsMovement() {
        // Arrange
        when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
        when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
        when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(i -> {
            InventoryMovement m = i.getArgument(0);
            m.setMovementId(1L);
            return m;
        });

        // Act
        InventoryMovement result = movementService.recordScrap(1L, 1L, new BigDecimal("10.00"), "Quality reject");

        // Assert
        assertNotNull(result);
        assertEquals(InventoryMovement.TYPE_SCRAP, result.getMovementType());
    }

    @Test
    @DisplayName("Should throw exception when inventory not found")
    void recordMovement_InventoryNotFound_ThrowsException() {
        // Arrange
        when(inventoryRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> movementService.recordConsume(999L, 1L, new BigDecimal("100.00"), "Test"));

        assertTrue(exception.getMessage().contains("Inventory not found"));
    }

    @Test
    @DisplayName("Should get inventory movement history")
    void getInventoryMovementHistory_ValidId_ReturnsHistory() {
        // Arrange
        when(movementRepository.findByInventory_InventoryIdOrderByTimestampDesc(1L)).thenReturn(List.of(testMovement));

        // Act
        List<InventoryMovement> result = movementService.getInventoryMovementHistory(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("Should get operation movements")
    void getOperationMovements_ValidId_ReturnsMovements() {
        // Arrange
        when(movementRepository.findByOperation_OperationIdOrderByTimestampDesc(1L)).thenReturn(List.of(testMovement));

        // Act
        List<InventoryMovement> result = movementService.getOperationMovements(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("Should get batch movements")
    void getBatchMovements_ValidId_ReturnsMovements() {
        // Arrange
        when(movementRepository.findByBatchId(1L)).thenReturn(List.of(testMovement));

        // Act
        List<InventoryMovement> result = movementService.getBatchMovements(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("Should get movements in time range")
    void getMovementsInTimeRange_ValidRange_ReturnsMovements() {
        // Arrange
        LocalDateTime startTime = LocalDateTime.now().minusHours(24);
        LocalDateTime endTime = LocalDateTime.now();
        when(movementRepository.findByTimeRange(startTime, endTime)).thenReturn(List.of(testMovement));

        // Act
        List<InventoryMovement> result = movementService.getMovementsInTimeRange(startTime, endTime);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("Should get recent movements")
    void getRecentMovements_ValidLimit_ReturnsMovements() {
        // Arrange
        when(movementRepository.findRecentMovements(any(PageRequest.class))).thenReturn(List.of(testMovement));

        // Act
        List<InventoryMovement> result = movementService.getRecentMovements(10);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("Should get pending movements")
    void getPendingMovements_ReturnsPendingMovements() {
        // Arrange
        testMovement.setStatus(InventoryMovement.STATUS_PENDING);
        when(movementRepository.findByStatus(InventoryMovement.STATUS_PENDING)).thenReturn(List.of(testMovement));

        // Act
        List<InventoryMovement> result = movementService.getPendingMovements();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(InventoryMovement.STATUS_PENDING, result.get(0).getStatus());
    }

    @Test
    @DisplayName("Should execute pending movement")
    void executeMovement_ValidId_ExecutesMovement() {
        // Arrange
        testMovement.setStatus(InventoryMovement.STATUS_PENDING);
        when(movementRepository.findById(1L)).thenReturn(Optional.of(testMovement));
        when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        InventoryMovement result = movementService.executeMovement(1L);

        // Assert
        assertNotNull(result);
        assertEquals(InventoryMovement.STATUS_EXECUTED, result.getStatus());
    }

    @Test
    @DisplayName("Should throw exception when movement not found")
    void executeMovement_NotFound_ThrowsException() {
        // Arrange
        when(movementRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> movementService.executeMovement(999L));

        assertTrue(exception.getMessage().contains("Movement not found"));
    }

    @Test
    @DisplayName("Should throw exception when movement not pending")
    void executeMovement_NotPending_ThrowsException() {
        // Arrange
        testMovement.setStatus(InventoryMovement.STATUS_EXECUTED);
        when(movementRepository.findById(1L)).thenReturn(Optional.of(testMovement));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> movementService.executeMovement(1L));

        assertTrue(exception.getMessage().contains("not in PENDING status"));
    }
}
