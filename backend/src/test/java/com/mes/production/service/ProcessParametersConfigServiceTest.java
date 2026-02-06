package com.mes.production.service;

import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.dto.ProcessParametersConfigDTO;
import com.mes.production.entity.ProcessParametersConfig;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.ProcessParametersConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ProcessParametersConfigServiceTest {

    @Mock
    private ProcessParametersConfigRepository repository;

    @Mock
    private AuditTrailRepository auditTrailRepository;

    @InjectMocks
    private ProcessParametersConfigService service;

    private ProcessParametersConfig testConfig;
    private ProcessParametersConfigDTO testConfigDTO;

    @BeforeEach
    void setUp() {
        testConfig = ProcessParametersConfig.builder()
                .configId(1L)
                .operationType("ROLLING")
                .productSku("STEEL-001")
                .parameterName("Temperature")
                .parameterType("DECIMAL")
                .unit("C")
                .minValue(new BigDecimal("800.0000"))
                .maxValue(new BigDecimal("1200.0000"))
                .defaultValue(new BigDecimal("1000.0000"))
                .isRequired(true)
                .displayOrder(1)
                .status(ProcessParametersConfig.STATUS_ACTIVE)
                .build();

        testConfigDTO = ProcessParametersConfigDTO.builder()
                .operationType("ROLLING")
                .productSku("STEEL-001")
                .parameterName("Temperature")
                .parameterType("DECIMAL")
                .unit("C")
                .minValue(new BigDecimal("800.0000"))
                .maxValue(new BigDecimal("1200.0000"))
                .defaultValue(new BigDecimal("1000.0000"))
                .isRequired(true)
                .displayOrder(1)
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
    @DisplayName("Get Configs Tests")
    class GetConfigsTests {

        @Test
        @DisplayName("Should get all configs")
        void getAllConfigs_ReturnsAll() {
            when(repository.findAll()).thenReturn(List.of(testConfig));

            List<ProcessParametersConfigDTO> result = service.getAllConfigs();

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("ROLLING", result.get(0).getOperationType());
            assertEquals("Temperature", result.get(0).getParameterName());
        }

        @Test
        @DisplayName("Should get active configs")
        void getActiveConfigs_ReturnsActive() {
            when(repository.findAllActive()).thenReturn(List.of(testConfig));

            List<ProcessParametersConfigDTO> result = service.getActiveConfigs();

            assertNotNull(result);
            assertEquals(1, result.size());
            verify(repository).findAllActive();
        }

        @Test
        @DisplayName("Should get active configs by operation and product")
        void getActiveByOperationAndProduct_ReturnsFiltered() {
            when(repository.findActiveByOperationTypeAndProduct("ROLLING", "STEEL-001"))
                    .thenReturn(List.of(testConfig));

            List<ProcessParametersConfigDTO> result = service.getActiveByOperationAndProduct("ROLLING", "STEEL-001");

            assertNotNull(result);
            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should get config by ID")
        void getConfigById_ExistingId_ReturnsConfig() {
            when(repository.findById(1L)).thenReturn(Optional.of(testConfig));

            ProcessParametersConfigDTO result = service.getConfigById(1L);

            assertNotNull(result);
            assertEquals("Temperature", result.getParameterName());
        }

        @Test
        @DisplayName("Should throw exception when config not found")
        void getConfigById_NotFound_ThrowsException() {
            when(repository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> service.getConfigById(999L));

            assertTrue(exception.getMessage().contains("not found"));
        }
    }

    @Nested
    @DisplayName("Pagination Tests")
    class PaginationTests {

        @Test
        @DisplayName("Should get configs with pagination")
        void getConfigsPaged_ReturnsPagedResponse() {
            Page<ProcessParametersConfig> page = new PageImpl<>(List.of(testConfig));
            when(repository.findByFilters(anyString(), anyString(), any(Pageable.class)))
                    .thenReturn(page);

            PageRequestDTO request = PageRequestDTO.builder()
                    .page(0).size(20).search("").status("ACTIVE").build();

            PagedResponseDTO<ProcessParametersConfigDTO> result = service.getConfigsPaged(request);

            assertNotNull(result);
            assertEquals(1, result.getContent().size());
        }
    }

    @Nested
    @DisplayName("Create Config Tests")
    class CreateConfigTests {

        @Test
        @DisplayName("Should create config successfully")
        void createConfig_ValidData_CreatesSuccessfully() {
            setupSecurityContext();
            when(repository.save(any(ProcessParametersConfig.class))).thenAnswer(i -> {
                ProcessParametersConfig c = i.getArgument(0);
                c.setConfigId(1L);
                return c;
            });

            ProcessParametersConfigDTO result = service.createConfig(testConfigDTO);

            assertNotNull(result);
            assertEquals("ROLLING", result.getOperationType());
            verify(repository).save(any(ProcessParametersConfig.class));
            verify(auditTrailRepository).save(any());
        }
    }

    @Nested
    @DisplayName("Update Config Tests")
    class UpdateConfigTests {

        @Test
        @DisplayName("Should update config successfully")
        void updateConfig_ValidData_UpdatesSuccessfully() {
            setupSecurityContext();
            when(repository.findById(1L)).thenReturn(Optional.of(testConfig));
            when(repository.save(any(ProcessParametersConfig.class))).thenAnswer(i -> i.getArgument(0));

            testConfigDTO.setMaxValue(new BigDecimal("1500.0000"));

            ProcessParametersConfigDTO result = service.updateConfig(1L, testConfigDTO);

            assertNotNull(result);
            assertEquals(new BigDecimal("1500.0000"), result.getMaxValue());
            verify(repository).save(any(ProcessParametersConfig.class));
        }

        @Test
        @DisplayName("Should throw exception when updating non-existent config")
        void updateConfig_NotFound_ThrowsException() {
            setupSecurityContext();
            when(repository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> service.updateConfig(999L, testConfigDTO));

            assertTrue(exception.getMessage().contains("not found"));
        }
    }

    @Nested
    @DisplayName("Delete Config Tests")
    class DeleteConfigTests {

        @Test
        @DisplayName("Should soft delete config")
        void deleteConfig_ExistingConfig_SoftDeletes() {
            setupSecurityContext();
            when(repository.findById(1L)).thenReturn(Optional.of(testConfig));
            when(repository.save(any(ProcessParametersConfig.class))).thenAnswer(i -> i.getArgument(0));

            service.deleteConfig(1L);

            verify(repository).save(argThat(config ->
                    ProcessParametersConfig.STATUS_INACTIVE.equals(config.getStatus())
            ));
        }

        @Test
        @DisplayName("Should throw exception when deleting non-existent config")
        void deleteConfig_NotFound_ThrowsException() {
            setupSecurityContext();
            when(repository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> service.deleteConfig(999L));

            assertTrue(exception.getMessage().contains("not found"));
        }
    }
}
