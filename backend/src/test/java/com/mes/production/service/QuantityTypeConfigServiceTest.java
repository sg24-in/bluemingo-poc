package com.mes.production.service;

import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.dto.QuantityTypeConfigDTO;
import com.mes.production.entity.QuantityTypeConfig;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.QuantityTypeConfigRepository;
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
class QuantityTypeConfigServiceTest {

    @Mock
    private QuantityTypeConfigRepository repository;

    @Mock
    private AuditTrailRepository auditTrailRepository;

    @InjectMocks
    private QuantityTypeConfigService service;

    private QuantityTypeConfig testConfig;
    private QuantityTypeConfigDTO testConfigDTO;

    @BeforeEach
    void setUp() {
        testConfig = QuantityTypeConfig.builder()
                .configId(1L)
                .configName("FURNACE_WEIGHT")
                .operationType("FURNACE")
                .quantityType("DECIMAL")
                .decimalPrecision(2)
                .roundingRule("HALF_UP")
                .unit("MT")
                .minQuantity(BigDecimal.ZERO)
                .maxQuantity(new BigDecimal("5000.0000"))
                .status(QuantityTypeConfig.STATUS_ACTIVE)
                .build();

        testConfigDTO = QuantityTypeConfigDTO.builder()
                .configName("FURNACE_WEIGHT")
                .operationType("FURNACE")
                .quantityType("DECIMAL")
                .decimalPrecision(2)
                .roundingRule("HALF_UP")
                .unit("MT")
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

            List<QuantityTypeConfigDTO> result = service.getAllConfigs();

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("FURNACE_WEIGHT", result.get(0).getConfigName());
            assertEquals("DECIMAL", result.get(0).getQuantityType());
        }

        @Test
        @DisplayName("Should get active configs")
        void getActiveConfigs_ReturnsActive() {
            when(repository.findAllActive()).thenReturn(List.of(testConfig));

            List<QuantityTypeConfigDTO> result = service.getActiveConfigs();

            assertNotNull(result);
            assertEquals(1, result.size());
            verify(repository).findAllActive();
        }

        @Test
        @DisplayName("Should get config by ID")
        void getConfigById_ExistingId_ReturnsConfig() {
            when(repository.findById(1L)).thenReturn(Optional.of(testConfig));

            QuantityTypeConfigDTO result = service.getConfigById(1L);

            assertNotNull(result);
            assertEquals("FURNACE_WEIGHT", result.getConfigName());
            assertEquals(2, result.getDecimalPrecision());
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
            Page<QuantityTypeConfig> page = new PageImpl<>(List.of(testConfig));
            when(repository.findByFilters(anyString(), anyString(), any(Pageable.class)))
                    .thenReturn(page);

            PageRequestDTO request = PageRequestDTO.builder()
                    .page(0).size(20).search("").status("ACTIVE").build();

            PagedResponseDTO<QuantityTypeConfigDTO> result = service.getConfigsPaged(request);

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
            when(repository.existsByConfigName("FURNACE_WEIGHT")).thenReturn(false);
            when(repository.save(any(QuantityTypeConfig.class))).thenAnswer(i -> {
                QuantityTypeConfig c = i.getArgument(0);
                c.setConfigId(1L);
                return c;
            });

            QuantityTypeConfigDTO result = service.createConfig(testConfigDTO);

            assertNotNull(result);
            assertEquals("FURNACE_WEIGHT", result.getConfigName());
            verify(repository).save(any(QuantityTypeConfig.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception for duplicate config name")
        void createConfig_DuplicateName_ThrowsException() {
            setupSecurityContext();
            when(repository.existsByConfigName("FURNACE_WEIGHT")).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> service.createConfig(testConfigDTO));

            assertTrue(exception.getMessage().contains("already exists"));
            verify(repository, never()).save(any(QuantityTypeConfig.class));
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
            when(repository.save(any(QuantityTypeConfig.class))).thenAnswer(i -> i.getArgument(0));

            testConfigDTO.setDecimalPrecision(4);

            QuantityTypeConfigDTO result = service.updateConfig(1L, testConfigDTO);

            assertNotNull(result);
            assertEquals(4, result.getDecimalPrecision());
            verify(repository).save(any(QuantityTypeConfig.class));
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
            when(repository.save(any(QuantityTypeConfig.class))).thenAnswer(i -> i.getArgument(0));

            service.deleteConfig(1L);

            verify(repository).save(argThat(config ->
                    QuantityTypeConfig.STATUS_INACTIVE.equals(config.getStatus())
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
