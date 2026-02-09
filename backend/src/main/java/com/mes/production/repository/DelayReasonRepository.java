package com.mes.production.repository;

import com.mes.production.entity.DelayReason;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DelayReasonRepository extends JpaRepository<DelayReason, Long> {

    Optional<DelayReason> findByReasonCode(String reasonCode);

    boolean existsByReasonCode(String reasonCode);

    List<DelayReason> findByStatus(String status);

    @Query("SELECT d FROM DelayReason d WHERE d.status = 'ACTIVE' ORDER BY d.reasonCode")
    List<DelayReason> findAllActive();

    @Query("SELECT d FROM DelayReason d WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(d.reasonCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(d.reasonDescription) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR :status = '' OR d.status = :status)")
    Page<DelayReason> findByFilters(
            @Param("search") String search,
            @Param("status") String status,
            Pageable pageable);
}
