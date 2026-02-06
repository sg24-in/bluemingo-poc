package com.mes.production.service.patch;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatchRunnerTest {

    @Mock
    private PatchService patchService;

    @Mock
    private ApplicationArguments applicationArguments;

    private PatchRunner patchRunner;

    @BeforeEach
    void setUp() {
        patchRunner = new PatchRunner(patchService);
    }

    @Test
    void run_WhenAllPatchesSucceed_ShouldCompleteNormally() {
        when(patchService.applyPendingPatches())
                .thenReturn(PatchService.PatchResult.success(3));

        assertDoesNotThrow(() -> patchRunner.run(applicationArguments));

        verify(patchService).initializePatchTable();
        verify(patchService).applyPendingPatches();
    }

    @Test
    void run_WhenNoPendingPatches_ShouldCompleteNormally() {
        when(patchService.applyPendingPatches())
                .thenReturn(PatchService.PatchResult.success(0));

        assertDoesNotThrow(() -> patchRunner.run(applicationArguments));

        verify(patchService).initializePatchTable();
        verify(patchService).applyPendingPatches();
    }

    @Test
    void run_WhenPatchFails_ShouldThrowException() {
        when(patchService.applyPendingPatches())
                .thenReturn(PatchService.PatchResult.failure(2, 3, "test_patch", "SQL syntax error"));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> patchRunner.run(applicationArguments));

        assertTrue(exception.getMessage().contains("patch #3"));
        assertTrue(exception.getMessage().contains("test_patch"));
        assertTrue(exception.getMessage().contains("SQL syntax error"));

        verify(patchService).initializePatchTable();
        verify(patchService).applyPendingPatches();
    }

    @Test
    void run_WhenFirstPatchFails_ShouldThrowExceptionWithCorrectInfo() {
        when(patchService.applyPendingPatches())
                .thenReturn(PatchService.PatchResult.failure(0, 1, "initial_schema", "Table already exists"));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> patchRunner.run(applicationArguments));

        assertTrue(exception.getMessage().contains("patch #1"));
        assertTrue(exception.getMessage().contains("initial_schema"));
        assertTrue(exception.getMessage().contains("Table already exists"));
    }

    @Test
    void run_ShouldInitializePatchTableBeforeApplyingPatches() {
        when(patchService.applyPendingPatches())
                .thenReturn(PatchService.PatchResult.success(0));

        patchRunner.run(applicationArguments);

        // Verify order of calls
        var inOrder = inOrder(patchService);
        inOrder.verify(patchService).initializePatchTable();
        inOrder.verify(patchService).applyPendingPatches();
    }
}
