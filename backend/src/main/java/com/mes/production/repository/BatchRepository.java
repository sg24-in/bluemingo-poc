package com.mes.production.repository;

import com.mes.production.entity.Batch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BatchRepository extends JpaRepository<Batch, Long>, JpaSpecificationExecutor<Batch> {

    Optional<Batch> findByBatchNumber(String batchNumber);

    boolean existsByBatchNumber(String batchNumber);

    List<Batch> findByStatus(String status);

    // Count by status
    Long countByStatus(String status);

    // Paginated version
    Page<Batch> findByStatus(String status, Pageable pageable);

    List<Batch> findByMaterialId(String materialId);

    @Query("SELECT b FROM Batch b WHERE b.status = 'AVAILABLE' AND b.materialId = :materialId")
    List<Batch> findAvailableByMaterialId(@Param("materialId") String materialId);

    @Query("SELECT MAX(CAST(SUBSTRING(b.batchNumber, LENGTH(:prefix) + 1) AS integer)) FROM Batch b WHERE b.batchNumber LIKE :prefix%")
    Optional<Integer> findMaxSequenceByPrefix(@Param("prefix") String prefix);

    @Query("SELECT b FROM Batch b WHERE b.generatedAtOperationId = :operationId")
    List<Batch> findByGeneratedAtOperation(@Param("operationId") Long operationId);

    // Search with pagination
    @Query("SELECT b FROM Batch b WHERE " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:materialId IS NULL OR b.materialId = :materialId) AND " +
           "(:search IS NULL OR LOWER(b.batchNumber) LIKE :search OR LOWER(b.materialName) LIKE :search)")
    Page<Batch> findByFilters(@Param("status") String status,
                               @Param("materialId") String materialId,
                               @Param("search") String search,
                               Pageable pageable);
}
