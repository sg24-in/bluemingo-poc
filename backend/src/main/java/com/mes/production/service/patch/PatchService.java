package com.mes.production.service.patch;

import com.mes.production.entity.DatabasePatch;
import com.mes.production.repository.DatabasePatchRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Slf4j
public class PatchService {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;
    private final DatabasePatchRepository patchRepository;

    @Value("${app.patch.location:classpath:patches/}")
    private String patchLocation;

    @Value("${app.patch.enabled:true}")
    private boolean patchEnabled;

    // Pattern: 001_description.sql, 002_another_patch.sql
    private static final Pattern PATCH_FILE_PATTERN = Pattern.compile("^(\\d{3})_(.+)\\.sql$");

    public PatchService(JdbcTemplate jdbcTemplate, DataSource dataSource, DatabasePatchRepository patchRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
        this.patchRepository = patchRepository;
    }

    /**
     * Initialize the patches table if it doesn't exist
     */
    public void initializePatchTable() {
        log.info("Initializing database patches table...");

        String createTableSql = """
            CREATE TABLE IF NOT EXISTS database_patches (
                id BIGSERIAL PRIMARY KEY,
                patch_number INTEGER NOT NULL UNIQUE,
                patch_name VARCHAR(255) NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                applied_on TIMESTAMP NOT NULL,
                applied_by VARCHAR(100),
                execution_time_ms BIGINT,
                checksum VARCHAR(64),
                success BOOLEAN NOT NULL,
                error_message TEXT
            )
            """;

        jdbcTemplate.execute(createTableSql);
        log.info("Database patches table initialized.");
    }

    /**
     * Result of patch application
     */
    public static class PatchResult {
        private final boolean success;
        private final int successCount;
        private final int failCount;
        private final int failedPatchNumber;
        private final String failedPatchName;
        private final String errorMessage;

        private PatchResult(boolean success, int successCount, int failCount,
                           int failedPatchNumber, String failedPatchName, String errorMessage) {
            this.success = success;
            this.successCount = successCount;
            this.failCount = failCount;
            this.failedPatchNumber = failedPatchNumber;
            this.failedPatchName = failedPatchName;
            this.errorMessage = errorMessage;
        }

        public static PatchResult success(int count) {
            return new PatchResult(true, count, 0, 0, null, null);
        }

        public static PatchResult failure(int successCount, int failedPatchNumber, String failedPatchName, String error) {
            return new PatchResult(false, successCount, 1, failedPatchNumber, failedPatchName, error);
        }

        public boolean isSuccess() { return success; }
        public int getSuccessCount() { return successCount; }
        public int getFailCount() { return failCount; }
        public int getFailedPatchNumber() { return failedPatchNumber; }
        public String getFailedPatchName() { return failedPatchName; }
        public String getErrorMessage() { return errorMessage; }
    }

