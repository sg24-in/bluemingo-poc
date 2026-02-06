package com.mes.production.repository;

import com.mes.production.entity.BatchSizeConfig;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BatchSizeConfigRepository extends JpaRepository<BatchSizeConfig, Long> {

    List<BatchSizeConfig> findByIsActiveTrue();

    /**
     * Find the most specific config for given parameters.
     * Priority order: product > material > operation > equipment > generic
     */
    @Query("SELECT c FROM BatchSizeConfig c WHERE c.isActive = true AND " +
           "(c.productSku = :productSku OR c.productSku IS NULL) AND " +
           "(c.materialId = :materialId OR c.materialId IS NULL) AND " +
           "(c.operationType = :operationType OR c.operationType IS NULL) AND " +
           "(c.equipmentType = :equipmentType OR c.equipmentType IS NULL) " +
           "ORDER BY c.priority DESC, " +
           "CASE WHEN c.productSku IS NOT NULL THEN 4 ELSE 0 END + " +
           "CASE WHEN c.materialId IS NOT NULL THEN 3 ELSE 0 END + " +
           "CASE WHEN c.operationType IS NOT NULL THEN 2 ELSE 0 END + " +
           "CASE WHEN c.equipmentType IS NOT NULL THEN 1 ELSE 0 END DESC")
    List<BatchSizeConfig> findMatchingConfigs(
            @Param("productSku") String productSku,
            @Param("materialId") String materialId,
            @Param("operationType") String operationType,
            @Param("equipmentType") String equipmentType);

    /**
     * Find config by operation type (simple lookup)
     */
    @Query("SELECT c FROM BatchSizeConfig c WHERE c.isActive = true AND " +
           "c.operationType = :operationType AND c.materialId IS NULL AND c.productSku IS NULL " +
           "ORDER BY c.priority DESC")
    List<BatchSizeConfig> findByOperationType(@Param("operationType") String operationType);

    /**
     * Paginated search with filters
     */
    @Query("SELECT c FROM BatchSizeConfig c WHERE " +
           "(:operationType IS NULL OR c.operationType = :operationType) AND " +
           "(:materialId IS NULL OR c.materialId = :materialId) AND " +
           "(:isActive IS NULL OR c.isActive = :isActive) AND " +
           "(:search IS NULL OR LOWER(c.operationType) LIKE :search OR LOWER(c.materialId) LIKE :search)")
    Page<BatchSizeConfig> findByFilters(
            @Param("operationType") String operationType,
            @Param("materialId") String materialId,
            @Param("isActive") Boolean isActive,
            @Param("search") String search,
            Pageable pageable);
}
