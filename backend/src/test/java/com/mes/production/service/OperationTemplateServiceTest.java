package com.mes.production.service;

import com.mes.production.dto.OperationTemplateDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.entity.OperationTemplate;
import com.mes.production.repository.OperationTemplateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OperationTemplateServiceTest {

    @Mock
    private OperationTemplateRepository repository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private OperationTemplateService operationTemplateService;

    private OperationTemplate testTemplate;

    @BeforeEach
    void setUp() {
        testTemplate = OperationTemplate.builder()
                .operationTemplateId(1L)
                .operationName("Furnace Melting")
                .operationCode("FURN-001")
                .operationType("FURNACE")
                .quantityType(OperationTemplate.QTY_TYPE_BATCH)
                .defaultEquipmentType("FURNACE")
                .description("Standard furnace melting operation")
                .estimatedDurationMinutes(120)
                .status(OperationTemplate.STATUS_ACTIVE)
                .createdBy("admin@mes.com")
                .build();
    }

    private void setupSecurityContext() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("admin@mes.com");
        SecurityContextHolder.setContext(securityContext);
    }

    // ========== getAll Tests ==========

    @Test
    @DisplayName("Should return all templates")
    void should_returnAllTemplates_when_getAllCalled() {
        // Arrange
        when(repository.findAll()).thenReturn(List.of(testTemplate));

        // Act
        List<OperationTemplateDTO.Response> result = operationTemplateService.getAll();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Furnace Melting", result.get(0).getOperationName());
        assertEquals("FURN-001", result.get(0).getOperationCode());
        assertEquals("FURNACE", result.get(0).getOperationType());
        verify(repository).findAll();
    }

    @Test
    @DisplayName("Should return empty list when no templates exist")
    void should_returnEmptyList_when_noTemplatesExist() {
        // Arrange
        when(repository.findAll()).thenReturn(Collections.emptyList());

        // Act
        List<OperationTemplateDTO.Response> result = operationTemplateService.getAll();

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // ========== getById Tests ==========

    @Test
    @DisplayName("Should return template when found by ID")
    void should_returnTemplate_when_foundById() {
        // Arrange
        when(repository.findById(1L)).thenReturn(Optional.of(testTemplate));

        // Act
        OperationTemplateDTO.Response result = operationTemplateService.getById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getOperationTemplateId());
        assertEquals("Furnace Melting", result.getOperationName());
        assertEquals("FURN-001", result.getOperationCode());
        assertEquals("FURNACE", result.getOperationType());
        assertEquals(OperationTemplate.QTY_TYPE_BATCH, result.getQuantityType());
        assertEquals("FURNACE", result.getDefaultEquipmentType());
        assertEquals(120, result.getEstimatedDurationMinutes());
        assertEquals(OperationTemplate.STATUS_ACTIVE, result.getStatus());
    }

    @Test
    @DisplayName("Should throw exception when template not found by ID")
    void should_throwException_when_templateNotFoundById() {
        // Arrange
        when(repository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> operationTemplateService.getById(999L));

        assertTrue(exception.getMessage().contains("not found"));
        assertTrue(exception.getMessage().contains("999"));
    }

    // ========== create Tests ==========

    @Test
    @DisplayName("Should create template successfully")
    void should_createTemplate_when_validRequest() {
        // Arrange
        setupSecurityContext();

        OperationTemplateDTO.CreateRequest request = OperationTemplateDTO.CreateRequest.builder()
                .operationName("Casting Process")
                .operationCode("CAST-001")
                .operationType("CASTER")
                .quantityType(OperationTemplate.QTY_TYPE_CONTINUOUS)
                .defaultEquipmentType("CASTER")
                .description("Standard casting process")
                .estimatedDurationMinutes(90)
                .build();

        when(repository.findByOperationCode("CAST-001")).thenReturn(Optional.empty());
        when(repository.save(any(OperationTemplate.class))).thenAnswer(invocation -> {
            OperationTemplate saved = invocation.getArgument(0);
            saved.setOperationTemplateId(2L);
            return saved;
        });

        // Act
        OperationTemplateDTO.Response result = operationTemplateService.create(request);

        // Assert
        assertNotNull(result);
        assertEquals("Casting Process", result.getOperationName());
        assertEquals("CAST-001", result.getOperationCode());
        assertEquals("CASTER", result.getOperationType());
        assertEquals(OperationTemplate.STATUS_ACTIVE, result.getStatus());
        verify(repository).save(any(OperationTemplate.class));
        verify(auditService).logCreate(eq("OPERATION_TEMPLATE"), any(), anyString());
    }

    @Test
    @DisplayName("Should throw exception when creating with duplicate operation code")
    void should_throwException_when_creatingWithDuplicateCode() {
        // Arrange
        setupSecurityContext();

        OperationTemplateDTO.CreateRequest request = OperationTemplateDTO.CreateRequest.builder()
                .operationName("Duplicate Template")
                .operationCode("FURN-001")
                .operationType("FURNACE")
                .build();

        when(repository.findByOperationCode("FURN-001")).thenReturn(Optional.of(testTemplate));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> operationTemplateService.create(request));

        assertTrue(exception.getMessage().contains("already exists"));
        verify(repository, never()).save(any(OperationTemplate.class));
    }

    // ========== update Tests ==========

    @Test
    @DisplayName("Should update template successfully")
    void should_updateTemplate_when_validRequest() {
        // Arrange
        setupSecurityContext();

        OperationTemplateDTO.UpdateRequest request = OperationTemplateDTO.UpdateRequest.builder()
                .operationName("Updated Furnace Melting")
                .description("Updated description")
                .estimatedDurationMinutes(150)
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(testTemplate));
        when(repository.save(any(OperationTemplate.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        OperationTemplateDTO.Response result = operationTemplateService.update(1L, request);

        // Assert
        assertNotNull(result);
        assertEquals("Updated Furnace Melting", result.getOperationName());
        assertEquals("Updated description", result.getDescription());
        assertEquals(150, result.getEstimatedDurationMinutes());
        verify(repository).save(any(OperationTemplate.class));
        verify(auditService).logUpdate(eq("OPERATION_TEMPLATE"), eq(1L), anyString(), any(), anyString());
    }

    @Test
    @DisplayName("Should throw exception when updating non-existent template")
    void should_throwException_when_updatingNonExistentTemplate() {
        // Arrange
        setupSecurityContext();

        OperationTemplateDTO.UpdateRequest request = OperationTemplateDTO.UpdateRequest.builder()
                .operationName("New Name")
                .build();

        when(repository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> operationTemplateService.update(999L, request));

        assertTrue(exception.getMessage().contains("not found"));
    }

    // ========== delete Tests ==========

    @Test
    @DisplayName("Should soft delete template by setting status to INACTIVE")
    void should_softDeleteTemplate_when_deleteCalledWithExistingId() {
        // Arrange
        setupSecurityContext();

        when(repository.findById(1L)).thenReturn(Optional.of(testTemplate));
        when(repository.save(any(OperationTemplate.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        operationTemplateService.delete(1L);

        // Assert
        verify(repository).save(argThat(template ->
                OperationTemplate.STATUS_INACTIVE.equals(template.getStatus())
        ));
        verify(auditService).logDelete(eq("OPERATION_TEMPLATE"), eq(1L), anyString());
    }

    @Test
    @DisplayName("Should throw exception when deleting non-existent template")
    void should_throwException_when_deletingNonExistentTemplate() {
        // Arrange
        when(repository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> operationTemplateService.delete(999L));

        assertTrue(exception.getMessage().contains("not found"));
    }

    // ========== getByType Tests ==========

    @Test
    @DisplayName("Should return templates filtered by operation type")
    void should_returnTemplates_when_filteredByType() {
        // Arrange
        when(repository.findByOperationTypeAndStatus("FURNACE", OperationTemplate.STATUS_ACTIVE))
                .thenReturn(List.of(testTemplate));

        // Act
        List<OperationTemplateDTO.Response> result = operationTemplateService.getByType("FURNACE");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("FURNACE", result.get(0).getOperationType());
        verify(repository).findByOperationTypeAndStatus("FURNACE", OperationTemplate.STATUS_ACTIVE);
    }

    // ========== getPaged Tests ==========

    @Test
    @DisplayName("Should return paginated templates with filters")
    void should_returnPagedResponse_when_getPagedCalled() {
        // Arrange
        Page<OperationTemplate> page = new PageImpl<>(List.of(testTemplate));
        when(repository.findByFilters(anyString(), anyString(), anyString(), any(Pageable.class)))
                .thenReturn(page);

        // Act
        PagedResponseDTO<OperationTemplateDTO.Response> result = operationTemplateService.getPaged(
                0, 20, "operationName", "ASC", "ACTIVE", "FURNACE", "melting");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(0, result.getPage());
        assertEquals(20, result.getSize());
        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getTotalPages());
        assertTrue(result.isFirst());
        assertTrue(result.isLast());
        assertEquals("Furnace Melting", result.getContent().get(0).getOperationName());
    }
}
