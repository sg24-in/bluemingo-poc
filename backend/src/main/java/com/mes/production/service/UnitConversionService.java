package com.mes.production.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * GAP-006: Unit Conversion Service
 * Provides unit of measure management and conversion capabilities.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UnitConversionService {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Get all active units of measure
     */
    public List<Map<String, Object>> getAllUnits() {
        String sql = "SELECT * FROM unit_of_measure WHERE is_active = true ORDER BY unit_type, unit_name";
        return jdbcTemplate.queryForList(sql);
    }

    /**
     * Get units by type (WEIGHT, LENGTH, VOLUME, PIECES, AREA)
     */
    public List<Map<String, Object>> getUnitsByType(String unitType) {
        String sql = "SELECT * FROM unit_of_measure WHERE unit_type = ? AND is_active = true ORDER BY unit_name";
        return jdbcTemplate.queryForList(sql, unitType);
    }

    /**
     * Get unit details by code
     */
    public Optional<Map<String, Object>> getUnit(String unitCode) {
        String sql = "SELECT * FROM unit_of_measure WHERE unit_code = ? AND is_active = true";
        List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, unitCode);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    /**
     * Get the base unit for a given unit type
     */
    public Optional<Map<String, Object>> getBaseUnit(String unitType) {
        String sql = "SELECT * FROM unit_of_measure WHERE unit_type = ? AND is_base_unit = true AND is_active = true";
        List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, unitType);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    /**
     * Convert a quantity from one unit to another
     *
     * @param quantity The quantity to convert
     * @param fromUnit The source unit code
     * @param toUnit The target unit code
     * @return The converted quantity, or empty if conversion not possible
     */
    public Optional<BigDecimal> convert(BigDecimal quantity, String fromUnit, String toUnit) {
        if (quantity == null || fromUnit == null || toUnit == null) {
            return Optional.empty();
        }

        // Same unit - no conversion needed
        if (fromUnit.equals(toUnit)) {
            return Optional.of(quantity);
        }

        // Try direct conversion
        Optional<BigDecimal> directFactor = getConversionFactor(fromUnit, toUnit);
        if (directFactor.isPresent()) {
            BigDecimal result = quantity.multiply(directFactor.get());
            return Optional.of(applyPrecision(result, toUnit));
        }

        // Try reverse conversion
        Optional<BigDecimal> reverseFactor = getConversionFactor(toUnit, fromUnit);
        if (reverseFactor.isPresent()) {
            BigDecimal result = quantity.divide(reverseFactor.get(), 10, RoundingMode.HALF_UP);
            return Optional.of(applyPrecision(result, toUnit));
        }

        // Try conversion through base unit
        Optional<Map<String, Object>> fromUnitInfo = getUnit(fromUnit);
        Optional<Map<String, Object>> toUnitInfo = getUnit(toUnit);

        if (fromUnitInfo.isPresent() && toUnitInfo.isPresent()) {
            String fromType = (String) fromUnitInfo.get().get("unit_type");
            String toType = (String) toUnitInfo.get().get("unit_type");

            // Can only convert within the same type
            if (!fromType.equals(toType)) {
                log.warn("Cannot convert between different unit types: {} ({}) to {} ({})",
                        fromUnit, fromType, toUnit, toType);
                return Optional.empty();
            }

            // Get base unit for the type
            Optional<Map<String, Object>> baseUnitInfo = getBaseUnit(fromType);
            if (baseUnitInfo.isPresent()) {
                String baseUnit = (String) baseUnitInfo.get().get("unit_code");

                // Convert from source to base
                Optional<BigDecimal> toBaseFactor = getConversionFactor(fromUnit, baseUnit);
                if (toBaseFactor.isEmpty()) {
                    toBaseFactor = getConversionFactor(baseUnit, fromUnit)
                            .map(f -> BigDecimal.ONE.divide(f, 10, RoundingMode.HALF_UP));
                }

                // Convert from base to target
                Optional<BigDecimal> fromBaseFactor = getConversionFactor(baseUnit, toUnit);
                if (fromBaseFactor.isEmpty()) {
                    fromBaseFactor = getConversionFactor(toUnit, baseUnit)
                            .map(f -> BigDecimal.ONE.divide(f, 10, RoundingMode.HALF_UP));
                }

                if (toBaseFactor.isPresent() && fromBaseFactor.isPresent()) {
                    BigDecimal inBaseUnit = quantity.multiply(toBaseFactor.get());
                    BigDecimal result = inBaseUnit.multiply(fromBaseFactor.get());
                    return Optional.of(applyPrecision(result, toUnit));
                }
            }
        }

        log.warn("No conversion path found from {} to {}", fromUnit, toUnit);
        return Optional.empty();
    }

    /**
     * Get the conversion factor between two units
     */
    public Optional<BigDecimal> getConversionFactor(String fromUnit, String toUnit) {
        String sql = "SELECT conversion_factor FROM unit_conversion WHERE from_unit_code = ? AND to_unit_code = ? AND is_active = true";
        List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, fromUnit, toUnit);
        if (results.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of((BigDecimal) results.get(0).get("conversion_factor"));
    }

    /**
     * Check if two units are compatible (same type)
     */
    public boolean areUnitsCompatible(String unit1, String unit2) {
        if (unit1 == null || unit2 == null) {
            return false;
        }
        if (unit1.equals(unit2)) {
            return true;
        }

        Optional<Map<String, Object>> unit1Info = getUnit(unit1);
        Optional<Map<String, Object>> unit2Info = getUnit(unit2);

        if (unit1Info.isEmpty() || unit2Info.isEmpty()) {
            return false;
        }

        return unit1Info.get().get("unit_type").equals(unit2Info.get().get("unit_type"));
    }

    /**
     * Get decimal precision for a unit
     */
    public int getDecimalPrecision(String unitCode) {
        Optional<Map<String, Object>> unit = getUnit(unitCode);
        if (unit.isEmpty()) {
            return 2; // Default precision
        }
        Object precision = unit.get().get("decimal_precision");
        return precision == null ? 2 : ((Number) precision).intValue();
    }

    /**
     * Apply the appropriate decimal precision for the target unit
     */
    private BigDecimal applyPrecision(BigDecimal value, String unitCode) {
        int precision = getDecimalPrecision(unitCode);
        return value.setScale(precision, RoundingMode.HALF_UP);
    }

    /**
     * Validate that a quantity is positive
     */
    public boolean isValidQuantity(BigDecimal quantity) {
        return quantity != null && quantity.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Format a quantity with its unit
     */
    public String formatQuantity(BigDecimal quantity, String unitCode) {
        if (quantity == null || unitCode == null) {
            return "";
        }
        int precision = getDecimalPrecision(unitCode);
        BigDecimal rounded = quantity.setScale(precision, RoundingMode.HALF_UP);
        return String.format("%s %s", rounded.stripTrailingZeros().toPlainString(), unitCode);
    }
}
