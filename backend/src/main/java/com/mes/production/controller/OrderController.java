package com.mes.production.controller;

import com.mes.production.dto.OrderDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
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
     * Get all active orders (legacy - non-paginated)
     */
    @GetMapping
    public ResponseEntity<List<OrderDTO>> getActiveOrders() {
        log.info("GET /api/orders");
        List<OrderDTO> orders = orderService.getActiveOrders();
        return ResponseEntity.ok(orders);
    }

    /**
     * Get orders with pagination, sorting, and filtering.
     *
     * @param page Page number (0-indexed, default: 0)
     * @param size Page size (default: 20, max: 100)
     * @param sortBy Sort field (default: orderDate)
     * @param sortDirection Sort direction: ASC or DESC (default: DESC)
     * @param search Search term for order number or customer name
     * @param status Filter by status
     */
    @GetMapping("/paged")
    public ResponseEntity<PagedResponseDTO<OrderDTO>> getOrdersPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {

        log.info("GET /api/orders/paged - page={}, size={}, sortBy={}, search={}, status={}",
                page, size, sortBy, search, status);

        PageRequestDTO pageRequest = PageRequestDTO.builder()
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .search(search)
                .status(status)
                .build();

        PagedResponseDTO<OrderDTO> result = orderService.getOrdersPaged(pageRequest);
        return ResponseEntity.ok(result);
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
