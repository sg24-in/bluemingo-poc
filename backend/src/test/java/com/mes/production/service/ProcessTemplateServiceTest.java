package com.mes.production.service;

import com.mes.production.dto.ProcessTemplateDTO;
import com.mes.production.entity.ProcessTemplate;
import com.mes.production.entity.Routing;
import com.mes.production.entity.RoutingStep;
import com.mes.production.repository.ProcessTemplateRepository;
import com.mes.production.repository.RoutingRepository;
import com.mes.production.repository.RoutingStepRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
class ProcessTemplateServiceTest {

    @Mock
    private ProcessTemplateRepository processTemplateRepository;

    @Mock
    private RoutingRepository routingRepository;

    @Mock
    private RoutingStepRepository routingStepRepository;

    @InjectMocks
    private ProcessTemplateService processTemplateService;

    private ProcessTemplate testTemplate;

    @BeforeEach
    void setUp() {
        testTemplate = ProcessTemplate.builder()
                .processTemplateId(1L)
                .templateName("Test Template")
                .templateCode("TEST-001")
                .description("Test Description")
                .productSku("PROD-001")
                .status(ProcessTemplate.STATUS_DRAFT)
                .version("V1")
                .createdOn(LocalDateTime.now())
                .createdBy("testuser")
                .build();
    }

    @Nested
    @DisplayName("Create Template Tests")
    class CreateTemplateTests {

        @Test
        @DisplayName("Should create template successfully")
        void shouldCreateTemplateSuccessfully() {
            ProcessTemplateDTO.CreateRequest request = ProcessTemplateDTO.CreateRequest.builder()
                    .templateName("New Template")
                    .templateCode("NEW-001")
                    .description("New Description")
                    .productSku("PROD-001")
                    .build();

            when(processTemplateRepository.existsByTemplateCode("NEW-001")).thenReturn(false);
            when(processTemplateRepository.save(any(ProcessTemplate.class))).thenAnswer(invocation -> {
                ProcessTemplate t = invocation.getArgument(0);
                t.setProcessTemplateId(1L);
                return t;
            });
            when(routingRepository.findAll()).thenReturn(List.of());

            ProcessTemplateDTO.TemplateResponse response =
                    processTemplateService.createTemplate(request, "testuser");

            assertNotNull(response);
            assertEquals("New Template", response.getTemplateName());
            assertEquals("NEW-001", response.getTemplateCode());
            assertEquals(ProcessTemplate.STATUS_DRAFT, response.getStatus());
            verify(processTemplateRepository).save(any(ProcessTemplate.class));
        }

