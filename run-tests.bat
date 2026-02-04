@echo off
REM =====================================================
REM MES Production Confirmation - Test Runner
REM Runs all tests: backend, frontend, and E2E
REM =====================================================

setlocal enabledelayedexpansion

echo.
echo ===================================================
echo MES Production Confirmation - Test Suite
echo ===================================================
echo.

REM Check if PostgreSQL is running
echo Checking PostgreSQL connection...
psql -U postgres -c "SELECT 1" > nul 2>&1
if errorlevel 1 (
    echo ERROR: PostgreSQL is not running or not accessible
    echo Please start PostgreSQL and try again
    exit /b 1
)

REM Create mes_test database if it doesn't exist
echo Creating mes_test database if not exists...
psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'mes_test'" | findstr "1" > nul
if errorlevel 1 (
    echo Creating mes_test database...
    psql -U postgres -c "CREATE DATABASE mes_test"
)
echo Database ready.
echo.

REM Parse arguments
set RUN_BACKEND=0
set RUN_FRONTEND=0
set RUN_E2E=0
set BUILD_FRONTEND=0

if "%1"=="" (
    set RUN_BACKEND=1
    set RUN_FRONTEND=1
    set RUN_E2E=1
)
if "%1"=="--all" (
    set RUN_BACKEND=1
    set RUN_FRONTEND=1
    set RUN_E2E=1
)
if "%1"=="--backend" set RUN_BACKEND=1
if "%1"=="--frontend" set RUN_FRONTEND=1
if "%1"=="--e2e" (
    set RUN_E2E=1
    set BUILD_FRONTEND=1
)

REM =====================================================
REM Backend Tests
REM =====================================================
if %RUN_BACKEND%==1 (
    echo.
    echo ===================================================
    echo Running Backend Tests...
    echo ===================================================
    echo.

    cd backend
    call gradlew.bat test -Dspring.profiles.active=test
    if errorlevel 1 (
        echo.
        echo ERROR: Backend tests failed!
        cd ..
        exit /b 1
    )
    echo Backend tests passed!
    cd ..
)

REM =====================================================
REM Frontend Tests
REM =====================================================
if %RUN_FRONTEND%==1 (
    echo.
    echo ===================================================
    echo Running Frontend Tests...
    echo ===================================================
    echo.

    cd frontend
    call npm test -- --watch=false --browsers=ChromeHeadless
    if errorlevel 1 (
        echo.
        echo ERROR: Frontend tests failed!
        cd ..
        exit /b 1
    )
    echo Frontend tests passed!
    cd ..
)

REM =====================================================
REM E2E Tests
REM =====================================================
if %RUN_E2E%==1 (
    echo.
    echo ===================================================
    echo Running E2E Tests...
    echo ===================================================
    echo.

    REM Build frontend if needed
    if %BUILD_FRONTEND%==1 (
        echo Building frontend...
        cd frontend
        call npm run build
        cd ..
    )

    REM Copy frontend to static folder
    echo Copying frontend to static folder...
    cd backend
    call gradlew.bat copyFrontendToStatic
    cd ..

    REM Start backend server in background
    echo Starting backend server...
    start /B cmd /c "cd backend && gradlew.bat bootRun -Dspring.profiles.active=test > ..\test-server.log 2>&1"

    REM Wait for server to start
    echo Waiting for server to start...
    timeout /t 30 /nobreak > nul

    REM Check if server is running
    curl -s http://localhost:8080/api/health > nul 2>&1
    if errorlevel 1 (
        echo Waiting more for server...
        timeout /t 30 /nobreak > nul
    )

    REM Run E2E tests
    cd e2e
    call node run-all-tests.js
    set E2E_RESULT=%errorlevel%
    cd ..

    REM Stop server
    echo Stopping backend server...
    taskkill /F /IM java.exe /FI "WINDOWTITLE eq mes-production*" > nul 2>&1

    if %E2E_RESULT% neq 0 (
        echo.
        echo ERROR: E2E tests failed!
        exit /b 1
    )
    echo E2E tests passed!
)

echo.
echo ===================================================
echo All Tests Completed Successfully!
echo ===================================================
echo.

exit /b 0
