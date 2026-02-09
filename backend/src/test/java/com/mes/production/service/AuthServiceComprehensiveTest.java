package com.mes.production.service;

import com.mes.production.dto.auth.LoginRequest;
import com.mes.production.dto.auth.LoginResponse;
import com.mes.production.entity.User;
import com.mes.production.security.CustomUserDetailsService;
import com.mes.production.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Comprehensive test suite for AuthService.
 *
 * Test Categories:
 * 1. Login with Valid Credentials - Happy path scenarios
 * 2. Login with Invalid Credentials - Various authentication failures
 * 3. getCurrentUser() - Security context scenarios
 * 4. JWT Token Generation - Token creation and refresh
 * 5. Edge Cases - Null handling, empty values, special characters
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Comprehensive Tests")
class AuthServiceComprehensiveTest {

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

    // ========================================================================
    // 1. LOGIN WITH VALID CREDENTIALS
    // ========================================================================

    @Nested
    @DisplayName("1. Login with Valid Credentials")
    class LoginValidCredentialsTests {

        @Test
        @DisplayName("1.1 should_returnLoginResponse_when_credentialsAreValid")
        void should_returnLoginResponse_when_credentialsAreValid() {
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
            assertEquals(86400L, response.getExpiresIn());
            assertNotNull(response.getUser());
            assertEquals("admin@mes.com", response.getUser().getEmail());
            assertEquals("Admin User", response.getUser().getName());
        }

        @Test
        @DisplayName("1.2 should_includeUserInfo_when_loginSuccessful")
        void should_includeUserInfo_when_loginSuccessful() {
            // Arrange
            LoginRequest request = new LoginRequest();
            request.setEmail("admin@mes.com");
            request.setPassword("admin123");

            when(authenticationManager.authenticate(any())).thenReturn(mockAuthentication);
            when(mockAuthentication.getPrincipal()).thenReturn(testUserDetails);
            when(userDetailsService.getUserByEmail("admin@mes.com")).thenReturn(testUser);
            when(jwtService.generateToken(any())).thenReturn("token");
            when(jwtService.generateRefreshToken(any())).thenReturn("refresh");

            // Act
            LoginResponse response = authService.login(request);

            // Assert
            assertNotNull(response.getUser());
            assertEquals(1L, response.getUser().getUserId());
            assertEquals("admin@mes.com", response.getUser().getEmail());
            assertEquals("Admin User", response.getUser().getName());
            assertEquals("EMP-001", response.getUser().getEmployeeId());
        }

        @Test
        @DisplayName("1.3 should_setSecurityContext_when_loginSuccessful")
        void should_setSecurityContext_when_loginSuccessful() {
            // Arrange
            LoginRequest request = new LoginRequest();
            request.setEmail("admin@mes.com");
            request.setPassword("admin123");

            when(authenticationManager.authenticate(any())).thenReturn(mockAuthentication);
            when(mockAuthentication.getPrincipal()).thenReturn(testUserDetails);
            when(userDetailsService.getUserByEmail(any())).thenReturn(testUser);
            when(jwtService.generateToken(any())).thenReturn("token");
            when(jwtService.generateRefreshToken(any())).thenReturn("refresh");

            // Act
            authService.login(request);

            // Assert
            verify(authenticationManager).authenticate(argThat(auth ->
                    auth instanceof UsernamePasswordAuthenticationToken &&
                    "admin@mes.com".equals(auth.getPrincipal()) &&
                    "admin123".equals(auth.getCredentials())
            ));
        }

        @Test
        @DisplayName("1.4 should_calculateExpiresInSeconds_when_loginSuccessful")
        void should_calculateExpiresInSeconds_when_loginSuccessful() {
            // Arrange
            ReflectionTestUtils.setField(authService, "jwtExpirationMs", 7200000L); // 2 hours

            LoginRequest request = new LoginRequest();
            request.setEmail("admin@mes.com");
            request.setPassword("admin123");

            when(authenticationManager.authenticate(any())).thenReturn(mockAuthentication);
            when(mockAuthentication.getPrincipal()).thenReturn(testUserDetails);
            when(userDetailsService.getUserByEmail(any())).thenReturn(testUser);
            when(jwtService.generateToken(any())).thenReturn("token");
            when(jwtService.generateRefreshToken(any())).thenReturn("refresh");

            // Act
            LoginResponse response = authService.login(request);

            // Assert
            assertEquals(7200L, response.getExpiresIn()); // 7200000ms / 1000 = 7200s
        }
    }

