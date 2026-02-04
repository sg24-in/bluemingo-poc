package com.mes.production.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class HoldDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplyHoldRequest {
        @NotBlank(message = "Entity type is required")
        private String entityType;

        @NotNull(message = "Entity ID is required")
        private Long entityId;

        @NotBlank(message = "Hold reason is required")
        private String reason;

        private String comments;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReleaseHoldRequest {
        private String releaseComments;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HoldResponse {
        private Long holdId;
        private String entityType;
        private Long entityId;
        private String entityName;
        private String reason;
        private String comments;
        private String appliedBy;
        private LocalDateTime appliedOn;
        private String releasedBy;
        private LocalDateTime releasedOn;
        private String releaseComments;
        private String status;
        private Long durationMinutes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HoldCountResponse {
        private Long activeHolds;
    }
}
