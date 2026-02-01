package com.mes.production.controller;

import com.mes.production.dto.OrderDTO;
import com.mes.production.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {

    private final OrderService orderService;

    /**
     * Get orders available for production (with READY operations)
     */
    @GetMapping("/available")
    public ResponseEntity<List<OrderDTO>> getAvailableOrders() {
        log.info("GET /api/orders/available");
        List<OrderDTO> orders = orderService.getAvailableOrders();
        return ResponseEntity.ok(orders);
    }

    /**
     * Get all active orders
     */
    @GetMapping
    public ResponseEntity<List<OrderDTO>> getActiveOrders() {
        log.info("GET /api/orders");
        List<OrderDTO> orders = orderService.getActiveOrders();
        return ResponseEntity.ok(orders);
    }

    /**
     * Get order by ID
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDTO> getOrderById(@PathVariable Long orderId) {
        log.info("GET /api/orders/{}", orderId);
        OrderDTO order = orderService.getOrderById(orderId);
        return ResponseEntity.ok(order);
    }
}
