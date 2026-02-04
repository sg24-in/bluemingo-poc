package com.mes.production.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * GAP-002: Equipment Type Configuration Service
 * Provides equipment type validation rules and parameters.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EquipmentTypeService {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Get all equipment type configurations
     */
    public List<Map<String, Object>> getAllEquipmentTypes() {
        String sql = "SELECT * FROM equipment_type_config WHERE is_active = true ORDER BY display_name";
        return jdbcTemplate.queryForList(sql);
    }

    /**
     * Get configuration for a specific equipment type
     */
    public Optional<Map<String, Object>> getEquipmentTypeConfig(String equipmentType) {
        String sql = "SELECT * FROM equipment_type_config WHERE equipment_type = ? AND is_active = true";
        List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, equipmentType);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    /**
     * Validate equipment capacity against type limits
     */
    public ValidationResult validateCapacity(String equipmentType, BigDecimal capacity) {
        ValidationResult result = new ValidationResult();

        Optional<Map<String, Object>> config = getEquipmentTypeConfig(equipmentType);
        if (config.isEmpty()) {
            result.addWarning("No configuration found for equipment type: " + equipmentType);
            return result;
        }

        Map<String, Object> cfg = config.get();
        BigDecimal minCapacity = (BigDecimal) cfg.get("min_capacity");
        BigDecimal maxCapacity = (BigDecimal) cfg.get("max_capacity");

        if (minCapacity != null && capacity.compareTo(minCapacity) < 0) {
            result.addError(String.format("Capacity %.2f is below minimum %.2f for %s",
                    capacity, minCapacity, equipmentType));
        }

        if (maxCapacity != null && capacity.compareTo(maxCapacity) > 0) {
            result.addError(String.format("Capacity %.2f exceeds maximum %.2f for %s",
                    capacity, maxCapacity, equipmentType));
        }

        return result;
    }

    /**
     * Validate operating temperature against type limits
     */
    public ValidationResult validateTemperature(String equipmentType, BigDecimal temperature) {
        ValidationResult result = new ValidationResult();

        Optional<Map<String, Object>> config = getEquipmentTypeConfig(equipmentType);
        if (config.isEmpty()) {
            return result;
        }

        Map<String, Object> cfg = config.get();
        BigDecimal minTemp = (BigDecimal) cfg.get("min_temperature");
        BigDecimal maxTemp = (BigDecimal) cfg.get("max_temperature");

        if (minTemp != null && temperature.compareTo(minTemp) < 0) {
            result.addError(String.format("Temperature %.1f°C is below minimum %.1f°C for %s",
                    temperature, minTemp, equipmentType));
        }

        if (maxTemp != null && temperature.compareTo(maxTemp) > 0) {
            result.addError(String.format("Temperature %.1f°C exceeds maximum %.1f°C for %s",
                    temperature, maxTemp, equipmentType));
        }

        // Add warning if close to limits (within 5%)
        if (minTemp != null && maxTemp != null) {
            BigDecimal range = maxTemp.subtract(minTemp);
            BigDecimal warningThreshold = range.multiply(new BigDecimal("0.05"));

            if (temperature.subtract(minTemp).compareTo(warningThreshold) < 0) {
                result.addWarning(String.format("Temperature %.1f°C is close to minimum limit", temperature));
            }
            if (maxTemp.subtract(temperature).compareTo(warningThreshold) < 0) {
                result.addWarning(String.format("Temperature %.1f°C is close to maximum limit", temperature));
            }
        }

        return result;
    }

    /**
     * Check if equipment type requires an operator
     */
    public boolean requiresOperator(String equipmentType) {
        Optional<Map<String, Object>> config = getEquipmentTypeConfig(equipmentType);
        if (config.isEmpty()) {
            return true; // Default to requiring operator
        }
        Object requires = config.get().get("requires_operator");
        return requires == null || Boolean.TRUE.equals(requires);
    }

    /**
     * Check if equipment type requires calibration
     */
    public boolean requiresCalibration(String equipmentType) {
        Optional<Map<String, Object>> config = getEquipmentTypeConfig(equipmentType);
        if (config.isEmpty()) {
            return false;
        }
        return Boolean.TRUE.equals(config.get().get("requires_calibration"));
    }

    /**
     * Get maintenance interval for equipment type
     */
    public Optional<Integer> getMaintenanceIntervalHours(String equipmentType) {
        Optional<Map<String, Object>> config = getEquipmentTypeConfig(equipmentType);
        if (config.isEmpty()) {
            return Optional.empty();
        }
        Object interval = config.get().get("maintenance_interval_hours");
        return interval == null ? Optional.empty() : Optional.of(((Number) interval).intValue());
    }

    /**
     * Validation result class
     */
    public static class ValidationResult {
        private boolean valid = true;
        private final java.util.List<String> errors = new java.util.ArrayList<>();
        private final java.util.List<String> warnings = new java.util.ArrayList<>();

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

        public java.util.List<String> getErrors() {
            return errors;
        }

        public java.util.List<String> getWarnings() {
            return warnings;
        }
    }
}
