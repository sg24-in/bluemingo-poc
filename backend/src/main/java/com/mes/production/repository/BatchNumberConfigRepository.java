package com.mes.production.repository;

import com.mes.production.entity.BatchNumberConfig;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BatchNumberConfigRepository extends JpaRepository<BatchNumberConfig, Long> {

    Optional<BatchNumberConfig> findByConfigName(String configName);

    boolean existsByConfigName(String configName);

    List<BatchNumberConfig> findByStatus(String status);

    @Query("SELECT b FROM BatchNumberConfig b WHERE b.status = 'ACTIVE' ORDER BY b.priority")
    List<BatchNumberConfig> findAllActive();

    @Query("SELECT b FROM BatchNumberConfig b WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(b.configName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(b.operationType) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(b.prefix) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR :status = '' OR b.status = :status)")
    Page<BatchNumberConfig> findByFilters(
            @Param("search") String search,
            @Param("status") String status,
            Pageable pageable);
}
