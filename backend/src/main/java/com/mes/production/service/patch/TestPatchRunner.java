package com.mes.production.service.patch;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Patch runner for test profile.
 * Runs AFTER TestSchemaReset (which has HIGHEST_PRECEDENCE).
 */
@Component
@Order(2) // Run after TestSchemaReset
@Slf4j
@RequiredArgsConstructor
@Profile("test")
public class TestPatchRunner implements ApplicationRunner {

    private final PatchService patchService;

    @Override
    public void run(ApplicationArguments args) {
        log.info("=================================================");
        log.info("TEST MODE: Starting Database Patch Application...");
        log.info("=================================================");

        // Initialize the patches table
        patchService.initializePatchTable();

        // Apply all patches (schema was just reset)
        PatchService.PatchResult result = patchService.applyPendingPatches();

        log.info("=================================================");
        if (result.isSuccess()) {
            log.info("Database Patch Application Completed Successfully.");
            log.info("Applied: {} patches", result.getSuccessCount());
        } else {
            log.error("DATABASE PATCH APPLICATION FAILED!");
            log.error("Success: {}, Failed: {}", result.getSuccessCount(), result.getFailCount());
            log.error("Failed patch: #{} - {}", result.getFailedPatchNumber(), result.getFailedPatchName());
            log.error("Error: {}", result.getErrorMessage());
            log.info("=================================================");

            throw new RuntimeException(
                    "Database patch application failed at patch #" + result.getFailedPatchNumber() +
                    " (" + result.getFailedPatchName() + "): " + result.getErrorMessage() +
                    "\n\nFix the patch file and restart the application.");
        }
        log.info("=================================================");
    }
}
