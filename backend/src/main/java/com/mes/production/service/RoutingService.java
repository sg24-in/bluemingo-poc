package com.mes.production.service;

import com.mes.production.dto.RoutingDTO;
import com.mes.production.entity.Operation;
import com.mes.production.entity.OperationTemplate;
import com.mes.production.entity.Process;
import com.mes.production.entity.Routing;
import com.mes.production.entity.RoutingStep;
import com.mes.production.repository.OperationRepository;
import com.mes.production.repository.OperationTemplateRepository;
import com.mes.production.repository.ProcessRepository;
import com.mes.production.repository.RoutingRepository;
import com.mes.production.repository.RoutingStepRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for managing Routing entities (TEMPLATE - Design-Time).
 *
 * Per MES Consolidated Specification:
 * - Routing has ProcessID (FK → Processes)
 * - RoutingStep is TEMPLATE (status: ACTIVE/INACTIVE)
 * - Operation is RUNTIME (tracks execution status)
 * - Routing "completion" is checked by examining Operations, not RoutingSteps
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RoutingService {

    private final RoutingRepository routingRepository;
    private final RoutingStepRepository routingStepRepository;
    private final ProcessRepository processRepository;
    private final OperationRepository operationRepository;
    private final OperationTemplateRepository operationTemplateRepository;

    /**
     * Get routing by ID with steps
     */
    @Transactional(readOnly = true)
    public Optional<Routing> getRoutingWithSteps(Long routingId) {
        return routingRepository.findByIdWithSteps(routingId);
    }

    /**
     * Get active routing for a process (runtime)
     */
    @Transactional(readOnly = true)
    public Optional<Routing> getActiveRoutingForProcess(Long processId) {
        return routingRepository.findActiveRoutingByProcessWithSteps(processId);
    }

    /**
     * Get active routing for a process template (design-time)
     * Note: Uses ProcessId since Routing links to Process via ProcessID FK
     */
    @Transactional(readOnly = true)
    public Optional<Routing> getActiveRoutingForTemplate(Long processId) {
        return routingRepository.findActiveRoutingByProcessWithSteps(processId);
    }

    /**
     * Get routing steps in order
     */
    @Transactional(readOnly = true)
    public List<RoutingStep> getRoutingStepsInOrder(Long routingId) {
        return routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(routingId);
    }

    /**
     * Get next steps after current sequence
     */
    @Transactional(readOnly = true)
    public List<RoutingStep> getNextSteps(Long routingId, Integer currentSequence) {
        return routingStepRepository.findNextSteps(routingId, currentSequence);
    }

    /**
     * Get parallel steps at same level
     */
    @Transactional(readOnly = true)
    public List<RoutingStep> getParallelSteps(Long routingId, Integer sequenceNumber) {
        return routingStepRepository.findParallelSteps(routingId, sequenceNumber);
    }

    /**
     * Check if routing template is complete (design-time).
     *
     * A routing is considered complete if:
     * - It has at least one active step
     * - All mandatory steps are active
     *
     * NOTE: This is a TEMPLATE check, not runtime execution check.
     * For runtime execution completion, use isRoutingCompleteForOrderLine().
     */
    @Transactional(readOnly = true)
    public boolean isRoutingComplete(Long routingId) {
        List<RoutingStep> activeSteps = routingStepRepository.findActiveSteps(routingId);
        if (activeSteps.isEmpty()) {
            return false;  // No active steps defined
        }
        // Check if routing exists and is active
        return routingRepository.findById(routingId)
                .map(routing -> Routing.STATUS_ACTIVE.equals(routing.getStatus()))
                .orElse(false);
    }

    /**
     * Check if routing is complete for an order line.
     *
     * NOTE: Routing completion is determined by checking Operations (RUNTIME),
     * not RoutingSteps (TEMPLATE). RoutingSteps don't track execution status.
     */
    @Transactional(readOnly = true)
    public boolean isRoutingCompleteForOrderLine(Long orderLineId) {
        List<Operation> operations = operationRepository.findByOrderLineItem_OrderLineIdOrderBySequenceNumberAsc(orderLineId);
        if (operations.isEmpty()) {
            return false;
        }
        // All operations must be CONFIRMED
        return operations.stream()
                .allMatch(op -> Operation.STATUS_CONFIRMED.equals(op.getStatus()));
    }

    /**
     * Get next operation to be made READY for an order line.
     */
    @Transactional(readOnly = true)
    public Optional<Operation> getNextOperationToReady(Long orderLineId) {
        List<Operation> operations = operationRepository.findByOrderLineItem_OrderLineIdOrderBySequenceNumberAsc(orderLineId);
        return operations.stream()
                .filter(op -> Operation.STATUS_NOT_STARTED.equals(op.getStatus()))
                .findFirst();
    }

    /**
     * Get routing step for an operation via routingStepId.
     *
     * NOTE: Operations reference RoutingSteps via routingStepId (one-way relationship).
     * RoutingSteps do NOT reference Operations.
     */
    @Transactional(readOnly = true)
    public Optional<RoutingStep> getStepForOperation(Long operationId) {
        Operation operation = operationRepository.findById(operationId).orElse(null);
        if (operation == null || operation.getRoutingStepId() == null) {
            return Optional.empty();
        }
        return routingStepRepository.findById(operation.getRoutingStepId());
    }

    /**
     * Check if operation can proceed based on routing rules.
     *
     * NOTE: This checks Operation status (RUNTIME), not RoutingStep status.
     */
    @Transactional(readOnly = true)
    public boolean canOperationProceed(Long operationId) {
        Operation operation = operationRepository.findById(operationId).orElse(null);
        if (operation == null) {
            return false;
        }

        // Operation must be READY to proceed
        if (!Operation.STATUS_READY.equals(operation.getStatus())) {
            return false;
        }

        // Get the routing step to check routing type
        if (operation.getRoutingStepId() == null) {
            return true; // No routing step means no restrictions
        }

        Optional<RoutingStep> stepOpt = routingStepRepository.findById(operation.getRoutingStepId());
        if (stepOpt.isEmpty()) {
            return true;
        }

        RoutingStep step = stepOpt.get();
        Routing routing = step.getRouting();

        if (Routing.TYPE_PARALLEL.equals(routing.getRoutingType())) {
            // Parallel routing - can proceed if operation is READY
            return true;
        }

        // Sequential routing - check if previous operations are complete
        if (operation.getSequenceNumber() <= 1) {
            return true; // First operation can always proceed
        }

        // Check if all previous operations for this order line are confirmed
        Long orderLineId = operation.getOrderLineItem() != null ? operation.getOrderLineItem().getOrderLineId() : null;
        if (orderLineId == null) {
            return true;
        }

        List<Operation> allOperations = operationRepository.findByOrderLineItem_OrderLineIdOrderBySequenceNumberAsc(orderLineId);
        for (Operation prevOp : allOperations) {
            if (prevOp.getSequenceNumber() < operation.getSequenceNumber()
                && !Operation.STATUS_CONFIRMED.equals(prevOp.getStatus())) {
                return false;
            }
        }
        return true;
    }

    // ============ CRUD Operations ============

    /**
     * Get all routings.
     */
    @Transactional(readOnly = true)
    public List<Routing> getAllRoutings() {
        return routingRepository.findAll();
    }

    /**
     * Get routings by status.
     */
    @Transactional(readOnly = true)
    public List<Routing> getRoutingsByStatus(String status) {
        return routingRepository.findAll().stream()
                .filter(r -> status.equals(r.getStatus()))
                .collect(Collectors.toList());
    }

    /**
     * Create a new routing for a process.
     * Per MES Spec: Routing.ProcessID (FK → Processes)
     */
    @Transactional
    public Routing createRouting(RoutingDTO.CreateRoutingRequest request, String createdBy) {
        log.info("Creating routing: {} for process: {}", request.getRoutingName(), request.getProcessId());

        // Get the process
        Process process = processRepository.findById(request.getProcessId())
                .orElseThrow(() -> new IllegalArgumentException("Process not found: " + request.getProcessId()));

        // Enforce single active routing per process
        if (request.getActivateImmediately() != null && request.getActivateImmediately()) {
            deactivateOtherRoutingsForProcess(request.getProcessId(), null, createdBy);
        }

        Routing routing = Routing.builder()
                .process(process)
                .routingName(request.getRoutingName())
                .routingType(request.getRoutingType() != null ? request.getRoutingType() : Routing.TYPE_SEQUENTIAL)
                .status(Boolean.TRUE.equals(request.getActivateImmediately()) ? Routing.STATUS_ACTIVE : Routing.STATUS_DRAFT)
                .createdBy(createdBy)
                .build();

        routing = routingRepository.save(routing);
        log.info("Created routing with ID: {}", routing.getRoutingId());
        return routing;
    }

    /**
     * Update an existing routing.
     */
    @Transactional
    public Routing updateRouting(Long routingId, RoutingDTO.UpdateRoutingRequest request, String updatedBy) {
        log.info("Updating routing: {}", routingId);

        Routing routing = routingRepository.findById(routingId)
                .orElseThrow(() -> new IllegalArgumentException("Routing not found: " + routingId));

        // Check if routing is locked (has executed operations)
        if (isRoutingLocked(routingId)) {
            throw new IllegalStateException("Cannot update routing after execution has started: " + routingId);
        }

        if (request.getRoutingName() != null) {
            routing.setRoutingName(request.getRoutingName());
        }
        if (request.getRoutingType() != null) {
            routing.setRoutingType(request.getRoutingType());
        }

        routing.setUpdatedBy(updatedBy);
        return routingRepository.save(routing);
    }

    /**
     * Activate a routing (and optionally deactivate others for same process).
     */
    @Transactional
    public Routing activateRouting(Long routingId, boolean deactivateOthers, String activatedBy) {
        log.info("Activating routing: {}", routingId);

        Routing routing = routingRepository.findById(routingId)
                .orElseThrow(() -> new IllegalArgumentException("Routing not found: " + routingId));

        if (Routing.STATUS_ACTIVE.equals(routing.getStatus())) {
            log.warn("Routing is already active: {}", routingId);
            return routing;
        }

        // Deactivate other routings for the same process
        if (deactivateOthers && routing.getProcess() != null) {
            deactivateOtherRoutingsForProcess(routing.getProcess().getProcessId(), routingId, activatedBy);
        }

        routing.setStatus(Routing.STATUS_ACTIVE);
        routing.setUpdatedBy(activatedBy);
        routing = routingRepository.save(routing);

        log.info("Activated routing: {}", routingId);
        return routing;
    }

    /**
     * Deactivate a routing.
     */
    @Transactional
    public Routing deactivateRouting(Long routingId, String deactivatedBy) {
        log.info("Deactivating routing: {}", routingId);

        Routing routing = routingRepository.findById(routingId)
                .orElseThrow(() -> new IllegalArgumentException("Routing not found: " + routingId));

        if (!Routing.STATUS_ACTIVE.equals(routing.getStatus())) {
            throw new IllegalStateException("Only active routings can be deactivated: " + routingId);
        }

        routing.setStatus(Routing.STATUS_INACTIVE);
        routing.setUpdatedBy(deactivatedBy);
        routing = routingRepository.save(routing);

        log.info("Deactivated routing: {}", routingId);
        return routing;
    }

    /**
     * Delete a routing (only DRAFT or INACTIVE routings).
     */
    @Transactional
    public void deleteRouting(Long routingId) {
        log.info("Deleting routing: {}", routingId);

        Routing routing = routingRepository.findById(routingId)
                .orElseThrow(() -> new IllegalArgumentException("Routing not found: " + routingId));

        if (Routing.STATUS_ACTIVE.equals(routing.getStatus())) {
            throw new IllegalStateException("Cannot delete active routing: " + routingId);
        }

        // Check if routing has been executed
        if (isRoutingLocked(routingId)) {
            throw new IllegalStateException("Cannot delete routing after execution has started: " + routingId);
        }

        // Delete all steps first
        List<RoutingStep> steps = routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(routingId);
        routingStepRepository.deleteAll(steps);

        // Delete the routing
        routingRepository.delete(routing);
        log.info("Deleted routing: {}", routingId);
    }

    /**
     * Put routing on hold.
     */
    @Transactional
    public Routing putRoutingOnHold(Long routingId, String reason, String heldBy) {
        log.info("Putting routing {} on hold: {}", routingId, reason);

        Routing routing = routingRepository.findById(routingId)
                .orElseThrow(() -> new IllegalArgumentException("Routing not found: " + routingId));

        routing.setStatus(Routing.STATUS_ON_HOLD);
        routing.setUpdatedBy(heldBy);
        routing = routingRepository.save(routing);

        log.info("Routing {} placed on hold", routingId);
        return routing;
    }

    /**
     * Release routing from hold.
     */
    @Transactional
    public Routing releaseRoutingFromHold(Long routingId, String releasedBy) {
        log.info("Releasing routing {} from hold", routingId);

        Routing routing = routingRepository.findById(routingId)
                .orElseThrow(() -> new IllegalArgumentException("Routing not found: " + routingId));

        if (!Routing.STATUS_ON_HOLD.equals(routing.getStatus())) {
            throw new IllegalStateException("Routing is not on hold: " + routingId);
        }

        routing.setStatus(Routing.STATUS_ACTIVE);
        routing.setUpdatedBy(releasedBy);
        routing = routingRepository.save(routing);

        log.info("Routing {} released from hold", routingId);
        return routing;
    }

    /**
     * Check if routing is locked (has started execution).
     *
     * NOTE: This checks if any Operations referencing this routing's steps
     * have been executed (IN_PROGRESS or CONFIRMED).
     */
    @Transactional(readOnly = true)
    public boolean isRoutingLocked(Long routingId) {
        List<RoutingStep> steps = routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(routingId);
        for (RoutingStep step : steps) {
            // Check if any operations reference this routing step
            List<Operation> ops = operationRepository.findByRoutingStepId(step.getRoutingStepId());
            for (Operation op : ops) {
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
     * Get routing status summary.
     *
     * NOTE: Step counts are based on RoutingStep templates.
     * Execution status is derived from Operations.
     */
    @Transactional(readOnly = true)
    public RoutingDTO.RoutingStatus getRoutingStatus(Long routingId) {
        Routing routing = routingRepository.findByIdWithSteps(routingId)
                .orElseThrow(() -> new IllegalArgumentException("Routing not found: " + routingId));

        List<RoutingStep> steps = routing.getRoutingSteps();
        int totalSteps = steps.size();
        int activeSteps = (int) steps.stream()
                .filter(s -> RoutingStep.STATUS_ACTIVE.equals(s.getStatus()))
                .count();

        return RoutingDTO.RoutingStatus.builder()
                .routingId(routingId)
                .status(routing.getStatus())
                .totalSteps(totalSteps)
                .completedSteps(0) // Steps don't track completion - use Operations
                .inProgressSteps(0) // Steps don't track progress - use Operations
                .isComplete(false) // Completion is per order line, not routing
                .isLocked(isRoutingLocked(routingId))
                .build();
    }

    // ============ Helper Methods ============

    private void deactivateOtherRoutingsForProcess(Long processId, Long excludeRoutingId, String updatedBy) {
        List<Routing> activeRoutings = routingRepository.findByProcess_ProcessIdAndStatus(processId, Routing.STATUS_ACTIVE);
        for (Routing r : activeRoutings) {
            if (!r.getRoutingId().equals(excludeRoutingId)) {
                r.setStatus(Routing.STATUS_INACTIVE);
                r.setUpdatedBy(updatedBy);
                routingRepository.save(r);
                log.info("Deactivated routing {} for process {}", r.getRoutingId(), processId);
            }
        }
    }

    // ============ Routing Step CRUD Methods ============

    /**
     * Create a routing step.
     * If operationTemplateId is provided, operation details are taken from the template.
     * Otherwise, operationName and operationType are required.
     */
    @Transactional
    public RoutingStep createRoutingStep(Long routingId, RoutingDTO.CreateRoutingStepRequest request, String createdBy) {
        Routing routing = routingRepository.findById(routingId)
                .orElseThrow(() -> new IllegalArgumentException("Routing not found: " + routingId));

        // Check if routing is locked
        if (isRoutingLocked(routingId)) {
            throw new IllegalStateException("Cannot add steps to a routing that has started execution");
        }

        // Validate sequence number
        if (request.getSequenceNumber() == null || request.getSequenceNumber() <= 0) {
            throw new IllegalArgumentException("Sequence number must be a positive integer");
        }

        // Resolve OperationTemplate if provided
        OperationTemplate template = null;
        if (request.getOperationTemplateId() != null) {
            template = operationTemplateRepository.findById(request.getOperationTemplateId())
                    .orElseThrow(() -> new IllegalArgumentException("OperationTemplate not found: " + request.getOperationTemplateId()));
            if (!OperationTemplate.STATUS_ACTIVE.equals(template.getStatus())) {
                throw new IllegalArgumentException("OperationTemplate is not active: " + request.getOperationTemplateId());
            }
        } else {
            // Without template, operationName and operationType are required
            if (request.getOperationName() == null || request.getOperationName().isBlank()) {
                throw new IllegalArgumentException("operationName is required when operationTemplateId is not provided");
            }
            if (request.getOperationType() == null || request.getOperationType().isBlank()) {
                throw new IllegalArgumentException("operationType is required when operationTemplateId is not provided");
            }
        }

        // Build step - use template values as defaults, allow overrides
        RoutingStep.RoutingStepBuilder builder = RoutingStep.builder()
                .routing(routing)
                .operationTemplate(template)
                .sequenceNumber(request.getSequenceNumber())
                .isParallel(request.getIsParallel() != null ? request.getIsParallel() : false)
                .mandatoryFlag(request.getMandatoryFlag() != null ? request.getMandatoryFlag() : true)
                .targetQty(request.getTargetQty())
                .description(request.getDescription())
                .producesOutputBatch(request.getProducesOutputBatch() != null ? request.getProducesOutputBatch() : false)
                .allowsSplit(request.getAllowsSplit() != null ? request.getAllowsSplit() : false)
                .allowsMerge(request.getAllowsMerge() != null ? request.getAllowsMerge() : false)
                .status(RoutingStep.STATUS_ACTIVE)
                .createdBy(createdBy);

        // Set operation fields - from template or request (allow override)
        if (template != null) {
            // Use template values, but allow name override
            builder.operationName(request.getOperationName() != null ? request.getOperationName() : template.getOperationName());
            builder.operationType(template.getOperationType());
            builder.operationCode(request.getOperationCode() != null ? request.getOperationCode() : template.getOperationCode());
            // Duration from request overrides template
            builder.estimatedDurationMinutes(request.getEstimatedDurationMinutes() != null
                    ? request.getEstimatedDurationMinutes()
                    : template.getEstimatedDurationMinutes());
        } else {
            builder.operationName(request.getOperationName());
            builder.operationType(request.getOperationType());
            builder.operationCode(request.getOperationCode());
            builder.estimatedDurationMinutes(request.getEstimatedDurationMinutes());
        }

        RoutingStep step = builder.build();
        step = routingStepRepository.save(step);
        log.info("Created routing step {} for routing {} (template: {})",
                step.getRoutingStepId(), routingId,
                template != null ? template.getOperationTemplateId() : "none");
        return step;
    }

    /**
     * Update a routing step.
     * If operationTemplateId is provided, the template reference is updated.
     */
    @Transactional
    public RoutingStep updateRoutingStep(Long stepId, RoutingDTO.UpdateRoutingStepRequest request, String updatedBy) {
        RoutingStep step = routingStepRepository.findById(stepId)
                .orElseThrow(() -> new IllegalArgumentException("Routing step not found: " + stepId));

        // Check if routing is locked
        if (isRoutingLocked(step.getRouting().getRoutingId())) {
            throw new IllegalStateException("Cannot update steps of a routing that has started execution");
        }

        // Handle OperationTemplate change
        if (request.getOperationTemplateId() != null) {
            OperationTemplate template = operationTemplateRepository.findById(request.getOperationTemplateId())
                    .orElseThrow(() -> new IllegalArgumentException("OperationTemplate not found: " + request.getOperationTemplateId()));
            if (!OperationTemplate.STATUS_ACTIVE.equals(template.getStatus())) {
                throw new IllegalArgumentException("OperationTemplate is not active: " + request.getOperationTemplateId());
            }
            step.setOperationTemplate(template);
            // Update operation fields from template (unless explicitly overridden)
            if (request.getOperationName() == null) {
                step.setOperationName(template.getOperationName());
            }
            step.setOperationType(template.getOperationType());
            if (request.getOperationCode() == null) {
                step.setOperationCode(template.getOperationCode());
            }
            if (request.getEstimatedDurationMinutes() == null && template.getEstimatedDurationMinutes() != null) {
                step.setEstimatedDurationMinutes(template.getEstimatedDurationMinutes());
            }
        }

        // Update fields (allow overrides even when using template)
        if (request.getOperationName() != null) {
            step.setOperationName(request.getOperationName());
        }
        if (request.getOperationType() != null && request.getOperationTemplateId() == null) {
            // Only update type if not using a template (template sets the type)
            step.setOperationType(request.getOperationType());
        }
        if (request.getOperationCode() != null) {
            step.setOperationCode(request.getOperationCode());
        }
        if (request.getSequenceNumber() != null) {
            if (request.getSequenceNumber() <= 0) {
                throw new IllegalArgumentException("Sequence number must be a positive integer");
            }
            step.setSequenceNumber(request.getSequenceNumber());
        }
        if (request.getIsParallel() != null) {
            step.setIsParallel(request.getIsParallel());
        }
        if (request.getMandatoryFlag() != null) {
            step.setMandatoryFlag(request.getMandatoryFlag());
        }
        if (request.getTargetQty() != null) {
            step.setTargetQty(request.getTargetQty());
        }
        if (request.getDescription() != null) {
            step.setDescription(request.getDescription());
        }
        if (request.getEstimatedDurationMinutes() != null) {
            step.setEstimatedDurationMinutes(request.getEstimatedDurationMinutes());
        }
        if (request.getProducesOutputBatch() != null) {
            step.setProducesOutputBatch(request.getProducesOutputBatch());
        }
        if (request.getAllowsSplit() != null) {
            step.setAllowsSplit(request.getAllowsSplit());
        }
        if (request.getAllowsMerge() != null) {
            step.setAllowsMerge(request.getAllowsMerge());
        }

        step.setUpdatedBy(updatedBy);
        step = routingStepRepository.save(step);
        log.info("Updated routing step {} (template: {})", stepId,
                step.getOperationTemplate() != null ? step.getOperationTemplate().getOperationTemplateId() : "none");
        return step;
    }

    /**
     * Delete a routing step.
     */
    @Transactional
    public void deleteRoutingStep(Long stepId) {
        RoutingStep step = routingStepRepository.findById(stepId)
                .orElseThrow(() -> new IllegalArgumentException("Routing step not found: " + stepId));

        // Check if routing is locked
        if (isRoutingLocked(step.getRouting().getRoutingId())) {
            throw new IllegalStateException("Cannot delete steps from a routing that has started execution");
        }

        // Check if step is mandatory
        if (Boolean.TRUE.equals(step.getMandatoryFlag())) {
            throw new IllegalStateException("Cannot delete mandatory routing step: " + stepId);
        }

        routingStepRepository.delete(step);
        log.info("Deleted routing step {}", stepId);
    }

    /**
     * Reorder routing steps.
     */
    @Transactional
    public List<RoutingStep> reorderSteps(Long routingId, List<Long> stepIds, String updatedBy) {
        Routing routing = routingRepository.findByIdWithSteps(routingId)
                .orElseThrow(() -> new IllegalArgumentException("Routing not found: " + routingId));

        // Check if routing is locked
        if (isRoutingLocked(routingId)) {
            throw new IllegalStateException("Cannot reorder steps of a routing that has started execution");
        }

        // Validate all step IDs belong to this routing
        List<Long> existingStepIds = routing.getRoutingSteps().stream()
                .map(RoutingStep::getRoutingStepId)
                .collect(Collectors.toList());

        for (Long stepId : stepIds) {
            if (!existingStepIds.contains(stepId)) {
                throw new IllegalArgumentException("Step " + stepId + " does not belong to routing " + routingId);
            }
        }

        // Update sequence numbers based on position in list
        int sequence = 1;
        for (Long stepId : stepIds) {
            RoutingStep step = routingStepRepository.findById(stepId)
                    .orElseThrow(() -> new IllegalArgumentException("Step not found: " + stepId));
            step.setSequenceNumber(sequence++);
            step.setUpdatedBy(updatedBy);
            routingStepRepository.save(step);
        }

        log.info("Reordered {} steps for routing {}", stepIds.size(), routingId);
        return getRoutingStepsInOrder(routingId);
    }
}