    /**
     * Apply all pending patches
     * Each patch runs in its own connection to ensure isolation.
     * Returns result indicating success/failure.
     */
    public PatchResult applyPendingPatches() {
        if (!patchEnabled) {
            log.info("Patch application is disabled.");
            return PatchResult.success(0);
        }

        log.info("Checking for pending database patches...");

        // Get last applied patch number using direct JDBC to avoid transaction issues
        int lastAppliedPatch = getLastAppliedPatchNumber();
        log.info("Last applied patch number: {}", lastAppliedPatch);

        // Get all patch files
        List<PatchFile> patchFiles = discoverPatchFiles();

        if (patchFiles.isEmpty()) {
            log.info("No patch files found in {}", patchLocation);
            return PatchResult.success(0);
        }

        // Check for duplicate patch numbers
        Map<Integer, List<PatchFile>> patchesByNumber = patchFiles.stream()
                .collect(Collectors.groupingBy(p -> p.patchNumber));
        for (Map.Entry<Integer, List<PatchFile>> entry : patchesByNumber.entrySet()) {
            if (entry.getValue().size() > 1) {
                String duplicates = entry.getValue().stream().map(p -> p.fileName).collect(Collectors.joining(", "));
                log.error("DUPLICATE PATCH NUMBER DETECTED: Patch #{} has {} files: {}",
                        entry.getKey(), entry.getValue().size(), duplicates);
                return PatchResult.failure(0, entry.getKey(), "DUPLICATE", "Duplicate patch files: " + duplicates);
            }
        }

        // Filter pending patches
        List<PatchFile> pendingPatches = patchFiles.stream()
                .filter(p -> p.patchNumber > lastAppliedPatch)
                .sorted(Comparator.comparingInt(p -> p.patchNumber))
                .collect(Collectors.toList());

        if (pendingPatches.isEmpty()) {
            log.info("No pending patches to apply. Database is up to date.");
            return PatchResult.success(0);
        }

        log.info("Found {} pending patches to apply.", pendingPatches.size());

        int successCount = 0;
        String lastError = null;
        PatchFile failedPatch = null;

        // Apply each patch in its own connection
        for (PatchFile patchFile : pendingPatches) {
            lastError = applyPatchIsolated(patchFile);
            if (lastError == null) {
                successCount++;
            } else {
                failedPatch = patchFile;
                log.error("Stopping patch application due to failure. Subsequent patches may depend on this one.");
                break;
            }
        }

        if (failedPatch != null) {
            log.error("Patch application completed with errors. Success: {}, Failed: 1", successCount);
            return PatchResult.failure(successCount, failedPatch.patchNumber, failedPatch.patchName, lastError);
        } else {
            log.info("All {} patches applied successfully.", successCount);
            return PatchResult.success(successCount);
        }
    }

