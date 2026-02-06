package com.mes.production.service;

import com.mes.production.entity.Batch;
import com.mes.production.entity.Inventory;
import com.mes.production.repository.HoldRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("InventoryStateValidator Tests")
class InventoryStateValidatorTest {

    @Mock
    private HoldRecordRepository holdRecordRepository;

    private InventoryStateValidator validator;

    @BeforeEach
    void setUp() {
        validator = new InventoryStateValidator(holdRecordRepository);
    }

    private Inventory createInventory(Long id, String state) {
        return Inventory.builder()
                .inventoryId(id)
                .state(state)
                .quantity(BigDecimal.valueOf(100))
                .materialId("MAT-001")
                .unit("KG")
                .inventoryType("RM")
                .build();
    }

    @Nested
    @DisplayName("State Transition Validation Tests")
    class StateTransitionTests {

        @Test
        @DisplayName("AVAILABLE -> BLOCKED is valid")
        void availableToBlocked_ShouldBeValid() {
            assertDoesNotThrow(() ->
                validator.validateTransition(Inventory.STATE_AVAILABLE, Inventory.STATE_BLOCKED)
            );
        }

        @Test
        @DisplayName("AVAILABLE -> CONSUMED is valid")
        void availableToConsumed_ShouldBeValid() {
            assertDoesNotThrow(() ->
                validator.validateTransition(Inventory.STATE_AVAILABLE, Inventory.STATE_CONSUMED)
            );
        }

        @Test
        @DisplayName("AVAILABLE -> RESERVED is valid")
        void availableToReserved_ShouldBeValid() {
            assertDoesNotThrow(() ->
                validator.validateTransition(Inventory.STATE_AVAILABLE, Inventory.STATE_RESERVED)
            );
        }

        @Test
        @DisplayName("AVAILABLE -> ON_HOLD is valid")
        void availableToOnHold_ShouldBeValid() {
            assertDoesNotThrow(() ->
                validator.validateTransition(Inventory.STATE_AVAILABLE, Inventory.STATE_ON_HOLD)
            );
        }

        @Test
        @DisplayName("BLOCKED -> AVAILABLE is valid")
        void blockedToAvailable_ShouldBeValid() {
            assertDoesNotThrow(() ->
                validator.validateTransition(Inventory.STATE_BLOCKED, Inventory.STATE_AVAILABLE)
            );
        }

        @Test
        @DisplayName("BLOCKED -> SCRAPPED is valid")
        void blockedToScrapped_ShouldBeValid() {
            assertDoesNotThrow(() ->
                validator.validateTransition(Inventory.STATE_BLOCKED, Inventory.STATE_SCRAPPED)
            );
        }

        @Test
        @DisplayName("CONSUMED is terminal - no transitions allowed")
        void consumedIsTerminal_ShouldThrow() {
            IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                validator.validateTransition(Inventory.STATE_CONSUMED, Inventory.STATE_AVAILABLE)
            );
            assertTrue(ex.getMessage().contains("terminal state"));
        }

