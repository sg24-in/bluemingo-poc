package com.mes.production.service;

import com.mes.production.dto.UserDTO;
import com.mes.production.entity.User;
import com.mes.production.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    /**
     * Get all users
     */
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get all active users
     */
    public List<UserDTO> getActiveUsers() {
        return userRepository.findAll().stream()
                .filter(u -> "ACTIVE".equals(u.getStatus()))
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get users with pagination
     */
    public Page<UserDTO> getUsersPaged(String search, String status, Pageable pageable) {
        Page<User> users;

        if (search != null && !search.isEmpty() && status != null && !status.isEmpty()) {
            users = userRepository.findByNameContainingIgnoreCaseAndStatus(search, status, pageable);
        } else if (search != null && !search.isEmpty()) {
            users = userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(search, search, pageable);
        } else if (status != null && !status.isEmpty()) {
            users = userRepository.findByStatus(status, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

        return users.map(UserDTO::fromEntity);
    }

    /**
     * Get user by ID
     */
    public UserDTO getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        return UserDTO.fromEntity(user);
    }

    /**
     * Get user by email
     */
    public UserDTO getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        return UserDTO.fromEntity(user);
    }

    /**
     * Create a new user
     */
    @Transactional
    public UserDTO createUser(UserDTO.CreateUserRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("User with email " + request.getEmail() + " already exists");
        }

        String currentUser = getCurrentUsername();

        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .employeeId(request.getEmployeeId())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .status("ACTIVE")
                .createdBy(currentUser)
                .build();

        User savedUser = userRepository.save(user);

        auditService.logCreate("USER", savedUser.getUserId(), "Created user: " + savedUser.getEmail());

        return UserDTO.fromEntity(savedUser);
    }

    /**
     * Update an existing user
     */
    @Transactional
    public UserDTO updateUser(Long userId, UserDTO.UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        String currentUser = getCurrentUsername();

        user.setName(request.getName());
        if (request.getEmployeeId() != null) {
            user.setEmployeeId(request.getEmployeeId());
        }
        if (request.getStatus() != null) {
            user.setStatus(request.getStatus());
        }
        user.setUpdatedBy(currentUser);

        User savedUser = userRepository.save(user);

        auditService.logUpdate("USER", savedUser.getUserId(), "name", null, savedUser.getName());

        return UserDTO.fromEntity(savedUser);
    }

    /**
     * Delete (deactivate) a user
     */
    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        String currentUser = getCurrentUsername();

        // Soft delete - set status to INACTIVE
        String oldStatus = user.getStatus();
        user.setStatus("INACTIVE");
        user.setUpdatedBy(currentUser);
        userRepository.save(user);

        auditService.logStatusChange("USER", userId, oldStatus, "INACTIVE");
    }

    /**
     * Change user's own password
     */
    @Transactional
    public void changePassword(Long userId, UserDTO.ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Current password is incorrect");
        }

        String currentUser = getCurrentUsername();

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedBy(currentUser);
        userRepository.save(user);

        auditService.logUpdate("USER", userId, "password", null, "Password changed");
    }

    /**
     * Admin reset password
     */
    @Transactional
    public void resetPassword(Long userId, UserDTO.ResetPasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        String currentUser = getCurrentUsername();

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedBy(currentUser);
        userRepository.save(user);

        auditService.logUpdate("USER", userId, "password", null, "Password reset by admin");
    }

    /**
     * Activate a user
     */
    @Transactional
    public UserDTO activateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        String currentUser = getCurrentUsername();

        String oldStatus = user.getStatus();
        user.setStatus("ACTIVE");
        user.setUpdatedBy(currentUser);
        User savedUser = userRepository.save(user);

        auditService.logStatusChange("USER", userId, oldStatus, "ACTIVE");

        return UserDTO.fromEntity(savedUser);
    }

    /**
     * Deactivate a user
     */
    @Transactional
    public UserDTO deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        String currentUser = getCurrentUsername();

        String oldStatus = user.getStatus();
        user.setStatus("INACTIVE");
        user.setUpdatedBy(currentUser);
        User savedUser = userRepository.save(user);

        auditService.logStatusChange("USER", userId, oldStatus, "INACTIVE");

        return UserDTO.fromEntity(savedUser);
    }

    private String getCurrentUsername() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "system";
        }
    }
}
