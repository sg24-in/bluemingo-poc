package com.mes.production.service;

import com.mes.production.entity.Inventory;
import com.mes.production.repository.HoldRecordRepository;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

/**
 * Centralized service for validating inventory state transitions.
 * Enforces the state machine rules for inventory lifecycle.
 *
 * Valid State Transitions:
 * AVAILABLE → RESERVED, CONSUMED, BLOCKED, ON_HOLD
 * RESERVED → AVAILABLE, CONSUMED, BLOCKED
 * CONSUMED → (terminal - no transitions allowed)
 * BLOCKED → AVAILABLE, SCRAPPED
 * ON_HOLD → AVAILABLE, BLOCKED
 * SCRAPPED → (terminal - no transitions allowed)
 * PRODUCED → AVAILABLE, CONSUMED, BLOCKED (output from production)
 */
@Service
public class InventoryStateValidator {

    private final HoldRecordRepository holdRecordRepository;

    // Define valid state transitions
    private static final Map<String, Set<String>> VALID_TRANSITIONS = Map.of(
        Inventory.STATE_AVAILABLE, Set.of(
            Inventory.STATE_RESERVED,
            Inventory.STATE_CONSUMED,
            Inventory.STATE_BLOCKED,
            Inventory.STATE_ON_HOLD
        ),
        Inventory.STATE_RESERVED, Set.of(
            Inventory.STATE_AVAILABLE,
            Inventory.STATE_CONSUMED,
            Inventory.STATE_BLOCKED
        ),
        Inventory.STATE_PRODUCED, Set.of(
            Inventory.STATE_AVAILABLE,
            Inventory.STATE_CONSUMED,
            Inventory.STATE_BLOCKED
        ),
        Inventory.STATE_BLOCKED, Set.of(
            Inventory.STATE_AVAILABLE,
            Inventory.STATE_SCRAPPED
        ),
        Inventory.STATE_ON_HOLD, Set.of(
            Inventory.STATE_AVAILABLE,
            Inventory.STATE_BLOCKED
        ),
        // Terminal states - no transitions allowed
        Inventory.STATE_CONSUMED, Set.of(),
        Inventory.STATE_SCRAPPED, Set.of()
    );

    // States that allow consumption in production
    private static final Set<String> CONSUMABLE_STATES = Set.of(
        Inventory.STATE_AVAILABLE,
        Inventory.STATE_RESERVED  // Only if reserved for the same order
    );

    // States that allow modifications (quantity, location, etc.)
    private static final Set<String> MODIFIABLE_STATES = Set.of(
        Inventory.STATE_AVAILABLE,
        Inventory.STATE_RESERVED,
        Inventory.STATE_PRODUCED,
        Inventory.STATE_ON_HOLD
    );

    public InventoryStateValidator(HoldRecordRepository holdRecordRepository) {
        this.holdRecordRepository = holdRecordRepository;
    }

    /**
     * Validates if a state transition is allowed.
     * @throws IllegalStateException if transition is not valid
     */
    public void validateTransition(String currentState, String newState) {
        if (currentState == null) {
            throw new IllegalStateException("Current state cannot be null");
        }
        if (newState == null) {
            throw new IllegalStateException("New state cannot be null");
        }
        if (currentState.equals(newState)) {
            return; // Same state is always valid
        }

        Set<String> allowedTransitions = VALID_TRANSITIONS.get(currentState);
        if (allowedTransitions == null) {
            throw new IllegalStateException("Unknown inventory state: " + currentState);
        }

        if (!allowedTransitions.contains(newState)) {
            throw new IllegalStateException(
                String.format("Invalid state transition: %s → %s. Allowed transitions from %s: %s",
                    currentState, newState, currentState,
                    allowedTransitions.isEmpty() ? "none (terminal state)" : allowedTransitions)
            );
        }
    }

    /**
     * Validates if inventory can be consumed (used in production).
     * Checks state and hold status.
     * @throws IllegalStateException if consumption is not allowed
     */
    public void validateConsumption(Inventory inventory) {
        validateConsumption(inventory, null);
    }

