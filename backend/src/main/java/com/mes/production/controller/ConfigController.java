package com.mes.production.controller;

import com.mes.production.dto.*;
import com.mes.production.service.BatchNumberConfigService;
import com.mes.production.service.DelayReasonService;
import com.mes.production.service.HoldReasonService;
import com.mes.production.service.ProcessParametersConfigService;
import com.mes.production.service.QuantityTypeConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
@Slf4j
public class ConfigController {

    private final HoldReasonService holdReasonService;
    private final DelayReasonService delayReasonService;
    private final ProcessParametersConfigService processParametersConfigService;
    private final BatchNumberConfigService batchNumberConfigService;
    private final QuantityTypeConfigService quantityTypeConfigService;

    // ===== Hold Reasons =====

    @GetMapping("/hold-reasons")
    public ResponseEntity<List<HoldReasonDTO>> getAllHoldReasons() {
        log.info("GET /api/config/hold-reasons");
        return ResponseEntity.ok(holdReasonService.getAllHoldReasons());
    }

    @GetMapping("/hold-reasons/active")
    public ResponseEntity<List<HoldReasonDTO>> getActiveHoldReasons(
            @RequestParam(required = false) String applicableTo) {
        log.info("GET /api/config/hold-reasons/active - applicableTo={}", applicableTo);
        if (applicableTo != null && !applicableTo.isEmpty()) {
            return ResponseEntity.ok(holdReasonService.getActiveByApplicableTo(applicableTo));
        }
        return ResponseEntity.ok(holdReasonService.getActiveHoldReasons());
    }

    @GetMapping("/hold-reasons/paged")
    public ResponseEntity<PagedResponseDTO<HoldReasonDTO>> getHoldReasonsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {

        log.info("GET /api/config/hold-reasons/paged - page={}, size={}, search={}", page, size, search);

        PageRequestDTO request = PageRequestDTO.builder()
                .page(page).size(size).sortBy(sortBy)
                .sortDirection(sortDirection).search(search).status(status)
                .build();

        return ResponseEntity.ok(holdReasonService.getHoldReasonsPaged(request));
    }

    @GetMapping("/hold-reasons/{id}")
    public ResponseEntity<HoldReasonDTO> getHoldReasonById(@PathVariable Long id) {
        log.info("GET /api/config/hold-reasons/{}", id);
        return ResponseEntity.ok(holdReasonService.getHoldReasonById(id));
    }

    @PostMapping("/hold-reasons")
    public ResponseEntity<HoldReasonDTO> createHoldReason(@Valid @RequestBody HoldReasonDTO dto) {
        log.info("POST /api/config/hold-reasons - creating: {}", dto.getReasonCode());
        return ResponseEntity.status(HttpStatus.CREATED).body(holdReasonService.createHoldReason(dto));
    }

    @PutMapping("/hold-reasons/{id}")
    public ResponseEntity<HoldReasonDTO> updateHoldReason(
            @PathVariable Long id, @Valid @RequestBody HoldReasonDTO dto) {
        log.info("PUT /api/config/hold-reasons/{}", id);
        return ResponseEntity.ok(holdReasonService.updateHoldReason(id, dto));
    }

    @DeleteMapping("/hold-reasons/{id}")
    public ResponseEntity<Map<String, String>> deleteHoldReason(@PathVariable Long id) {
        log.info("DELETE /api/config/hold-reasons/{}", id);
        holdReasonService.deleteHoldReason(id);
        return ResponseEntity.ok(Map.of("message", "Hold reason deleted successfully"));
    }

    // ===== Delay Reasons =====

    @GetMapping("/delay-reasons")
    public ResponseEntity<List<DelayReasonDTO>> getAllDelayReasons() {
        log.info("GET /api/config/delay-reasons");
        return ResponseEntity.ok(delayReasonService.getAllDelayReasons());
    }

    @GetMapping("/delay-reasons/active")
    public ResponseEntity<List<DelayReasonDTO>> getActiveDelayReasons() {
        log.info("GET /api/config/delay-reasons/active");
        return ResponseEntity.ok(delayReasonService.getActiveDelayReasons());
    }

    @GetMapping("/delay-reasons/paged")
    public ResponseEntity<PagedResponseDTO<DelayReasonDTO>> getDelayReasonsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {

        log.info("GET /api/config/delay-reasons/paged - page={}, size={}, search={}", page, size, search);

        PageRequestDTO request = PageRequestDTO.builder()
                .page(page).size(size).sortBy(sortBy)
                .sortDirection(sortDirection).search(search).status(status)
                .build();

        return ResponseEntity.ok(delayReasonService.getDelayReasonsPaged(request));
    }

