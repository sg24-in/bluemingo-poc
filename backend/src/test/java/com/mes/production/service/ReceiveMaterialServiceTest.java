package com.mes.production.service;

import com.mes.production.dto.InventoryDTO;
import com.mes.production.entity.Batch;
import com.mes.production.entity.Inventory;
import com.mes.production.entity.InventoryMovement;
import com.mes.production.repository.BatchRepository;
import com.mes.production.repository.InventoryMovementRepository;
import com.mes.production.repository.InventoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReceiveMaterialServiceTest {

    @Mock
    private BatchRepository batchRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private InventoryMovementRepository movementRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private BatchNumberService batchNumberService;

    @Mock
    private UnitConversionService unitConversionService;

    @InjectMocks
    private ReceiveMaterialService receiveMaterialService;

    private InventoryDTO.ReceiveMaterialRequest baseRequest;

    private void mockSecurityContext() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("test-user");
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @BeforeEach
    void setUp() {
        baseRequest = InventoryDTO.ReceiveMaterialRequest.builder()
                .materialId("RM-001")
                .materialName("Iron Ore")
                .quantity(new BigDecimal("1000.00"))
                .unit("KG")
                .location("WAREHOUSE-A")
                .notes("Standard delivery")
                .build();
    }

    @Nested
    @DisplayName("receiveMaterial - Success Paths")
    class ReceiveMaterialSuccessTests {

        @BeforeEach
        void setUpMocks() {
            mockSecurityContext();
        }

        @Test
        @DisplayName("Should receive material successfully with all fields populated")
        void should_receiveMaterial_successfully() {
            // Arrange
            when(unitConversionService.getUnit("KG")).thenReturn(Optional.of(Map.of("unit_code", "KG")));
            when(batchNumberService.generateRmBatchNumber(eq("RM-001"), any(LocalDate.class), isNull()))
                    .thenReturn("RM-20260210-001");
            when(batchRepository.save(any(Batch.class))).thenAnswer(invocation -> {
                Batch b = invocation.getArgument(0);
                b.setBatchId(1L);
                return b;
            });
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
                Inventory inv = invocation.getArgument(0);
                inv.setInventoryId(10L);
                return inv;
            });
            when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            InventoryDTO.ReceiveMaterialResponse response = receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            assertNotNull(response);
            assertEquals(1L, response.getBatchId());
            assertEquals("RM-20260210-001", response.getBatchNumber());
            assertEquals(10L, response.getInventoryId());
            assertEquals(Batch.STATUS_QUALITY_PENDING, response.getBatchStatus());
            assertEquals(Inventory.STATE_AVAILABLE, response.getInventoryState());
            assertEquals(new BigDecimal("1000.00"), response.getQuantity());
            assertEquals("KG", response.getUnit());
            assertTrue(response.getMessage().contains("successfully"));
        }

        @Test
        @DisplayName("Should create batch with QUALITY_PENDING status")
        void should_createBatch_withQualityPendingStatus() {
            // Arrange
            when(unitConversionService.getUnit("KG")).thenReturn(Optional.of(Map.of("unit_code", "KG")));
            when(batchNumberService.generateRmBatchNumber(anyString(), any(LocalDate.class), any()))
                    .thenReturn("RM-BATCH-001");
            when(batchRepository.save(any(Batch.class))).thenAnswer(invocation -> {
                Batch b = invocation.getArgument(0);
                b.setBatchId(1L);
                return b;
            });
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
                Inventory inv = invocation.getArgument(0);
                inv.setInventoryId(10L);
                return inv;
            });
            when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            ArgumentCaptor<Batch> batchCaptor = ArgumentCaptor.forClass(Batch.class);
            verify(batchRepository).save(batchCaptor.capture());
            Batch savedBatch = batchCaptor.getValue();

            assertEquals(Batch.STATUS_QUALITY_PENDING, savedBatch.getStatus());
            assertEquals("RM-001", savedBatch.getMaterialId());
            assertEquals("Iron Ore", savedBatch.getMaterialName());
            assertEquals(new BigDecimal("1000.00"), savedBatch.getQuantity());
            assertEquals("KG", savedBatch.getUnit());
            assertEquals(Batch.CREATED_VIA_MANUAL, savedBatch.getCreatedVia());
            assertEquals("test-user", savedBatch.getCreatedBy());
        }

        @Test
        @DisplayName("Should create inventory with AVAILABLE state and RM type")
        void should_createInventory_withAvailableStateAndRmType() {
            // Arrange
            when(unitConversionService.getUnit("KG")).thenReturn(Optional.of(Map.of("unit_code", "KG")));
            when(batchNumberService.generateRmBatchNumber(anyString(), any(LocalDate.class), any()))
                    .thenReturn("RM-BATCH-001");
            when(batchRepository.save(any(Batch.class))).thenAnswer(invocation -> {
                Batch b = invocation.getArgument(0);
                b.setBatchId(1L);
                return b;
            });
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
                Inventory inv = invocation.getArgument(0);
                inv.setInventoryId(10L);
                return inv;
            });
            when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            ArgumentCaptor<Inventory> inventoryCaptor = ArgumentCaptor.forClass(Inventory.class);
            verify(inventoryRepository).save(inventoryCaptor.capture());
            Inventory savedInventory = inventoryCaptor.getValue();

            assertEquals(Inventory.STATE_AVAILABLE, savedInventory.getState());
            assertEquals("RM", savedInventory.getInventoryType());
            assertEquals("RM-001", savedInventory.getMaterialId());
            assertEquals("Iron Ore", savedInventory.getMaterialName());
            assertEquals(new BigDecimal("1000.00"), savedInventory.getQuantity());
            assertEquals("KG", savedInventory.getUnit());
            assertEquals("WAREHOUSE-A", savedInventory.getLocation());
            assertNotNull(savedInventory.getBatch());
            assertEquals("test-user", savedInventory.getCreatedBy());
        }

        @Test
        @DisplayName("Should create inventory movement with PRODUCE type")
        void should_createMovement_withProduceType() {
            // Arrange
            when(unitConversionService.getUnit("KG")).thenReturn(Optional.of(Map.of("unit_code", "KG")));
            when(batchNumberService.generateRmBatchNumber(anyString(), any(LocalDate.class), any()))
                    .thenReturn("RM-BATCH-001");
            when(batchRepository.save(any(Batch.class))).thenAnswer(invocation -> {
                Batch b = invocation.getArgument(0);
                b.setBatchId(1L);
                return b;
            });
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
                Inventory inv = invocation.getArgument(0);
                inv.setInventoryId(10L);
                return inv;
            });
            when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            ArgumentCaptor<InventoryMovement> movementCaptor = ArgumentCaptor.forClass(InventoryMovement.class);
            verify(movementRepository).save(movementCaptor.capture());
            InventoryMovement savedMovement = movementCaptor.getValue();

            assertEquals("PRODUCE", savedMovement.getMovementType());
            assertEquals(new BigDecimal("1000.00"), savedMovement.getQuantity());
            assertEquals(InventoryMovement.STATUS_EXECUTED, savedMovement.getStatus());
            assertEquals("test-user", savedMovement.getCreatedBy());
            assertTrue(savedMovement.getReason().contains("Goods receipt"));
            assertTrue(savedMovement.getReason().contains("Standard delivery"));
            assertNotNull(savedMovement.getInventory());
        }

        @Test
        @DisplayName("Should receive material with supplier info")
        void should_receiveMaterial_withSupplierInfo() {
            // Arrange
            baseRequest.setSupplierBatchNumber("SUP-LOT-2026");
            baseRequest.setSupplierId("SUPPLIER-001");

            when(unitConversionService.getUnit("KG")).thenReturn(Optional.of(Map.of("unit_code", "KG")));
            when(batchNumberService.generateRmBatchNumber("RM-001", LocalDate.now(), "SUP-LOT-2026"))
                    .thenReturn("RM-SUP-001");
            when(batchRepository.save(any(Batch.class))).thenAnswer(invocation -> {
                Batch b = invocation.getArgument(0);
                b.setBatchId(1L);
                return b;
            });
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
                Inventory inv = invocation.getArgument(0);
                inv.setInventoryId(10L);
                return inv;
            });
            when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            ArgumentCaptor<Batch> batchCaptor = ArgumentCaptor.forClass(Batch.class);
            verify(batchRepository).save(batchCaptor.capture());
            Batch savedBatch = batchCaptor.getValue();

            assertEquals("SUP-LOT-2026", savedBatch.getSupplierBatchNumber());
            assertEquals("SUPPLIER-001", savedBatch.getSupplierId());

            // Verify batch number generation included supplier batch number
            verify(batchNumberService).generateRmBatchNumber("RM-001", LocalDate.now(), "SUP-LOT-2026");
        }

        @Test
        @DisplayName("Should receive material with expiry date")
        void should_receiveMaterial_withExpiryDate() {
            // Arrange
            LocalDate expiryDate = LocalDate.of(2027, 6, 30);
            baseRequest.setExpiryDate(expiryDate);

            when(unitConversionService.getUnit("KG")).thenReturn(Optional.of(Map.of("unit_code", "KG")));
            when(batchNumberService.generateRmBatchNumber(anyString(), any(LocalDate.class), any()))
                    .thenReturn("RM-BATCH-001");
            when(batchRepository.save(any(Batch.class))).thenAnswer(invocation -> {
                Batch b = invocation.getArgument(0);
                b.setBatchId(1L);
                return b;
            });
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
                Inventory inv = invocation.getArgument(0);
                inv.setInventoryId(10L);
                return inv;
            });
            when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            ArgumentCaptor<Batch> batchCaptor = ArgumentCaptor.forClass(Batch.class);
            verify(batchRepository).save(batchCaptor.capture());
            Batch savedBatch = batchCaptor.getValue();

            assertEquals(expiryDate, savedBatch.getExpiryDate());
        }

        @Test
        @DisplayName("Should receive material with custom received date")
        void should_receiveMaterial_withCustomReceivedDate() {
            // Arrange
            LocalDate customDate = LocalDate.of(2026, 1, 15);
            baseRequest.setReceivedDate(customDate);

            when(unitConversionService.getUnit("KG")).thenReturn(Optional.of(Map.of("unit_code", "KG")));
            when(batchNumberService.generateRmBatchNumber("RM-001", customDate, null))
                    .thenReturn("RM-20260115-001");
            when(batchRepository.save(any(Batch.class))).thenAnswer(invocation -> {
                Batch b = invocation.getArgument(0);
                b.setBatchId(1L);
                return b;
            });
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
                Inventory inv = invocation.getArgument(0);
                inv.setInventoryId(10L);
                return inv;
            });
            when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            ArgumentCaptor<Batch> batchCaptor = ArgumentCaptor.forClass(Batch.class);
            verify(batchRepository).save(batchCaptor.capture());
            Batch savedBatch = batchCaptor.getValue();

            assertEquals(customDate, savedBatch.getReceivedDate());
            verify(batchNumberService).generateRmBatchNumber("RM-001", customDate, null);
        }

        @Test
        @DisplayName("Should default received date to today when not provided")
        void should_defaultReceivedDate_toToday() {
            // Arrange - receivedDate is null by default in baseRequest
            when(unitConversionService.getUnit("KG")).thenReturn(Optional.of(Map.of("unit_code", "KG")));
            when(batchNumberService.generateRmBatchNumber(eq("RM-001"), eq(LocalDate.now()), isNull()))
                    .thenReturn("RM-BATCH-001");
            when(batchRepository.save(any(Batch.class))).thenAnswer(invocation -> {
                Batch b = invocation.getArgument(0);
                b.setBatchId(1L);
                return b;
            });
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
                Inventory inv = invocation.getArgument(0);
                inv.setInventoryId(10L);
                return inv;
            });
            when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            ArgumentCaptor<Batch> batchCaptor = ArgumentCaptor.forClass(Batch.class);
            verify(batchRepository).save(batchCaptor.capture());
            Batch savedBatch = batchCaptor.getValue();

            assertEquals(LocalDate.now(), savedBatch.getReceivedDate());
        }

        @Test
        @DisplayName("Should store notes in batch receiptNotes field")
        void should_storeNotes_inBatchReceiptNotes() {
            // Arrange
            baseRequest.setNotes("Urgent delivery - expedited shipment");

            when(unitConversionService.getUnit("KG")).thenReturn(Optional.of(Map.of("unit_code", "KG")));
            when(batchNumberService.generateRmBatchNumber(anyString(), any(LocalDate.class), any()))
                    .thenReturn("RM-BATCH-001");
            when(batchRepository.save(any(Batch.class))).thenAnswer(invocation -> {
                Batch b = invocation.getArgument(0);
                b.setBatchId(1L);
                return b;
            });
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
                Inventory inv = invocation.getArgument(0);
                inv.setInventoryId(10L);
                return inv;
            });
            when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            ArgumentCaptor<Batch> batchCaptor = ArgumentCaptor.forClass(Batch.class);
            verify(batchRepository).save(batchCaptor.capture());
            assertEquals("Urgent delivery - expedited shipment", batchCaptor.getValue().getReceiptNotes());
        }
    }

    @Nested
    @DisplayName("receiveMaterial - Batch Number Generation")
    class BatchNumberGenerationTests {

        @BeforeEach
        void setUpMocks() {
            mockSecurityContext();
        }

        @Test
        @DisplayName("Should generate batch number via BatchNumberService")
        void should_generateBatchNumber_viaBatchNumberService() {
            // Arrange
            when(unitConversionService.getUnit("KG")).thenReturn(Optional.of(Map.of("unit_code", "KG")));
            when(batchNumberService.generateRmBatchNumber("RM-001", LocalDate.now(), null))
                    .thenReturn("RM-20260210-001");
            when(batchRepository.save(any(Batch.class))).thenAnswer(invocation -> {
                Batch b = invocation.getArgument(0);
                b.setBatchId(1L);
                return b;
            });
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
                Inventory inv = invocation.getArgument(0);
                inv.setInventoryId(10L);
                return inv;
            });
            when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            InventoryDTO.ReceiveMaterialResponse response = receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            assertEquals("RM-20260210-001", response.getBatchNumber());
            verify(batchNumberService).generateRmBatchNumber("RM-001", LocalDate.now(), null);
        }

        @Test
        @DisplayName("Should pass supplier batch number to batch number generator")
        void should_passSupplierBatchNumber_toBatchNumberGenerator() {
            // Arrange
            baseRequest.setSupplierBatchNumber("VENDOR-LOT-99");

            when(unitConversionService.getUnit("KG")).thenReturn(Optional.of(Map.of("unit_code", "KG")));
            when(batchNumberService.generateRmBatchNumber("RM-001", LocalDate.now(), "VENDOR-LOT-99"))
                    .thenReturn("RM-VENDOR-001");
            when(batchRepository.save(any(Batch.class))).thenAnswer(invocation -> {
                Batch b = invocation.getArgument(0);
                b.setBatchId(1L);
                return b;
            });
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
                Inventory inv = invocation.getArgument(0);
                inv.setInventoryId(10L);
                return inv;
            });
            when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            verify(batchNumberService).generateRmBatchNumber("RM-001", LocalDate.now(), "VENDOR-LOT-99");
        }
    }

    @Nested
    @DisplayName("receiveMaterial - Unit Validation")
    class UnitValidationTests {

        @BeforeEach
        void setUpMocks() {
            mockSecurityContext();
        }

        private void stubRepositorySaves() {
            when(batchRepository.save(any(Batch.class))).thenAnswer(invocation -> {
                Batch b = invocation.getArgument(0);
                b.setBatchId(1L);
                return b;
            });
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
                Inventory inv = invocation.getArgument(0);
                inv.setInventoryId(10L);
                return inv;
            });
            when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(batchNumberService.generateRmBatchNumber(anyString(), any(LocalDate.class), any()))
                    .thenReturn("RM-BATCH-001");
        }

        @Test
        @DisplayName("Should use default KG when unit is null")
        void should_useDefaultKg_whenUnitIsNull() {
            // Arrange
            baseRequest.setUnit(null);
            stubRepositorySaves();

            // Act
            InventoryDTO.ReceiveMaterialResponse response = receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            assertEquals("KG", response.getUnit());

            ArgumentCaptor<Batch> batchCaptor = ArgumentCaptor.forClass(Batch.class);
            verify(batchRepository).save(batchCaptor.capture());
            assertEquals("KG", batchCaptor.getValue().getUnit());
        }

        @Test
        @DisplayName("Should use default KG when unit is empty string")
        void should_useDefaultKg_whenUnitIsEmpty() {
            // Arrange
            baseRequest.setUnit("");
            stubRepositorySaves();

            // Act
            InventoryDTO.ReceiveMaterialResponse response = receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            assertEquals("KG", response.getUnit());
        }

        @Test
        @DisplayName("Should use default KG when unit is whitespace only")
        void should_useDefaultKg_whenUnitIsWhitespace() {
            // Arrange
            baseRequest.setUnit("   ");
            stubRepositorySaves();

            // Act
            InventoryDTO.ReceiveMaterialResponse response = receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            assertEquals("KG", response.getUnit());
        }

        @Test
        @DisplayName("Should normalize valid unit to uppercase")
        void should_normalizeUnit_toUppercase() {
            // Arrange
            baseRequest.setUnit("kg");
            when(unitConversionService.getUnit("KG")).thenReturn(Optional.of(Map.of("unit_code", "KG")));
            stubRepositorySaves();

            // Act
            InventoryDTO.ReceiveMaterialResponse response = receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            assertEquals("KG", response.getUnit());
        }

        @Test
        @DisplayName("Should resolve unit alias TON to TONS")
        void should_resolveAlias_tonToTons() {
            // Arrange
            baseRequest.setUnit("TON");
            when(unitConversionService.getUnit("TON")).thenReturn(Optional.empty());
            when(unitConversionService.getUnit("TONS")).thenReturn(Optional.of(Map.of("unit_code", "TONS")));
            stubRepositorySaves();

            // Act
            InventoryDTO.ReceiveMaterialResponse response = receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            assertEquals("TONS", response.getUnit());
        }

        @Test
        @DisplayName("Should resolve unit alias PIECE to PCS")
        void should_resolveAlias_pieceToPcs() {
            // Arrange
            baseRequest.setUnit("PIECE");
            when(unitConversionService.getUnit("PIECE")).thenReturn(Optional.empty());
            when(unitConversionService.getUnit("PCS")).thenReturn(Optional.of(Map.of("unit_code", "PCS")));
            stubRepositorySaves();

            // Act
            InventoryDTO.ReceiveMaterialResponse response = receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            assertEquals("PCS", response.getUnit());
        }

        @Test
        @DisplayName("Should fall back to KG for invalid/unknown unit")
        void should_fallBackToKg_forInvalidUnit() {
            // Arrange
            baseRequest.setUnit("GALLONS");
            when(unitConversionService.getUnit("GALLONS")).thenReturn(Optional.empty());
            stubRepositorySaves();

            // Act
            InventoryDTO.ReceiveMaterialResponse response = receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            assertEquals("KG", response.getUnit());
        }
    }

    @Nested
    @DisplayName("receiveMaterial - Audit Logging")
    class AuditLoggingTests {

        @BeforeEach
        void setUpMocks() {
            mockSecurityContext();
        }

        @Test
        @DisplayName("Should create audit entries for batch and inventory")
        void should_createAuditEntries_forBatchAndInventory() {
            // Arrange
            when(unitConversionService.getUnit("KG")).thenReturn(Optional.of(Map.of("unit_code", "KG")));
            when(batchNumberService.generateRmBatchNumber(anyString(), any(LocalDate.class), any()))
                    .thenReturn("RM-AUDIT-001");
            when(batchRepository.save(any(Batch.class))).thenAnswer(invocation -> {
                Batch b = invocation.getArgument(0);
                b.setBatchId(5L);
                return b;
            });
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
                Inventory inv = invocation.getArgument(0);
                inv.setInventoryId(50L);
                return inv;
            });
            when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            receiveMaterialService.receiveMaterial(baseRequest);

            // Assert - Verify BATCH audit create
            verify(auditService).logCreate(eq("BATCH"), eq(5L), contains("RM Receipt"));

            // Assert - Verify INVENTORY audit create
            verify(auditService).logCreate(eq("INVENTORY"), eq(50L), contains("RM Inventory created"));

            // Assert - Verify batch number generation audit
            verify(auditService).logBatchNumberGenerated(
                    eq(5L),
                    eq("RM-AUDIT-001"),
                    isNull(),
                    anyString(),
                    eq(Batch.CREATED_VIA_RECEIPT)
            );
        }

        @Test
        @DisplayName("Should include supplier context in batch number generation audit when supplier batch provided")
        void should_includeSupplierContext_inBatchNumberAudit() {
            // Arrange
            baseRequest.setSupplierBatchNumber("SUP-LOT-ABC");

            when(unitConversionService.getUnit("KG")).thenReturn(Optional.of(Map.of("unit_code", "KG")));
            when(batchNumberService.generateRmBatchNumber(anyString(), any(LocalDate.class), eq("SUP-LOT-ABC")))
                    .thenReturn("RM-SUP-ABC-001");
            when(batchRepository.save(any(Batch.class))).thenAnswer(invocation -> {
                Batch b = invocation.getArgument(0);
                b.setBatchId(7L);
                return b;
            });
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
                Inventory inv = invocation.getArgument(0);
                inv.setInventoryId(70L);
                return inv;
            });
            when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            receiveMaterialService.receiveMaterial(baseRequest);

            // Assert - Context should mention supplier lot
            verify(auditService).logBatchNumberGenerated(
                    eq(7L),
                    eq("RM-SUP-ABC-001"),
                    isNull(),
                    contains("supplier lot: SUP-LOT-ABC"),
                    eq(Batch.CREATED_VIA_RECEIPT)
            );
        }

        @Test
        @DisplayName("Should use RM internal context when no supplier batch number")
        void should_useRmInternalContext_whenNoSupplierBatch() {
            // Arrange
            baseRequest.setSupplierBatchNumber(null);

            when(unitConversionService.getUnit("KG")).thenReturn(Optional.of(Map.of("unit_code", "KG")));
            when(batchNumberService.generateRmBatchNumber(anyString(), any(LocalDate.class), isNull()))
                    .thenReturn("RM-INT-001");
            when(batchRepository.save(any(Batch.class))).thenAnswer(invocation -> {
                Batch b = invocation.getArgument(0);
                b.setBatchId(8L);
                return b;
            });
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
                Inventory inv = invocation.getArgument(0);
                inv.setInventoryId(80L);
                return inv;
            });
            when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            receiveMaterialService.receiveMaterial(baseRequest);

            // Assert - Context should be "RM internal"
            verify(auditService).logBatchNumberGenerated(
                    eq(8L),
                    eq("RM-INT-001"),
                    isNull(),
                    eq("RM internal"),
                    eq(Batch.CREATED_VIA_RECEIPT)
            );
        }
    }

    @Nested
    @DisplayName("receiveMaterial - Movement Reason")
    class MovementReasonTests {

        @BeforeEach
        void setUpMocks() {
            mockSecurityContext();
        }

        private void stubAllMocks() {
            when(unitConversionService.getUnit("KG")).thenReturn(Optional.of(Map.of("unit_code", "KG")));
            when(batchNumberService.generateRmBatchNumber(anyString(), any(LocalDate.class), any()))
                    .thenReturn("RM-BATCH-001");
            when(batchRepository.save(any(Batch.class))).thenAnswer(invocation -> {
                Batch b = invocation.getArgument(0);
                b.setBatchId(1L);
                return b;
            });
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
                Inventory inv = invocation.getArgument(0);
                inv.setInventoryId(10L);
                return inv;
            });
            when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));
        }

        @Test
        @DisplayName("Should include notes in movement reason when notes provided")
        void should_includeNotes_inMovementReason() {
            // Arrange
            baseRequest.setNotes("Priority delivery for urgent order");
            stubAllMocks();

            // Act
            receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            ArgumentCaptor<InventoryMovement> movementCaptor = ArgumentCaptor.forClass(InventoryMovement.class);
            verify(movementRepository).save(movementCaptor.capture());
            assertEquals("Goods receipt: Priority delivery for urgent order", movementCaptor.getValue().getReason());
        }

        @Test
        @DisplayName("Should use default reason when notes is null")
        void should_useDefaultReason_whenNotesIsNull() {
            // Arrange
            baseRequest.setNotes(null);
            stubAllMocks();

            // Act
            receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            ArgumentCaptor<InventoryMovement> movementCaptor = ArgumentCaptor.forClass(InventoryMovement.class);
            verify(movementRepository).save(movementCaptor.capture());
            assertEquals("Goods receipt: RM entry", movementCaptor.getValue().getReason());
        }
    }

    @Nested
    @DisplayName("receiveMaterial - Security Context")
    class SecurityContextTests {

        @Test
        @DisplayName("Should use SYSTEM when SecurityContext has no authentication")
        void should_useSystem_whenNoAuthentication() {
            // Arrange - Do NOT mock security context; default context has no authentication
            SecurityContextHolder.clearContext();

            when(unitConversionService.getUnit("KG")).thenReturn(Optional.of(Map.of("unit_code", "KG")));
            when(batchNumberService.generateRmBatchNumber(anyString(), any(LocalDate.class), any()))
                    .thenReturn("RM-BATCH-001");
            when(batchRepository.save(any(Batch.class))).thenAnswer(invocation -> {
                Batch b = invocation.getArgument(0);
                b.setBatchId(1L);
                return b;
            });
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> {
                Inventory inv = invocation.getArgument(0);
                inv.setInventoryId(10L);
                return inv;
            });
            when(movementRepository.save(any(InventoryMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            receiveMaterialService.receiveMaterial(baseRequest);

            // Assert
            ArgumentCaptor<Batch> batchCaptor = ArgumentCaptor.forClass(Batch.class);
            verify(batchRepository).save(batchCaptor.capture());
            assertEquals("SYSTEM", batchCaptor.getValue().getCreatedBy());

            ArgumentCaptor<Inventory> inventoryCaptor = ArgumentCaptor.forClass(Inventory.class);
            verify(inventoryRepository).save(inventoryCaptor.capture());
            assertEquals("SYSTEM", inventoryCaptor.getValue().getCreatedBy());
        }
    }
}
