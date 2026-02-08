package com.mes.production.controller;

import com.mes.production.dto.OperationDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.service.OperationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/operations")
@RequiredArgsConstructor
@Slf4j
public class OperationController {

    private final OperationService operationService;

    /**
     * Get all operations
     */
    @GetMapping
    public ResponseEntity<List<OperationDTO>> getAllOperations() {
        log.info("GET /api/operations");
        List<OperationDTO> operations = operationService.getAllOperations();
        return ResponseEntity.ok(operations);
    }

    /**
     * TASK-P1: Get paginated operations with filters
     * Supports: page, size, sortBy, sortDirection, status, type (operationType), search
     */
    @GetMapping("/paged")
    public ResponseEntity<PagedResponseDTO<OperationDTO>> getOperationsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search) {

        log.info("GET /api/operations/paged - page={}, size={}, status={}, type={}, search={}",
                page, size, status, type, search);

        PageRequestDTO pageRequest = PageRequestDTO.builder()
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .status(status)
                .type(type)
                .search(search)
                .build();

        PagedResponseDTO<OperationDTO> response = operationService.getOperationsPaged(pageRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * Get operation by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<OperationDTO> getOperationById(@PathVariable Long id) {
        log.info("GET /api/operations/{}", id);
        OperationDTO operation = operationService.getOperationById(id);
        return ResponseEntity.ok(operation);
    }

    /**
     * Get operations by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<OperationDTO>> getOperationsByStatus(@PathVariable String status) {
        log.info("GET /api/operations/status/{}", status);
        List<OperationDTO> operations = operationService.getOperationsByStatus(status);
        return ResponseEntity.ok(operations);
    }

    /**
     * Get blocked operations
     */
    @GetMapping("/blocked")
    public ResponseEntity<List<OperationDTO>> getBlockedOperations() {
        log.info("GET /api/operations/blocked");
        List<OperationDTO> operations = operationService.getBlockedOperations();
        return ResponseEntity.ok(operations);
    }

    /**
     * Block an operation
     */
    @PostMapping("/{id}/block")
    public ResponseEntity<OperationDTO.StatusUpdateResponse> blockOperation(
            @PathVariable Long id,
            @RequestBody OperationDTO.BlockRequest request) {
        log.info("POST /api/operations/{}/block", id);
        OperationDTO.StatusUpdateResponse response = operationService.blockOperation(id, request.getReason());
        return ResponseEntity.ok(response);
    }

    /**
     * Unblock an operation
     */
    @PostMapping("/{id}/unblock")
    public ResponseEntity<OperationDTO.StatusUpdateResponse> unblockOperation(@PathVariable Long id) {
        log.info("POST /api/operations/{}/unblock", id);
        OperationDTO.StatusUpdateResponse response = operationService.unblockOperation(id);
        return ResponseEntity.ok(response);
    }
}