    /**
     * Get last applied patch number using direct JDBC
     */
    private int getLastAppliedPatchNumber() {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(
                     "SELECT MAX(patch_number) FROM database_patches WHERE success = true")) {
            if (rs.next()) {
                int result = rs.getInt(1);
                return rs.wasNull() ? 0 : result;
            }
            return 0;
        } catch (Exception e) {
            log.debug("Could not get last patch number (table may not exist yet): {}", e.getMessage());
            return 0;
        }
    }

    /**
     * Check if patch was already applied successfully
     */
    private boolean isPatchApplied(int patchNumber) {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "SELECT COUNT(*) FROM database_patches WHERE patch_number = ? AND success = true")) {
            stmt.setInt(1, patchNumber);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1) > 0;
                }
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Delete failed patch record to allow retry
     */
    private void deleteFailedPatchRecord(int patchNumber) {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     "DELETE FROM database_patches WHERE patch_number = ? AND success = false")) {
            stmt.setInt(1, patchNumber);
            int deleted = stmt.executeUpdate();
            if (deleted > 0) {
                log.info("Deleted {} failed patch record(s) for patch #{}", deleted, patchNumber);
            }
        } catch (Exception e) {
            log.warn("Could not delete failed patch record: {}", e.getMessage());
        }
    }

    /**
     * Discover all patch files from the configured location
     */
    private List<PatchFile> discoverPatchFiles() {
        List<PatchFile> patchFiles = new ArrayList<>();

        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resolver.getResources(patchLocation + "*.sql");

            for (Resource resource : resources) {
                String fileName = resource.getFilename();
                if (fileName == null) continue;

                Matcher matcher = PATCH_FILE_PATTERN.matcher(fileName);
                if (matcher.matches()) {
                    int patchNumber = Integer.parseInt(matcher.group(1));
                    String patchName = matcher.group(2);

                    patchFiles.add(new PatchFile(patchNumber, patchName, fileName, resource));
                    log.debug("Discovered patch file: {} (patch #{})", fileName, patchNumber);
                } else {
                    log.warn("Ignoring file with invalid naming convention: {}", fileName);
                }
            }
        } catch (IOException e) {
            log.error("Error discovering patch files: {}", e.getMessage());
        }

        return patchFiles;
    }

    /**
     * Apply a single patch in its own isolated connection.
     * Returns null if successful, error message if failed.
     */
    private String applyPatchIsolated(PatchFile patchFile) {
        log.info("Applying patch #{}: {} ({})", patchFile.patchNumber, patchFile.patchName, patchFile.fileName);

        long startTime = System.currentTimeMillis();

        // Check if already applied successfully
        if (isPatchApplied(patchFile.patchNumber)) {
            log.warn("Patch #{} already applied successfully, skipping.", patchFile.patchNumber);
            return null; // Success - already applied
        }

        // Delete any previous failed attempts
        deleteFailedPatchRecord(patchFile.patchNumber);

        String sqlContent;
        String checksum;
        try {
            sqlContent = readResourceContent(patchFile.resource);
            checksum = calculateChecksum(sqlContent);
        } catch (IOException e) {
            String errorMsg = "Error reading file: " + e.getMessage();
            log.error("Error reading patch file #{}: {}", patchFile.patchNumber, e.getMessage());
            recordPatchDirect(patchFile, System.currentTimeMillis() - startTime, null, false, errorMsg);
            return errorMsg;
        }

        // Execute patch in its own connection with auto-commit off
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);

            try {
                executeSqlStatementsWithConnection(conn, sqlContent);
                conn.commit();

                long executionTime = System.currentTimeMillis() - startTime;
                log.info("Patch #{} applied successfully in {}ms.", patchFile.patchNumber, executionTime);

                // Record success
                recordPatchDirect(patchFile, executionTime, checksum, true, null);
                return null; // Success

            } catch (Exception e) {
                conn.rollback();
                long executionTime = System.currentTimeMillis() - startTime;
                String errorMsg = e.getMessage();
                if (errorMsg != null && errorMsg.length() > 2000) {
                    errorMsg = errorMsg.substring(0, 2000) + "...";
                }
                log.error("Error applying patch #{}: {}", patchFile.patchNumber, errorMsg);

                // Record failure in a separate connection (so it commits even after rollback)
                recordPatchDirect(patchFile, executionTime, checksum, false, errorMsg);
                return errorMsg;
            }
        } catch (Exception e) {
            String errorMsg = "Connection error: " + e.getMessage();
            log.error("Connection error for patch #{}: {}", patchFile.patchNumber, e.getMessage());
            recordPatchDirect(patchFile, System.currentTimeMillis() - startTime, null, false, errorMsg);
            return errorMsg;
        }
    }

    /**
     * Execute SQL statements using a specific connection.
     * Custom parser that handles PostgreSQL dollar-quoted strings ($$ ... $$).
     */
    private void executeSqlStatementsWithConnection(Connection conn, String sqlContent) throws Exception {
        List<String> statements = splitSqlStatements(sqlContent);

        int statementCount = 0;
        for (String statement : statements) {
            String trimmed = statement.trim();
            if (trimmed.isEmpty()) continue;
            // Skip pure comment lines
            if (trimmed.startsWith("--") && !trimmed.contains("\n")) continue;

            try (Statement stmt = conn.createStatement()) {
                stmt.execute(trimmed);
                statementCount++;
            }
        }
        log.debug("Executed {} SQL statements", statementCount);
    }

    /**
     * Split SQL content into individual statements.
     * Handles single-quoted strings, dollar-quoted strings, and SQL comments.
     */
    private List<String> splitSqlStatements(String sqlContent) {
        List<String> statements = new ArrayList<>();
        StringBuilder currentStatement = new StringBuilder();
        int i = 0;
        int len = sqlContent.length();

        while (i < len) {
            char c = sqlContent.charAt(i);

            // Check for single-line comment
            if (c == '-' && i + 1 < len && sqlContent.charAt(i + 1) == '-') {
                // Find end of line
                int endOfLine = sqlContent.indexOf('\n', i);
                if (endOfLine == -1) endOfLine = len;
                currentStatement.append(sqlContent, i, endOfLine);
                i = endOfLine;
                continue;
            }

            // Check for block comment
            if (c == '/' && i + 1 < len && sqlContent.charAt(i + 1) == '*') {
                int endComment = sqlContent.indexOf("*/", i + 2);
                if (endComment == -1) endComment = len - 2;
                currentStatement.append(sqlContent, i, endComment + 2);
                i = endComment + 2;
                continue;
            }

            // Check for single-quoted string
            if (c == '\'') {
                currentStatement.append(c);
                i++;
                while (i < len) {
                    char sc = sqlContent.charAt(i);
                    currentStatement.append(sc);
                    if (sc == '\'' && (i + 1 >= len || sqlContent.charAt(i + 1) != '\'')) {
                        i++;
                        break;
                    }
                    if (sc == '\'' && i + 1 < len && sqlContent.charAt(i + 1) == '\'') {
                        // Escaped quote
                        currentStatement.append(sqlContent.charAt(i + 1));
                        i += 2;
                    } else {
                        i++;
                    }
                }
                continue;
            }

            // Check for dollar-quoted string ($$ or $tag$)
            if (c == '$') {
                // Find the dollar-quote tag (e.g., $$ or $tag$)
                int tagEnd = i + 1;
                while (tagEnd < len && (Character.isLetterOrDigit(sqlContent.charAt(tagEnd)) || sqlContent.charAt(tagEnd) == '_')) {
                    tagEnd++;
                }
                if (tagEnd < len && sqlContent.charAt(tagEnd) == '$') {
                    String dollarTag = sqlContent.substring(i, tagEnd + 1);
                    currentStatement.append(dollarTag);
                    i = tagEnd + 1;
                    // Find closing tag
                    int closeTag = sqlContent.indexOf(dollarTag, i);
                    if (closeTag != -1) {
                        currentStatement.append(sqlContent, i, closeTag + dollarTag.length());
                        i = closeTag + dollarTag.length();
                    } else {
                        // No closing tag found, append rest
                        currentStatement.append(sqlContent.substring(i));
                        i = len;
                    }
                    continue;
                }
            }

            // Check for statement separator
            if (c == ';') {
                String stmt = currentStatement.toString().trim();
                if (!stmt.isEmpty()) {
                    statements.add(stmt);
                }
                currentStatement = new StringBuilder();
                i++;
                continue;
            }

            currentStatement.append(c);
            i++;
        }

        // Add final statement if any
        String finalStmt = currentStatement.toString().trim();
        if (!finalStmt.isEmpty()) {
            statements.add(finalStmt);
        }

        return statements;
    }

    /**
     * Record patch using direct JDBC (separate connection to ensure it commits)
     */
    private void recordPatchDirect(PatchFile patchFile, long executionTimeMs, String checksum,
                                   boolean success, String errorMessage) {
        String sql = """
            INSERT INTO database_patches
            (patch_number, patch_name, file_name, applied_on, applied_by, execution_time_ms, checksum, success, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, patchFile.patchNumber);
            stmt.setString(2, patchFile.patchName);
            stmt.setString(3, patchFile.fileName);
            stmt.setObject(4, LocalDateTime.now());
            stmt.setString(5, "SYSTEM");
            stmt.setLong(6, executionTimeMs);
            stmt.setString(7, checksum);
            stmt.setBoolean(8, success);
            stmt.setString(9, errorMessage);
            stmt.executeUpdate();
        } catch (Exception e) {
            log.error("Failed to record patch status: {}", e.getMessage());
        }
    }

    /**
     * Read content from a resource
     */
    private String readResourceContent(Resource resource) throws IOException {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            return reader.lines().collect(Collectors.joining("\n"));
        }
    }

    /**
     * Calculate MD5 checksum of content
     */
    private String calculateChecksum(String content) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(content.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            return null;
        }
    }

    /**
     * Get patch status
     */
    public Map<String, Object> getPatchStatus() {
        Map<String, Object> status = new HashMap<>();

        List<PatchFile> allPatches = discoverPatchFiles();
        int lastApplied = getLastAppliedPatchNumber();

        status.put("totalPatchFiles", allPatches.size());
        status.put("lastAppliedPatchNumber", lastApplied);
        status.put("pendingPatches", allPatches.stream()
                .filter(p -> p.patchNumber > lastApplied)
                .count());

        return status;
    }

    /**
     * Internal class to hold patch file info
     */
    private static class PatchFile {
        int patchNumber;
        String patchName;
        String fileName;
        Resource resource;

        PatchFile(int patchNumber, String patchName, String fileName, Resource resource) {
            this.patchNumber = patchNumber;
            this.patchName = patchName;
            this.fileName = fileName;
            this.resource = resource;
        }
    }
}
