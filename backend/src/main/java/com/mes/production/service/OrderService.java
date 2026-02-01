package com.mes.production.service;

import com.mes.production.dto.OrderDTO;
import com.mes.production.entity.Operation;
import com.mes.production.entity.Order;
import com.mes.production.entity.OrderLineItem;
import com.mes.production.entity.Process;
import com.mes.production.repository.OperationRepository;
import com.mes.production.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final OperationRepository operationRepository;

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
                        .stageName(process.getStageName())
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
}
