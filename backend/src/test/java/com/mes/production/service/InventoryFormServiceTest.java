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
class InventoryFormServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private InventoryFormService inventoryFormService;

    private Map<String, Object> moltenConfig;
    private Map<String, Object> solidConfig;
    private Map<String, Object> powderConfig;

    @BeforeEach
    void setUp() {
        moltenConfig = new HashMap<>();
        moltenConfig.put("form_code", "MOLTEN");
        moltenConfig.put("form_name", "Molten Metal");
        moltenConfig.put("tracks_temperature", true);
        moltenConfig.put("tracks_moisture", false);
        moltenConfig.put("tracks_density", true);
        moltenConfig.put("default_weight_unit", "TONS");
        moltenConfig.put("default_volume_unit", null);
        moltenConfig.put("requires_temperature_control", true);
        moltenConfig.put("min_storage_temp", new BigDecimal("1400"));
        moltenConfig.put("max_storage_temp", new BigDecimal("1700"));
        moltenConfig.put("requires_humidity_control", false);
        moltenConfig.put("max_humidity_percent", null);
        moltenConfig.put("requires_special_handling", true);
        moltenConfig.put("handling_notes", "Requires temperature monitoring. Handle with protective equipment.");
        moltenConfig.put("shelf_life_days", null);

        solidConfig = new HashMap<>();
        solidConfig.put("form_code", "SOLID");
        solidConfig.put("form_name", "Solid");
        solidConfig.put("tracks_temperature", false);
        solidConfig.put("tracks_moisture", false);
        solidConfig.put("tracks_density", true);
        solidConfig.put("default_weight_unit", "KG");
        solidConfig.put("default_volume_unit", null);
        solidConfig.put("requires_temperature_control", false);
        solidConfig.put("min_storage_temp", null);
        solidConfig.put("max_storage_temp", null);
        solidConfig.put("requires_humidity_control", false);
        solidConfig.put("max_humidity_percent", null);
        solidConfig.put("requires_special_handling", false);
        solidConfig.put("handling_notes", null);
        solidConfig.put("shelf_life_days", null);

        powderConfig = new HashMap<>();
        powderConfig.put("form_code", "POWDER");
        powderConfig.put("form_name", "Powder/Granular");
        powderConfig.put("tracks_temperature", false);
        powderConfig.put("tracks_moisture", true);
        powderConfig.put("tracks_density", true);
        powderConfig.put("default_weight_unit", "KG");
        powderConfig.put("default_volume_unit", null);
        powderConfig.put("requires_temperature_control", false);
        powderConfig.put("min_storage_temp", null);
        powderConfig.put("max_storage_temp", null);
        powderConfig.put("requires_humidity_control", true);
        powderConfig.put("max_humidity_percent", 60);
        powderConfig.put("requires_special_handling", true);
        powderConfig.put("handling_notes", "Avoid moisture exposure. Use dust extraction.");
        powderConfig.put("shelf_life_days", 180);
    }

    @Test
    void getAllForms_shouldReturnAllActiveForms() {
        List<Map<String, Object>> forms = Arrays.asList(moltenConfig, solidConfig, powderConfig);
        when(jdbcTemplate.queryForList(contains("FROM inventory_form_config")))
                .thenReturn(forms);

        List<Map<String, Object>> result = inventoryFormService.getAllForms();

        assertEquals(3, result.size());
    }

    @Test
    void getFormConfig_shouldReturnConfigWhenFound() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("MOLTEN")))
                .thenReturn(Collections.singletonList(moltenConfig));

        Optional<Map<String, Object>> result = inventoryFormService.getFormConfig("MOLTEN");

        assertTrue(result.isPresent());
        assertEquals("Molten Metal", result.get().get("form_name"));
    }

    @Test
    void getFormConfig_shouldReturnEmptyWhenNotFound() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("UNKNOWN")))
                .thenReturn(Collections.emptyList());

        Optional<Map<String, Object>> result = inventoryFormService.getFormConfig("UNKNOWN");

        assertTrue(result.isEmpty());
    }

    @Test
    void requiresTemperatureTracking_shouldReturnTrueForMolten() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("MOLTEN")))
                .thenReturn(Collections.singletonList(moltenConfig));

        assertTrue(inventoryFormService.requiresTemperatureTracking("MOLTEN"));
    }

    @Test
    void requiresTemperatureTracking_shouldReturnFalseForSolid() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("SOLID")))
                .thenReturn(Collections.singletonList(solidConfig));

        assertFalse(inventoryFormService.requiresTemperatureTracking("SOLID"));
    }

    @Test
    void requiresMoistureTracking_shouldReturnTrueForPowder() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("POWDER")))
                .thenReturn(Collections.singletonList(powderConfig));

        assertTrue(inventoryFormService.requiresMoistureTracking("POWDER"));
    }

    @Test
    void requiresMoistureTracking_shouldReturnFalseForSolid() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("SOLID")))
                .thenReturn(Collections.singletonList(solidConfig));

        assertFalse(inventoryFormService.requiresMoistureTracking("SOLID"));
    }

    @Test
    void requiresDensityTracking_shouldReturnTrueWhenConfigured() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("MOLTEN")))
                .thenReturn(Collections.singletonList(moltenConfig));

        assertTrue(inventoryFormService.requiresDensityTracking("MOLTEN"));
    }

    @Test
    void validateStorageTemperature_shouldPassForValidTemperature() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("MOLTEN")))
                .thenReturn(Collections.singletonList(moltenConfig));

        InventoryFormService.ValidationResult result =
                inventoryFormService.validateStorageTemperature("MOLTEN", new BigDecimal("1550"));

        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
    }

    @Test
    void validateStorageTemperature_shouldFailForTemperatureBelowMinimum() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("MOLTEN")))
                .thenReturn(Collections.singletonList(moltenConfig));

        InventoryFormService.ValidationResult result =
                inventoryFormService.validateStorageTemperature("MOLTEN", new BigDecimal("1300"));

        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).contains("below minimum"));
    }

    @Test
    void validateStorageTemperature_shouldFailForTemperatureAboveMaximum() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("MOLTEN")))
                .thenReturn(Collections.singletonList(moltenConfig));

        InventoryFormService.ValidationResult result =
                inventoryFormService.validateStorageTemperature("MOLTEN", new BigDecimal("1800"));

        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).contains("exceeds maximum"));
    }

    @Test
    void validateStorageTemperature_shouldFailWhenTemperatureRequiredButNull() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("MOLTEN")))
                .thenReturn(Collections.singletonList(moltenConfig));

        InventoryFormService.ValidationResult result =
                inventoryFormService.validateStorageTemperature("MOLTEN", null);

        assertFalse(result.isValid());
        assertTrue(result.getErrors().get(0).contains("required"));
    }

    @Test
    void validateStorageTemperature_shouldPassForFormWithoutTempControl() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("SOLID")))
                .thenReturn(Collections.singletonList(solidConfig));

        InventoryFormService.ValidationResult result =
                inventoryFormService.validateStorageTemperature("SOLID", null);

        assertTrue(result.isValid());
    }

    @Test
    void requiresSpecialHandling_shouldReturnTrueForMolten() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("MOLTEN")))
                .thenReturn(Collections.singletonList(moltenConfig));

        assertTrue(inventoryFormService.requiresSpecialHandling("MOLTEN"));
    }

    @Test
    void requiresSpecialHandling_shouldReturnFalseForSolid() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("SOLID")))
                .thenReturn(Collections.singletonList(solidConfig));

        assertFalse(inventoryFormService.requiresSpecialHandling("SOLID"));
    }

    @Test
    void getHandlingNotes_shouldReturnNotesWhenPresent() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("MOLTEN")))
                .thenReturn(Collections.singletonList(moltenConfig));

        Optional<String> result = inventoryFormService.getHandlingNotes("MOLTEN");

        assertTrue(result.isPresent());
        assertTrue(result.get().contains("protective equipment"));
    }

    @Test
    void getHandlingNotes_shouldReturnEmptyWhenNotPresent() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("SOLID")))
                .thenReturn(Collections.singletonList(solidConfig));

        Optional<String> result = inventoryFormService.getHandlingNotes("SOLID");

        assertTrue(result.isEmpty());
    }

    @Test
    void getShelfLifeDays_shouldReturnDaysWhenConfigured() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("POWDER")))
                .thenReturn(Collections.singletonList(powderConfig));

        Optional<Integer> result = inventoryFormService.getShelfLifeDays("POWDER");

        assertTrue(result.isPresent());
        assertEquals(180, result.get());
    }

    @Test
    void getShelfLifeDays_shouldReturnEmptyWhenNotConfigured() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("SOLID")))
                .thenReturn(Collections.singletonList(solidConfig));

        Optional<Integer> result = inventoryFormService.getShelfLifeDays("SOLID");

        assertTrue(result.isEmpty());
    }

    @Test
    void getDefaultWeightUnit_shouldReturnConfiguredUnit() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("MOLTEN")))
                .thenReturn(Collections.singletonList(moltenConfig));

        String result = inventoryFormService.getDefaultWeightUnit("MOLTEN");

        assertEquals("TONS", result);
    }

    @Test
    void getDefaultWeightUnit_shouldReturnKgForUnknownForm() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("UNKNOWN")))
                .thenReturn(Collections.emptyList());

        String result = inventoryFormService.getDefaultWeightUnit("UNKNOWN");

        assertEquals("KG", result);
    }

    @Test
    void getDefaultVolumeUnit_shouldReturnEmptyWhenNotConfigured() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("SOLID")))
                .thenReturn(Collections.singletonList(solidConfig));

        Optional<String> result = inventoryFormService.getDefaultVolumeUnit("SOLID");

        assertTrue(result.isEmpty());
    }

    @Test
    void validateHumidity_shouldPassForValidHumidity() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("POWDER")))
                .thenReturn(Collections.singletonList(powderConfig));

        InventoryFormService.ValidationResult result =
                inventoryFormService.validateHumidity("POWDER", 50);

        assertTrue(result.isValid());
    }

    @Test
    void validateHumidity_shouldFailWhenAboveMaximum() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("POWDER")))
                .thenReturn(Collections.singletonList(powderConfig));

        InventoryFormService.ValidationResult result =
                inventoryFormService.validateHumidity("POWDER", 70);

        assertFalse(result.isValid());
        assertTrue(result.getErrors().get(0).contains("exceeds maximum"));
    }

    @Test
    void validateHumidity_shouldWarnWhenNullButRecommended() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("POWDER")))
                .thenReturn(Collections.singletonList(powderConfig));

        InventoryFormService.ValidationResult result =
                inventoryFormService.validateHumidity("POWDER", null);

        assertTrue(result.isValid()); // Not invalid, just warning
        assertEquals(1, result.getWarnings().size());
    }

    @Test
    void getRequiredTrackingFields_shouldReturnAllRequiredFields() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("MOLTEN")))
                .thenReturn(Collections.singletonList(moltenConfig));

        List<String> result = inventoryFormService.getRequiredTrackingFields("MOLTEN");

        assertEquals(2, result.size());
        assertTrue(result.contains("temperature"));
        assertTrue(result.contains("density"));
    }

    @Test
    void getRequiredTrackingFields_shouldReturnEmptyForUnknownForm() {
        when(jdbcTemplate.queryForList(contains("form_code = ?"), eq("UNKNOWN")))
                .thenReturn(Collections.emptyList());

        List<String> result = inventoryFormService.getRequiredTrackingFields("UNKNOWN");

        assertTrue(result.isEmpty());
    }
}
