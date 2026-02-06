package com.mes.production.repository;

import com.mes.production.entity.QuantityTypeConfig;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuantityTypeConfigRepository extends JpaRepository<QuantityTypeConfig, Long> {

    Optional<QuantityTypeConfig> findByConfigName(String configName);

    boolean existsByConfigName(String configName);

    @Query("SELECT q FROM QuantityTypeConfig q WHERE q.status = 'ACTIVE' ORDER BY q.configName")
    List<QuantityTypeConfig> findAllActive();

    @Query("SELECT q FROM QuantityTypeConfig q WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(q.configName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(q.materialCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(q.operationType) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(q.unit) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR :status = '' OR q.status = :status)")
    Page<QuantityTypeConfig> findByFilters(
            @Param("search") String search,
            @Param("status") String status,
            Pageable pageable);
}
