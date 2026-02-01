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

        try {
            // Initialize the patches table
            patchService.initializePatchTable();

            // Apply pending patches
            patchService.applyPendingPatches();

            log.info("=================================================");
            log.info("Database Patch Application Completed.");
            log.info("=================================================");

        } catch (Exception e) {
            log.error("Error during patch application: {}", e.getMessage(), e);
            // Don't throw - let application continue
        }
    }
}
