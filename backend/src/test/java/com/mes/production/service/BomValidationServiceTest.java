package com.mes.production.service;

import com.mes.production.dto.BomDTO;
import com.mes.production.entity.BillOfMaterial;
import com.mes.production.repository.BomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BomValidationServiceTest {

    @Mock
    private BomRepository bomRepository;

    @InjectMocks
    private BomValidationService bomValidationService;

    private BillOfMaterial testBom;

    @BeforeEach
    void setUp() {
        testBom = BillOfMaterial.builder()
                .bomId(1L)
                .productSku("STEEL-001")
                .bomVersion("1.0")
                .materialId("RM-001")
                .materialName("Iron Ore")
                .quantityRequired(new BigDecimal("100.00"))
                .unit("KG")
                .yieldLossRatio(new BigDecimal("1.05"))
                .sequenceLevel(1)
                .status("ACTIVE")
                .build();
    }

    @Test
    @DisplayName("Should get BOM requirements for product")
    void getBomRequirements_ValidProduct_ReturnsRequirements() {
        // Arrange
        when(bomRepository.findActiveByProductSkuOrderByLevel("STEEL-001"))
                .thenReturn(List.of(testBom));
        when(bomRepository.findDistinctLevelsByProductSku("STEEL-001"))
                .thenReturn(List.of(1));

        // Act
        BomDTO.BomTreeResponse response = bomValidationService.getBomRequirements("STEEL-001");

        // Assert
        assertNotNull(response);
        assertEquals("STEEL-001", response.getProductSku());
        assertEquals(1, response.getRequirements().size());
        assertEquals("RM-001", response.getRequirements().get(0).getMaterialId());
        assertEquals("Iron Ore", response.getRequirements().get(0).getMaterialName());
        assertEquals(new BigDecimal("100.00"), response.getRequirements().get(0).getQuantityRequired());
    }

    @Test
    @DisplayName("Should return empty requirements when no BOM found")
    void getBomRequirements_NoBom_ReturnsEmptyList() {
        // Arrange
        when(bomRepository.findActiveByProductSkuOrderByLevel("UNKNOWN"))
                .thenReturn(List.of());
        when(bomRepository.findDistinctLevelsByProductSku("UNKNOWN"))
                .thenReturn(List.of());

        // Act
        BomDTO.BomTreeResponse response = bomValidationService.getBomRequirements("UNKNOWN");

        // Assert
        assertNotNull(response);
        assertEquals("UNKNOWN", response.getProductSku());
        assertTrue(response.getRequirements().isEmpty());
    }

    @Test
    @DisplayName("Should get BOM requirements for specific level")
    void getBomRequirementsForLevel_ValidLevel_ReturnsLevelRequirements() {
        // Arrange
        when(bomRepository.findByProductSkuAndSequenceLevel("STEEL-001", 1))
                .thenReturn(List.of(testBom));

        // Act
        List<BomDTO.BomRequirement> result = bomValidationService.getBomRequirementsForLevel("STEEL-001", 1);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1, result.get(0).getSequenceLevel());
    }

    @Test
    @DisplayName("Should validate consumption meeting BOM - no warnings")
    void validateConsumption_MeetsBom_NoWarnings() {
        // Arrange
        BomDTO.BomValidationRequest request = BomDTO.BomValidationRequest.builder()
                .productSku("STEEL-001")
                .materialsConsumed(List.of(
                        BomDTO.MaterialConsumption.builder()
                                .materialId("RM-001")
                                .quantity(new BigDecimal("100.00"))
                                .build()
                ))
                .build();

        when(bomRepository.findActiveByProductSkuOrderByLevel("STEEL-001"))
                .thenReturn(List.of(testBom));

        // Act
        BomDTO.BomValidationResult result = bomValidationService.validateConsumption(request);

        // Assert
        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
        assertTrue(result.getWarnings().isEmpty());
        assertEquals(1, result.getRequirementChecks().size());
        assertEquals("MET", result.getRequirementChecks().get(0).getStatus());
    }

    @Test
    @DisplayName("Should validate consumption with variance over 5% - returns warning")
    void validateConsumption_VarianceOver5Percent_ReturnsWarning() {
        // Arrange
        BomDTO.BomValidationRequest request = BomDTO.BomValidationRequest.builder()
                .productSku("STEEL-001")
                .materialsConsumed(List.of(
                        BomDTO.MaterialConsumption.builder()
                                .materialId("RM-001")
                                .quantity(new BigDecimal("120.00")) // 20% over
                                .build()
                ))
                .build();

        when(bomRepository.findActiveByProductSkuOrderByLevel("STEEL-001"))
                .thenReturn(List.of(testBom));

        // Act
        BomDTO.BomValidationResult result = bomValidationService.validateConsumption(request);

        // Assert
        assertTrue(result.isValid()); // Still valid, just has warning
        assertFalse(result.getWarnings().isEmpty());
        assertTrue(result.getWarnings().get(0).contains("exceeds 5%"));
        assertEquals("WARNING", result.getRequirementChecks().get(0).getStatus());
    }

    @Test
    @DisplayName("Should validate consumption with insufficient material - returns error")
    void validateConsumption_InsufficientMaterial_ReturnsError() {
        // Arrange
        BomDTO.BomValidationRequest request = BomDTO.BomValidationRequest.builder()
                .productSku("STEEL-001")
                .materialsConsumed(List.of(
                        BomDTO.MaterialConsumption.builder()
                                .materialId("RM-001")
                                .quantity(new BigDecimal("50.00")) // Insufficient
                                .build()
                ))
                .build();

        when(bomRepository.findActiveByProductSkuOrderByLevel("STEEL-001"))
                .thenReturn(List.of(testBom));

        // Act
        BomDTO.BomValidationResult result = bomValidationService.validateConsumption(request);

        // Assert
        assertFalse(result.isValid());
        assertFalse(result.getErrors().isEmpty());
        assertTrue(result.getErrors().get(0).contains("Insufficient"));
        assertEquals("INSUFFICIENT", result.getRequirementChecks().get(0).getStatus());
    }

    @Test
    @DisplayName("Should handle validation with no BOM - returns warning")
    void validateConsumption_NoBomFound_ReturnsWarning() {
        // Arrange
        BomDTO.BomValidationRequest request = BomDTO.BomValidationRequest.builder()
                .productSku("UNKNOWN")
                .materialsConsumed(List.of())
                .build();

        when(bomRepository.findActiveByProductSkuOrderByLevel("UNKNOWN"))
                .thenReturn(List.of());

        // Act
        BomDTO.BomValidationResult result = bomValidationService.validateConsumption(request);

        // Assert
        assertTrue(result.isValid());
        assertFalse(result.getWarnings().isEmpty());
        assertTrue(result.getWarnings().get(0).contains("No BOM found"));
    }

    @Test
    @DisplayName("Should validate consumption with target quantity scaling")
    void validateConsumption_WithTargetQuantity_ScalesRequirements() {
        // Arrange
        BomDTO.BomValidationRequest request = BomDTO.BomValidationRequest.builder()
                .productSku("STEEL-001")
                .targetQuantity(new BigDecimal("2.0")) // Double the target
                .materialsConsumed(List.of(
                        BomDTO.MaterialConsumption.builder()
                                .materialId("RM-001")
                                .quantity(new BigDecimal("210.00")) // 2 * 100 * 1.05 yield ratio = 210
                                .build()
                ))
                .build();

        when(bomRepository.findActiveByProductSkuOrderByLevel("STEEL-001"))
                .thenReturn(List.of(testBom));

        // Act
        BomDTO.BomValidationResult result = bomValidationService.validateConsumption(request);

        // Assert
        assertTrue(result.isValid());
        assertEquals(0, new BigDecimal("210.00").compareTo(result.getRequirementChecks().get(0).getRequiredQuantity()));
    }

    @Test
    @DisplayName("Should handle missing material in consumption")
    void validateConsumption_MissingMaterial_ReturnsError() {
        // Arrange
        BomDTO.BomValidationRequest request = BomDTO.BomValidationRequest.builder()
                .productSku("STEEL-001")
                .materialsConsumed(List.of()) // No materials provided
                .build();

        when(bomRepository.findActiveByProductSkuOrderByLevel("STEEL-001"))
                .thenReturn(List.of(testBom));

        // Act
        BomDTO.BomValidationResult result = bomValidationService.validateConsumption(request);

        // Assert
        assertFalse(result.isValid());
        assertFalse(result.getErrors().isEmpty());
        assertEquals("INSUFFICIENT", result.getRequirementChecks().get(0).getStatus());
    }

    @Test
    @DisplayName("Should aggregate multiple materials with same ID")
    void validateConsumption_MultipleSameMaterial_AggregatesQuantity() {
        // Arrange
        BomDTO.BomValidationRequest request = BomDTO.BomValidationRequest.builder()
                .productSku("STEEL-001")
                .materialsConsumed(List.of(
                        BomDTO.MaterialConsumption.builder()
                                .materialId("RM-001")
                                .quantity(new BigDecimal("50.00"))
                                .build(),
                        BomDTO.MaterialConsumption.builder()
                                .materialId("RM-001")
                                .quantity(new BigDecimal("50.00"))
                                .build()
                ))
                .build();

        when(bomRepository.findActiveByProductSkuOrderByLevel("STEEL-001"))
                .thenReturn(List.of(testBom));

        // Act
        BomDTO.BomValidationResult result = bomValidationService.validateConsumption(request);

        // Assert
        assertTrue(result.isValid());
        assertEquals(new BigDecimal("100.00"), result.getRequirementChecks().get(0).getActualQuantity());
    }
}