    @GetMapping("/delay-reasons/{id}")
    public ResponseEntity<DelayReasonDTO> getDelayReasonById(@PathVariable Long id) {
        log.info("GET /api/config/delay-reasons/{}", id);
        return ResponseEntity.ok(delayReasonService.getDelayReasonById(id));
    }

    @PostMapping("/delay-reasons")
    public ResponseEntity<DelayReasonDTO> createDelayReason(@Valid @RequestBody DelayReasonDTO dto) {
        log.info("POST /api/config/delay-reasons - creating: {}", dto.getReasonCode());
        return ResponseEntity.status(HttpStatus.CREATED).body(delayReasonService.createDelayReason(dto));
    }

    @PutMapping("/delay-reasons/{id}")
    public ResponseEntity<DelayReasonDTO> updateDelayReason(
            @PathVariable Long id, @Valid @RequestBody DelayReasonDTO dto) {
        log.info("PUT /api/config/delay-reasons/{}", id);
        return ResponseEntity.ok(delayReasonService.updateDelayReason(id, dto));
    }

    @DeleteMapping("/delay-reasons/{id}")
    public ResponseEntity<Map<String, String>> deleteDelayReason(@PathVariable Long id) {
        log.info("DELETE /api/config/delay-reasons/{}", id);
        delayReasonService.deleteDelayReason(id);
        return ResponseEntity.ok(Map.of("message", "Delay reason deleted successfully"));
    }

    // ===== Process Parameters Config =====

    @GetMapping("/process-parameters")
    public ResponseEntity<List<ProcessParametersConfigDTO>> getAllProcessParams() {
        log.info("GET /api/config/process-parameters");
        return ResponseEntity.ok(processParametersConfigService.getAllConfigs());
    }

    @GetMapping("/process-parameters/active")
    public ResponseEntity<List<ProcessParametersConfigDTO>> getActiveProcessParams(
            @RequestParam(required = false) String operationType,
            @RequestParam(required = false) String productSku) {
        log.info("GET /api/config/process-parameters/active - op={}, sku={}", operationType, productSku);
        if (operationType != null && !operationType.isEmpty()) {
            return ResponseEntity.ok(processParametersConfigService.getActiveByOperationAndProduct(operationType, productSku));
        }
        return ResponseEntity.ok(processParametersConfigService.getActiveConfigs());
    }

    @GetMapping("/process-parameters/paged")
    public ResponseEntity<PagedResponseDTO<ProcessParametersConfigDTO>> getProcessParamsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {

        log.info("GET /api/config/process-parameters/paged - page={}, size={}", page, size);

        PageRequestDTO request = PageRequestDTO.builder()
                .page(page).size(size).sortBy(sortBy)
                .sortDirection(sortDirection).search(search).status(status)
                .build();

        return ResponseEntity.ok(processParametersConfigService.getConfigsPaged(request));
    }

    @GetMapping("/process-parameters/{id}")
    public ResponseEntity<ProcessParametersConfigDTO> getProcessParamById(@PathVariable Long id) {
        log.info("GET /api/config/process-parameters/{}", id);
        return ResponseEntity.ok(processParametersConfigService.getConfigById(id));
    }

    @PostMapping("/process-parameters")
    public ResponseEntity<ProcessParametersConfigDTO> createProcessParam(@Valid @RequestBody ProcessParametersConfigDTO dto) {
        log.info("POST /api/config/process-parameters - creating: {}/{}", dto.getOperationType(), dto.getParameterName());
        return ResponseEntity.status(HttpStatus.CREATED).body(processParametersConfigService.createConfig(dto));
    }

    @PutMapping("/process-parameters/{id}")
    public ResponseEntity<ProcessParametersConfigDTO> updateProcessParam(
            @PathVariable Long id, @Valid @RequestBody ProcessParametersConfigDTO dto) {
        log.info("PUT /api/config/process-parameters/{}", id);
        return ResponseEntity.ok(processParametersConfigService.updateConfig(id, dto));
    }

    @DeleteMapping("/process-parameters/{id}")
    public ResponseEntity<Map<String, String>> deleteProcessParam(@PathVariable Long id) {
        log.info("DELETE /api/config/process-parameters/{}", id);
        processParametersConfigService.deleteConfig(id);
        return ResponseEntity.ok(Map.of("message", "Process parameter config deleted successfully"));
    }

    // ===== Batch Number Config =====

    @GetMapping("/batch-number")
    public ResponseEntity<List<BatchNumberConfigDTO>> getAllBatchNumberConfigs() {
        log.info("GET /api/config/batch-number");
        return ResponseEntity.ok(batchNumberConfigService.getAllConfigs());
    }

    @GetMapping("/batch-number/active")
    public ResponseEntity<List<BatchNumberConfigDTO>> getActiveBatchNumberConfigs() {
        log.info("GET /api/config/batch-number/active");
        return ResponseEntity.ok(batchNumberConfigService.getActiveConfigs());
    }

