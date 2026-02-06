package com.mes.production.repository;

import com.mes.production.entity.HoldReason;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HoldReasonRepository extends JpaRepository<HoldReason, Long> {

    Optional<HoldReason> findByReasonCode(String reasonCode);

    boolean existsByReasonCode(String reasonCode);

    List<HoldReason> findByStatus(String status);

    @Query("SELECT h FROM HoldReason h WHERE h.status = 'ACTIVE' ORDER BY h.reasonCode")
    List<HoldReason> findAllActive();

    @Query("SELECT h FROM HoldReason h WHERE h.status = 'ACTIVE' AND " +
           "(:applicableTo IS NULL OR :applicableTo = '' OR h.applicableTo LIKE %:applicableTo%) " +
           "ORDER BY h.reasonCode")
    List<HoldReason> findActiveByApplicableTo(@Param("applicableTo") String applicableTo);

    @Query("SELECT h FROM HoldReason h WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(h.reasonCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(h.reasonDescription) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR :status = '' OR h.status = :status)")
    Page<HoldReason> findByFilters(
            @Param("search") String search,
            @Param("status") String status,
            Pageable pageable);
}
