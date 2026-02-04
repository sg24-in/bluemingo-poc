package com.mes.production.service.patch;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(1) // Run first before other runners
@Slf4j
@RequiredArgsConstructor
public class PatchRunner implements ApplicationRunner {

    private final PatchService patchService;

    @Override
    public void run(ApplicationArguments args) {
        log.info("=================================================");
        log.info("Starting Database Patch Application...");
        log.info("=================================================");

        // Initialize the patches table
        patchService.initializePatchTable();

        // Apply pending patches - throws exception if any fail
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
