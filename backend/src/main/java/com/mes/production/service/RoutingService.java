package com.mes.production.service;

import com.mes.production.dto.RoutingDTO;
import com.mes.production.entity.Operation;
import com.mes.production.entity.Process;
import com.mes.production.entity.Routing;
import com.mes.production.entity.RoutingStep;
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
 * Service for managing Routing entities.
 *
 * Per MES Consolidated Specification:
 * - Routing has ProcessID (FK → Processes)
 * - Operation sequence is derived from Routing
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RoutingService {

    private final RoutingRepository routingRepository;
    private final RoutingStepRepository routingStepRepository;
    private final ProcessRepository processRepository;

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
     * Check if routing is complete (all mandatory steps done)
     */
    @Transactional(readOnly = true)
    public boolean isRoutingComplete(Long routingId) {
        List<RoutingStep> incompleteSteps = routingStepRepository.findIncompleteMandatorySteps(routingId);
        return incompleteSteps.isEmpty();
    }

    /**
     * Get next operation to be made READY based on routing
     */
    @Transactional(readOnly = true)
    public Optional<Operation> getNextOperationToReady(Long routingId, Integer currentSequence) {
        List<RoutingStep> nextSteps = routingStepRepository.findNextSteps(routingId, currentSequence);
        if (!nextSteps.isEmpty()) {
            RoutingStep nextStep = nextSteps.get(0);
            return Optional.ofNullable(nextStep.getOperation());
        }
        return Optional.empty();
    }

    /**
     * Update routing step status
     */
    @Transactional
    public RoutingStep updateStepStatus(Long routingStepId, String newStatus, String updatedBy) {
        RoutingStep step = routingStepRepository.findById(routingStepId)
                .orElseThrow(() -> new RuntimeException("Routing step not found: " + routingStepId));

        step.setStatus(newStatus);
        step.setUpdatedBy(updatedBy);
        return routingStepRepository.save(step);
    }

    /**
     * Get routing step for an operation
     */
    @Transactional(readOnly = true)
    public Optional<RoutingStep> getStepForOperation(Long operationId) {
        return routingStepRepository.findByOperation_OperationId(operationId);
    }

    /**
     * Check if operation can proceed based on routing rules
     */
    @Transactional(readOnly = true)
    public boolean canOperationProceed(Long operationId) {
        Optional<RoutingStep> stepOpt = routingStepRepository.findByOperation_OperationId(operationId);
        if (stepOpt.isEmpty()) {
            // No routing step means no restrictions
            return true;
        }

        RoutingStep step = stepOpt.get();
        Routing routing = step.getRouting();

        if (Routing.TYPE_PARALLEL.equals(routing.getRoutingType())) {
            // Parallel routing - can proceed if step is ready
            return RoutingStep.STATUS_READY.equals(step.getStatus());
        }

        // Sequential routing - check if previous steps are complete
        if (step.getSequenceNumber() == 1) {
            return true; // First step can always proceed
        }

        // Check if all previous mandatory steps are complete
        List<RoutingStep> allSteps = routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(routing.getRoutingId());
        for (RoutingStep prevStep : allSteps) {
            if (prevStep.getSequenceNumber() < step.getSequenceNumber()
                && prevStep.getMandatoryFlag()
                && !RoutingStep.STATUS_COMPLETED.equals(prevStep.getStatus())) {
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

        // Check if routing is locked (has executed steps)
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
     */
    @Transactional(readOnly = true)
    public boolean isRoutingLocked(Long routingId) {
        List<RoutingStep> steps = routingStepRepository.findByRouting_RoutingIdOrderBySequenceNumberAsc(routingId);
        for (RoutingStep step : steps) {
            if (RoutingStep.STATUS_IN_PROGRESS.equals(step.getStatus()) ||
                RoutingStep.STATUS_COMPLETED.equals(step.getStatus())) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get routing status summary.
     */
    @Transactional(readOnly = true)
    public RoutingDTO.RoutingStatus getRoutingStatus(Long routingId) {
        Routing routing = routingRepository.findByIdWithSteps(routingId)
                .orElseThrow(() -> new IllegalArgumentException("Routing not found: " + routingId));

        List<RoutingStep> steps = routing.getRoutingSteps();

        int totalSteps = steps.size();
        int completedSteps = (int) steps.stream()
                .filter(s -> RoutingStep.STATUS_COMPLETED.equals(s.getStatus()))
                .count();
        int inProgressSteps = (int) steps.stream()
                .filter(s -> RoutingStep.STATUS_IN_PROGRESS.equals(s.getStatus()))
                .count();

        return RoutingDTO.RoutingStatus.builder()
                .routingId(routingId)
                .status(routing.getStatus())
                .totalSteps(totalSteps)
                .completedSteps(completedSteps)
                .inProgressSteps(inProgressSteps)
                .isComplete(completedSteps == totalSteps && totalSteps > 0)
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

        RoutingStep step = RoutingStep.builder()
                .routing(routing)
                .operationName(request.getOperationName())
                .operationType(request.getOperationType())
                .operationCode(request.getOperationCode())
                .sequenceNumber(request.getSequenceNumber())
                .isParallel(request.getIsParallel() != null ? request.getIsParallel() : false)
                .mandatoryFlag(request.getMandatoryFlag() != null ? request.getMandatoryFlag() : true)
                .targetQty(request.getTargetQty())
                .description(request.getDescription())
                .estimatedDurationMinutes(request.getEstimatedDurationMinutes())
                .producesOutputBatch(request.getProducesOutputBatch() != null ? request.getProducesOutputBatch() : false)
                .allowsSplit(request.getAllowsSplit() != null ? request.getAllowsSplit() : false)
                .allowsMerge(request.getAllowsMerge() != null ? request.getAllowsMerge() : false)
                .status(RoutingStep.STATUS_READY)
                .createdBy(createdBy)
                .build();

        step = routingStepRepository.save(step);
        log.info("Created routing step {} for routing {}", step.getRoutingStepId(), routingId);
        return step;
    }

    /**
     * Update a routing step.
     */
    @Transactional
    public RoutingStep updateRoutingStep(Long stepId, RoutingDTO.UpdateRoutingStepRequest request, String updatedBy) {
        RoutingStep step = routingStepRepository.findById(stepId)
                .orElseThrow(() -> new IllegalArgumentException("Routing step not found: " + stepId));

        // Check if routing is locked
        if (isRoutingLocked(step.getRouting().getRoutingId())) {
            throw new IllegalStateException("Cannot update steps of a routing that has started execution");
        }

        // Update fields
        if (request.getOperationName() != null) {
            step.setOperationName(request.getOperationName());
        }
        if (request.getOperationType() != null) {
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
        log.info("Updated routing step {}", stepId);
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
