package com.mes.production.service;

import com.mes.production.dto.EquipmentDTO;
import com.mes.production.entity.Equipment;
import com.mes.production.entity.HoldRecord;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.EquipmentRepository;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EquipmentServiceTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private AuditTrailRepository auditTrailRepository;

    @Mock
    private com.mes.production.repository.HoldRecordRepository holdRecordRepository;

    @InjectMocks
    private EquipmentService equipmentService;

    private Equipment testEquipment;

    @BeforeEach
    void setUp() {
        testEquipment = Equipment.builder()
                .equipmentId(1L)
                .equipmentCode("EQ-001")
                .name("Furnace 1")
                .equipmentType("FURNACE")
                .capacity(new BigDecimal("100.00"))
                .capacityUnit("T")
                .location("Plant A")
                .status(Equipment.STATUS_AVAILABLE)
                .build();
    }

    private void setupSecurityContext() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("admin@mes.com");
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    @DisplayName("Should get all equipment")
    void getAllEquipment_ReturnsAllEquipment() {
        when(equipmentRepository.findAll()).thenReturn(List.of(testEquipment));

        List<EquipmentDTO> result = equipmentService.getAllEquipment();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("EQ-001", result.get(0).getEquipmentCode());
    }

    @Test
    @DisplayName("Should get equipment by ID")
    void getEquipmentById_ExistingId_ReturnsEquipment() {
        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));

        EquipmentDTO result = equipmentService.getEquipmentById(1L);

        assertNotNull(result);
        assertEquals("EQ-001", result.getEquipmentCode());
    }

    @Test
    @DisplayName("Should throw exception when equipment not found")
    void getEquipmentById_NotFound_ThrowsException() {
        when(equipmentRepository.findById(999L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> equipmentService.getEquipmentById(999L));

        assertTrue(exception.getMessage().contains("not found"));
    }

    @Nested
    @DisplayName("Maintenance Tests")
    class MaintenanceTests {

        @Test
        @DisplayName("Should start maintenance for available equipment")
        void startMaintenance_AvailableEquipment_StartsSuccessfully() {
            setupSecurityContext();
            when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));
            when(equipmentRepository.save(any(Equipment.class))).thenAnswer(i -> i.getArgument(0));

            LocalDateTime expectedEnd = LocalDateTime.now().plusDays(1);
            EquipmentDTO.StatusUpdateResponse result = equipmentService.startMaintenance(1L, "Scheduled maintenance", expectedEnd);

            assertEquals(1L, result.getEquipmentId());
            assertEquals("AVAILABLE", result.getPreviousStatus());
            assertEquals("MAINTENANCE", result.getNewStatus());
            assertEquals("admin@mes.com", result.getUpdatedBy());

            verify(equipmentRepository, times(1)).save(any(Equipment.class));
            verify(auditService, times(1)).logStatusChange("EQUIPMENT", 1L, "AVAILABLE", "MAINTENANCE");
        }

        @Test
        @DisplayName("Should throw exception when starting maintenance on equipment in use")
        void startMaintenance_InUse_ThrowsException() {
            setupSecurityContext();
            testEquipment.setStatus(Equipment.STATUS_IN_USE);
            when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> equipmentService.startMaintenance(1L, "Maintenance", null));

            assertTrue(exception.getMessage().contains("in use"));
        }

        @Test
        @DisplayName("Should throw exception when equipment already under maintenance")
        void startMaintenance_AlreadyMaintenance_ThrowsException() {
            setupSecurityContext();
            testEquipment.setStatus(Equipment.STATUS_MAINTENANCE);
            when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> equipmentService.startMaintenance(1L, "Maintenance", null));

            assertTrue(exception.getMessage().contains("already under maintenance"));
        }

        @Test
        @DisplayName("Should end maintenance successfully")
        void endMaintenance_MaintenanceEquipment_EndsSuccessfully() {
            setupSecurityContext();
            testEquipment.setStatus(Equipment.STATUS_MAINTENANCE);
            testEquipment.setMaintenanceReason("Scheduled maintenance");
            testEquipment.setMaintenanceBy("admin@mes.com");
            when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));
            when(equipmentRepository.save(any(Equipment.class))).thenAnswer(i -> i.getArgument(0));

            EquipmentDTO.StatusUpdateResponse result = equipmentService.endMaintenance(1L);

            assertEquals("MAINTENANCE", result.getPreviousStatus());
            assertEquals("AVAILABLE", result.getNewStatus());

            verify(equipmentRepository, times(1)).save(any(Equipment.class));
            verify(auditService, times(1)).logStatusChange("EQUIPMENT", 1L, "MAINTENANCE", "AVAILABLE");
        }

        @Test
        @DisplayName("Should throw exception when ending maintenance on non-maintenance equipment")
        void endMaintenance_NotMaintenance_ThrowsException() {
            setupSecurityContext();
            testEquipment.setStatus(Equipment.STATUS_AVAILABLE);
            when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> equipmentService.endMaintenance(1L));

            assertTrue(exception.getMessage().contains("not under maintenance"));
        }

        @Test
        @DisplayName("Should get equipment under maintenance")
        void getMaintenanceEquipment_ReturnsMaintenanceOnly() {
            testEquipment.setStatus(Equipment.STATUS_MAINTENANCE);
            when(equipmentRepository.findByStatus(Equipment.STATUS_MAINTENANCE))
                    .thenReturn(List.of(testEquipment));

            List<EquipmentDTO> result = equipmentService.getMaintenanceEquipment();

            assertEquals(1, result.size());
            assertEquals("MAINTENANCE", result.get(0).getStatus());
        }
    }

    @Nested
    @DisplayName("Hold Tests")
    class HoldTests {

        @Test
        @DisplayName("Should put equipment on hold")
        void putOnHold_AvailableEquipment_HoldsSuccessfully() {
            setupSecurityContext();
            when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));
            when(equipmentRepository.save(any(Equipment.class))).thenAnswer(i -> i.getArgument(0));
            when(holdRecordRepository.save(any(HoldRecord.class))).thenAnswer(i -> i.getArgument(0));

            EquipmentDTO.StatusUpdateResponse result = equipmentService.putOnHold(1L, "Pending inspection");

            assertEquals(1L, result.getEquipmentId());
            assertEquals("AVAILABLE", result.getPreviousStatus());
            assertEquals("ON_HOLD", result.getNewStatus());

            verify(equipmentRepository, times(1)).save(any(Equipment.class));
            verify(holdRecordRepository, times(1)).save(any(HoldRecord.class));
            verify(auditService, times(1)).logStatusChange("EQUIPMENT", 1L, "AVAILABLE", "ON_HOLD");
        }

        @Test
        @DisplayName("Should throw exception when holding equipment in use")
        void putOnHold_InUse_ThrowsException() {
            setupSecurityContext();
            testEquipment.setStatus(Equipment.STATUS_IN_USE);
            when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> equipmentService.putOnHold(1L, "Hold reason"));

            assertTrue(exception.getMessage().contains("in use"));
        }

        @Test
        @DisplayName("Should throw exception when equipment already on hold")
        void putOnHold_AlreadyOnHold_ThrowsException() {
            setupSecurityContext();
            testEquipment.setStatus(Equipment.STATUS_ON_HOLD);
            when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> equipmentService.putOnHold(1L, "Hold reason"));

            assertTrue(exception.getMessage().contains("already on hold"));
        }

        @Test
        @DisplayName("Should release equipment from hold")
        void releaseFromHold_OnHoldEquipment_ReleasesSuccessfully() {
            setupSecurityContext();
            testEquipment.setStatus(Equipment.STATUS_ON_HOLD);
            testEquipment.setHoldReason("Pending inspection");
            testEquipment.setHeldBy("admin@mes.com");
            when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));
            when(equipmentRepository.save(any(Equipment.class))).thenAnswer(i -> i.getArgument(0));
            when(holdRecordRepository.findByEntityTypeAndEntityIdAndStatus("EQUIPMENT", 1L, "ACTIVE"))
                    .thenReturn(Optional.of(HoldRecord.builder()
                            .holdId(1L)
                            .entityType("EQUIPMENT")
                            .entityId(1L)
                            .reason("Pending inspection")
                            .appliedBy("admin@mes.com")
                            .status("ACTIVE")
                            .build()));
            when(holdRecordRepository.save(any(HoldRecord.class))).thenAnswer(i -> i.getArgument(0));

            EquipmentDTO.StatusUpdateResponse result = equipmentService.releaseFromHold(1L);

            assertEquals("ON_HOLD", result.getPreviousStatus());
            assertEquals("AVAILABLE", result.getNewStatus());

            verify(equipmentRepository, times(1)).save(any(Equipment.class));
            verify(holdRecordRepository, times(1)).save(any(HoldRecord.class));
            verify(auditService, times(1)).logStatusChange("EQUIPMENT", 1L, "ON_HOLD", "AVAILABLE");
        }

        @Test
        @DisplayName("Should throw exception when releasing non-held equipment")
        void releaseFromHold_NotOnHold_ThrowsException() {
            setupSecurityContext();
            testEquipment.setStatus(Equipment.STATUS_AVAILABLE);
            when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> equipmentService.releaseFromHold(1L));

            assertTrue(exception.getMessage().contains("not on hold"));
        }

        @Test
        @DisplayName("Should get equipment on hold")
        void getOnHoldEquipment_ReturnsOnHoldOnly() {
            testEquipment.setStatus(Equipment.STATUS_ON_HOLD);
            when(equipmentRepository.findByStatus(Equipment.STATUS_ON_HOLD))
                    .thenReturn(List.of(testEquipment));

            List<EquipmentDTO> result = equipmentService.getOnHoldEquipment();

            assertEquals(1, result.size());
            assertEquals("ON_HOLD", result.get(0).getStatus());
        }
    }

    @Nested
    @DisplayName("Create Equipment Tests")
    class CreateEquipmentTests {

        @Test
        @DisplayName("Should create equipment successfully")
        void createEquipment_ValidData_CreatesSuccessfully() {
            setupSecurityContext();
            EquipmentDTO.CreateEquipmentRequest request = EquipmentDTO.CreateEquipmentRequest.builder()
                    .equipmentCode("EQ-002")
                    .name("Caster 1")
                    .equipmentType("CASTER")
                    .capacity(new BigDecimal("50.00"))
                    .capacityUnit("T")
                    .location("Plant B")
                    .build();

            when(equipmentRepository.existsByEquipmentCode("EQ-002")).thenReturn(false);
            when(equipmentRepository.save(any(Equipment.class))).thenAnswer(i -> {
                Equipment saved = i.getArgument(0);
                saved.setEquipmentId(2L);
                return saved;
            });

            EquipmentDTO result = equipmentService.createEquipment(request);

            assertNotNull(result);
            assertEquals("EQ-002", result.getEquipmentCode());
            assertEquals("Caster 1", result.getName());
            assertEquals("CASTER", result.getEquipmentType());
            verify(equipmentRepository).save(any(Equipment.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception for duplicate equipment code")
        void createEquipment_DuplicateCode_ThrowsException() {
            EquipmentDTO.CreateEquipmentRequest request = EquipmentDTO.CreateEquipmentRequest.builder()
                    .equipmentCode("EQ-001")
                    .name("Duplicate")
                    .equipmentType("FURNACE")
                    .build();

            when(equipmentRepository.existsByEquipmentCode("EQ-001")).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> equipmentService.createEquipment(request));

            assertTrue(exception.getMessage().contains("already exists"));
            verify(equipmentRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Update Equipment Tests")
    class UpdateEquipmentTests {

        @Test
        @DisplayName("Should update equipment successfully")
        void updateEquipment_ValidData_UpdatesSuccessfully() {
            setupSecurityContext();
            EquipmentDTO.UpdateEquipmentRequest request = EquipmentDTO.UpdateEquipmentRequest.builder()
                    .equipmentCode("EQ-001")
                    .name("Furnace 1 Updated")
                    .equipmentType("FURNACE")
                    .capacity(new BigDecimal("150.00"))
                    .capacityUnit("T")
                    .location("Plant A - Section 2")
                    .build();

            when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));
            when(equipmentRepository.save(any(Equipment.class))).thenAnswer(i -> i.getArgument(0));

            EquipmentDTO result = equipmentService.updateEquipment(1L, request);

            assertNotNull(result);
            assertEquals("Furnace 1 Updated", result.getName());
            assertEquals(new BigDecimal("150.00"), result.getCapacity());
            verify(equipmentRepository).save(any(Equipment.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception for non-existent equipment")
        void updateEquipment_NotFound_ThrowsException() {
            EquipmentDTO.UpdateEquipmentRequest request = EquipmentDTO.UpdateEquipmentRequest.builder()
                    .equipmentCode("EQ-999")
                    .name("Not Found")
                    .equipmentType("FURNACE")
                    .build();

            when(equipmentRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> equipmentService.updateEquipment(999L, request));
        }

        @Test
        @DisplayName("Should throw exception for duplicate code on update")
        void updateEquipment_DuplicateCode_ThrowsException() {
            EquipmentDTO.UpdateEquipmentRequest request = EquipmentDTO.UpdateEquipmentRequest.builder()
                    .equipmentCode("EQ-002")
                    .name("Changed Code")
                    .equipmentType("FURNACE")
                    .build();

            when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));
            when(equipmentRepository.existsByEquipmentCode("EQ-002")).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> equipmentService.updateEquipment(1L, request));

            assertTrue(exception.getMessage().contains("already exists"));
        }
    }

    @Nested
    @DisplayName("Delete Equipment Tests")
    class DeleteEquipmentTests {

        @Test
        @DisplayName("Should delete equipment successfully (soft delete)")
        void deleteEquipment_AvailableEquipment_SoftDeletes() {
            setupSecurityContext();
            when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));
            when(equipmentRepository.save(any(Equipment.class))).thenAnswer(i -> i.getArgument(0));

            equipmentService.deleteEquipment(1L);

            assertEquals(Equipment.STATUS_UNAVAILABLE, testEquipment.getStatus());
            verify(equipmentRepository).save(any(Equipment.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception when deleting equipment in use")
        void deleteEquipment_InUse_ThrowsException() {
            testEquipment.setStatus(Equipment.STATUS_IN_USE);
            when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> equipmentService.deleteEquipment(1L));

            assertTrue(exception.getMessage().contains("in use"));
        }

        @Test
        @DisplayName("Should throw exception when equipment not found for delete")
        void deleteEquipment_NotFound_ThrowsException() {
            when(equipmentRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> equipmentService.deleteEquipment(999L));
        }
    }
}
