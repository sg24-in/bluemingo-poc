package com.mes.production.repository;

import com.mes.production.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByStatus(String status);

    @Query("SELECT DISTINCT o FROM Order o " +
           "JOIN o.lineItems li " +
           "JOIN li.processes p " +
           "JOIN p.operations op " +
           "WHERE op.status = 'READY'")
    List<Order> findOrdersWithReadyOperations();

    @Query("SELECT o FROM Order o WHERE o.status IN ('CREATED', 'IN_PROGRESS')")
    List<Order> findActiveOrders();
}
