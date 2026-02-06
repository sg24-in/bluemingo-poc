package com.mes.production.dto;

import com.mes.production.entity.HoldReason;
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
public class HoldReasonDTO {

    private Long reasonId;

    @NotBlank(message = "Reason code is required")
    @Size(max = 50, message = "Reason code must not exceed 50 characters")
    private String reasonCode;

    @NotBlank(message = "Reason description is required")
    @Size(max = 255, message = "Reason description must not exceed 255 characters")
    private String reasonDescription;

    @Size(max = 100, message = "Applicable to must not exceed 100 characters")
    private String applicableTo;

    private String status;

    private LocalDateTime createdOn;
    private String createdBy;
    private LocalDateTime updatedOn;
    private String updatedBy;

    public static HoldReasonDTO fromEntity(HoldReason entity) {
        if (entity == null) return null;

        return HoldReasonDTO.builder()
                .reasonId(entity.getReasonId())
                .reasonCode(entity.getReasonCode())
                .reasonDescription(entity.getReasonDescription())
                .applicableTo(entity.getApplicableTo())
                .status(entity.getStatus())
                .createdOn(entity.getCreatedOn())
                .createdBy(entity.getCreatedBy())
                .updatedOn(entity.getUpdatedOn())
                .updatedBy(entity.getUpdatedBy())
                .build();
    }

    public HoldReason toEntity() {
        return HoldReason.builder()
                .reasonId(this.reasonId)
                .reasonCode(this.reasonCode)
                .reasonDescription(this.reasonDescription)
                .applicableTo(this.applicableTo)
                .status(this.status)
                .build();
    }
}
