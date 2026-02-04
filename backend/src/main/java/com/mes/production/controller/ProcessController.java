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
        log.info("Getting process by ID: {}", processId);
        return ResponseEntity.ok(processService.getProcessById(processId));
    }

    /**
     * Get processes by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ProcessDTO.Response>> getProcessesByStatus(@PathVariable String status) {
        log.info("Getting processes by status: {}", status);
        return ResponseEntity.ok(processService.getProcessesByStatus(status.toUpperCase()));
    }

    /**
     * Get processes pending quality inspection
     */
    @GetMapping("/quality-pending")
    public ResponseEntity<List<ProcessDTO.Response>> getQualityPendingProcesses() {
        log.info("Getting quality pending processes");
        return ResponseEntity.ok(processService.getProcessesByStatus("QUALITY_PENDING"));
    }

    /**
     * Transition process to quality pending status
     */
    @PostMapping("/{processId}/quality-pending")
    public ResponseEntity<ProcessDTO.StatusUpdateResponse> transitionToQualityPending(
            @PathVariable Long processId,
            @RequestBody(required = false) Map<String, String> body) {
        log.info("Transitioning process {} to quality pending", processId);
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(processService.transitionToQualityPending(processId, notes));
    }

    /**
     * Make quality decision (accept/reject)
     */
    @PostMapping("/quality-decision")
    public ResponseEntity<ProcessDTO.StatusUpdateResponse> makeQualityDecision(
            @Valid @RequestBody ProcessDTO.QualityDecisionRequest request) {
        log.info("Making quality decision for process {}: {}", request.getProcessId(), request.getDecision());
        return ResponseEntity.ok(processService.makeQualityDecision(request));
    }

    /**
     * Accept process (shorthand for quality decision = ACCEPT)
     */
    @PostMapping("/{processId}/accept")
    public ResponseEntity<ProcessDTO.StatusUpdateResponse> acceptProcess(
            @PathVariable Long processId,
            @RequestBody(required = false) Map<String, String> body) {
        log.info("Accepting process {}", processId);
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
        log.info("Rejecting process {}", processId);
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
        log.info("Updating process {} status to {}", request.getProcessId(), request.getNewStatus());
        return ResponseEntity.ok(processService.updateStatus(request));
    }

    /**
     * Check if all operations are confirmed
     */
    @GetMapping("/{processId}/all-confirmed")
    public ResponseEntity<Map<String, Object>> checkAllOperationsConfirmed(@PathVariable Long processId) {
        log.info("Checking if all operations confirmed for process {}", processId);
        boolean allConfirmed = processService.areAllOperationsConfirmed(processId);
        return ResponseEntity.ok(Map.of(
                "processId", processId,
                "allOperationsConfirmed", allConfirmed
        ));
    }
}
