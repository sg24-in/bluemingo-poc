package com.mes.production.dto;

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
    private String equipmentType;
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
}