    /**
     * Validates if inventory can be consumed for a specific order.
     * @param inventory The inventory to consume
     * @param orderId The order consuming the inventory (for reservation check)
     * @throws IllegalStateException if consumption is not allowed
     */
    public void validateConsumption(Inventory inventory, Long orderId) {
        String state = inventory.getState();

        // Check if state allows consumption
        if (!CONSUMABLE_STATES.contains(state)) {
            throw new IllegalStateException(
                String.format("Inventory %d cannot be consumed in state %s. Must be AVAILABLE or RESERVED.",
                    inventory.getInventoryId(), state)
            );
        }

        // If RESERVED, check if it's reserved for this order
        if (Inventory.STATE_RESERVED.equals(state)) {
            Long reservedForOrder = inventory.getReservedForOrderId();
            if (reservedForOrder != null && orderId != null && !reservedForOrder.equals(orderId)) {
                throw new IllegalStateException(
                    String.format("Inventory %d is reserved for order %d, cannot be consumed by order %d",
                        inventory.getInventoryId(), reservedForOrder, orderId)
                );
            }
        }

        // Check for active holds on inventory
        if (hasActiveHold(inventory)) {
            throw new IllegalStateException(
                String.format("Inventory %d has an active hold and cannot be consumed",
                    inventory.getInventoryId())
            );
        }

        // Check for active holds on batch
        if (inventory.getBatch() != null && hasBatchActiveHold(inventory.getBatch().getBatchId())) {
            throw new IllegalStateException(
                String.format("Batch %d has an active hold, inventory %d cannot be consumed",
                    inventory.getBatch().getBatchId(), inventory.getInventoryId())
            );
        }
    }

    /**
     * Validates if inventory can be modified (update quantity, location, etc.)
     * @throws IllegalStateException if modification is not allowed
     */
    public void validateModification(Inventory inventory) {
        String state = inventory.getState();

        if (!MODIFIABLE_STATES.contains(state)) {
            throw new IllegalStateException(
                String.format("Inventory %d cannot be modified in state %s",
                    inventory.getInventoryId(), state)
            );
        }

        // Cannot modify if on hold (except for releasing hold)
        if (hasActiveHold(inventory)) {
            throw new IllegalStateException(
                String.format("Inventory %d has an active hold and cannot be modified",
                    inventory.getInventoryId())
            );
        }
    }

    /**
     * Validates if inventory can be blocked.
     */
    public void validateBlock(Inventory inventory) {
        String state = inventory.getState();
        validateTransition(state, Inventory.STATE_BLOCKED);
    }

    /**
     * Validates if inventory can be unblocked.
     * Only BLOCKED or ON_HOLD inventory can be unblocked.
     */
    public void validateUnblock(Inventory inventory) {
        String state = inventory.getState();
        if (!Inventory.STATE_BLOCKED.equals(state) && !Inventory.STATE_ON_HOLD.equals(state)) {
            throw new IllegalStateException(
                String.format("Cannot unblock inventory %d - it is not blocked or on hold (current state: %s)",
                    inventory.getInventoryId(), state)
            );
        }
        validateTransition(state, Inventory.STATE_AVAILABLE);
    }

    /**
     * Validates if inventory can be scrapped.
     */
    public void validateScrap(Inventory inventory) {
        String state = inventory.getState();
        validateTransition(state, Inventory.STATE_SCRAPPED);
    }

    /**
     * Validates if inventory can be reserved.
     */
    public void validateReserve(Inventory inventory) {
        String state = inventory.getState();
        validateTransition(state, Inventory.STATE_RESERVED);

        if (hasActiveHold(inventory)) {
            throw new IllegalStateException(
                String.format("Inventory %d has an active hold and cannot be reserved",
                    inventory.getInventoryId())
            );
        }
    }

    /**
     * Validates if inventory reservation can be released.
     */
    public void validateReleaseReservation(Inventory inventory) {
        if (!Inventory.STATE_RESERVED.equals(inventory.getState())) {
            throw new IllegalStateException(
                String.format("Inventory %d is not reserved (current state: %s)",
                    inventory.getInventoryId(), inventory.getState())
            );
        }
    }

    /**
     * Checks if inventory has an active hold.
     */
    public boolean hasActiveHold(Inventory inventory) {
        return holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(
            "INVENTORY", inventory.getInventoryId(), "ACTIVE"
        );
    }

    /**
     * Checks if batch has an active hold.
     */
    public boolean hasBatchActiveHold(Long batchId) {
        return holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(
            "BATCH", batchId, "ACTIVE"
        );
    }

    /**
     * Checks if the given state is a terminal state (no transitions allowed).
     */
    public boolean isTerminalState(String state) {
        Set<String> transitions = VALID_TRANSITIONS.get(state);
        return transitions != null && transitions.isEmpty();
    }

    /**
     * Gets allowed transitions from the current state.
     */
    public Set<String> getAllowedTransitions(String currentState) {
        return VALID_TRANSITIONS.getOrDefault(currentState, Set.of());
    }
}
