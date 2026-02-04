package com.mes.production.repository;

import com.mes.production.entity.Equipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    Optional<Equipment> findByEquipmentCode(String equipmentCode);

    List<Equipment> findByStatus(String status);

    List<Equipment> findByEquipmentType(String equipmentType);

    List<Equipment> findByStatusAndEquipmentType(String status, String equipmentType);

    // Paginated version
    Page<Equipment> findByStatus(String status, Pageable pageable);

    // Search with pagination
    @Query("SELECT e FROM Equipment e WHERE " +
           "(:status IS NULL OR e.status = :status) AND " +
           "(:type IS NULL OR e.equipmentType = :type) AND " +
           "(:search IS NULL OR LOWER(e.equipmentCode) LIKE :search OR LOWER(e.name) LIKE :search)")
    Page<Equipment> findByFilters(@Param("status") String status,
                                   @Param("type") String type,
                                   @Param("search") String search,
                                   Pageable pageable);
}
