package com.mes.production.service;

import com.mes.production.dto.HoldReasonDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.entity.HoldReason;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.HoldReasonRepository;
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
class HoldReasonServiceTest {

    @Mock
    private HoldReasonRepository holdReasonRepository;

    @Mock
    private AuditTrailRepository auditTrailRepository;

    @InjectMocks
    private HoldReasonService holdReasonService;

    private HoldReason testReason;
    private HoldReasonDTO testReasonDTO;

    @BeforeEach
    void setUp() {
        testReason = HoldReason.builder()
                .reasonId(1L)
                .reasonCode("QUALITY_HOLD")
                .reasonDescription("Quality inspection required")
                .applicableTo("BATCH,INVENTORY")
                .status(HoldReason.STATUS_ACTIVE)
                .build();

        testReasonDTO = HoldReasonDTO.builder()
                .reasonCode("QUALITY_HOLD")
                .reasonDescription("Quality inspection required")
                .applicableTo("BATCH,INVENTORY")
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
    @DisplayName("Get Hold Reasons Tests")
    class GetHoldReasonsTests {

        @Test
        @DisplayName("Should get all hold reasons")
        void getAllHoldReasons_ReturnsAll() {
            when(holdReasonRepository.findAll()).thenReturn(List.of(testReason));

            List<HoldReasonDTO> result = holdReasonService.getAllHoldReasons();

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("QUALITY_HOLD", result.get(0).getReasonCode());
        }

        @Test
        @DisplayName("Should get active hold reasons")
        void getActiveHoldReasons_ReturnsActiveOnly() {
            when(holdReasonRepository.findAllActive()).thenReturn(List.of(testReason));

            List<HoldReasonDTO> result = holdReasonService.getActiveHoldReasons();

            assertNotNull(result);
            assertEquals(1, result.size());
            verify(holdReasonRepository).findAllActive();
        }

        @Test
        @DisplayName("Should get active hold reasons by applicable to")
        void getActiveByApplicableTo_ReturnsFiltered() {
            when(holdReasonRepository.findActiveByApplicableTo("BATCH")).thenReturn(List.of(testReason));

            List<HoldReasonDTO> result = holdReasonService.getActiveByApplicableTo("BATCH");

            assertNotNull(result);
            assertEquals(1, result.size());
            verify(holdReasonRepository).findActiveByApplicableTo("BATCH");
        }

        @Test
        @DisplayName("Should get hold reason by ID")
        void getHoldReasonById_ExistingId_ReturnsReason() {
            when(holdReasonRepository.findById(1L)).thenReturn(Optional.of(testReason));

            HoldReasonDTO result = holdReasonService.getHoldReasonById(1L);

            assertNotNull(result);
            assertEquals("QUALITY_HOLD", result.getReasonCode());
            assertEquals("Quality inspection required", result.getReasonDescription());
        }

        @Test
        @DisplayName("Should throw exception when hold reason not found")
        void getHoldReasonById_NotFound_ThrowsException() {
            when(holdReasonRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> holdReasonService.getHoldReasonById(999L));

            assertTrue(exception.getMessage().contains("not found"));
        }
    }

    @Nested
    @DisplayName("Pagination Tests")
    class PaginationTests {

        @Test
        @DisplayName("Should get hold reasons with pagination")
        void getHoldReasonsPaged_ReturnsPagedResponse() {
            Page<HoldReason> page = new PageImpl<>(List.of(testReason));
            when(holdReasonRepository.findByFilters(anyString(), anyString(), any(Pageable.class)))
                    .thenReturn(page);

            PageRequestDTO request = PageRequestDTO.builder()
                    .page(0).size(20).search("").status("ACTIVE").build();

            PagedResponseDTO<HoldReasonDTO> result = holdReasonService.getHoldReasonsPaged(request);

            assertNotNull(result);
            assertEquals(1, result.getContent().size());
            assertEquals(0, result.getPage());
            assertTrue(result.isFirst());
            assertTrue(result.isLast());
        }
    }

    @Nested
    @DisplayName("Create Hold Reason Tests")
    class CreateHoldReasonTests {

        @Test
        @DisplayName("Should create hold reason successfully")
        void createHoldReason_ValidData_CreatesSuccessfully() {
            setupSecurityContext();
            when(holdReasonRepository.existsByReasonCode("QUALITY_HOLD")).thenReturn(false);
            when(holdReasonRepository.save(any(HoldReason.class))).thenAnswer(i -> {
                HoldReason r = i.getArgument(0);
                r.setReasonId(1L);
                return r;
            });

            HoldReasonDTO result = holdReasonService.createHoldReason(testReasonDTO);

            assertNotNull(result);
            assertEquals("QUALITY_HOLD", result.getReasonCode());
            verify(holdReasonRepository).save(any(HoldReason.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception for duplicate reason code")
        void createHoldReason_DuplicateCode_ThrowsException() {
            setupSecurityContext();
            when(holdReasonRepository.existsByReasonCode("QUALITY_HOLD")).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> holdReasonService.createHoldReason(testReasonDTO));

            assertTrue(exception.getMessage().contains("already exists"));
            verify(holdReasonRepository, never()).save(any(HoldReason.class));
        }
    }

    @Nested
    @DisplayName("Update Hold Reason Tests")
    class UpdateHoldReasonTests {

        @Test
        @DisplayName("Should update hold reason successfully")
        void updateHoldReason_ValidData_UpdatesSuccessfully() {
            setupSecurityContext();
            when(holdReasonRepository.findById(1L)).thenReturn(Optional.of(testReason));
            when(holdReasonRepository.save(any(HoldReason.class))).thenAnswer(i -> i.getArgument(0));

            testReasonDTO.setReasonDescription("Updated description");

            HoldReasonDTO result = holdReasonService.updateHoldReason(1L, testReasonDTO);

            assertNotNull(result);
            assertEquals("Updated description", result.getReasonDescription());
            verify(holdReasonRepository).save(any(HoldReason.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception when updating non-existent reason")
        void updateHoldReason_NotFound_ThrowsException() {
            setupSecurityContext();
            when(holdReasonRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> holdReasonService.updateHoldReason(999L, testReasonDTO));

            assertTrue(exception.getMessage().contains("not found"));
        }

        @Test
        @DisplayName("Should throw exception when changing to duplicate code")
        void updateHoldReason_DuplicateCode_ThrowsException() {
            setupSecurityContext();
            when(holdReasonRepository.findById(1L)).thenReturn(Optional.of(testReason));

            testReasonDTO.setReasonCode("EXISTING_CODE");
            when(holdReasonRepository.existsByReasonCode("EXISTING_CODE")).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> holdReasonService.updateHoldReason(1L, testReasonDTO));

            assertTrue(exception.getMessage().contains("already exists"));
        }
    }

    @Nested
    @DisplayName("Delete Hold Reason Tests")
    class DeleteHoldReasonTests {

        @Test
        @DisplayName("Should soft delete hold reason successfully")
        void deleteHoldReason_ExistingReason_SoftDeletes() {
            setupSecurityContext();
            when(holdReasonRepository.findById(1L)).thenReturn(Optional.of(testReason));
            when(holdReasonRepository.save(any(HoldReason.class))).thenAnswer(i -> i.getArgument(0));

            holdReasonService.deleteHoldReason(1L);

            verify(holdReasonRepository).save(argThat(reason ->
                    HoldReason.STATUS_INACTIVE.equals(reason.getStatus())
            ));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception when deleting non-existent reason")
        void deleteHoldReason_NotFound_ThrowsException() {
            setupSecurityContext();
            when(holdReasonRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> holdReasonService.deleteHoldReason(999L));

            assertTrue(exception.getMessage().contains("not found"));
        }
    }
}
