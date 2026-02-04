package com.mes.production.service;

import com.mes.production.dto.auth.LoginRequest;
import com.mes.production.dto.auth.LoginResponse;
import com.mes.production.entity.User;
import com.mes.production.security.CustomUserDetailsService;
import com.mes.production.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private UserDetails testUserDetails;
    private Authentication mockAuthentication;

    @BeforeEach
    void setUp() {
        // Set JWT expiration via reflection
        ReflectionTestUtils.setField(authService, "jwtExpirationMs", 86400000L);

        testUser = User.builder()
                .userId(1L)
                .email("admin@mes.com")
                .name("Admin User")
                .employeeId("EMP-001")
                .passwordHash("encoded_password")
                .status("ACTIVE")
                .build();

        testUserDetails = new org.springframework.security.core.userdetails.User(
                "admin@mes.com",
                "encoded_password",
                Collections.emptyList()
        );

        mockAuthentication = mock(Authentication.class);
    }

    @Test
    @DisplayName("Should login successfully with valid credentials")
    void login_ValidCredentials_ReturnsLoginResponse() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("admin@mes.com");
        request.setPassword("admin123");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(mockAuthentication);
        when(mockAuthentication.getPrincipal()).thenReturn(testUserDetails);
        when(userDetailsService.getUserByEmail("admin@mes.com")).thenReturn(testUser);
        when(jwtService.generateToken(testUserDetails)).thenReturn("access-token-123");
        when(jwtService.generateRefreshToken(testUserDetails)).thenReturn("refresh-token-456");

        // Act
        LoginResponse response = authService.login(request);

        // Assert
        assertNotNull(response);
        assertEquals("access-token-123", response.getAccessToken());
        assertEquals("refresh-token-456", response.getRefreshToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals(86400L, response.getExpiresIn()); // 86400000ms / 1000 = 86400s

        assertNotNull(response.getUser());
        assertEquals(1L, response.getUser().getUserId());
        assertEquals("admin@mes.com", response.getUser().getEmail());
        assertEquals("Admin User", response.getUser().getName());
        assertEquals("EMP-001", response.getUser().getEmployeeId());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtService).generateToken(testUserDetails);
        verify(jwtService).generateRefreshToken(testUserDetails);
    }

    @Test
    @DisplayName("Should throw exception with invalid credentials")
    void login_InvalidCredentials_ThrowsException() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("admin@mes.com");
        request.setPassword("wrong_password");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        // Act & Assert
        assertThrows(BadCredentialsException.class, () -> authService.login(request));

        verify(jwtService, never()).generateToken(any());
    }

    @Test
    @DisplayName("Should get current user from security context")
    void getCurrentUser_AuthenticatedUser_ReturnsUserInfo() {
        // Arrange
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(mockAuthentication);
        when(mockAuthentication.getName()).thenReturn("admin@mes.com");
        SecurityContextHolder.setContext(securityContext);

        when(userDetailsService.getUserByEmail("admin@mes.com")).thenReturn(testUser);

        // Act
        LoginResponse.UserInfo userInfo = authService.getCurrentUser();

        // Assert
        assertNotNull(userInfo);
        assertEquals(1L, userInfo.getUserId());
        assertEquals("admin@mes.com", userInfo.getEmail());
        assertEquals("Admin User", userInfo.getName());
        assertEquals("EMP-001", userInfo.getEmployeeId());

        // Cleanup
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should refresh token successfully with valid refresh token")
    void refreshToken_ValidToken_ReturnsNewTokens() {
        // Arrange
        String refreshToken = "valid-refresh-token";

        when(jwtService.validateToken(refreshToken)).thenReturn(true);
        when(jwtService.extractUsername(refreshToken)).thenReturn("admin@mes.com");
        when(userDetailsService.loadUserByUsername("admin@mes.com")).thenReturn(testUserDetails);
        when(userDetailsService.getUserByEmail("admin@mes.com")).thenReturn(testUser);
        when(jwtService.generateToken(testUserDetails)).thenReturn("new-access-token");
        when(jwtService.generateRefreshToken(testUserDetails)).thenReturn("new-refresh-token");

        // Act
        LoginResponse response = authService.refreshToken(refreshToken);

        // Assert
        assertNotNull(response);
        assertEquals("new-access-token", response.getAccessToken());
        assertEquals("new-refresh-token", response.getRefreshToken());
        assertEquals("Bearer", response.getTokenType());

        verify(jwtService).validateToken(refreshToken);
        verify(jwtService).extractUsername(refreshToken);
    }

    @Test
    @DisplayName("Should throw exception when refresh token is invalid")
    void refreshToken_InvalidToken_ThrowsException() {
        // Arrange
        String invalidToken = "invalid-token";

        when(jwtService.validateToken(invalidToken)).thenReturn(false);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> authService.refreshToken(invalidToken));

        assertEquals("Invalid refresh token", exception.getMessage());

        verify(jwtService).validateToken(invalidToken);
        verify(jwtService, never()).extractUsername(any());
    }

    @Test
    @DisplayName("Should include correct expiration time in login response")
    void login_CorrectExpirationCalculation() {
        // Arrange
        ReflectionTestUtils.setField(authService, "jwtExpirationMs", 3600000L); // 1 hour

        LoginRequest request = new LoginRequest();
        request.setEmail("admin@mes.com");
        request.setPassword("admin123");

        when(authenticationManager.authenticate(any())).thenReturn(mockAuthentication);
        when(mockAuthentication.getPrincipal()).thenReturn(testUserDetails);
        when(userDetailsService.getUserByEmail("admin@mes.com")).thenReturn(testUser);
        when(jwtService.generateToken(testUserDetails)).thenReturn("token");
        when(jwtService.generateRefreshToken(testUserDetails)).thenReturn("refresh");

        // Act
        LoginResponse response = authService.login(request);

        // Assert
        assertEquals(3600L, response.getExpiresIn()); // 3600000ms / 1000 = 3600s
    }

    @Test
    @DisplayName("Should include correct expiration in refresh response")
    void refreshToken_CorrectExpirationCalculation() {
        // Arrange
        ReflectionTestUtils.setField(authService, "jwtExpirationMs", 7200000L); // 2 hours

        String refreshToken = "valid-token";

        when(jwtService.validateToken(refreshToken)).thenReturn(true);
        when(jwtService.extractUsername(refreshToken)).thenReturn("admin@mes.com");
        when(userDetailsService.loadUserByUsername("admin@mes.com")).thenReturn(testUserDetails);
        when(userDetailsService.getUserByEmail("admin@mes.com")).thenReturn(testUser);
        when(jwtService.generateToken(testUserDetails)).thenReturn("new-access");
        when(jwtService.generateRefreshToken(testUserDetails)).thenReturn("new-refresh");

        // Act
        LoginResponse response = authService.refreshToken(refreshToken);

        // Assert
        assertEquals(7200L, response.getExpiresIn()); // 7200000ms / 1000 = 7200s
    }
}
