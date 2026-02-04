package com.mes.production.repository;

import com.mes.production.entity.Material;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    Optional<Material> findByMaterialCode(String materialCode);

    Optional<Material> findBySku(String sku);

    boolean existsByMaterialCode(String materialCode);

    boolean existsBySku(String sku);

    List<Material> findByStatus(String status);

    List<Material> findByMaterialType(String materialType);

    List<Material> findByMaterialTypeAndStatus(String materialType, String status);

    @Query("SELECT m FROM Material m WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(m.materialCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.materialName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.sku) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR :status = '' OR m.status = :status) " +
           "AND (:type IS NULL OR :type = '' OR m.materialType = :type)")
    Page<Material> findByFilters(
            @Param("search") String search,
            @Param("status") String status,
            @Param("type") String type,
            Pageable pageable);

    @Query("SELECT m FROM Material m WHERE m.status = 'ACTIVE' ORDER BY m.materialName")
    List<Material> findAllActiveMaterials();

    @Query("SELECT m FROM Material m WHERE m.status = 'ACTIVE' AND m.materialType = :type ORDER BY m.materialName")
    List<Material> findActiveMaterialsByType(@Param("type") String type);

    @Query("SELECT m FROM Material m WHERE m.materialType IN ('RM', 'IM') AND m.status = 'ACTIVE' ORDER BY m.materialName")
    List<Material> findConsumableMaterials();
}
