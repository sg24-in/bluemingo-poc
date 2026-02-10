package com.mes.production.service;

import com.mes.production.entity.BatchSizeConfig;
import com.mes.production.repository.BatchSizeConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BatchSizeServiceTest {

    @Mock
    private BatchSizeConfigRepository configRepository;

    @InjectMocks
    private BatchSizeService batchSizeService;

    private BatchSizeConfig defaultConfig;

    @BeforeEach
    void setUp() {
        defaultConfig = BatchSizeConfig.builder()
                .configId(1L)
                .operationType("MELTING")
                .maxBatchSize(new BigDecimal("100"))
                .preferredBatchSize(new BigDecimal("100"))
                .minBatchSize(new BigDecimal("10"))
                .allowPartialBatch(true)
                .isActive(true)
                .priority(1)
                .build();
    }

    // ========== calculateBatchSizes Tests ==========

    @Test
    @DisplayName("Should return single batch when no config is found")
    void should_returnSingleBatch_when_noConfigFound() {
        // Arrange
        when(configRepository.findMatchingConfigs(any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        BigDecimal totalQty = new BigDecimal("250");

        // Act
        BatchSizeService.BatchSizeResult result = batchSizeService.calculateBatchSizes(
                totalQty, "MELTING", null, null, null);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.batchCount());
        assertEquals(1, result.batchSizes().size());
        assertEquals(totalQty, result.batchSizes().get(0));
        assertEquals(totalQty, result.totalQuantity());
        assertFalse(result.hasPartialBatch());
        assertNull(result.configUsed());
    }

    @Test
    @DisplayName("Should return single batch when quantity is less than or equal to max batch size")
    void should_returnSingleBatch_when_quantityLessThanOrEqualMaxBatchSize() {
        // Arrange
        when(configRepository.findMatchingConfigs(any(), any(), eq("MELTING"), any()))
                .thenReturn(List.of(defaultConfig));

        BigDecimal totalQty = new BigDecimal("80");

        // Act
        BatchSizeService.BatchSizeResult result = batchSizeService.calculateBatchSizes(
                totalQty, "MELTING", null, null, null);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.batchCount());
        assertEquals(1, result.batchSizes().size());
        assertEquals(totalQty, result.batchSizes().get(0));
        assertFalse(result.hasPartialBatch());
        assertEquals(defaultConfig, result.configUsed());
    }

    @Test
    @DisplayName("Should return single batch when quantity equals max batch size exactly")
    void should_returnSingleBatch_when_quantityEqualsMaxBatchSize() {
        // Arrange
        when(configRepository.findMatchingConfigs(any(), any(), eq("MELTING"), any()))
                .thenReturn(List.of(defaultConfig));

        BigDecimal totalQty = new BigDecimal("100");

        // Act
        BatchSizeService.BatchSizeResult result = batchSizeService.calculateBatchSizes(
                totalQty, "MELTING", null, null, null);

        // Assert
        assertEquals(1, result.batchCount());
        assertEquals(new BigDecimal("100"), result.batchSizes().get(0));
        assertFalse(result.hasPartialBatch());
    }

    @Test
    @DisplayName("Should split into multiple batches when quantity exceeds max batch size")
    void should_splitIntoMultipleBatches_when_quantityExceedsMaxBatchSize() {
        // Arrange
        when(configRepository.findMatchingConfigs(any(), any(), eq("MELTING"), any()))
                .thenReturn(List.of(defaultConfig));

        BigDecimal totalQty = new BigDecimal("250");

        // Act
        BatchSizeService.BatchSizeResult result = batchSizeService.calculateBatchSizes(
                totalQty, "MELTING", null, null, null);

        // Assert
        assertNotNull(result);
        assertEquals(3, result.batchCount());
        assertEquals(3, result.batchSizes().size());
        // Two full batches of 100, one partial of 50
        assertEquals(new BigDecimal("100"), result.batchSizes().get(0));
        assertEquals(new BigDecimal("100"), result.batchSizes().get(1));
        assertEquals(new BigDecimal("50"), result.batchSizes().get(2));
        assertTrue(result.hasPartialBatch());
        assertEquals(totalQty, result.totalQuantity());
        assertEquals(defaultConfig, result.configUsed());
    }

    @Test
    @DisplayName("Should create partial batch when partial batch is allowed and remainder >= minBatchSize")
    void should_createPartialBatch_when_partialBatchAllowed() {
        // Arrange - partial allowed, remainder 30 >= min 10
        BatchSizeConfig config = BatchSizeConfig.builder()
                .configId(2L)
                .maxBatchSize(new BigDecimal("100"))
                .preferredBatchSize(new BigDecimal("100"))
                .minBatchSize(new BigDecimal("10"))
                .allowPartialBatch(true)
                .isActive(true)
                .build();

        when(configRepository.findMatchingConfigs(any(), any(), eq("CASTING"), any()))
                .thenReturn(List.of(config));

        BigDecimal totalQty = new BigDecimal("230");

        // Act
        BatchSizeService.BatchSizeResult result = batchSizeService.calculateBatchSizes(
                totalQty, "CASTING", null, null, null);

        // Assert
        assertEquals(3, result.batchCount());
        assertEquals(new BigDecimal("100"), result.batchSizes().get(0));
        assertEquals(new BigDecimal("100"), result.batchSizes().get(1));
        assertEquals(new BigDecimal("30"), result.batchSizes().get(2));
        assertTrue(result.hasPartialBatch());
    }

    @Test
    @DisplayName("Should add remainder to last batch when partial batch NOT allowed and remainder below min")
    void should_addRemainderToLastBatch_when_partialBatchNotAllowedAndRemainderBelowMin() {
        // Arrange - partial NOT allowed, remainder 5 < min 10, last batch + 5 = 105 > max 100
        // So it creates a partial anyway since it doesn't fit in last batch
        BatchSizeConfig config = BatchSizeConfig.builder()
                .configId(3L)
                .maxBatchSize(new BigDecimal("100"))
                .preferredBatchSize(new BigDecimal("100"))
                .minBatchSize(new BigDecimal("10"))
                .allowPartialBatch(false)
                .isActive(true)
                .build();

        when(configRepository.findMatchingConfigs(any(), any(), eq("ROLLING"), any()))
                .thenReturn(List.of(config));

        // 205 = 2 x 100 + 5 (remainder). 5 < 10 (min), last batch 100 + 5 = 105 > 100 (max)
        // Falls through to create partial anyway
        BigDecimal totalQty = new BigDecimal("205");

        // Act
        BatchSizeService.BatchSizeResult result = batchSizeService.calculateBatchSizes(
                totalQty, "ROLLING", null, null, null);

        // Assert
        assertEquals(3, result.batchCount());
        assertEquals(new BigDecimal("100"), result.batchSizes().get(0));
        assertEquals(new BigDecimal("100"), result.batchSizes().get(1));
        assertEquals(new BigDecimal("5"), result.batchSizes().get(2));
        assertTrue(result.hasPartialBatch());
    }

    @Test
    @DisplayName("Should absorb remainder into last batch when below min and fits within max")
    void should_absorbRemainderIntoLastBatch_when_belowMinAndFitsWithinMax() {
        // Arrange - remainder 5 < min 10, last batch 80 + 5 = 85 <= max 100
        BatchSizeConfig config = BatchSizeConfig.builder()
                .configId(4L)
                .maxBatchSize(new BigDecimal("100"))
                .preferredBatchSize(new BigDecimal("80"))
                .minBatchSize(new BigDecimal("10"))
                .allowPartialBatch(false)
                .isActive(true)
                .build();

        when(configRepository.findMatchingConfigs(any(), any(), eq("MELTING"), any()))
                .thenReturn(List.of(config));

        // 165 = 2 x 80 + 5 (remainder). 5 < 10 (min), last batch 80 + 5 = 85 <= 100 (max)
        BigDecimal totalQty = new BigDecimal("165");

        // Act
        BatchSizeService.BatchSizeResult result = batchSizeService.calculateBatchSizes(
                totalQty, "MELTING", null, null, null);

        // Assert
        assertEquals(2, result.batchCount());
        assertEquals(new BigDecimal("80"), result.batchSizes().get(0));
        assertEquals(new BigDecimal("85"), result.batchSizes().get(1)); // 80 + 5 absorbed
        assertFalse(result.hasPartialBatch());
    }

    @Test
    @DisplayName("Should use preferred batch size for splitting when different from max")
    void should_usePreferredBatchSize_when_differentFromMax() {
        // Arrange
        BatchSizeConfig config = BatchSizeConfig.builder()
                .configId(5L)
                .maxBatchSize(new BigDecimal("120"))
                .preferredBatchSize(new BigDecimal("50"))
                .minBatchSize(new BigDecimal("5"))
                .allowPartialBatch(true)
                .isActive(true)
                .build();

        when(configRepository.findMatchingConfigs(any(), any(), eq("CASTING"), any()))
                .thenReturn(List.of(config));

        BigDecimal totalQty = new BigDecimal("130");

        // Act
        BatchSizeService.BatchSizeResult result = batchSizeService.calculateBatchSizes(
                totalQty, "CASTING", null, null, null);

        // Assert
        // 130 / 50 = 2 full batches of 50, remainder 30 >= min 5, partial allowed
        assertEquals(3, result.batchCount());
        assertEquals(new BigDecimal("50"), result.batchSizes().get(0));
        assertEquals(new BigDecimal("50"), result.batchSizes().get(1));
        assertEquals(new BigDecimal("30"), result.batchSizes().get(2));
        assertTrue(result.hasPartialBatch());
    }

    @Test
    @DisplayName("Should use max batch size as preferred when preferred is null")
    void should_useMaxAsFallbackPreferred_when_preferredIsNull() {
        // Arrange
        BatchSizeConfig config = BatchSizeConfig.builder()
                .configId(6L)
                .maxBatchSize(new BigDecimal("100"))
                .preferredBatchSize(null) // null preferred
                .minBatchSize(new BigDecimal("10"))
                .allowPartialBatch(true)
                .isActive(true)
                .build();

        when(configRepository.findMatchingConfigs(any(), any(), eq("MELTING"), any()))
                .thenReturn(List.of(config));

        BigDecimal totalQty = new BigDecimal("250");

        // Act
        BatchSizeService.BatchSizeResult result = batchSizeService.calculateBatchSizes(
                totalQty, "MELTING", null, null, null);

        // Assert - should use maxBatchSize (100) as preferred
        assertEquals(3, result.batchCount());
        assertEquals(new BigDecimal("100"), result.batchSizes().get(0));
        assertEquals(new BigDecimal("100"), result.batchSizes().get(1));
        assertEquals(new BigDecimal("50"), result.batchSizes().get(2));
    }

    // ========== findApplicableConfig Tests ==========

    @Test
    @DisplayName("Should return empty when no configs match")
    void should_returnEmpty_when_noConfigsMatch() {
        // Arrange
        when(configRepository.findMatchingConfigs(any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        // Act
        Optional<BatchSizeConfig> result = batchSizeService.findApplicableConfig(
                "UNKNOWN_OP", null, null, null);

        // Assert
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should return most specific config (first result from repository)")
    void should_returnMostSpecificConfig_when_multipleConfigsMatch() {
        // Arrange
        BatchSizeConfig specificConfig = BatchSizeConfig.builder()
                .configId(10L)
                .operationType("MELTING")
                .productSku("STEEL-001")
                .maxBatchSize(new BigDecimal("50"))
                .priority(10)
                .build();
        BatchSizeConfig genericConfig = BatchSizeConfig.builder()
                .configId(11L)
                .operationType("MELTING")
                .maxBatchSize(new BigDecimal("100"))
                .priority(1)
                .build();

        // Repository returns ordered by specificity (most specific first)
        when(configRepository.findMatchingConfigs(eq("STEEL-001"), any(), eq("MELTING"), any()))
                .thenReturn(List.of(specificConfig, genericConfig));

        // Act
        Optional<BatchSizeConfig> result = batchSizeService.findApplicableConfig(
                "MELTING", null, "STEEL-001", null);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(10L, result.get().getConfigId());
        assertEquals(new BigDecimal("50"), result.get().getMaxBatchSize());
    }

    // ========== getAllActiveConfigs Tests ==========

    @Test
    @DisplayName("Should delegate to repository for all active configs")
    void should_delegateToRepository_when_getAllActiveConfigsCalled() {
        // Arrange
        List<BatchSizeConfig> activeConfigs = List.of(defaultConfig);
        when(configRepository.findByIsActiveTrue()).thenReturn(activeConfigs);

        // Act
        List<BatchSizeConfig> result = batchSizeService.getAllActiveConfigs();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(defaultConfig, result.get(0));
        verify(configRepository).findByIsActiveTrue();
    }
}
