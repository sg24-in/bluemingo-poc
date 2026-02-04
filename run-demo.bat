@echo off
REM =====================================================
REM MES Production Confirmation - Demo Mode Launcher
REM Uses H2 in-memory database with seeded data
REM =====================================================

echo.
echo ========================================
echo   MES Production Confirmation - DEMO
echo ========================================
echo.
echo Starting with H2 in-memory database...
echo PostgreSQL configuration remains untouched.
echo.
echo H2 Console available at: http://localhost:8080/h2-console
echo   - JDBC URL: jdbc:h2:mem:mes_demo
echo   - Username: sa
echo   - Password: (empty)
echo.
echo Frontend: http://localhost:4200
echo Backend API: http://localhost:8080
echo.
echo Login: admin@mes.com / admin123
echo.
echo ----------------------------------------

cd backend
call gradlew.bat bootRun --args="--spring.profiles.active=demo"