        @Test
        @DisplayName("Should reject duplicate template code")
        void shouldRejectDuplicateTemplateCode() {
            ProcessTemplateDTO.CreateRequest request = ProcessTemplateDTO.CreateRequest.builder()
                    .templateName("New Template")
                    .templateCode("EXISTING-001")
                    .build();

            when(processTemplateRepository.existsByTemplateCode("EXISTING-001")).thenReturn(true);

            assertThrows(IllegalArgumentException.class, () ->
                    processTemplateService.createTemplate(request, "testuser"));

            verify(processTemplateRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should create template with routing steps")
        void shouldCreateTemplateWithRoutingSteps() {
            ProcessTemplateDTO.RoutingStepTemplate step = ProcessTemplateDTO.RoutingStepTemplate.builder()
                    .sequenceNumber(1)
                    .operationName("Melting")
                    .operationType("FURNACE")
                    .targetQty(BigDecimal.valueOf(100))
                    .mandatoryFlag(true)
                    .build();

            ProcessTemplateDTO.CreateRequest request = ProcessTemplateDTO.CreateRequest.builder()
                    .templateName("Template with Steps")
                    .templateCode("STEP-001")
                    .routingSteps(List.of(step))
                    .build();

            when(processTemplateRepository.existsByTemplateCode("STEP-001")).thenReturn(false);
            when(processTemplateRepository.save(any(ProcessTemplate.class))).thenAnswer(invocation -> {
                ProcessTemplate t = invocation.getArgument(0);
                t.setProcessTemplateId(1L);
                return t;
            });
            when(routingRepository.save(any(Routing.class))).thenAnswer(invocation -> {
                Routing r = invocation.getArgument(0);
                r.setRoutingId(1L);
                return r;
            });
            when(routingStepRepository.save(any(RoutingStep.class))).thenAnswer(invocation -> {
                RoutingStep rs = invocation.getArgument(0);
                rs.setRoutingStepId(1L);
                return rs;
            });
            when(routingRepository.findAll()).thenReturn(List.of());

            ProcessTemplateDTO.TemplateResponse response =
                    processTemplateService.createTemplate(request, "testuser");

            assertNotNull(response);
            verify(routingRepository).save(any(Routing.class));
            verify(routingStepRepository).save(any(RoutingStep.class));
        }
    }

    @Nested
    @DisplayName("Update Template Tests")
    class UpdateTemplateTests {

        @Test
        @DisplayName("Should update DRAFT template fully")
        void shouldUpdateDraftTemplateFully() {
            ProcessTemplateDTO.UpdateRequest request = ProcessTemplateDTO.UpdateRequest.builder()
                    .templateName("Updated Name")
                    .description("Updated Description")
                    .productSku("PROD-002")
                    .build();

            when(processTemplateRepository.findById(1L)).thenReturn(Optional.of(testTemplate));
            when(processTemplateRepository.save(any(ProcessTemplate.class))).thenReturn(testTemplate);
            when(routingRepository.findAll()).thenReturn(List.of());

            ProcessTemplateDTO.TemplateResponse response =
                    processTemplateService.updateTemplate(1L, request, "testuser");

            assertNotNull(response);
            verify(processTemplateRepository).save(any(ProcessTemplate.class));
        }

        @Test
        @DisplayName("Should limit update for ACTIVE template")
        void shouldLimitUpdateForActiveTemplate() {
            testTemplate.setStatus(ProcessTemplate.STATUS_ACTIVE);
            ProcessTemplateDTO.UpdateRequest request = ProcessTemplateDTO.UpdateRequest.builder()
                    .templateName("New Name")  // Should be ignored for ACTIVE
                    .effectiveTo(LocalDate.now().plusDays(30))  // Should be allowed
                    .build();

            when(processTemplateRepository.findById(1L)).thenReturn(Optional.of(testTemplate));
            when(processTemplateRepository.save(any(ProcessTemplate.class))).thenReturn(testTemplate);
            when(routingRepository.findAll()).thenReturn(List.of());

            processTemplateService.updateTemplate(1L, request, "testuser");

            assertEquals("Test Template", testTemplate.getTemplateName()); // Name unchanged
            assertEquals(LocalDate.now().plusDays(30), testTemplate.getEffectiveTo()); // Date changed
        }
    }

    @Nested
    @DisplayName("Activation Tests")
    class ActivationTests {

        @Test
        @DisplayName("Should activate template")
        void shouldActivateTemplate() {
            ProcessTemplateDTO.ActivationRequest request = ProcessTemplateDTO.ActivationRequest.builder()
                    .deactivateOthers(false)
                    .build();

            when(processTemplateRepository.findById(1L)).thenReturn(Optional.of(testTemplate));
            when(processTemplateRepository.save(any(ProcessTemplate.class))).thenReturn(testTemplate);
            when(routingRepository.findAll()).thenReturn(List.of());

            ProcessTemplateDTO.TemplateResponse response =
                    processTemplateService.activateTemplate(1L, request, "testuser");

            assertEquals(ProcessTemplate.STATUS_ACTIVE, testTemplate.getStatus());
            assertNotNull(testTemplate.getEffectiveFrom());
        }

        @Test
        @DisplayName("Should reject activation of already active template")
        void shouldRejectActivationOfAlreadyActiveTemplate() {
            testTemplate.setStatus(ProcessTemplate.STATUS_ACTIVE);
            ProcessTemplateDTO.ActivationRequest request = ProcessTemplateDTO.ActivationRequest.builder().build();

            when(processTemplateRepository.findById(1L)).thenReturn(Optional.of(testTemplate));

            assertThrows(IllegalStateException.class, () ->
                    processTemplateService.activateTemplate(1L, request, "testuser"));
        }

        @Test
        @DisplayName("Should deactivate other templates when activating")
        void shouldDeactivateOtherTemplatesWhenActivating() {
            ProcessTemplate otherTemplate = ProcessTemplate.builder()
                    .processTemplateId(2L)
                    .templateName("Other Template")
                    .productSku("PROD-001")
                    .status(ProcessTemplate.STATUS_ACTIVE)
                    .build();

            ProcessTemplateDTO.ActivationRequest request = ProcessTemplateDTO.ActivationRequest.builder()
                    .deactivateOthers(true)
                    .build();

            when(processTemplateRepository.findById(1L)).thenReturn(Optional.of(testTemplate));
            when(processTemplateRepository.findActiveByProductSku("PROD-001"))
                    .thenReturn(List.of(otherTemplate));
            when(processTemplateRepository.save(any(ProcessTemplate.class))).thenAnswer(i -> i.getArgument(0));
            when(routingRepository.findAll()).thenReturn(List.of());

            processTemplateService.activateTemplate(1L, request, "testuser");

            assertEquals(ProcessTemplate.STATUS_SUPERSEDED, otherTemplate.getStatus());
            verify(processTemplateRepository, times(2)).save(any(ProcessTemplate.class));
        }
    }

    @Nested
    @DisplayName("Deactivation Tests")
    class DeactivationTests {

        @Test
        @DisplayName("Should deactivate active template")
        void shouldDeactivateActiveTemplate() {
            testTemplate.setStatus(ProcessTemplate.STATUS_ACTIVE);

            when(processTemplateRepository.findById(1L)).thenReturn(Optional.of(testTemplate));
            when(processTemplateRepository.save(any(ProcessTemplate.class))).thenReturn(testTemplate);
            when(routingRepository.findAll()).thenReturn(List.of());

            ProcessTemplateDTO.TemplateResponse response =
                    processTemplateService.deactivateTemplate(1L, "testuser");

            assertEquals(ProcessTemplate.STATUS_INACTIVE, testTemplate.getStatus());
            assertNotNull(testTemplate.getEffectiveTo());
        }

        @Test
        @DisplayName("Should reject deactivation of non-active template")
        void shouldRejectDeactivationOfNonActiveTemplate() {
            when(processTemplateRepository.findById(1L)).thenReturn(Optional.of(testTemplate));

            assertThrows(IllegalStateException.class, () ->
                    processTemplateService.deactivateTemplate(1L, "testuser"));
        }
    }

    @Nested
    @DisplayName("Delete Template Tests")
    class DeleteTemplateTests {

        @Test
        @DisplayName("Should delete DRAFT template")
        void shouldDeleteDraftTemplate() {
            when(processTemplateRepository.findById(1L)).thenReturn(Optional.of(testTemplate));
            when(routingRepository.findAll()).thenReturn(List.of());

            processTemplateService.deleteTemplate(1L);

            verify(processTemplateRepository).delete(testTemplate);
        }

        @Test
        @DisplayName("Should reject deletion of non-DRAFT template")
        void shouldRejectDeletionOfNonDraftTemplate() {
            testTemplate.setStatus(ProcessTemplate.STATUS_ACTIVE);

            when(processTemplateRepository.findById(1L)).thenReturn(Optional.of(testTemplate));

            assertThrows(IllegalStateException.class, () ->
                    processTemplateService.deleteTemplate(1L));

            verify(processTemplateRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("Version Creation Tests")
    class VersionCreationTests {

        @Test
        @DisplayName("Should create new version of template")
        void shouldCreateNewVersionOfTemplate() {
            when(processTemplateRepository.findById(1L)).thenReturn(Optional.of(testTemplate));
            when(processTemplateRepository.save(any(ProcessTemplate.class))).thenAnswer(invocation -> {
                ProcessTemplate t = invocation.getArgument(0);
                t.setProcessTemplateId(2L);
                return t;
            });
            when(routingRepository.findAll()).thenReturn(List.of());

            ProcessTemplateDTO.TemplateResponse response =
                    processTemplateService.createNewVersion(1L, "testuser");

            assertNotNull(response);
            assertEquals("V2", response.getVersion());
            assertEquals(ProcessTemplate.STATUS_DRAFT, response.getStatus());
        }
    }

    @Nested
    @DisplayName("Effective Template Tests")
    class EffectiveTemplateTests {

        @Test
        @DisplayName("Should find effective template for product")
        void shouldFindEffectiveTemplateForProduct() {
            testTemplate.setStatus(ProcessTemplate.STATUS_ACTIVE);
            testTemplate.setEffectiveFrom(LocalDate.now().minusDays(1));
            testTemplate.setEffectiveTo(LocalDate.now().plusDays(30));

            when(processTemplateRepository.findEffectiveByProductSku("PROD-001", LocalDate.now()))
                    .thenReturn(List.of(testTemplate));
            when(routingRepository.findAll()).thenReturn(List.of());

            Optional<ProcessTemplateDTO.TemplateResponse> response =
                    processTemplateService.getEffectiveTemplate("PROD-001");

            assertTrue(response.isPresent());
            assertEquals("Test Template", response.get().getTemplateName());
        }

        @Test
        @DisplayName("Should return empty for no effective template")
        void shouldReturnEmptyForNoEffectiveTemplate() {
            when(processTemplateRepository.findEffectiveByProductSku("PROD-001", LocalDate.now()))
                    .thenReturn(List.of());

            Optional<ProcessTemplateDTO.TemplateResponse> response =
                    processTemplateService.getEffectiveTemplate("PROD-001");

            assertTrue(response.isEmpty());
        }
    }
}
