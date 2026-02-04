package com.mes.production.service;

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
class EquipmentUsageServiceTest {

    @Mock
    private OperationEquipmentUsageRepository usageRepository;

    @Mock
    private OperationRepository operationRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private OperatorRepository operatorRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private EquipmentUsageService equipmentUsageService;

    private Operation testOperation;
    private Equipment testEquipment;
    private Operator testOperator;
    private OperationEquipmentUsage testUsage;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @BeforeEach
    void setUp() {
        startTime = LocalDateTime.now().minusHours(2);
        endTime = LocalDateTime.now();

        testOperation = Operation.builder()
                .operationId(1L)
                .operationName("Melting")
                .status("IN_PROGRESS")
                .build();

        testEquipment = Equipment.builder()
                .equipmentId(1L)
                .name("Furnace 1")
                .equipmentType("FURNACE")
                .status("AVAILABLE")
                .build();

        testOperator = Operator.builder()
                .operatorId(1L)
                .name("John Smith")
                .operatorCode("EMP-001")
                .build();

        testUsage = OperationEquipmentUsage.builder()
                .usageId(1L)
                .operation(testOperation)
                .equipment(testEquipment)
                .operator(testOperator)
                .startTime(startTime)
                .endTime(endTime)
                .status(OperationEquipmentUsage.STATUS_LOGGED)
                .createdBy("admin@mes.com")
                .build();
    }

