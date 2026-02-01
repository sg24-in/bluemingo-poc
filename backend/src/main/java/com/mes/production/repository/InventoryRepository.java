package com.mes.production.repository;

import com.mes.production.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    List<Inventory> findByState(String state);

    List<Inventory> findByInventoryType(String inventoryType);

    @Query("SELECT i FROM Inventory i WHERE i.state = 'AVAILABLE' AND i.materialId = :materialId")
    List<Inventory> findAvailableByMaterialId(@Param("materialId") String materialId);

    @Query("SELECT i FROM Inventory i " +
           "LEFT JOIN FETCH i.batch " +
           "WHERE i.state = 'AVAILABLE' " +
           "ORDER BY i.materialId, i.createdOn")
    List<Inventory> findAllAvailableWithBatch();

    @Query("SELECT i FROM Inventory i " +
           "LEFT JOIN FETCH i.batch " +
           "WHERE i.state = 'AVAILABLE' AND i.inventoryType IN ('RM', 'IM')")
    List<Inventory> findAvailableRawAndIntermediates();

    List<Inventory> findByBatch_BatchId(Long batchId);
}
