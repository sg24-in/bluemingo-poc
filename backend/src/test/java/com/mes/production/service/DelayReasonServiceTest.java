package com.mes.production.service;

import com.mes.production.dto.DelayReasonDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.entity.DelayReason;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.DelayReasonRepository;
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
class DelayReasonServiceTest {

    @Mock
    private DelayReasonRepository delayReasonRepository;

    @Mock
    private AuditTrailRepository auditTrailRepository;

    @InjectMocks
    private DelayReasonService delayReasonService;

    private DelayReason testReason;
    private DelayReasonDTO testReasonDTO;

    @BeforeEach
    void setUp() {
        testReason = DelayReason.builder()
                .reasonId(1L)
                .reasonCode("MATERIAL_SHORTAGE")
                .reasonDescription("Material shortage delay")
                .status(DelayReason.STATUS_ACTIVE)
                .build();

        testReasonDTO = DelayReasonDTO.builder()
                .reasonCode("MATERIAL_SHORTAGE")
                .reasonDescription("Material shortage delay")
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
    @DisplayName("Get Delay Reasons Tests")
    class GetDelayReasonsTests {

        @Test
        @DisplayName("Should get all delay reasons")
        void getAllDelayReasons_ReturnsAll() {
            when(delayReasonRepository.findAll()).thenReturn(List.of(testReason));

            List<DelayReasonDTO> result = delayReasonService.getAllDelayReasons();

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("MATERIAL_SHORTAGE", result.get(0).getReasonCode());
        }

        @Test
        @DisplayName("Should get active delay reasons")
        void getActiveDelayReasons_ReturnsActiveOnly() {
            when(delayReasonRepository.findAllActive()).thenReturn(List.of(testReason));

            List<DelayReasonDTO> result = delayReasonService.getActiveDelayReasons();

            assertNotNull(result);
            assertEquals(1, result.size());
            verify(delayReasonRepository).findAllActive();
        }

        @Test
        @DisplayName("Should get delay reason by ID")
        void getDelayReasonById_ExistingId_ReturnsReason() {
            when(delayReasonRepository.findById(1L)).thenReturn(Optional.of(testReason));

            DelayReasonDTO result = delayReasonService.getDelayReasonById(1L);

            assertNotNull(result);
            assertEquals("MATERIAL_SHORTAGE", result.getReasonCode());
        }

        @Test
        @DisplayName("Should throw exception when delay reason not found")
        void getDelayReasonById_NotFound_ThrowsException() {
            when(delayReasonRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> delayReasonService.getDelayReasonById(999L));

            assertTrue(exception.getMessage().contains("not found"));
        }
    }

    @Nested
    @DisplayName("Pagination Tests")
    class PaginationTests {

        @Test
        @DisplayName("Should get delay reasons with pagination")
        void getDelayReasonsPaged_ReturnsPagedResponse() {
            Page<DelayReason> page = new PageImpl<>(List.of(testReason));
            when(delayReasonRepository.findByFilters(anyString(), anyString(), any(Pageable.class)))
                    .thenReturn(page);

            PageRequestDTO request = PageRequestDTO.builder()
                    .page(0).size(20).search("").status("ACTIVE").build();

            PagedResponseDTO<DelayReasonDTO> result = delayReasonService.getDelayReasonsPaged(request);

            assertNotNull(result);
            assertEquals(1, result.getContent().size());
            assertEquals(0, result.getPage());
            assertTrue(result.isFirst());
        }
    }

    @Nested
    @DisplayName("Create Delay Reason Tests")
    class CreateDelayReasonTests {

        @Test
        @DisplayName("Should create delay reason successfully")
        void createDelayReason_ValidData_CreatesSuccessfully() {
            setupSecurityContext();
            when(delayReasonRepository.existsByReasonCode("MATERIAL_SHORTAGE")).thenReturn(false);
            when(delayReasonRepository.save(any(DelayReason.class))).thenAnswer(i -> {
                DelayReason r = i.getArgument(0);
                r.setReasonId(1L);
                return r;
            });

            DelayReasonDTO result = delayReasonService.createDelayReason(testReasonDTO);

            assertNotNull(result);
            assertEquals("MATERIAL_SHORTAGE", result.getReasonCode());
            verify(delayReasonRepository).save(any(DelayReason.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception for duplicate reason code")
        void createDelayReason_DuplicateCode_ThrowsException() {
            setupSecurityContext();
            when(delayReasonRepository.existsByReasonCode("MATERIAL_SHORTAGE")).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> delayReasonService.createDelayReason(testReasonDTO));

            assertTrue(exception.getMessage().contains("already exists"));
            verify(delayReasonRepository, never()).save(any(DelayReason.class));
        }
    }

    @Nested
    @DisplayName("Update Delay Reason Tests")
    class UpdateDelayReasonTests {

        @Test
        @DisplayName("Should update delay reason successfully")
        void updateDelayReason_ValidData_UpdatesSuccessfully() {
            setupSecurityContext();
            when(delayReasonRepository.findById(1L)).thenReturn(Optional.of(testReason));
            when(delayReasonRepository.save(any(DelayReason.class))).thenAnswer(i -> i.getArgument(0));

            testReasonDTO.setReasonDescription("Updated description");

            DelayReasonDTO result = delayReasonService.updateDelayReason(1L, testReasonDTO);

            assertNotNull(result);
            assertEquals("Updated description", result.getReasonDescription());
            verify(delayReasonRepository).save(any(DelayReason.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception when updating non-existent reason")
        void updateDelayReason_NotFound_ThrowsException() {
            setupSecurityContext();
            when(delayReasonRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> delayReasonService.updateDelayReason(999L, testReasonDTO));

            assertTrue(exception.getMessage().contains("not found"));
        }

        @Test
        @DisplayName("Should throw exception when changing to duplicate code")
        void updateDelayReason_DuplicateCode_ThrowsException() {
            setupSecurityContext();
            when(delayReasonRepository.findById(1L)).thenReturn(Optional.of(testReason));

            testReasonDTO.setReasonCode("EXISTING_CODE");
            when(delayReasonRepository.existsByReasonCode("EXISTING_CODE")).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> delayReasonService.updateDelayReason(1L, testReasonDTO));

            assertTrue(exception.getMessage().contains("already exists"));
        }
    }

    @Nested
    @DisplayName("Delete Delay Reason Tests")
    class DeleteDelayReasonTests {

        @Test
        @DisplayName("Should soft delete delay reason successfully")
        void deleteDelayReason_ExistingReason_SoftDeletes() {
            setupSecurityContext();
            when(delayReasonRepository.findById(1L)).thenReturn(Optional.of(testReason));
            when(delayReasonRepository.save(any(DelayReason.class))).thenAnswer(i -> i.getArgument(0));

            delayReasonService.deleteDelayReason(1L);

            verify(delayReasonRepository).save(argThat(reason ->
                    DelayReason.STATUS_INACTIVE.equals(reason.getStatus())
            ));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception when deleting non-existent reason")
        void deleteDelayReason_NotFound_ThrowsException() {
            setupSecurityContext();
            when(delayReasonRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> delayReasonService.deleteDelayReason(999L));

            assertTrue(exception.getMessage().contains("not found"));
        }
    }
}
