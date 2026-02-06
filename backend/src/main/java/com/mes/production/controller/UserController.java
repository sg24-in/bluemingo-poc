package com.mes.production.controller;

import com.mes.production.dto.PagedResponseDTO;
import com.mes.production.dto.UserDTO;
import com.mes.production.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Get all users
     */
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /**
     * Get active users only
     */
    @GetMapping("/active")
    public ResponseEntity<List<UserDTO>> getActiveUsers() {
        return ResponseEntity.ok(userService.getActiveUsers());
    }

    /**
     * Get users with pagination
     */
    @GetMapping("/paged")
    public ResponseEntity<PagedResponseDTO<UserDTO>> getUsersPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "userId") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {

        Sort sort = sortDirection.equalsIgnoreCase("DESC")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<UserDTO> users = userService.getUsersPaged(search, status, pageable);

        PagedResponseDTO<UserDTO> response = PagedResponseDTO.<UserDTO>builder()
                .content(users.getContent())
                .page(users.getNumber())
                .size(users.getSize())
                .totalElements(users.getTotalElements())
                .totalPages(users.getTotalPages())
                .first(users.isFirst())
                .last(users.isLast())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Get user by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable("id") Long userId) {
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    /**
     * Create a new user
     */
    @PostMapping
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserDTO.CreateUserRequest request) {
        return ResponseEntity.ok(userService.createUser(request));
    }

    /**
     * Update a user
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable("id") Long userId,
            @Valid @RequestBody UserDTO.UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(userId, request));
    }

    /**
     * Delete (deactivate) a user
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable("id") Long userId) {
        userService.deleteUser(userId);
        return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
    }

    /**
     * Change current user's password (uses JWT to identify user)
     */
    @PostMapping("/me/change-password")
    public ResponseEntity<Map<String, String>> changeCurrentUserPassword(
            @Valid @RequestBody UserDTO.ChangePasswordRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            org.springframework.security.core.userdetails.UserDetails userDetails) {
        userService.changePasswordByEmail(userDetails.getUsername(), request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    /**
     * Change password by user ID (admin)
     */
    @PostMapping("/{id}/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @PathVariable("id") Long userId,
            @Valid @RequestBody UserDTO.ChangePasswordRequest request) {
        userService.changePassword(userId, request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    /**
     * Admin reset password
     */
    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @PathVariable("id") Long userId,
            @Valid @RequestBody UserDTO.ResetPasswordRequest request) {
        userService.resetPassword(userId, request);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    /**
     * Activate a user
     */
    @PostMapping("/{id}/activate")
    public ResponseEntity<UserDTO> activateUser(@PathVariable("id") Long userId) {
        return ResponseEntity.ok(userService.activateUser(userId));
    }

    /**
     * Deactivate a user
     */
    @PostMapping("/{id}/deactivate")
    public ResponseEntity<UserDTO> deactivateUser(@PathVariable("id") Long userId) {
        return ResponseEntity.ok(userService.deactivateUser(userId));
    }
}
