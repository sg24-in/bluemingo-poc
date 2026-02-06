package com.mes.production.repository;

import com.mes.production.entity.ProcessTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for ProcessTemplate entity.
 */
@Repository
public interface ProcessTemplateRepository extends JpaRepository<ProcessTemplate, Long> {

    /**
     * Find by template code
     */
    Optional<ProcessTemplate> findByTemplateCode(String templateCode);

    /**
     * Check if template code exists
     */
    boolean existsByTemplateCode(String templateCode);

    /**
     * Find all templates by status
     */
    List<ProcessTemplate> findByStatus(String status);

    /**
     * Find all active templates
     */
    default List<ProcessTemplate> findAllActive() {
        return findByStatus(ProcessTemplate.STATUS_ACTIVE);
    }

    /**
     * Find templates by product SKU
     */
    List<ProcessTemplate> findByProductSku(String productSku);

    /**
     * Find active template for a product
     */
    @Query("SELECT pt FROM ProcessTemplate pt WHERE pt.productSku = :productSku AND pt.status = 'ACTIVE'")
    List<ProcessTemplate> findActiveByProductSku(@Param("productSku") String productSku);

    /**
     * Find effective template for a product on a given date
     */
    @Query("SELECT pt FROM ProcessTemplate pt WHERE pt.productSku = :productSku " +
           "AND pt.status = 'ACTIVE' " +
           "AND (pt.effectiveFrom IS NULL OR pt.effectiveFrom <= :date) " +
           "AND (pt.effectiveTo IS NULL OR pt.effectiveTo >= :date)")
    List<ProcessTemplate> findEffectiveByProductSku(
            @Param("productSku") String productSku,
            @Param("date") LocalDate date);

    /**
     * Find templates with pagination and filtering
     */
    @Query("SELECT pt FROM ProcessTemplate pt WHERE " +
           "(:status IS NULL OR pt.status = :status) " +
           "AND (:productSku IS NULL OR pt.productSku = :productSku) " +
           "AND (:search IS NULL OR LOWER(pt.templateName) LIKE LOWER(:search) " +
           "     OR LOWER(pt.templateCode) LIKE LOWER(:search))")
    Page<ProcessTemplate> findByFilters(
            @Param("status") String status,
            @Param("productSku") String productSku,
            @Param("search") String search,
            Pageable pageable);

    /**
     * Find all versions of a template by base code
     */
    @Query("SELECT pt FROM ProcessTemplate pt WHERE pt.templateCode LIKE :baseCode || '%' ORDER BY pt.version DESC")
    List<ProcessTemplate> findVersionsByBaseCode(@Param("baseCode") String baseCode);

    /**
     * Count templates by status
     */
    long countByStatus(String status);
}
