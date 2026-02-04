package com.mes.production.service;

import com.mes.production.dto.EquipmentDTO;
import com.mes.production.entity.Equipment;
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

            EquipmentDTO.StatusUpdateResponse result = equipmentService.putOnHold(1L, "Pending inspection");

            assertEquals(1L, result.getEquipmentId());
            assertEquals("AVAILABLE", result.getPreviousStatus());
            assertEquals("ON_HOLD", result.getNewStatus());

            verify(equipmentRepository, times(1)).save(any(Equipment.class));
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

            EquipmentDTO.StatusUpdateResponse result = equipmentService.releaseFromHold(1L);

            assertEquals("ON_HOLD", result.getPreviousStatus());
            assertEquals("AVAILABLE", result.getNewStatus());

            verify(equipmentRepository, times(1)).save(any(Equipment.class));
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
}
