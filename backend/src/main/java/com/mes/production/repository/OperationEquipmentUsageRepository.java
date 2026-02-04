package com.mes.production.repository;

import com.mes.production.entity.OperationEquipmentUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OperationEquipmentUsageRepository extends JpaRepository<OperationEquipmentUsage, Long> {

    /**
     * Find all usage records for an operation
     */
    List<OperationEquipmentUsage> findByOperation_OperationId(Long operationId);

    /**
     * Find all usage records for an equipment
     */
    List<OperationEquipmentUsage> findByEquipment_EquipmentId(Long equipmentId);

    /**
     * Find all usage records for an operator
     */
    List<OperationEquipmentUsage> findByOperator_OperatorId(Long operatorId);

    /**
     * Find usage records by operation and status
     */
    List<OperationEquipmentUsage> findByOperation_OperationIdAndStatus(Long operationId, String status);

    /**
     * Find equipment usage in a time range
     */
    @Query("SELECT u FROM OperationEquipmentUsage u WHERE u.equipment.equipmentId = :equipmentId " +
           "AND ((u.startTime BETWEEN :startTime AND :endTime) OR (u.endTime BETWEEN :startTime AND :endTime))")
    List<OperationEquipmentUsage> findEquipmentUsageInTimeRange(
            @Param("equipmentId") Long equipmentId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    /**
     * Find active equipment usage (not yet ended)
     */
    @Query("SELECT u FROM OperationEquipmentUsage u WHERE u.equipment.equipmentId = :equipmentId AND u.endTime IS NULL")
    List<OperationEquipmentUsage> findActiveEquipmentUsage(@Param("equipmentId") Long equipmentId);

    /**
     * Count usage by equipment and status
     */
    long countByEquipment_EquipmentIdAndStatus(Long equipmentId, String status);

    /**
     * Find usage by operation with equipment details
     */
    @Query("SELECT u FROM OperationEquipmentUsage u JOIN FETCH u.equipment JOIN FETCH u.operator WHERE u.operation.operationId = :operationId")
    List<OperationEquipmentUsage> findByOperationWithDetails(@Param("operationId") Long operationId);
}
