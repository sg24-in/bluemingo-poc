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
class EquipmentTypeServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private EquipmentTypeService equipmentTypeService;

    private Map<String, Object> furnaceConfig;
    private Map<String, Object> craneConfig;

    @BeforeEach
    void setUp() {
        furnaceConfig = new HashMap<>();
        furnaceConfig.put("equipment_type", "FURNACE");
        furnaceConfig.put("display_name", "Electric Arc Furnace");
        furnaceConfig.put("min_capacity", new BigDecimal("10"));
        furnaceConfig.put("max_capacity", new BigDecimal("500"));
        furnaceConfig.put("min_temperature", new BigDecimal("1500"));
        furnaceConfig.put("max_temperature", new BigDecimal("1800"));
        furnaceConfig.put("maintenance_interval_hours", 720);
        furnaceConfig.put("requires_operator", true);
        furnaceConfig.put("requires_calibration", true);

        craneConfig = new HashMap<>();
        craneConfig.put("equipment_type", "CRANE");
        craneConfig.put("display_name", "Overhead Crane");
        craneConfig.put("min_capacity", new BigDecimal("5"));
        craneConfig.put("max_capacity", new BigDecimal("100"));
        craneConfig.put("min_temperature", null);
        craneConfig.put("max_temperature", null);
        craneConfig.put("maintenance_interval_hours", 720);
        craneConfig.put("requires_operator", true);
        craneConfig.put("requires_calibration", false);
    }

    @Test
    void getAllEquipmentTypes_shouldReturnAllActiveTypes() {
        List<Map<String, Object>> types = Arrays.asList(furnaceConfig, craneConfig);
        when(jdbcTemplate.queryForList(anyString())).thenReturn(types);

        List<Map<String, Object>> result = equipmentTypeService.getAllEquipmentTypes();

        assertEquals(2, result.size());
        assertEquals("FURNACE", result.get(0).get("equipment_type"));
        assertEquals("CRANE", result.get(1).get("equipment_type"));
    }

    @Test
    void getEquipmentTypeConfig_shouldReturnConfigWhenFound() {
        when(jdbcTemplate.queryForList(anyString(), eq("FURNACE")))
                .thenReturn(Collections.singletonList(furnaceConfig));

        Optional<Map<String, Object>> result = equipmentTypeService.getEquipmentTypeConfig("FURNACE");

        assertTrue(result.isPresent());
        assertEquals("Electric Arc Furnace", result.get().get("display_name"));
    }

    @Test
    void getEquipmentTypeConfig_shouldReturnEmptyWhenNotFound() {
        when(jdbcTemplate.queryForList(anyString(), eq("UNKNOWN")))
                .thenReturn(Collections.emptyList());

        Optional<Map<String, Object>> result = equipmentTypeService.getEquipmentTypeConfig("UNKNOWN");

        assertTrue(result.isEmpty());
    }

    @Test
    void validateCapacity_shouldPassForValidCapacity() {
        when(jdbcTemplate.queryForList(anyString(), eq("FURNACE")))
                .thenReturn(Collections.singletonList(furnaceConfig));

        EquipmentTypeService.ValidationResult result =
                equipmentTypeService.validateCapacity("FURNACE", new BigDecimal("100"));

        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
    }

    @Test
    void validateCapacity_shouldFailForCapacityBelowMinimum() {
        when(jdbcTemplate.queryForList(anyString(), eq("FURNACE")))
                .thenReturn(Collections.singletonList(furnaceConfig));

        EquipmentTypeService.ValidationResult result =
                equipmentTypeService.validateCapacity("FURNACE", new BigDecimal("5"));

        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).contains("below minimum"));
    }

    @Test
    void validateCapacity_shouldFailForCapacityAboveMaximum() {
        when(jdbcTemplate.queryForList(anyString(), eq("FURNACE")))
                .thenReturn(Collections.singletonList(furnaceConfig));

        EquipmentTypeService.ValidationResult result =
                equipmentTypeService.validateCapacity("FURNACE", new BigDecimal("600"));

        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).contains("exceeds maximum"));
    }

    @Test
    void validateCapacity_shouldWarnForUnknownType() {
        when(jdbcTemplate.queryForList(anyString(), eq("UNKNOWN")))
                .thenReturn(Collections.emptyList());

        EquipmentTypeService.ValidationResult result =
                equipmentTypeService.validateCapacity("UNKNOWN", new BigDecimal("100"));

        assertTrue(result.isValid()); // Not invalid, just warning
        assertEquals(1, result.getWarnings().size());
        assertTrue(result.getWarnings().get(0).contains("No configuration found"));
    }

    @Test
    void validateTemperature_shouldPassForValidTemperature() {
        when(jdbcTemplate.queryForList(anyString(), eq("FURNACE")))
                .thenReturn(Collections.singletonList(furnaceConfig));

        EquipmentTypeService.ValidationResult result =
                equipmentTypeService.validateTemperature("FURNACE", new BigDecimal("1650"));

        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
    }

    @Test
    void validateTemperature_shouldFailForTemperatureBelowMinimum() {
        when(jdbcTemplate.queryForList(anyString(), eq("FURNACE")))
                .thenReturn(Collections.singletonList(furnaceConfig));

        EquipmentTypeService.ValidationResult result =
                equipmentTypeService.validateTemperature("FURNACE", new BigDecimal("1400"));

        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).contains("below minimum"));
    }

    @Test
    void validateTemperature_shouldFailForTemperatureAboveMaximum() {
        when(jdbcTemplate.queryForList(anyString(), eq("FURNACE")))
                .thenReturn(Collections.singletonList(furnaceConfig));

        EquipmentTypeService.ValidationResult result =
                equipmentTypeService.validateTemperature("FURNACE", new BigDecimal("1900"));

        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).contains("exceeds maximum"));
    }

    @Test
    void validateTemperature_shouldWarnWhenCloseToMinimum() {
        when(jdbcTemplate.queryForList(anyString(), eq("FURNACE")))
                .thenReturn(Collections.singletonList(furnaceConfig));

        // Within 5% of min (range is 300, so 5% = 15, min is 1500, so 1505 is close)
        EquipmentTypeService.ValidationResult result =
                equipmentTypeService.validateTemperature("FURNACE", new BigDecimal("1505"));

        assertTrue(result.isValid());
        assertEquals(1, result.getWarnings().size());
        assertTrue(result.getWarnings().get(0).contains("close to minimum"));
    }

    @Test
    void validateTemperature_shouldWarnWhenCloseToMaximum() {
        when(jdbcTemplate.queryForList(anyString(), eq("FURNACE")))
                .thenReturn(Collections.singletonList(furnaceConfig));

        // Within 5% of max (range is 300, so 5% = 15, max is 1800, so 1795 is close)
        EquipmentTypeService.ValidationResult result =
                equipmentTypeService.validateTemperature("FURNACE", new BigDecimal("1795"));

        assertTrue(result.isValid());
        assertEquals(1, result.getWarnings().size());
        assertTrue(result.getWarnings().get(0).contains("close to maximum"));
    }

    @Test
    void requiresOperator_shouldReturnTrueWhenRequired() {
        when(jdbcTemplate.queryForList(anyString(), eq("FURNACE")))
                .thenReturn(Collections.singletonList(furnaceConfig));

        boolean result = equipmentTypeService.requiresOperator("FURNACE");

        assertTrue(result);
    }

    @Test
    void requiresOperator_shouldReturnTrueByDefaultForUnknownType() {
        when(jdbcTemplate.queryForList(anyString(), eq("UNKNOWN")))
                .thenReturn(Collections.emptyList());

        boolean result = equipmentTypeService.requiresOperator("UNKNOWN");

        assertTrue(result); // Default is true
    }

    @Test
    void requiresCalibration_shouldReturnTrueWhenRequired() {
        when(jdbcTemplate.queryForList(anyString(), eq("FURNACE")))
                .thenReturn(Collections.singletonList(furnaceConfig));

        boolean result = equipmentTypeService.requiresCalibration("FURNACE");

        assertTrue(result);
    }

    @Test
    void requiresCalibration_shouldReturnFalseWhenNotRequired() {
        when(jdbcTemplate.queryForList(anyString(), eq("CRANE")))
                .thenReturn(Collections.singletonList(craneConfig));

        boolean result = equipmentTypeService.requiresCalibration("CRANE");

        assertFalse(result);
    }

    @Test
    void getMaintenanceIntervalHours_shouldReturnIntervalWhenConfigured() {
        when(jdbcTemplate.queryForList(anyString(), eq("FURNACE")))
                .thenReturn(Collections.singletonList(furnaceConfig));

        Optional<Integer> result = equipmentTypeService.getMaintenanceIntervalHours("FURNACE");

        assertTrue(result.isPresent());
        assertEquals(720, result.get());
    }

    @Test
    void getMaintenanceIntervalHours_shouldReturnEmptyForUnknownType() {
        when(jdbcTemplate.queryForList(anyString(), eq("UNKNOWN")))
                .thenReturn(Collections.emptyList());

        Optional<Integer> result = equipmentTypeService.getMaintenanceIntervalHours("UNKNOWN");

        assertTrue(result.isEmpty());
    }
}
