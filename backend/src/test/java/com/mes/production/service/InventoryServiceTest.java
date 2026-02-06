package com.mes.production.service;

import com.mes.production.dto.InventoryDTO;
import com.mes.production.entity.Batch;
import com.mes.production.entity.Inventory;
import com.mes.production.repository.BatchRepository;
import com.mes.production.repository.InventoryRepository;
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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private BatchRepository batchRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private InventoryService inventoryService;

    private Inventory testInventory;
    private Batch testBatch;

    @BeforeEach
    void setUp() {
        testBatch = Batch.builder()
                .batchId(1L)
                .batchNumber("BATCH-001")
                .materialId("RM-001")
                .materialName("Iron Ore")
                .quantity(new BigDecimal("100.00"))
                .unit("KG")
                .status("AVAILABLE")
                .build();

        testInventory = Inventory.builder()
                .inventoryId(1L)
                .materialId("RM-001")
                .materialName("Iron Ore")
                .inventoryType("RM")
                .state("AVAILABLE")
                .quantity(new BigDecimal("100.00"))
                .unit("KG")
                .location("WH-01")
                .batch(testBatch)
                .build();
    }

    @Test
    @DisplayName("Should get available inventory for consumption")
    void getAvailableForConsumption_ReturnsAvailableInventory() {
        // Arrange
        when(inventoryRepository.findAvailableRawAndIntermediates())
                .thenReturn(List.of(testInventory));

        // Act
        List<InventoryDTO> result = inventoryService.getAvailableForConsumption();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("RM-001", result.get(0).getMaterialId());
        assertEquals("AVAILABLE", result.get(0).getState());
        assertEquals("BATCH-001", result.get(0).getBatchNumber());

        verify(inventoryRepository, times(1)).findAvailableRawAndIntermediates();
    }

    @Test
    @DisplayName("Should get available inventory by material ID")
    void getAvailableByMaterialId_ValidMaterial_ReturnsInventory() {
        // Arrange
        when(inventoryRepository.findAvailableByMaterialId("RM-001"))
                .thenReturn(List.of(testInventory));

        // Act
        List<InventoryDTO> result = inventoryService.getAvailableByMaterialId("RM-001");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("RM-001", result.get(0).getMaterialId());

        verify(inventoryRepository, times(1)).findAvailableByMaterialId("RM-001");
    }

    @Test
    @DisplayName("Should return empty list when no inventory available for material")
    void getAvailableByMaterialId_NoInventory_ReturnsEmptyList() {
        // Arrange
        when(inventoryRepository.findAvailableByMaterialId("UNKNOWN"))
                .thenReturn(List.of());

        // Act
        List<InventoryDTO> result = inventoryService.getAvailableByMaterialId("UNKNOWN");

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should get all inventory")
    void getAllInventory_ReturnsAllInventory() {
        // Arrange
        Inventory consumedInventory = Inventory.builder()
                .inventoryId(2L)
                .materialId("RM-002")
                .materialName("Carbon")
                .inventoryType("RM")
                .state("CONSUMED")
                .quantity(new BigDecimal("50.00"))
                .unit("KG")
                .location("WH-01")
                .build();

        when(inventoryRepository.findAll())
                .thenReturn(List.of(testInventory, consumedInventory));

        // Act
        List<InventoryDTO> result = inventoryService.getAllInventory();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());

        verify(inventoryRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should get inventory by state")
    void getInventoryByState_ValidState_ReturnsMatchingInventory() {
        // Arrange
        when(inventoryRepository.findByState("AVAILABLE"))
                .thenReturn(List.of(testInventory));

        // Act
        List<InventoryDTO> result = inventoryService.getInventoryByState("AVAILABLE");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("AVAILABLE", result.get(0).getState());

        verify(inventoryRepository, times(1)).findByState("AVAILABLE");
    }

    @Test
    @DisplayName("Should return empty list when no inventory matches state")
    void getInventoryByState_NoMatch_ReturnsEmptyList() {
        // Arrange
        when(inventoryRepository.findByState("SCRAPPED"))
                .thenReturn(List.of());

        // Act
        List<InventoryDTO> result = inventoryService.getInventoryByState("SCRAPPED");

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should get inventory by type")
    void getInventoryByType_ValidType_ReturnsMatchingInventory() {
        // Arrange
        when(inventoryRepository.findByInventoryType("RM"))
                .thenReturn(List.of(testInventory));

        // Act
        List<InventoryDTO> result = inventoryService.getInventoryByType("RM");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("RM", result.get(0).getInventoryType());

        verify(inventoryRepository, times(1)).findByInventoryType("RM");
    }

    @Test
    @DisplayName("Should return empty list when no inventory matches type")
    void getInventoryByType_NoMatch_ReturnsEmptyList() {
        // Arrange
        when(inventoryRepository.findByInventoryType("FG"))
                .thenReturn(List.of());

        // Act
        List<InventoryDTO> result = inventoryService.getInventoryByType("FG");

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should handle inventory without batch")
    void getAvailableForConsumption_NoBatch_ReturnsInventoryWithNullBatchInfo() {
        // Arrange
        Inventory inventoryNoBatch = Inventory.builder()
                .inventoryId(2L)
                .materialId("RM-002")
                .materialName("Carbon")
                .inventoryType("RM")
                .state("AVAILABLE")
                .quantity(new BigDecimal("50.00"))
                .unit("KG")
                .location("WH-01")
                .batch(null)
                .build();

        when(inventoryRepository.findAvailableRawAndIntermediates())
                .thenReturn(List.of(inventoryNoBatch));

        // Act
        List<InventoryDTO> result = inventoryService.getAvailableForConsumption();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertNull(result.get(0).getBatchId());
        assertNull(result.get(0).getBatchNumber());
    }

    @Test
    @DisplayName("Should correctly map all inventory fields to DTO")
    void convertToDTO_AllFields_MapsCorrectly() {
        // Arrange
        when(inventoryRepository.findAll())
                .thenReturn(List.of(testInventory));

        // Act
        List<InventoryDTO> result = inventoryService.getAllInventory();

        // Assert
        InventoryDTO dto = result.get(0);
        assertEquals(1L, dto.getInventoryId());
        assertEquals("RM-001", dto.getMaterialId());
        assertEquals("Iron Ore", dto.getMaterialName());
        assertEquals("RM", dto.getInventoryType());
        assertEquals("AVAILABLE", dto.getState());
        assertEquals(new BigDecimal("100.00"), dto.getQuantity());
        assertEquals("KG", dto.getUnit());
        assertEquals("WH-01", dto.getLocation());
        assertEquals(1L, dto.getBatchId());
        assertEquals("BATCH-001", dto.getBatchNumber());
    }

    @Nested
    @DisplayName("Block Inventory Tests")
    class BlockInventoryTests {

        private void setupSecurityContext() {
            Authentication authentication = mock(Authentication.class);
            SecurityContext securityContext = mock(SecurityContext.class);
            when(securityContext.getAuthentication()).thenReturn(authentication);
            when(authentication.getName()).thenReturn("admin@mes.com");
            SecurityContextHolder.setContext(securityContext);
        }

        @Test
        @DisplayName("Should block available inventory")
        void blockInventory_AvailableInventory_BlocksSuccessfully() {
            // Arrange
            setupSecurityContext();
            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            InventoryDTO.StateUpdateResponse result = inventoryService.blockInventory(1L, "Quality issue");

            // Assert
            assertEquals(1L, result.getInventoryId());
            assertEquals("AVAILABLE", result.getPreviousState());
            assertEquals("BLOCKED", result.getNewState());
            assertEquals("admin@mes.com", result.getUpdatedBy());
            assertTrue(result.getMessage().contains("Quality issue"));

            verify(inventoryRepository, times(1)).save(any(Inventory.class));
            verify(auditService, times(1)).logStatusChange("INVENTORY", 1L, "AVAILABLE", "BLOCKED");
        }

        @Test
        @DisplayName("Should throw exception when blocking already blocked inventory")
        void blockInventory_AlreadyBlocked_ThrowsException() {
            // Arrange
            setupSecurityContext();
            testInventory.setState(Inventory.STATE_BLOCKED);
            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> inventoryService.blockInventory(1L, "Duplicate block"));

            assertTrue(exception.getMessage().contains("already blocked"));
        }

        @Test
        @DisplayName("Should throw exception when blocking consumed inventory")
        void blockInventory_ConsumedInventory_ThrowsException() {
            // Arrange
            setupSecurityContext();
            testInventory.setState(Inventory.STATE_CONSUMED);
            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> inventoryService.blockInventory(1L, "Block consumed"));

            assertTrue(exception.getMessage().contains("Cannot block"));
        }

        @Test
        @DisplayName("Should throw exception when blocking scrapped inventory")
        void blockInventory_ScrappedInventory_ThrowsException() {
            // Arrange
            setupSecurityContext();
            testInventory.setState(Inventory.STATE_SCRAPPED);
            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> inventoryService.blockInventory(1L, "Block scrapped"));

            assertTrue(exception.getMessage().contains("Cannot block"));
        }
    }

    @Nested
    @DisplayName("Unblock Inventory Tests")
    class UnblockInventoryTests {

        private void setupSecurityContext() {
            Authentication authentication = mock(Authentication.class);
            SecurityContext securityContext = mock(SecurityContext.class);
            when(securityContext.getAuthentication()).thenReturn(authentication);
            when(authentication.getName()).thenReturn("admin@mes.com");
            SecurityContextHolder.setContext(securityContext);
        }

        @Test
        @DisplayName("Should unblock blocked inventory")
        void unblockInventory_BlockedInventory_UnblocksSuccessfully() {
            // Arrange
            setupSecurityContext();
            testInventory.setState(Inventory.STATE_BLOCKED);
            testInventory.setBlockReason("Quality issue");
            testInventory.setBlockedBy("admin@mes.com");
            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            InventoryDTO.StateUpdateResponse result = inventoryService.unblockInventory(1L);

            // Assert
            assertEquals(1L, result.getInventoryId());
            assertEquals("BLOCKED", result.getPreviousState());
            assertEquals("AVAILABLE", result.getNewState());
            assertEquals("admin@mes.com", result.getUpdatedBy());

            verify(inventoryRepository, times(1)).save(any(Inventory.class));
            verify(auditService, times(1)).logStatusChange("INVENTORY", 1L, "BLOCKED", "AVAILABLE");
        }

        @Test
        @DisplayName("Should throw exception when unblocking non-blocked inventory")
        void unblockInventory_NotBlocked_ThrowsException() {
            // Arrange
            setupSecurityContext();
            testInventory.setState(Inventory.STATE_AVAILABLE);
            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> inventoryService.unblockInventory(1L));

            assertTrue(exception.getMessage().contains("not blocked"));
        }
    }

    @Nested
    @DisplayName("Scrap Inventory Tests")
    class ScrapInventoryTests {

        private void setupSecurityContext() {
            Authentication authentication = mock(Authentication.class);
            SecurityContext securityContext = mock(SecurityContext.class);
            when(securityContext.getAuthentication()).thenReturn(authentication);
            when(authentication.getName()).thenReturn("admin@mes.com");
            SecurityContextHolder.setContext(securityContext);
        }

        @Test
        @DisplayName("Should scrap available inventory")
        void scrapInventory_AvailableInventory_ScrapsSuccessfully() {
            // Arrange
            setupSecurityContext();
            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            InventoryDTO.StateUpdateResponse result = inventoryService.scrapInventory(1L, "Damaged");

            // Assert
            assertEquals(1L, result.getInventoryId());
            assertEquals("AVAILABLE", result.getPreviousState());
            assertEquals("SCRAPPED", result.getNewState());
            assertEquals("admin@mes.com", result.getUpdatedBy());
            assertTrue(result.getMessage().contains("Damaged"));

            verify(inventoryRepository, times(1)).save(any(Inventory.class));
            verify(auditService, times(1)).logStatusChange("INVENTORY", 1L, "AVAILABLE", "SCRAPPED");
        }

        @Test
        @DisplayName("Should scrap blocked inventory")
        void scrapInventory_BlockedInventory_ScrapsSuccessfully() {
            // Arrange
            setupSecurityContext();
            testInventory.setState(Inventory.STATE_BLOCKED);
            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            InventoryDTO.StateUpdateResponse result = inventoryService.scrapInventory(1L, "Cannot repair");

            // Assert
            assertEquals("BLOCKED", result.getPreviousState());
            assertEquals("SCRAPPED", result.getNewState());
        }

        @Test
        @DisplayName("Should throw exception when scrapping already scrapped inventory")
        void scrapInventory_AlreadyScrapped_ThrowsException() {
            // Arrange
            setupSecurityContext();
            testInventory.setState(Inventory.STATE_SCRAPPED);
            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> inventoryService.scrapInventory(1L, "Scrap again"));

            assertTrue(exception.getMessage().contains("already scrapped"));
        }

        @Test
        @DisplayName("Should throw exception when scrapping consumed inventory")
        void scrapInventory_ConsumedInventory_ThrowsException() {
            // Arrange
            setupSecurityContext();
            testInventory.setState(Inventory.STATE_CONSUMED);
            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> inventoryService.scrapInventory(1L, "Scrap consumed"));

            assertTrue(exception.getMessage().contains("consumed"));
        }
    }

    @Nested
    @DisplayName("Get Inventory By ID Tests")
    class GetInventoryByIdTests {

        @Test
        @DisplayName("Should get inventory by ID")
        void getInventoryById_ExistingId_ReturnsInventory() {
            // Arrange
            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));

            // Act
            InventoryDTO result = inventoryService.getInventoryById(1L);

            // Assert
            assertEquals(1L, result.getInventoryId());
            assertEquals("RM-001", result.getMaterialId());
        }

        @Test
        @DisplayName("Should throw exception when inventory not found")
        void getInventoryById_NotFound_ThrowsException() {
            // Arrange
            when(inventoryRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> inventoryService.getInventoryById(999L));

            assertTrue(exception.getMessage().contains("not found"));
        }
    }

    @Nested
    @DisplayName("Get Blocked/Scrapped Inventory Tests")
    class GetBlockedScrappedInventoryTests {

        @Test
        @DisplayName("Should get blocked inventory")
        void getBlockedInventory_ReturnsBlockedOnly() {
            // Arrange
            testInventory.setState(Inventory.STATE_BLOCKED);
            when(inventoryRepository.findByState(Inventory.STATE_BLOCKED))
                    .thenReturn(List.of(testInventory));

            // Act
            List<InventoryDTO> result = inventoryService.getBlockedInventory();

            // Assert
            assertEquals(1, result.size());
            assertEquals("BLOCKED", result.get(0).getState());
        }

        @Test
        @DisplayName("Should get scrapped inventory")
        void getScrappedInventory_ReturnsScrappedOnly() {
            // Arrange
            testInventory.setState(Inventory.STATE_SCRAPPED);
            when(inventoryRepository.findByState(Inventory.STATE_SCRAPPED))
                    .thenReturn(List.of(testInventory));

            // Act
            List<InventoryDTO> result = inventoryService.getScrappedInventory();

            // Assert
            assertEquals(1, result.size());
            assertEquals("SCRAPPED", result.get(0).getState());
        }
    }

    @Nested
    @DisplayName("Create Inventory Tests")
    class CreateInventoryTests {

        private void mockSecurityContext() {
            SecurityContext securityContext = mock(SecurityContext.class);
            Authentication authentication = mock(Authentication.class);
            when(authentication.getName()).thenReturn("admin");
            when(securityContext.getAuthentication()).thenReturn(authentication);
            SecurityContextHolder.setContext(securityContext);
        }

        @Test
        @DisplayName("Should create inventory successfully")
        void createInventory_Success() {
            mockSecurityContext();

            InventoryDTO.CreateInventoryRequest request = InventoryDTO.CreateInventoryRequest.builder()
                    .materialId("RM-001")
                    .materialName("Iron Ore")
                    .inventoryType("RM")
                    .quantity(new BigDecimal("500.00"))
                    .unit("KG")
                    .location("WH-01")
                    .build();

            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
                Inventory saved = invocation.getArgument(0);
                saved.setInventoryId(10L);
                return saved;
            });

            InventoryDTO result = inventoryService.createInventory(request);

            assertNotNull(result);
            assertEquals("RM-001", result.getMaterialId());
            assertEquals("RM", result.getInventoryType());
            assertEquals(new BigDecimal("500.00"), result.getQuantity());
            verify(inventoryRepository).save(any(Inventory.class));
        }

        @Test
        @DisplayName("Should create inventory with batch")
        void createInventory_WithBatch() {
            mockSecurityContext();

            InventoryDTO.CreateInventoryRequest request = InventoryDTO.CreateInventoryRequest.builder()
                    .materialId("RM-001")
                    .inventoryType("RM")
                    .quantity(new BigDecimal("100.00"))
                    .batchId(1L)
                    .build();

            when(batchRepository.findById(1L)).thenReturn(Optional.of(testBatch));
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
                Inventory saved = invocation.getArgument(0);
                saved.setInventoryId(11L);
                return saved;
            });

            InventoryDTO result = inventoryService.createInventory(request);

            assertNotNull(result);
            verify(batchRepository).findById(1L);
            verify(inventoryRepository).save(any(Inventory.class));
        }
    }

    @Nested
    @DisplayName("Update Inventory Tests")
    class UpdateInventoryTests {

        private void mockSecurityContext() {
            SecurityContext securityContext = mock(SecurityContext.class);
            Authentication authentication = mock(Authentication.class);
            when(authentication.getName()).thenReturn("admin");
            when(securityContext.getAuthentication()).thenReturn(authentication);
            SecurityContextHolder.setContext(securityContext);
        }

        @Test
        @DisplayName("Should update inventory successfully")
        void updateInventory_Success() {
            mockSecurityContext();

            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
            when(inventoryRepository.save(any(Inventory.class))).thenReturn(testInventory);

            InventoryDTO.UpdateInventoryRequest request = InventoryDTO.UpdateInventoryRequest.builder()
                    .materialName("Updated Iron Ore")
                    .quantity(new BigDecimal("200.00"))
                    .location("WH-02")
                    .build();

            InventoryDTO result = inventoryService.updateInventory(1L, request);

            assertNotNull(result);
            verify(inventoryRepository).save(any(Inventory.class));
        }

        @Test
        @DisplayName("Should reject update for consumed inventory")
        void updateInventory_RejectConsumed() {
            mockSecurityContext();

            testInventory.setState(Inventory.STATE_CONSUMED);
            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));

            InventoryDTO.UpdateInventoryRequest request = InventoryDTO.UpdateInventoryRequest.builder()
                    .quantity(new BigDecimal("200.00"))
                    .build();

            assertThrows(RuntimeException.class, () -> inventoryService.updateInventory(1L, request));
        }

        @Test
        @DisplayName("Should reject update for scrapped inventory")
        void updateInventory_RejectScrapped() {
            mockSecurityContext();

            testInventory.setState(Inventory.STATE_SCRAPPED);
            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));

            InventoryDTO.UpdateInventoryRequest request = InventoryDTO.UpdateInventoryRequest.builder()
                    .quantity(new BigDecimal("200.00"))
                    .build();

            assertThrows(RuntimeException.class, () -> inventoryService.updateInventory(1L, request));
        }

        @Test
        @DisplayName("Should throw when inventory not found")
        void updateInventory_NotFound() {
            mockSecurityContext();

            when(inventoryRepository.findById(99L)).thenReturn(Optional.empty());

            InventoryDTO.UpdateInventoryRequest request = InventoryDTO.UpdateInventoryRequest.builder()
                    .quantity(new BigDecimal("200.00"))
                    .build();

            assertThrows(RuntimeException.class, () -> inventoryService.updateInventory(99L, request));
        }
    }

    @Nested
    @DisplayName("Delete Inventory Tests")
    class DeleteInventoryTests {

        private void mockSecurityContext() {
            SecurityContext securityContext = mock(SecurityContext.class);
            Authentication authentication = mock(Authentication.class);
            when(authentication.getName()).thenReturn("admin");
            when(securityContext.getAuthentication()).thenReturn(authentication);
            SecurityContextHolder.setContext(securityContext);
        }

        @Test
        @DisplayName("Should soft delete inventory")
        void deleteInventory_Success() {
            mockSecurityContext();

            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));
            when(inventoryRepository.save(any(Inventory.class))).thenReturn(testInventory);

            InventoryDTO.StateUpdateResponse result = inventoryService.deleteInventory(1L);

            assertNotNull(result);
            assertEquals("AVAILABLE", result.getPreviousState());
            assertEquals("SCRAPPED", result.getNewState());
            verify(inventoryRepository).save(any(Inventory.class));
        }

        @Test
        @DisplayName("Should reject delete for consumed inventory")
        void deleteInventory_RejectConsumed() {
            mockSecurityContext();

            testInventory.setState(Inventory.STATE_CONSUMED);
            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));

            assertThrows(RuntimeException.class, () -> inventoryService.deleteInventory(1L));
        }

        @Test
        @DisplayName("Should reject delete for already scrapped inventory")
        void deleteInventory_RejectScrapped() {
            mockSecurityContext();

            testInventory.setState(Inventory.STATE_SCRAPPED);
            when(inventoryRepository.findById(1L)).thenReturn(Optional.of(testInventory));

            assertThrows(RuntimeException.class, () -> inventoryService.deleteInventory(1L));
        }

        @Test
        @DisplayName("Should throw when inventory not found")
        void deleteInventory_NotFound() {
            mockSecurityContext();

            when(inventoryRepository.findById(99L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class, () -> inventoryService.deleteInventory(99L));
        }
    }
}
