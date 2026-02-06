package com.mes.production.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Service for configurable batch number generation.
 * Implements GAP-005: Configurable Batch Number Generation.
 *
 * Batch number format: {prefix}{separator}{operation_code}{separator}{date}{separator}{sequence}
 *
 * Configuration options:
 * - prefix: Custom prefix (e.g., "BATCH", "SC", "FUR")
 * - include_operation_code: Whether to include operation type abbreviation
 * - operation_code_length: How many characters of operation type to use
 * - separator: Character between components (e.g., "-", "_")
 * - date_format: Java DateTimeFormatter pattern
 * - include_date: Whether to include date in batch number
 * - sequence_length: Zero-padded sequence number length
 * - sequence_reset: When to reset sequence (DAILY, MONTHLY, YEARLY, NEVER)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BatchNumberService {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Configuration record from batch_number_config table
     */
    public static class BatchNumberConfig {
        private Long configId;
        private String configName;
        private String prefix;
        private boolean includeOperationCode;
        private int operationCodeLength;
        private String separator;
        private String dateFormat;
        private boolean includeDate;
        private int sequenceLength;
        private String sequenceReset;

        public Long getConfigId() { return configId; }
        public void setConfigId(Long configId) { this.configId = configId; }
        public String getConfigName() { return configName; }
        public void setConfigName(String configName) { this.configName = configName; }
        public String getPrefix() { return prefix; }
        public void setPrefix(String prefix) { this.prefix = prefix; }
        public boolean isIncludeOperationCode() { return includeOperationCode; }
        public void setIncludeOperationCode(boolean includeOperationCode) { this.includeOperationCode = includeOperationCode; }
        public int getOperationCodeLength() { return operationCodeLength; }
        public void setOperationCodeLength(int operationCodeLength) { this.operationCodeLength = operationCodeLength; }
        public String getSeparator() { return separator; }
        public void setSeparator(String separator) { this.separator = separator; }
        public String getDateFormat() { return dateFormat; }
        public void setDateFormat(String dateFormat) { this.dateFormat = dateFormat; }
        public boolean isIncludeDate() { return includeDate; }
        public void setIncludeDate(boolean includeDate) { this.includeDate = includeDate; }
        public int getSequenceLength() { return sequenceLength; }
        public void setSequenceLength(int sequenceLength) { this.sequenceLength = sequenceLength; }
        public String getSequenceReset() { return sequenceReset; }
        public void setSequenceReset(String sequenceReset) { this.sequenceReset = sequenceReset; }
    }

    /**
     * Generate a batch number for production output.
     *
     * @param operationType The operation type (e.g., FURNACE, ROLLING)
     * @param productSku    The product SKU (optional)
     * @return Generated batch number
     */
    @Transactional
    public String generateBatchNumber(String operationType, String productSku) {
        log.info("Generating batch number for operationType={}, productSku={}", operationType, productSku);

        // Find matching configuration
        BatchNumberConfig config = findMatchingConfig(operationType, productSku);
        if (config == null) {
            log.warn("No batch number configuration found, using fallback pattern");
            return generateFallbackBatchNumber(operationType);
        }

        return generateFromConfig(config, operationType);
    }

    /**
     * Generate a batch number for split operations.
     *
     * @param sourceBatchNumber The source batch number being split
     * @param splitIndex        The index of the split (1, 2, 3, etc.)
     * @return Generated batch number for the split batch
     */
    @Transactional
    public String generateSplitBatchNumber(String sourceBatchNumber, int splitIndex) {
        log.info("Generating split batch number for source={}, splitIndex={}", sourceBatchNumber, splitIndex);

        // Find split configuration
        BatchNumberConfig config = findMatchingConfig("SPLIT", null);
        if (config != null) {
            String baseNumber = generateFromConfig(config, "SPLIT");
            return baseNumber + config.getSeparator() + String.format("%02d", splitIndex);
        }

        // Fallback: append suffix to source batch
        return sourceBatchNumber + "-S" + String.format("%02d", splitIndex);
    }

    /**
     * Generate a batch number for merge operations.
     *
     * @return Generated batch number for the merged batch
     */
    @Transactional
    public String generateMergeBatchNumber() {
        log.info("Generating merge batch number");

        // Find merge configuration
        BatchNumberConfig config = findMatchingConfig("MERGE", null);
        if (config != null) {
            return generateFromConfig(config, "MERGE");
        }

        // Fallback - use milliseconds for uniqueness
        return "MRG-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
    }

    /**
     * Generate a batch number for Raw Material receipt.
     * Per MES Batch Number Specification:
     * - Format: RM-{MATERIALCODE}-{YYYYMMDD}-{SEQ} (default)
     * - If supplier lot is provided and config allows, can include supplier lot prefix
     *
     * @param materialId The material code (e.g., RM-IRON-001)
     * @param receivedDate The date material was received
     * @param supplierBatchNumber Optional supplier lot number for traceability
     * @return Generated batch number for the RM batch
     */
    @Transactional
    public String generateRmBatchNumber(String materialId, LocalDate receivedDate, String supplierBatchNumber) {
        log.info("Generating RM batch number for materialId={}, supplierBatch={}", materialId, supplierBatchNumber);

        // Check for RM-specific configuration with material-level matching
        // Per MES spec Section 6: precedence is operation > material > default
        BatchNumberConfig config = findMatchingConfig("RM_RECEIPT", materialId, null);
        if (config != null) {
            return generateRmFromConfig(config, materialId, receivedDate, supplierBatchNumber);
        }

        // Fallback: standard RM format RM-{MATERIALCODE}-{YYYYMMDD}-{SEQ}
        return generateFallbackRmBatchNumber(materialId, receivedDate);
    }

    /**
     * Generate RM batch number from configuration.
     */
    private String generateRmFromConfig(BatchNumberConfig config, String materialId,
                                         LocalDate receivedDate, String supplierBatchNumber) {
        StringBuilder batchNumber = new StringBuilder();
        String separator = config.getSeparator();

        // 1. Add prefix (typically "RM")
        batchNumber.append(config.getPrefix());

        // 2. Add material code if configured
        if (config.isIncludeOperationCode() && materialId != null) {
            batchNumber.append(separator);
            String matCode = materialId.toUpperCase();
            // Use full material code or truncate based on config
            if (config.getOperationCodeLength() > 0 && matCode.length() > config.getOperationCodeLength()) {
                matCode = matCode.substring(0, config.getOperationCodeLength());
            }
            batchNumber.append(matCode);
        }

        // 3. Add supplier batch number if provided (for traceability)
        if (supplierBatchNumber != null && !supplierBatchNumber.trim().isEmpty()) {
            batchNumber.append(separator);
            // Sanitize supplier batch number (remove special characters)
            String sanitized = supplierBatchNumber.replaceAll("[^A-Za-z0-9-]", "").toUpperCase();
            // Limit length to prevent overly long batch numbers
            if (sanitized.length() > 15) {
                sanitized = sanitized.substring(0, 15);
            }
            batchNumber.append(sanitized);
        }

        // 4. Add date if configured
        String dateStr = "";
        if (config.isIncludeDate()) {
            dateStr = receivedDate.format(DateTimeFormatter.ofPattern(config.getDateFormat()));
            batchNumber.append(separator);
            batchNumber.append(dateStr);
        }

        // 5. Add sequence number
        batchNumber.append(separator);
        int nextSeq = getNextSequence(config, dateStr);
        String seqFormat = "%0" + config.getSequenceLength() + "d";
        batchNumber.append(String.format(seqFormat, nextSeq));

        String result = batchNumber.toString();
        log.info("Generated RM batch number: {} using config: {}", result, config.getConfigName());
        return result;
    }

    /**
     * Fallback RM batch number generation when no configuration found.
     * Format: RM-{MATERIALCODE}-{YYYYMMDD}-{SEQ}
     */
    private String generateFallbackRmBatchNumber(String materialId, LocalDate receivedDate) {
        String dateStr = receivedDate.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String matCode = materialId != null ? materialId.toUpperCase() : "UNKNOWN";
        String prefix = "RM-" + matCode + "-" + dateStr + "-";

        // Get next sequence by querying existing batch numbers with this prefix
        String sql = """
            SELECT MAX(CAST(SUBSTRING(batch_number FROM LENGTH(?) + 1) AS INTEGER))
            FROM batches
            WHERE batch_number LIKE ?
            """;

        try {
            Integer maxSeq = jdbcTemplate.queryForObject(sql, Integer.class, prefix, prefix + "%");
            int nextSeq = (maxSeq != null ? maxSeq : 0) + 1;
            return prefix + String.format("%03d", nextSeq);
        } catch (Exception e) {
            // If query fails, use timestamp fallback
            log.warn("Failed to get RM sequence, using timestamp fallback: {}", e.getMessage());
            return prefix + String.format("%03d", 1);
        }
    }

    /**
     * Find the matching batch number configuration based on operation type and product SKU.
     * Per MES Batch Number Specification Section 6, precedence order (highest to lowest):
     * 1. Exact match on operation_type AND product_sku
     * 2. Match on operation_type only (product_sku is NULL)
     * 3. Default configuration (operation_type is NULL)
     */
    private BatchNumberConfig findMatchingConfig(String operationType, String productSku) {
        return findMatchingConfig(operationType, null, productSku);
    }

    /**
     * Find the matching batch number configuration with material_id support.
     * Per MES Batch Number Specification Section 6, precedence order (highest to lowest):
     * 1. Exact match on operation_type AND material_id AND product_sku
     * 2. Match on operation_type AND material_id only
     * 3. Match on operation_type AND product_sku only
     * 4. Match on operation_type only
     * 5. Default configuration (operation_type is NULL)
     *
     * @param operationType The operation type (FURNACE, ROLLING, RM_RECEIPT, SPLIT, MERGE, etc.)
     * @param materialId    The material ID for material-level configuration (used for RM)
     * @param productSku    The product SKU for product-level configuration
     * @return Matching configuration or null if none found
     */
    private BatchNumberConfig findMatchingConfig(String operationType, String materialId, String productSku) {
        // SQL includes material_id for material-level configuration per MES spec
        String sql = """
            SELECT config_id, config_name, prefix, include_operation_code, operation_code_length,
                   separator, date_format, include_date, sequence_length, sequence_reset
            FROM batch_number_config
            WHERE status = 'ACTIVE'
              AND (operation_type = ? OR operation_type IS NULL)
              AND (material_id = ? OR material_id IS NULL)
              AND (product_sku = ? OR product_sku IS NULL)
            ORDER BY priority ASC
            LIMIT 1
            """;

        List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, operationType, materialId, productSku);
        if (results.isEmpty()) {
            return null;
        }

        Map<String, Object> row = results.get(0);
        BatchNumberConfig config = new BatchNumberConfig();
        config.setConfigId(((Number) row.get("config_id")).longValue());
        config.setConfigName((String) row.get("config_name"));
        config.setPrefix((String) row.get("prefix"));
        config.setIncludeOperationCode((Boolean) row.get("include_operation_code"));
        config.setOperationCodeLength((Integer) row.get("operation_code_length"));
        config.setSeparator((String) row.get("separator"));
        config.setDateFormat((String) row.get("date_format"));
        config.setIncludeDate((Boolean) row.get("include_date"));
        config.setSequenceLength((Integer) row.get("sequence_length"));
        config.setSequenceReset((String) row.get("sequence_reset"));

        log.debug("Found batch number config: {}", config.getConfigName());
        return config;
    }

    /**
     * Generate batch number from configuration.
     */
    private String generateFromConfig(BatchNumberConfig config, String operationType) {
        StringBuilder batchNumber = new StringBuilder();
        String separator = config.getSeparator();

        // 1. Add prefix
        batchNumber.append(config.getPrefix());

        // 2. Add operation code if configured
        if (config.isIncludeOperationCode() && operationType != null) {
            batchNumber.append(separator);
            int codeLength = Math.min(config.getOperationCodeLength(), operationType.length());
            batchNumber.append(operationType.substring(0, codeLength).toUpperCase());
        }

        // 3. Add date if configured
        String dateStr = "";
        if (config.isIncludeDate()) {
            dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern(config.getDateFormat()));
            batchNumber.append(separator);
            batchNumber.append(dateStr);
        }

        // 4. Add sequence number
        batchNumber.append(separator);
        int nextSeq = getNextSequence(config, dateStr);
        String seqFormat = "%0" + config.getSequenceLength() + "d";
        batchNumber.append(String.format(seqFormat, nextSeq));

        String result = batchNumber.toString();
        log.info("Generated batch number: {} using config: {}", result, config.getConfigName());
        return result;
    }

    /**
     * Get the next sequence number for the given configuration and date.
     */
    private int getNextSequence(BatchNumberConfig config, String dateStr) {
        // Build sequence key based on reset policy
        String sequenceKey = buildSequenceKey(config, dateStr);

        // Try to get existing sequence
        String selectSql = """
            SELECT sequence_id, current_value, last_reset_on
            FROM batch_number_sequence
            WHERE config_id = ? AND sequence_key = ?
            FOR UPDATE
            """;

        List<Map<String, Object>> existing = jdbcTemplate.queryForList(selectSql, config.getConfigId(), sequenceKey);

        if (existing.isEmpty()) {
            // Create new sequence starting at 1
            String insertSql = """
                INSERT INTO batch_number_sequence (config_id, sequence_key, current_value, last_reset_on, updated_on)
                VALUES (?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """;
            jdbcTemplate.update(insertSql, config.getConfigId(), sequenceKey);
            return 1;
        } else {
            // Increment existing sequence
            int currentValue = ((Number) existing.get(0).get("current_value")).intValue();
            int nextValue = currentValue + 1;

            String updateSql = """
                UPDATE batch_number_sequence
                SET current_value = ?, updated_on = CURRENT_TIMESTAMP
                WHERE config_id = ? AND sequence_key = ?
                """;
            jdbcTemplate.update(updateSql, nextValue, config.getConfigId(), sequenceKey);
            return nextValue;
        }
    }

    /**
     * Build the sequence key based on reset policy.
     */
    private String buildSequenceKey(BatchNumberConfig config, String dateStr) {
        return switch (config.getSequenceReset()) {
            case "NEVER" -> config.getPrefix();
            case "YEARLY" -> config.getPrefix() + "-" + LocalDate.now().getYear();
            case "MONTHLY" -> config.getPrefix() + "-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
            case "DAILY" -> config.getPrefix() + "-" + dateStr;
            default -> config.getPrefix() + "-" + dateStr;
        };
    }

    /**
     * Fallback batch number generation when no configuration found.
     */
    private String generateFallbackBatchNumber(String operationType) {
        String prefix = "BATCH";
        if (operationType != null && operationType.length() >= 2) {
            prefix = "BATCH-" + operationType.substring(0, 2).toUpperCase();
        }
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String timestamp = String.valueOf(System.currentTimeMillis() % 10000);
        return prefix + "-" + dateStr + "-" + timestamp;
    }

    /**
     * Get all active batch number configurations.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllConfigurations() {
        String sql = """
            SELECT config_id, config_name, operation_type, product_sku, prefix,
                   include_operation_code, operation_code_length, separator,
                   date_format, include_date, sequence_length, sequence_reset, priority
            FROM batch_number_config
            WHERE status = 'ACTIVE'
            ORDER BY priority
            """;
        return jdbcTemplate.queryForList(sql);
    }

    /**
     * Preview the next batch number WITHOUT incrementing the sequence.
     * Used for P07: Batch Number Preview API.
     *
     * @param operationType The operation type (e.g., FURNACE, ROLLING)
     * @param productSku    The product SKU (optional)
     * @return Preview of the next batch number that would be generated
     */
    @Transactional(readOnly = true)
    public String previewBatchNumber(String operationType, String productSku) {
        log.info("Previewing batch number for operationType={}, productSku={}", operationType, productSku);

        // Find matching configuration
        BatchNumberConfig config = findMatchingConfig(operationType, productSku);
        if (config == null) {
            log.warn("No batch number configuration found, using fallback pattern for preview");
            return previewFallbackBatchNumber(operationType);
        }

        return previewFromConfig(config, operationType);
    }

    /**
     * Preview batch number from configuration (without incrementing sequence).
     */
    private String previewFromConfig(BatchNumberConfig config, String operationType) {
        StringBuilder batchNumber = new StringBuilder();
        String separator = config.getSeparator();

        // 1. Add prefix
        batchNumber.append(config.getPrefix());

        // 2. Add operation code if configured
        if (config.isIncludeOperationCode() && operationType != null) {
            batchNumber.append(separator);
            int codeLength = Math.min(config.getOperationCodeLength(), operationType.length());
            batchNumber.append(operationType.substring(0, codeLength).toUpperCase());
        }

        // 3. Add date if configured
        String dateStr = "";
        if (config.isIncludeDate()) {
            dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern(config.getDateFormat()));
            batchNumber.append(separator);
            batchNumber.append(dateStr);
        }

        // 4. Add preview sequence number (peek without increment)
        batchNumber.append(separator);
        int nextSeq = peekNextSequence(config, dateStr);
        String seqFormat = "%0" + config.getSequenceLength() + "d";
        batchNumber.append(String.format(seqFormat, nextSeq));

        String result = batchNumber.toString();
        log.debug("Preview batch number: {} using config: {}", result, config.getConfigName());
        return result;
    }

    /**
     * Peek at the next sequence number WITHOUT incrementing.
     */
    private int peekNextSequence(BatchNumberConfig config, String dateStr) {
        String sequenceKey = buildSequenceKey(config, dateStr);

        String selectSql = """
            SELECT current_value
            FROM batch_number_sequence
            WHERE config_id = ? AND sequence_key = ?
            """;

        List<Map<String, Object>> existing = jdbcTemplate.queryForList(selectSql, config.getConfigId(), sequenceKey);

        if (existing.isEmpty()) {
            // No sequence yet, next would be 1
            return 1;
        } else {
            // Next would be current + 1
            int currentValue = ((Number) existing.get(0).get("current_value")).intValue();
            return currentValue + 1;
        }
    }

    /**
     * Fallback batch number preview when no configuration found.
     */
    private String previewFallbackBatchNumber(String operationType) {
        String prefix = "BATCH";
        if (operationType != null && operationType.length() >= 2) {
            prefix = "BATCH-" + operationType.substring(0, 2).toUpperCase();
        }
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        // Use a placeholder for the timestamp portion since it would vary
        return prefix + "-" + dateStr + "-XXXX";
    }
}
