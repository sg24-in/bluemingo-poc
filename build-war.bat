@echo off
echo ======================================================================
echo MES Production Confirmation - WAR Build Script
echo ======================================================================
echo.

:: Set directories
set ROOT_DIR=%~dp0
set FRONTEND_DIR=%ROOT_DIR%frontend
set BACKEND_DIR=%ROOT_DIR%backend
set STATIC_DIR=%BACKEND_DIR%\src\main\resources\static

:: Step 1: Build Frontend
echo [1/4] Building Frontend...
echo ----------------------------------------------------------------------
cd /d "%FRONTEND_DIR%"
if errorlevel 1 (
    echo ERROR: Cannot access frontend directory
    exit /b 1
)

echo Installing npm dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    exit /b 1
)

echo Building Angular application...
call npm run build -- --configuration=production
if errorlevel 1 (
    echo ERROR: Frontend build failed
    exit /b 1
)
echo Frontend build complete.
echo.

:: Step 2: Clean and copy to static folder
echo [2/4] Copying frontend build to static folder...
echo ----------------------------------------------------------------------
if exist "%STATIC_DIR%" (
    echo Cleaning existing static folder...
    rmdir /s /q "%STATIC_DIR%"
)
mkdir "%STATIC_DIR%"

:: Copy frontend build output
xcopy /s /e /y "%FRONTEND_DIR%\dist\mes-production-frontend\browser\*" "%STATIC_DIR%\"
if errorlevel 1 (
    :: Try alternate path (older Angular versions)
    xcopy /s /e /y "%FRONTEND_DIR%\dist\mes-production-frontend\*" "%STATIC_DIR%\"
)
echo Frontend copied to static folder.
echo.

:: Step 3: Build WAR
echo [3/4] Building WAR file...
echo ----------------------------------------------------------------------
cd /d "%BACKEND_DIR%"
call gradlew.bat clean bootWar -x test
if errorlevel 1 (
    echo ERROR: WAR build failed
    exit /b 1
)
echo.

:: Step 4: Show output
echo [4/4] Build Complete!
echo ======================================================================
echo.
echo WAR file location:
dir /b "%BACKEND_DIR%\build\libs\*.war"
echo.
echo Full path: %BACKEND_DIR%\build\libs\mes-production.war
echo.
echo ======================================================================
echo DEPLOYMENT INSTRUCTIONS:
echo ======================================================================
echo 1. Copy mes-production.war to Tomcat webapps folder
echo 2. Application will be available at: http://localhost:8080/mes-production
echo.
echo DATABASE CONFIGURATION (PostgreSQL):
echo   Database: mes_production
echo   Username: postgres
echo   Password: postgres
echo   URL: jdbc:postgresql://localhost:5432/mes_production
echo.
echo NOTE: Patches will apply automatically on startup if enabled.
echo ======================================================================

cd /d "%ROOT_DIR%"
pause
