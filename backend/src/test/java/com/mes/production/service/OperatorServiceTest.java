package com.mes.production.service;

import com.mes.production.dto.OperatorDTO;
import com.mes.production.entity.Operator;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.OperatorRepository;
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

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OperatorServiceTest {

    @Mock
    private OperatorRepository operatorRepository;

    @Mock
    private AuditTrailRepository auditTrailRepository;

    @InjectMocks
    private OperatorService operatorService;

    private Operator testOperator;

    @BeforeEach
    void setUp() {
        testOperator = Operator.builder()
                .operatorId(1L)
                .operatorCode("OP-001")
                .name("John Smith")
                .department("Production")
                .shift("DAY")
                .status("ACTIVE")
                .build();
    }

    private void setupSecurityContext() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("admin@mes.com");
        SecurityContextHolder.setContext(securityContext);
    }

    @Nested
    @DisplayName("Get Operators Tests")
    class GetOperatorsTests {

        @Test
        @DisplayName("Should get all operators")
        void getAllOperators_ReturnsAll() {
            when(operatorRepository.findAll()).thenReturn(List.of(testOperator));

            List<OperatorDTO> result = operatorService.getAllOperators();

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("OP-001", result.get(0).getOperatorCode());
        }

        @Test
        @DisplayName("Should get active operators")
        void getActiveOperators_ReturnsActive() {
            when(operatorRepository.findByStatus("ACTIVE")).thenReturn(List.of(testOperator));

            List<OperatorDTO> result = operatorService.getActiveOperators();

            assertEquals(1, result.size());
            assertEquals("ACTIVE", result.get(0).getStatus());
        }

        @Test
        @DisplayName("Should get operator by ID")
        void getOperatorById_ExistingId_ReturnsOperator() {
            when(operatorRepository.findById(1L)).thenReturn(Optional.of(testOperator));

            OperatorDTO result = operatorService.getOperatorById(1L);

            assertNotNull(result);
            assertEquals("OP-001", result.getOperatorCode());
            assertEquals("John Smith", result.getName());
        }

        @Test
        @DisplayName("Should throw exception when operator not found")
        void getOperatorById_NotFound_ThrowsException() {
            when(operatorRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> operatorService.getOperatorById(999L));

            assertTrue(exception.getMessage().contains("not found"));
        }
    }

    @Nested
    @DisplayName("Create Operator Tests")
    class CreateOperatorTests {

        @Test
        @DisplayName("Should create operator successfully")
        void createOperator_ValidData_Creates() {
            setupSecurityContext();
            OperatorDTO dto = OperatorDTO.builder()
                    .operatorCode("OP-002")
                    .name("Jane Doe")
                    .department("Quality")
                    .shift("NIGHT")
                    .build();

            when(operatorRepository.existsByOperatorCode("OP-002")).thenReturn(false);
            when(operatorRepository.save(any(Operator.class))).thenAnswer(i -> {
                Operator saved = i.getArgument(0);
                saved.setOperatorId(2L);
                return saved;
            });

            OperatorDTO result = operatorService.createOperator(dto);

            assertNotNull(result);
            assertEquals("OP-002", result.getOperatorCode());
            assertEquals("Jane Doe", result.getName());
            verify(operatorRepository).save(any(Operator.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception for duplicate operator code")
        void createOperator_DuplicateCode_ThrowsException() {
            OperatorDTO dto = OperatorDTO.builder()
                    .operatorCode("OP-001")
                    .name("Duplicate")
                    .build();

            when(operatorRepository.existsByOperatorCode("OP-001")).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> operatorService.createOperator(dto));

            assertTrue(exception.getMessage().contains("already exists"));
            verify(operatorRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Update Operator Tests")
    class UpdateOperatorTests {

        @Test
        @DisplayName("Should update operator successfully")
        void updateOperator_ValidData_Updates() {
            setupSecurityContext();
            OperatorDTO dto = OperatorDTO.builder()
                    .operatorCode("OP-001")
                    .name("John Smith Updated")
                    .department("Quality")
                    .shift("NIGHT")
                    .build();

            when(operatorRepository.findById(1L)).thenReturn(Optional.of(testOperator));
            when(operatorRepository.save(any(Operator.class))).thenAnswer(i -> i.getArgument(0));

            OperatorDTO result = operatorService.updateOperator(1L, dto);

            assertNotNull(result);
            assertEquals("John Smith Updated", result.getName());
            assertEquals("Quality", result.getDepartment());
            verify(operatorRepository).save(any(Operator.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception for non-existent operator")
        void updateOperator_NotFound_ThrowsException() {
            OperatorDTO dto = OperatorDTO.builder()
                    .operatorCode("OP-999")
                    .name("Not Found")
                    .build();

            when(operatorRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> operatorService.updateOperator(999L, dto));
        }

        @Test
        @DisplayName("Should throw exception for duplicate code on update")
        void updateOperator_DuplicateCode_ThrowsException() {
            OperatorDTO dto = OperatorDTO.builder()
                    .operatorCode("OP-002")
                    .name("Changed Code")
                    .build();

            when(operatorRepository.findById(1L)).thenReturn(Optional.of(testOperator));
            when(operatorRepository.existsByOperatorCode("OP-002")).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> operatorService.updateOperator(1L, dto));

            assertTrue(exception.getMessage().contains("already exists"));
        }
    }

    @Nested
    @DisplayName("Delete Operator Tests")
    class DeleteOperatorTests {

        @Test
        @DisplayName("Should delete operator successfully (soft delete)")
        void deleteOperator_ValidId_SoftDeletes() {
            setupSecurityContext();
            when(operatorRepository.findById(1L)).thenReturn(Optional.of(testOperator));
            when(operatorRepository.save(any(Operator.class))).thenAnswer(i -> i.getArgument(0));

            operatorService.deleteOperator(1L);

            assertEquals("INACTIVE", testOperator.getStatus());
            verify(operatorRepository).save(any(Operator.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception when operator not found for delete")
        void deleteOperator_NotFound_ThrowsException() {
            when(operatorRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> operatorService.deleteOperator(999L));
        }
    }
}
