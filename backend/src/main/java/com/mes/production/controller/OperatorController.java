package com.mes.production.controller;

import com.mes.production.dto.OperatorDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.service.OperatorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/operators")
@RequiredArgsConstructor
@Slf4j
public class OperatorController {

    private final OperatorService operatorService;

    @GetMapping
    public ResponseEntity<List<OperatorDTO>> getAllOperators() {
        log.info("GET /api/operators");
        List<OperatorDTO> operators = operatorService.getAllOperators();
        return ResponseEntity.ok(operators);
    }

    @GetMapping("/active")
    public ResponseEntity<List<OperatorDTO>> getActiveOperators() {
        log.info("GET /api/operators/active");
        List<OperatorDTO> operators = operatorService.getActiveOperators();
        return ResponseEntity.ok(operators);
    }

    @GetMapping("/paged")
    public ResponseEntity<PagedResponseDTO<OperatorDTO>> getOperatorsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {

        log.info("GET /api/operators/paged - page={}, size={}, search={}, status={}", page, size, search, status);

        PageRequestDTO request = PageRequestDTO.builder()
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .search(search)
                .status(status)
                .build();

        PagedResponseDTO<OperatorDTO> result = operatorService.getOperatorsPaged(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OperatorDTO> getOperatorById(@PathVariable Long id) {
        log.info("GET /api/operators/{}", id);
        OperatorDTO operator = operatorService.getOperatorById(id);
        return ResponseEntity.ok(operator);
    }

    @PostMapping
    public ResponseEntity<OperatorDTO> createOperator(@Valid @RequestBody OperatorDTO dto) {
        log.info("POST /api/operators - creating operator: {}", dto.getOperatorCode());
        OperatorDTO created = operatorService.createOperator(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OperatorDTO> updateOperator(
            @PathVariable Long id,
            @Valid @RequestBody OperatorDTO dto) {
        log.info("PUT /api/operators/{} - updating operator", id);
        OperatorDTO updated = operatorService.updateOperator(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteOperator(@PathVariable Long id) {
        log.info("DELETE /api/operators/{}", id);
        operatorService.deleteOperator(id);
        return ResponseEntity.ok(Map.of("message", "Operator deleted successfully"));
    }
}
