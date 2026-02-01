package com.mes.production.repository;

import com.mes.production.entity.DatabasePatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DatabasePatchRepository extends JpaRepository<DatabasePatch, Long> {

    Optional<DatabasePatch> findByPatchNumber(Integer patchNumber);

    boolean existsByPatchNumber(Integer patchNumber);

    @Query("SELECT MAX(p.patchNumber) FROM DatabasePatch p WHERE p.success = true")
    Optional<Integer> findLastAppliedPatchNumber();

    @Query("SELECT COUNT(p) FROM DatabasePatch p WHERE p.success = true")
    long countAppliedPatches();
}
