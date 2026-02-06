package com.mes.production.service;

import com.mes.production.entity.Operation;
import com.mes.production.entity.OrderLineItem;
import com.mes.production.entity.Process;
import com.mes.production.entity.ProcessTemplate;
import com.mes.production.entity.Routing;
import com.mes.production.entity.RoutingStep;
import com.mes.production.repository.OperationRepository;
import com.mes.production.repository.ProcessRepository;
import com.mes.production.repository.ProcessTemplateRepository;
import com.mes.production.repository.RoutingRepository;
import com.mes.production.repository.RoutingStepRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Service for instantiating operations from routing/process template definitions at runtime.
 * This bridges design-time ProcessTemplate entities with runtime Process execution by creating
 * actual Operation and RoutingStep entities when an order is created.
 *
 * Per MES Consolidated Specification:
 * - ProcessTemplate (design-time) defines the process template
 * - Process (runtime) tracks execution for a specific OrderLineItem
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OperationInstantiationService {

    private final ProcessTemplateRepository processTemplateRepository;
    private final ProcessRepository processRepository;
    private final RoutingRepository routingRepository;
    private final RoutingStepRepository routingStepRepository;
    private final OperationRepository operationRepository;

    /**
     * Result of instantiating operations from a process definition.
     */
    public record InstantiationResult(
            Routing routing,
            List<Operation> operations,
            List<RoutingStep> routingSteps
    ) {}

    /**
     * Instantiate operations for an order line item based on the product's process template.
     *
     * @param orderLineItem The order line item to create operations for
     * @param productSku The product SKU to find the process template for
     * @param targetQuantity The target quantity for operations
     * @param createdBy The user creating the operations
     * @return InstantiationResult containing the created routing, operations, and steps
     */
    @Transactional
    public InstantiationResult instantiateOperationsForOrder(
            OrderLineItem orderLineItem,
            String productSku,
            BigDecimal targetQuantity,
            String createdBy) {

        log.info("Instantiating operations for order line item {} with product {}",
                orderLineItem.getOrderLineId(), productSku);

        // Find the effective process template for this product
        List<ProcessTemplate> effectiveTemplates = processTemplateRepository.findEffectiveByProductSku(
                productSku, LocalDate.now());

        if (effectiveTemplates.isEmpty()) {
            log.warn("No effective process template found for product: {}", productSku);
            throw new IllegalStateException("No effective process template found for product: " + productSku);
        }

        ProcessTemplate processTemplate = effectiveTemplates.get(0);
        log.info("Using process template: {} ({})", processTemplate.getTemplateName(), processTemplate.getTemplateCode());

        // Get design-time routing steps from the process template
        List<RoutingStep> designSteps = getDesignStepsForTemplate(processTemplate.getProcessTemplateId());
        if (designSteps.isEmpty()) {
            log.warn("No routing steps defined in template: {}", processTemplate.getTemplateCode());
            throw new IllegalStateException("No routing steps defined in template: " + processTemplate.getTemplateCode());
        }

        // Create the runtime Process
        Process process = getOrCreateProcess(orderLineItem, processTemplate, createdBy);

        // Create runtime Routing
        Routing routing = createRuntimeRouting(process, processTemplate, createdBy);

        // Create Operations and RoutingSteps from design-time steps
        List<Operation> operations = new ArrayList<>();
        List<RoutingStep> runtimeSteps = new ArrayList<>();

        for (RoutingStep designStep : designSteps) {
            // Create the Operation
            Operation operation = createOperationFromStep(process, designStep, targetQuantity, createdBy);
            operations.add(operation);

            // Create runtime RoutingStep linked to the operation
            RoutingStep runtimeStep = createRuntimeStep(routing, operation, designStep, createdBy);
            runtimeSteps.add(runtimeStep);
        }

        // Set first operation to READY status
        if (!operations.isEmpty()) {
            Operation firstOp = operations.get(0);
            firstOp.setStatus(Operation.STATUS_READY);
            operationRepository.save(firstOp);

            RoutingStep firstStep = runtimeSteps.get(0);
            firstStep.setStatus(RoutingStep.STATUS_READY);
            routingStepRepository.save(firstStep);
        }

        log.info("Instantiated {} operations for order line item {}", operations.size(), orderLineItem.getOrderLineId());
        return new InstantiationResult(routing, operations, runtimeSteps);
    }

    /**
     * Instantiate operations using a specific process template ID.
     */
    @Transactional
    public InstantiationResult instantiateFromTemplate(
            Long templateId,
            OrderLineItem orderLineItem,
            BigDecimal targetQuantity,
            String createdBy) {

        log.info("Instantiating from template {} for order line item {}", templateId, orderLineItem.getOrderLineId());

        ProcessTemplate processTemplate = processTemplateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("Process template not found: " + templateId));

        if (!processTemplate.isEffective()) {
            log.warn("Template {} is not effective", templateId);
            throw new IllegalStateException("Template is not currently effective: " + templateId);
        }

        List<RoutingStep> designSteps = getDesignStepsForTemplate(templateId);
        if (designSteps.isEmpty()) {
            throw new IllegalStateException("No routing steps defined in template: " + templateId);
        }

        Process process = getOrCreateProcess(orderLineItem, processTemplate, createdBy);
        Routing routing = createRuntimeRouting(process, processTemplate, createdBy);

        List<Operation> operations = new ArrayList<>();
        List<RoutingStep> runtimeSteps = new ArrayList<>();

        for (RoutingStep designStep : designSteps) {
            Operation operation = createOperationFromStep(process, designStep, targetQuantity, createdBy);
            operations.add(operation);

            RoutingStep runtimeStep = createRuntimeStep(routing, operation, designStep, createdBy);
            runtimeSteps.add(runtimeStep);
        }

        // Set first operation to READY
        if (!operations.isEmpty()) {
            Operation firstOp = operations.get(0);
            firstOp.setStatus(Operation.STATUS_READY);
            operationRepository.save(firstOp);

            RoutingStep firstStep = runtimeSteps.get(0);
            firstStep.setStatus(RoutingStep.STATUS_READY);
            routingStepRepository.save(firstStep);
        }

        return new InstantiationResult(routing, operations, runtimeSteps);
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

    private List<RoutingStep> getDesignStepsForTemplate(Long templateId) {
        // Find the design-time routing for this template
        List<Routing> templateRoutings = routingRepository.findAll().stream()
                .filter(r -> r.getProcessTemplate() != null &&
                             templateId.equals(r.getProcessTemplate().getProcessTemplateId()) &&
                             Routing.STATUS_DRAFT.equals(r.getStatus()))
                .toList();

        if (templateRoutings.isEmpty()) {
            return List.of();
        }

        Routing designRouting = templateRoutings.get(0);
        return routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(designRouting.getRoutingId());
    }

    private Process getOrCreateProcess(OrderLineItem orderLineItem, ProcessTemplate processTemplate, String createdBy) {
        // Check if a process already exists for this order line item
        List<Process> existingProcesses = processRepository.findByOrderLineItem_OrderLineId(orderLineItem.getOrderLineId());
        if (!existingProcesses.isEmpty()) {
            return existingProcesses.get(0);
        }

        // Create new process
        Process process = Process.builder()
                .processName(processTemplate.getTemplateName())
                .stageSequence(1)
                .status(Process.STATUS_READY)
                .usageDecision(Process.DECISION_PENDING)
                .orderLineItem(orderLineItem)
                .createdBy(createdBy)
                .build();

        return processRepository.save(process);
    }

    private Routing createRuntimeRouting(Process process, ProcessTemplate processTemplate, String createdBy) {
        Routing routing = Routing.builder()
                .processTemplate(processTemplate)
                .routingName(processTemplate.getTemplateName() + " - Runtime")
                .routingType(Routing.TYPE_SEQUENTIAL)
                .status(Routing.STATUS_ACTIVE)
                .createdBy(createdBy)
                .build();

        return routingRepository.save(routing);
    }

    private Operation createOperationFromStep(
            Process process, RoutingStep designStep, BigDecimal targetQuantity, String createdBy) {

        Operation operation = Operation.builder()
                .process(process)
                .operationName(designStep.getOperationName())
                .operationType(designStep.getOperationType())
                .status(Operation.STATUS_NOT_STARTED)
                .sequenceNumber(designStep.getSequenceNumber())
                .targetQty(targetQuantity)
                .createdBy(createdBy)
                .build();

        return operationRepository.save(operation);
    }

    private RoutingStep createRuntimeStep(
            Routing routing, Operation operation, RoutingStep designStep, String createdBy) {

        RoutingStep runtimeStep = RoutingStep.builder()
                .routing(routing)
                .operation(operation)
                .sequenceNumber(designStep.getSequenceNumber())
                .operationName(designStep.getOperationName())
                .operationType(designStep.getOperationType())
                .operationCode(designStep.getOperationCode())
                .description(designStep.getDescription())
                .targetQty(designStep.getTargetQty())
                .estimatedDurationMinutes(designStep.getEstimatedDurationMinutes())
                .isParallel(designStep.getIsParallel())
                .mandatoryFlag(designStep.getMandatoryFlag())
                .producesOutputBatch(designStep.getProducesOutputBatch())
                .allowsSplit(designStep.getAllowsSplit())
                .allowsMerge(designStep.getAllowsMerge())
                .status(RoutingStep.STATUS_READY)
                .createdBy(createdBy)
                .build();

        return routingStepRepository.save(runtimeStep);
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
