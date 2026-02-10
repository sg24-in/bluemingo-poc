package com.mes.production.controller;

import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.entity.BatchSizeConfig;
import com.mes.production.repository.BatchSizeConfigRepository;
import com.mes.production.service.AuditService;
import com.mes.production.service.BatchSizeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * REST controller for BatchSizeConfig CRUD operations.
 */
@RestController
@RequestMapping("/api/batch-size-config")
@RequiredArgsConstructor
@Slf4j
public class BatchSizeConfigController {

    private final BatchSizeConfigRepository repository;
    private final BatchSizeService batchSizeService;
    private final AuditService auditService;

    /**
     * Get all batch size configurations
     */
    @GetMapping
    public ResponseEntity<List<BatchSizeConfig>> getAll() {
        List<BatchSizeConfig> configs = repository.findAll();
        return ResponseEntity.ok(configs);
    }

    /**
     * Get all active batch size configurations
     */
    @GetMapping("/active")
    public ResponseEntity<List<BatchSizeConfig>> getActive() {
        List<BatchSizeConfig> configs = batchSizeService.getAllActiveConfigs();
        return ResponseEntity.ok(configs);
    }

    /**
     * Get paginated batch size configurations with filters
     */
    @GetMapping("/paged")
    public ResponseEntity<PagedResponseDTO<BatchSizeConfig>> getPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String operationType,
            @RequestParam(required = false) String materialId,
            @RequestParam(required = false) Boolean isActive) {

        log.info("GET /api/batch-size-config/paged - page={}, size={}, search={}", page, size, search);

        String sortField = sortBy != null ? sortBy : "configId";
        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortField);
        PageRequest pageRequest = PageRequest.of(page, size, sort);

        String searchPattern = search != null ? "%" + search.toLowerCase() + "%" : null;

        Page<BatchSizeConfig> result = repository.findByFilters(
                operationType, materialId, isActive, searchPattern, pageRequest);

        return ResponseEntity.ok(PagedResponseDTO.fromPage(result, sortField, sortDirection, search));
    }

    /**
     * Get batch size configuration by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<BatchSizeConfig> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create new batch size configuration
     */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody BatchSizeConfig config) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();

            // Validate
            if (config.getMaxBatchSize() == null || config.getMaxBatchSize().compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Max batch size is required and must be greater than 0"));
            }

            if (config.getMinBatchSize() != null && config.getMinBatchSize().compareTo(config.getMaxBatchSize()) > 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Min batch size cannot be greater than max batch size"));
            }

            if (config.getPreferredBatchSize() != null) {
                if (config.getMinBatchSize() != null && config.getPreferredBatchSize().compareTo(config.getMinBatchSize()) < 0) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Preferred batch size cannot be less than min batch size"));
                }
                if (config.getPreferredBatchSize().compareTo(config.getMaxBatchSize()) > 0) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Preferred batch size cannot be greater than max batch size"));
                }
            }

            config.setCreatedBy(username);
            config.setCreatedOn(LocalDateTime.now());

            BatchSizeConfig saved = repository.save(config);

            auditService.logCreate("BATCH_SIZE_CONFIG", saved.getConfigId(),
                    "Created batch size config for operation=" + config.getOperationType());

            log.info("Created batch size config: id={}", saved.getConfigId());
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            log.error("Error creating batch size config", e);
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Update batch size configuration
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody BatchSizeConfig updates) {
        return repository.findById(id)
                .map(existing -> {
                    String username = SecurityContextHolder.getContext().getAuthentication().getName();

                    // Validate
                    if (updates.getMaxBatchSize() != null && updates.getMaxBatchSize().compareTo(BigDecimal.ZERO) <= 0) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("message", "Max batch size must be greater than 0"));
                    }

                    // Update fields
                    if (updates.getMaterialId() != null) existing.setMaterialId(updates.getMaterialId());
                    if (updates.getOperationType() != null) existing.setOperationType(updates.getOperationType());
                    if (updates.getEquipmentType() != null) existing.setEquipmentType(updates.getEquipmentType());
                    if (updates.getProductSku() != null) existing.setProductSku(updates.getProductSku());
                    if (updates.getMinBatchSize() != null) existing.setMinBatchSize(updates.getMinBatchSize());
                    if (updates.getMaxBatchSize() != null) existing.setMaxBatchSize(updates.getMaxBatchSize());
                    if (updates.getPreferredBatchSize() != null) existing.setPreferredBatchSize(updates.getPreferredBatchSize());
                    if (updates.getUnit() != null) existing.setUnit(updates.getUnit());
                    if (updates.getAllowPartialBatch() != null) existing.setAllowPartialBatch(updates.getAllowPartialBatch());
                    if (updates.getIsActive() != null) existing.setIsActive(updates.getIsActive());
                    if (updates.getPriority() != null) existing.setPriority(updates.getPriority());

                    existing.setUpdatedBy(username);
                    existing.setUpdatedOn(LocalDateTime.now());

                    BatchSizeConfig saved = repository.save(existing);

                    auditService.logUpdate("BATCH_SIZE_CONFIG", id, "config",
                            null, "Updated batch size config");

                    log.info("Updated batch size config: id={}", id);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Delete batch size configuration (soft delete - set inactive)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return repository.findById(id)
                .map(config -> {
                    String username = SecurityContextHolder.getContext().getAuthentication().getName();

                    config.setIsActive(false);
                    config.setUpdatedBy(username);
                    config.setUpdatedOn(LocalDateTime.now());

                    repository.save(config);

                    auditService.logDelete("BATCH_SIZE_CONFIG", id,
                            "Deactivated batch size config");

                    log.info("Deactivated batch size config: id={}", id);
                    return ResponseEntity.ok(Map.of("message", "Batch size configuration deactivated"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * R-12: Check applicable batch size config for given context.
     * Returns the matching config (min/max/preferred) or empty if none found.
     * Used by the production confirmation UI to show inline warnings.
     */
    @GetMapping("/check")
    public ResponseEntity<?> checkConfig(
            @RequestParam(required = false) String operationType,
            @RequestParam(required = false) String materialId,
            @RequestParam(required = false) String productSku,
            @RequestParam(required = false) String equipmentType) {

        log.info("GET /api/batch-size-config/check - op={}, material={}, product={}, equipment={}",
                operationType, materialId, productSku, equipmentType);

        return batchSizeService.findApplicableConfig(operationType, materialId, productSku, equipmentType)
                .map(config -> ResponseEntity.ok(Map.of(
                        "found", true,
                        "configId", config.getConfigId(),
                        "minBatchSize", config.getMinBatchSize() != null ? config.getMinBatchSize() : 0,
                        "maxBatchSize", config.getMaxBatchSize(),
                        "preferredBatchSize", config.getPreferredBatchSize() != null ? config.getPreferredBatchSize() : config.getMaxBatchSize(),
                        "unit", config.getUnit() != null ? config.getUnit() : "T",
                        "allowPartialBatch", Boolean.TRUE.equals(config.getAllowPartialBatch())
                )))
                .orElse(ResponseEntity.ok(Map.of("found", false)));
    }

    /**
     * Calculate batch sizes for a given quantity
     */
    @GetMapping("/calculate")
    public ResponseEntity<BatchSizeService.BatchSizeResult> calculate(
            @RequestParam BigDecimal quantity,
            @RequestParam(required = false) String operationType,
            @RequestParam(required = false) String materialId,
            @RequestParam(required = false) String productSku,
            @RequestParam(required = false) String equipmentType) {

        BatchSizeService.BatchSizeResult result = batchSizeService.calculateBatchSizes(
                quantity, operationType, materialId, productSku, equipmentType);

        return ResponseEntity.ok(result);
    }

    /**
     * Preview batch calculation for UI
     */
    @PostMapping("/preview")
    public ResponseEntity<BatchSizeService.BatchSizeResult> preview(@RequestBody Map<String, Object> request) {
        BigDecimal quantity = new BigDecimal(request.get("quantity").toString());
        String operationType = (String) request.get("operationType");
        String materialId = (String) request.get("materialId");
        String productSku = (String) request.get("productSku");
        String equipmentType = (String) request.get("equipmentType");

        BatchSizeService.BatchSizeResult result = batchSizeService.calculateBatchSizes(
                quantity, operationType, materialId, productSku, equipmentType);

        return ResponseEntity.ok(result);
    }
}
