package com.mes.production.repository;

import com.mes.production.entity.BatchRelation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BatchRelationRepository extends JpaRepository<BatchRelation, Long> {

    @Query("SELECT br FROM BatchRelation br " +
           "JOIN FETCH br.parentBatch " +
           "JOIN FETCH br.childBatch " +
           "WHERE br.childBatch.batchId = :batchId")
    List<BatchRelation> findParentRelations(@Param("batchId") Long batchId);

    @Query("SELECT br FROM BatchRelation br " +
           "JOIN FETCH br.parentBatch " +
           "JOIN FETCH br.childBatch " +
           "WHERE br.parentBatch.batchId = :batchId")
    List<BatchRelation> findChildRelations(@Param("batchId") Long batchId);

    List<BatchRelation> findByOperationId(Long operationId);

    @Query("SELECT br FROM BatchRelation br " +
           "JOIN FETCH br.parentBatch pb " +
           "JOIN FETCH br.childBatch cb " +
           "WHERE cb.batchId = :batchId " +
           "ORDER BY br.createdOn")
    List<BatchRelation> findGenealogyForBatch(@Param("batchId") Long batchId);
}
