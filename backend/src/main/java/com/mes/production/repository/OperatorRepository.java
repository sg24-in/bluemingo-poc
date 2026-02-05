package com.mes.production.repository;

import com.mes.production.entity.Operator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OperatorRepository extends JpaRepository<Operator, Long> {

    Optional<Operator> findByOperatorCode(String operatorCode);

    boolean existsByOperatorCode(String operatorCode);

    List<Operator> findByStatus(String status);

    List<Operator> findByDepartment(String department);

    List<Operator> findByShift(String shift);

    @Query("SELECT o FROM Operator o WHERE " +
           "(:status IS NULL OR :status = '' OR o.status = :status) AND " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(o.operatorCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(o.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(o.department) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Operator> findByFilters(
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable);
}
