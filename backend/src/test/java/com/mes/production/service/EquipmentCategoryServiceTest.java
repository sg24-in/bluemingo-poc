package com.mes.production.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquipmentCategoryServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private EquipmentCategoryService equipmentCategoryService;

    private Map<String, Object> meltingConfig;
    private Map<String, Object> castingConfig;

    @BeforeEach
    void setUp() {
        meltingConfig = new HashMap<>();
        meltingConfig.put("equipment_category", "MELTING");
        meltingConfig.put("display_name", "Electric Arc Furnace");
        meltingConfig.put("min_capacity", new BigDecimal("10"));
        meltingConfig.put("max_capacity", new BigDecimal("500"));
        meltingConfig.put("min_temperature", new BigDecimal("1500"));
        meltingConfig.put("max_temperature", new BigDecimal("1800"));
        meltingConfig.put("maintenance_interval_hours", 720);
        meltingConfig.put("requires_operator", true);
        meltingConfig.put("requires_calibration", true);

        castingConfig = new HashMap<>();
        castingConfig.put("equipment_category", "CASTING");
        castingConfig.put("display_name", "Continuous Caster");
        castingConfig.put("min_capacity", new BigDecimal("5"));
        castingConfig.put("max_capacity", new BigDecimal("100"));
        castingConfig.put("min_temperature", new BigDecimal("1400"));
        castingConfig.put("max_temperature", new BigDecimal("1600"));
        castingConfig.put("maintenance_interval_hours", 480);
        castingConfig.put("requires_operator", true);
        castingConfig.put("requires_calibration", false);
    }

    @Test
    void getAllEquipmentCategories_shouldReturnAllActiveCategories() {
        List<Map<String, Object>> categories = Arrays.asList(meltingConfig, castingConfig);
        when(jdbcTemplate.queryForList(anyString())).thenReturn(categories);

        List<Map<String, Object>> result = equipmentCategoryService.getAllEquipmentCategories();

        assertEquals(2, result.size());
        assertEquals("MELTING", result.get(0).get("equipment_category"));
        assertEquals("CASTING", result.get(1).get("equipment_category"));
    }

    @Test
    void getEquipmentCategoryConfig_shouldReturnConfigWhenFound() {
        when(jdbcTemplate.queryForList(anyString(), eq("MELTING")))
                .thenReturn(Collections.singletonList(meltingConfig));

        Optional<Map<String, Object>> result = equipmentCategoryService.getEquipmentCategoryConfig("MELTING");

        assertTrue(result.isPresent());
        assertEquals("Electric Arc Furnace", result.get().get("display_name"));
    }

    @Test
    void getEquipmentCategoryConfig_shouldReturnEmptyWhenNotFound() {
        when(jdbcTemplate.queryForList(anyString(), eq("UNKNOWN")))
                .thenReturn(Collections.emptyList());

        Optional<Map<String, Object>> result = equipmentCategoryService.getEquipmentCategoryConfig("UNKNOWN");

        assertTrue(result.isEmpty());
    }

    @Test
    void validateCapacity_shouldPassForValidCapacity() {
        when(jdbcTemplate.queryForList(anyString(), eq("MELTING")))
                .thenReturn(Collections.singletonList(meltingConfig));

        EquipmentCategoryService.ValidationResult result =
                equipmentCategoryService.validateCapacity("MELTING", new BigDecimal("100"));

        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
    }

    @Test
    void validateCapacity_shouldFailForCapacityBelowMinimum() {
        when(jdbcTemplate.queryForList(anyString(), eq("MELTING")))
                .thenReturn(Collections.singletonList(meltingConfig));

        EquipmentCategoryService.ValidationResult result =
                equipmentCategoryService.validateCapacity("MELTING", new BigDecimal("5"));

        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).contains("below minimum"));
    }

    @Test
    void validateCapacity_shouldFailForCapacityAboveMaximum() {
        when(jdbcTemplate.queryForList(anyString(), eq("MELTING")))
                .thenReturn(Collections.singletonList(meltingConfig));

        EquipmentCategoryService.ValidationResult result =
                equipmentCategoryService.validateCapacity("MELTING", new BigDecimal("600"));

        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).contains("exceeds maximum"));
    }

    @Test
    void validateCapacity_shouldWarnForUnknownCategory() {
        when(jdbcTemplate.queryForList(anyString(), eq("UNKNOWN")))
                .thenReturn(Collections.emptyList());

        EquipmentCategoryService.ValidationResult result =
                equipmentCategoryService.validateCapacity("UNKNOWN", new BigDecimal("100"));

        assertTrue(result.isValid()); // Not invalid, just warning
        assertEquals(1, result.getWarnings().size());
        assertTrue(result.getWarnings().get(0).contains("No configuration found"));
    }

    @Test
    void validateTemperature_shouldPassForValidTemperature() {
        when(jdbcTemplate.queryForList(anyString(), eq("MELTING")))
                .thenReturn(Collections.singletonList(meltingConfig));

        EquipmentCategoryService.ValidationResult result =
                equipmentCategoryService.validateTemperature("MELTING", new BigDecimal("1650"));

        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
    }

    @Test
    void validateTemperature_shouldFailForTemperatureBelowMinimum() {
        when(jdbcTemplate.queryForList(anyString(), eq("MELTING")))
                .thenReturn(Collections.singletonList(meltingConfig));

        EquipmentCategoryService.ValidationResult result =
                equipmentCategoryService.validateTemperature("MELTING", new BigDecimal("1400"));

        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).contains("below minimum"));
    }

    @Test
    void validateTemperature_shouldFailForTemperatureAboveMaximum() {
        when(jdbcTemplate.queryForList(anyString(), eq("MELTING")))
                .thenReturn(Collections.singletonList(meltingConfig));

        EquipmentCategoryService.ValidationResult result =
                equipmentCategoryService.validateTemperature("MELTING", new BigDecimal("1900"));

        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).contains("exceeds maximum"));
    }

    @Test
    void validateTemperature_shouldWarnWhenCloseToMinimum() {
        when(jdbcTemplate.queryForList(anyString(), eq("MELTING")))
                .thenReturn(Collections.singletonList(meltingConfig));

        // Within 5% of min (range is 300, so 5% = 15, min is 1500, so 1505 is close)
        EquipmentCategoryService.ValidationResult result =
                equipmentCategoryService.validateTemperature("MELTING", new BigDecimal("1505"));

        assertTrue(result.isValid());
        assertEquals(1, result.getWarnings().size());
        assertTrue(result.getWarnings().get(0).contains("close to minimum"));
    }

    @Test
    void validateTemperature_shouldWarnWhenCloseToMaximum() {
        when(jdbcTemplate.queryForList(anyString(), eq("MELTING")))
                .thenReturn(Collections.singletonList(meltingConfig));

        // Within 5% of max (range is 300, so 5% = 15, max is 1800, so 1795 is close)
        EquipmentCategoryService.ValidationResult result =
                equipmentCategoryService.validateTemperature("MELTING", new BigDecimal("1795"));

        assertTrue(result.isValid());
        assertEquals(1, result.getWarnings().size());
        assertTrue(result.getWarnings().get(0).contains("close to maximum"));
    }

    @Test
    void requiresOperator_shouldReturnTrueWhenRequired() {
        when(jdbcTemplate.queryForList(anyString(), eq("MELTING")))
                .thenReturn(Collections.singletonList(meltingConfig));

        boolean result = equipmentCategoryService.requiresOperator("MELTING");

        assertTrue(result);
    }

    @Test
    void requiresOperator_shouldReturnTrueByDefaultForUnknownCategory() {
        when(jdbcTemplate.queryForList(anyString(), eq("UNKNOWN")))
                .thenReturn(Collections.emptyList());

        boolean result = equipmentCategoryService.requiresOperator("UNKNOWN");

        assertTrue(result); // Default is true
    }

    @Test
    void requiresCalibration_shouldReturnTrueWhenRequired() {
        when(jdbcTemplate.queryForList(anyString(), eq("MELTING")))
                .thenReturn(Collections.singletonList(meltingConfig));

        boolean result = equipmentCategoryService.requiresCalibration("MELTING");

        assertTrue(result);
    }

    @Test
    void requiresCalibration_shouldReturnFalseWhenNotRequired() {
        when(jdbcTemplate.queryForList(anyString(), eq("CASTING")))
                .thenReturn(Collections.singletonList(castingConfig));

        boolean result = equipmentCategoryService.requiresCalibration("CASTING");

        assertFalse(result);
    }

    @Test
    void getMaintenanceIntervalHours_shouldReturnIntervalWhenConfigured() {
        when(jdbcTemplate.queryForList(anyString(), eq("MELTING")))
                .thenReturn(Collections.singletonList(meltingConfig));

        Optional<Integer> result = equipmentCategoryService.getMaintenanceIntervalHours("MELTING");

        assertTrue(result.isPresent());
        assertEquals(720, result.get());
    }

    @Test
    void getMaintenanceIntervalHours_shouldReturnEmptyForUnknownCategory() {
        when(jdbcTemplate.queryForList(anyString(), eq("UNKNOWN")))
                .thenReturn(Collections.emptyList());

        Optional<Integer> result = equipmentCategoryService.getMaintenanceIntervalHours("UNKNOWN");

        assertTrue(result.isEmpty());
    }
}