    @GetMapping("/batch-number/paged")
    public ResponseEntity<PagedResponseDTO<BatchNumberConfigDTO>> getBatchNumberConfigsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {

        log.info("GET /api/config/batch-number/paged - page={}, size={}", page, size);

        PageRequestDTO request = PageRequestDTO.builder()
                .page(page).size(size).sortBy(sortBy)
                .sortDirection(sortDirection).search(search).status(status)
                .build();

        return ResponseEntity.ok(batchNumberConfigService.getConfigsPaged(request));
    }

    @GetMapping("/batch-number/{id}")
    public ResponseEntity<BatchNumberConfigDTO> getBatchNumberConfigById(@PathVariable Long id) {
        log.info("GET /api/config/batch-number/{}", id);
        return ResponseEntity.ok(batchNumberConfigService.getConfigById(id));
    }

    @PostMapping("/batch-number")
    public ResponseEntity<BatchNumberConfigDTO> createBatchNumberConfig(@Valid @RequestBody BatchNumberConfigDTO dto) {
        log.info("POST /api/config/batch-number - creating: {}", dto.getConfigName());
        return ResponseEntity.status(HttpStatus.CREATED).body(batchNumberConfigService.createConfig(dto));
    }

    @PutMapping("/batch-number/{id}")
    public ResponseEntity<BatchNumberConfigDTO> updateBatchNumberConfig(
            @PathVariable Long id, @Valid @RequestBody BatchNumberConfigDTO dto) {
        log.info("PUT /api/config/batch-number/{}", id);
        return ResponseEntity.ok(batchNumberConfigService.updateConfig(id, dto));
    }

    @DeleteMapping("/batch-number/{id}")
    public ResponseEntity<Map<String, String>> deleteBatchNumberConfig(@PathVariable Long id) {
        log.info("DELETE /api/config/batch-number/{}", id);
        batchNumberConfigService.deleteConfig(id);
        return ResponseEntity.ok(Map.of("message", "Batch number config deleted successfully"));
    }

    // ===== Quantity Type Config =====

    @GetMapping("/quantity-types")
    public ResponseEntity<List<QuantityTypeConfigDTO>> getAllQuantityTypeConfigs() {
        log.info("GET /api/config/quantity-types");
        return ResponseEntity.ok(quantityTypeConfigService.getAllConfigs());
    }

    @GetMapping("/quantity-types/active")
    public ResponseEntity<List<QuantityTypeConfigDTO>> getActiveQuantityTypeConfigs() {
        log.info("GET /api/config/quantity-types/active");
        return ResponseEntity.ok(quantityTypeConfigService.getActiveConfigs());
    }

    @GetMapping("/quantity-types/paged")
    public ResponseEntity<PagedResponseDTO<QuantityTypeConfigDTO>> getQuantityTypeConfigsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {

        log.info("GET /api/config/quantity-types/paged - page={}, size={}", page, size);

        PageRequestDTO request = PageRequestDTO.builder()
                .page(page).size(size).sortBy(sortBy)
                .sortDirection(sortDirection).search(search).status(status)
                .build();

        return ResponseEntity.ok(quantityTypeConfigService.getConfigsPaged(request));
    }

    @GetMapping("/quantity-types/{id}")
    public ResponseEntity<QuantityTypeConfigDTO> getQuantityTypeConfigById(@PathVariable Long id) {
        log.info("GET /api/config/quantity-types/{}", id);
        return ResponseEntity.ok(quantityTypeConfigService.getConfigById(id));
    }

    @PostMapping("/quantity-types")
    public ResponseEntity<QuantityTypeConfigDTO> createQuantityTypeConfig(@Valid @RequestBody QuantityTypeConfigDTO dto) {
        log.info("POST /api/config/quantity-types - creating: {}", dto.getConfigName());
        return ResponseEntity.status(HttpStatus.CREATED).body(quantityTypeConfigService.createConfig(dto));
    }

    @PutMapping("/quantity-types/{id}")
    public ResponseEntity<QuantityTypeConfigDTO> updateQuantityTypeConfig(
            @PathVariable Long id, @Valid @RequestBody QuantityTypeConfigDTO dto) {
        log.info("PUT /api/config/quantity-types/{}", id);
        return ResponseEntity.ok(quantityTypeConfigService.updateConfig(id, dto));
    }

    @DeleteMapping("/quantity-types/{id}")
    public ResponseEntity<Map<String, String>> deleteQuantityTypeConfig(@PathVariable Long id) {
        log.info("DELETE /api/config/quantity-types/{}", id);
        quantityTypeConfigService.deleteConfig(id);
        return ResponseEntity.ok(Map.of("message", "Quantity type config deleted successfully"));
    }
}
