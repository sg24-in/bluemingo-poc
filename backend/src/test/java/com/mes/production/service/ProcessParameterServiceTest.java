package com.mes.production.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProcessParameterServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private ProcessParameterService parameterService;

    private List<Map<String, Object>> testConfigs;

    @BeforeEach
    void setUp() {
        Map<String, Object> tempConfig = new HashMap<>();
        tempConfig.put("config_id", 1L);
        tempConfig.put("operation_type", "ROLLING");
        tempConfig.put("product_sku", "STEEL-001");
        tempConfig.put("parameter_name", "temperature");
        tempConfig.put("parameter_type", "NUMERIC");
        tempConfig.put("unit", "°C");
        tempConfig.put("min_value", new BigDecimal("800.00"));
        tempConfig.put("max_value", new BigDecimal("1200.00"));
        tempConfig.put("default_value", new BigDecimal("1000.00"));
        tempConfig.put("is_required", true);
        tempConfig.put("display_order", 1);

        Map<String, Object> pressureConfig = new HashMap<>();
        pressureConfig.put("config_id", 2L);
        pressureConfig.put("operation_type", "ROLLING");
        pressureConfig.put("product_sku", "STEEL-001");
        pressureConfig.put("parameter_name", "pressure");
        pressureConfig.put("parameter_type", "NUMERIC");
        pressureConfig.put("unit", "bar");
        pressureConfig.put("min_value", new BigDecimal("5.00"));
        pressureConfig.put("max_value", new BigDecimal("15.00"));
        pressureConfig.put("default_value", new BigDecimal("10.00"));
        pressureConfig.put("is_required", false);
        pressureConfig.put("display_order", 2);

        testConfigs = List.of(tempConfig, pressureConfig);
    }

    @Test
    @DisplayName("Should get configured parameters")
    void getConfiguredParameters_ValidOperationType_ReturnsConfigs() {
        // Arrange
        doReturn(testConfigs).when(jdbcTemplate).queryForList(anyString(), eq("ROLLING"), eq("STEEL-001"));

        // Act
        List<Map<String, Object>> result = parameterService.getConfiguredParameters("ROLLING", "STEEL-001");

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("temperature", result.get(0).get("parameter_name"));
    }

    @Test
    @DisplayName("Should validate parameters successfully")
    void validateParameters_ValidParams_ReturnsValidResult() {
        // Arrange
        doReturn(testConfigs).when(jdbcTemplate).queryForList(anyString(), eq("ROLLING"), eq("STEEL-001"));

        Map<String, Object> params = new HashMap<>();
        params.put("temperature", "1000");
        params.put("pressure", "10");

        // Act
        ProcessParameterService.ValidationResult result = parameterService.validateParameters("ROLLING", "STEEL-001", params);

        // Assert
        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
    }

    @Test
    @DisplayName("Should fail validation when required parameter missing")
    void validateParameters_MissingRequired_ReturnsInvalid() {
        // Arrange
        doReturn(testConfigs).when(jdbcTemplate).queryForList(anyString(), eq("ROLLING"), eq("STEEL-001"));

        Map<String, Object> params = new HashMap<>();
        params.put("pressure", "10"); // temperature is missing

        // Act
        ProcessParameterService.ValidationResult result = parameterService.validateParameters("ROLLING", "STEEL-001", params);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(e -> e.contains("temperature") && e.contains("missing")));
    }

    @Test
    @DisplayName("Should fail validation when value below minimum")
    void validateParameters_BelowMinimum_ReturnsInvalid() {
        // Arrange
        doReturn(testConfigs).when(jdbcTemplate).queryForList(anyString(), eq("ROLLING"), eq("STEEL-001"));

        Map<String, Object> params = new HashMap<>();
        params.put("temperature", "700"); // Below min of 800
        params.put("pressure", "10");

        // Act
        ProcessParameterService.ValidationResult result = parameterService.validateParameters("ROLLING", "STEEL-001", params);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(e -> e.contains("temperature") && e.contains("below minimum")));
    }

    @Test
    @DisplayName("Should fail validation when value above maximum")
    void validateParameters_AboveMaximum_ReturnsInvalid() {
        // Arrange
        doReturn(testConfigs).when(jdbcTemplate).queryForList(anyString(), eq("ROLLING"), eq("STEEL-001"));

        Map<String, Object> params = new HashMap<>();
        params.put("temperature", "1300"); // Above max of 1200
        params.put("pressure", "10");

        // Act
        ProcessParameterService.ValidationResult result = parameterService.validateParameters("ROLLING", "STEEL-001", params);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(e -> e.contains("temperature") && e.contains("exceeds maximum")));
    }

    @Test
    @DisplayName("Should add warning when value close to minimum")
    void validateParameters_CloseToMinimum_AddsWarning() {
        // Arrange
        doReturn(testConfigs).when(jdbcTemplate).queryForList(anyString(), eq("ROLLING"), eq("STEEL-001"));

        Map<String, Object> params = new HashMap<>();
        params.put("temperature", "810"); // Close to min of 800 (within 10% of range = 40)
        params.put("pressure", "10");

        // Act
        ProcessParameterService.ValidationResult result = parameterService.validateParameters("ROLLING", "STEEL-001", params);

        // Assert
        assertTrue(result.isValid());
        assertTrue(result.getWarnings().stream().anyMatch(w -> w.contains("temperature") && w.contains("close to minimum")));
    }

    @Test
    @DisplayName("Should add warning when value close to maximum")
    void validateParameters_CloseToMaximum_AddsWarning() {
        // Arrange
        doReturn(testConfigs).when(jdbcTemplate).queryForList(anyString(), eq("ROLLING"), eq("STEEL-001"));

        Map<String, Object> params = new HashMap<>();
        params.put("temperature", "1190"); // Close to max of 1200
        params.put("pressure", "10");

        // Act
        ProcessParameterService.ValidationResult result = parameterService.validateParameters("ROLLING", "STEEL-001", params);

        // Assert
        assertTrue(result.isValid());
        assertTrue(result.getWarnings().stream().anyMatch(w -> w.contains("temperature") && w.contains("close to maximum")));
    }

    @Test
    @DisplayName("Should fail validation for non-numeric value")
    void validateParameters_NonNumeric_ReturnsInvalid() {
        // Arrange
        doReturn(testConfigs).when(jdbcTemplate).queryForList(anyString(), eq("ROLLING"), eq("STEEL-001"));

        Map<String, Object> params = new HashMap<>();
        params.put("temperature", "not-a-number");
        params.put("pressure", "10");

        // Act
        ProcessParameterService.ValidationResult result = parameterService.validateParameters("ROLLING", "STEEL-001", params);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(e -> e.contains("temperature") && e.contains("valid number")));
    }

    @Test
    @DisplayName("Should add warning for unexpected parameters")
    void validateParameters_UnexpectedParameter_AddsWarning() {
        // Arrange
        doReturn(testConfigs).when(jdbcTemplate).queryForList(anyString(), eq("ROLLING"), eq("STEEL-001"));

        Map<String, Object> params = new HashMap<>();
        params.put("temperature", "1000");
        params.put("unknown_param", "value");

        // Act
        ProcessParameterService.ValidationResult result = parameterService.validateParameters("ROLLING", "STEEL-001", params);

        // Assert
        assertTrue(result.isValid());
        assertTrue(result.getWarnings().stream().anyMatch(w -> w.contains("unknown_param") && w.contains("ignored")));
    }

    @Test
    @DisplayName("Should handle null parameters map")
    void validateParameters_NullParams_ReturnsInvalidForRequired() {
        // Arrange
        doReturn(testConfigs).when(jdbcTemplate).queryForList(anyString(), eq("ROLLING"), eq("STEEL-001"));

        // Act
        ProcessParameterService.ValidationResult result = parameterService.validateParameters("ROLLING", "STEEL-001", null);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(e -> e.contains("temperature") && e.contains("missing")));
    }

    @Test
    @DisplayName("Should handle empty parameters map")
    void validateParameters_EmptyParams_ReturnsInvalidForRequired() {
        // Arrange
        doReturn(testConfigs).when(jdbcTemplate).queryForList(anyString(), eq("ROLLING"), eq("STEEL-001"));

        // Act
        ProcessParameterService.ValidationResult result = parameterService.validateParameters("ROLLING", "STEEL-001", new HashMap<>());

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(e -> e.contains("temperature") && e.contains("missing")));
    }

    @Test
    @DisplayName("Should skip validation for optional empty parameters")
    void validateParameters_OptionalEmpty_SkipsValidation() {
        // Arrange
        doReturn(testConfigs).when(jdbcTemplate).queryForList(anyString(), eq("ROLLING"), eq("STEEL-001"));

        Map<String, Object> params = new HashMap<>();
        params.put("temperature", "1000");
        // pressure is optional and not provided

        // Act
        ProcessParameterService.ValidationResult result = parameterService.validateParameters("ROLLING", "STEEL-001", params);

        // Assert
        assertTrue(result.isValid());
    }

    @Test
    @DisplayName("Should handle empty string for required parameter")
    void validateParameters_EmptyStringRequired_ReturnsInvalid() {
        // Arrange
        doReturn(testConfigs).when(jdbcTemplate).queryForList(anyString(), eq("ROLLING"), eq("STEEL-001"));

        Map<String, Object> params = new HashMap<>();
        params.put("temperature", "  "); // Empty/whitespace string

        // Act
        ProcessParameterService.ValidationResult result = parameterService.validateParameters("ROLLING", "STEEL-001", params);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(e -> e.contains("temperature") && e.contains("missing")));
    }

    @Test
    @DisplayName("ValidationResult should initialize correctly")
    void validationResult_NewInstance_IsValidWithEmptyLists() {
        // Act
        ProcessParameterService.ValidationResult result = new ProcessParameterService.ValidationResult();

        // Assert
        assertTrue(result.isValid());
        assertNotNull(result.getErrors());
        assertNotNull(result.getWarnings());
        assertTrue(result.getErrors().isEmpty());
        assertTrue(result.getWarnings().isEmpty());
    }

    @Test
    @DisplayName("ValidationResult addError should set valid to false")
    void validationResult_AddError_SetsValidToFalse() {
        // Arrange
        ProcessParameterService.ValidationResult result = new ProcessParameterService.ValidationResult();

        // Act
        result.addError("Test error");

        // Assert
        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertEquals("Test error", result.getErrors().get(0));
    }

    @Test
    @DisplayName("ValidationResult addWarning should not affect valid status")
    void validationResult_AddWarning_KeepsValid() {
        // Arrange
        ProcessParameterService.ValidationResult result = new ProcessParameterService.ValidationResult();

        // Act
        result.addWarning("Test warning");

        // Assert
        assertTrue(result.isValid());
        assertEquals(1, result.getWarnings().size());
    }
}
