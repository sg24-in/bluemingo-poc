package com.mes.production.controller;

import com.mes.production.dto.RoutingDTO;
import com.mes.production.entity.Routing;
import com.mes.production.entity.RoutingStep;
import com.mes.production.service.RoutingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/routing")
@RequiredArgsConstructor
@Slf4j
public class RoutingController {

    private final RoutingService routingService;

    /**
     * Get routing by ID with steps
     */
    @GetMapping("/{routingId}")
    public ResponseEntity<RoutingDTO.RoutingInfo> getRouting(@PathVariable Long routingId) {
        log.info("GET /api/routing/{}", routingId);
        return routingService.getRoutingWithSteps(routingId)
                .map(this::convertToRoutingInfo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get routing for a process
     */
    @GetMapping("/process/{processId}")
    public ResponseEntity<RoutingDTO.RoutingInfo> getRoutingForProcess(@PathVariable Long processId) {
        log.info("GET /api/routing/process/{}", processId);
        return routingService.getActiveRoutingForProcess(processId)
                .map(this::convertToRoutingInfo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get routing steps in order
     */
    @GetMapping("/{routingId}/steps")
    public ResponseEntity<List<RoutingDTO.RoutingStepInfo>> getRoutingSteps(@PathVariable Long routingId) {
        log.info("GET /api/routing/{}/steps", routingId);
        List<RoutingStep> steps = routingService.getRoutingStepsInOrder(routingId);
        List<RoutingDTO.RoutingStepInfo> stepInfos = steps.stream()
                .map(this::convertToStepInfo)
                .collect(Collectors.toList());
        return ResponseEntity.ok(stepInfos);
    }

    /**
     * Check if operation can proceed
     */
    @GetMapping("/operation/{operationId}/can-proceed")
    public ResponseEntity<Boolean> canOperationProceed(@PathVariable Long operationId) {
        log.info("GET /api/routing/operation/{}/can-proceed", operationId);
        boolean canProceed = routingService.canOperationProceed(operationId);
        return ResponseEntity.ok(canProceed);
    }

    /**
     * Check if routing is complete
     */
    @GetMapping("/{routingId}/complete")
    public ResponseEntity<Boolean> isRoutingComplete(@PathVariable Long routingId) {
        log.info("GET /api/routing/{}/complete", routingId);
        boolean isComplete = routingService.isRoutingComplete(routingId);
        return ResponseEntity.ok(isComplete);
    }

    private RoutingDTO.RoutingInfo convertToRoutingInfo(Routing routing) {
        List<RoutingDTO.RoutingStepInfo> stepInfos = routing.getRoutingSteps().stream()
                .map(this::convertToStepInfo)
                .collect(Collectors.toList());

        return RoutingDTO.RoutingInfo.builder()
                .routingId(routing.getRoutingId())
                .processId(routing.getProcess() != null ? routing.getProcess().getProcessId() : null)
                .routingName(routing.getRoutingName())
                .routingType(routing.getRoutingType())
                .status(routing.getStatus())
                .steps(stepInfos)
                .createdOn(routing.getCreatedOn())
                .build();
    }

    private RoutingDTO.RoutingStepInfo convertToStepInfo(RoutingStep step) {
        return RoutingDTO.RoutingStepInfo.builder()
                .routingStepId(step.getRoutingStepId())
                .routingId(step.getRouting() != null ? step.getRouting().getRoutingId() : null)
                .operationId(step.getOperation() != null ? step.getOperation().getOperationId() : null)
                .operationName(step.getOperation() != null ? step.getOperation().getOperationName() : null)
                .sequenceNumber(step.getSequenceNumber())
                .isParallel(step.getIsParallel())
                .mandatoryFlag(step.getMandatoryFlag())
                .status(step.getStatus())
                .build();
    }
}
