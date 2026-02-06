package com.mes.production.dto;

import com.mes.production.entity.User;
import jakarta.validation.constraints.Email;
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
public class UserDTO {

    private Long userId;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @Size(max = 50, message = "Employee ID must not exceed 50 characters")
    private String employeeId;

    private String status;

    private LocalDateTime createdOn;
    private String createdBy;
    private LocalDateTime updatedOn;
    private String updatedBy;

    // Convert entity to DTO (excludes password)
    public static UserDTO fromEntity(User user) {
        if (user == null) return null;

        return UserDTO.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .name(user.getName())
                .employeeId(user.getEmployeeId())
                .status(user.getStatus())
                .createdOn(user.getCreatedOn())
                .createdBy(user.getCreatedBy())
                .updatedOn(user.getUpdatedOn())
                .updatedBy(user.getUpdatedBy())
                .build();
    }

    // Convert DTO to entity (password must be set separately)
    public User toEntity() {
        return User.builder()
                .userId(this.userId)
                .email(this.email)
                .name(this.name)
                .employeeId(this.employeeId)
                .status(this.status != null ? this.status : "ACTIVE")
                .build();
    }

    /**
     * Request DTO for creating a new user
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateUserRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Name is required")
        private String name;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        private String employeeId;
    }

    /**
     * Request DTO for updating a user
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateUserRequest {
        @NotBlank(message = "Name is required")
        private String name;

        private String employeeId;
        private String status;
    }

    /**
     * Request DTO for changing password
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChangePasswordRequest {
        @NotBlank(message = "Current password is required")
        private String currentPassword;

        @NotBlank(message = "New password is required")
        @Size(min = 6, message = "New password must be at least 6 characters")
        private String newPassword;
    }

    /**
     * Request DTO for admin password reset
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResetPasswordRequest {
        @NotBlank(message = "New password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String newPassword;
    }
}
