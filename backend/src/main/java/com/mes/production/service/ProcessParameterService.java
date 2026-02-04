package com.mes.production.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for validating process parameters against configured min/max values.
 * Implements GAP-003: Dynamic Process Parameters per Operation + Product combination.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProcessParameterService {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Result of process parameter validation
     */
    public static class ValidationResult {
        private boolean valid;
        private List<String> errors;
        private List<String> warnings;

        public ValidationResult() {
            this.valid = true;
            this.errors = new ArrayList<>();
            this.warnings = new ArrayList<>();
        }

        public boolean isValid() {
            return valid;
        }

        public void setValid(boolean valid) {
            this.valid = valid;
        }

        public List<String> getErrors() {
            return errors;
        }

        public List<String> getWarnings() {
            return warnings;
        }

        public void addError(String error) {
            this.errors.add(error);
            this.valid = false;
        }

        public void addWarning(String warning) {
            this.warnings.add(warning);
        }
    }

    /**
     * Get configured parameters for an operation type and product SKU.
     * Returns parameters sorted by display_order.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getConfiguredParameters(String operationType, String productSku) {
        log.debug("Getting configured parameters for operationType={}, productSku={}", operationType, productSku);

        String sql = """
            SELECT config_id, operation_type, product_sku, parameter_name, parameter_type,
                   unit, min_value, max_value, default_value, is_required, display_order
            FROM process_parameters_config
            WHERE status = 'ACTIVE'
              AND operation_type = ?
              AND (product_sku = ? OR product_sku IS NULL)
            ORDER BY display_order
            """;

        return jdbcTemplate.queryForList(sql, operationType, productSku);
    }

    /**
     * Validate submitted process parameters against configured min/max values.
     *
     * @param operationType The operation type (e.g., ROLLING, FURNACE)
     * @param productSku    The product SKU
     * @param submittedParams Map of parameter name to submitted value
     * @return ValidationResult with errors/warnings
     */
    @Transactional(readOnly = true)
    public ValidationResult validateParameters(String operationType, String productSku,
                                               Map<String, Object> submittedParams) {
        log.info("Validating process parameters for operationType={}, productSku={}, params={}",
                operationType, productSku, submittedParams);

        ValidationResult result = new ValidationResult();

        if (submittedParams == null || submittedParams.isEmpty()) {
            // Check if there are required parameters
            List<Map<String, Object>> configs = getConfiguredParameters(operationType, productSku);
            for (Map<String, Object> config : configs) {
                Boolean isRequired = (Boolean) config.get("is_required");
                if (Boolean.TRUE.equals(isRequired)) {
                    result.addError(String.format("Required parameter '%s' is missing",
                            config.get("parameter_name")));
                }
            }
            return result;
        }

        // Get configured parameters
        List<Map<String, Object>> configs = getConfiguredParameters(operationType, productSku);
        Map<String, Map<String, Object>> configByName = new HashMap<>();
        for (Map<String, Object> config : configs) {
            configByName.put((String) config.get("parameter_name"), config);
        }

        // Validate each configured parameter
        for (Map<String, Object> config : configs) {
            String paramName = (String) config.get("parameter_name");
            Boolean isRequired = (Boolean) config.get("is_required");
            BigDecimal minValue = (BigDecimal) config.get("min_value");
            BigDecimal maxValue = (BigDecimal) config.get("max_value");
            String unit = (String) config.get("unit");

            Object submittedValue = submittedParams.get(paramName);

            // Check required
            if (Boolean.TRUE.equals(isRequired)) {
                if (submittedValue == null || submittedValue.toString().trim().isEmpty()) {
                    result.addError(String.format("Required parameter '%s' is missing", paramName));
                    continue;
                }
            }

            // Skip validation if value not provided and not required
            if (submittedValue == null || submittedValue.toString().trim().isEmpty()) {
                continue;
            }

            // Parse value as BigDecimal for numeric validation
            BigDecimal numericValue;
            try {
                numericValue = new BigDecimal(submittedValue.toString());
            } catch (NumberFormatException e) {
                result.addError(String.format("Parameter '%s' must be a valid number", paramName));
                continue;
            }

            // Validate min value
            if (minValue != null && numericValue.compareTo(minValue) < 0) {
                result.addError(String.format("Parameter '%s' value %s is below minimum %s%s",
                        paramName, numericValue, minValue, unit != null ? " " + unit : ""));
            }

            // Validate max value
            if (maxValue != null && numericValue.compareTo(maxValue) > 0) {
                result.addError(String.format("Parameter '%s' value %s exceeds maximum %s%s",
                        paramName, numericValue, maxValue, unit != null ? " " + unit : ""));
            }

            // Add warning if value is close to limits (within 10%)
            if (minValue != null && maxValue != null) {
                BigDecimal range = maxValue.subtract(minValue);
                BigDecimal tenPercent = range.multiply(new BigDecimal("0.10"));

                if (numericValue.subtract(minValue).compareTo(tenPercent) < 0) {
                    result.addWarning(String.format("Parameter '%s' is close to minimum limit", paramName));
                } else if (maxValue.subtract(numericValue).compareTo(tenPercent) < 0) {
                    result.addWarning(String.format("Parameter '%s' is close to maximum limit", paramName));
                }
            }
        }

        // Check for unexpected parameters (parameters not in config)
        for (String submittedParamName : submittedParams.keySet()) {
            if (!configByName.containsKey(submittedParamName)) {
                result.addWarning(String.format("Unexpected parameter '%s' will be ignored", submittedParamName));
            }
        }

        log.info("Parameter validation result: valid={}, errors={}, warnings={}",
                result.isValid(), result.getErrors().size(), result.getWarnings().size());

        return result;
    }
}
