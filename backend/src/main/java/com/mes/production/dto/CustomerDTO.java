package com.mes.production.dto;

import com.mes.production.entity.Customer;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDTO {

    private Long customerId;

    @NotBlank(message = "Customer code is required")
    @Size(max = 50, message = "Customer code must not exceed 50 characters")
    private String customerCode;

    @NotBlank(message = "Customer name is required")
    @Size(max = 200, message = "Customer name must not exceed 200 characters")
    private String customerName;

    @Size(max = 100, message = "Contact person must not exceed 100 characters")
    private String contactPerson;

    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    @Size(max = 50, message = "Phone must not exceed 50 characters")
    private String phone;

    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;

    @Size(max = 100, message = "City must not exceed 100 characters")
    private String city;

    @Size(max = 100, message = "Country must not exceed 100 characters")
    private String country;

    @Size(max = 50, message = "Tax ID must not exceed 50 characters")
    private String taxId;

    private String status;

    private LocalDateTime createdOn;
    private String createdBy;
    private LocalDateTime updatedOn;
    private String updatedBy;

    // Convert entity to DTO
    public static CustomerDTO fromEntity(Customer customer) {
        if (customer == null) return null;

        return CustomerDTO.builder()
                .customerId(customer.getCustomerId())
                .customerCode(customer.getCustomerCode())
                .customerName(customer.getCustomerName())
                .contactPerson(customer.getContactPerson())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .address(customer.getAddress())
                .city(customer.getCity())
                .country(customer.getCountry())
                .taxId(customer.getTaxId())
                .status(customer.getStatus())
                .createdOn(customer.getCreatedOn())
                .createdBy(customer.getCreatedBy())
                .updatedOn(customer.getUpdatedOn())
                .updatedBy(customer.getUpdatedBy())
                .build();
    }

    // Convert DTO to entity
    public Customer toEntity() {
        return Customer.builder()
                .customerId(this.customerId)
                .customerCode(this.customerCode)
                .customerName(this.customerName)
                .contactPerson(this.contactPerson)
                .email(this.email)
                .phone(this.phone)
                .address(this.address)
                .city(this.city)
                .country(this.country)
                .taxId(this.taxId)
                .status(this.status)
                .build();
    }
}
