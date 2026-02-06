package com.mes.production.service;

import com.mes.production.dto.UserDTO;
import com.mes.production.entity.User;
import com.mes.production.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private UserDTO testUserDTO;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .userId(1L)
                .email("test@example.com")
                .name("Test User")
                .employeeId("EMP001")
                .passwordHash("hashedPassword")
                .status("ACTIVE")
                .createdOn(LocalDateTime.now())
                .createdBy("admin")
                .build();

        testUserDTO = UserDTO.fromEntity(testUser);
    }

    @Test
    void getAllUsers_ShouldReturnAllUsers() {
        User user2 = User.builder()
                .userId(2L)
                .email("user2@example.com")
                .name("User Two")
                .status("ACTIVE")
                .build();

        when(userRepository.findAll()).thenReturn(Arrays.asList(testUser, user2));

        List<UserDTO> result = userService.getAllUsers();

        assertEquals(2, result.size());
        assertEquals("test@example.com", result.get(0).getEmail());
        assertEquals("user2@example.com", result.get(1).getEmail());
    }

    @Test
    void getActiveUsers_ShouldReturnOnlyActiveUsers() {
        User inactiveUser = User.builder()
                .userId(2L)
                .email("inactive@example.com")
                .name("Inactive User")
                .status("INACTIVE")
                .build();

        when(userRepository.findAll()).thenReturn(Arrays.asList(testUser, inactiveUser));

        List<UserDTO> result = userService.getActiveUsers();

        assertEquals(1, result.size());
        assertEquals("test@example.com", result.get(0).getEmail());
    }

    @Test
    void getUsersPaged_ShouldReturnPagedResults() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> userPage = new PageImpl<>(List.of(testUser), pageable, 1);

        when(userRepository.findAll(pageable)).thenReturn(userPage);

        Page<UserDTO> result = userService.getUsersPaged(null, null, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("test@example.com", result.getContent().get(0).getEmail());
    }

    @Test
    void getUsersPaged_WithSearch_ShouldFilterByNameOrEmail() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> userPage = new PageImpl<>(List.of(testUser), pageable, 1);

        when(userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                eq("test"), eq("test"), eq(pageable))).thenReturn(userPage);

        Page<UserDTO> result = userService.getUsersPaged("test", null, pageable);

        assertEquals(1, result.getTotalElements());
        verify(userRepository).findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase("test", "test", pageable);
    }

    @Test
    void getUsersPaged_WithStatus_ShouldFilterByStatus() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> userPage = new PageImpl<>(List.of(testUser), pageable, 1);

        when(userRepository.findByStatus(eq("ACTIVE"), eq(pageable))).thenReturn(userPage);

        Page<UserDTO> result = userService.getUsersPaged(null, "ACTIVE", pageable);

        assertEquals(1, result.getTotalElements());
        verify(userRepository).findByStatus("ACTIVE", pageable);
    }

    @Test
    void getUserById_WhenExists_ShouldReturnUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        UserDTO result = userService.getUserById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getUserId());
        assertEquals("test@example.com", result.getEmail());
    }

    @Test
    void getUserById_WhenNotExists_ShouldThrowException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> userService.getUserById(99L));
    }

    @Test
    void getUserByEmail_WhenExists_ShouldReturnUser() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        UserDTO result = userService.getUserByEmail("test@example.com");

        assertNotNull(result);
        assertEquals("test@example.com", result.getEmail());
    }

    @Test
    void getUserByEmail_WhenNotExists_ShouldThrowException() {
        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> userService.getUserByEmail("notfound@example.com"));
    }

    @Test
    void createUser_WithValidData_ShouldCreateUser() {
        UserDTO.CreateUserRequest request = UserDTO.CreateUserRequest.builder()
                .email("new@example.com")
                .name("New User")
                .password("password123")
                .employeeId("EMP002")
                .build();

        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            user.setUserId(2L);
            return user;
        });

        UserDTO result = userService.createUser(request);

        assertNotNull(result);
        assertEquals("new@example.com", result.getEmail());
        assertEquals("New User", result.getName());
        verify(userRepository).save(any(User.class));
        verify(auditService).logCreate(eq("USER"), eq(2L), anyString());
    }

    @Test
    void createUser_WithExistingEmail_ShouldThrowException() {
        UserDTO.CreateUserRequest request = UserDTO.CreateUserRequest.builder()
                .email("test@example.com")
                .name("New User")
                .password("password123")
                .build();

        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        assertThrows(RuntimeException.class, () -> userService.createUser(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUser_WithValidData_ShouldUpdateUser() {
        UserDTO.UpdateUserRequest request = UserDTO.UpdateUserRequest.builder()
                .name("Updated Name")
                .employeeId("EMP999")
                .status("ACTIVE")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserDTO result = userService.updateUser(1L, request);

        assertNotNull(result);
        verify(userRepository).save(any(User.class));
        verify(auditService).logUpdate(eq("USER"), eq(1L), anyString(), any(), anyString());
    }

    @Test
    void updateUser_WhenNotExists_ShouldThrowException() {
        UserDTO.UpdateUserRequest request = UserDTO.UpdateUserRequest.builder()
                .name("Updated Name")
                .build();

        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> userService.updateUser(99L, request));
    }

    @Test
    void deleteUser_ShouldDeactivateUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        userService.deleteUser(1L);

        assertEquals("INACTIVE", testUser.getStatus());
        verify(userRepository).save(testUser);
        verify(auditService).logStatusChange(eq("USER"), eq(1L), anyString(), eq("INACTIVE"));
    }

    @Test
    void changePassword_WithCorrectCurrentPassword_ShouldChangePassword() {
        UserDTO.ChangePasswordRequest request = UserDTO.ChangePasswordRequest.builder()
                .currentPassword("oldPassword")
                .newPassword("newPassword123")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("oldPassword", "hashedPassword")).thenReturn(true);
        when(passwordEncoder.encode("newPassword123")).thenReturn("newHashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        assertDoesNotThrow(() -> userService.changePassword(1L, request));
        verify(userRepository).save(testUser);
        verify(auditService).logUpdate(eq("USER"), eq(1L), eq("password"), any(), anyString());
    }

    @Test
    void changePassword_WithIncorrectCurrentPassword_ShouldThrowException() {
        UserDTO.ChangePasswordRequest request = UserDTO.ChangePasswordRequest.builder()
                .currentPassword("wrongPassword")
                .newPassword("newPassword123")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPassword", "hashedPassword")).thenReturn(false);

        assertThrows(RuntimeException.class, () -> userService.changePassword(1L, request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void resetPassword_ShouldResetPassword() {
        UserDTO.ResetPasswordRequest request = UserDTO.ResetPasswordRequest.builder()
                .newPassword("resetPassword123")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.encode("resetPassword123")).thenReturn("resetHashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        assertDoesNotThrow(() -> userService.resetPassword(1L, request));
        verify(userRepository).save(testUser);
        verify(auditService).logUpdate(eq("USER"), eq(1L), eq("password"), any(), anyString());
    }

    @Test
    void activateUser_ShouldSetStatusToActive() {
        testUser.setStatus("INACTIVE");
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserDTO result = userService.activateUser(1L);

        assertEquals("ACTIVE", testUser.getStatus());
        verify(auditService).logStatusChange(eq("USER"), eq(1L), anyString(), eq("ACTIVE"));
    }

    @Test
    void deactivateUser_ShouldSetStatusToInactive() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserDTO result = userService.deactivateUser(1L);

        assertEquals("INACTIVE", testUser.getStatus());
        verify(auditService).logStatusChange(eq("USER"), eq(1L), anyString(), eq("INACTIVE"));
    }
}
