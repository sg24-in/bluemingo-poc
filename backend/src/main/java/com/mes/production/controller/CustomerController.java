package com.mes.production.controller;

import com.mes.production.dto.CustomerDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@Slf4j
public class CustomerController {

    private final CustomerService customerService;

    /**
     * Get all customers (non-paginated)
     */
    @GetMapping
    public ResponseEntity<List<CustomerDTO>> getAllCustomers() {
        log.info("GET /api/customers");
        List<CustomerDTO> customers = customerService.getAllCustomers();
        return ResponseEntity.ok(customers);
    }

    /**
     * Get all active customers (for dropdowns)
     */
    @GetMapping("/active")
    public ResponseEntity<List<CustomerDTO>> getActiveCustomers() {
        log.info("GET /api/customers/active");
        List<CustomerDTO> customers = customerService.getActiveCustomers();
        return ResponseEntity.ok(customers);
    }

    /**
     * Get customers with pagination
     */
    @GetMapping("/paged")
    public ResponseEntity<PagedResponseDTO<CustomerDTO>> getCustomersPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {

        log.info("GET /api/customers/paged - page={}, size={}, search={}, status={}", page, size, search, status);

        PageRequestDTO request = PageRequestDTO.builder()
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .search(search)
                .status(status)
                .build();

        PagedResponseDTO<CustomerDTO> result = customerService.getCustomersPaged(request);
        return ResponseEntity.ok(result);
    }

    /**
     * Get customer by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<CustomerDTO> getCustomerById(@PathVariable Long id) {
        log.info("GET /api/customers/{}", id);
        CustomerDTO customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(customer);
    }

    /**
     * Get customer by code
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<CustomerDTO> getCustomerByCode(@PathVariable String code) {
        log.info("GET /api/customers/code/{}", code);
        CustomerDTO customer = customerService.getCustomerByCode(code);
        return ResponseEntity.ok(customer);
    }

    /**
     * Create a new customer
     */
    @PostMapping
    public ResponseEntity<CustomerDTO> createCustomer(@Valid @RequestBody CustomerDTO dto) {
        log.info("POST /api/customers - creating customer: {}", dto.getCustomerCode());
        CustomerDTO created = customerService.createCustomer(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update an existing customer
     */
    @PutMapping("/{id}")
    public ResponseEntity<CustomerDTO> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody CustomerDTO dto) {
        log.info("PUT /api/customers/{} - updating customer", id);
        CustomerDTO updated = customerService.updateCustomer(id, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a customer (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteCustomer(@PathVariable Long id) {
        log.info("DELETE /api/customers/{}", id);
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(Map.of("message", "Customer deleted successfully"));
    }

    /**
     * Hard delete a customer (permanent)
     */
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Map<String, String>> hardDeleteCustomer(@PathVariable Long id) {
        log.info("DELETE /api/customers/{}/permanent", id);
        customerService.hardDeleteCustomer(id);
        return ResponseEntity.ok(Map.of("message", "Customer permanently deleted"));
    }
}
