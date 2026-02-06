package com.mes.production.controller;

import com.mes.production.dto.RoutingDTO;
import com.mes.production.entity.Routing;
import com.mes.production.entity.RoutingStep;
import com.mes.production.service.RoutingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
     * Get routing for a process (runtime).
     * Per MES Spec: Routing.ProcessID (FK → Processes)
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
     * Get routing for a process template (design-time).
     * Used for template management operations.
     */
    @GetMapping("/template/{templateId}")
    public ResponseEntity<RoutingDTO.RoutingInfo> getRoutingForTemplate(@PathVariable Long templateId) {
        log.info("GET /api/routing/template/{}", templateId);
        return routingService.getActiveRoutingForTemplate(templateId)
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

    /**
     * Get routing status summary.
     */
    @GetMapping("/{routingId}/status")
    public ResponseEntity<RoutingDTO.RoutingStatus> getRoutingStatus(@PathVariable Long routingId) {
        log.info("GET /api/routing/{}/status", routingId);
        RoutingDTO.RoutingStatus status = routingService.getRoutingStatus(routingId);
        return ResponseEntity.ok(status);
    }

    /**
     * Check if routing is locked.
     */
    @GetMapping("/{routingId}/locked")
    public ResponseEntity<Boolean> isRoutingLocked(@PathVariable Long routingId) {
        log.info("GET /api/routing/{}/locked", routingId);
        boolean isLocked = routingService.isRoutingLocked(routingId);
        return ResponseEntity.ok(isLocked);
    }

    /**
     * Get all routings.
     */
    @GetMapping
    public ResponseEntity<List<RoutingDTO.RoutingInfo>> getAllRoutings(
            @RequestParam(required = false) String status) {

        log.info("GET /api/routing - status={}", status);

        List<Routing> routings;
        if (status != null) {
            routings = routingService.getRoutingsByStatus(status);
        } else {
            routings = routingService.getAllRoutings();
        }

        List<RoutingDTO.RoutingInfo> routingInfos = routings.stream()
                .map(this::convertToRoutingInfo)
                .collect(Collectors.toList());

        return ResponseEntity.ok(routingInfos);
    }

    // ============ CRUD Endpoints ============

    /**
     * Create a new routing.
     */
    @PostMapping
    public ResponseEntity<RoutingDTO.RoutingInfo> createRouting(
            @RequestBody RoutingDTO.CreateRoutingRequest request,
            Authentication auth) {

        log.info("POST /api/routing - Creating routing: {}", request.getRoutingName());
        String username = auth != null ? auth.getName() : "system";

        Routing routing = routingService.createRouting(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(convertToRoutingInfo(routing));
    }

    /**
     * Update a routing.
     */
    @PutMapping("/{routingId}")
    public ResponseEntity<RoutingDTO.RoutingInfo> updateRouting(
            @PathVariable Long routingId,
            @RequestBody RoutingDTO.UpdateRoutingRequest request,
            Authentication auth) {

        log.info("PUT /api/routing/{}", routingId);
        String username = auth != null ? auth.getName() : "system";

        Routing routing = routingService.updateRouting(routingId, request, username);
        return ResponseEntity.ok(convertToRoutingInfo(routing));
    }

    /**
     * Delete a routing.
     */
    @DeleteMapping("/{routingId}")
    public ResponseEntity<Void> deleteRouting(@PathVariable Long routingId) {
        log.info("DELETE /api/routing/{}", routingId);
        routingService.deleteRouting(routingId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Activate a routing.
     */
    @PostMapping("/{routingId}/activate")
    public ResponseEntity<RoutingDTO.RoutingInfo> activateRouting(
            @PathVariable Long routingId,
            @RequestBody(required = false) RoutingDTO.ActivateRoutingRequest request,
            Authentication auth) {

        log.info("POST /api/routing/{}/activate", routingId);
        String username = auth != null ? auth.getName() : "system";

        boolean deactivateOthers = request != null && Boolean.TRUE.equals(request.getDeactivateOthers());
        Routing routing = routingService.activateRouting(routingId, deactivateOthers, username);
        return ResponseEntity.ok(convertToRoutingInfo(routing));
    }

    /**
     * Deactivate a routing.
     */
    @PostMapping("/{routingId}/deactivate")
    public ResponseEntity<RoutingDTO.RoutingInfo> deactivateRouting(
            @PathVariable Long routingId,
            Authentication auth) {

        log.info("POST /api/routing/{}/deactivate", routingId);
        String username = auth != null ? auth.getName() : "system";

        Routing routing = routingService.deactivateRouting(routingId, username);
        return ResponseEntity.ok(convertToRoutingInfo(routing));
    }

    /**
     * Put routing on hold.
     */
    @PostMapping("/{routingId}/hold")
    public ResponseEntity<RoutingDTO.RoutingInfo> putRoutingOnHold(
            @PathVariable Long routingId,
            @RequestBody(required = false) RoutingDTO.HoldRoutingRequest request,
            Authentication auth) {

        log.info("POST /api/routing/{}/hold", routingId);
        String username = auth != null ? auth.getName() : "system";
        String reason = request != null ? request.getReason() : null;

        Routing routing = routingService.putRoutingOnHold(routingId, reason, username);
        return ResponseEntity.ok(convertToRoutingInfo(routing));
    }

    /**
     * Release routing from hold.
     */
    @PostMapping("/{routingId}/release")
    public ResponseEntity<RoutingDTO.RoutingInfo> releaseRoutingFromHold(
            @PathVariable Long routingId,
            Authentication auth) {

        log.info("POST /api/routing/{}/release", routingId);
        String username = auth != null ? auth.getName() : "system";

        Routing routing = routingService.releaseRoutingFromHold(routingId, username);
        return ResponseEntity.ok(convertToRoutingInfo(routing));
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
