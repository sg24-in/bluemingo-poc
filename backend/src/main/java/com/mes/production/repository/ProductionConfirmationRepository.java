package com.mes.production.repository;

import com.mes.production.entity.ProductionConfirmation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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

    @Query("SELECT COUNT(pc) FROM ProductionConfirmation pc WHERE DATE(pc.createdOn) = CURRENT_DATE")
    long countTodayConfirmations();
}
