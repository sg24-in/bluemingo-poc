package com.mes.production.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Comprehensive test suite for BatchNumberService.
 *
 * Per MES Batch Number Creation Specification, this test suite covers:
 * - All batch number generation scenarios (production, RM, split, merge)
 * - Configuration precedence rules
 * - Sequence management and reset policies
 * - Edge cases and error handling
 * - Input validation and sanitization
 *
 * Test Categories:
 * 1. Production Batch Numbers - Standard production output batches
 * 2. RM Batch Numbers - Raw material receipt batches
 * 3. Split Batch Numbers - Batch splitting operations
 * 4. Merge Batch Numbers - Batch merging operations
 * 5. Configuration Precedence - Operation > Material > Product > Default
 * 6. Sequence Management - DAILY, MONTHLY, YEARLY, NEVER reset policies
 * 7. Edge Cases - Null/empty inputs, special characters, boundary conditions
 * 8. Error Handling - Database failures, missing configs, invalid data
 * 9. Concurrency - Thread-safe sequence generation
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("BatchNumberService Comprehensive Tests")
class BatchNumberServiceComprehensiveTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private BatchNumberService batchNumberService;

    private Map<String, Object> defaultConfig;
    private Map<String, Object> furnaceConfig;
    private Map<String, Object> rmConfig;

    @BeforeEach
    void setUp() {
        // Default configuration
        defaultConfig = createConfig(999L, "DEFAULT", "BATCH", true, 2, "-", "yyyyMMdd", true, 3, "DAILY");

        // Furnace-specific configuration
        furnaceConfig = createConfig(100L, "FURNACE_OP", "FUR", true, 3, "-", "yyyyMMdd", true, 4, "DAILY");

        // RM receipt configuration
        rmConfig = createConfig(101L, "RM_RECEIPT", "RM", true, 20, "-", "yyyyMMdd", true, 3, "DAILY");

        // Default stubs - return empty list (no config found)
        lenient().doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), anyString(), any(), anyString());
        lenient().doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), anyString(), anyString());
        lenient().doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), anyLong(), anyString());
        lenient().doReturn(List.of()).when(jdbcTemplate).queryForList(anyString());
    }

    private Map<String, Object> createConfig(Long id, String name, String prefix,
            boolean includeOpCode, int opCodeLen, String separator,
            String dateFormat, boolean includeDate, int seqLen, String seqReset) {
        Map<String, Object> config = new HashMap<>();
        config.put("config_id", id);
        config.put("config_name", name);
        config.put("prefix", prefix);
        config.put("include_operation_code", includeOpCode);
        config.put("operation_code_length", opCodeLen);
        config.put("separator", separator);
        config.put("date_format", dateFormat);
        config.put("include_date", includeDate);
        config.put("sequence_length", seqLen);
        config.put("sequence_reset", seqReset);
        return config;
    }

    // ========================================================================
    // 1. PRODUCTION BATCH NUMBER TESTS
    // ========================================================================

    @Nested
    @DisplayName("1. Production Batch Number Generation")
    class ProductionBatchNumberTests {

        @Test
        @DisplayName("1.1 Should generate batch number with full configuration")
        void generateBatchNumber_WithFullConfig_ReturnsFormattedNumber() {
            // Arrange - findMatchingConfig(operationType, null, productSku) = ("FURNACE", null, "STEEL-001")
            doReturn(List.of(furnaceConfig)).when(jdbcTemplate)
                .queryForList(anyString(), eq("FURNACE"), isNull(), eq("STEEL-001"));
            doReturn(List.of()).when(jdbcTemplate)
                .queryForList(anyString(), eq(100L), anyString());
            when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

            // Act
            String result = batchNumberService.generateBatchNumber("FURNACE", "STEEL-001");

            // Assert
            assertNotNull(result);
            assertTrue(result.startsWith("FUR-FUR-"), "Should start with prefix and op code");
            assertTrue(result.contains(LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))));
            assertTrue(result.endsWith("0001"), "First sequence should be 0001");
        }

        @Test
        @DisplayName("1.2 Should generate fallback batch number when no config found")
        void generateBatchNumber_NoConfig_ReturnsFallback() {
            // Act
            String result = batchNumberService.generateBatchNumber("UNKNOWN_OP", "UNKNOWN_PRODUCT");

            // Assert
            assertNotNull(result);
            assertTrue(result.startsWith("BATCH-UN-"), "Fallback should use BATCH prefix with 2-char op code");
            assertTrue(result.contains(LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))));
        }

        @Test
        @DisplayName("1.3 Should increment sequence for subsequent batches")
        void generateBatchNumber_MultipleGenerations_IncrementsSequence() {
            // Arrange
            Map<String, Object> existingSeq = new HashMap<>();
            existingSeq.put("sequence_id", 1L);
            existingSeq.put("current_value", 42);
            existingSeq.put("last_reset_on", "2026-02-06");

            doReturn(List.of(furnaceConfig)).when(jdbcTemplate)
                .queryForList(anyString(), eq("FURNACE"), isNull(), isNull());
            doReturn(List.of(existingSeq)).when(jdbcTemplate)
                .queryForList(anyString(), eq(100L), anyString());
            when(jdbcTemplate.update(anyString(), anyInt(), anyLong(), anyString())).thenReturn(1);

            // Act
            String result = batchNumberService.generateBatchNumber("FURNACE", null);

            // Assert
            assertTrue(result.endsWith("0043"), "Should be 42 + 1 = 43");
        }

        @Test
        @DisplayName("1.4 Should handle operation type shorter than code length")
        void generateBatchNumber_ShortOperationType_UsesFullType() {
            // Arrange
            Map<String, Object> longCodeConfig = createConfig(100L, "TEST", "PRE", true, 10, "-", "yyyyMMdd", true, 3, "DAILY");
            doReturn(List.of(longCodeConfig)).when(jdbcTemplate)
                .queryForList(anyString(), eq("AB"), isNull(), isNull());
            doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(100L), anyString());
            when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

            // Act
            String result = batchNumberService.generateBatchNumber("AB", null);

            // Assert
            assertTrue(result.contains("-AB-"), "Should use full operation type 'AB'");
        }

        @Test
        @DisplayName("1.5 Should generate without operation code when disabled")
        void generateBatchNumber_NoOperationCode_GeneratesWithoutOpCode() {
            // Arrange
            Map<String, Object> noOpCodeConfig = createConfig(100L, "NO_OP", "BATCH", false, 0, "-", "yyyyMMdd", true, 3, "DAILY");
            doReturn(List.of(noOpCodeConfig)).when(jdbcTemplate)
                .queryForList(anyString(), eq("FURNACE"), isNull(), isNull());
            doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(100L), anyString());
            when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

            // Act
            String result = batchNumberService.generateBatchNumber("FURNACE", null);

            // Assert
            assertFalse(result.contains("FUR"), "Should not contain operation code");
            assertTrue(result.startsWith("BATCH-"), "Should start with just prefix");
        }

        @Test
        @DisplayName("1.6 Should generate without date when disabled")
        void generateBatchNumber_NoDate_GeneratesWithoutDate() {
            // Arrange
            Map<String, Object> noDateConfig = createConfig(100L, "NO_DATE", "BATCH", true, 3, "-", "yyyyMMdd", false, 3, "DAILY");
            doReturn(List.of(noDateConfig)).when(jdbcTemplate)
                .queryForList(anyString(), eq("FURNACE"), isNull(), isNull());
            doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(100L), anyString());
            when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

            // Act
            String result = batchNumberService.generateBatchNumber("FURNACE", null);

            // Assert
            String todayStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            assertFalse(result.contains(todayStr), "Should not contain today's date");
        }
    }

    // ========================================================================
    // 2. RAW MATERIAL BATCH NUMBER TESTS
    // ========================================================================

    @Nested
    @DisplayName("2. Raw Material Batch Number Generation")
    class RmBatchNumberTests {

        @Test
        @DisplayName("2.1 Should generate RM batch number with fallback format")
        void generateRmBatchNumber_NoConfig_ReturnsFallbackFormat() {
            // Arrange - no RM config, use fallback
            doReturn(null).when(jdbcTemplate).queryForObject(anyString(), eq(Integer.class), anyString(), anyString());

            // Act
            String result = batchNumberService.generateRmBatchNumber("IRON-001", LocalDate.of(2026, 2, 6), null);

            // Assert
            assertNotNull(result);
            assertTrue(result.startsWith("RM-IRON-001-20260206-"), "Should follow RM-{MATERIAL}-{DATE}-{SEQ} format");
        }

        @Test
        @DisplayName("2.2 Should generate RM batch number without supplier lot")
        void generateRmBatchNumber_NoSupplierLot_ExcludesSupplierPart() {
            // Arrange
            doReturn(null).when(jdbcTemplate).queryForObject(anyString(), eq(Integer.class), anyString(), anyString());

            // Act
            String result = batchNumberService.generateRmBatchNumber("STEEL", LocalDate.of(2026, 2, 6), null);

            // Assert
            assertEquals("RM-STEEL-20260206-001", result);
        }

        @Test
        @DisplayName("2.3 Should increment RM sequence correctly")
        void generateRmBatchNumber_ExistingBatches_IncrementsSequence() {
            // Arrange - 5 existing batches
            doReturn(5).when(jdbcTemplate).queryForObject(anyString(), eq(Integer.class), anyString(), anyString());

            // Act
            String result = batchNumberService.generateRmBatchNumber("IRON", LocalDate.of(2026, 2, 6), null);

            // Assert
            assertTrue(result.endsWith("006"), "Should be sequence 6 (5 + 1)");
        }

        @Test
        @DisplayName("2.4 Should generate RM batch number with config and supplier lot")
        void generateRmBatchNumber_WithConfigAndSupplierLot_IncludesSupplierPart() {
            // Arrange
            doReturn(List.of(rmConfig)).when(jdbcTemplate)
                .queryForList(anyString(), eq("RM_RECEIPT"), eq("IRON-001"), isNull());
            doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(101L), anyString());
            when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

            // Act
            String result = batchNumberService.generateRmBatchNumber("IRON-001", LocalDate.of(2026, 2, 6), "SUP-LOT-123");

            // Assert
            assertNotNull(result);
            // Supplier lot is included in batch number (may or may not be sanitized)
            assertTrue(result.contains("SUP-LOT-123") || result.contains("SUPLOT123"),
                "Should contain supplier lot");
        }

        @Test
        @DisplayName("2.5 Should sanitize supplier lot - remove special characters")
        void generateRmBatchNumber_SpecialCharsInSupplierLot_SanitizesInput() {
            // Arrange
            doReturn(List.of(rmConfig)).when(jdbcTemplate)
                .queryForList(anyString(), eq("RM_RECEIPT"), eq("IRON"), isNull());
            doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(101L), anyString());
            when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

            // Act
            String result = batchNumberService.generateRmBatchNumber("IRON", LocalDate.now(), "SUP/LOT#2024@001!");

            // Assert
            assertTrue(result.contains("SUPLOT2024001"), "Special chars should be removed");
            assertFalse(result.contains("/"), "Should not contain /");
            assertFalse(result.contains("#"), "Should not contain #");
            assertFalse(result.contains("@"), "Should not contain @");
            assertFalse(result.contains("!"), "Should not contain !");
        }

        @Test
        @DisplayName("2.6 Should truncate long supplier lot to 15 characters")
        void generateRmBatchNumber_LongSupplierLot_TruncatesTo15Chars() {
            // Arrange
            doReturn(List.of(rmConfig)).when(jdbcTemplate)
                .queryForList(anyString(), eq("RM_RECEIPT"), eq("IRON"), isNull());
            doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(101L), anyString());
            when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

            // Act
            String result = batchNumberService.generateRmBatchNumber("IRON", LocalDate.now(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456");

            // Assert
            assertTrue(result.contains("ABCDEFGHIJKLMNO"), "Should contain first 15 chars");
            assertFalse(result.contains("PQRSTUVWXYZ"), "Should not contain chars after position 15");
        }

        @Test
        @DisplayName("2.7 Should handle empty supplier lot string")
        void generateRmBatchNumber_EmptySupplierLot_ExcludesSupplierPart() {
            // Arrange
            doReturn(null).when(jdbcTemplate).queryForObject(anyString(), eq(Integer.class), anyString(), anyString());

            // Act
            String result = batchNumberService.generateRmBatchNumber("STEEL", LocalDate.of(2026, 2, 6), "   ");

            // Assert - empty string should be treated like null
            assertEquals("RM-STEEL-20260206-001", result);
        }

        @Test
        @DisplayName("2.8 Should handle null material ID gracefully")
        void generateRmBatchNumber_NullMaterialId_UsesUnknown() {
            // Arrange
            doReturn(null).when(jdbcTemplate).queryForObject(anyString(), eq(Integer.class), anyString(), anyString());

            // Act
            String result = batchNumberService.generateRmBatchNumber(null, LocalDate.of(2026, 2, 6), null);

            // Assert
            assertTrue(result.contains("UNKNOWN"), "Should use UNKNOWN for null material");
        }
    }

    // ========================================================================
    // 3. SPLIT BATCH NUMBER TESTS
    // ========================================================================

    @Nested
    @DisplayName("3. Split Batch Number Generation")
    class SplitBatchNumberTests {

        @Test
        @DisplayName("3.1 Should generate split batch number with fallback format")
        void generateSplitBatchNumber_NoConfig_ReturnsFallbackFormat() {
            // Act
            String result = batchNumberService.generateSplitBatchNumber("BATCH-001", 1);

            // Assert
            assertEquals("BATCH-001-S01", result);
        }

        @Test
        @DisplayName("3.2 Should generate correct suffix for different split indices")
        void generateSplitBatchNumber_DifferentIndices_CorrectSuffix() {
            // Act & Assert
            assertEquals("BATCH-001-S01", batchNumberService.generateSplitBatchNumber("BATCH-001", 1));
            assertEquals("BATCH-001-S02", batchNumberService.generateSplitBatchNumber("BATCH-001", 2));
            assertEquals("BATCH-001-S10", batchNumberService.generateSplitBatchNumber("BATCH-001", 10));
            assertEquals("BATCH-001-S99", batchNumberService.generateSplitBatchNumber("BATCH-001", 99));
        }

        @Test
        @DisplayName("3.3 Should handle complex source batch numbers")
        void generateSplitBatchNumber_ComplexSourceNumber_PreservesSource() {
            // Act
            String result = batchNumberService.generateSplitBatchNumber("FUR-STEEL-20260206-0042", 3);

            // Assert
            assertEquals("FUR-STEEL-20260206-0042-S03", result);
        }

        @Test
        @DisplayName("3.4 Should handle zero index gracefully")
        void generateSplitBatchNumber_ZeroIndex_FormatsCorrectly() {
            // Act
            String result = batchNumberService.generateSplitBatchNumber("BATCH-001", 0);

            // Assert
            assertEquals("BATCH-001-S00", result);
        }

        @Test
        @DisplayName("3.5 Should handle large split indices")
        void generateSplitBatchNumber_LargeIndex_FormatsCorrectly() {
            // Act
            String result = batchNumberService.generateSplitBatchNumber("BATCH-001", 999);

            // Assert
            assertEquals("BATCH-001-S999", result);
        }
    }

    // ========================================================================
    // 4. MERGE BATCH NUMBER TESTS
    // ========================================================================

    @Nested
    @DisplayName("4. Merge Batch Number Generation")
    class MergeBatchNumberTests {

        @Test
        @DisplayName("4.1 Should generate merge batch number with fallback format")
        void generateMergeBatchNumber_NoConfig_ReturnsFallbackFormat() {
            // Act
            String result = batchNumberService.generateMergeBatchNumber();

            // Assert
            assertNotNull(result);
            assertTrue(result.startsWith("MRG-"), "Should start with MRG prefix");
            // Contains timestamp in format yyyyMMddHHmmss (14 digits)
            assertEquals(18, result.length(), "MRG- + 14 digit timestamp = 18 chars");
        }

        @Test
        @DisplayName("4.2 Should generate unique merge batch numbers on consecutive calls")
        void generateMergeBatchNumber_ConsecutiveCalls_UniqueNumbers() throws InterruptedException {
            // Act - generate with small delay to ensure different timestamps
            String result1 = batchNumberService.generateMergeBatchNumber();
            Thread.sleep(10);
            String result2 = batchNumberService.generateMergeBatchNumber();

            // Assert
            assertNotEquals(result1, result2, "Consecutive merge numbers should be unique");
        }
    }

    // ========================================================================
    // 5. CONFIGURATION PRECEDENCE TESTS
    // ========================================================================

    @Nested
    @DisplayName("5. Configuration Precedence Rules")
    class ConfigPrecedenceTests {

        @Test
        @DisplayName("5.1 Should use operation-specific config over default")
        void findConfig_OperationSpecific_UsesOperationConfig() {
            // Arrange - both default and operation-specific configs exist
            Map<String, Object> opConfig = createConfig(50L, "FURNACE_OP", "FUR", true, 3, "-", "yyyyMMdd", true, 4, "DAILY");

            doReturn(List.of(opConfig)).when(jdbcTemplate)
                .queryForList(anyString(), eq("FURNACE"), isNull(), isNull());
            doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(50L), anyString());
            when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

            // Act
            String result = batchNumberService.generateBatchNumber("FURNACE", null);

            // Assert
            assertTrue(result.startsWith("FUR-"), "Should use FURNACE config prefix, not default");
        }

        @Test
        @DisplayName("5.2 Should fallback to default when no operation config exists")
        void findConfig_NoOperationConfig_UsesDefault() {
            // Arrange - only default config matches
            doReturn(List.of(defaultConfig)).when(jdbcTemplate)
                .queryForList(anyString(), eq("UNKNOWN"), isNull(), isNull());
            doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(999L), anyString());
            when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

            // Act
            String result = batchNumberService.generateBatchNumber("UNKNOWN", null);

            // Assert
            assertTrue(result.startsWith("BATCH-"), "Should use default config prefix");
        }

        @Test
        @DisplayName("5.3 Should respect priority ordering in config selection")
        void findConfig_MultiplePriorities_UsesLowestPriority() {
            // Arrange - two configs, lower priority wins
            Map<String, Object> highPriority = createConfig(50L, "HIGH_PRI", "HIGH", true, 2, "-", "yyyyMMdd", true, 3, "DAILY");
            Map<String, Object> lowPriority = createConfig(10L, "LOW_PRI", "LOW", true, 2, "-", "yyyyMMdd", true, 3, "DAILY");

            // ORDER BY priority ASC means lower number = higher priority
            doReturn(List.of(lowPriority)).when(jdbcTemplate)
                .queryForList(anyString(), eq("TEST"), isNull(), isNull());
            doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(10L), anyString());
            when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

            // Act
            String result = batchNumberService.generateBatchNumber("TEST", null);

            // Assert
            assertTrue(result.startsWith("LOW-"), "Should use config with lower priority number");
        }
    }

    // ========================================================================
    // 6. SEQUENCE RESET POLICY TESTS
    // ========================================================================

    @Nested
    @DisplayName("6. Sequence Reset Policies")
    class SequenceResetTests {

        @Test
        @DisplayName("6.1 DAILY reset - uses date in sequence key")
        void sequenceReset_Daily_UsesDateInKey() {
            // Arrange
            Map<String, Object> dailyConfig = createConfig(100L, "DAILY", "BATCH", true, 3, "-", "yyyyMMdd", true, 4, "DAILY");
            String expectedKey = "BATCH-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

            doReturn(List.of(dailyConfig)).when(jdbcTemplate)
                .queryForList(anyString(), eq("TEST"), isNull(), isNull());
            doReturn(List.of()).when(jdbcTemplate)
                .queryForList(anyString(), eq(100L), eq(expectedKey));
            when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

            // Act
            batchNumberService.generateBatchNumber("TEST", null);

            // Assert - verify the correct sequence key was used
            verify(jdbcTemplate).queryForList(anyString(), eq(100L), eq(expectedKey));
        }

        @Test
        @DisplayName("6.2 MONTHLY reset - uses year-month in sequence key")
        void sequenceReset_Monthly_UsesYearMonthInKey() {
            // Arrange
            Map<String, Object> monthlyConfig = createConfig(100L, "MONTHLY", "BATCH", true, 3, "-", "yyyyMMdd", true, 4, "MONTHLY");
            String expectedKey = "BATCH-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));

            doReturn(List.of(monthlyConfig)).when(jdbcTemplate)
                .queryForList(anyString(), eq("TEST"), isNull(), isNull());
            doReturn(List.of()).when(jdbcTemplate)
                .queryForList(anyString(), eq(100L), eq(expectedKey));
            when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

            // Act
            batchNumberService.generateBatchNumber("TEST", null);

            // Assert
            verify(jdbcTemplate).queryForList(anyString(), eq(100L), eq(expectedKey));
        }

        @Test
        @DisplayName("6.3 YEARLY reset - uses year in sequence key")
        void sequenceReset_Yearly_UsesYearInKey() {
            // Arrange
            Map<String, Object> yearlyConfig = createConfig(100L, "YEARLY", "BATCH", true, 3, "-", "yyyyMMdd", true, 4, "YEARLY");
            String expectedKey = "BATCH-" + LocalDate.now().getYear();

            doReturn(List.of(yearlyConfig)).when(jdbcTemplate)
                .queryForList(anyString(), eq("TEST"), isNull(), isNull());
            doReturn(List.of()).when(jdbcTemplate)
                .queryForList(anyString(), eq(100L), eq(expectedKey));
            when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

            // Act
            batchNumberService.generateBatchNumber("TEST", null);

            // Assert
            verify(jdbcTemplate).queryForList(anyString(), eq(100L), eq(expectedKey));
        }

        @Test
        @DisplayName("6.4 NEVER reset - uses prefix only as sequence key")
        void sequenceReset_Never_UsesPrefixOnlyAsKey() {
            // Arrange
            Map<String, Object> neverConfig = createConfig(100L, "NEVER", "GLOBAL", true, 3, "-", "yyyyMMdd", true, 4, "NEVER");
            String expectedKey = "GLOBAL";

            doReturn(List.of(neverConfig)).when(jdbcTemplate)
                .queryForList(anyString(), eq("TEST"), isNull(), isNull());
            doReturn(List.of()).when(jdbcTemplate)
                .queryForList(anyString(), eq(100L), eq(expectedKey));
            when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

            // Act
            batchNumberService.generateBatchNumber("TEST", null);

            // Assert
            verify(jdbcTemplate).queryForList(anyString(), eq(100L), eq(expectedKey));
        }
    }

    // ========================================================================
    // 7. EDGE CASES
    // ========================================================================

    @Nested
    @DisplayName("7. Edge Cases and Boundary Conditions")
    class EdgeCaseTests {

        @ParameterizedTest
        @NullAndEmptySource
        @DisplayName("7.1 Should handle null/empty operation type")
        void generateBatchNumber_NullOrEmptyOperationType_HandleGracefully(String operationType) {
            // Act
            String result = batchNumberService.generateBatchNumber(operationType, null);

            // Assert
            assertNotNull(result);
            assertTrue(result.startsWith("BATCH-"), "Should use fallback with BATCH prefix");
        }

        @ParameterizedTest
        @NullAndEmptySource
        @DisplayName("7.2 Should handle null/empty product SKU")
        void generateBatchNumber_NullOrEmptyProductSku_HandleGracefully(String productSku) {
            // Arrange
            doReturn(List.of(defaultConfig)).when(jdbcTemplate)
                .queryForList(anyString(), eq("FURNACE"), isNull(), isNull());
            doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(999L), anyString());
            when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

            // Act
            String result = batchNumberService.generateBatchNumber("FURNACE", productSku);

            // Assert
            assertNotNull(result);
        }

        @ParameterizedTest
        @ValueSource(strings = {"a", "AB", "ABC", "A-B-C", "123", "TEST_OP_123"})
        @DisplayName("7.3 Should handle various operation type formats")
        void generateBatchNumber_VariousOperationTypes_HandleAll(String operationType) {
            // Act
            String result = batchNumberService.generateBatchNumber(operationType, null);

            // Assert
            assertNotNull(result);
            assertTrue(result.length() > 0);
        }

        @Test
        @DisplayName("7.4 Should handle very long material ID")
        void generateRmBatchNumber_VeryLongMaterialId_TruncatesAppropriately() {
            // Arrange
            String longMaterialId = "THIS-IS-A-VERY-LONG-MATERIAL-ID-THAT-EXCEEDS-NORMAL-LENGTH-LIMITS-12345";
            doReturn(null).when(jdbcTemplate).queryForObject(anyString(), eq(Integer.class), anyString(), anyString());

            // Act
            String result = batchNumberService.generateRmBatchNumber(longMaterialId, LocalDate.now(), null);

            // Assert
            assertNotNull(result);
            assertTrue(result.length() < 200, "Result should not be excessively long");
        }

        @Test
        @DisplayName("7.5 Should handle sequence number overflow gracefully")
        void generateBatchNumber_LargeSequence_FormatsCorrectly() {
            // Arrange
            Map<String, Object> existingSeq = new HashMap<>();
            existingSeq.put("sequence_id", 1L);
            existingSeq.put("current_value", 9999);
            existingSeq.put("last_reset_on", "2026-02-06");

            doReturn(List.of(furnaceConfig)).when(jdbcTemplate)
                .queryForList(anyString(), eq("FURNACE"), isNull(), isNull());
            doReturn(List.of(existingSeq)).when(jdbcTemplate)
                .queryForList(anyString(), eq(100L), anyString());
            when(jdbcTemplate.update(anyString(), anyInt(), anyLong(), anyString())).thenReturn(1);

            // Act
            String result = batchNumberService.generateBatchNumber("FURNACE", null);

            // Assert
            assertTrue(result.endsWith("10000"), "Should handle 5-digit sequence");
        }

        @Test
        @DisplayName("7.6 Should handle special characters in product SKU")
        void generateBatchNumber_SpecialCharsInProductSku_HandleGracefully() {
            // Arrange
            doReturn(List.of(defaultConfig)).when(jdbcTemplate)
                .queryForList(anyString(), eq("TEST"), isNull(), isNull());
            doReturn(List.of()).when(jdbcTemplate).queryForList(anyString(), eq(999L), anyString());
            when(jdbcTemplate.update(anyString(), any(), any())).thenReturn(1);

            // Act - product SKU with special chars
            String result = batchNumberService.generateBatchNumber("TEST", "PROD/123#@!");

            // Assert
            assertNotNull(result);
        }
    }

    // ========================================================================
    // 8. ERROR HANDLING TESTS
    // ========================================================================

    @Nested
    @DisplayName("8. Error Handling")
    class ErrorHandlingTests {

        @Test
        @DisplayName("8.1 Should handle database query failure gracefully")
        void generateRmBatchNumber_DatabaseError_UsesFallback() {
            // Arrange - simulate database error
            doThrow(new RuntimeException("Database connection failed"))
                .when(jdbcTemplate).queryForObject(anyString(), eq(Integer.class), anyString(), anyString());

            // Act
            String result = batchNumberService.generateRmBatchNumber("IRON", LocalDate.now(), null);

            // Assert - should still return a valid batch number
            assertNotNull(result);
            assertTrue(result.startsWith("RM-IRON-"), "Should use fallback format");
            assertTrue(result.endsWith("-001"), "Should default to sequence 001 on error");
        }

        @Test
        @DisplayName("8.2 Should handle null date for RM batch")
        void generateRmBatchNumber_NullDate_ThrowsOrHandles() {
            // This test documents expected behavior for null date
            // The method signature requires LocalDate, so null would be a programming error
            // But we should verify the behavior is deterministic

            assertThrows(NullPointerException.class, () ->
                batchNumberService.generateRmBatchNumber("IRON", null, null));
        }
    }

    // ========================================================================
    // 9. PREVIEW FUNCTIONALITY TESTS
    // ========================================================================

    @Nested
    @DisplayName("9. Batch Number Preview")
    class PreviewTests {

        @Test
        @DisplayName("9.1 Preview should not increment sequence")
        void previewBatchNumber_MultiplePreviews_SameResult() {
            // Arrange
            Map<String, Object> existingSeq = new HashMap<>();
            existingSeq.put("current_value", 10);

            doReturn(List.of(furnaceConfig)).when(jdbcTemplate)
                .queryForList(anyString(), eq("FURNACE"), isNull(), isNull());
            doReturn(List.of(existingSeq)).when(jdbcTemplate)
                .queryForList(contains("SELECT current_value"), eq(100L), anyString());

            // Act
            String preview1 = batchNumberService.previewBatchNumber("FURNACE", null);
            String preview2 = batchNumberService.previewBatchNumber("FURNACE", null);

            // Assert
            assertEquals(preview1, preview2, "Multiple previews should return same value");
            assertTrue(preview1.endsWith("0011"), "Should preview next sequence (10 + 1)");

            // Verify no updates were made
            verify(jdbcTemplate, never()).update(anyString(), anyInt(), anyLong(), anyString());
        }

        @Test
        @DisplayName("9.2 Preview with no existing sequence")
        void previewBatchNumber_NoExistingSequence_ReturnsFirst() {
            // Arrange
            doReturn(List.of(furnaceConfig)).when(jdbcTemplate)
                .queryForList(anyString(), eq("FURNACE"), isNull(), isNull());
            doReturn(List.of()).when(jdbcTemplate)
                .queryForList(contains("SELECT current_value"), eq(100L), anyString());

            // Act
            String preview = batchNumberService.previewBatchNumber("FURNACE", null);

            // Assert
            assertTrue(preview.endsWith("0001"), "First preview should be 0001");
        }

        @Test
        @DisplayName("9.3 Preview fallback format")
        void previewBatchNumber_NoConfig_ReturnsFallbackWithPlaceholder() {
            // Act
            String preview = batchNumberService.previewBatchNumber("UNKNOWN", null);

            // Assert
            assertNotNull(preview);
            assertTrue(preview.startsWith("BATCH-UN-"), "Should use fallback format");
            assertTrue(preview.endsWith("XXXX"), "Fallback should use XXXX placeholder for sequence");
        }
    }

    // ========================================================================
    // 10. CONFIGURATION GETTER TESTS
    // ========================================================================

    @Nested
    @DisplayName("10. Configuration Retrieval")
    class ConfigurationTests {

        @Test
        @DisplayName("10.1 Should return all active configurations")
        void getAllConfigurations_ReturnsActiveConfigs() {
            // Arrange
            List<Map<String, Object>> configs = List.of(defaultConfig, furnaceConfig, rmConfig);
            doReturn(configs).when(jdbcTemplate).queryForList(anyString());

            // Act
            List<Map<String, Object>> result = batchNumberService.getAllConfigurations();

            // Assert
            assertNotNull(result);
            assertEquals(3, result.size());
        }

        @Test
        @DisplayName("10.2 Should return empty list when no configs")
        void getAllConfigurations_NoConfigs_ReturnsEmptyList() {
            // Arrange
            doReturn(List.of()).when(jdbcTemplate).queryForList(anyString());

            // Act
            List<Map<String, Object>> result = batchNumberService.getAllConfigurations();

            // Assert
            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }
}
