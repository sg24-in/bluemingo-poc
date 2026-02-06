package com.mes.production.dto;

import com.mes.production.entity.DelayReason;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DelayReasonDTO {

    private Long reasonId;

    @NotBlank(message = "Reason code is required")
    @Size(max = 50, message = "Reason code must not exceed 50 characters")
    private String reasonCode;

    @NotBlank(message = "Reason description is required")
    @Size(max = 255, message = "Reason description must not exceed 255 characters")
    private String reasonDescription;

    private String status;

    private LocalDateTime createdOn;
    private String createdBy;
    private LocalDateTime updatedOn;
    private String updatedBy;

    public static DelayReasonDTO fromEntity(DelayReason entity) {
        if (entity == null) return null;

        return DelayReasonDTO.builder()
                .reasonId(entity.getReasonId())
                .reasonCode(entity.getReasonCode())
                .reasonDescription(entity.getReasonDescription())
                .status(entity.getStatus())
                .createdOn(entity.getCreatedOn())
                .createdBy(entity.getCreatedBy())
                .updatedOn(entity.getUpdatedOn())
                .updatedBy(entity.getUpdatedBy())
                .build();
    }

    public DelayReason toEntity() {
        return DelayReason.builder()
                .reasonId(this.reasonId)
                .reasonCode(this.reasonCode)
                .reasonDescription(this.reasonDescription)
                .status(this.status)
                .build();
    }
}
