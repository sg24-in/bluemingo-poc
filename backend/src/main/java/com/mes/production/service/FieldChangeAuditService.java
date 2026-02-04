package com.mes.production.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for detecting and auditing field-level changes.
 * Implements GAP-007: Comprehensive Audit Trail with field-level tracking.
 *
 * Features:
 * - Automatic comparison of old and new entity values
 * - Logs individual field changes with old/new values
 * - Supports all common field types
 * - Excludes system fields from auditing
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FieldChangeAuditService {

    private final AuditService auditService;

    // Fields to exclude from field-level auditing
    private static final Set<String> EXCLUDED_FIELDS = Set.of(
            "updatedOn", "updatedBy", "createdOn", "createdBy",
            "hibernateLazyInitializer", "handler", "serialVersionUID"
    );

    /**
     * Record of a single field change
     */
    public record FieldChange(String fieldName, String oldValue, String newValue) {}

    /**
     * Compare two objects and log all field changes.
     *
     * @param entityType  The entity type for audit logging
     * @param entityId    The entity ID
     * @param oldEntity   The entity before changes
     * @param newEntity   The entity after changes
     * @param fields      Specific fields to track (null for all fields)
     */
    public void auditFieldChanges(String entityType, Long entityId,
                                   Object oldEntity, Object newEntity,
                                   Set<String> fields) {
        if (oldEntity == null || newEntity == null) {
            log.warn("Cannot audit null entities for {} #{}", entityType, entityId);
            return;
        }

        List<FieldChange> changes = detectFieldChanges(oldEntity, newEntity, fields);

        for (FieldChange change : changes) {
            auditService.logUpdate(entityType, entityId, change.fieldName(),
                    change.oldValue(), change.newValue());
        }

        if (!changes.isEmpty()) {
            log.info("Audited {} field changes for {} #{}", changes.size(), entityType, entityId);
        }
    }

    /**
     * Compare two objects and return list of field changes.
     */
    public List<FieldChange> detectFieldChanges(Object oldEntity, Object newEntity,
                                                  Set<String> fieldsToTrack) {
        List<FieldChange> changes = new ArrayList<>();

        if (oldEntity == null || newEntity == null) {
            return changes;
        }

        Class<?> clazz = oldEntity.getClass();
        Field[] fields = getAllFields(clazz);

        for (Field field : fields) {
            field.setAccessible(true);

            // Skip excluded fields
            if (EXCLUDED_FIELDS.contains(field.getName())) {
                continue;
            }

            // Skip if specific fields specified and this isn't one
            if (fieldsToTrack != null && !fieldsToTrack.contains(field.getName())) {
                continue;
            }

            try {
                Object oldValue = field.get(oldEntity);
                Object newValue = field.get(newEntity);

                if (!valuesEqual(oldValue, newValue)) {
                    changes.add(new FieldChange(
                            field.getName(),
                            formatValue(oldValue),
                            formatValue(newValue)
                    ));
                }
            } catch (IllegalAccessException e) {
                log.debug("Cannot access field {} on {}", field.getName(), clazz.getSimpleName());
            }
        }

        return changes;
    }

    /**
     * Audit changes for a production confirmation.
     * Tracks: producedQty, scrapQty, startTime, endTime, delayMinutes, delayReason, notes
     */
    public void auditProductionConfirmationChanges(Long confirmationId,
                                                     Object oldConfirmation,
                                                     Object newConfirmation) {
        Set<String> trackedFields = Set.of(
                "producedQty", "scrapQty", "startTime", "endTime",
                "delayMinutes", "delayReason", "notes", "status"
        );
        auditFieldChanges("PRODUCTION_CONFIRMATION", confirmationId,
                oldConfirmation, newConfirmation, trackedFields);
    }

    /**
     * Audit changes for an inventory record.
     * Tracks: quantity, state, location
     */
    public void auditInventoryChanges(Long inventoryId,
                                       Object oldInventory,
                                       Object newInventory) {
        Set<String> trackedFields = Set.of(
                "quantity", "state", "location", "blockReason"
        );
        auditFieldChanges("INVENTORY", inventoryId,
                oldInventory, newInventory, trackedFields);
    }

    /**
     * Audit changes for a batch record.
     * Tracks: quantity, status
     */
    public void auditBatchChanges(Long batchId,
                                   Object oldBatch,
                                   Object newBatch) {
        Set<String> trackedFields = Set.of(
                "quantity", "status"
        );
        auditFieldChanges("BATCH", batchId,
                oldBatch, newBatch, trackedFields);
    }

    /**
     * Audit changes for an operation.
     * Tracks: status, targetQty, confirmedQty
     */
    public void auditOperationChanges(Long operationId,
                                       Object oldOperation,
                                       Object newOperation) {
        Set<String> trackedFields = Set.of(
                "status", "targetQty", "confirmedQty"
        );
        auditFieldChanges("OPERATION", operationId,
                oldOperation, newOperation, trackedFields);
    }

    /**
     * Get all fields including inherited fields.
     */
    private Field[] getAllFields(Class<?> clazz) {
        List<Field> fields = new ArrayList<>();
        while (clazz != null && clazz != Object.class) {
            fields.addAll(Arrays.asList(clazz.getDeclaredFields()));
            clazz = clazz.getSuperclass();
        }
        return fields.toArray(new Field[0]);
    }

    /**
     * Compare two values for equality.
     */
    private boolean valuesEqual(Object v1, Object v2) {
        if (v1 == null && v2 == null) return true;
        if (v1 == null || v2 == null) return false;

        // Handle BigDecimal comparison (scale-insensitive)
        if (v1 instanceof BigDecimal && v2 instanceof BigDecimal) {
            return ((BigDecimal) v1).compareTo((BigDecimal) v2) == 0;
        }

        return v1.equals(v2);
    }

    /**
     * Format a value for storage in audit log.
     */
    private String formatValue(Object value) {
        if (value == null) return null;

        if (value instanceof BigDecimal) {
            return ((BigDecimal) value).stripTrailingZeros().toPlainString();
        }

        if (value instanceof LocalDateTime) {
            return value.toString();
        }

        if (value instanceof Collection) {
            return "Collection[" + ((Collection<?>) value).size() + " items]";
        }

        return value.toString();
    }

    /**
     * Log a simple field change directly.
     */
    public void logFieldChange(String entityType, Long entityId,
                                String fieldName, Object oldValue, Object newValue) {
        if (!valuesEqual(oldValue, newValue)) {
            auditService.logUpdate(entityType, entityId, fieldName,
                    formatValue(oldValue), formatValue(newValue));
        }
    }
}
