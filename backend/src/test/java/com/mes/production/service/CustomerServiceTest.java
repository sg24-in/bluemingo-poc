package com.mes.production.service;

import com.mes.production.dto.CustomerDTO;
import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.PageRequestDTO;
import com.mes.production.entity.Customer;
import com.mes.production.repository.AuditTrailRepository;
import com.mes.production.repository.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private AuditTrailRepository auditTrailRepository;

    @InjectMocks
    private CustomerService customerService;

    private Customer testCustomer;
    private CustomerDTO testCustomerDTO;

    @BeforeEach
    void setUp() {
        testCustomer = Customer.builder()
                .customerId(1L)
                .customerCode("CUST-001")
                .customerName("Acme Corp")
                .contactPerson("John Doe")
                .email("john@acme.com")
                .phone("123-456-7890")
                .address("123 Main St")
                .city("New York")
                .country("USA")
                .taxId("TAX-123")
                .status(Customer.STATUS_ACTIVE)
                .build();

        testCustomerDTO = CustomerDTO.builder()
                .customerCode("CUST-001")
                .customerName("Acme Corp")
                .contactPerson("John Doe")
                .email("john@acme.com")
                .phone("123-456-7890")
                .address("123 Main St")
                .city("New York")
                .country("USA")
                .taxId("TAX-123")
                .build();
    }

    private void setupSecurityContext() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("admin@mes.com");
        SecurityContextHolder.setContext(securityContext);
    }

    @Nested
    @DisplayName("Get Customers Tests")
    class GetCustomersTests {

        @Test
        @DisplayName("Should get all customers")
        void getAllCustomers_ReturnsAllCustomers() {
            when(customerRepository.findAll()).thenReturn(List.of(testCustomer));

            List<CustomerDTO> result = customerService.getAllCustomers();

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("CUST-001", result.get(0).getCustomerCode());
            assertEquals("Acme Corp", result.get(0).getCustomerName());
        }

        @Test
        @DisplayName("Should get active customers only")
        void getActiveCustomers_ReturnsActiveOnly() {
            when(customerRepository.findAllActiveCustomers()).thenReturn(List.of(testCustomer));

            List<CustomerDTO> result = customerService.getActiveCustomers();

            assertNotNull(result);
            assertEquals(1, result.size());
            verify(customerRepository).findAllActiveCustomers();
        }

        @Test
        @DisplayName("Should get customer by ID")
        void getCustomerById_ExistingId_ReturnsCustomer() {
            when(customerRepository.findById(1L)).thenReturn(Optional.of(testCustomer));

            CustomerDTO result = customerService.getCustomerById(1L);

            assertNotNull(result);
            assertEquals("CUST-001", result.getCustomerCode());
            assertEquals("Acme Corp", result.getCustomerName());
        }

        @Test
        @DisplayName("Should throw exception when customer not found by ID")
        void getCustomerById_NotFound_ThrowsException() {
            when(customerRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> customerService.getCustomerById(999L));

            assertTrue(exception.getMessage().contains("not found"));
        }

        @Test
        @DisplayName("Should get customer by code")
        void getCustomerByCode_ExistingCode_ReturnsCustomer() {
            when(customerRepository.findByCustomerCode("CUST-001")).thenReturn(Optional.of(testCustomer));

            CustomerDTO result = customerService.getCustomerByCode("CUST-001");

            assertNotNull(result);
            assertEquals("Acme Corp", result.getCustomerName());
        }

        @Test
        @DisplayName("Should throw exception when customer not found by code")
        void getCustomerByCode_NotFound_ThrowsException() {
            when(customerRepository.findByCustomerCode("INVALID")).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> customerService.getCustomerByCode("INVALID"));

            assertTrue(exception.getMessage().contains("not found"));
        }
    }

    @Nested
    @DisplayName("Pagination Tests")
    class PaginationTests {

        @Test
        @DisplayName("Should get customers with pagination")
        void getCustomersPaged_ReturnsPagedResponse() {
            Page<Customer> page = new PageImpl<>(List.of(testCustomer));
            when(customerRepository.findByFilters(anyString(), anyString(), any(Pageable.class)))
                    .thenReturn(page);

            PageRequestDTO request = PageRequestDTO.builder()
                    .page(0)
                    .size(20)
                    .search("")
                    .status("ACTIVE")
                    .build();

            PagedResponseDTO<CustomerDTO> result = customerService.getCustomersPaged(request);

            assertNotNull(result);
            assertEquals(1, result.getContent().size());
            assertEquals(0, result.getPage());
            assertTrue(result.isFirst());
            assertTrue(result.isLast());
        }
    }

    @Nested
    @DisplayName("Create Customer Tests")
    class CreateCustomerTests {

        @Test
        @DisplayName("Should create customer successfully")
        void createCustomer_ValidData_CreatesSuccessfully() {
            setupSecurityContext();
            when(customerRepository.existsByCustomerCode("CUST-001")).thenReturn(false);
            when(customerRepository.save(any(Customer.class))).thenAnswer(i -> {
                Customer c = i.getArgument(0);
                c.setCustomerId(1L);
                return c;
            });

            CustomerDTO result = customerService.createCustomer(testCustomerDTO);

            assertNotNull(result);
            assertEquals("CUST-001", result.getCustomerCode());
            verify(customerRepository).save(any(Customer.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception for duplicate customer code")
        void createCustomer_DuplicateCode_ThrowsException() {
            setupSecurityContext();
            when(customerRepository.existsByCustomerCode("CUST-001")).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> customerService.createCustomer(testCustomerDTO));

            assertTrue(exception.getMessage().contains("already exists"));
            verify(customerRepository, never()).save(any(Customer.class));
        }
    }

    @Nested
    @DisplayName("Update Customer Tests")
    class UpdateCustomerTests {

        @Test
        @DisplayName("Should update customer successfully")
        void updateCustomer_ValidData_UpdatesSuccessfully() {
            setupSecurityContext();
            when(customerRepository.findById(1L)).thenReturn(Optional.of(testCustomer));
            when(customerRepository.save(any(Customer.class))).thenAnswer(i -> i.getArgument(0));

            testCustomerDTO.setCustomerName("Updated Name");

            CustomerDTO result = customerService.updateCustomer(1L, testCustomerDTO);

            assertNotNull(result);
            assertEquals("Updated Name", result.getCustomerName());
            verify(customerRepository).save(any(Customer.class));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception when updating non-existent customer")
        void updateCustomer_NotFound_ThrowsException() {
            setupSecurityContext();
            when(customerRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> customerService.updateCustomer(999L, testCustomerDTO));

            assertTrue(exception.getMessage().contains("not found"));
        }

        @Test
        @DisplayName("Should throw exception when changing to duplicate code")
        void updateCustomer_DuplicateCode_ThrowsException() {
            setupSecurityContext();
            when(customerRepository.findById(1L)).thenReturn(Optional.of(testCustomer));

            testCustomerDTO.setCustomerCode("CUST-002");
            when(customerRepository.existsByCustomerCode("CUST-002")).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> customerService.updateCustomer(1L, testCustomerDTO));

            assertTrue(exception.getMessage().contains("already exists"));
        }
    }

    @Nested
    @DisplayName("Delete Customer Tests")
    class DeleteCustomerTests {

        @Test
        @DisplayName("Should soft delete customer successfully")
        void deleteCustomer_ExistingCustomer_SoftDeletes() {
            setupSecurityContext();
            when(customerRepository.findById(1L)).thenReturn(Optional.of(testCustomer));
            when(customerRepository.save(any(Customer.class))).thenAnswer(i -> i.getArgument(0));

            customerService.deleteCustomer(1L);

            verify(customerRepository).save(argThat(customer ->
                Customer.STATUS_INACTIVE.equals(customer.getStatus())
            ));
            verify(auditTrailRepository).save(any());
        }

        @Test
        @DisplayName("Should throw exception when deleting non-existent customer")
        void deleteCustomer_NotFound_ThrowsException() {
            setupSecurityContext();
            when(customerRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> customerService.deleteCustomer(999L));

            assertTrue(exception.getMessage().contains("not found"));
        }

        @Test
        @DisplayName("Should hard delete customer")
        void hardDeleteCustomer_ExistingCustomer_Deletes() {
            setupSecurityContext();
            when(customerRepository.findById(1L)).thenReturn(Optional.of(testCustomer));

            customerService.hardDeleteCustomer(1L);

            verify(customerRepository).delete(testCustomer);
            verify(auditTrailRepository).save(any());
        }
    }
}
