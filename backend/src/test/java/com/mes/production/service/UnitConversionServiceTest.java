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
class UnitConversionServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private UnitConversionService unitConversionService;

    private Map<String, Object> kgUnit;
    private Map<String, Object> tonsUnit;
    private Map<String, Object> lbUnit;
    private Map<String, Object> meterUnit;

    @BeforeEach
    void setUp() {
        kgUnit = new HashMap<>();
        kgUnit.put("unit_code", "KG");
        kgUnit.put("unit_name", "Kilogram");
        kgUnit.put("unit_type", "WEIGHT");
        kgUnit.put("decimal_precision", 2);
        kgUnit.put("is_base_unit", true);

        tonsUnit = new HashMap<>();
        tonsUnit.put("unit_code", "TONS");
        tonsUnit.put("unit_name", "Metric Ton");
        tonsUnit.put("unit_type", "WEIGHT");
        tonsUnit.put("decimal_precision", 3);
        tonsUnit.put("is_base_unit", false);

        lbUnit = new HashMap<>();
        lbUnit.put("unit_code", "LB");
        lbUnit.put("unit_name", "Pound");
        lbUnit.put("unit_type", "WEIGHT");
        lbUnit.put("decimal_precision", 2);
        lbUnit.put("is_base_unit", false);

        meterUnit = new HashMap<>();
        meterUnit.put("unit_code", "M");
        meterUnit.put("unit_name", "Meter");
        meterUnit.put("unit_type", "LENGTH");
        meterUnit.put("decimal_precision", 3);
        meterUnit.put("is_base_unit", true);
    }

    @Test
    void getAllUnits_shouldReturnAllActiveUnits() {
        List<Map<String, Object>> units = Arrays.asList(kgUnit, tonsUnit, meterUnit);
        when(jdbcTemplate.queryForList(contains("FROM unit_of_measure")))
                .thenReturn(units);

        List<Map<String, Object>> result = unitConversionService.getAllUnits();

        assertEquals(3, result.size());
    }

    @Test
    void getUnitsByType_shouldReturnUnitsOfType() {
        List<Map<String, Object>> weightUnits = Arrays.asList(kgUnit, tonsUnit);
        when(jdbcTemplate.queryForList(contains("unit_type = ?"), eq("WEIGHT")))
                .thenReturn(weightUnits);

        List<Map<String, Object>> result = unitConversionService.getUnitsByType("WEIGHT");

        assertEquals(2, result.size());
    }

    @Test
    void getUnit_shouldReturnUnitWhenFound() {
        when(jdbcTemplate.queryForList(contains("unit_code = ?"), eq("KG")))
                .thenReturn(Collections.singletonList(kgUnit));

        Optional<Map<String, Object>> result = unitConversionService.getUnit("KG");

        assertTrue(result.isPresent());
        assertEquals("Kilogram", result.get().get("unit_name"));
    }

    @Test
    void getUnit_shouldReturnEmptyWhenNotFound() {
        when(jdbcTemplate.queryForList(contains("unit_code = ?"), eq("UNKNOWN")))
                .thenReturn(Collections.emptyList());

        Optional<Map<String, Object>> result = unitConversionService.getUnit("UNKNOWN");

        assertTrue(result.isEmpty());
    }

    @Test
    void getBaseUnit_shouldReturnBaseUnitForType() {
        when(jdbcTemplate.queryForList(contains("is_base_unit = true"), eq("WEIGHT")))
                .thenReturn(Collections.singletonList(kgUnit));

        Optional<Map<String, Object>> result = unitConversionService.getBaseUnit("WEIGHT");

        assertTrue(result.isPresent());
        assertEquals("KG", result.get().get("unit_code"));
    }

    @Test
    void convert_shouldReturnSameQuantityForSameUnit() {
        BigDecimal quantity = new BigDecimal("100");

        Optional<BigDecimal> result = unitConversionService.convert(quantity, "KG", "KG");

        assertTrue(result.isPresent());
        assertEquals(0, quantity.compareTo(result.get()));
    }

    @Test
    void convert_shouldConvertWithDirectFactor() {
        Map<String, Object> conversionFactor = new HashMap<>();
        conversionFactor.put("conversion_factor", new BigDecimal("1000"));

        when(jdbcTemplate.queryForList(
                contains("from_unit_code = ?"),
                eq("TONS"),
                eq("KG")))
                .thenReturn(Collections.singletonList(conversionFactor));

        when(jdbcTemplate.queryForList(contains("unit_code = ?"), eq("KG")))
                .thenReturn(Collections.singletonList(kgUnit));

        Optional<BigDecimal> result = unitConversionService.convert(
                new BigDecimal("5"), "TONS", "KG");

        assertTrue(result.isPresent());
        assertEquals(new BigDecimal("5000.00"), result.get());
    }

    @Test
    void convert_shouldConvertWithReverseFactor() {
        // Direct factor not found
        when(jdbcTemplate.queryForList(
                contains("from_unit_code = ?"),
                eq("KG"),
                eq("TONS")))
                .thenReturn(Collections.emptyList());

        // Reverse factor found
        Map<String, Object> conversionFactor = new HashMap<>();
        conversionFactor.put("conversion_factor", new BigDecimal("1000"));
        when(jdbcTemplate.queryForList(
                contains("from_unit_code = ?"),
                eq("TONS"),
                eq("KG")))
                .thenReturn(Collections.singletonList(conversionFactor));

        when(jdbcTemplate.queryForList(contains("unit_code = ?"), eq("TONS")))
                .thenReturn(Collections.singletonList(tonsUnit));

        Optional<BigDecimal> result = unitConversionService.convert(
                new BigDecimal("5000"), "KG", "TONS");

        assertTrue(result.isPresent());
        assertEquals(new BigDecimal("5.000"), result.get());
    }

    @Test
    void convert_shouldReturnEmptyForNullInputs() {
        assertTrue(unitConversionService.convert(null, "KG", "TONS").isEmpty());
        assertTrue(unitConversionService.convert(BigDecimal.ONE, null, "TONS").isEmpty());
        assertTrue(unitConversionService.convert(BigDecimal.ONE, "KG", null).isEmpty());
    }

    @Test
    void getConversionFactor_shouldReturnFactorWhenFound() {
        Map<String, Object> conversionFactor = new HashMap<>();
        conversionFactor.put("conversion_factor", new BigDecimal("1000"));

        when(jdbcTemplate.queryForList(
                contains("from_unit_code = ?"),
                eq("TONS"),
                eq("KG")))
                .thenReturn(Collections.singletonList(conversionFactor));

        Optional<BigDecimal> result = unitConversionService.getConversionFactor("TONS", "KG");

        assertTrue(result.isPresent());
        assertEquals(new BigDecimal("1000"), result.get());
    }

    @Test
    void getConversionFactor_shouldReturnEmptyWhenNotFound() {
        when(jdbcTemplate.queryForList(
                contains("from_unit_code = ?"),
                eq("UNKNOWN1"),
                eq("UNKNOWN2")))
                .thenReturn(Collections.emptyList());

        Optional<BigDecimal> result = unitConversionService.getConversionFactor("UNKNOWN1", "UNKNOWN2");

        assertTrue(result.isEmpty());
    }

    @Test
    void areUnitsCompatible_shouldReturnTrueForSameUnit() {
        assertTrue(unitConversionService.areUnitsCompatible("KG", "KG"));
    }

    @Test
    void areUnitsCompatible_shouldReturnTrueForSameType() {
        when(jdbcTemplate.queryForList(contains("unit_code = ?"), eq("KG")))
                .thenReturn(Collections.singletonList(kgUnit));
        when(jdbcTemplate.queryForList(contains("unit_code = ?"), eq("TONS")))
                .thenReturn(Collections.singletonList(tonsUnit));

        assertTrue(unitConversionService.areUnitsCompatible("KG", "TONS"));
    }

    @Test
    void areUnitsCompatible_shouldReturnFalseForDifferentTypes() {
        when(jdbcTemplate.queryForList(contains("unit_code = ?"), eq("KG")))
                .thenReturn(Collections.singletonList(kgUnit));
        when(jdbcTemplate.queryForList(contains("unit_code = ?"), eq("M")))
                .thenReturn(Collections.singletonList(meterUnit));

        assertFalse(unitConversionService.areUnitsCompatible("KG", "M"));
    }

    @Test
    void areUnitsCompatible_shouldReturnFalseForNullInputs() {
        assertFalse(unitConversionService.areUnitsCompatible(null, "KG"));
        assertFalse(unitConversionService.areUnitsCompatible("KG", null));
    }

    @Test
    void getDecimalPrecision_shouldReturnConfiguredPrecision() {
        when(jdbcTemplate.queryForList(contains("unit_code = ?"), eq("TONS")))
                .thenReturn(Collections.singletonList(tonsUnit));

        int result = unitConversionService.getDecimalPrecision("TONS");

        assertEquals(3, result);
    }

    @Test
    void getDecimalPrecision_shouldReturnDefaultForUnknownUnit() {
        when(jdbcTemplate.queryForList(contains("unit_code = ?"), eq("UNKNOWN")))
                .thenReturn(Collections.emptyList());

        int result = unitConversionService.getDecimalPrecision("UNKNOWN");

        assertEquals(2, result); // Default
    }

    @Test
    void isValidQuantity_shouldReturnTrueForPositiveQuantity() {
        assertTrue(unitConversionService.isValidQuantity(new BigDecimal("100")));
        assertTrue(unitConversionService.isValidQuantity(new BigDecimal("0.001")));
    }

    @Test
    void isValidQuantity_shouldReturnFalseForZeroOrNegative() {
        assertFalse(unitConversionService.isValidQuantity(BigDecimal.ZERO));
        assertFalse(unitConversionService.isValidQuantity(new BigDecimal("-1")));
        assertFalse(unitConversionService.isValidQuantity(null));
    }

    @Test
    void formatQuantity_shouldFormatWithCorrectPrecision() {
        when(jdbcTemplate.queryForList(contains("unit_code = ?"), eq("KG")))
                .thenReturn(Collections.singletonList(kgUnit));

        String result = unitConversionService.formatQuantity(new BigDecimal("100.5678"), "KG");

        assertEquals("100.57 KG", result);
    }

    @Test
    void formatQuantity_shouldReturnEmptyForNullInputs() {
        assertEquals("", unitConversionService.formatQuantity(null, "KG"));
        assertEquals("", unitConversionService.formatQuantity(BigDecimal.ONE, null));
    }
}
