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

        return ResponseEntity.ok(Map.of(
                "operationId", operation.getOperationId(),
                "operationName", operation.getOperationName(),
                "operationCode", operation.getOperationCode(),
                "operationType", operation.getOperationType(),
                "status", operation.getStatus(),
                "process", Map.of(
                        "processId", operation.getProcess().getProcessId(),
                        "stageName", operation.getProcess().getStageName()
                ),
                "order", Map.of(
                        "orderId", operation.getProcess().getOrderLineItem().getOrder().getOrderId(),
                        "productSku", operation.getProcess().getOrderLineItem().getProductSku(),
                        "productName", operation.getProcess().getOrderLineItem().getProductName(),
                        "quantity", operation.getProcess().getOrderLineItem().getQuantity()
                )
        ));
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
