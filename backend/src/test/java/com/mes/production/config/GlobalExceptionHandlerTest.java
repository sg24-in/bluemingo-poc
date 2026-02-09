package com.mes.production.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    // ===== BF-08: NoResourceFoundException returns 404 with no body =====

    @Test
    @DisplayName("BF-08: Should return 404 with no body when static resource not found")
    void should_return404WithNoBody_when_staticResourceNotFound() {
        // GIVEN: A request for a missing static resource like favicon.ico
        NoResourceFoundException ex = new NoResourceFoundException(HttpMethod.GET, "favicon.ico");

        // WHEN: The exception handler processes it
        ResponseEntity<Void> response = handler.handleNoResourceFound(ex);

        // THEN: Returns 404 with no response body (silent handling for static resources)
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNull(response.getBody());
    }

    @Test
    @DisplayName("Should return 400 with validation errors when method argument not valid")
    @SuppressWarnings("unchecked")
    void should_return400WithValidationErrors_when_methodArgumentNotValid() {
        // GIVEN: A MethodArgumentNotValidException with two field errors
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "request");
        bindingResult.addError(new FieldError("request", "operationId", "Operation ID is required"));
        bindingResult.addError(new FieldError("request", "producedQty", "Produced quantity must be positive"));

        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        // WHEN: The exception handler processes it
        ResponseEntity<Map<String, Object>> response = handler.handleValidationExceptions(ex);

        // THEN: Returns 400 with structured validation error details
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());

        Map<String, Object> body = response.getBody();
        assertEquals(400, body.get("status"));
        assertEquals("Validation Failed", body.get("error"));
        assertNotNull(body.get("timestamp"));

        // Verify individual field errors are present
        Map<String, String> errors = (Map<String, String>) body.get("errors");
        assertNotNull(errors);
        assertEquals("Operation ID is required", errors.get("operationId"));
        assertEquals("Produced quantity must be positive", errors.get("producedQty"));
    }

    @Test
    @DisplayName("Should return 401 when bad credentials provided")
    void should_return401_when_badCredentials() {
        // GIVEN: A bad credentials exception from failed authentication
        BadCredentialsException ex = new BadCredentialsException("Bad credentials");

        // WHEN: The exception handler processes it
        ResponseEntity<Map<String, Object>> response = handler.handleBadCredentials(ex);

        // THEN: Returns 401 with generic "Invalid email or password" message
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());

        Map<String, Object> body = response.getBody();
        assertEquals(401, body.get("status"));
        assertEquals("Unauthorized", body.get("error"));
        assertEquals("Invalid email or password", body.get("message"));
        assertNotNull(body.get("timestamp"));
    }

    @Test
    @DisplayName("Should return 401 when username not found")
    void should_return401_when_usernameNotFound() {
        // GIVEN: A username not found exception (user does not exist)
        UsernameNotFoundException ex = new UsernameNotFoundException("User not found: unknown@test.com");

        // WHEN: The exception handler processes it
        ResponseEntity<Map<String, Object>> response = handler.handleUserNotFound(ex);

        // THEN: Returns 401 with generic message (does not leak whether user exists)
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());

        Map<String, Object> body = response.getBody();
        assertEquals(401, body.get("status"));
        assertEquals("Unauthorized", body.get("error"));
        assertEquals("Invalid email or password", body.get("message"));
        assertNotNull(body.get("timestamp"));
    }

    @Test
    @DisplayName("Should return 400 with message when runtime exception occurs")
    void should_return400WithMessage_when_runtimeException() {
        // GIVEN: A runtime exception from business logic validation
        RuntimeException ex = new RuntimeException("Operation is not in READY or IN_PROGRESS status");

        // WHEN: The exception handler processes it
        ResponseEntity<Map<String, Object>> response = handler.handleRuntimeException(ex);

        // THEN: Returns 400 with the original exception message preserved
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());

        Map<String, Object> body = response.getBody();
        assertEquals(400, body.get("status"));
        assertEquals("Bad Request", body.get("error"));
        assertEquals("Operation is not in READY or IN_PROGRESS status", body.get("message"));
        assertNotNull(body.get("timestamp"));
    }

    @Test
    @DisplayName("Should return 500 when unexpected exception occurs")
    void should_return500_when_unexpectedException() {
        // GIVEN: An unexpected checked exception (e.g., database connectivity failure)
        Exception ex = new Exception("Database connection lost");

        // WHEN: The exception handler processes it
        ResponseEntity<Map<String, Object>> response = handler.handleGenericException(ex);

        // THEN: Returns 500 with a generic message (does not leak internal details)
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());

        Map<String, Object> body = response.getBody();
        assertEquals(500, body.get("status"));
        assertEquals("Internal Server Error", body.get("error"));
        assertEquals("An unexpected error occurred", body.get("message"));
        assertNotNull(body.get("timestamp"));
    }
}