        @Test
        @DisplayName("SCRAPPED is terminal - no transitions allowed")
        void scrappedIsTerminal_ShouldThrow() {
            IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                validator.validateTransition(Inventory.STATE_SCRAPPED, Inventory.STATE_AVAILABLE)
            );
            assertTrue(ex.getMessage().contains("terminal state"));
        }

        @Test
        @DisplayName("AVAILABLE -> SCRAPPED is invalid (must go through BLOCKED)")
        void availableToScrapped_ShouldThrow() {
            IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                validator.validateTransition(Inventory.STATE_AVAILABLE, Inventory.STATE_SCRAPPED)
            );
            assertTrue(ex.getMessage().contains("Invalid state transition"));
        }

        @Test
        @DisplayName("ON_HOLD -> AVAILABLE is valid")
        void onHoldToAvailable_ShouldBeValid() {
            assertDoesNotThrow(() ->
                validator.validateTransition(Inventory.STATE_ON_HOLD, Inventory.STATE_AVAILABLE)
            );
        }

        @Test
        @DisplayName("Same state transition is always valid")
        void sameStateTransition_ShouldBeValid() {
            assertDoesNotThrow(() ->
                validator.validateTransition(Inventory.STATE_AVAILABLE, Inventory.STATE_AVAILABLE)
            );
        }
    }

    @Nested
    @DisplayName("Consumption Validation Tests")
    class ConsumptionTests {

        @Test
        @DisplayName("AVAILABLE inventory can be consumed")
        void availableInventory_CanBeConsumed() {
            Inventory inventory = createInventory(1L, Inventory.STATE_AVAILABLE);
            when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(anyString(), anyLong(), anyString()))
                    .thenReturn(false);

            assertDoesNotThrow(() -> validator.validateConsumption(inventory));
        }

        @Test
        @DisplayName("BLOCKED inventory cannot be consumed")
        void blockedInventory_CannotBeConsumed() {
            Inventory inventory = createInventory(1L, Inventory.STATE_BLOCKED);

            IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                validator.validateConsumption(inventory)
            );
            assertTrue(ex.getMessage().contains("cannot be consumed"));
        }

        @Test
        @DisplayName("CONSUMED inventory cannot be consumed again")
        void consumedInventory_CannotBeConsumed() {
            Inventory inventory = createInventory(1L, Inventory.STATE_CONSUMED);

            IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                validator.validateConsumption(inventory)
            );
            assertTrue(ex.getMessage().contains("cannot be consumed"));
        }

        @Test
        @DisplayName("Inventory with active hold cannot be consumed")
        void inventoryWithHold_CannotBeConsumed() {
            Inventory inventory = createInventory(1L, Inventory.STATE_AVAILABLE);
            when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("INVENTORY", 1L, "ACTIVE"))
                    .thenReturn(true);

            IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                validator.validateConsumption(inventory)
            );
            assertTrue(ex.getMessage().contains("active hold"));
        }

        @Test
        @DisplayName("Inventory with batch on hold cannot be consumed")
        void inventoryWithBatchOnHold_CannotBeConsumed() {
            Inventory inventory = createInventory(1L, Inventory.STATE_AVAILABLE);
            Batch batch = Batch.builder().batchId(100L).build();
            inventory.setBatch(batch);

            when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("INVENTORY", 1L, "ACTIVE"))
                    .thenReturn(false);
            when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("BATCH", 100L, "ACTIVE"))
                    .thenReturn(true);

            IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                validator.validateConsumption(inventory)
            );
            assertTrue(ex.getMessage().contains("Batch"));
        }

        @Test
        @DisplayName("RESERVED inventory can be consumed by the reserving order")
        void reservedInventory_CanBeConsumedBySameOrder() {
            Inventory inventory = createInventory(1L, Inventory.STATE_RESERVED);
            inventory.setReservedForOrderId(100L);

            when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(anyString(), anyLong(), anyString()))
                    .thenReturn(false);

            assertDoesNotThrow(() -> validator.validateConsumption(inventory, 100L));
        }

        @Test
        @DisplayName("RESERVED inventory cannot be consumed by different order")
        void reservedInventory_CannotBeConsumedByDifferentOrder() {
            Inventory inventory = createInventory(1L, Inventory.STATE_RESERVED);
            inventory.setReservedForOrderId(100L);

            IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                validator.validateConsumption(inventory, 200L)
            );
            assertTrue(ex.getMessage().contains("reserved for order 100"));
        }
    }

    @Nested
    @DisplayName("Block/Unblock/Scrap Validation Tests")
    class BlockUnblockScrapTests {

        @Test
        @DisplayName("AVAILABLE inventory can be blocked")
        void availableInventory_CanBeBlocked() {
            Inventory inventory = createInventory(1L, Inventory.STATE_AVAILABLE);
            assertDoesNotThrow(() -> validator.validateBlock(inventory));
        }

        @Test
        @DisplayName("RESERVED inventory can be blocked")
        void reservedInventory_CanBeBlocked() {
            Inventory inventory = createInventory(1L, Inventory.STATE_RESERVED);
            assertDoesNotThrow(() -> validator.validateBlock(inventory));
        }

        @Test
        @DisplayName("CONSUMED inventory cannot be blocked")
        void consumedInventory_CannotBeBlocked() {
            Inventory inventory = createInventory(1L, Inventory.STATE_CONSUMED);
            assertThrows(IllegalStateException.class, () -> validator.validateBlock(inventory));
        }

        @Test
        @DisplayName("BLOCKED inventory can be unblocked")
        void blockedInventory_CanBeUnblocked() {
            Inventory inventory = createInventory(1L, Inventory.STATE_BLOCKED);
            assertDoesNotThrow(() -> validator.validateUnblock(inventory));
        }

        @Test
        @DisplayName("AVAILABLE inventory cannot be unblocked")
        void availableInventory_CannotBeUnblocked() {
            Inventory inventory = createInventory(1L, Inventory.STATE_AVAILABLE);
            assertThrows(IllegalStateException.class, () -> validator.validateUnblock(inventory));
        }

        @Test
        @DisplayName("BLOCKED inventory can be scrapped")
        void blockedInventory_CanBeScrapped() {
            Inventory inventory = createInventory(1L, Inventory.STATE_BLOCKED);
            assertDoesNotThrow(() -> validator.validateScrap(inventory));
        }

        @Test
        @DisplayName("AVAILABLE inventory cannot be directly scrapped")
        void availableInventory_CannotBeDirectlyScrapped() {
            Inventory inventory = createInventory(1L, Inventory.STATE_AVAILABLE);
            assertThrows(IllegalStateException.class, () -> validator.validateScrap(inventory));
        }
    }

    @Nested
    @DisplayName("Reservation Validation Tests")
    class ReservationTests {

        @Test
        @DisplayName("AVAILABLE inventory can be reserved")
        void availableInventory_CanBeReserved() {
            Inventory inventory = createInventory(1L, Inventory.STATE_AVAILABLE);
            when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus(anyString(), anyLong(), anyString()))
                    .thenReturn(false);
            assertDoesNotThrow(() -> validator.validateReserve(inventory));
        }

        @Test
        @DisplayName("Inventory with hold cannot be reserved")
        void inventoryWithHold_CannotBeReserved() {
            Inventory inventory = createInventory(1L, Inventory.STATE_AVAILABLE);
            when(holdRecordRepository.existsByEntityTypeAndEntityIdAndStatus("INVENTORY", 1L, "ACTIVE"))
                    .thenReturn(true);
            assertThrows(IllegalStateException.class, () -> validator.validateReserve(inventory));
        }

        @Test
        @DisplayName("RESERVED inventory can release reservation")
        void reservedInventory_CanReleaseReservation() {
            Inventory inventory = createInventory(1L, Inventory.STATE_RESERVED);
            assertDoesNotThrow(() -> validator.validateReleaseReservation(inventory));
        }

        @Test
        @DisplayName("Non-reserved inventory cannot release reservation")
        void nonReservedInventory_CannotReleaseReservation() {
            Inventory inventory = createInventory(1L, Inventory.STATE_AVAILABLE);
            assertThrows(IllegalStateException.class, () -> validator.validateReleaseReservation(inventory));
        }
    }

    @Nested
    @DisplayName("Utility Method Tests")
    class UtilityTests {

        @Test
        @DisplayName("CONSUMED is a terminal state")
        void consumed_IsTerminalState() {
            assertTrue(validator.isTerminalState(Inventory.STATE_CONSUMED));
        }

        @Test
        @DisplayName("SCRAPPED is a terminal state")
        void scrapped_IsTerminalState() {
            assertTrue(validator.isTerminalState(Inventory.STATE_SCRAPPED));
        }

        @Test
        @DisplayName("AVAILABLE is not a terminal state")
        void available_IsNotTerminalState() {
            assertFalse(validator.isTerminalState(Inventory.STATE_AVAILABLE));
        }

        @Test
        @DisplayName("getAllowedTransitions returns correct transitions for AVAILABLE")
        void getAllowedTransitions_ForAvailable() {
            var transitions = validator.getAllowedTransitions(Inventory.STATE_AVAILABLE);
            assertTrue(transitions.contains(Inventory.STATE_RESERVED));
            assertTrue(transitions.contains(Inventory.STATE_CONSUMED));
            assertTrue(transitions.contains(Inventory.STATE_BLOCKED));
            assertTrue(transitions.contains(Inventory.STATE_ON_HOLD));
            assertFalse(transitions.contains(Inventory.STATE_SCRAPPED));
        }

        @Test
        @DisplayName("getAllowedTransitions returns empty set for terminal states")
        void getAllowedTransitions_ForTerminalState() {
            var transitions = validator.getAllowedTransitions(Inventory.STATE_CONSUMED);
            assertTrue(transitions.isEmpty());
        }
    }
}
