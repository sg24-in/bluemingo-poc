package com.mes.production.controller;

import com.mes.production.service.DatabaseResetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * REST API for database reset and demo seeding operations.
 *
 * WARNING: These endpoints can DELETE ALL DATA.
 * Only enabled in non-production environments.
 *
 * Endpoints:
 * - GET  /api/admin/reset/status       - Check if reset is allowed
 * - GET  /api/admin/reset/verify       - Verify database state
 * - POST /api/admin/reset/transactional - Reset transactional data only
 * - POST /api/admin/reset/full         - Reset ALL data
 * - POST /api/admin/reset/demo         - Full demo reset + reseed + generate operations
 * - POST /api/admin/reset/generate-operations - Generate operations for existing orders
 * - GET  /api/admin/reset/history      - Get reset history
 */
@RestController
@RequestMapping("/api/admin/reset")
@RequiredArgsConstructor
@Slf4j
public class DatabaseResetController {

    private final DatabaseResetService databaseResetService;

    /**
     * Check if database reset is allowed in current environment.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getResetStatus() {
        log.info("GET /api/admin/reset/status");
        return ResponseEntity.ok(databaseResetService.getEnvironmentInfo());
    }

    /**
     * Verify current database state - counts of all tables.
     */
    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyDatabaseState() {
        log.info("GET /api/admin/reset/verify");
        return ResponseEntity.ok(databaseResetService.verifyDatabaseState());
    }

    /**
     * Reset transactional data only (preserves master data).
     * Clears: orders, operations, batches, inventory, confirmations, audit trail
     */
    @PostMapping("/transactional")
    public ResponseEntity<?> resetTransactionalData(Principal principal) {
        String username = principal != null ? principal.getName() : "anonymous";
        log.warn("POST /api/admin/reset/transactional by user: {}", username);

        if (!databaseResetService.isResetAllowed()) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "Database reset is BLOCKED in this environment",
                    "allowed", false
            ));
        }

        try {
            var result = databaseResetService.resetTransactionalData(username);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Failed to reset transactional data", e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Reset ALL data including master data.
     * WARNING: This deletes EVERYTHING.
     */
    @PostMapping("/full")
    public ResponseEntity<?> resetAllData(Principal principal) {
        String username = principal != null ? principal.getName() : "anonymous";
        log.warn("POST /api/admin/reset/full by user: {}", username);

        if (!databaseResetService.isResetAllowed()) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "Database reset is BLOCKED in this environment",
                    "allowed", false
            ));
        }

        try {
            var result = databaseResetService.resetAllData(username);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Failed to reset all data", e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Full demo reset: Clear all data, reseed, and generate operations.
     * This is the ONE-COMMAND workflow for demo preparation.
     *
     * Steps:
     * 1. Delete all transactional AND master data
     * 2. Re-run seed SQL (patches 034-036 will run on next startup)
     * 3. Generate operations from routings for all orders
     * 4. Log audit trail entry
     */
    @PostMapping("/demo")
    public ResponseEntity<?> fullDemoReset(Principal principal) {
        String username = principal != null ? principal.getName() : "anonymous";
        log.warn("POST /api/admin/reset/demo by user: {}", username);

        if (!databaseResetService.isResetAllowed()) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "Database reset is BLOCKED in this environment",
                    "allowed", false
            ));
        }

        try {
            var result = databaseResetService.fullDemoReset(username);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Failed to perform full demo reset", e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Generate operations for all order line items that don't have operations yet.
     * Use this after seeding orders to create runtime operations from routing templates.
     */
    @PostMapping("/generate-operations")
    public ResponseEntity<?> generateOperations(Principal principal) {
        String username = principal != null ? principal.getName() : "anonymous";
        log.info("POST /api/admin/reset/generate-operations by user: {}", username);

        if (!databaseResetService.isResetAllowed()) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "Database operations are BLOCKED in this environment",
                    "allowed", false
            ));
        }

        try {
            int operationsGenerated = databaseResetService.generateOperationsForAllOrders(username);
            return ResponseEntity.ok(Map.of(
                    "operationsGenerated", operationsGenerated,
                    "message", "Operations generated successfully"
            ));
        } catch (Exception e) {
            log.error("Failed to generate operations", e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Seed demo data after reset.
     * Note: This primarily generates operations from existing routings.
     */
    @PostMapping("/seed")
    public ResponseEntity<?> seedDemoData(Principal principal) {
        String username = principal != null ? principal.getName() : "anonymous";
        log.info("POST /api/admin/reset/seed by user: {}", username);

        if (!databaseResetService.isResetAllowed()) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "Database operations are BLOCKED in this environment",
                    "allowed", false
            ));
        }

        try {
            var result = databaseResetService.seedDemoData(username);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Failed to seed demo data", e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Get history of database reset operations.
     */
    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getResetHistory(
            @RequestParam(defaultValue = "10") int limit) {
        log.info("GET /api/admin/reset/history?limit={}", limit);
        return ResponseEntity.ok(databaseResetService.getResetHistory(limit));
    }
}
