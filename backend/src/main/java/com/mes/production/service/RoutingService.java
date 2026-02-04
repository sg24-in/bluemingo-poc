package com.mes.production.service;

import com.mes.production.entity.Operation;
import com.mes.production.entity.Routing;
import com.mes.production.entity.RoutingStep;
import com.mes.production.repository.RoutingRepository;
import com.mes.production.repository.RoutingStepRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoutingService {

    private final RoutingRepository routingRepository;
    private final RoutingStepRepository routingStepRepository;

    /**
     * Get routing by ID with steps
     */
    @Transactional(readOnly = true)
    public Optional<Routing> getRoutingWithSteps(Long routingId) {
        return routingRepository.findByIdWithSteps(routingId);
    }

    /**
     * Get active routing for a process
     */
    @Transactional(readOnly = true)
    public Optional<Routing> getActiveRoutingForProcess(Long processId) {
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
}
