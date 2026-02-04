package com.mes.production.repository;

import com.mes.production.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByCustomerCode(String customerCode);

    boolean existsByCustomerCode(String customerCode);

    List<Customer> findByStatus(String status);

    List<Customer> findByStatusOrderByCustomerNameAsc(String status);

    @Query("SELECT c FROM Customer c WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(c.customerCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.customerName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.contactPerson) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR :status = '' OR c.status = :status)")
    Page<Customer> findByFilters(
            @Param("search") String search,
            @Param("status") String status,
            Pageable pageable);

    @Query("SELECT c FROM Customer c WHERE c.status = 'ACTIVE' ORDER BY c.customerName")
    List<Customer> findAllActiveCustomers();
}