    // ========================================================================
    // 2. LOGIN WITH INVALID CREDENTIALS
    // ========================================================================

    @Nested
    @DisplayName("2. Login with Invalid Credentials")
    class LoginInvalidCredentialsTests {

        @Test
        @DisplayName("2.1 should_throwBadCredentialsException_when_passwordIsWrong")
        void should_throwBadCredentialsException_when_passwordIsWrong() {
            // Arrange
            LoginRequest request = new LoginRequest();
            request.setEmail("admin@mes.com");
            request.setPassword("wrong_password");

            when(authenticationManager.authenticate(any()))
                    .thenThrow(new BadCredentialsException("Invalid credentials"));

            // Act & Assert
            BadCredentialsException exception = assertThrows(BadCredentialsException.class,
                    () -> authService.login(request));

            assertEquals("Invalid credentials", exception.getMessage());
            verify(jwtService, never()).generateToken(any());
            verify(jwtService, never()).generateRefreshToken(any());
        }

        @Test
        @DisplayName("2.2 should_throwException_when_userNotFound")
        void should_throwException_when_userNotFound() {
            // Arrange
            LoginRequest request = new LoginRequest();
            request.setEmail("nonexistent@mes.com");
            request.setPassword("password");

            when(authenticationManager.authenticate(any()))
                    .thenThrow(new UsernameNotFoundException("User not found"));

            // Act & Assert
            assertThrows(UsernameNotFoundException.class,
                    () -> authService.login(request));

            verify(jwtService, never()).generateToken(any());
        }

        @Test
        @DisplayName("2.3 should_throwException_when_accountIsDisabled")
        void should_throwException_when_accountIsDisabled() {
            // Arrange
            LoginRequest request = new LoginRequest();
            request.setEmail("disabled@mes.com");
            request.setPassword("password");

            when(authenticationManager.authenticate(any()))
                    .thenThrow(new DisabledException("Account is disabled"));

            // Act & Assert
            DisabledException exception = assertThrows(DisabledException.class,
                    () -> authService.login(request));

            assertTrue(exception.getMessage().contains("disabled"));
        }

        @Test
        @DisplayName("2.4 should_throwException_when_accountIsLocked")
        void should_throwException_when_accountIsLocked() {
            // Arrange
            LoginRequest request = new LoginRequest();
            request.setEmail("locked@mes.com");
            request.setPassword("password");

            when(authenticationManager.authenticate(any()))
                    .thenThrow(new LockedException("Account is locked"));

            // Act & Assert
            LockedException exception = assertThrows(LockedException.class,
                    () -> authService.login(request));

            assertTrue(exception.getMessage().contains("locked"));
        }
    }

    // ========================================================================
    // 3. GET CURRENT USER
    // ========================================================================

    @Nested
    @DisplayName("3. Get Current User")
    class GetCurrentUserTests {

        @Test
        @DisplayName("3.1 should_returnUserInfo_when_authenticated")
        void should_returnUserInfo_when_authenticated() {
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
        @DisplayName("3.2 should_returnDifferentUser_when_differentUserAuthenticated")
        void should_returnDifferentUser_when_differentUserAuthenticated() {
            // Arrange
            User operatorUser = User.builder()
                    .userId(2L)
                    .email("operator@mes.com")
                    .name("Operator User")
                    .employeeId("EMP-002")
                    .status("ACTIVE")
                    .build();

            SecurityContext securityContext = mock(SecurityContext.class);
            when(securityContext.getAuthentication()).thenReturn(mockAuthentication);
            when(mockAuthentication.getName()).thenReturn("operator@mes.com");
            SecurityContextHolder.setContext(securityContext);
            when(userDetailsService.getUserByEmail("operator@mes.com")).thenReturn(operatorUser);

            // Act
            LoginResponse.UserInfo userInfo = authService.getCurrentUser();

            // Assert
            assertEquals(2L, userInfo.getUserId());
            assertEquals("operator@mes.com", userInfo.getEmail());
            assertEquals("Operator User", userInfo.getName());

            // Cleanup
            SecurityContextHolder.clearContext();
        }
    }

