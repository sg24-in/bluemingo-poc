package com.mes.production.repository;

import com.mes.production.entity.BillOfMaterial;
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
}
