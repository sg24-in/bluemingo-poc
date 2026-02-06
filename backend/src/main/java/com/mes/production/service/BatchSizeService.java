package com.mes.production.service;

import com.mes.production.entity.BatchSizeConfig;
import com.mes.production.repository.BatchSizeConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Service for batch size calculations and multi-batch creation logic.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BatchSizeService {

    private final BatchSizeConfigRepository configRepository;

    /**
     * Result of batch size calculation
     */
    public record BatchSizeResult(
            List<BigDecimal> batchSizes,
            int batchCount,
            BigDecimal totalQuantity,
            boolean hasPartialBatch,
            BatchSizeConfig configUsed
    ) {}

    /**
     * Calculate how to split a production quantity into batches.
     *
     * @param totalQuantity Total quantity to produce
     * @param operationType Operation type (e.g., MELTING, CASTING)
     * @param materialId Optional material ID for specific config
     * @param productSku Optional product SKU for specific config
     * @param equipmentType Optional equipment type for specific config
     * @return BatchSizeResult with calculated batch sizes
     */
    public BatchSizeResult calculateBatchSizes(
            BigDecimal totalQuantity,
            String operationType,
            String materialId,
            String productSku,
            String equipmentType) {

        log.info("Calculating batch sizes for qty={}, op={}, material={}, product={}",
                totalQuantity, operationType, materialId, productSku);

        // Find applicable config
        Optional<BatchSizeConfig> configOpt = findApplicableConfig(
                operationType, materialId, productSku, equipmentType);

        if (configOpt.isEmpty()) {
            // No config found - return single batch
            log.info("No batch size config found, using single batch");
            return new BatchSizeResult(
                    List.of(totalQuantity),
                    1,
                    totalQuantity,
                    false,
                    null
            );
        }

        BatchSizeConfig config = configOpt.get();
        BigDecimal maxSize = config.getMaxBatchSize();
        BigDecimal preferredSize = config.getPreferredBatchSize() != null
                ? config.getPreferredBatchSize()
                : maxSize;

        // If total is less than or equal to max, single batch
        if (totalQuantity.compareTo(maxSize) <= 0) {
            log.info("Total qty {} <= max batch size {}, single batch", totalQuantity, maxSize);
            return new BatchSizeResult(
                    List.of(totalQuantity),
                    1,
                    totalQuantity,
                    false,
                    config
            );
        }

        // Calculate number of full batches using preferred size
        List<BigDecimal> batchSizes = new ArrayList<>();
        BigDecimal remaining = totalQuantity;

        // Create full batches at preferred size
        while (remaining.compareTo(preferredSize) >= 0) {
            batchSizes.add(preferredSize);
            remaining = remaining.subtract(preferredSize);
        }

        // Handle remainder
        boolean hasPartial = false;
        if (remaining.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal minSize = config.getMinBatchSize() != null
                    ? config.getMinBatchSize()
                    : BigDecimal.ZERO;

            if (remaining.compareTo(minSize) >= 0 && Boolean.TRUE.equals(config.getAllowPartialBatch())) {
                // Add partial batch
                batchSizes.add(remaining);
                hasPartial = true;
                remaining = BigDecimal.ZERO;
            } else if (remaining.compareTo(minSize) < 0 && !batchSizes.isEmpty()) {
                // Remainder too small - add to last batch (if within max)
                int lastIdx = batchSizes.size() - 1;
                BigDecimal lastBatch = batchSizes.get(lastIdx);
                BigDecimal newSize = lastBatch.add(remaining);
                if (newSize.compareTo(maxSize) <= 0) {
                    batchSizes.set(lastIdx, newSize);
                    remaining = BigDecimal.ZERO;
                } else {
                    // Create partial anyway
                    batchSizes.add(remaining);
                    hasPartial = true;
                    remaining = BigDecimal.ZERO;
                }
            } else {
                // First batch and below minimum - create anyway
                batchSizes.add(remaining);
                hasPartial = true;
                remaining = BigDecimal.ZERO;
            }
        }

        log.info("Calculated {} batches for qty {}: {}", batchSizes.size(), totalQuantity, batchSizes);

        return new BatchSizeResult(
                batchSizes,
                batchSizes.size(),
                totalQuantity,
                hasPartial,
                config
        );
    }

    /**
     * Find the most applicable batch size config for given parameters.
     */
    public Optional<BatchSizeConfig> findApplicableConfig(
            String operationType,
            String materialId,
            String productSku,
            String equipmentType) {

        List<BatchSizeConfig> configs = configRepository.findMatchingConfigs(
                productSku, materialId, operationType, equipmentType);

        if (configs.isEmpty()) {
            return Optional.empty();
        }

        // Return the most specific (first due to ORDER BY)
        return Optional.of(configs.get(0));
    }

    /**
     * Get all active configurations
     */
    public List<BatchSizeConfig> getAllActiveConfigs() {
        return configRepository.findByIsActiveTrue();
    }
}
