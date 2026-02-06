package com.mes.production.controller;

import com.mes.production.dto.ProcessDTO;
import com.mes.production.service.ProcessService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for runtime Process operations.
 *
 * Per MES Consolidated Specification:
 * - Process is the runtime entity (at /api/processes)
 * - ProcessTemplate is for design-time (at /api/process-templates)
 */
@RestController
@RequestMapping("/api/processes")
@RequiredArgsConstructor
@Slf4j
public class ProcessController {

    private final ProcessService processService;

    /**
     * Get process by ID
     */
    @GetMapping("/{processId}")
    public ResponseEntity<ProcessDTO.Response> getProcessById(@PathVariable Long processId) {
        log.info("GET /api/processes/{}", processId);
        return ResponseEntity.ok(processService.getProcessById(processId));
    }

    /**
     * Get processes by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ProcessDTO.Response>> getProcessesByStatus(@PathVariable String status) {
        log.info("GET /api/processes/status/{}", status);
        return ResponseEntity.ok(processService.getProcessesByStatus(status.toUpperCase()));
    }

    /**
     * Get processes pending quality inspection
     */
    @GetMapping("/quality-pending")
    public ResponseEntity<List<ProcessDTO.Response>> getQualityPendingProcesses() {
        log.info("GET /api/processes/quality-pending");
        return ResponseEntity.ok(processService.getQualityPendingProcesses());
    }

    /**
     * Transition process to quality pending status
     */
    @PostMapping("/{processId}/quality-pending")
    public ResponseEntity<ProcessDTO.StatusUpdateResponse> transitionToQualityPending(
            @PathVariable Long processId,
            @RequestBody(required = false) Map<String, String> body) {
        log.info("POST /api/processes/{}/quality-pending", processId);
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(processService.transitionToQualityPending(processId, notes));
    }

    /**
     * Make quality decision (accept/reject)
     */
    @PostMapping("/quality-decision")
    public ResponseEntity<ProcessDTO.StatusUpdateResponse> makeQualityDecision(
            @Valid @RequestBody ProcessDTO.QualityDecisionRequest request) {
        log.info("POST /api/processes/quality-decision - processId={}, decision={}",
                request.getProcessId(), request.getDecision());
        return ResponseEntity.ok(processService.makeQualityDecision(request));
    }

    /**
     * Accept process (shorthand for quality decision = ACCEPT)
     */
    @PostMapping("/{processId}/accept")
    public ResponseEntity<ProcessDTO.StatusUpdateResponse> acceptProcess(
            @PathVariable Long processId,
            @RequestBody(required = false) Map<String, String> body) {
        log.info("POST /api/processes/{}/accept", processId);
        ProcessDTO.QualityDecisionRequest request = ProcessDTO.QualityDecisionRequest.builder()
                .processId(processId)
                .decision("ACCEPT")
                .notes(body != null ? body.get("notes") : null)
                .build();
        return ResponseEntity.ok(processService.makeQualityDecision(request));
    }

    /**
     * Reject process (shorthand for quality decision = REJECT)
     */
    @PostMapping("/{processId}/reject")
    public ResponseEntity<ProcessDTO.StatusUpdateResponse> rejectProcess(
            @PathVariable Long processId,
            @RequestBody Map<String, String> body) {
        log.info("POST /api/processes/{}/reject", processId);
        ProcessDTO.QualityDecisionRequest request = ProcessDTO.QualityDecisionRequest.builder()
                .processId(processId)
                .decision("REJECT")
                .reason(body.get("reason"))
                .notes(body.get("notes"))
                .build();
        return ResponseEntity.ok(processService.makeQualityDecision(request));
    }

    /**
     * Update process status (generic)
     */
    @PutMapping("/status")
    public ResponseEntity<ProcessDTO.StatusUpdateResponse> updateStatus(
            @Valid @RequestBody ProcessDTO.StatusUpdateRequest request) {
        log.info("PUT /api/processes/status - processId={}, newStatus={}",
                request.getProcessId(), request.getNewStatus());
        return ResponseEntity.ok(processService.updateStatus(request));
    }

    /**
     * Check if all operations are confirmed
     */
    @GetMapping("/{processId}/all-confirmed")
    public ResponseEntity<Map<String, Object>> checkAllOperationsConfirmed(@PathVariable Long processId) {
        log.info("GET /api/processes/{}/all-confirmed", processId);
        boolean allConfirmed = processService.areAllOperationsConfirmed(processId);
        return ResponseEntity.ok(Map.of(
                "processId", processId,
                "allOperationsConfirmed", allConfirmed
        ));
    }

    /**
     * Get processes by order ID
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<ProcessDTO.Response>> getProcessesByOrderId(@PathVariable Long orderId) {
        log.info("GET /api/processes/order/{}", orderId);
        return ResponseEntity.ok(processService.getProcessesByOrderId(orderId));
    }

    /**
     * Get processes by order line ID
     */
    @GetMapping("/order-line/{orderLineId}")
    public ResponseEntity<List<ProcessDTO.Response>> getProcessesByOrderLineId(@PathVariable Long orderLineId) {
        log.info("GET /api/processes/order-line/{}", orderLineId);
        return ResponseEntity.ok(processService.getProcessesByOrderLineId(orderLineId));
    }
}
