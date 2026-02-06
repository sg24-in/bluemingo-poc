package com.mes.production.repository;

import com.mes.production.entity.ProcessParametersConfig;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcessParametersConfigRepository extends JpaRepository<ProcessParametersConfig, Long> {

    List<ProcessParametersConfig> findByStatus(String status);

    @Query("SELECT p FROM ProcessParametersConfig p WHERE p.status = 'ACTIVE' ORDER BY p.operationType, p.displayOrder")
    List<ProcessParametersConfig> findAllActive();

    @Query("SELECT p FROM ProcessParametersConfig p WHERE p.status = 'ACTIVE' " +
           "AND p.operationType = :operationType " +
           "AND (p.productSku = :productSku OR p.productSku IS NULL) " +
           "ORDER BY p.displayOrder")
    List<ProcessParametersConfig> findActiveByOperationTypeAndProduct(
            @Param("operationType") String operationType,
            @Param("productSku") String productSku);

    @Query("SELECT p FROM ProcessParametersConfig p WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(p.operationType) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.parameterName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.productSku) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR :status = '' OR p.status = :status)")
    Page<ProcessParametersConfig> findByFilters(
            @Param("search") String search,
            @Param("status") String status,
            Pageable pageable);
}
