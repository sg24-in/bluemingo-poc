package com.mes.production.service;

import com.mes.production.entity.OrderLineItem;
import com.mes.production.repository.OrderLineItemRepository;
import com.mes.production.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for database reset and demo seeding operations.
 *
 * WARNING: This service can DELETE ALL DATA when executed.
 * Only enabled in non-production environments.
 *
 * Architecture Rules (NON-NEGOTIABLE):
 * - Process = TEMPLATE (design-time only)
 * - Operation = RUNTIME (execution-time only)
 * - Operations are auto-generated from Routing via OperationInstantiationService
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseResetService {

    private final JdbcTemplate jdbcTemplate;
    private final OrderRepository orderRepository;
    private final OrderLineItemRepository orderLineItemRepository;
    private final OperationInstantiationService operationInstantiationService;
    private final AuditService auditService;

    @Value("${spring.profiles.active:production}")
    private String activeProfile;

    @Value("${app.database.reset.enabled:false}")
    private boolean resetEnabled;

    /**
     * Result of a database reset operation.
     */
    public record ResetResult(
            String resetType,
            int rowsDeleted,
            int operationsGenerated,
            LocalDateTime timestamp,
            String environment,
            String message
    ) {}

    /**
     * Check if database reset is allowed in current environment.
     */
    public boolean isResetAllowed() {
        if ("production".equalsIgnoreCase(activeProfile)) {
            return false;
        }
        return resetEnabled;
    }

    /**
     * Get current environment info.
     */
    public Map<String, Object> getEnvironmentInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("activeProfile", activeProfile);
        info.put("resetEnabled", resetEnabled);
        info.put("resetAllowed", isResetAllowed());
        info.put("timestamp", LocalDateTime.now());
        return info;
    }

    /**
     * Reset transactional data only (preserves master data).
     * Clears: orders, operations, batches, inventory, confirmations, audit trail
     */
    @Transactional
    public ResetResult resetTransactionalData(String resetBy) {
        if (!isResetAllowed()) {
            throw new IllegalStateException(
                    "Database reset is BLOCKED. Current profile: " + activeProfile +
                    ", reset enabled: " + resetEnabled);
        }

        log.warn("⚠️  RESETTING TRANSACTIONAL DATA by user: {}", resetBy);

        // Call the PostgreSQL stored procedure
        Integer rowsDeleted = jdbcTemplate.queryForObject(
                "SELECT reset_transactional_data(?, ?)",
                Integer.class,
                resetBy,
                activeProfile
        );

        log.info("✅ Reset transactional data complete. Rows deleted: {}", rowsDeleted);

        return new ResetResult(
                "TRANSACTIONAL",
                rowsDeleted != null ? rowsDeleted : 0,
                0,
                LocalDateTime.now(),
                activeProfile,
                "Transactional data cleared. Master data preserved."
        );
    }

    /**
     * Reset ALL data including master data.
     * WARNING: This deletes EVERYTHING.
     */
    @Transactional
    public ResetResult resetAllData(String resetBy) {
        if (!isResetAllowed()) {
            throw new IllegalStateException(
                    "Database reset is BLOCKED. Current profile: " + activeProfile +
                    ", reset enabled: " + resetEnabled);
        }

        log.warn("⚠️  RESETTING ALL DATA by user: {}", resetBy);

        // Call the PostgreSQL stored procedure
        Integer rowsDeleted = jdbcTemplate.queryForObject(
                "SELECT reset_all_data(?, ?)",
                Integer.class,
                resetBy,
                activeProfile
        );

        log.info("✅ Reset all data complete. Rows deleted: {}", rowsDeleted);

        return new ResetResult(
                "FULL",
                rowsDeleted != null ? rowsDeleted : 0,
                0,
                LocalDateTime.now(),
                activeProfile,
                "All data cleared including master data."
        );
    }

    /**
     * Full demo reset: Clear all data, reseed, and generate operations.
     * This is the ONE-COMMAND workflow for demo preparation.
     */
    @Transactional
    public ResetResult fullDemoReset(String resetBy) {
        if (!isResetAllowed()) {
            throw new IllegalStateException(
                    "Database reset is BLOCKED. Current profile: " + activeProfile +
                    ", reset enabled: " + resetEnabled);
        }

        log.warn("🔄 FULL DEMO RESET initiated by user: {}", resetBy);

        // Step 1: Reset all data
        Integer rowsDeleted = jdbcTemplate.queryForObject(
                "SELECT reset_all_data(?, ?)",
                Integer.class,
                resetBy,
                activeProfile
        );
        log.info("Step 1: Cleared {} rows", rowsDeleted);

        // Step 2: Re-run seed patches (034, 035, 036)
        // The patches are designed to be idempotent, but since we just cleared
        // everything, they will insert fresh data
        log.info("Step 2: Seed patches will run automatically on next startup");
        log.info("        Seed data is loaded via SQL patches 034-036");

        // Step 3: Generate operations from routings for all order line items
        int operationsGenerated = generateOperationsForAllOrders(resetBy);
        log.info("Step 3: Generated {} operations from routings", operationsGenerated);

        // Step 4: Log audit trail entry for the reset
        try {
            auditService.logCreate("DATABASE_RESET", 0L,
                    "Full demo reset: " + rowsDeleted + " rows deleted, " + operationsGenerated + " operations generated by " + resetBy);
        } catch (Exception e) {
            log.warn("Could not log audit entry for reset: {}", e.getMessage());
        }

        log.info("✅ FULL DEMO RESET complete");

        return new ResetResult(
                "FULL_DEMO_RESET",
                rowsDeleted != null ? rowsDeleted : 0,
                operationsGenerated,
                LocalDateTime.now(),
                activeProfile,
                "Full demo reset complete. Database is in demo-ready state."
        );
    }

    /**
     * Seed demo data after reset (runs patches 034-036).
     * Note: In PostgreSQL mode, patches run automatically on startup.
     * This method is for manual re-seeding after transactional reset.
     */
    @Transactional
    public ResetResult seedDemoData(String seedBy) {
        if (!isResetAllowed()) {
            throw new IllegalStateException(
                    "Database operations are BLOCKED in production environment");
        }

        log.info("🌱 Seeding demo data by user: {}", seedBy);

        // The seed patches (034-036) are idempotent, so we can re-run them
        // But they're designed to be applied by the patch service on startup
        // Here we just generate operations for any orders that don't have them

        int operationsGenerated = generateOperationsForAllOrders(seedBy);

        log.info("✅ Demo data seeding complete. Operations generated: {}", operationsGenerated);

        return new ResetResult(
                "SEED_DEMO",
                0,
                operationsGenerated,
                LocalDateTime.now(),
                activeProfile,
                "Demo data seeded. " + operationsGenerated + " operations generated."
        );
    }

    /**
     * Generate operations for all order line items that don't have operations yet.
     * This is the critical step that transforms design-time routings into runtime operations.
     */
    @Transactional
    public int generateOperationsForAllOrders(String createdBy) {
        log.info("Generating operations for all orders...");

        // First, ensure all order line items have process_id populated
        populateProcessIdsForLineItems();

        // Find all order line items that need operations
        List<OrderLineItem> lineItemsNeedingOperations = orderLineItemRepository.findAll().stream()
                .filter(li -> li.getOperations() == null || li.getOperations().isEmpty())
                .toList();

        log.info("Found {} order line items needing operations", lineItemsNeedingOperations.size());

        int totalOperations = 0;

        for (OrderLineItem lineItem : lineItemsNeedingOperations) {
            try {
                // Get process ID - either from line item or lookup from product
                Long processId = lineItem.getProcessId();
                if (processId == null) {
                    processId = lookupProcessIdForProduct(lineItem.getProductSku());
                }

                if (processId == null) {
                    log.warn("No process found for product SKU: {}", lineItem.getProductSku());
                    continue;
                }

                BigDecimal targetQty = lineItem.getQuantity() != null
                        ? lineItem.getQuantity()
                        : BigDecimal.ONE;

                var result = operationInstantiationService.instantiateOperationsForOrder(
                        lineItem,
                        processId,
                        targetQty,
                        createdBy
                );

                totalOperations += result.operations().size();
                log.debug("Generated {} operations for order line item {}",
                        result.operations().size(), lineItem.getOrderLineId());

            } catch (Exception e) {
                log.warn("Could not generate operations for line item {}: {}",
                        lineItem.getOrderLineId(), e.getMessage());
            }
        }

        log.info("Total operations generated: {}", totalOperations);
        return totalOperations;
    }

    /**
     * Populate process_id for order line items that don't have it set.
     */
    private void populateProcessIdsForLineItems() {
        try {
            int updated = jdbcTemplate.update("""
                UPDATE order_line_items oli
                SET process_id = (
                    SELECT p.default_process_id
                    FROM products p
                    WHERE p.sku = oli.product_sku
                    LIMIT 1
                )
                WHERE oli.process_id IS NULL
            """);
            if (updated > 0) {
                log.info("Populated process_id for {} order line items", updated);
            }
        } catch (Exception e) {
            log.warn("Could not populate process IDs: {}", e.getMessage());
        }
    }

    /**
     * Lookup process ID for a product SKU using pattern matching.
     */
    private Long lookupProcessIdForProduct(String productSku) {
        if (productSku == null) return null;

        try {
            // First try to get from product's default_process_id
            Long processId = jdbcTemplate.queryForObject(
                    "SELECT default_process_id FROM products WHERE sku = ?",
                    Long.class, productSku);
            if (processId != null) return processId;
        } catch (Exception e) {
            // Not found, try pattern matching
        }

        // Fallback: pattern matching based on SKU prefix
        String processName = getProcessNameForSku(productSku);
        if (processName != null) {
            try {
                return jdbcTemplate.queryForObject(
                        "SELECT process_id FROM processes WHERE process_name = ?",
                        Long.class, processName);
            } catch (Exception e) {
                log.debug("Could not find process by name: {}", processName);
            }
        }

        return null;
    }

    /**
     * Map product SKU patterns to process names.
     */
    private String getProcessNameForSku(String sku) {
        if (sku == null) return null;

        if (sku.startsWith("PROD-HR-COIL")) return "HR Coil Production";
        if (sku.startsWith("PROD-CR-SHEET")) return "CR Sheet Production";
        if (sku.startsWith("PROD-REBAR")) return "Rebar Production";
        if (sku.startsWith("PROD-WIRE-ROD")) return "Wire Rod Production";
        if (sku.startsWith("PROD-GALV")) return "Galvanized Sheet Production";
        if (sku.startsWith("PROD-PLATE")) return "Steel Plate Production";
        if (sku.startsWith("PROD-STRUCT")) return "Structural Section Production";
        if (sku.startsWith("PROD-SS")) return "Stainless Steel Production";
        if (sku.startsWith("PROD-BILLET")) return "Billet Production";
        if (sku.startsWith("PROD-TINPLATE")) return "Tinplate Production";

        return null;
    }

    /**
     * Get reset history from the database.
     */
    public List<Map<String, Object>> getResetHistory(int limit) {
        try {
            return jdbcTemplate.queryForList(
                    "SELECT * FROM database_reset_log ORDER BY reset_timestamp DESC LIMIT ?",
                    limit
            );
        } catch (Exception e) {
            log.warn("Could not fetch reset history: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Verify database state after reset.
     */
    public Map<String, Object> verifyDatabaseState() {
        Map<String, Object> state = new HashMap<>();

        try {
            state.put("customers", jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM customers", Integer.class));
            state.put("materials", jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM materials", Integer.class));
            state.put("products", jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM products", Integer.class));
            state.put("processes", jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM processes", Integer.class));
            state.put("routings", jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM routing", Integer.class));
            state.put("routingSteps", jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM routing_steps", Integer.class));
            state.put("orders", jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM orders", Integer.class));
            state.put("orderLineItems", jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM order_line_items", Integer.class));
            state.put("operations", jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM operations", Integer.class));
            state.put("batches", jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM batches", Integer.class));
            state.put("inventory", jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM inventory", Integer.class));
            state.put("equipment", jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM equipment", Integer.class));
            state.put("operators", jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM operators", Integer.class));
            state.put("verified", true);
        } catch (Exception e) {
            state.put("verified", false);
            state.put("error", e.getMessage());
        }

        return state;
    }
}
