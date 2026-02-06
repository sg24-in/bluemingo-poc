package com.mes.production.service;

import com.mes.production.dto.DashboardDTO;
import com.mes.production.entity.AuditTrail;
import com.mes.production.entity.Batch;
import com.mes.production.entity.Process;
import com.mes.production.entity.ProductionConfirmation;
import com.mes.production.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final OrderRepository orderRepository;
    private final OperationRepository operationRepository;
    private final ProcessRepository processRepository;
    private final HoldRecordRepository holdRecordRepository;
    private final ProductionConfirmationRepository confirmationRepository;
    private final BatchRepository batchRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public DashboardDTO.Summary getDashboardSummary() {
        log.info("Getting dashboard summary");

        // Get counts
        Long totalOrders = orderRepository.count();
        Long ordersInProgress = orderRepository.countByStatusIn(List.of("CREATED", "IN_PROGRESS"));
        Long operationsReady = operationRepository.countByStatus("READY");
        Long operationsInProgress = operationRepository.countByStatus("IN_PROGRESS");
        Long activeHolds = holdRecordRepository.countByStatus("ACTIVE");

        // Get today's confirmations
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        Long todayConfirmations = confirmationRepository.countByCreatedOnAfter(startOfDay);

        // Get quality pending processes count
        Long qualityPendingProcesses = (long) processRepository.findByStatus(Process.STATUS_QUALITY_PENDING).size();

        // Get batches pending approval (QUALITY_PENDING status)
        Long batchesPendingApproval = batchRepository.countByStatus(Batch.STATUS_QUALITY_PENDING);

        // Get recent activity
        List<DashboardDTO.RecentActivity> recentActivity = getRecentActivity(5);

        // Get recent audit activity
        List<DashboardDTO.AuditActivity> auditActivity = getRecentAuditActivity(10);

        return DashboardDTO.Summary.builder()
                .totalOrders(totalOrders)
                .ordersInProgress(ordersInProgress)
                .operationsReady(operationsReady)
                .operationsInProgress(operationsInProgress)
                .activeHolds(activeHolds)
                .todayConfirmations(todayConfirmations)
                .qualityPendingProcesses(qualityPendingProcesses)
                .batchesPendingApproval(batchesPendingApproval)
                .recentActivity(recentActivity)
                .auditActivity(auditActivity)
                .build();
    }

    @Transactional(readOnly = true)
    public List<DashboardDTO.AuditActivity> getRecentAuditActivity(int limit) {
        List<AuditTrail> auditEntries = auditService.getRecentActivity(limit);

        return auditEntries.stream()
                .map(this::convertToAuditActivity)
                .collect(Collectors.toList());
    }

    private DashboardDTO.AuditActivity convertToAuditActivity(AuditTrail audit) {
        String description = buildAuditDescription(audit);

        return DashboardDTO.AuditActivity.builder()
                .auditId(audit.getAuditId())
                .entityType(audit.getEntityType())
                .entityId(audit.getEntityId())
                .action(audit.getAction())
                .description(description)
                .changedBy(audit.getChangedBy())
                .timestamp(audit.getTimestamp())
                .build();
    }

    private String buildAuditDescription(AuditTrail audit) {
        String action = audit.getAction();
        String entityType = audit.getEntityType();

        switch (action) {
            case "CREATE":
                return String.format("Created %s #%d", formatEntityType(entityType), audit.getEntityId());
            case "STATUS_CHANGE":
                return String.format("%s #%d status: %s → %s",
                        formatEntityType(entityType), audit.getEntityId(),
                        audit.getOldValue(), audit.getNewValue());
            case "CONSUME":
                return String.format("Consumed %s #%d", formatEntityType(entityType), audit.getEntityId());
            case "PRODUCE":
                return String.format("Produced %s #%d", formatEntityType(entityType), audit.getEntityId());
            case "HOLD":
                return String.format("Put %s #%d on hold", formatEntityType(entityType), audit.getEntityId());
            case "RELEASE":
                return String.format("Released %s #%d from hold", formatEntityType(entityType), audit.getEntityId());
            default:
                return String.format("%s on %s #%d", action, formatEntityType(entityType), audit.getEntityId());
        }
    }

    private String formatEntityType(String entityType) {
        if (entityType == null) return "";
        return entityType.replace("_", " ").toLowerCase();
    }

    @Transactional(readOnly = true)
    public List<DashboardDTO.RecentActivity> getRecentActivity(int limit) {
        List<ProductionConfirmation> confirmations = confirmationRepository.findRecentConfirmations(PageRequest.of(0, limit));

        return confirmations.stream()
                .map(this::convertToRecentActivity)
                .collect(Collectors.toList());
    }

    private DashboardDTO.RecentActivity convertToRecentActivity(ProductionConfirmation confirmation) {
        String productSku = "";
        if (confirmation.getOperation() != null &&
            confirmation.getOperation().getProcess() != null &&
            confirmation.getOperation().getProcess().getOrderLineItem() != null) {
            productSku = confirmation.getOperation().getProcess().getOrderLineItem().getProductSku();
        }

        return DashboardDTO.RecentActivity.builder()
                .confirmationId(confirmation.getConfirmationId())
                .operationName(confirmation.getOperation() != null ? confirmation.getOperation().getOperationName() : "")
                .productSku(productSku)
                .producedQty(confirmation.getProducedQty())
                .confirmedAt(confirmation.getCreatedOn())
                .build();
    }
}
