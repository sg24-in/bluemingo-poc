package com.mes.production.repository;

import com.mes.production.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BatchRepository extends JpaRepository<Batch, Long> {

    Optional<Batch> findByBatchNumber(String batchNumber);

    List<Batch> findByStatus(String status);

    List<Batch> findByMaterialId(String materialId);

    @Query("SELECT b FROM Batch b WHERE b.status = 'AVAILABLE' AND b.materialId = :materialId")
    List<Batch> findAvailableByMaterialId(@Param("materialId") String materialId);

    @Query("SELECT MAX(CAST(SUBSTRING(b.batchNumber, LENGTH(:prefix) + 1) AS integer)) FROM Batch b WHERE b.batchNumber LIKE :prefix%")
    Optional<Integer> findMaxSequenceByPrefix(@Param("prefix") String prefix);

    @Query("SELECT b FROM Batch b WHERE b.generatedAtOperationId = :operationId")
    List<Batch> findByGeneratedAtOperation(@Param("operationId") Long operationId);
}
