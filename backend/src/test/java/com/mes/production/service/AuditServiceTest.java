package com.mes.production.service;

import com.mes.production.entity.AuditTrail;
import com.mes.production.repository.AuditTrailRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock
    private AuditTrailRepository auditTrailRepository;

    @InjectMocks
    private AuditService auditService;

    @BeforeEach
    void setUp() {
        // Set up security context with test user
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("testuser", "password")
        );
    }

    @Test
    @DisplayName("Should create audit entry for CREATE action")
    void logCreate_CreatesAuditEntry() {
        // Arrange
        when(auditTrailRepository.save(any(AuditTrail.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        auditService.logCreate("BATCH", 1L, "Created new batch");

        // Assert
        ArgumentCaptor<AuditTrail> captor = ArgumentCaptor.forClass(AuditTrail.class);
        verify(auditTrailRepository).save(captor.capture());

        AuditTrail captured = captor.getValue();
        assertEquals("BATCH", captured.getEntityType());
        assertEquals(1L, captured.getEntityId());
        assertEquals(AuditTrail.ACTION_CREATE, captured.getAction());
        assertEquals("testuser", captured.getChangedBy());
        assertNotNull(captured.getTimestamp());
    }

    @Test
    @DisplayName("Should create audit entry for STATUS_CHANGE action")
    void logStatusChange_CreatesAuditEntry() {
        // Arrange
        when(auditTrailRepository.save(any(AuditTrail.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        auditService.logStatusChange("OPERATION", 2L, "READY", "CONFIRMED");

        // Assert
        ArgumentCaptor<AuditTrail> captor = ArgumentCaptor.forClass(AuditTrail.class);
        verify(auditTrailRepository).save(captor.capture());

        AuditTrail captured = captor.getValue();
        assertEquals("OPERATION", captured.getEntityType());
        assertEquals(2L, captured.getEntityId());
        assertEquals(AuditTrail.ACTION_STATUS_CHANGE, captured.getAction());
        assertEquals("READY", captured.getOldValue());
        assertEquals("CONFIRMED", captured.getNewValue());
        assertEquals("status", captured.getFieldName());
    }

    @Test
    @DisplayName("Should create audit entry for CONSUME action")
    void logConsume_CreatesAuditEntry() {
        // Arrange
        when(auditTrailRepository.save(any(AuditTrail.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        auditService.logConsume("INVENTORY", 3L, "Consumed 100 units");

        // Assert
        ArgumentCaptor<AuditTrail> captor = ArgumentCaptor.forClass(AuditTrail.class);
        verify(auditTrailRepository).save(captor.capture());

        AuditTrail captured = captor.getValue();
        assertEquals("INVENTORY", captured.getEntityType());
        assertEquals(AuditTrail.ACTION_CONSUME, captured.getAction());
    }

    @Test
    @DisplayName("Should create audit entry for PRODUCE action")
    void logProduce_CreatesAuditEntry() {
        // Arrange
        when(auditTrailRepository.save(any(AuditTrail.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        auditService.logProduce("BATCH", 4L, "Produced 500 units");

        // Assert
        ArgumentCaptor<AuditTrail> captor = ArgumentCaptor.forClass(AuditTrail.class);
        verify(auditTrailRepository).save(captor.capture());

        AuditTrail captured = captor.getValue();
        assertEquals("BATCH", captured.getEntityType());
        assertEquals(AuditTrail.ACTION_PRODUCE, captured.getAction());
    }

    @Test
    @DisplayName("Should create audit entry for HOLD action")
    void logHold_CreatesAuditEntry() {
        // Arrange
        when(auditTrailRepository.save(any(AuditTrail.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        auditService.logHold("BATCH", 5L, "Quality issue");

        // Assert
        ArgumentCaptor<AuditTrail> captor = ArgumentCaptor.forClass(AuditTrail.class);
        verify(auditTrailRepository).save(captor.capture());

        AuditTrail captured = captor.getValue();
        assertEquals("BATCH", captured.getEntityType());
        assertEquals(AuditTrail.ACTION_HOLD, captured.getAction());
    }

    @Test
    @DisplayName("Should create audit entry for RELEASE action")
    void logRelease_CreatesAuditEntry() {
        // Arrange
        when(auditTrailRepository.save(any(AuditTrail.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        auditService.logRelease("BATCH", 6L, "Issue resolved");

        // Assert
        ArgumentCaptor<AuditTrail> captor = ArgumentCaptor.forClass(AuditTrail.class);
        verify(auditTrailRepository).save(captor.capture());

        AuditTrail captured = captor.getValue();
        assertEquals("BATCH", captured.getEntityType());
        assertEquals(AuditTrail.ACTION_RELEASE, captured.getAction());
    }

    @Test
    @DisplayName("Should return entity history ordered by timestamp")
    void getEntityHistory_ReturnsOrderedHistory() {
        // Arrange
        List<AuditTrail> mockHistory = List.of(
                AuditTrail.builder().auditId(2L).action("STATUS_CHANGE").timestamp(LocalDateTime.now()).build(),
                AuditTrail.builder().auditId(1L).action("CREATE").timestamp(LocalDateTime.now().minusHours(1)).build()
        );
        when(auditTrailRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc("BATCH", 1L))
                .thenReturn(mockHistory);

        // Act
        List<AuditTrail> result = auditService.getEntityHistory("BATCH", 1L);

        // Assert
        assertEquals(2, result.size());
        assertEquals(2L, result.get(0).getAuditId());
    }

    @Test
    @DisplayName("Should return recent activity with limit")
    void getRecentActivity_ReturnsLimitedResults() {
        // Arrange
        List<AuditTrail> mockActivity = List.of(
                AuditTrail.builder().auditId(1L).action("CREATE").build()
        );
        when(auditTrailRepository.findRecentAuditEntries(PageRequest.of(0, 5))).thenReturn(mockActivity);

        // Act
        List<AuditTrail> result = auditService.getRecentActivity(5);

        // Assert
        assertEquals(1, result.size());
        verify(auditTrailRepository).findRecentAuditEntries(PageRequest.of(0, 5));
    }

    @Test
    @DisplayName("Should count today's activity")
    void countTodaysActivity_ReturnsCount() {
        // Arrange
        when(auditTrailRepository.countTodaysEntries(any(LocalDateTime.class))).thenReturn(15L);

        // Act
        long result = auditService.countTodaysActivity();

        // Assert
        assertEquals(15L, result);
    }

    @Test
    @DisplayName("Should use SYSTEM user when no authentication context")
    void logCreate_NoAuthContext_UsesSystemUser() {
        // Arrange
        SecurityContextHolder.clearContext();
        when(auditTrailRepository.save(any(AuditTrail.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        auditService.logCreate("BATCH", 1L, "System action");

        // Assert
        ArgumentCaptor<AuditTrail> captor = ArgumentCaptor.forClass(AuditTrail.class);
        verify(auditTrailRepository).save(captor.capture());

        AuditTrail captured = captor.getValue();
        assertEquals("SYSTEM", captured.getChangedBy());
    }

    @Test
    @DisplayName("Should handle repository exception gracefully")
    void logCreate_RepositoryException_LogsError() {
        // Arrange
        when(auditTrailRepository.save(any(AuditTrail.class))).thenThrow(new RuntimeException("DB error"));

        // Act - should not throw
        assertDoesNotThrow(() -> auditService.logCreate("BATCH", 1L, "Test"));
    }
}