    @Test
    @DisplayName("Should log equipment usage successfully")
    void logEquipmentUsage_ValidRequest_ReturnsUsage() {
        // Arrange
        when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));
        when(operatorRepository.findById(1L)).thenReturn(Optional.of(testOperator));
        when(usageRepository.save(any(OperationEquipmentUsage.class))).thenAnswer(i -> {
            OperationEquipmentUsage u = i.getArgument(0);
            u.setUsageId(1L);
            return u;
        });

        // Act
        OperationEquipmentUsage result = equipmentUsageService.logEquipmentUsage(1L, 1L, 1L, startTime, endTime);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getUsageId());
        assertEquals(OperationEquipmentUsage.STATUS_LOGGED, result.getStatus());
        verify(usageRepository, times(1)).save(any(OperationEquipmentUsage.class));
        verify(auditService, times(1)).logCreate(eq("EQUIPMENT_USAGE"), any(), anyString());
    }

    @Test
    @DisplayName("Should log equipment usage without operator")
    void logEquipmentUsage_NoOperator_ReturnsUsageWithNullOperator() {
        // Arrange
        when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));
        when(usageRepository.save(any(OperationEquipmentUsage.class))).thenAnswer(i -> {
            OperationEquipmentUsage u = i.getArgument(0);
            u.setUsageId(1L);
            return u;
        });

        // Act
        OperationEquipmentUsage result = equipmentUsageService.logEquipmentUsage(1L, 1L, null, startTime, endTime);

        // Assert
        assertNotNull(result);
        assertNull(result.getOperator());
    }

    @Test
    @DisplayName("Should throw exception when operation not found")
    void logEquipmentUsage_OperationNotFound_ThrowsException() {
        // Arrange
        when(operationRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> equipmentUsageService.logEquipmentUsage(999L, 1L, 1L, startTime, endTime));

        assertTrue(exception.getMessage().contains("Operation not found"));
    }

    @Test
    @DisplayName("Should throw exception when equipment not found")
    void logEquipmentUsage_EquipmentNotFound_ThrowsException() {
        // Arrange
        when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
        when(equipmentRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> equipmentUsageService.logEquipmentUsage(1L, 999L, 1L, startTime, endTime));

        assertTrue(exception.getMessage().contains("Equipment not found"));
    }

    @Test
    @DisplayName("Should log multiple equipment usages for confirmation")
    void logEquipmentUsagesForConfirmation_ValidRequest_LogsMultipleUsages() {
        // Arrange
        Equipment equipment2 = Equipment.builder()
                .equipmentId(2L)
                .name("Furnace 2")
                .build();

        when(operationRepository.findById(1L)).thenReturn(Optional.of(testOperation));
        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));
        when(equipmentRepository.findById(2L)).thenReturn(Optional.of(equipment2));
        when(operatorRepository.findById(1L)).thenReturn(Optional.of(testOperator));
        when(usageRepository.save(any(OperationEquipmentUsage.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        equipmentUsageService.logEquipmentUsagesForConfirmation(1L, List.of(1L, 2L), List.of(1L), startTime, endTime);

        // Assert
        verify(usageRepository, times(2)).save(any(OperationEquipmentUsage.class));
    }

    @Test
    @DisplayName("Should do nothing when equipment list is empty")
    void logEquipmentUsagesForConfirmation_EmptyList_DoesNothing() {
        // Act
        equipmentUsageService.logEquipmentUsagesForConfirmation(1L, List.of(), List.of(), startTime, endTime);

        // Assert
        verify(usageRepository, never()).save(any(OperationEquipmentUsage.class));
    }

    @Test
    @DisplayName("Should do nothing when equipment list is null")
    void logEquipmentUsagesForConfirmation_NullList_DoesNothing() {
        // Act
        equipmentUsageService.logEquipmentUsagesForConfirmation(1L, null, null, startTime, endTime);

        // Assert
        verify(usageRepository, never()).save(any(OperationEquipmentUsage.class));
    }

    @Test
    @DisplayName("Should get usage for operation")
    void getUsageForOperation_ValidId_ReturnsUsages() {
        // Arrange
        when(usageRepository.findByOperationWithDetails(1L)).thenReturn(List.of(testUsage));

        // Act
        List<OperationEquipmentUsage> result = equipmentUsageService.getUsageForOperation(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getUsageId());
    }

    @Test
    @DisplayName("Should get equipment usage history")
    void getEquipmentUsageHistory_ValidId_ReturnsHistory() {
        // Arrange
        when(usageRepository.findByEquipment_EquipmentId(1L)).thenReturn(List.of(testUsage));

        // Act
        List<OperationEquipmentUsage> result = equipmentUsageService.getEquipmentUsageHistory(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("Should get operator usage history")
    void getOperatorUsageHistory_ValidId_ReturnsHistory() {
        // Arrange
        when(usageRepository.findByOperator_OperatorId(1L)).thenReturn(List.of(testUsage));

        // Act
        List<OperationEquipmentUsage> result = equipmentUsageService.getOperatorUsageHistory(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("Should check if equipment is in use - true")
    void isEquipmentInUse_ActiveUsage_ReturnsTrue() {
        // Arrange
        when(usageRepository.findActiveEquipmentUsage(1L)).thenReturn(List.of(testUsage));

        // Act
        boolean result = equipmentUsageService.isEquipmentInUse(1L);

        // Assert
        assertTrue(result);
    }

    @Test
    @DisplayName("Should check if equipment is in use - false")
    void isEquipmentInUse_NoActiveUsage_ReturnsFalse() {
        // Arrange
        when(usageRepository.findActiveEquipmentUsage(1L)).thenReturn(List.of());

        // Act
        boolean result = equipmentUsageService.isEquipmentInUse(1L);

        // Assert
        assertFalse(result);
    }

    @Test
    @DisplayName("Should confirm usage successfully")
    void confirmUsage_ValidId_ConfirmsUsage() {
        // Arrange
        when(usageRepository.findById(1L)).thenReturn(Optional.of(testUsage));
        when(usageRepository.save(any(OperationEquipmentUsage.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        OperationEquipmentUsage result = equipmentUsageService.confirmUsage(1L);

        // Assert
        assertNotNull(result);
        assertEquals(OperationEquipmentUsage.STATUS_CONFIRMED, result.getStatus());
    }

    @Test
    @DisplayName("Should throw exception when usage not found for confirmation")
    void confirmUsage_NotFound_ThrowsException() {
        // Arrange
        when(usageRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> equipmentUsageService.confirmUsage(999L));

        assertTrue(exception.getMessage().contains("Usage record not found"));
    }
}
