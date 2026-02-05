package com.mes.production.dto;

import com.mes.production.entity.Operator;
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
public class OperatorDTO {

    private Long operatorId;

    @NotBlank(message = "Operator code is required")
    @Size(max = 50, message = "Operator code must not exceed 50 characters")
    private String operatorCode;

    @NotBlank(message = "Operator name is required")
    @Size(max = 200, message = "Operator name must not exceed 200 characters")
    private String name;

    @Size(max = 100, message = "Department must not exceed 100 characters")
    private String department;

    @Size(max = 50, message = "Shift must not exceed 50 characters")
    private String shift;

    private String status;

    private LocalDateTime createdOn;
    private String createdBy;
    private LocalDateTime updatedOn;
    private String updatedBy;

    public static OperatorDTO fromEntity(Operator operator) {
        if (operator == null) return null;
        return OperatorDTO.builder()
                .operatorId(operator.getOperatorId())
                .operatorCode(operator.getOperatorCode())
                .name(operator.getName())
                .department(operator.getDepartment())
                .shift(operator.getShift())
                .status(operator.getStatus())
                .createdOn(operator.getCreatedOn())
                .createdBy(operator.getCreatedBy())
                .updatedOn(operator.getUpdatedOn())
                .updatedBy(operator.getUpdatedBy())
                .build();
    }

    public Operator toEntity() {
        return Operator.builder()
                .operatorId(this.operatorId)
                .operatorCode(this.operatorCode)
                .name(this.name)
                .department(this.department)
                .shift(this.shift)
                .status(this.status)
                .build();
    }
}
