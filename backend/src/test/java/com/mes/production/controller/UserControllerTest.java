package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.UserDTO;
import com.mes.production.security.JwtService;
import com.mes.production.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@Import(com.mes.production.config.TestSecurityConfig.class)
@ActiveProfiles("test")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtService jwtService;

    private UserDTO testUser;
    private List<UserDTO> userList;

    @BeforeEach
    void setUp() {
        testUser = UserDTO.builder()
                .userId(1L)
                .email("test@example.com")
                .name("Test User")
                .employeeId("EMP001")
                .status("ACTIVE")
                .createdOn(LocalDateTime.now())
                .createdBy("admin")
                .build();

        UserDTO user2 = UserDTO.builder()
                .userId(2L)
                .email("user2@example.com")
                .name("User Two")
                .employeeId("EMP002")
                .status("ACTIVE")
                .build();

        userList = Arrays.asList(testUser, user2);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllUsers_ShouldReturnAllUsers() throws Exception {
        when(userService.getAllUsers()).thenReturn(userList);

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].email").value("test@example.com"))
                .andExpect(jsonPath("$[1].email").value("user2@example.com"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getActiveUsers_ShouldReturnActiveUsers() throws Exception {
        when(userService.getActiveUsers()).thenReturn(userList);

        mockMvc.perform(get("/api/users/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUsersPaged_ShouldReturnPagedResults() throws Exception {
        Page<UserDTO> userPage = new PageImpl<>(userList, PageRequest.of(0, 10), 2);
        when(userService.getUsersPaged(any(), any(), any())).thenReturn(userPage);

        mockMvc.perform(get("/api/users/paged")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(1));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUsersPaged_WithSearch_ShouldFilterResults() throws Exception {
        Page<UserDTO> userPage = new PageImpl<>(List.of(testUser), PageRequest.of(0, 10), 1);
        when(userService.getUsersPaged(eq("test"), isNull(), any())).thenReturn(userPage);

        mockMvc.perform(get("/api/users/paged")
                        .param("search", "test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].email").value("test@example.com"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserById_WhenExists_ShouldReturnUser() throws Exception {
        when(userService.getUserById(1L)).thenReturn(testUser);

        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.name").value("Test User"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserById_WhenNotExists_ShouldReturnError() throws Exception {
        when(userService.getUserById(99L)).thenThrow(new RuntimeException("User not found"));

        // RuntimeException is converted to 400 Bad Request by GlobalExceptionHandler
        mockMvc.perform(get("/api/users/99"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("User not found"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createUser_WithValidData_ShouldCreateUser() throws Exception {
        UserDTO.CreateUserRequest request = UserDTO.CreateUserRequest.builder()
                .email("new@example.com")
                .name("New User")
                .password("password123")
                .employeeId("EMP003")
                .build();

        UserDTO createdUser = UserDTO.builder()
                .userId(3L)
                .email("new@example.com")
                .name("New User")
                .employeeId("EMP003")
                .status("ACTIVE")
                .build();

        when(userService.createUser(any())).thenReturn(createdUser);

        mockMvc.perform(post("/api/users")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(3))
                .andExpect(jsonPath("$.email").value("new@example.com"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createUser_WithInvalidEmail_ShouldReturn400() throws Exception {
        UserDTO.CreateUserRequest request = UserDTO.CreateUserRequest.builder()
                .email("invalid-email")
                .name("New User")
                .password("password123")
                .build();

        mockMvc.perform(post("/api/users")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createUser_WithShortPassword_ShouldReturn400() throws Exception {
        UserDTO.CreateUserRequest request = UserDTO.CreateUserRequest.builder()
                .email("new@example.com")
                .name("New User")
                .password("123")
                .build();

        mockMvc.perform(post("/api/users")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateUser_WithValidData_ShouldUpdateUser() throws Exception {
        UserDTO.UpdateUserRequest request = UserDTO.UpdateUserRequest.builder()
                .name("Updated Name")
                .employeeId("EMP999")
                .status("ACTIVE")
                .build();

        UserDTO updatedUser = UserDTO.builder()
                .userId(1L)
                .email("test@example.com")
                .name("Updated Name")
                .employeeId("EMP999")
                .status("ACTIVE")
                .build();

        when(userService.updateUser(eq(1L), any())).thenReturn(updatedUser);

        mockMvc.perform(put("/api/users/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Name"))
                .andExpect(jsonPath("$.employeeId").value("EMP999"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteUser_ShouldDeactivateUser() throws Exception {
        doNothing().when(userService).deleteUser(1L);

        mockMvc.perform(delete("/api/users/1")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User deactivated successfully"));

        verify(userService).deleteUser(1L);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void changePassword_WithValidData_ShouldChangePassword() throws Exception {
        UserDTO.ChangePasswordRequest request = UserDTO.ChangePasswordRequest.builder()
                .currentPassword("oldPassword")
                .newPassword("newPassword123")
                .build();

        doNothing().when(userService).changePassword(eq(1L), any());

        mockMvc.perform(post("/api/users/1/change-password")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed successfully"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void resetPassword_WithValidData_ShouldResetPassword() throws Exception {
        UserDTO.ResetPasswordRequest request = UserDTO.ResetPasswordRequest.builder()
                .newPassword("resetPassword123")
                .build();

        doNothing().when(userService).resetPassword(eq(1L), any());

        mockMvc.perform(post("/api/users/1/reset-password")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successfully"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void activateUser_ShouldActivateUser() throws Exception {
        UserDTO activatedUser = UserDTO.builder()
                .userId(1L)
                .email("test@example.com")
                .name("Test User")
                .status("ACTIVE")
                .build();

        when(userService.activateUser(1L)).thenReturn(activatedUser);

        mockMvc.perform(post("/api/users/1/activate")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deactivateUser_ShouldDeactivateUser() throws Exception {
        UserDTO deactivatedUser = UserDTO.builder()
                .userId(1L)
                .email("test@example.com")
                .name("Test User")
                .status("INACTIVE")
                .build();

        when(userService.deactivateUser(1L)).thenReturn(deactivatedUser);

        mockMvc.perform(post("/api/users/1/deactivate")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }
}
