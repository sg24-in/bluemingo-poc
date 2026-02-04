package com.mes.production.repository;

import com.mes.production.entity.ProductionConfirmation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProductionConfirmationRepository extends JpaRepository<ProductionConfirmation, Long> {

    List<ProductionConfirmation> findByOperation_OperationId(Long operationId);

    @Query("SELECT pc FROM ProductionConfirmation pc " +
           "JOIN FETCH pc.operation op " +
           "WHERE pc.createdOn >= :startDate AND pc.createdOn <= :endDate " +
           "ORDER BY pc.createdOn DESC")
    List<ProductionConfirmation> findByDateRange(@Param("startDate") LocalDateTime startDate,
                                                  @Param("endDate") LocalDateTime endDate);

    @Query("SELECT pc FROM ProductionConfirmation pc " +
           "JOIN FETCH pc.operation op " +
           "ORDER BY pc.createdOn DESC")
    List<ProductionConfirmation> findAllWithOperation();

    @Query("SELECT COUNT(pc) FROM ProductionConfirmation pc WHERE pc.createdOn >= :startOfDay")
    long countTodayConfirmations(@Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT COUNT(pc) FROM ProductionConfirmation pc WHERE pc.createdOn >= :startTime")
    Long countByCreatedOnAfter(@Param("startTime") LocalDateTime startTime);

    @Query("SELECT pc FROM ProductionConfirmation pc " +
           "LEFT JOIN FETCH pc.operation op " +
           "LEFT JOIN FETCH op.process p " +
           "LEFT JOIN FETCH p.orderLineItem oli " +
           "ORDER BY pc.createdOn DESC")
    List<ProductionConfirmation> findRecentConfirmations(Pageable pageable);

    List<ProductionConfirmation> findByStatus(String status);

    @Query("SELECT pc FROM ProductionConfirmation pc " +
           "LEFT JOIN FETCH pc.operation op " +
           "WHERE pc.status = :status " +
           "ORDER BY pc.createdOn DESC")
    List<ProductionConfirmation> findByStatusWithOperation(@Param("status") String status);
}