    // ========================================================================
    // 4. JWT TOKEN REFRESH
    // ========================================================================

    @Nested
    @DisplayName("4. JWT Token Refresh")
    class TokenRefreshTests {

        @Test
        @DisplayName("4.1 should_returnNewTokens_when_refreshTokenIsValid")
        void should_returnNewTokens_when_refreshTokenIsValid() {
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
            assertNotNull(response.getUser());
        }

        @Test
        @DisplayName("4.2 should_throwException_when_refreshTokenIsInvalid")
        void should_throwException_when_refreshTokenIsInvalid() {
            // Arrange
            String invalidToken = "invalid-token";
            when(jwtService.validateToken(invalidToken)).thenReturn(false);

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> authService.refreshToken(invalidToken));

            assertEquals("Invalid refresh token", exception.getMessage());
            verify(jwtService, never()).extractUsername(any());
            verify(jwtService, never()).generateToken(any());
        }

        @Test
        @DisplayName("4.3 should_throwException_when_refreshTokenIsExpired")
        void should_throwException_when_refreshTokenIsExpired() {
            // Arrange
            String expiredToken = "expired-token";
            when(jwtService.validateToken(expiredToken)).thenReturn(false);

            // Act & Assert
            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> authService.refreshToken(expiredToken));

            assertEquals("Invalid refresh token", exception.getMessage());
        }

        @Test
        @DisplayName("4.4 should_includeUserInfo_when_refreshSuccessful")
        void should_includeUserInfo_when_refreshSuccessful() {
            // Arrange
            String refreshToken = "valid-refresh-token";

            when(jwtService.validateToken(refreshToken)).thenReturn(true);
            when(jwtService.extractUsername(refreshToken)).thenReturn("admin@mes.com");
            when(userDetailsService.loadUserByUsername("admin@mes.com")).thenReturn(testUserDetails);
            when(userDetailsService.getUserByEmail("admin@mes.com")).thenReturn(testUser);
            when(jwtService.generateToken(any())).thenReturn("new-token");
            when(jwtService.generateRefreshToken(any())).thenReturn("new-refresh");

            // Act
            LoginResponse response = authService.refreshToken(refreshToken);

            // Assert
            assertNotNull(response.getUser());
            assertEquals(1L, response.getUser().getUserId());
            assertEquals("admin@mes.com", response.getUser().getEmail());
        }

