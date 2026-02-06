package com.mes.production.service.patch;

import com.mes.production.repository.DatabasePatchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatchServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private DataSource dataSource;

    @Mock
    private DatabasePatchRepository patchRepository;

    @Mock
    private Connection connection;

    @Mock
    private Statement statement;

    @Mock
    private ResultSet resultSet;

    private PatchService patchService;

    @BeforeEach
    void setUp() {
        patchService = new PatchService(jdbcTemplate, dataSource, patchRepository);
        ReflectionTestUtils.setField(patchService, "patchLocation", "classpath:patches/");
        ReflectionTestUtils.setField(patchService, "patchEnabled", true);
    }

    @Test
    void initializePatchTable_ShouldExecuteCreateTableSql() {
        doNothing().when(jdbcTemplate).execute(anyString());

        patchService.initializePatchTable();

        verify(jdbcTemplate).execute(anyString());
    }

    @Test
    void applyPendingPatches_WhenDisabled_ShouldReturnSuccessWithZeroCount() {
        ReflectionTestUtils.setField(patchService, "patchEnabled", false);

        PatchService.PatchResult result = patchService.applyPendingPatches();

        assertTrue(result.isSuccess());
        assertEquals(0, result.getSuccessCount());
        assertEquals(0, result.getFailCount());
    }

    @Test
    void getPatchStatus_ShouldReturnStatusMap() throws Exception {
        // Setup mock for getLastAppliedPatchNumber
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        when(resultSet.next()).thenReturn(true);
        when(resultSet.getInt(1)).thenReturn(5);
        when(resultSet.wasNull()).thenReturn(false);

        Map<String, Object> status = patchService.getPatchStatus();

        assertNotNull(status);
        assertTrue(status.containsKey("totalPatchFiles"));
        assertTrue(status.containsKey("lastAppliedPatchNumber"));
        assertTrue(status.containsKey("pendingPatches"));
        assertEquals(5, status.get("lastAppliedPatchNumber"));
    }

    @Test
    void getPatchStatus_WhenNoPatchesApplied_ShouldReturnZero() throws Exception {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        when(resultSet.next()).thenReturn(true);
        when(resultSet.wasNull()).thenReturn(true);

        Map<String, Object> status = patchService.getPatchStatus();

        assertEquals(0, status.get("lastAppliedPatchNumber"));
    }

    @Test
    void getPatchStatus_WhenConnectionError_ShouldReturnZero() throws Exception {
        when(dataSource.getConnection()).thenThrow(new RuntimeException("Connection failed"));

        Map<String, Object> status = patchService.getPatchStatus();

        assertEquals(0, status.get("lastAppliedPatchNumber"));
    }

    // Test PatchResult static factory methods
    @Test
    void patchResult_Success_ShouldCreateSuccessResult() {
        PatchService.PatchResult result = PatchService.PatchResult.success(5);

        assertTrue(result.isSuccess());
        assertEquals(5, result.getSuccessCount());
        assertEquals(0, result.getFailCount());
        assertEquals(0, result.getFailedPatchNumber());
        assertNull(result.getFailedPatchName());
        assertNull(result.getErrorMessage());
    }

    @Test
    void patchResult_Failure_ShouldCreateFailureResult() {
        PatchService.PatchResult result = PatchService.PatchResult.failure(3, 4, "test_patch", "SQL error");

        assertFalse(result.isSuccess());
        assertEquals(3, result.getSuccessCount());
        assertEquals(1, result.getFailCount());
        assertEquals(4, result.getFailedPatchNumber());
        assertEquals("test_patch", result.getFailedPatchName());
        assertEquals("SQL error", result.getErrorMessage());
    }

    @Test
    void patchResult_AllGetters_ShouldReturnCorrectValues() {
        PatchService.PatchResult successResult = PatchService.PatchResult.success(10);

        assertEquals(10, successResult.getSuccessCount());
        assertTrue(successResult.isSuccess());

        PatchService.PatchResult failureResult = PatchService.PatchResult.failure(2, 3, "failed_patch", "error msg");

        assertEquals(2, failureResult.getSuccessCount());
        assertEquals(1, failureResult.getFailCount());
        assertEquals(3, failureResult.getFailedPatchNumber());
        assertEquals("failed_patch", failureResult.getFailedPatchName());
        assertEquals("error msg", failureResult.getErrorMessage());
        assertFalse(failureResult.isSuccess());
    }
}
