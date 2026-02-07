package com.mes.production.controller;

import com.mes.production.dto.ProcessDTO;
import com.mes.production.service.ProcessService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Process template operations.
 *
 * Per MES Consolidated Specification:
 * - Process is a design-time template (DRAFT/ACTIVE/INACTIVE)
 * - Runtime execution tracking happens at Operation level
 */
@RestController
@RequestMapping("/api/processes")
@RequiredArgsConstructor
@Slf4j
public class ProcessController {

    private final ProcessService processService;

    /**
     * Get all processes
     */
    @GetMapping
    public ResponseEntity<List<ProcessDTO.Response>> getAllProcesses() {
        log.info("GET /api/processes");
        return ResponseEntity.ok(processService.getAllProcesses());
    }

    /**
     * Get active processes only
     */
    @GetMapping("/active")
    public ResponseEntity<List<ProcessDTO.Response>> getActiveProcesses() {
        log.info("GET /api/processes/active");
        return ResponseEntity.ok(processService.getActiveProcesses());
    }

    /**
     * Get process by ID
     */
    @GetMapping("/{processId}")
    public ResponseEntity<ProcessDTO.Response> getProcessById(@PathVariable Long processId) {
        log.info("GET /api/processes/{}", processId);
        return ResponseEntity.ok(processService.getProcessById(processId));
    }

    /**
     * Get processes by status (DRAFT, ACTIVE, INACTIVE)
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ProcessDTO.Response>> getProcessesByStatus(@PathVariable String status) {
        log.info("GET /api/processes/status/{}", status);
        return ResponseEntity.ok(processService.getProcessesByStatus(status.toUpperCase()));
    }

    /**
     * Create a new process template (defaults to DRAFT status)
     */
    @PostMapping
    public ResponseEntity<ProcessDTO.Response> createProcess(
            @Valid @RequestBody ProcessDTO.CreateRequest request) {
        log.info("POST /api/processes - name={}", request.getProcessName());
        return ResponseEntity.ok(processService.createProcess(request));
    }

    /**
     * Update a process template
     */
    @PutMapping("/{processId}")
    public ResponseEntity<ProcessDTO.Response> updateProcess(
            @PathVariable Long processId,
            @Valid @RequestBody ProcessDTO.UpdateRequest request) {
        log.info("PUT /api/processes/{}", processId);
        return ResponseEntity.ok(processService.updateProcess(processId, request));
    }

    /**
     * Delete a process template (soft delete - sets status to INACTIVE)
     */
    @DeleteMapping("/{processId}")
    public ResponseEntity<Void> deleteProcess(@PathVariable Long processId) {
        log.info("DELETE /api/processes/{}", processId);
        processService.deleteProcess(processId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Activate a process template (DRAFT/INACTIVE -> ACTIVE)
     */
    @PostMapping("/{processId}/activate")
    public ResponseEntity<ProcessDTO.Response> activateProcess(@PathVariable Long processId) {
        log.info("POST /api/processes/{}/activate", processId);
        return ResponseEntity.ok(processService.activateProcess(processId));
    }

    /**
     * Deactivate a process template (ACTIVE -> INACTIVE)
     */
    @PostMapping("/{processId}/deactivate")
    public ResponseEntity<ProcessDTO.Response> deactivateProcess(@PathVariable Long processId) {
        log.info("POST /api/processes/{}/deactivate", processId);
        return ResponseEntity.ok(processService.deactivateProcess(processId));
    }
}
