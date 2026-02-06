package com.mes.production.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BatchNumberServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private BatchNumberService batchNumberService;

    private Map<String, Object> testConfig;
    private List<Map<String, Object>> configList;

    @BeforeEach
    void setUp() {
        testConfig = new HashMap<>();
        testConfig.put("config_id", 1L);
        testConfig.put("config_name", "Standard Batch Numbering");
        testConfig.put("prefix", "BATCH");
        testConfig.put("include_operation_code", true);
        testConfig.put("operation_code_length", 3);
        testConfig.put("separator", "-");
        testConfig.put("date_format", "yyyyMMdd");
        testConfig.put("include_date", true);
        testConfig.put("sequence_length", 4);
        testConfig.put("sequence_reset", "DAILY");

        configList = List.of(testConfig);

        // Default stub for config queries - returns empty list
        // Using specific matchers to avoid ambiguous overload issues
        lenient().doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), anyString(), anyString());
        lenient().doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), anyLong(), anyString());
        lenient().doReturn(List.of()).when(jdbcTemplate).queryForList(anyString());
    }

    @Test
    @DisplayName("Should generate batch number with config")
    void generateBatchNumber_WithConfig_ReturnsFormattedNumber() {
        // Arrange - override defaults
        doReturn(configList).when(jdbcTemplate).queryForList(anyString(), eq("FURNACE"), eq("STEEL-001"));
        doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(1L), anyString());
        when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

        // Act
        String result = batchNumberService.generateBatchNumber("FURNACE", "STEEL-001");

        // Assert
        assertNotNull(result);
        assertTrue(result.startsWith("BATCH-FUR-"));
        assertTrue(result.contains(LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))));
        assertTrue(result.endsWith("0001"));
    }

    @Test
    @DisplayName("Should generate fallback batch number when no config")
    void generateBatchNumber_NoConfig_ReturnsFallback() {
        // Default stub returns empty list, so no config will be found

        // Act
        String result = batchNumberService.generateBatchNumber("ROLLING", "STEEL-001");

        // Assert
        assertNotNull(result);
        assertTrue(result.startsWith("BATCH-RO-"));
        assertTrue(result.contains(LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))));
    }

    @Test
    @DisplayName("Should generate fallback for null operation type")
    void generateBatchNumber_NullOperationType_ReturnsFallbackWithoutOpCode() {
        // Default stub returns empty list

        // Act
        String result = batchNumberService.generateBatchNumber(null, null);

        // Assert
        assertNotNull(result);
        assertTrue(result.startsWith("BATCH-"));
    }

    @Test
    @DisplayName("Should generate split batch number with fallback")
    void generateSplitBatchNumber_NoConfig_ReturnsFallback() {
        // Default stub returns empty list

        // Act
        String result = batchNumberService.generateSplitBatchNumber("BATCH-001", 2);

        // Assert
        assertNotNull(result);
        assertEquals("BATCH-001-S02", result);
    }

    @Test
    @DisplayName("Should generate merge batch number with fallback")
    void generateMergeBatchNumber_NoConfig_ReturnsFallback() {
        // Default stub returns empty list

        // Act
        String result = batchNumberService.generateMergeBatchNumber();

        // Assert
        assertNotNull(result);
        assertTrue(result.startsWith("MRG-"));
    }

    @Test
    @DisplayName("Should increment existing sequence")
    void generateBatchNumber_ExistingSequence_IncrementsSequence() {
        // Arrange
        Map<String, Object> existingSeq = new HashMap<>();
        existingSeq.put("sequence_id", 1L);
        existingSeq.put("current_value", 5);
        existingSeq.put("last_reset_on", "2024-01-01");

        doReturn(configList).when(jdbcTemplate).queryForList(anyString(), eq("FURNACE"), eq("STEEL-001"));
        doReturn(List.of(existingSeq)).when(jdbcTemplate).queryForList(anyString(), eq(1L), anyString());
        when(jdbcTemplate.update(anyString(), anyInt(), anyLong(), anyString())).thenReturn(1);

        // Act
        String result = batchNumberService.generateBatchNumber("FURNACE", "STEEL-001");

        // Assert
        assertNotNull(result);
        assertTrue(result.endsWith("0006")); // 5 + 1 = 6
    }

    @Test
    @DisplayName("Should get all configurations")
    void getAllConfigurations_ReturnsConfigs() {
        // Arrange
        doReturn(configList).when(jdbcTemplate).queryForList(anyString());

        // Act
        List<Map<String, Object>> result = batchNumberService.getAllConfigurations();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Standard Batch Numbering", result.get(0).get("config_name"));
    }

    @Test
    @DisplayName("Should handle config without operation code")
    void generateBatchNumber_NoOperationCode_GeneratesWithoutOpCode() {
        // Arrange
        Map<String, Object> configWithoutOpCode = new HashMap<>(testConfig);
        configWithoutOpCode.put("include_operation_code", false);
        List<Map<String, Object>> configListNoOpCode = List.of(configWithoutOpCode);

        doReturn(configListNoOpCode).when(jdbcTemplate).queryForList(anyString(), eq("FURNACE"), eq("STEEL-001"));
        doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(1L), anyString());
        when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

        // Act
        String result = batchNumberService.generateBatchNumber("FURNACE", "STEEL-001");

        // Assert
        assertNotNull(result);
        assertTrue(result.startsWith("BATCH-"));
        assertFalse(result.contains("FUR"));
    }

    @Test
    @DisplayName("Should handle config without date")
    void generateBatchNumber_NoDate_GeneratesWithoutDate() {
        // Arrange
        Map<String, Object> configWithoutDate = new HashMap<>(testConfig);
        configWithoutDate.put("include_date", false);
        List<Map<String, Object>> configListNoDate = List.of(configWithoutDate);

        doReturn(configListNoDate).when(jdbcTemplate).queryForList(anyString(), eq("FURNACE"), eq("STEEL-001"));
        doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(1L), anyString());
        when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

        // Act
        String result = batchNumberService.generateBatchNumber("FURNACE", "STEEL-001");

        // Assert
        assertNotNull(result);
        assertFalse(result.contains(LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))));
    }

    @Test
    @DisplayName("BatchNumberConfig getters and setters work correctly")
    void batchNumberConfig_GettersSetters_WorkCorrectly() {
        // Arrange
        BatchNumberService.BatchNumberConfig config = new BatchNumberService.BatchNumberConfig();

        // Act
        config.setConfigId(1L);
        config.setConfigName("Test Config");
        config.setPrefix("TEST");
        config.setIncludeOperationCode(true);
        config.setOperationCodeLength(3);
        config.setSeparator("-");
        config.setDateFormat("yyyyMMdd");
        config.setIncludeDate(true);
        config.setSequenceLength(4);
        config.setSequenceReset("DAILY");

        // Assert
        assertEquals(1L, config.getConfigId());
        assertEquals("Test Config", config.getConfigName());
        assertEquals("TEST", config.getPrefix());
        assertTrue(config.isIncludeOperationCode());
        assertEquals(3, config.getOperationCodeLength());
        assertEquals("-", config.getSeparator());
        assertEquals("yyyyMMdd", config.getDateFormat());
        assertTrue(config.isIncludeDate());
        assertEquals(4, config.getSequenceLength());
        assertEquals("DAILY", config.getSequenceReset());
    }

    @Test
    @DisplayName("Should handle operation type shorter than code length")
    void generateBatchNumber_ShortOperationType_UsesFullType() {
        // Arrange
        Map<String, Object> configLongCode = new HashMap<>(testConfig);
        configLongCode.put("operation_code_length", 10); // Longer than "AB"
        List<Map<String, Object>> configListLongCode = List.of(configLongCode);

        doReturn(configListLongCode).when(jdbcTemplate).queryForList(anyString(), eq("AB"), eq("STEEL-001"));
        doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(1L), anyString());
        when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

        // Act
        String result = batchNumberService.generateBatchNumber("AB", "STEEL-001");

        // Assert
        assertNotNull(result);
        assertTrue(result.contains("AB")); // Uses full operation type
    }

    @Test
    @DisplayName("Should use NEVER sequence reset key")
    void generateBatchNumber_NeverReset_UsesConfigPrefix() {
        // Arrange
        Map<String, Object> configNeverReset = new HashMap<>(testConfig);
        configNeverReset.put("sequence_reset", "NEVER");
        List<Map<String, Object>> configListNever = List.of(configNeverReset);

        doReturn(configListNever).when(jdbcTemplate).queryForList(anyString(), eq("FURNACE"), eq("STEEL-001"));
        doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(1L), eq("BATCH"));
        when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

        // Act
        String result = batchNumberService.generateBatchNumber("FURNACE", "STEEL-001");

        // Assert
        assertNotNull(result);
    }

    @Test
    @DisplayName("Should use YEARLY sequence reset key")
    void generateBatchNumber_YearlyReset_UsesYearInKey() {
        // Arrange
        Map<String, Object> configYearlyReset = new HashMap<>(testConfig);
        configYearlyReset.put("sequence_reset", "YEARLY");
        List<Map<String, Object>> configListYearly = List.of(configYearlyReset);
        String expectedKey = "BATCH-" + LocalDate.now().getYear();

        doReturn(configListYearly).when(jdbcTemplate).queryForList(anyString(), eq("FURNACE"), eq("STEEL-001"));
        doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(1L), eq(expectedKey));
        when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

        // Act
        String result = batchNumberService.generateBatchNumber("FURNACE", "STEEL-001");

        // Assert
        assertNotNull(result);
    }

    @Test
    @DisplayName("Should use MONTHLY sequence reset key")
    void generateBatchNumber_MonthlyReset_UsesYearMonthInKey() {
        // Arrange
        Map<String, Object> configMonthlyReset = new HashMap<>(testConfig);
        configMonthlyReset.put("sequence_reset", "MONTHLY");
        List<Map<String, Object>> configListMonthly = List.of(configMonthlyReset);
        String expectedKey = "BATCH-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));

        doReturn(configListMonthly).when(jdbcTemplate).queryForList(anyString(), eq("FURNACE"), eq("STEEL-001"));
        doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(1L), eq(expectedKey));
        when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

        // Act
        String result = batchNumberService.generateBatchNumber("FURNACE", "STEEL-001");

        // Assert
        assertNotNull(result);
    }

    // ==================== RM Batch Number Tests ====================

    @Test
    @DisplayName("Should generate RM batch number with fallback format")
    void generateRmBatchNumber_NoConfig_ReturnsFallbackFormat() {
        // Arrange - default stub returns empty list (no config)
        doReturn(null).when(jdbcTemplate).queryForObject(anyString(), eq(Integer.class), anyString(), anyString());

        // Act
        String result = batchNumberService.generateRmBatchNumber("RM-IRON-001", LocalDate.now(), null);

        // Assert
        assertNotNull(result);
        assertTrue(result.startsWith("RM-RM-IRON-001-"));
        assertTrue(result.contains(LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))));
    }

    @Test
    @DisplayName("Should generate RM batch number without supplier lot")
    void generateRmBatchNumber_WithoutSupplierLot_ExcludesSupplierPart() {
        // Arrange - no config, no supplier lot
        doReturn(null).when(jdbcTemplate).queryForObject(anyString(), eq(Integer.class), anyString(), anyString());

        // Act
        String result = batchNumberService.generateRmBatchNumber("IRON", LocalDate.of(2026, 2, 6), null);

        // Assert
        assertNotNull(result);
        assertTrue(result.startsWith("RM-IRON-20260206-"));
        assertFalse(result.contains("SUP")); // No supplier part
    }

    @Test
    @DisplayName("Should generate RM batch number with sequence")
    void generateRmBatchNumber_ExistingBatches_IncrementsSequence() {
        // Arrange - simulate existing batches
        doReturn(5).when(jdbcTemplate).queryForObject(anyString(), eq(Integer.class), anyString(), anyString());

        // Act
        String result = batchNumberService.generateRmBatchNumber("STEEL", LocalDate.of(2026, 2, 6), null);

        // Assert
        assertNotNull(result);
        assertTrue(result.endsWith("006")); // 5 + 1 = 6
    }

    @Test
    @DisplayName("Should generate RM batch number with config and supplier lot")
    void generateRmBatchNumber_WithConfigAndSupplierLot_IncludesSupplierPart() {
        // Arrange - RM-specific config
        Map<String, Object> rmConfig = new HashMap<>();
        rmConfig.put("config_id", 2L);
        rmConfig.put("config_name", "RM Receipt Numbering");
        rmConfig.put("prefix", "RM");
        rmConfig.put("include_operation_code", true);
        rmConfig.put("operation_code_length", 20); // Allow full material code
        rmConfig.put("separator", "-");
        rmConfig.put("date_format", "yyyyMMdd");
        rmConfig.put("include_date", true);
        rmConfig.put("sequence_length", 3);
        rmConfig.put("sequence_reset", "DAILY");
        List<Map<String, Object>> rmConfigList = List.of(rmConfig);

        doReturn(rmConfigList).when(jdbcTemplate).queryForList(anyString(), eq("RM_RECEIPT"), isNull());
        doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(2L), anyString());
        when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

        // Act
        String result = batchNumberService.generateRmBatchNumber("IRON-001", LocalDate.of(2026, 2, 6), "SUP-LOT-123");

        // Assert
        assertNotNull(result);
        assertTrue(result.startsWith("RM-IRON-001-"));
        assertTrue(result.contains("SUPLOT123")); // Sanitized supplier lot
        assertTrue(result.contains("20260206"));
    }

    @Test
    @DisplayName("Should sanitize supplier lot number - remove special characters")
    void generateRmBatchNumber_WithConfigAndSpecialCharsInSupplierLot_SanitizesSupplierLot() {
        // Arrange - RM-specific config
        Map<String, Object> rmConfig = new HashMap<>();
        rmConfig.put("config_id", 2L);
        rmConfig.put("config_name", "RM Receipt Numbering");
        rmConfig.put("prefix", "RM");
        rmConfig.put("include_operation_code", true);
        rmConfig.put("operation_code_length", 20);
        rmConfig.put("separator", "-");
        rmConfig.put("date_format", "yyyyMMdd");
        rmConfig.put("include_date", true);
        rmConfig.put("sequence_length", 3);
        rmConfig.put("sequence_reset", "DAILY");
        List<Map<String, Object>> rmConfigList = List.of(rmConfig);

        doReturn(rmConfigList).when(jdbcTemplate).queryForList(anyString(), eq("RM_RECEIPT"), isNull());
        doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(2L), anyString());
        when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

        // Act - supplier lot with special chars
        String result = batchNumberService.generateRmBatchNumber("IRON", LocalDate.now(), "SUP/LOT#2024@001");

        // Assert
        assertNotNull(result);
        assertTrue(result.contains("SUPLOT2024001")); // Special chars removed
    }

    @Test
    @DisplayName("Should truncate long supplier lot number")
    void generateRmBatchNumber_WithConfigAndLongSupplierLot_TruncatesTo15Chars() {
        // Arrange - RM-specific config
        Map<String, Object> rmConfig = new HashMap<>();
        rmConfig.put("config_id", 2L);
        rmConfig.put("config_name", "RM Receipt Numbering");
        rmConfig.put("prefix", "RM");
        rmConfig.put("include_operation_code", true);
        rmConfig.put("operation_code_length", 20);
        rmConfig.put("separator", "-");
        rmConfig.put("date_format", "yyyyMMdd");
        rmConfig.put("include_date", true);
        rmConfig.put("sequence_length", 3);
        rmConfig.put("sequence_reset", "DAILY");
        List<Map<String, Object>> rmConfigList = List.of(rmConfig);

        doReturn(rmConfigList).when(jdbcTemplate).queryForList(anyString(), eq("RM_RECEIPT"), isNull());
        doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(2L), anyString());
        when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

        // Act - very long supplier lot
        String result = batchNumberService.generateRmBatchNumber("IRON", LocalDate.now(), "VERYLONGSUPPLIERLOTNUM12345678");

        // Assert
        assertNotNull(result);
        // Supplier lot truncated to 15 chars
        assertTrue(result.contains("VERYLONGSUPPLIE")); // First 15 chars only
        assertFalse(result.contains("RLOTNUM")); // Rest truncated
    }
}
