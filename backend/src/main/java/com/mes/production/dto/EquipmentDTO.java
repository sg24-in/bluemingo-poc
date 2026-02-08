package com.mes.production.dto;

import com.mes.production.entity.Equipment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentDTO {

    private Long equipmentId;
    private String equipmentCode;
    private String name;
    private String equipmentType;      // Processing mode: BATCH/CONTINUOUS
    private String equipmentCategory;  // Equipment function: MELTING, CASTING, etc.
    private BigDecimal capacity;
    private String capacityUnit;
    private String location;
    private String status;

    // Maintenance info
    private String maintenanceReason;
    private LocalDateTime maintenanceStart;
    private String maintenanceBy;
    private LocalDateTime expectedMaintenanceEnd;

    // Hold info
    private String holdReason;
    private LocalDateTime holdStart;
    private String heldBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateResponse {
        private Long equipmentId;
        private String equipmentCode;
        private String previousStatus;
        private String newStatus;
        private String message;
        private String updatedBy;
        private LocalDateTime updatedOn;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MaintenanceRequest {
        private Long equipmentId;
        private String reason;
        private LocalDateTime expectedEndTime;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HoldRequest {
        private Long equipmentId;
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateEquipmentRequest {
        @NotBlank(message = "Equipment code is required")
        @Size(max = 50, message = "Equipment code must not exceed 50 characters")
        private String equipmentCode;

        @NotBlank(message = "Equipment name is required")
        @Size(max = 200, message = "Equipment name must not exceed 200 characters")
        private String name;

        @NotBlank(message = "Equipment type is required")
        private String equipmentType;

        private String equipmentCategory;  // Equipment function: MELTING, CASTING, etc.

        private BigDecimal capacity;
        private String capacityUnit;
        private String location;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateEquipmentRequest {
        @NotBlank(message = "Equipment code is required")
        @Size(max = 50, message = "Equipment code must not exceed 50 characters")
        private String equipmentCode;

        @NotBlank(message = "Equipment name is required")
        @Size(max = 200, message = "Equipment name must not exceed 200 characters")
        private String name;

        @NotBlank(message = "Equipment type is required")
        private String equipmentType;

        private String equipmentCategory;  // Equipment function: MELTING, CASTING, etc.

        private BigDecimal capacity;
        private String capacityUnit;
        private String location;
        private String status;
    }

    public static EquipmentDTO fromEntity(Equipment equipment) {
        if (equipment == null) return null;
        return EquipmentDTO.builder()
                .equipmentId(equipment.getEquipmentId())
                .equipmentCode(equipment.getEquipmentCode())
                .name(equipment.getName())
                .equipmentType(equipment.getEquipmentType())
                .equipmentCategory(equipment.getEquipmentCategory())
                .capacity(equipment.getCapacity())
                .capacityUnit(equipment.getCapacityUnit())
                .location(equipment.getLocation())
                .status(equipment.getStatus())
                .maintenanceReason(equipment.getMaintenanceReason())
                .maintenanceStart(equipment.getMaintenanceStart())
                .maintenanceBy(equipment.getMaintenanceBy())
                .expectedMaintenanceEnd(equipment.getExpectedMaintenanceEnd())
                .holdReason(equipment.getHoldReason())
                .holdStart(equipment.getHoldStart())
                .heldBy(equipment.getHeldBy())
                .build();
    }
}
