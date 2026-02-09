package com.mes.production.repository;

import com.mes.production.entity.BillOfMaterial;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BomRepository extends JpaRepository<BillOfMaterial, Long> {

    List<BillOfMaterial> findByProductSkuAndStatus(String productSku, String status);

    List<BillOfMaterial> findByProductSku(String productSku);

    @Query("SELECT b FROM BillOfMaterial b WHERE b.productSku = :productSku AND b.sequenceLevel = :level AND b.status = 'ACTIVE'")
    List<BillOfMaterial> findByProductSkuAndSequenceLevel(@Param("productSku") String productSku, @Param("level") Integer level);

    @Query("SELECT b FROM BillOfMaterial b WHERE b.productSku = :productSku AND b.status = 'ACTIVE' ORDER BY b.sequenceLevel ASC")
    List<BillOfMaterial> findActiveByProductSkuOrderByLevel(@Param("productSku") String productSku);

    @Query("SELECT DISTINCT b.sequenceLevel FROM BillOfMaterial b WHERE b.productSku = :productSku AND b.status = 'ACTIVE' ORDER BY b.sequenceLevel ASC")
    List<Integer> findDistinctLevelsByProductSku(@Param("productSku") String productSku);

    // =====================================================
    // Tree CRUD Queries
    // =====================================================

    /**
     * Find all root nodes (no parent) for a product
     */
    @Query("SELECT b FROM BillOfMaterial b WHERE b.productSku = :productSku AND b.parentBomId IS NULL AND b.status = 'ACTIVE' ORDER BY b.sequenceLevel ASC")
    List<BillOfMaterial> findRootNodesByProductSku(@Param("productSku") String productSku);

    /**
     * Find all children of a parent node
     */
    @Query("SELECT b FROM BillOfMaterial b WHERE b.parentBomId = :parentBomId AND b.status = 'ACTIVE' ORDER BY b.sequenceLevel ASC")
    List<BillOfMaterial> findByParentBomId(@Param("parentBomId") Long parentBomId);

    /**
     * Find all children of a parent node (including inactive)
     */
    List<BillOfMaterial> findByParentBomIdOrderBySequenceLevelAsc(Long parentBomId);

    /**
     * Count children of a node
     */
    @Query("SELECT COUNT(b) FROM BillOfMaterial b WHERE b.parentBomId = :parentBomId AND b.status = 'ACTIVE'")
    int countChildrenByParentBomId(@Param("parentBomId") Long parentBomId);

    /**
     * Find by product and version
     */
    @Query("SELECT b FROM BillOfMaterial b WHERE b.productSku = :productSku AND b.bomVersion = :version ORDER BY b.sequenceLevel ASC")
    List<BillOfMaterial> findByProductSkuAndBomVersion(@Param("productSku") String productSku, @Param("version") String version);

    /**
     * Find active BOMs by product and version
     */
    @Query("SELECT b FROM BillOfMaterial b WHERE b.productSku = :productSku AND b.bomVersion = :version AND b.status = 'ACTIVE' ORDER BY b.sequenceLevel ASC")
    List<BillOfMaterial> findActiveByProductSkuAndBomVersion(@Param("productSku") String productSku, @Param("version") String version);

    /**
     * Get distinct products with BOMs
     */
    @Query("SELECT DISTINCT b.productSku FROM BillOfMaterial b WHERE b.status = 'ACTIVE' ORDER BY b.productSku")
    List<String> findDistinctProductSkus();

    /**
     * Get distinct versions for a product
     */
    @Query("SELECT DISTINCT b.bomVersion FROM BillOfMaterial b WHERE b.productSku = :productSku ORDER BY b.bomVersion")
    List<String> findDistinctVersionsByProductSku(@Param("productSku") String productSku);

    /**
     * Get max sequence level for a product
     */
    @Query("SELECT MAX(b.sequenceLevel) FROM BillOfMaterial b WHERE b.productSku = :productSku AND b.status = 'ACTIVE'")
    Integer findMaxSequenceLevelByProductSku(@Param("productSku") String productSku);

    /**
     * Check if material exists in BOM
     */
    @Query("SELECT COUNT(b) > 0 FROM BillOfMaterial b WHERE b.productSku = :productSku AND b.materialId = :materialId AND b.status = 'ACTIVE'")
    boolean existsByProductSkuAndMaterialId(@Param("productSku") String productSku, @Param("materialId") String materialId);

    // =====================================================
    // TASK-P3: Pagination Queries
    // =====================================================

    /**
     * Get distinct product SKUs with filters for pagination.
     * Supports search by productSku.
     */
    @Query("SELECT DISTINCT b.productSku FROM BillOfMaterial b " +
           "WHERE b.status = 'ACTIVE' " +
           "AND (:search IS NULL OR LOWER(b.productSku) LIKE :search) " +
           "ORDER BY b.productSku")
    Page<String> findDistinctProductSkusPaged(@Param("search") String search, Pageable pageable);

    /**
     * Count distinct products with active BOMs
     */
    @Query("SELECT COUNT(DISTINCT b.productSku) FROM BillOfMaterial b WHERE b.status = 'ACTIVE'")
    long countDistinctActiveProducts();

    /**
     * Count distinct products matching search
     */
    @Query("SELECT COUNT(DISTINCT b.productSku) FROM BillOfMaterial b " +
           "WHERE b.status = 'ACTIVE' " +
           "AND (:search IS NULL OR LOWER(b.productSku) LIKE :search)")
    long countDistinctProductsBySearch(@Param("search") String search);
}
