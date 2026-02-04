package com.mes.production.service;

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
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FieldChangeAuditServiceTest {

    @Mock
    private AuditService auditService;

    @InjectMocks
    private FieldChangeAuditService fieldChangeAuditService;

    // Test entity class
    static class TestEntity {
        private Long id;
        private String name;
        private BigDecimal quantity;
        private LocalDateTime timestamp;
        private String status;
        private String updatedOn; // Should be excluded
        private String updatedBy; // Should be excluded

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public BigDecimal getQuantity() { return quantity; }
        public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getUpdatedOn() { return updatedOn; }
        public void setUpdatedOn(String updatedOn) { this.updatedOn = updatedOn; }
        public String getUpdatedBy() { return updatedBy; }
        public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    }

    private TestEntity oldEntity;
    private TestEntity newEntity;

    @BeforeEach
    void setUp() {
        oldEntity = new TestEntity();
        oldEntity.setId(1L);
        oldEntity.setName("Original Name");
        oldEntity.setQuantity(new BigDecimal("100.00"));
        oldEntity.setTimestamp(LocalDateTime.of(2024, 1, 1, 10, 0));
        oldEntity.setStatus("PENDING");
        oldEntity.setUpdatedOn("2024-01-01");
        oldEntity.setUpdatedBy("user1");

        newEntity = new TestEntity();
        newEntity.setId(1L);
        newEntity.setName("Updated Name");
        newEntity.setQuantity(new BigDecimal("150.00"));
        newEntity.setTimestamp(LocalDateTime.of(2024, 1, 1, 12, 0));
        newEntity.setStatus("COMPLETED");
        newEntity.setUpdatedOn("2024-01-02");
        newEntity.setUpdatedBy("user2");
    }

    @Test
    @DisplayName("Should detect field changes between entities")
    void detectFieldChanges_ChangedFields_ReturnsChanges() {
        // Act
        List<FieldChangeAuditService.FieldChange> changes = fieldChangeAuditService.detectFieldChanges(oldEntity, newEntity, null);

        // Assert
        assertNotNull(changes);
        assertTrue(changes.size() >= 4); // name, quantity, timestamp, status should change
        assertTrue(changes.stream().anyMatch(c -> c.fieldName().equals("name")));
        assertTrue(changes.stream().anyMatch(c -> c.fieldName().equals("quantity")));
        assertTrue(changes.stream().anyMatch(c -> c.fieldName().equals("status")));
    }

    @Test
    @DisplayName("Should exclude system fields from change detection")
    void detectFieldChanges_ExcludedFields_NotInChanges() {
        // Act
        List<FieldChangeAuditService.FieldChange> changes = fieldChangeAuditService.detectFieldChanges(oldEntity, newEntity, null);

        // Assert
        assertFalse(changes.stream().anyMatch(c -> c.fieldName().equals("updatedOn")));
        assertFalse(changes.stream().anyMatch(c -> c.fieldName().equals("updatedBy")));
    }

    @Test
    @DisplayName("Should filter changes to specific fields only")
    void detectFieldChanges_SpecificFields_ReturnsFilteredChanges() {
        // Arrange
        Set<String> fieldsToTrack = Set.of("name", "status");

        // Act
        List<FieldChangeAuditService.FieldChange> changes = fieldChangeAuditService.detectFieldChanges(oldEntity, newEntity, fieldsToTrack);

        // Assert
        assertNotNull(changes);
        assertEquals(2, changes.size());
        assertTrue(changes.stream().anyMatch(c -> c.fieldName().equals("name")));
        assertTrue(changes.stream().anyMatch(c -> c.fieldName().equals("status")));
        assertFalse(changes.stream().anyMatch(c -> c.fieldName().equals("quantity")));
    }

    @Test
    @DisplayName("Should return empty list when no changes")
    void detectFieldChanges_NoChanges_ReturnsEmptyList() {
        // Arrange
        newEntity.setName("Original Name");
        newEntity.setQuantity(new BigDecimal("100.00"));
        newEntity.setTimestamp(LocalDateTime.of(2024, 1, 1, 10, 0));
        newEntity.setStatus("PENDING");

        // Act
        List<FieldChangeAuditService.FieldChange> changes = fieldChangeAuditService.detectFieldChanges(oldEntity, newEntity, null);

        // Assert
        // Changes should only include non-excluded fields that changed (id doesn't change)
        assertTrue(changes.isEmpty() || changes.stream().noneMatch(c ->
            c.fieldName().equals("name") || c.fieldName().equals("quantity") ||
            c.fieldName().equals("status") || c.fieldName().equals("timestamp")));
    }

    @Test
    @DisplayName("Should return empty list when old entity is null")
    void detectFieldChanges_OldEntityNull_ReturnsEmptyList() {
        // Act
        List<FieldChangeAuditService.FieldChange> changes = fieldChangeAuditService.detectFieldChanges(null, newEntity, null);

        // Assert
        assertNotNull(changes);
        assertTrue(changes.isEmpty());
    }

    @Test
    @DisplayName("Should return empty list when new entity is null")
    void detectFieldChanges_NewEntityNull_ReturnsEmptyList() {
        // Act
        List<FieldChangeAuditService.FieldChange> changes = fieldChangeAuditService.detectFieldChanges(oldEntity, null, null);

        // Assert
        assertNotNull(changes);
        assertTrue(changes.isEmpty());
    }

    @Test
    @DisplayName("Should audit field changes and log to audit service")
    void auditFieldChanges_ChangedFields_LogsToAuditService() {
        // Act
        fieldChangeAuditService.auditFieldChanges("TEST_ENTITY", 1L, oldEntity, newEntity, null);

        // Assert
        verify(auditService, atLeast(4)).logUpdate(eq("TEST_ENTITY"), eq(1L), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should not call audit service when no changes")
    void auditFieldChanges_NoChanges_DoesNotLogToAuditService() {
        // Arrange
        newEntity.setName("Original Name");
        newEntity.setQuantity(new BigDecimal("100.00"));
        newEntity.setTimestamp(LocalDateTime.of(2024, 1, 1, 10, 0));
        newEntity.setStatus("PENDING");
        newEntity.setId(1L);

        // Act
        fieldChangeAuditService.auditFieldChanges("TEST_ENTITY", 1L, oldEntity, newEntity, Set.of("name", "quantity", "timestamp", "status"));

        // Assert
        verify(auditService, never()).logUpdate(anyString(), anyLong(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should not audit when old entity is null")
    void auditFieldChanges_OldEntityNull_DoesNotAudit() {
        // Act
        fieldChangeAuditService.auditFieldChanges("TEST_ENTITY", 1L, null, newEntity, null);

        // Assert
        verify(auditService, never()).logUpdate(anyString(), anyLong(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should audit production confirmation changes")
    void auditProductionConfirmationChanges_ChangedFields_AuditsCorrectFields() {
        // Arrange
        oldEntity.setStatus("IN_PROGRESS");
        newEntity.setStatus("COMPLETED");

        // Act
        fieldChangeAuditService.auditProductionConfirmationChanges(1L, oldEntity, newEntity);

        // Assert
        verify(auditService).logUpdate(eq("PRODUCTION_CONFIRMATION"), eq(1L), eq("status"), eq("IN_PROGRESS"), eq("COMPLETED"));
    }

    @Test
    @DisplayName("Should audit inventory changes")
    void auditInventoryChanges_ChangedFields_AuditsCorrectFields() {
        // Arrange - using quantity and status as tracked fields
        oldEntity.setQuantity(new BigDecimal("100.00"));
        newEntity.setQuantity(new BigDecimal("80.00"));

        // Act
        fieldChangeAuditService.auditInventoryChanges(1L, oldEntity, newEntity);

        // Assert
        verify(auditService).logUpdate(eq("INVENTORY"), eq(1L), eq("quantity"), eq("100"), eq("80"));
    }

    @Test
    @DisplayName("Should audit batch changes")
    void auditBatchChanges_ChangedFields_AuditsCorrectFields() {
        // Arrange
        oldEntity.setStatus("AVAILABLE");
        newEntity.setStatus("CONSUMED");

        // Act
        fieldChangeAuditService.auditBatchChanges(1L, oldEntity, newEntity);

        // Assert
        verify(auditService).logUpdate(eq("BATCH"), eq(1L), eq("status"), eq("AVAILABLE"), eq("CONSUMED"));
    }

    @Test
    @DisplayName("Should audit operation changes")
    void auditOperationChanges_ChangedFields_AuditsCorrectFields() {
        // Arrange
        oldEntity.setStatus("IN_PROGRESS");
        newEntity.setStatus("CONFIRMED");

        // Act
        fieldChangeAuditService.auditOperationChanges(1L, oldEntity, newEntity);

        // Assert
        verify(auditService).logUpdate(eq("OPERATION"), eq(1L), eq("status"), eq("IN_PROGRESS"), eq("CONFIRMED"));
    }

    @Test
    @DisplayName("Should log single field change")
    void logFieldChange_ValueChanged_LogsChange() {
        // Act
        fieldChangeAuditService.logFieldChange("TEST_ENTITY", 1L, "status", "OLD", "NEW");

        // Assert
        verify(auditService).logUpdate(eq("TEST_ENTITY"), eq(1L), eq("status"), eq("OLD"), eq("NEW"));
    }

    @Test
    @DisplayName("Should not log when values are equal")
    void logFieldChange_ValuesEqual_DoesNotLog() {
        // Act
        fieldChangeAuditService.logFieldChange("TEST_ENTITY", 1L, "status", "SAME", "SAME");

        // Assert
        verify(auditService, never()).logUpdate(anyString(), anyLong(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should handle BigDecimal comparison correctly")
    void detectFieldChanges_BigDecimalSameValue_NoChange() {
        // Arrange
        oldEntity.setQuantity(new BigDecimal("100.00"));
        newEntity.setQuantity(new BigDecimal("100.0")); // Same value, different scale

        // Act
        List<FieldChangeAuditService.FieldChange> changes = fieldChangeAuditService.detectFieldChanges(oldEntity, newEntity, Set.of("quantity"));

        // Assert
        assertTrue(changes.isEmpty());
    }

    @Test
    @DisplayName("Should handle null to value change")
    void detectFieldChanges_NullToValue_DetectsChange() {
        // Arrange
        oldEntity.setName(null);
        newEntity.setName("New Name");

        // Act
        List<FieldChangeAuditService.FieldChange> changes = fieldChangeAuditService.detectFieldChanges(oldEntity, newEntity, Set.of("name"));

        // Assert
        assertEquals(1, changes.size());
        assertNull(changes.get(0).oldValue());
        assertEquals("New Name", changes.get(0).newValue());
    }

    @Test
    @DisplayName("Should handle value to null change")
    void detectFieldChanges_ValueToNull_DetectsChange() {
        // Arrange
        oldEntity.setName("Old Name");
        newEntity.setName(null);

        // Act
        List<FieldChangeAuditService.FieldChange> changes = fieldChangeAuditService.detectFieldChanges(oldEntity, newEntity, Set.of("name"));

        // Assert
        assertEquals(1, changes.size());
        assertEquals("Old Name", changes.get(0).oldValue());
        assertNull(changes.get(0).newValue());
    }

    @Test
    @DisplayName("Should format BigDecimal without trailing zeros")
    void detectFieldChanges_BigDecimal_FormatsCorrectly() {
        // Arrange
        oldEntity.setQuantity(new BigDecimal("100.0000"));
        newEntity.setQuantity(new BigDecimal("150.50"));

        // Act
        List<FieldChangeAuditService.FieldChange> changes = fieldChangeAuditService.detectFieldChanges(oldEntity, newEntity, Set.of("quantity"));

        // Assert
        assertEquals(1, changes.size());
        assertEquals("100", changes.get(0).oldValue()); // Stripped trailing zeros
        assertEquals("150.5", changes.get(0).newValue());
    }
}
