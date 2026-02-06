package com.mes.production.service;

import com.mes.production.dto.OrderDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.dto.order.CreateOrderRequest;
import com.mes.production.dto.order.LineItemRequest;
import com.mes.production.dto.order.UpdateOrderRequest;
import com.mes.production.entity.AuditTrail;
import com.mes.production.entity.Operation;
import com.mes.production.entity.Order;
import com.mes.production.entity.OrderLineItem;
import com.mes.production.entity.Process;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.OperationRepository;
import com.mes.production.repository.OrderLineItemRepository;
import com.mes.production.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderLineItemRepository orderLineItemRepository;
    private final OperationRepository operationRepository;
    private final AuditTrailRepository auditTrailRepository;

    /**
     * Get all orders with ready operations (available for production confirmation)
     */
    public List<OrderDTO> getAvailableOrders() {
        log.info("Fetching orders with ready operations");

        List<Operation> readyOperations = operationRepository.findReadyOperationsWithDetails();

        // Group by order and convert to DTOs
        return readyOperations.stream()
                .map(op -> op.getProcess().getOrderLineItem().getOrder())
                .distinct()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get order by ID with all details
     */
    public OrderDTO getOrderById(Long orderId) {
        log.info("Fetching order by ID: {}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        return convertToDTO(order);
    }

    /**
     * Get all active orders
     */
    public List<OrderDTO> getActiveOrders() {
        log.info("Fetching all active orders");

        return orderRepository.findActiveOrders().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all orders with pagination, sorting, and filtering
     */
    public PagedResponseDTO<OrderDTO> getOrdersPaged(PageRequestDTO pageRequest) {
        log.info("Fetching orders with pagination: page={}, size={}, sortBy={}, search={}",
                pageRequest.getPage(), pageRequest.getSize(),
                pageRequest.getSortBy(), pageRequest.getSearch());

        Pageable pageable = pageRequest.toPageable("orderDate");

        Page<Order> page;
        if (pageRequest.hasFilters()) {
            page = orderRepository.findByFilters(
                    pageRequest.getStatus(),
                    pageRequest.getSearchPattern(),
                    pageable);
        } else {
            page = orderRepository.findAll(pageable);
        }

        Page<OrderDTO> dtoPage = page.map(this::convertToDTO);

        return PagedResponseDTO.fromPage(dtoPage,
                pageRequest.getSortBy(),
                pageRequest.getSortDirection(),
                pageRequest.getSearch());
    }

    /**
     * Get active orders with pagination
     */
    public PagedResponseDTO<OrderDTO> getActiveOrdersPaged(PageRequestDTO pageRequest) {
        log.info("Fetching active orders with pagination");

        Pageable pageable = pageRequest.toPageable("orderDate");
        Page<Order> page = orderRepository.findActiveOrders(pageable);
        Page<OrderDTO> dtoPage = page.map(this::convertToDTO);

        return PagedResponseDTO.fromPage(dtoPage,
                pageRequest.getSortBy(),
                pageRequest.getSortDirection());
    }

    private OrderDTO convertToDTO(Order order) {
        List<OrderDTO.OrderLineDTO> lineDTOs = new ArrayList<>();

        if (order.getLineItems() != null) {
            for (OrderLineItem line : order.getLineItems()) {
                OrderDTO.OrderLineDTO lineDTO = convertLineToDTO(line);
                lineDTOs.add(lineDTO);
            }
        }

        return OrderDTO.builder()
                .orderId(order.getOrderId())
                .orderNumber(order.getOrderNumber())
                .customerId(order.getCustomerId())
                .customerName(order.getCustomerName())
                .orderDate(order.getOrderDate())
                .status(order.getStatus())
                .lineItems(lineDTOs)
                .build();
    }

    private OrderDTO.OrderLineDTO convertLineToDTO(OrderLineItem line) {
        List<OrderDTO.ProcessDTO> processDTOs = new ArrayList<>();
        OrderDTO.ProcessDTO currentProcess = null;
        OrderDTO.OperationDTO currentOperation = null;

        if (line.getProcesses() != null) {
            for (Process process : line.getProcesses()) {
                List<OrderDTO.OperationDTO> operationDTOs = new ArrayList<>();

                if (process.getOperations() != null) {
                    for (Operation op : process.getOperations()) {
                        OrderDTO.OperationDTO opDTO = OrderDTO.OperationDTO.builder()
                                .operationId(op.getOperationId())
                                .operationName(op.getOperationName())
                                .operationCode(op.getOperationCode())
                                .operationType(op.getOperationType())
                                .sequenceNumber(op.getSequenceNumber())
                                .status(op.getStatus())
                                .build();

                        operationDTOs.add(opDTO);

                        // Find current (READY) operation
                        if ("READY".equals(op.getStatus())) {
                            currentOperation = opDTO;
                        }
                    }
                }

                OrderDTO.ProcessDTO processDTO = OrderDTO.ProcessDTO.builder()
                        .processId(process.getProcessId())
                        .processName(process.getProcessName())
                        .stageSequence(process.getStageSequence())
                        .status(process.getStatus())
                        .operations(operationDTOs)
                        .build();

                processDTOs.add(processDTO);

                // Find current (IN_PROGRESS) process
                if ("IN_PROGRESS".equals(process.getStatus())) {
                    currentProcess = processDTO;
                }
            }
        }

        return OrderDTO.OrderLineDTO.builder()
                .orderLineId(line.getOrderLineId())
                .productSku(line.getProductSku())
                .productName(line.getProductName())
                .quantity(line.getQuantity())
                .unit(line.getUnit())
                .deliveryDate(line.getDeliveryDate())
                .status(line.getStatus())
                .processes(processDTOs)
                .currentProcess(currentProcess)
                .currentOperation(currentOperation)
                .build();
    }

    // ==================== CRUD OPERATIONS ====================

    /**
     * Create a new order with line items
     */
    @Transactional
    public OrderDTO createOrder(CreateOrderRequest request) {
        log.info("Creating new order for customer: {}", request.getCustomerId());

        String currentUser = getCurrentUsername();

        // Generate order number if not provided
        String orderNumber = request.getOrderNumber();
        if (orderNumber == null || orderNumber.isBlank()) {
            orderNumber = generateOrderNumber();
        } else if (orderRepository.existsByOrderNumber(orderNumber)) {
            throw new RuntimeException("Order number already exists: " + orderNumber);
        }

        // Create order
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .customerId(request.getCustomerId())
                .customerName(request.getCustomerName())
                .orderDate(request.getOrderDate())
                .status("CREATED")
                .createdBy(currentUser)
                .build();

        Order savedOrder = orderRepository.save(order);

        // Create line items
        List<OrderLineItem> lineItems = new ArrayList<>();
        for (CreateOrderRequest.LineItemRequest lineReq : request.getLineItems()) {
            OrderLineItem lineItem = OrderLineItem.builder()
                    .order(savedOrder)
                    .productSku(lineReq.getProductSku())
                    .productName(lineReq.getProductName())
                    .quantity(lineReq.getQuantity())
                    .unit(lineReq.getUnit())
                    .deliveryDate(lineReq.getDeliveryDate())
                    .status("CREATED")
                    .createdBy(currentUser)
                    .build();
            lineItems.add(orderLineItemRepository.save(lineItem));
        }

        savedOrder.setLineItems(lineItems);

        // Audit
        auditOrderAction(savedOrder.getOrderId(), AuditTrail.ACTION_CREATE, null, savedOrder.getOrderNumber(), currentUser);

        log.info("Created order: {} with {} line items by {}", savedOrder.getOrderNumber(), lineItems.size(), currentUser);
        return convertToDTO(savedOrder);
    }

    /**
     * Update an existing order (basic info only, not line items)
     */
    @Transactional
    public OrderDTO updateOrder(Long orderId, UpdateOrderRequest request) {
        log.info("Updating order: {}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        String currentUser = getCurrentUsername();
        String oldValues = String.format("customer=%s, status=%s", order.getCustomerId(), order.getStatus());

        // Update fields
        order.setCustomerId(request.getCustomerId());
        order.setCustomerName(request.getCustomerName());
        if (request.getOrderDate() != null) {
            order.setOrderDate(request.getOrderDate());
        }
        if (request.getStatus() != null) {
            order.setStatus(request.getStatus());
        }
        order.setUpdatedBy(currentUser);

        Order saved = orderRepository.save(order);

        String newValues = String.format("customer=%s, status=%s", saved.getCustomerId(), saved.getStatus());
        auditOrderAction(saved.getOrderId(), AuditTrail.ACTION_UPDATE, oldValues, newValues, currentUser);

        log.info("Updated order: {} by {}", saved.getOrderNumber(), currentUser);
        return convertToDTO(saved);
    }

    /**
     * Delete an order (soft delete - set status to CANCELLED)
     */
    @Transactional
    public void deleteOrder(Long orderId) {
        log.info("Deleting order: {}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        // Check if order can be deleted (only CREATED status)
        if (!"CREATED".equals(order.getStatus())) {
            throw new RuntimeException("Cannot delete order with status: " + order.getStatus() + ". Only CREATED orders can be deleted.");
        }

        String currentUser = getCurrentUsername();

        order.setStatus("CANCELLED");
        order.setUpdatedBy(currentUser);
        orderRepository.save(order);

        auditOrderAction(order.getOrderId(), AuditTrail.ACTION_DELETE, "CREATED", "CANCELLED", currentUser);

        log.info("Deleted (cancelled) order: {} by {}", order.getOrderNumber(), currentUser);
    }

    /**
     * Add a line item to an existing order
     */
    @Transactional
    public OrderDTO addLineItem(Long orderId, LineItemRequest request) {
        log.info("Adding line item to order: {}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        // Check if order can be modified
        if (!"CREATED".equals(order.getStatus())) {
            throw new RuntimeException("Cannot add line item to order with status: " + order.getStatus());
        }

        String currentUser = getCurrentUsername();

        OrderLineItem lineItem = OrderLineItem.builder()
                .order(order)
                .productSku(request.getProductSku())
                .productName(request.getProductName())
                .quantity(request.getQuantity())
                .unit(request.getUnit())
                .deliveryDate(request.getDeliveryDate())
                .status("CREATED")
                .createdBy(currentUser)
                .build();

        orderLineItemRepository.save(lineItem);

        auditOrderAction(order.getOrderId(), AuditTrail.ACTION_UPDATE,
                "line_items_count=" + order.getLineItems().size(),
                "added_line_item=" + request.getProductSku(), currentUser);

        log.info("Added line item {} to order: {} by {}", request.getProductSku(), order.getOrderNumber(), currentUser);
        return getOrderById(orderId);
    }

    /**
     * Update a line item
     */
    @Transactional
    public OrderDTO updateLineItem(Long orderId, Long lineItemId, LineItemRequest request) {
        log.info("Updating line item {} in order: {}", lineItemId, orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        OrderLineItem lineItem = orderLineItemRepository.findById(lineItemId)
                .orElseThrow(() -> new RuntimeException("Line item not found: " + lineItemId));

        // Verify line item belongs to order
        if (!lineItem.getOrder().getOrderId().equals(orderId)) {
            throw new RuntimeException("Line item does not belong to order");
        }

        // Check if line item can be modified
        if (!"CREATED".equals(lineItem.getStatus())) {
            throw new RuntimeException("Cannot update line item with status: " + lineItem.getStatus());
        }

        String currentUser = getCurrentUsername();

        lineItem.setProductSku(request.getProductSku());
        lineItem.setProductName(request.getProductName());
        lineItem.setQuantity(request.getQuantity());
        lineItem.setUnit(request.getUnit());
        lineItem.setDeliveryDate(request.getDeliveryDate());
        lineItem.setUpdatedBy(currentUser);

        orderLineItemRepository.save(lineItem);

        log.info("Updated line item {} in order: {} by {}", lineItemId, order.getOrderNumber(), currentUser);
        return getOrderById(orderId);
    }

    /**
     * Delete a line item from an order
     */
    @Transactional
    public OrderDTO deleteLineItem(Long orderId, Long lineItemId) {
        log.info("Deleting line item {} from order: {}", lineItemId, orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        OrderLineItem lineItem = orderLineItemRepository.findById(lineItemId)
                .orElseThrow(() -> new RuntimeException("Line item not found: " + lineItemId));

        // Verify line item belongs to order
        if (!lineItem.getOrder().getOrderId().equals(orderId)) {
            throw new RuntimeException("Line item does not belong to order");
        }

        // Check if line item can be deleted
        if (!"CREATED".equals(lineItem.getStatus())) {
            throw new RuntimeException("Cannot delete line item with status: " + lineItem.getStatus());
        }

        // Check if this is the last line item
        if (order.getLineItems().size() <= 1) {
            throw new RuntimeException("Cannot delete the last line item. Delete the order instead.");
        }

        String currentUser = getCurrentUsername();

        orderLineItemRepository.delete(lineItem);

        auditOrderAction(order.getOrderId(), AuditTrail.ACTION_UPDATE,
                "deleted_line_item=" + lineItem.getProductSku(),
                "remaining_items=" + (order.getLineItems().size() - 1), currentUser);

        log.info("Deleted line item {} from order: {} by {}", lineItemId, order.getOrderNumber(), currentUser);
        return getOrderById(orderId);
    }

    // ==================== HELPER METHODS ====================

    private String generateOrderNumber() {
        Integer maxSequence = orderRepository.findMaxOrderNumberSequence();
        int nextSequence = (maxSequence != null ? maxSequence : 0) + 1;
        return String.format("ORD-%05d", nextSequence);
    }

    private void auditOrderAction(Long orderId, String action, String oldValue, String newValue, String user) {
        AuditTrail audit = AuditTrail.builder()
                .entityType(AuditTrail.ENTITY_ORDER)
                .entityId(orderId)
                .action(action)
                .oldValue(oldValue)
                .newValue(newValue)
                .changedBy(user)
                .timestamp(LocalDateTime.now())
                .build();
        auditTrailRepository.save(audit);
    }

    private String getCurrentUsername() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "system";
        }
    }
}
