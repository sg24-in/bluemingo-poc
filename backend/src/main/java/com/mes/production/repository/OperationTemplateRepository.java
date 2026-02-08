package com.mes.production.repository;

import com.mes.production.entity.OperationTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for OperationTemplate - Design-time operation definitions.
 */
@Repository
public interface OperationTemplateRepository extends JpaRepository<OperationTemplate, Long> {

    /**
     * Find all active operation templates.
     */
    List<OperationTemplate> findByStatus(String status);

    /**
     * Find active operation templates.
     */
    default List<OperationTemplate> findActive() {
        return findByStatus(OperationTemplate.STATUS_ACTIVE);
    }

    /**
     * Find by operation type.
     */
    List<OperationTemplate> findByOperationType(String operationType);

    /**
     * Find by operation type and status.
     */
    List<OperationTemplate> findByOperationTypeAndStatus(String operationType, String status);

    /**
     * Find by operation code.
     */
    Optional<OperationTemplate> findByOperationCode(String operationCode);

    /**
     * Find by operation name (case-insensitive).
     */
    @Query("SELECT ot FROM OperationTemplate ot WHERE LOWER(ot.operationName) = LOWER(:name)")
    Optional<OperationTemplate> findByOperationNameIgnoreCase(@Param("name") String name);

    /**
     * Search templates by name or type.
     */
    @Query("SELECT ot FROM OperationTemplate ot WHERE " +
           "(LOWER(ot.operationName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(ot.operationType) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(ot.operationCode) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<OperationTemplate> searchByNameOrType(@Param("search") String search);

    /**
     * Paginated search with filters.
     */
    @Query("SELECT ot FROM OperationTemplate ot WHERE " +
           "(:status IS NULL OR ot.status = :status) AND " +
           "(:type IS NULL OR ot.operationType = :type) AND " +
           "(:search IS NULL OR " +
           " LOWER(ot.operationName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(ot.operationType) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(ot.operationCode) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<OperationTemplate> findByFilters(
            @Param("status") String status,
            @Param("type") String type,
            @Param("search") String search,
            Pageable pageable);

    /**
     * Get distinct operation types.
     */
    @Query("SELECT DISTINCT ot.operationType FROM OperationTemplate ot ORDER BY ot.operationType")
    List<String> findDistinctOperationTypes();

    /**
     * Count by status.
     */
    long countByStatus(String status);
}
