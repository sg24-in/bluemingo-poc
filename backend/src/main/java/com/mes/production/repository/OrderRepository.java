package com.mes.production.repository;

import com.mes.production.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    List<Order> findByStatus(String status);

    // Paginated versions
    Page<Order> findByStatus(String status, Pageable pageable);

    // Per MES Spec: Operations are directly on OrderLineItem (not via Process)
    @Query("SELECT DISTINCT o FROM Order o " +
           "JOIN o.lineItems li " +
           "JOIN li.operations op " +
           "WHERE op.status = 'READY'")
    List<Order> findOrdersWithReadyOperations();

    @Query("SELECT DISTINCT o FROM Order o " +
           "JOIN o.lineItems li " +
           "JOIN li.operations op " +
           "WHERE op.status = 'READY'")
    Page<Order> findOrdersWithReadyOperations(Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.status IN ('CREATED', 'IN_PROGRESS')")
    List<Order> findActiveOrders();

    @Query("SELECT o FROM Order o WHERE o.status IN ('CREATED', 'IN_PROGRESS')")
    Page<Order> findActiveOrders(Pageable pageable);

    // Search with pagination
    @Query("SELECT o FROM Order o WHERE " +
           "LOWER(o.orderNumber) LIKE :search OR " +
           "LOWER(o.customerName) LIKE :search")
    Page<Order> searchOrders(@Param("search") String search, Pageable pageable);

    // Filter by status with search and pagination
    @Query("SELECT o FROM Order o WHERE " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:search IS NULL OR LOWER(o.orderNumber) LIKE :search OR LOWER(o.customerName) LIKE :search)")
    Page<Order> findByFilters(@Param("status") String status,
                               @Param("search") String search,
                               Pageable pageable);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status IN :statuses")
    Long countByStatusIn(@Param("statuses") List<String> statuses);

    Long countByStatus(String status);

    boolean existsByOrderNumber(String orderNumber);

    java.util.Optional<Order> findByOrderNumber(String orderNumber);

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(o.orderNumber, 5) AS integer)), 0) FROM Order o WHERE o.orderNumber LIKE 'ORD-%'")
    Integer findMaxOrderNumberSequence();
}
