package com.mes.production.service;

import com.mes.production.dto.HoldDTO;
import com.mes.production.entity.*;
import com.mes.production.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HoldServiceTest {

    @Mock
    private HoldRecordRepository holdRecordRepository;

    @Mock
    private OperationRepository operationRepository;

    @Mock
    private ProcessRepository processRepository;

    @Mock
    private OrderLineItemRepository orderLineItemRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private BatchRepository batchRepository;

    @InjectMocks
    private HoldService holdService;

    private Operation testOperation;
    private HoldRecord testHoldRecord;

    @BeforeEach
    void setUp() {
        testOperation = Operation.builder()
                .operationId(1L)
                .operationName("Test Operation")
                .status("READY")
                .build();

        testHoldRecord = HoldRecord.builder()
                .holdId(1L)
                .entityType("OPERATION")
                .entityId(1L)
                .reason("Equipment Breakdown")
                .comments("Test comments")
                .appliedBy("test-user")
                .appliedOn(LocalDateTime.now())
                .status("ACTIVE")
                .build();
    }

    @Test
    @DisplayName("Should apply hold successfully")
    void applyHold_ValidRequest_Success() {
        // Arrange
        HoldDTO.ApplyHoldRequest request = HoldDTO.ApplyHoldRequest.builder()
                .entityType("OPERATION")
                .entityId(1L)
                .reason("Equipment Breakdown")
                .comments("Test hold")
                .build();

        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("OPERATION", 1L, "ACTIVE")).thenReturn(false);
        when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
        when(holdRecordRepository.save(any(HoldRecord.class))).thenAnswer(i -> {
            HoldRecord h = i.getArgument(0);
            h.setHoldId(1L);
            return h;
        });
        when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        HoldDTO.HoldResponse response = holdService.applyHold(request, "test-user");

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getHoldId());
        assertEquals("OPERATION", response.getEntityType());
        assertEquals("Equipment Breakdown", response.getReason());
        assertEquals("ACTIVE", response.getStatus());

        verify(holdRecordRepository, times(1)).save(any(HoldRecord.class));
        verify(operationRepository, times(1)).save(any(Operation.class));
    }

    @Test
    @DisplayName("Should throw exception when entity is already on hold")
    void applyHold_AlreadyOnHold_ThrowsException() {
        // Arrange
        HoldDTO.ApplyHoldRequest request = HoldDTO.ApplyHoldRequest.builder()
                .entityType("OPERATION")
                .entityId(1L)
                .reason("Equipment Breakdown")
                .build();

        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("OPERATION", 1L, "ACTIVE")).thenReturn(true);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> holdService.applyHold(request, "test-user"));

        assertTrue(exception.getMessage().contains("already on hold"));
    }

    @Test
    @DisplayName("Should release hold successfully")
    void releaseHold_ValidRequest_Success() {
        // Arrange
        HoldDTO.ReleaseHoldRequest request = HoldDTO.ReleaseHoldRequest.builder()
                .releaseComments("Issue resolved")
                .build();

        when(holdRecordRepository.findById(1L)).thenReturn(Optional.of(testHoldRecord));
        when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
        when(holdRecordRepository.save(any(HoldRecord.class))).thenAnswer(i -> i.getArgument(0));
        when(operationRepository.save(any(Operation.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        HoldDTO.HoldResponse response = holdService.releaseHold(1L, request, "test-user");

        // Assert
        assertNotNull(response);
        assertEquals("RELEASED", response.getStatus());
        assertEquals("Issue resolved", response.getReleaseComments());

        verify(holdRecordRepository, times(1)).save(any(HoldRecord.class));
    }

    @Test
    @DisplayName("Should throw exception when releasing non-active hold")
    void releaseHold_NotActive_ThrowsException() {
        // Arrange
        testHoldRecord.setStatus("RELEASED");
        when(holdRecordRepository.findById(1L)).thenReturn(Optional.of(testHoldRecord));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> holdService.releaseHold(1L, null, "test-user"));

        assertTrue(exception.getMessage().contains("not active"));
    }

    @Test
    @DisplayName("Should throw exception when hold not found")
    void releaseHold_NotFound_ThrowsException() {
        // Arrange
        when(holdRecordRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> holdService.releaseHold(999L, null, "test-user"));
    }

    @Test
    @DisplayName("Should return true when entity is on hold")
    void isEntityOnHold_ActiveHold_ReturnsTrue() {
        // Arrange
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("OPERATION", 1L, "ACTIVE")).thenReturn(true);

        // Act
        boolean result = holdService.isEntityOnHold("OPERATION", 1L);

        // Assert
        assertTrue(result);
    }

    @Test
    @DisplayName("Should return false when entity is not on hold")
    void isEntityOnHold_NoActiveHold_ReturnsFalse() {
        // Arrange
        when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("OPERATION", 1L, "ACTIVE")).thenReturn(false);

        // Act
        boolean result = holdService.isEntityOnHold("OPERATION", 1L);

        // Assert
        assertFalse(result);
    }

    @Test
    @DisplayName("Should get active holds")
    void getActiveHolds_ReturnsHolds() {
        // Arrange
        when(holdRecordRepository.findActiveHoldsOrderByAppliedOnDesc()).thenReturn(List.of(testHoldRecord));
        when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));

        // Act
        List<HoldDTO.HoldResponse> result = holdService.getActiveHolds();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("OPERATION", result.get(0).getEntityType());
    }

    @Test
    @DisplayName("Should get active hold count")
    void getActiveHoldCount_ReturnsCount() {
        // Arrange
        when(holdRecordRepository.countByStatus("ACTIVE")).thenReturn(5L);

        // Act
        Long result = holdService.getActiveHoldCount();

        // Assert
        assertEquals(5L, result);
    }

    @Test
    @DisplayName("Should throw exception for invalid entity type")
    void applyHold_InvalidEntityType_ThrowsException() {
        // Arrange
        HoldDTO.ApplyHoldRequest request = HoldDTO.ApplyHoldRequest.builder()
                .entityType("INVALID_TYPE")
                .entityId(1L)
                .reason("Test")
                .build();

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> holdService.applyHold(request, "test-user"));

        assertTrue(exception.getMessage().contains("Invalid entity type"));
    }
}
