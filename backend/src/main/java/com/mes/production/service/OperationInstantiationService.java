package com.mes.production.service;

import com.mes.production.entity.Operation;
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
 * - Process is design-time entity (ProcessID, ProcessName, Status)
 * - Operations link to Process via ProcessID (design-time reference)
 * - Operations link to OrderLineItem via OrderLineID (runtime tracking)
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

        // Get the process definition
        Process process = processRepository.findById(processId)
                .orElseThrow(() -> new IllegalArgumentException("Process not found: " + processId));

        // Validate process status - only ACTIVE processes can be used for execution
        if (process.getStatus() != ProcessStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Cannot instantiate operations: Process " + processId +
                    " status is " + process.getStatus() + ", must be ACTIVE");
        }

        // Get routing for this process
        List<Routing> routings = routingRepository.findByProcess_ProcessId(processId);
        if (routings.isEmpty()) {
            log.warn("No routing found for process: {}", processId);
            throw new IllegalStateException("No routing found for process: " + processId);
        }

        Routing routing = routings.stream()
                .filter(r -> Routing.STATUS_ACTIVE.equals(r.getStatus()))
                .findFirst()
                .orElse(routings.get(0));

        // Get routing steps
        List<RoutingStep> routingSteps = routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(routing.getRoutingId());
        if (routingSteps.isEmpty()) {
            log.warn("No routing steps defined for routing: {}", routing.getRoutingId());
            throw new IllegalStateException("No routing steps defined for routing: " + routing.getRoutingId());
        }

        // Create Operations linked to OrderLineItem and Process
        List<Operation> operations = new ArrayList<>();

        for (RoutingStep step : routingSteps) {
            Operation operation = createOperationFromStep(
                    process, orderLineItem, step, targetQuantity, createdBy);
            operations.add(operation);
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
     * A routing becomes locked once any operation has been executed.
     */
    @Transactional(readOnly = true)
    public boolean isRoutingLocked(Long routingId) {
        Optional<Routing> routingOpt = routingRepository.findByIdWithSteps(routingId);
        if (routingOpt.isEmpty()) {
            return false;
        }

        Routing routing = routingOpt.get();

        // Check if any step has been executed (IN_PROGRESS or COMPLETED)
        for (RoutingStep step : routing.getRoutingSteps()) {
            if (RoutingStep.STATUS_IN_PROGRESS.equals(step.getStatus()) ||
                RoutingStep.STATUS_COMPLETED.equals(step.getStatus())) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get the next operation to execute in a routing.
     */
    @Transactional(readOnly = true)
    public Optional<Operation> getNextOperationToExecute(Long routingId) {
        List<RoutingStep> steps = routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(routingId);

        for (RoutingStep step : steps) {
            if (step.getOperation() != null &&
                (RoutingStep.STATUS_READY.equals(step.getStatus()) ||
                 Operation.STATUS_READY.equals(step.getOperation().getStatus()))) {
                return Optional.of(step.getOperation());
            }
        }

        return Optional.empty();
    }

    /**
     * Progress to the next operation after completing one.
     */
    @Transactional
    public void progressToNextOperation(Long completedOperationId, String updatedBy) {
        log.info("Progressing from operation {} to next", completedOperationId);

        // Find the routing step for this operation
        Optional<RoutingStep> currentStepOpt = routingStepRepository.findByOperation_OperationId(completedOperationId);
        if (currentStepOpt.isEmpty()) {
            log.warn("No routing step found for operation: {}", completedOperationId);
            return;
        }

        RoutingStep currentStep = currentStepOpt.get();
        Routing routing = currentStep.getRouting();

        // Mark current step as completed
        currentStep.setStatus(RoutingStep.STATUS_COMPLETED);
        currentStep.setUpdatedBy(updatedBy);
        routingStepRepository.save(currentStep);

        // Find next steps
        List<RoutingStep> nextSteps = routingStepRepository.findNextSteps(
                routing.getRoutingId(), currentStep.getSequenceNumber());

        // Handle based on routing type
        if (Routing.TYPE_PARALLEL.equals(routing.getRoutingType())) {
            // For parallel routing, all next steps at same level become READY
            for (RoutingStep nextStep : nextSteps) {
                if (nextStep.getSequenceNumber().equals(currentStep.getSequenceNumber() + 1)) {
                    activateStep(nextStep, updatedBy);
                }
            }
        } else {
            // For sequential routing, only the immediate next step becomes READY
            if (!nextSteps.isEmpty()) {
                activateStep(nextSteps.get(0), updatedBy);
            }
        }
    }

    // ============ Helper Methods ============

    private Operation createOperationFromStep(
            Process process, OrderLineItem orderLineItem, RoutingStep step,
            BigDecimal targetQuantity, String createdBy) {

        Operation operation = Operation.builder()
                .process(process)
                .orderLineItem(orderLineItem)
                .routingStepId(step.getRoutingStepId())
                .operationName(step.getOperationName())
                .operationType(step.getOperationType())
                .operationCode(step.getOperationCode())
                .status(Operation.STATUS_NOT_STARTED)
                .sequenceNumber(step.getSequenceNumber())
                .targetQty(targetQuantity)
                .createdBy(createdBy)
                .build();

        return operationRepository.save(operation);
    }

    private void activateStep(RoutingStep step, String updatedBy) {
        step.setStatus(RoutingStep.STATUS_READY);
        step.setUpdatedBy(updatedBy);
        routingStepRepository.save(step);

        if (step.getOperation() != null) {
            Operation op = step.getOperation();
            op.setStatus(Operation.STATUS_READY);
            op.setUpdatedBy(updatedBy);
            operationRepository.save(op);
        }

        log.info("Activated routing step {} and operation {}", step.getRoutingStepId(),
                step.getOperation() != null ? step.getOperation().getOperationId() : "N/A");
    }
}
