package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.CustomerDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.security.JwtService;
import com.mes.production.service.CustomerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.mes.production.config.TestSecurityConfig;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class CustomerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CustomerService customerService;

    @MockBean
    private JwtService jwtService;

    private CustomerDTO testCustomer;

    @BeforeEach
    void setUp() {
        testCustomer = CustomerDTO.builder()
                .customerId(1L)
                .customerCode("CUST-001")
                .customerName("Acme Corp")
                .contactPerson("John Doe")
                .email("john@acme.com")
                .phone("123-456-7890")
                .address("123 Main St")
                .city("New York")
                .country("USA")
                .status("ACTIVE")
                .build();
    }

    @Nested
    @DisplayName("Get Customers Tests")
    class GetCustomersTests {

        @Test
        @DisplayName("Should get all customers")
        @WithMockUser(username = "admin@mes.com")
        void getAllCustomers_ReturnsCustomers() throws Exception {
            when(customerService.getAllCustomers()).thenReturn(List.of(testCustomer));

            mockMvc.perform(get("/api/customers"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].customerId").value(1))
                    .andExpect(jsonPath("$[0].customerCode").value("CUST-001"))
                    .andExpect(jsonPath("$[0].customerName").value("Acme Corp"));

            verify(customerService).getAllCustomers();
        }

        @Test
        @DisplayName("Should get active customers")
        @WithMockUser(username = "admin@mes.com")
        void getActiveCustomers_ReturnsActiveCustomers() throws Exception {
            when(customerService.getActiveCustomers()).thenReturn(List.of(testCustomer));

            mockMvc.perform(get("/api/customers/active"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].status").value("ACTIVE"));

            verify(customerService).getActiveCustomers();
        }

        @Test
        @DisplayName("Should get customer by ID")
        @WithMockUser(username = "admin@mes.com")
        void getCustomerById_ValidId_ReturnsCustomer() throws Exception {
            when(customerService.getCustomerById(1L)).thenReturn(testCustomer);

            mockMvc.perform(get("/api/customers/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.customerId").value(1))
                    .andExpect(jsonPath("$.customerCode").value("CUST-001"));

            verify(customerService).getCustomerById(1L);
        }

        @Test
        @DisplayName("Should return bad request for non-existent customer")
        @WithMockUser(username = "admin@mes.com")
        void getCustomerById_NotFound_ReturnsBadRequest() throws Exception {
            when(customerService.getCustomerById(999L))
                    .thenThrow(new RuntimeException("Customer not found"));

            mockMvc.perform(get("/api/customers/999"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should get customers with pagination")
        @WithMockUser(username = "admin@mes.com")
        void getCustomersPaged_ReturnsPagedResponse() throws Exception {
            PagedResponseDTO<CustomerDTO> pagedResponse = PagedResponseDTO.<CustomerDTO>builder()
                    .content(List.of(testCustomer))
                    .page(0)
                    .size(20)
                    .totalElements(1)
                    .totalPages(1)
                    .first(true)
                    .last(true)
                    .hasNext(false)
                    .hasPrevious(false)
                    .build();

            when(customerService.getCustomersPaged(any(PageRequestDTO.class))).thenReturn(pagedResponse);

            mockMvc.perform(get("/api/customers/paged")
                            .param("page", "0")
                            .param("size", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].customerCode").value("CUST-001"))
                    .andExpect(jsonPath("$.totalElements").value(1));

            verify(customerService).getCustomersPaged(any(PageRequestDTO.class));
        }
    }

    @Nested
    @DisplayName("Create Customer Tests")
    class CreateCustomerTests {

        @Test
        @DisplayName("Should create customer successfully")
        @WithMockUser(username = "admin@mes.com")
        void createCustomer_ValidData_ReturnsCreated() throws Exception {
            CustomerDTO createRequest = CustomerDTO.builder()
                    .customerCode("CUST-002")
                    .customerName("New Corp")
                    .email("new@corp.com")
                    .build();

            when(customerService.createCustomer(any(CustomerDTO.class))).thenReturn(testCustomer);

            mockMvc.perform(post("/api/customers")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.customerId").value(1));

            verify(customerService).createCustomer(any(CustomerDTO.class));
        }

        @Test
        @DisplayName("Should return bad request for invalid data")
        @WithMockUser(username = "admin@mes.com")
        void createCustomer_InvalidData_ReturnsBadRequest() throws Exception {
            CustomerDTO invalidRequest = CustomerDTO.builder()
                    .customerCode("")  // Invalid - blank
                    .customerName("")  // Invalid - blank
                    .build();

            mockMvc.perform(post("/api/customers")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalidRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return bad request for duplicate code")
        @WithMockUser(username = "admin@mes.com")
        void createCustomer_DuplicateCode_ReturnsBadRequest() throws Exception {
            CustomerDTO createRequest = CustomerDTO.builder()
                    .customerCode("CUST-001")
                    .customerName("Duplicate Corp")
                    .build();

            when(customerService.createCustomer(any(CustomerDTO.class)))
                    .thenThrow(new RuntimeException("Customer code already exists"));

            mockMvc.perform(post("/api/customers")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Update Customer Tests")
    class UpdateCustomerTests {

        @Test
        @DisplayName("Should update customer successfully")
        @WithMockUser(username = "admin@mes.com")
        void updateCustomer_ValidData_ReturnsOk() throws Exception {
            CustomerDTO updateRequest = CustomerDTO.builder()
                    .customerCode("CUST-001")
                    .customerName("Updated Corp")
                    .email("updated@corp.com")
                    .build();

            CustomerDTO updatedCustomer = CustomerDTO.builder()
                    .customerId(1L)
                    .customerCode("CUST-001")
                    .customerName("Updated Corp")
                    .email("updated@corp.com")
                    .status("ACTIVE")
                    .build();

            when(customerService.updateCustomer(eq(1L), any(CustomerDTO.class))).thenReturn(updatedCustomer);

            mockMvc.perform(put("/api/customers/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.customerName").value("Updated Corp"));

            verify(customerService).updateCustomer(eq(1L), any(CustomerDTO.class));
        }

        @Test
        @DisplayName("Should return bad request for non-existent customer")
        @WithMockUser(username = "admin@mes.com")
        void updateCustomer_NotFound_ReturnsBadRequest() throws Exception {
            CustomerDTO updateRequest = CustomerDTO.builder()
                    .customerCode("CUST-001")
                    .customerName("Updated Corp")
                    .build();

            when(customerService.updateCustomer(eq(999L), any(CustomerDTO.class)))
                    .thenThrow(new RuntimeException("Customer not found"));

            mockMvc.perform(put("/api/customers/999")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Delete Customer Tests")
    class DeleteCustomerTests {

        @Test
        @DisplayName("Should delete customer successfully")
        @WithMockUser(username = "admin@mes.com")
        void deleteCustomer_ValidId_ReturnsOk() throws Exception {
            doNothing().when(customerService).deleteCustomer(1L);

            mockMvc.perform(delete("/api/customers/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Customer deleted successfully"));

            verify(customerService).deleteCustomer(1L);
        }

        @Test
        @DisplayName("Should return bad request for non-existent customer")
        @WithMockUser(username = "admin@mes.com")
        void deleteCustomer_NotFound_ReturnsBadRequest() throws Exception {
            doThrow(new RuntimeException("Customer not found"))
                    .when(customerService).deleteCustomer(999L);

            mockMvc.perform(delete("/api/customers/999"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void getCustomers_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/customers"))
                .andExpect(status().isUnauthorized());
    }
}
