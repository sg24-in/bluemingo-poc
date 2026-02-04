package com.mes.production.service;

import com.mes.production.dto.CustomerDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.entity.AuditTrail;
import com.mes.production.entity.Customer;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final AuditTrailRepository auditTrailRepository;

    /**
     * Get all customers
     */
    public List<CustomerDTO> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(CustomerDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get all active customers
     */
    public List<CustomerDTO> getActiveCustomers() {
        return customerRepository.findAllActiveCustomers().stream()
                .map(CustomerDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get customers with pagination
     */
    public PagedResponseDTO<CustomerDTO> getCustomersPaged(PageRequestDTO request) {
        String sortBy = request.getSortBy() != null ? request.getSortBy() : "customerName";
        Sort.Direction direction = "DESC".equalsIgnoreCase(request.getSortDirection())
                ? Sort.Direction.DESC : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(
                request.getPage(),
                Math.min(request.getSize(), 100),
                Sort.by(direction, sortBy)
        );

        Page<Customer> page = customerRepository.findByFilters(
                request.getSearch(),
                request.getStatus(),
                pageable
        );

        List<CustomerDTO> content = page.getContent().stream()
                .map(CustomerDTO::fromEntity)
                .collect(Collectors.toList());

        return PagedResponseDTO.<CustomerDTO>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    /**
     * Get customer by ID
     */
    public CustomerDTO getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + id));
        return CustomerDTO.fromEntity(customer);
    }

    /**
     * Get customer by code
     */
    public CustomerDTO getCustomerByCode(String code) {
        Customer customer = customerRepository.findByCustomerCode(code)
                .orElseThrow(() -> new RuntimeException("Customer not found with code: " + code));
        return CustomerDTO.fromEntity(customer);
    }

    /**
     * Create a new customer
     */
    @Transactional
    public CustomerDTO createCustomer(CustomerDTO dto) {
        // Validate unique customer code
        if (customerRepository.existsByCustomerCode(dto.getCustomerCode())) {
            throw new RuntimeException("Customer code already exists: " + dto.getCustomerCode());
        }

        String currentUser = getCurrentUsername();

        Customer customer = dto.toEntity();
        customer.setCreatedBy(currentUser);
        customer.setStatus(Customer.STATUS_ACTIVE);

        Customer saved = customerRepository.save(customer);

        // Audit trail
        auditCustomerAction(saved.getCustomerId(), AuditTrail.ACTION_CREATE, null, saved.getCustomerCode(), currentUser);

        log.info("Created customer: {} by {}", saved.getCustomerCode(), currentUser);
        return CustomerDTO.fromEntity(saved);
    }

    /**
     * Update an existing customer
     */
    @Transactional
    public CustomerDTO updateCustomer(Long id, CustomerDTO dto) {
        Customer existing = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + id));

        String currentUser = getCurrentUsername();

        // Check for duplicate code if changed
        if (!existing.getCustomerCode().equals(dto.getCustomerCode()) &&
                customerRepository.existsByCustomerCode(dto.getCustomerCode())) {
            throw new RuntimeException("Customer code already exists: " + dto.getCustomerCode());
        }

        String oldValues = String.format("code=%s, name=%s", existing.getCustomerCode(), existing.getCustomerName());

        // Update fields
        existing.setCustomerCode(dto.getCustomerCode());
        existing.setCustomerName(dto.getCustomerName());
        existing.setContactPerson(dto.getContactPerson());
        existing.setEmail(dto.getEmail());
        existing.setPhone(dto.getPhone());
        existing.setAddress(dto.getAddress());
        existing.setCity(dto.getCity());
        existing.setCountry(dto.getCountry());
        existing.setTaxId(dto.getTaxId());
        if (dto.getStatus() != null) {
            existing.setStatus(dto.getStatus());
        }
        existing.setUpdatedBy(currentUser);

        Customer saved = customerRepository.save(existing);

        String newValues = String.format("code=%s, name=%s", saved.getCustomerCode(), saved.getCustomerName());
        auditCustomerAction(saved.getCustomerId(), AuditTrail.ACTION_UPDATE, oldValues, newValues, currentUser);

        log.info("Updated customer: {} by {}", saved.getCustomerCode(), currentUser);
        return CustomerDTO.fromEntity(saved);
    }

    /**
     * Delete a customer
     */
    @Transactional
    public void deleteCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + id));

        String currentUser = getCurrentUsername();

        // Soft delete - set status to INACTIVE
        customer.setStatus(Customer.STATUS_INACTIVE);
        customer.setUpdatedBy(currentUser);
        customerRepository.save(customer);

        auditCustomerAction(customer.getCustomerId(), AuditTrail.ACTION_DELETE, Customer.STATUS_ACTIVE, Customer.STATUS_INACTIVE, currentUser);

        log.info("Deleted (deactivated) customer: {} by {}", customer.getCustomerCode(), currentUser);
    }

    /**
     * Hard delete a customer (use with caution)
     */
    @Transactional
    public void hardDeleteCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + id));

        String currentUser = getCurrentUsername();

        customerRepository.delete(customer);

        auditCustomerAction(id, AuditTrail.ACTION_DELETE, customer.getCustomerCode(), null, currentUser);

        log.info("Hard deleted customer: {} by {}", customer.getCustomerCode(), currentUser);
    }

    private void auditCustomerAction(Long customerId, String action, String oldValue, String newValue, String user) {
        AuditTrail audit = AuditTrail.builder()
                .entityType("CUSTOMER")
                .entityId(customerId)
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
