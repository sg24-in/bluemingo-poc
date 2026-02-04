#!/bin/bash
# =====================================================
# MES Production Confirmation - Test Runner
# Runs all tests: backend, frontend, and E2E
# =====================================================

set -e

echo ""
echo "==================================================="
echo "MES Production Confirmation - Test Suite"
echo "==================================================="
echo ""

# Check if PostgreSQL is running
echo "Checking PostgreSQL connection..."
if ! psql -U postgres -c "SELECT 1" > /dev/null 2>&1; then
    echo "ERROR: PostgreSQL is not running or not accessible"
    echo "Please start PostgreSQL and try again"
    exit 1
fi

# Create mes_test database if it doesn't exist
echo "Creating mes_test database if not exists..."
if ! psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'mes_test'" | grep -q 1; then
    echo "Creating mes_test database..."
    psql -U postgres -c "CREATE DATABASE mes_test"
fi
echo "Database ready."
echo ""

# Parse arguments
RUN_BACKEND=0
RUN_FRONTEND=0
RUN_E2E=0
BUILD_FRONTEND=0

case "${1:-}" in
    ""|"--all")
        RUN_BACKEND=1
        RUN_FRONTEND=1
        RUN_E2E=1
        ;;
    "--backend")
        RUN_BACKEND=1
        ;;
    "--frontend")
        RUN_FRONTEND=1
        ;;
    "--e2e")
        RUN_E2E=1
        BUILD_FRONTEND=1
        ;;
esac

# =====================================================
# Backend Tests
# =====================================================
if [ $RUN_BACKEND -eq 1 ]; then
    echo ""
    echo "==================================================="
    echo "Running Backend Tests..."
    echo "==================================================="
    echo ""

    cd backend
    ./gradlew test -Dspring.profiles.active=test
    if [ $? -ne 0 ]; then
        echo ""
        echo "ERROR: Backend tests failed!"
        exit 1
    fi
    echo "Backend tests passed!"
    cd ..
fi

# =====================================================
# Frontend Tests
# =====================================================
if [ $RUN_FRONTEND -eq 1 ]; then
    echo ""
    echo "==================================================="
    echo "Running Frontend Tests..."
    echo "==================================================="
    echo ""

    cd frontend
    npm test -- --watch=false --browsers=ChromeHeadless
    if [ $? -ne 0 ]; then
        echo ""
        echo "ERROR: Frontend tests failed!"
        exit 1
    fi
    echo "Frontend tests passed!"
    cd ..
fi

# =====================================================
# E2E Tests
# =====================================================
if [ $RUN_E2E -eq 1 ]; then
    echo ""
    echo "==================================================="
    echo "Running E2E Tests..."
    echo "==================================================="
    echo ""

    # Build frontend if needed
    if [ $BUILD_FRONTEND -eq 1 ]; then
        echo "Building frontend..."
        cd frontend
        npm run build
        cd ..
    fi

    # Copy frontend to static folder
    echo "Copying frontend to static folder..."
    cd backend
    ./gradlew copyFrontendToStatic
    cd ..

    # Start backend server in background
    echo "Starting backend server..."
    cd backend
    ./gradlew bootRun -Dspring.profiles.active=test > ../test-server.log 2>&1 &
    SERVER_PID=$!
    cd ..

    # Wait for server to start
    echo "Waiting for server to start..."
    sleep 30

    # Check if server is running
    if ! curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
        echo "Waiting more for server..."
        sleep 30
    fi

    # Run E2E tests
    cd e2e
    node run-all-tests.js
    E2E_RESULT=$?
    cd ..

    # Stop server
    echo "Stopping backend server..."
    kill $SERVER_PID 2>/dev/null || true

    if [ $E2E_RESULT -ne 0 ]; then
        echo ""
        echo "ERROR: E2E tests failed!"
        exit 1
    fi
    echo "E2E tests passed!"
fi

echo ""
echo "==================================================="
echo "All Tests Completed Successfully!"
echo "==================================================="
echo ""

exit 0
