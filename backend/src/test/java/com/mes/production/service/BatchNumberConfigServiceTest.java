package com.mes.production.service;

import com.mes.production.dto.BatchNumberConfigDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.entity.BatchNumberConfig;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.BatchNumberConfigRepository;
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

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BatchNumberConfigServiceTest {

    @Mock
    private BatchNumberConfigRepository repository;

    @Mock
    private AuditTrailRepository auditTrailRepository;

    @InjectMocks
    private BatchNumberConfigService service;

    private BatchNumberConfig testConfig;
    private BatchNumberConfigDTO testConfigDTO;

    @BeforeEach
    void setUp() {
        testConfig = BatchNumberConfig.builder()
                .configId(1L)
                .configName("FURNACE_OPERATION")
                .operationType("FURNACE")
                .prefix("FUR")
                .includeOperationCode(true)
                .operationCodeLength(2)
                .separator("-")
                .dateFormat("yyyyMMdd")
                .includeDate(true)
                .sequenceLength(3)
                .sequenceReset("DAILY")
                .priority(100)
                .status(BatchNumberConfig.STATUS_ACTIVE)
                .build();

        testConfigDTO = BatchNumberConfigDTO.builder()
                .configName("FURNACE_OPERATION")
                .operationType("FURNACE")
                .prefix("FUR")
                .includeOperationCode(true)
                .operationCodeLength(2)
                .separator("-")
                .dateFormat("yyyyMMdd")
                .includeDate(true)
                .sequenceLength(3)
                .sequenceReset("DAILY")
                .priority(100)
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

            List<BatchNumberConfigDTO> result = service.getAllConfigs();

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("FURNACE_OPERATION", result.get(0).getConfigName());
        }

        @Test
        @DisplayName("Should get active configs")
        void getActiveConfigs_ReturnsActive() {
            when(repository.findAllActive()).thenReturn(List.of(testConfig));

            List<BatchNumberConfigDTO> result = service.getActiveConfigs();

            assertNotNull(result);
            assertEquals(1, result.size());
            verify(repository).findAllActive();
        }

        @Test
        @DisplayName("Should get config by ID")
        void getConfigById_ExistingId_ReturnsConfig() {
            when(repository.findById(1L)).thenReturn(Optional.of(testConfig));

            BatchNumberConfigDTO result = service.getConfigById(1L);

            assertNotNull(result);
            assertEquals("FURNACE_OPERATION", result.getConfigName());
            assertEquals("FUR", result.getPrefix());
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
            Page<BatchNumberConfig> page = new PageImpl<>(List.of(testConfig));
            when(repository.findByFilters(anyString(), anyString(), any(Pageable.class)))
                    .thenReturn(page);

            PageRequestDTO request = PageRequestDTO.builder()
                    .page(0).size(20).search("").status("ACTIVE").build();

            PagedResponseDTO<BatchNumberConfigDTO> result = service.getConfigsPaged(request);

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
            when(repository.existsByConfigName("FURNACE_OPERATION")).thenReturn(false);
            when(repository.save(any(BatchNumberConfig.class))).thenAnswer(i -> {
                BatchNumberConfig c = i.getArgument(0);
                c.setConfigId(1L);
                return c;
            });

            BatchNumberConfigDTO result = service.createConfig(testConfigDTO);

            assertNotNull(result);
            assertEquals("FURNACE_OPERATION", result.getConfigName());
            verify(repository).save(any(BatchNumberConfig.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception for duplicate config name")
        void createConfig_DuplicateName_ThrowsException() {
            setupSecurityContext();
            when(repository.existsByConfigName("FURNACE_OPERATION")).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> service.createConfig(testConfigDTO));

            assertTrue(exception.getMessage().contains("already exists"));
            verify(repository, never()).save(any(BatchNumberConfig.class));
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
            when(repository.save(any(BatchNumberConfig.class))).thenAnswer(i -> i.getArgument(0));

            testConfigDTO.setPrefix("FRN");

            BatchNumberConfigDTO result = service.updateConfig(1L, testConfigDTO);

            assertNotNull(result);
            assertEquals("FRN", result.getPrefix());
            verify(repository).save(any(BatchNumberConfig.class));
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

        @Test
        @DisplayName("Should throw exception when changing to duplicate name")
        void updateConfig_DuplicateName_ThrowsException() {
            setupSecurityContext();
            when(repository.findById(1L)).thenReturn(Optional.of(testConfig));

            testConfigDTO.setConfigName("EXISTING_CONFIG");
            when(repository.existsByConfigName("EXISTING_CONFIG")).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> service.updateConfig(1L, testConfigDTO));

            assertTrue(exception.getMessage().contains("already exists"));
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
            when(repository.save(any(BatchNumberConfig.class))).thenAnswer(i -> i.getArgument(0));

            service.deleteConfig(1L);

            verify(repository).save(argThat(config ->
                    BatchNumberConfig.STATUS_INACTIVE.equals(config.getStatus())
            ));
            verify(auditTrailRepository).save(any());
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
