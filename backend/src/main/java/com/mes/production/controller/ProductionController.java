package com.mes.production.controller;

import com.mes.production.dto.ProductionConfirmationDTO;
import com.mes.production.service.ProductionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/production")
@RequiredArgsConstructor
@Slf4j
public class ProductionController {

    private final ProductionService productionService;

    /**
     * Confirm production for an operation
     */
    @PostMapping("/confirm")
    public ResponseEntity<ProductionConfirmationDTO.Response> confirmProduction(
            @Valid @RequestBody ProductionConfirmationDTO.Request request) {
        log.info("POST /api/production/confirm for operation: {}", request.getOperationId());

        ProductionConfirmationDTO.Response response = productionService.confirmProduction(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Get operation details for production confirmation
     */
    @GetMapping("/operations/{operationId}")
    public ResponseEntity<?> getOperationDetails(@PathVariable Long operationId) {
        log.info("GET /api/production/operations/{}", operationId);

        var operation = productionService.getOperationDetails(operationId);

        // Per MES Consolidated Specification: Operation has OrderLineItem (runtime ref)
        java.util.Map<String, Object> processInfo = new java.util.LinkedHashMap<>();
        if (operation.getProcess() != null) {
            processInfo.put("processId", operation.getProcess().getProcessId());
            processInfo.put("processName", operation.getProcess().getProcessName());
        }

        java.util.Map<String, Object> orderInfo = new java.util.LinkedHashMap<>();
        if (operation.getOrderLineItem() != null) {
            if (operation.getOrderLineItem().getOrder() != null) {
                orderInfo.put("orderId", operation.getOrderLineItem().getOrder().getOrderId());
            }
            orderInfo.put("productSku", operation.getOrderLineItem().getProductSku());
            orderInfo.put("productName", operation.getOrderLineItem().getProductName());
            orderInfo.put("quantity", operation.getOrderLineItem().getQuantity());
        }

        return ResponseEntity.ok(Map.of(
                "operationId", operation.getOperationId(),
                "operationName", operation.getOperationName(),
                "operationCode", operation.getOperationCode() != null ? operation.getOperationCode() : "",
                "operationType", operation.getOperationType() != null ? operation.getOperationType() : "",
                "status", operation.getStatus(),
                "process", processInfo,
                "order", orderInfo
        ));
    }

    /**
     * Reject a production confirmation
     */
    @PostMapping("/confirmations/{confirmationId}/reject")
    public ResponseEntity<ProductionConfirmationDTO.StatusUpdateResponse> rejectConfirmation(
            @PathVariable Long confirmationId,
            @RequestBody java.util.Map<String, String> body) {
        log.info("POST /api/production/confirmations/{}/reject", confirmationId);

        ProductionConfirmationDTO.RejectionRequest request = ProductionConfirmationDTO.RejectionRequest.builder()
                .confirmationId(confirmationId)
                .reason(body.get("reason"))
                .notes(body.get("notes"))
                .build();

        return ResponseEntity.ok(productionService.rejectConfirmation(request));
    }

    /**
     * Get production confirmation by ID
     */
    @GetMapping("/confirmations/{confirmationId}")
    public ResponseEntity<ProductionConfirmationDTO.Response> getConfirmation(@PathVariable Long confirmationId) {
        log.info("GET /api/production/confirmations/{}", confirmationId);
        return ResponseEntity.ok(productionService.getConfirmationById(confirmationId));
    }

    /**
     * Get confirmations by status
     */
    @GetMapping("/confirmations/status/{status}")
    public ResponseEntity<java.util.List<ProductionConfirmationDTO.Response>> getConfirmationsByStatus(
            @PathVariable String status) {
        log.info("GET /api/production/confirmations/status/{}", status);
        return ResponseEntity.ok(productionService.getConfirmationsByStatus(status.toUpperCase()));
    }

    /**
     * Get rejected confirmations
     */
    @GetMapping("/confirmations/rejected")
    public ResponseEntity<java.util.List<ProductionConfirmationDTO.Response>> getRejectedConfirmations() {
        log.info("GET /api/production/confirmations/rejected");
        return ResponseEntity.ok(productionService.getConfirmationsByStatus("REJECTED"));
    }

    // Need to import Map
    private static final class Map {
        static java.util.Map<String, Object> of(Object... keyValues) {
            java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
            for (int i = 0; i < keyValues.length; i += 2) {
                map.put((String) keyValues[i], keyValues[i + 1]);
            }
            return map;
        }
    }
}
