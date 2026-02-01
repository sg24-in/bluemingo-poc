package com.mes.production.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "database_patches")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DatabasePatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patch_number", nullable = false, unique = true)
    private Integer patchNumber;

    @Column(name = "patch_name", nullable = false)
    private String patchName;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "applied_on", nullable = false)
    private LocalDateTime appliedOn;

    @Column(name = "applied_by")
    private String appliedBy;

    @Column(name = "execution_time_ms")
    private Long executionTimeMs;

    @Column(name = "checksum")
    private String checksum;

    @Column(name = "success", nullable = false)
    private Boolean success;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
