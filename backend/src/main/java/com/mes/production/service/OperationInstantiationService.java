package com.mes.production.service;

import com.mes.production.entity.Operation;
import com.mes.production.entity.OperationTemplate;
import com.mes.production.entity.OrderLineItem;
import com.mes.production.entity.Process;
import com.mes.production.entity.ProcessStatus;
import com.mes.production.entity.Routing;
import com.mes.production.entity.RoutingStep;
import com.mes.production.repository.OperationRepository;
import com.mes.production.repository.ProcessRepository;
import com.mes.production.repository.RoutingRepository;
import com.mes.production.repository.RoutingStepRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Service for instantiating operations from routing/process definitions at runtime.
 *
 * Per MES Consolidated Specification:
 * - Process is TEMPLATE entity (design-time only)
 * - RoutingStep is TEMPLATE entity (design-time only)
 * - OperationTemplate is TEMPLATE entity (reusable operation definition)
 * - Operations are RUNTIME instances linked to OrderLineItem
 *
 * Key relationships:
 * - Operation.process → Process (template reference)
 * - Operation.orderLineItem → OrderLineItem (runtime parent)
 * - Operation.routingStepId → RoutingStep (template genealogy)
 * - Operation.operationTemplateId → OperationTemplate (template genealogy)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OperationInstantiationService {

    private final ProcessRepository processRepository;
    private final RoutingRepository routingRepository;
    private final RoutingStepRepository routingStepRepository;
    private final OperationRepository operationRepository;

    /**
     * Result of instantiating operations from a process definition.
     */
    public record InstantiationResult(
            Process process,
            Routing routing,
            List<Operation> operations,
            List<RoutingStep> routingSteps
    ) {}

    /**
     * Instantiate operations for an order line item based on a process definition.
     *
     * @param orderLineItem The order line item to create operations for
     * @param processId The process ID to use for operations
     * @param targetQuantity The target quantity for operations
     * @param createdBy The user creating the operations
     * @return InstantiationResult containing the created process, routing, operations, and steps
     */
    @Transactional
    public InstantiationResult instantiateOperationsForOrder(
            OrderLineItem orderLineItem,
            Long processId,
            BigDecimal targetQuantity,
            String createdBy) {

        log.info("Instantiating operations for order line item {} with process {}",
                orderLineItem.getOrderLineId(), processId);

        // Get the process definition (TEMPLATE)
        Process process = processRepository.findById(processId)
                .orElseThrow(() -> new IllegalArgumentException("Process not found: " + processId));

        // Validate process status - only ACTIVE processes can be used for execution
        if (process.getStatus() != ProcessStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Cannot instantiate operations: Process " + processId +
                    " status is " + process.getStatus() + ", must be ACTIVE");
        }

        // Get routing for this process (TEMPLATE)
        List<Routing> routings = routingRepository.findByProcess_ProcessId(processId);
        if (routings.isEmpty()) {
            log.warn("No routing found for process: {}", processId);
            throw new IllegalStateException("No routing found for process: " + processId);
        }

        Routing routing = routings.stream()
                .filter(r -> Routing.STATUS_ACTIVE.equals(r.getStatus()))
                .findFirst()
                .orElse(routings.get(0));

        // Get routing steps (TEMPLATE)
        List<RoutingStep> routingSteps = routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(routing.getRoutingId());
        if (routingSteps.isEmpty()) {
            log.warn("No routing steps defined for routing: {}", routing.getRoutingId());
            throw new IllegalStateException("No routing steps defined for routing: " + routing.getRoutingId());
        }

        // Create Operations (RUNTIME) linked to OrderLineItem and Process
        List<Operation> operations = new ArrayList<>();

        for (RoutingStep step : routingSteps) {
            // Only instantiate ACTIVE routing steps
            if (RoutingStep.STATUS_ACTIVE.equals(step.getStatus())) {
                Operation operation = createOperationFromStep(
                        process, orderLineItem, step, targetQuantity, createdBy);
                operations.add(operation);
            }
        }

        // Set first operation to READY status
        if (!operations.isEmpty()) {
            Operation firstOp = operations.get(0);
            firstOp.setStatus(Operation.STATUS_READY);
            operationRepository.save(firstOp);
        }

        log.info("Instantiated {} operations for order line item {}", operations.size(), orderLineItem.getOrderLineId());
        return new InstantiationResult(process, routing, operations, routingSteps);
    }

    /**
     * Check if operations can still be modified (routing not locked).
     * A routing becomes locked once any operation has been executed for any order.
     *
     * NOTE: This checks if the routing has been used, not if RoutingSteps have status changes.
     * RoutingStep is TEMPLATE and doesn't track execution status.
     */
    @Transactional(readOnly = true)
    public boolean isRoutingLocked(Long routingId) {
        // Check if any operations exist for this routing's steps
        List<RoutingStep> steps = routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(routingId);

        for (RoutingStep step : steps) {
            // Check if any operations reference this routing step
            List<Operation> ops = operationRepository.findByRoutingStepId(step.getRoutingStepId());
            for (Operation op : ops) {
                // If any operation has been started, the routing is locked
                if (Operation.STATUS_IN_PROGRESS.equals(op.getStatus()) ||
                    Operation.STATUS_CONFIRMED.equals(op.getStatus()) ||
                    Operation.STATUS_PARTIALLY_CONFIRMED.equals(op.getStatus())) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get the next operation to execute for an order line item.
     */
    @Transactional(readOnly = true)
    public Optional<Operation> getNextOperationToExecute(Long orderLineId) {
        List<Operation> operations = operationRepository.findByOrderLineItem_OrderLineIdOrderBySequenceNumberAsc(orderLineId);

        for (Operation op : operations) {
            if (Operation.STATUS_READY.equals(op.getStatus())) {
                return Optional.of(op);
            }
        }

        return Optional.empty();
    }

    /**
     * Progress to the next operation after completing one.
     *
     * NOTE: This only updates Operation status (RUNTIME).
     * RoutingStep is TEMPLATE and is never modified during execution.
     */
    @Transactional
    public void progressToNextOperation(Long completedOperationId, String updatedBy) {
        log.info("Progressing from operation {} to next", completedOperationId);

        // Find the completed operation
        Operation completedOp = operationRepository.findById(completedOperationId)
                .orElseThrow(() -> new IllegalArgumentException("Operation not found: " + completedOperationId));

        // Get the order line item to find sibling operations
        OrderLineItem orderLineItem = completedOp.getOrderLineItem();
        if (orderLineItem == null) {
            log.warn("No order line item linked to operation: {}", completedOperationId);
            return;
        }

        // Find next operation by sequence number
        List<Operation> allOperations = operationRepository
                .findByOrderLineItem_OrderLineIdOrderBySequenceNumberAsc(orderLineItem.getOrderLineId());

        // Find next NOT_STARTED operation after the completed one
        boolean foundCompleted = false;
        for (Operation op : allOperations) {
            if (op.getOperationId().equals(completedOperationId)) {
                foundCompleted = true;
                continue;
            }

            if (foundCompleted && Operation.STATUS_NOT_STARTED.equals(op.getStatus())) {
                // Set next operation to READY
                op.setStatus(Operation.STATUS_READY);
                op.setUpdatedBy(updatedBy);
                operationRepository.save(op);
                log.info("Set operation {} to READY", op.getOperationId());
                break;
            }
        }
    }

    // ============ Helper Methods ============

    /**
     * Create a runtime Operation from a template RoutingStep.
     *
     * Operation details are copied from either:
     * 1. OperationTemplate (if RoutingStep has operationTemplate reference)
     * 2. RoutingStep legacy fields (for backward compatibility)
     */
    private Operation createOperationFromStep(
            Process process, OrderLineItem orderLineItem, RoutingStep step,
            BigDecimal targetQuantity, String createdBy) {

        // Get operation details from OperationTemplate or legacy fields
        String opName = step.getEffectiveOperationName();
        String opType = step.getEffectiveOperationType();
        String opCode = step.getEffectiveOperationCode();

        // Get operationTemplateId if OperationTemplate is set
        Long operationTemplateId = null;
        if (step.getOperationTemplate() != null) {
            operationTemplateId = step.getOperationTemplate().getOperationTemplateId();
        }

        Operation operation = Operation.builder()
                .process(process)
                .orderLineItem(orderLineItem)
                .routingStepId(step.getRoutingStepId())
                .operationTemplateId(operationTemplateId)
                .operationName(opName != null ? opName : "Step " + step.getSequenceNumber())
                .operationType(opType)
                .operationCode(opCode)
                .status(Operation.STATUS_NOT_STARTED)
                .sequenceNumber(step.getSequenceNumber())
                .targetQty(step.getTargetQty() != null ? step.getTargetQty() : targetQuantity)
                .createdBy(createdBy)
                .build();

        return operationRepository.save(operation);
    }
}
