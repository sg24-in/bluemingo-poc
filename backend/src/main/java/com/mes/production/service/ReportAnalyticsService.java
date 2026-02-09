package com.mes.production.service;

import com.mes.production.dto.ReportAnalyticsDTO;
import com.mes.production.entity.HoldRecord;
import com.mes.production.entity.Inventory;
import com.mes.production.entity.Order;
import com.mes.production.entity.ProductionConfirmation;
import com.mes.production.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for generating report analytics across production, orders,
 * inventory, and holds. Aggregates data from multiple repositories
 * and computes KPIs for the reporting dashboard.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReportAnalyticsService {

    private final ProductionConfirmationRepository confirmationRepository;
    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;
    private final HoldRecordRepository holdRecordRepository;
    private final OperationRepository operationRepository;

    /**
     * Get production summary for a date range.
     * Returns total produced, total scrap, yield %, avg cycle time, confirmation count.
     */
    @Transactional(readOnly = true)
    public ReportAnalyticsDTO.ProductionSummary getProductionSummary(LocalDate startDate, LocalDate endDate) {
        log.info("Getting production summary from {} to {}", startDate, endDate);

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.plusDays(1).atStartOfDay();

        List<ProductionConfirmation> confirmations = confirmationRepository.findByDateRange(startDateTime, endDateTime);

        BigDecimal totalProduced = BigDecimal.ZERO;
        BigDecimal totalScrap = BigDecimal.ZERO;
        long totalCycleTimeMinutes = 0;
        int cycleTimeCount = 0;

        for (ProductionConfirmation pc : confirmations) {
            if (pc.getProducedQty() != null) {
                totalProduced = totalProduced.add(pc.getProducedQty());
            }
            if (pc.getScrapQty() != null) {
                totalScrap = totalScrap.add(pc.getScrapQty());
            }
            if (pc.getStartTime() != null && pc.getEndTime() != null) {
                long minutes = Duration.between(pc.getStartTime(), pc.getEndTime()).toMinutes();
                totalCycleTimeMinutes += minutes;
                cycleTimeCount++;
            }
        }

        BigDecimal totalInput = totalProduced.add(totalScrap);
        BigDecimal yieldPercentage = BigDecimal.ZERO;
        if (totalInput.compareTo(BigDecimal.ZERO) > 0) {
            yieldPercentage = totalProduced
                    .multiply(BigDecimal.valueOf(100))
                    .divide(totalInput, 2, RoundingMode.HALF_UP);
        }

        BigDecimal avgCycleTime = BigDecimal.ZERO;
        if (cycleTimeCount > 0) {
            avgCycleTime = BigDecimal.valueOf(totalCycleTimeMinutes)
                    .divide(BigDecimal.valueOf(cycleTimeCount), 2, RoundingMode.HALF_UP);
        }

        return ReportAnalyticsDTO.ProductionSummary.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalProduced(totalProduced)
                .totalScrap(totalScrap)
                .yieldPercentage(yieldPercentage)
                .avgCycleTimeMinutes(avgCycleTime)
                .confirmationCount((long) confirmations.size())
                .build();
    }

    /**
     * Get production grouped by operation type for a date range.
     */
    @Transactional(readOnly = true)
    public ReportAnalyticsDTO.ProductionByOperation getProductionByOperation(LocalDate startDate, LocalDate endDate) {
        log.info("Getting production by operation from {} to {}", startDate, endDate);

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.plusDays(1).atStartOfDay();

        List<ProductionConfirmation> confirmations = confirmationRepository.findByDateRange(startDateTime, endDateTime);

        // Group by operation type
        Map<String, List<ProductionConfirmation>> grouped = confirmations.stream()
                .collect(Collectors.groupingBy(pc -> {
                    if (pc.getOperation() != null && pc.getOperation().getOperationType() != null) {
                        return pc.getOperation().getOperationType();
                    }
                    return "UNKNOWN";
                }));

        List<ReportAnalyticsDTO.OperationProductionEntry> entries = new ArrayList<>();
        for (Map.Entry<String, List<ProductionConfirmation>> entry : grouped.entrySet()) {
            String opType = entry.getKey();
            List<ProductionConfirmation> pcs = entry.getValue();

            BigDecimal produced = pcs.stream()
                    .map(pc -> pc.getProducedQty() != null ? pc.getProducedQty() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal scrap = pcs.stream()
                    .map(pc -> pc.getScrapQty() != null ? pc.getScrapQty() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalInput = produced.add(scrap);
            BigDecimal yieldPct = BigDecimal.ZERO;
            if (totalInput.compareTo(BigDecimal.ZERO) > 0) {
                yieldPct = produced.multiply(BigDecimal.valueOf(100))
                        .divide(totalInput, 2, RoundingMode.HALF_UP);
            }

            entries.add(ReportAnalyticsDTO.OperationProductionEntry.builder()
                    .operationType(opType)
                    .confirmationCount((long) pcs.size())
                    .totalProduced(produced)
                    .totalScrap(scrap)
                    .yieldPercentage(yieldPct)
                    .build());
        }

        // Sort by total produced descending
        entries.sort((a, b) -> b.getTotalProduced().compareTo(a.getTotalProduced()));

        return ReportAnalyticsDTO.ProductionByOperation.builder()
                .startDate(startDate)
                .endDate(endDate)
                .entries(entries)
                .build();
    }

    /**
     * Get scrap analysis for a date range.
     * Returns scrap grouped by product and by operation type.
     */
    @Transactional(readOnly = true)
    public ReportAnalyticsDTO.ScrapAnalysis getScrapAnalysis(LocalDate startDate, LocalDate endDate) {
        log.info("Getting scrap analysis from {} to {}", startDate, endDate);

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.plusDays(1).atStartOfDay();

        List<ProductionConfirmation> confirmations = confirmationRepository.findByDateRange(startDateTime, endDateTime);

        BigDecimal totalScrap = BigDecimal.ZERO;

        // --- Scrap by product ---
        Map<String, BigDecimal[]> productMap = new LinkedHashMap<>(); // sku -> [scrap, produced]
        Map<String, String> productNames = new HashMap<>();

        for (ProductionConfirmation pc : confirmations) {
            BigDecimal scrap = pc.getScrapQty() != null ? pc.getScrapQty() : BigDecimal.ZERO;
            BigDecimal produced = pc.getProducedQty() != null ? pc.getProducedQty() : BigDecimal.ZERO;
            totalScrap = totalScrap.add(scrap);

            String sku = "UNKNOWN";
            String name = "Unknown Product";
            if (pc.getOperation() != null && pc.getOperation().getOrderLineItem() != null) {
                sku = pc.getOperation().getOrderLineItem().getProductSku();
                name = pc.getOperation().getOrderLineItem().getProductName() != null
                        ? pc.getOperation().getOrderLineItem().getProductName() : sku;
            }

            productMap.computeIfAbsent(sku, k -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            productMap.get(sku)[0] = productMap.get(sku)[0].add(scrap);
            productMap.get(sku)[1] = productMap.get(sku)[1].add(produced);
            productNames.putIfAbsent(sku, name);
        }

        List<ReportAnalyticsDTO.ScrapByProductEntry> scrapByProduct = new ArrayList<>();
        for (Map.Entry<String, BigDecimal[]> entry : productMap.entrySet()) {
            BigDecimal scrap = entry.getValue()[0];
            BigDecimal produced = entry.getValue()[1];
            BigDecimal total = produced.add(scrap);
            BigDecimal pct = BigDecimal.ZERO;
            if (total.compareTo(BigDecimal.ZERO) > 0) {
                pct = scrap.multiply(BigDecimal.valueOf(100)).divide(total, 2, RoundingMode.HALF_UP);
            }
            scrapByProduct.add(ReportAnalyticsDTO.ScrapByProductEntry.builder()
                    .productSku(entry.getKey())
                    .productName(productNames.get(entry.getKey()))
                    .scrapQty(scrap)
                    .producedQty(produced)
                    .scrapPercentage(pct)
                    .build());
        }
        scrapByProduct.sort((a, b) -> b.getScrapQty().compareTo(a.getScrapQty()));

        // --- Scrap by operation type ---
        Map<String, BigDecimal[]> opMap = new LinkedHashMap<>(); // type -> [scrap, produced]
        for (ProductionConfirmation pc : confirmations) {
            BigDecimal scrap = pc.getScrapQty() != null ? pc.getScrapQty() : BigDecimal.ZERO;
            BigDecimal produced = pc.getProducedQty() != null ? pc.getProducedQty() : BigDecimal.ZERO;

            String opType = "UNKNOWN";
            if (pc.getOperation() != null && pc.getOperation().getOperationType() != null) {
                opType = pc.getOperation().getOperationType();
            }

            opMap.computeIfAbsent(opType, k -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            opMap.get(opType)[0] = opMap.get(opType)[0].add(scrap);
            opMap.get(opType)[1] = opMap.get(opType)[1].add(produced);
        }

        List<ReportAnalyticsDTO.ScrapByOperationEntry> scrapByOperation = new ArrayList<>();
        for (Map.Entry<String, BigDecimal[]> entry : opMap.entrySet()) {
            BigDecimal scrap = entry.getValue()[0];
            BigDecimal produced = entry.getValue()[1];
            BigDecimal total = produced.add(scrap);
            BigDecimal pct = BigDecimal.ZERO;
            if (total.compareTo(BigDecimal.ZERO) > 0) {
                pct = scrap.multiply(BigDecimal.valueOf(100)).divide(total, 2, RoundingMode.HALF_UP);
            }
            scrapByOperation.add(ReportAnalyticsDTO.ScrapByOperationEntry.builder()
                    .operationType(entry.getKey())
                    .scrapQty(scrap)
                    .producedQty(produced)
                    .scrapPercentage(pct)
                    .build());
        }
        scrapByOperation.sort((a, b) -> b.getScrapQty().compareTo(a.getScrapQty()));

        return ReportAnalyticsDTO.ScrapAnalysis.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalScrap(totalScrap)
                .scrapByProduct(scrapByProduct)
                .scrapByOperation(scrapByOperation)
                .build();
    }

    /**
     * Get order fulfillment metrics.
     * Returns completion %, in-progress count, overdue count.
     */
    @Transactional(readOnly = true)
    public ReportAnalyticsDTO.OrderFulfillment getOrderFulfillment() {
        log.info("Getting order fulfillment metrics");

        Long totalOrders = orderRepository.count();
        Long completedOrders = orderRepository.countByStatus("COMPLETED");
        Long inProgressOrders = orderRepository.countByStatusIn(List.of("CREATED", "IN_PROGRESS"));

        // Overdue: orders with line items whose delivery date has passed and order not completed
        List<Order> activeOrders = orderRepository.findActiveOrders();
        long overdueCount = activeOrders.stream()
                .filter(order -> {
                    if (order.getLineItems() == null) return false;
                    return order.getLineItems().stream().anyMatch(li ->
                            li.getDeliveryDate() != null && li.getDeliveryDate().isBefore(LocalDate.now()));
                })
                .count();

        BigDecimal completionPct = BigDecimal.ZERO;
        if (totalOrders != null && totalOrders > 0) {
            completionPct = BigDecimal.valueOf(completedOrders != null ? completedOrders : 0)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP);
        }

        return ReportAnalyticsDTO.OrderFulfillment.builder()
                .totalOrders(totalOrders != null ? totalOrders : 0L)
                .completedOrders(completedOrders != null ? completedOrders : 0L)
                .inProgressOrders(inProgressOrders != null ? inProgressOrders : 0L)
                .overdueOrders(overdueCount)
                .completionPercentage(completionPct)
                .build();
    }

    /**
     * Get inventory balance grouped by type and state.
     */
    @Transactional(readOnly = true)
    public ReportAnalyticsDTO.InventoryBalance getInventoryBalance() {
        log.info("Getting inventory balance");

        List<Inventory> allInventory = inventoryRepository.findAll();

        BigDecimal totalQty = BigDecimal.ZERO;

        // Group by type
        Map<String, List<Inventory>> byType = allInventory.stream()
                .collect(Collectors.groupingBy(inv ->
                        inv.getInventoryType() != null ? inv.getInventoryType() : "UNKNOWN"));

        List<ReportAnalyticsDTO.InventoryByTypeEntry> typeEntries = new ArrayList<>();
        for (Map.Entry<String, List<Inventory>> entry : byType.entrySet()) {
            BigDecimal qty = entry.getValue().stream()
                    .map(inv -> inv.getQuantity() != null ? inv.getQuantity() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            totalQty = totalQty.add(qty);
            typeEntries.add(ReportAnalyticsDTO.InventoryByTypeEntry.builder()
                    .inventoryType(entry.getKey())
                    .itemCount((long) entry.getValue().size())
                    .totalQuantity(qty)
                    .build());
        }
        typeEntries.sort((a, b) -> b.getTotalQuantity().compareTo(a.getTotalQuantity()));

        // Group by state
        Map<String, List<Inventory>> byState = allInventory.stream()
                .collect(Collectors.groupingBy(inv ->
                        inv.getState() != null ? inv.getState() : "UNKNOWN"));

        List<ReportAnalyticsDTO.InventoryByStateEntry> stateEntries = new ArrayList<>();
        for (Map.Entry<String, List<Inventory>> entry : byState.entrySet()) {
            BigDecimal qty = entry.getValue().stream()
                    .map(inv -> inv.getQuantity() != null ? inv.getQuantity() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            stateEntries.add(ReportAnalyticsDTO.InventoryByStateEntry.builder()
                    .state(entry.getKey())
                    .itemCount((long) entry.getValue().size())
                    .totalQuantity(qty)
                    .build());
        }
        stateEntries.sort((a, b) -> b.getTotalQuantity().compareTo(a.getTotalQuantity()));

        return ReportAnalyticsDTO.InventoryBalance.builder()
                .byType(typeEntries)
                .byState(stateEntries)
                .totalQuantity(totalQty)
                .build();
    }

    /**
     * Get operation cycle times for a date range.
     * Returns avg, min, max cycle times grouped by operation type.
     */
    @Transactional(readOnly = true)
    public ReportAnalyticsDTO.OperationCycleTimes getOperationCycleTimes(LocalDate startDate, LocalDate endDate) {
        log.info("Getting operation cycle times from {} to {}", startDate, endDate);

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.plusDays(1).atStartOfDay();

        List<ProductionConfirmation> confirmations = confirmationRepository.findByDateRange(startDateTime, endDateTime);

        // Group by operation type, compute cycle times
        Map<String, List<Long>> cycleTimesByType = new LinkedHashMap<>();

        for (ProductionConfirmation pc : confirmations) {
            if (pc.getStartTime() == null || pc.getEndTime() == null) continue;

            String opType = "UNKNOWN";
            if (pc.getOperation() != null && pc.getOperation().getOperationType() != null) {
                opType = pc.getOperation().getOperationType();
            }

            long minutes = Duration.between(pc.getStartTime(), pc.getEndTime()).toMinutes();
            cycleTimesByType.computeIfAbsent(opType, k -> new ArrayList<>()).add(minutes);
        }

        List<ReportAnalyticsDTO.CycleTimeEntry> entries = new ArrayList<>();
        for (Map.Entry<String, List<Long>> entry : cycleTimesByType.entrySet()) {
            List<Long> times = entry.getValue();
            long sum = times.stream().mapToLong(Long::longValue).sum();
            long min = times.stream().mapToLong(Long::longValue).min().orElse(0);
            long max = times.stream().mapToLong(Long::longValue).max().orElse(0);
            BigDecimal avg = BigDecimal.valueOf(sum)
                    .divide(BigDecimal.valueOf(times.size()), 2, RoundingMode.HALF_UP);

            entries.add(ReportAnalyticsDTO.CycleTimeEntry.builder()
                    .operationType(entry.getKey())
                    .confirmationCount((long) times.size())
                    .avgCycleTimeMinutes(avg)
                    .minCycleTimeMinutes(BigDecimal.valueOf(min))
                    .maxCycleTimeMinutes(BigDecimal.valueOf(max))
                    .build());
        }
        entries.sort((a, b) -> b.getAvgCycleTimeMinutes().compareTo(a.getAvgCycleTimeMinutes()));

        return ReportAnalyticsDTO.OperationCycleTimes.builder()
                .startDate(startDate)
                .endDate(endDate)
                .entries(entries)
                .build();
    }

    /**
     * Get hold analysis.
     * Returns hold counts by entity type and top reasons.
     */
    @Transactional(readOnly = true)
    public ReportAnalyticsDTO.HoldAnalysis getHoldAnalysis() {
        log.info("Getting hold analysis");

        List<HoldRecord> allHolds = holdRecordRepository.findAll();

        long activeCount = allHolds.stream()
                .filter(h -> HoldRecord.STATUS_ACTIVE.equals(h.getStatus()))
                .count();
        long releasedCount = allHolds.stream()
                .filter(h -> HoldRecord.STATUS_RELEASED.equals(h.getStatus()))
                .count();

        // Group by entity type
        Map<String, List<HoldRecord>> byEntityType = allHolds.stream()
                .collect(Collectors.groupingBy(h ->
                        h.getEntityType() != null ? h.getEntityType() : "UNKNOWN"));

        List<ReportAnalyticsDTO.HoldByEntityTypeEntry> entityTypeEntries = new ArrayList<>();
        for (Map.Entry<String, List<HoldRecord>> entry : byEntityType.entrySet()) {
            List<HoldRecord> holds = entry.getValue();
            long active = holds.stream().filter(h -> HoldRecord.STATUS_ACTIVE.equals(h.getStatus())).count();
            long released = holds.stream().filter(h -> HoldRecord.STATUS_RELEASED.equals(h.getStatus())).count();
            entityTypeEntries.add(ReportAnalyticsDTO.HoldByEntityTypeEntry.builder()
                    .entityType(entry.getKey())
                    .activeCount(active)
                    .releasedCount(released)
                    .totalCount((long) holds.size())
                    .build());
        }
        entityTypeEntries.sort((a, b) -> b.getTotalCount().compareTo(a.getTotalCount()));

        // Top reasons (across all holds)
        Map<String, Long> reasonCounts = allHolds.stream()
                .filter(h -> h.getReason() != null && !h.getReason().isBlank())
                .collect(Collectors.groupingBy(HoldRecord::getReason, Collectors.counting()));

        List<ReportAnalyticsDTO.HoldReasonEntry> topReasons = reasonCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .map(entry -> ReportAnalyticsDTO.HoldReasonEntry.builder()
                        .reason(entry.getKey())
                        .count(entry.getValue())
                        .build())
                .collect(Collectors.toList());

        return ReportAnalyticsDTO.HoldAnalysis.builder()
                .totalActiveHolds(activeCount)
                .totalReleasedHolds(releasedCount)
                .byEntityType(entityTypeEntries)
                .topReasons(topReasons)
                .build();
    }

    /**
     * Get executive dashboard combining all KPIs in a single call.
     * Uses the last 30 days for time-ranged metrics.
     */
    @Transactional(readOnly = true)
    public ReportAnalyticsDTO.ExecutiveDashboard getExecutiveDashboard() {
        log.info("Getting executive dashboard");

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(30);

        ReportAnalyticsDTO.ProductionSummary productionSummary = getProductionSummary(startDate, endDate);
        ReportAnalyticsDTO.OrderFulfillment orderFulfillment = getOrderFulfillment();
        ReportAnalyticsDTO.InventoryBalance inventoryBalance = getInventoryBalance();
        ReportAnalyticsDTO.HoldAnalysis holdAnalysis = getHoldAnalysis();

        ReportAnalyticsDTO.OperationCycleTimes cycleTimes = getOperationCycleTimes(startDate, endDate);
        List<ReportAnalyticsDTO.CycleTimeEntry> topCycleTimes = cycleTimes.getEntries() != null
                ? cycleTimes.getEntries().stream().limit(5).collect(Collectors.toList())
                : List.of();

        return ReportAnalyticsDTO.ExecutiveDashboard.builder()
                .productionSummary(productionSummary)
                .orderFulfillment(orderFulfillment)
                .inventoryBalance(inventoryBalance)
                .holdAnalysis(holdAnalysis)
                .topCycleTimes(topCycleTimes)
                .build();
    }
}
