package com.mes.production.repository;

import com.mes.production.entity.Inventory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long>, JpaSpecificationExecutor<Inventory> {

    List<Inventory> findByState(String state);

    // Paginated version
    Page<Inventory> findByState(String state, Pageable pageable);

    List<Inventory> findByInventoryType(String inventoryType);

    // Paginated version
    Page<Inventory> findByInventoryType(String inventoryType, Pageable pageable);

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

    List<Inventory> findByReservedForOrderId(Long orderId);

    List<Inventory> findByReservedForOperationId(Long operationId);

    // Search with pagination
    @Query("SELECT i FROM Inventory i " +
           "LEFT JOIN i.batch b " +
           "WHERE (:state IS NULL OR i.state = :state) AND " +
           "(:type IS NULL OR i.inventoryType = :type) AND " +
           "(:search IS NULL OR LOWER(i.materialId) LIKE :search OR LOWER(i.materialName) LIKE :search OR LOWER(b.batchNumber) LIKE :search)")
    Page<Inventory> findByFilters(@Param("state") String state,
                                   @Param("type") String type,
                                   @Param("search") String search,
                                   Pageable pageable);
}
