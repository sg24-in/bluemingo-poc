package com.mes.production.service.patch;

import com.mes.production.entity.DatabasePatch;
import com.mes.production.repository.DatabasePatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class PatchService {

    private final JdbcTemplate jdbcTemplate;
    private final DatabasePatchRepository patchRepository;

    @Value("${app.patch.location:classpath:patches/}")
    private String patchLocation;

    @Value("${app.patch.enabled:true}")
    private boolean patchEnabled;

    // Pattern: 001_description.sql, 002_another_patch.sql
    private static final Pattern PATCH_FILE_PATTERN = Pattern.compile("^(\\d{3})_(.+)\\.sql$");

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
     * Apply all pending patches
     */
    @Transactional
    public void applyPendingPatches() {
        if (!patchEnabled) {
            log.info("Patch application is disabled.");
            return;
        }

        log.info("Checking for pending database patches...");

        // Get last applied patch number
        Integer lastAppliedPatch = patchRepository.findLastAppliedPatchNumber().orElse(0);
        log.info("Last applied patch number: {}", lastAppliedPatch);

        // Get all patch files
        List<PatchFile> patchFiles = discoverPatchFiles();

        if (patchFiles.isEmpty()) {
            log.info("No patch files found in {}", patchLocation);
            return;
        }

        // Filter pending patches
        List<PatchFile> pendingPatches = patchFiles.stream()
                .filter(p -> p.patchNumber > lastAppliedPatch)
                .sorted(Comparator.comparingInt(p -> p.patchNumber))
                .collect(Collectors.toList());

        if (pendingPatches.isEmpty()) {
            log.info("No pending patches to apply. Database is up to date.");
            return;
        }

        log.info("Found {} pending patches to apply.", pendingPatches.size());

        // Apply each patch
        for (PatchFile patchFile : pendingPatches) {
            applyPatch(patchFile);
        }

        log.info("All patches applied successfully.");
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
     * Apply a single patch
     */
    private void applyPatch(PatchFile patchFile) {
        log.info("Applying patch #{}: {} ({})", patchFile.patchNumber, patchFile.patchName, patchFile.fileName);

        long startTime = System.currentTimeMillis();
        String errorMessage = null;
        boolean success = false;

        try {
            // Read SQL content
            String sqlContent = readResourceContent(patchFile.resource);
            String checksum = calculateChecksum(sqlContent);

            // Check if already applied (double-check)
            if (patchRepository.existsByPatchNumber(patchFile.patchNumber)) {
                log.warn("Patch #{} already exists in database, skipping.", patchFile.patchNumber);
                return;
            }

            // Execute the SQL
            executeSqlStatements(sqlContent);
            success = true;

            log.info("Patch #{} applied successfully.", patchFile.patchNumber);

            // Record the patch
            long executionTime = System.currentTimeMillis() - startTime;
            recordPatch(patchFile, executionTime, checksum, true, null);

        } catch (Exception e) {
            errorMessage = e.getMessage();
            log.error("Error applying patch #{}: {}", patchFile.patchNumber, errorMessage);

            // Record failed patch
            long executionTime = System.currentTimeMillis() - startTime;
            recordPatch(patchFile, executionTime, null, false, errorMessage);

            // Continue with next patch (as per requirement - no error checking)
            log.warn("Continuing with next patch despite error...");
        }
    }

    /**
     * Execute SQL statements from content
     */
    private void executeSqlStatements(String sqlContent) {
        // Split by semicolon, but be careful with strings containing semicolons
        String[] statements = sqlContent.split(";(?=(?:[^']*'[^']*')*[^']*$)");

        for (String statement : statements) {
            String trimmed = statement.trim();
            if (!trimmed.isEmpty() && !trimmed.startsWith("--")) {
                jdbcTemplate.execute(trimmed);
            }
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
     * Record patch in database
     */
    private void recordPatch(PatchFile patchFile, long executionTimeMs, String checksum,
                            boolean success, String errorMessage) {
        DatabasePatch patch = DatabasePatch.builder()
                .patchNumber(patchFile.patchNumber)
                .patchName(patchFile.patchName)
                .fileName(patchFile.fileName)
                .appliedOn(LocalDateTime.now())
                .appliedBy("SYSTEM")
                .executionTimeMs(executionTimeMs)
                .checksum(checksum)
                .success(success)
                .errorMessage(errorMessage)
                .build();

        patchRepository.save(patch);
    }

    /**
     * Get patch status
     */
    public Map<String, Object> getPatchStatus() {
        Map<String, Object> status = new HashMap<>();

        List<PatchFile> allPatches = discoverPatchFiles();
        Integer lastApplied = patchRepository.findLastAppliedPatchNumber().orElse(0);
        long appliedCount = patchRepository.countAppliedPatches();

        status.put("totalPatchFiles", allPatches.size());
        status.put("appliedPatches", appliedCount);
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
