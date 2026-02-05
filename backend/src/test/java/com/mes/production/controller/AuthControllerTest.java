package com.mes.production.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mes.production.dto.auth.LoginRequest;
import com.mes.production.dto.auth.LoginResponse;
import com.mes.production.security.JwtService;
import com.mes.production.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.mes.production.config.TestSecurityConfig;

import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtService jwtService;

    private LoginRequest loginRequest;
    private LoginResponse loginResponse;

    @BeforeEach
    void setUp() {
        loginRequest = new LoginRequest();
        loginRequest.setEmail("admin@mes.com");
        loginRequest.setPassword("admin123");

        loginResponse = LoginResponse.builder()
                .accessToken("test-access-token")
                .refreshToken("test-refresh-token")
                .tokenType("Bearer")
                .expiresIn(86400L)
                .user(LoginResponse.UserInfo.builder()
                        .userId(1L)
                        .email("admin@mes.com")
                        .name("Admin User")
                        .employeeId("EMP-001")
                        .build())
                .build();
    }

    @Test
    @DisplayName("Should login successfully with valid credentials")
    void login_ValidCredentials_ReturnsToken() throws Exception {
        when(authService.login(any(LoginRequest.class))).thenReturn(loginResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("test-access-token"))
                .andExpect(jsonPath("$.refreshToken").value("test-refresh-token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("admin@mes.com"));

        verify(authService, times(1)).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("Should return 401 for invalid credentials")
    void login_InvalidCredentials_Returns401() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        LoginRequest badRequest = new LoginRequest();
        badRequest.setEmail("admin@mes.com");
        badRequest.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should get current user when authenticated")
    @WithMockUser(username = "admin@mes.com")
    void getCurrentUser_Authenticated_ReturnsUser() throws Exception {
        LoginResponse.UserInfo userInfo = LoginResponse.UserInfo.builder()
                .userId(1L)
                .email("admin@mes.com")
                .name("Admin User")
                .employeeId("EMP-001")
                .build();

        when(authService.getCurrentUser()).thenReturn(userInfo);

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.email").value("admin@mes.com"))
                .andExpect(jsonPath("$.name").value("Admin User"));

        verify(authService, times(1)).getCurrentUser();
    }

    @Test
    @DisplayName("Should return 401 when getting current user without auth")
    void getCurrentUser_NotAuthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should refresh token successfully")
    @WithMockUser(username = "admin@mes.com")
    void refreshToken_ValidToken_ReturnsNewTokens() throws Exception {
        when(authService.refreshToken("valid-refresh-token")).thenReturn(loginResponse);

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", "valid-refresh-token"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("test-access-token"));

        verify(authService, times(1)).refreshToken("valid-refresh-token");
    }

    @Test
    @DisplayName("Should return 400 for missing refresh token")
    @WithMockUser(username = "admin@mes.com")
    void refreshToken_MissingToken_Returns400() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return 400 for blank refresh token")
    @WithMockUser(username = "admin@mes.com")
    void refreshToken_BlankToken_Returns400() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", "   "))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should logout successfully")
    @WithMockUser(username = "admin@mes.com")
    void logout_Authenticated_ReturnsSuccess() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully"));
    }

    @Test
    @DisplayName("Should handle invalid refresh token")
    @WithMockUser(username = "admin@mes.com")
    void refreshToken_InvalidToken_ReturnsError() throws Exception {
        when(authService.refreshToken("invalid-token"))
                .thenThrow(new RuntimeException("Invalid refresh token"));

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", "invalid-token"))))
                .andExpect(status().isBadRequest());
    }
}