        @Test
        @DisplayName("4.5 should_calculateExpiresInCorrectly_when_refreshSuccessful")
        void should_calculateExpiresInCorrectly_when_refreshSuccessful() {
            // Arrange
            ReflectionTestUtils.setField(authService, "jwtExpirationMs", 3600000L); // 1 hour

            String refreshToken = "valid-refresh-token";

            when(jwtService.validateToken(refreshToken)).thenReturn(true);
            when(jwtService.extractUsername(refreshToken)).thenReturn("admin@mes.com");
            when(userDetailsService.loadUserByUsername("admin@mes.com")).thenReturn(testUserDetails);
            when(userDetailsService.getUserByEmail("admin@mes.com")).thenReturn(testUser);
            when(jwtService.generateToken(any())).thenReturn("new-token");
            when(jwtService.generateRefreshToken(any())).thenReturn("new-refresh");

            // Act
            LoginResponse response = authService.refreshToken(refreshToken);

            // Assert
            assertEquals(3600L, response.getExpiresIn());
        }
    }

    // ========================================================================
    // 5. EDGE CASES
    // ========================================================================

    @Nested
    @DisplayName("5. Edge Cases")
    class EdgeCaseTests {

        @Test
        @DisplayName("5.1 should_handleEmailWithSpecialCharacters_when_loginSuccessful")
        void should_handleEmailWithSpecialCharacters_when_loginSuccessful() {
            // Arrange
            User specialUser = User.builder()
                    .userId(3L)
                    .email("user+test@mes.com")
                    .name("Special User")
                    .employeeId("EMP-003")
                    .status("ACTIVE")
                    .build();

            UserDetails specialUserDetails = new org.springframework.security.core.userdetails.User(
                    "user+test@mes.com", "password", Collections.emptyList());

            LoginRequest request = new LoginRequest();
            request.setEmail("user+test@mes.com");
            request.setPassword("password");

            when(authenticationManager.authenticate(any())).thenReturn(mockAuthentication);
            when(mockAuthentication.getPrincipal()).thenReturn(specialUserDetails);
            when(userDetailsService.getUserByEmail("user+test@mes.com")).thenReturn(specialUser);
            when(jwtService.generateToken(any())).thenReturn("token");
            when(jwtService.generateRefreshToken(any())).thenReturn("refresh");

            // Act
            LoginResponse response = authService.login(request);

            // Assert
            assertNotNull(response);
            assertEquals("user+test@mes.com", response.getUser().getEmail());
        }

        @Test
        @DisplayName("5.2 should_handleLongEmployeeId_when_loginSuccessful")
        void should_handleLongEmployeeId_when_loginSuccessful() {
            // Arrange
            User userWithLongEmpId = User.builder()
                    .userId(4L)
                    .email("long@mes.com")
                    .name("Long EmpId User")
                    .employeeId("EMP-001-DIVISION-A-DEPARTMENT-B-SECTION-C")
                    .status("ACTIVE")
                    .build();

            LoginRequest request = new LoginRequest();
            request.setEmail("long@mes.com");
            request.setPassword("password");

            when(authenticationManager.authenticate(any())).thenReturn(mockAuthentication);
            when(mockAuthentication.getPrincipal()).thenReturn(testUserDetails);
            when(userDetailsService.getUserByEmail("long@mes.com")).thenReturn(userWithLongEmpId);
            when(jwtService.generateToken(any())).thenReturn("token");
            when(jwtService.generateRefreshToken(any())).thenReturn("refresh");

            // Act
            LoginResponse response = authService.login(request);

            // Assert
            assertEquals("EMP-001-DIVISION-A-DEPARTMENT-B-SECTION-C", response.getUser().getEmployeeId());
        }

        @Test
        @DisplayName("5.3 should_handleMinimumExpiration_when_configured")
        void should_handleMinimumExpiration_when_configured() {
            // Arrange
            ReflectionTestUtils.setField(authService, "jwtExpirationMs", 1000L); // 1 second

            LoginRequest request = new LoginRequest();
            request.setEmail("admin@mes.com");
            request.setPassword("admin123");

            when(authenticationManager.authenticate(any())).thenReturn(mockAuthentication);
            when(mockAuthentication.getPrincipal()).thenReturn(testUserDetails);
            when(userDetailsService.getUserByEmail(any())).thenReturn(testUser);
            when(jwtService.generateToken(any())).thenReturn("token");
            when(jwtService.generateRefreshToken(any())).thenReturn("refresh");

            // Act
            LoginResponse response = authService.login(request);

            // Assert
            assertEquals(1L, response.getExpiresIn());
        }

        @Test
        @DisplayName("5.4 should_verifyAuthenticationManagerCalledWithCorrectCredentials")
        void should_verifyAuthenticationManagerCalledWithCorrectCredentials() {
            // Arrange
            LoginRequest request = new LoginRequest();
            request.setEmail("test@mes.com");
            request.setPassword("mySecretP@ss!");

            when(authenticationManager.authenticate(any())).thenReturn(mockAuthentication);
            when(mockAuthentication.getPrincipal()).thenReturn(testUserDetails);
            when(userDetailsService.getUserByEmail(any())).thenReturn(testUser);
            when(jwtService.generateToken(any())).thenReturn("token");
            when(jwtService.generateRefreshToken(any())).thenReturn("refresh");

            // Act
            authService.login(request);

            // Assert
            verify(authenticationManager).authenticate(argThat(auth -> {
                UsernamePasswordAuthenticationToken token = (UsernamePasswordAuthenticationToken) auth;
                return "test@mes.com".equals(token.getPrincipal()) &&
                       "mySecretP@ss!".equals(token.getCredentials());
            }));
        }
    }
}
