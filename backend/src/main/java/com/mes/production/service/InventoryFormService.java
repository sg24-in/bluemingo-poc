package com.mes.production.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * GAP-008: Inventory Form Service
 * Manages inventory form tracking with form-specific handling rules.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryFormService {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Get all active inventory form configurations
     */
    public List<Map<String, Object>> getAllForms() {
        String sql = "SELECT * FROM inventory_form_config WHERE is_active = true ORDER BY form_name";
        return jdbcTemplate.queryForList(sql);
    }

    /**
     * Get configuration for a specific form
     */
    public Optional<Map<String, Object>> getFormConfig(String formCode) {
        String sql = "SELECT * FROM inventory_form_config WHERE form_code = ? AND is_active = true";
        List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, formCode);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    /**
     * Check if form requires temperature tracking
     */
    public boolean requiresTemperatureTracking(String formCode) {
        Optional<Map<String, Object>> config = getFormConfig(formCode);
        if (config.isEmpty()) {
            return false;
        }
        return Boolean.TRUE.equals(config.get().get("tracks_temperature"));
    }

    /**
     * Check if form requires moisture tracking
     */
    public boolean requiresMoistureTracking(String formCode) {
        Optional<Map<String, Object>> config = getFormConfig(formCode);
        if (config.isEmpty()) {
            return false;
        }
        return Boolean.TRUE.equals(config.get().get("tracks_moisture"));
    }

    /**
     * Check if form requires density tracking
     */
    public boolean requiresDensityTracking(String formCode) {
        Optional<Map<String, Object>> config = getFormConfig(formCode);
        if (config.isEmpty()) {
            return false;
        }
        return Boolean.TRUE.equals(config.get().get("tracks_density"));
    }

    /**
     * Validate storage temperature against form requirements
     */
    public ValidationResult validateStorageTemperature(String formCode, BigDecimal temperature) {
        ValidationResult result = new ValidationResult();

        Optional<Map<String, Object>> config = getFormConfig(formCode);
        if (config.isEmpty()) {
            return result; // No config, no validation
        }

        Map<String, Object> cfg = config.get();
        Boolean requiresControl = (Boolean) cfg.get("requires_temperature_control");

        if (!Boolean.TRUE.equals(requiresControl)) {
            return result; // Temperature control not required
        }

        if (temperature == null) {
            result.addError("Temperature tracking is required for " + formCode + " form");
            return result;
        }

        BigDecimal minTemp = (BigDecimal) cfg.get("min_storage_temp");
        BigDecimal maxTemp = (BigDecimal) cfg.get("max_storage_temp");

        if (minTemp != null && temperature.compareTo(minTemp) < 0) {
            result.addError(String.format("Storage temperature %.1f°C is below minimum %.1f°C for %s",
                    temperature, minTemp, formCode));
        }

        if (maxTemp != null && temperature.compareTo(maxTemp) > 0) {
            result.addError(String.format("Storage temperature %.1f°C exceeds maximum %.1f°C for %s",
                    temperature, maxTemp, formCode));
        }

        return result;
    }

    /**
     * Check if form requires special handling
     */
    public boolean requiresSpecialHandling(String formCode) {
        Optional<Map<String, Object>> config = getFormConfig(formCode);
        if (config.isEmpty()) {
            return false;
        }
        return Boolean.TRUE.equals(config.get().get("requires_special_handling"));
    }

    /**
     * Get handling notes for a form
     */
    public Optional<String> getHandlingNotes(String formCode) {
        Optional<Map<String, Object>> config = getFormConfig(formCode);
        if (config.isEmpty()) {
            return Optional.empty();
        }
        Object notes = config.get().get("handling_notes");
        return notes == null ? Optional.empty() : Optional.of((String) notes);
    }

    /**
     * Get shelf life in days for a form
     */
    public Optional<Integer> getShelfLifeDays(String formCode) {
        Optional<Map<String, Object>> config = getFormConfig(formCode);
        if (config.isEmpty()) {
            return Optional.empty();
        }
        Object days = config.get().get("shelf_life_days");
        return days == null ? Optional.empty() : Optional.of(((Number) days).intValue());
    }

    /**
     * Get the default weight unit for a form
     */
    public String getDefaultWeightUnit(String formCode) {
        Optional<Map<String, Object>> config = getFormConfig(formCode);
        if (config.isEmpty()) {
            return "KG"; // Default
        }
        Object unit = config.get().get("default_weight_unit");
        return unit == null ? "KG" : (String) unit;
    }

    /**
     * Get the default volume unit for a form (if applicable)
     */
    public Optional<String> getDefaultVolumeUnit(String formCode) {
        Optional<Map<String, Object>> config = getFormConfig(formCode);
        if (config.isEmpty()) {
            return Optional.empty();
        }
        Object unit = config.get().get("default_volume_unit");
        return unit == null ? Optional.empty() : Optional.of((String) unit);
    }

    /**
     * Validate humidity against form requirements
     */
    public ValidationResult validateHumidity(String formCode, Integer humidityPercent) {
        ValidationResult result = new ValidationResult();

        Optional<Map<String, Object>> config = getFormConfig(formCode);
        if (config.isEmpty()) {
            return result;
        }

        Map<String, Object> cfg = config.get();
        Boolean requiresControl = (Boolean) cfg.get("requires_humidity_control");

        if (!Boolean.TRUE.equals(requiresControl)) {
            return result;
        }

        if (humidityPercent == null) {
            result.addWarning("Humidity tracking is recommended for " + formCode + " form");
            return result;
        }

        Object maxHumidity = cfg.get("max_humidity_percent");
        if (maxHumidity != null && humidityPercent > ((Number) maxHumidity).intValue()) {
            result.addError(String.format("Humidity %d%% exceeds maximum %d%% for %s",
                    humidityPercent, ((Number) maxHumidity).intValue(), formCode));
        }

        return result;
    }

    /**
     * Get all required tracking fields for a form
     */
    public List<String> getRequiredTrackingFields(String formCode) {
        List<String> fields = new ArrayList<>();

        Optional<Map<String, Object>> config = getFormConfig(formCode);
        if (config.isEmpty()) {
            return fields;
        }

        Map<String, Object> cfg = config.get();

        if (Boolean.TRUE.equals(cfg.get("tracks_temperature"))) {
            fields.add("temperature");
        }
        if (Boolean.TRUE.equals(cfg.get("tracks_moisture"))) {
            fields.add("moisture");
        }
        if (Boolean.TRUE.equals(cfg.get("tracks_density"))) {
            fields.add("density");
        }

        return fields;
    }

    /**
     * Validation result class
     */
    public static class ValidationResult {
        private boolean valid = true;
        private final List<String> errors = new ArrayList<>();
        private final List<String> warnings = new ArrayList<>();

        public void addError(String error) {
            this.valid = false;
            this.errors.add(error);
        }

        public void addWarning(String warning) {
            this.warnings.add(warning);
        }

        public boolean isValid() {
            return valid;
        }

        public List<String> getErrors() {
            return errors;
        }

        public List<String> getWarnings() {
            return warnings;
        }
    }
}
