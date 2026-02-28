@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set BASE_DIR=%~dp0

echo ============================================
echo   AutoRepairShop - Full Deploy Script
echo ============================================
echo.

:: STEP 0: Parse arguments
set SKIP_BUILD=0
set RESET_KC=0
set SKIP_INFRA=0

:parse_args
if "%~1"=="" goto args_done
if /i "%~1"=="--skip-build" set SKIP_BUILD=1
if /i "%~1"=="--reset-keycloak" set RESET_KC=1
if /i "%~1"=="--skip-infra" set SKIP_INFRA=1
if /i "%~1"=="--help" goto show_help
shift
goto parse_args

:show_help
echo Usage: deploy.bat [options]
echo.
echo Options:
echo   --skip-build       Skip Maven build (use existing jars)
echo   --reset-keycloak   Drop and recreate keycloak_db before starting
echo   --skip-infra       Skip podman-compose (infra already running)
echo   --help             Show this help
echo.
pause
exit /b 0

:args_done

:: STEP 1: Stop existing Java services
echo [1/6] Stopping existing Java services...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080 :8081 :8082 :8083 :8084 :8085 :8086 :8087 :8088 :8089 :8090 :8091" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo       Done.
echo.

:: STEP 2: Maven clean install
if %SKIP_BUILD%==1 (
    echo [2/6] Skipping Maven build --skip-build
) else (
    echo [2/6] Building all services with Maven...
    echo       This may take a few minutes...
    cd /d "%BASE_DIR%"
    call mvn clean install -DskipTests -q
    if !errorlevel! neq 0 (
        echo       ERROR: Maven build FAILED! Fix errors and retry.
        pause
        exit /b 1
    )
    echo       Maven build SUCCESS.
)
echo.

:: STEP 3: Podman compose (infra)
if %SKIP_INFRA%==1 (
    echo [3/6] Skipping infrastructure --skip-infra
) else (
    echo [3/6] Starting infrastructure podman-compose ...
    cd /d "%BASE_DIR%infra"
    podman-compose down >nul 2>&1
    podman-compose up -d
    if !errorlevel! neq 0 (
        echo       ERROR: podman-compose up FAILED!
        pause
        exit /b 1
    )
    echo       Infrastructure started.
)
echo.

:: STEP 4: Reset Keycloak DB (optional)
if %RESET_KC%==1 (
    echo [4/6] Resetting Keycloak database...
    cd /d "%BASE_DIR%infra"
    podman-compose stop keycloak >nul 2>&1
    podman-compose rm -f keycloak >nul 2>&1
    podman exec infra-postgres-1 psql -U postgres -c "DROP DATABASE IF EXISTS keycloak_db;" >nul 2>&1
    podman exec infra-postgres-1 psql -U postgres -c "CREATE DATABASE keycloak_db OWNER postgres;" >nul 2>&1
    podman-compose up -d keycloak
    echo       Keycloak DB reset and restarted.
) else (
    echo [4/6] Keycloak DB reset skipped. Use --reset-keycloak to reset.
)
echo.

:: STEP 5: Wait for infra to be ready
echo [5/6] Waiting for infrastructure to be ready...
set RETRIES=0

:wait_postgres
set /a RETRIES+=1
if %RETRIES% gtr 30 (
    echo       ERROR: Postgres did not become ready in 30s!
    pause
    exit /b 1
)
podman exec infra-postgres-1 pg_isready -U postgres >nul 2>&1
if !errorlevel! neq 0 (
    timeout /t 1 /nobreak >nul
    goto wait_postgres
)
echo       Postgres ready.

set RETRIES=0
:wait_keycloak
set /a RETRIES+=1
if %RETRIES% gtr 60 (
    echo       WARNING: Keycloak not ready after 60s, continuing anyway...
    goto keycloak_done
)
curl -s -o nul -w "" http://localhost:9080/realms/autorepairshop/.well-known/openid-configuration >nul 2>&1
if !errorlevel! neq 0 (
    timeout /t 2 /nobreak >nul
    goto wait_keycloak
)
echo       Keycloak ready.
:keycloak_done
echo       Infrastructure is ready.
echo.

:: STEP 6: Start all Java microservices
echo [6/6] Starting all microservices...
echo.

cd /d "%BASE_DIR%"

echo       [ 1/12] gateway-service        port 8080
start "gateway-service" cmd /c "java -jar %BASE_DIR%services\gateway-service\target\gateway-service-1.0.0-SNAPSHOT.jar"
timeout /t 8 /nobreak >nul

echo       [ 2/12] tenantadmin-service    port 8081
start "tenantadmin-service" cmd /c "java -jar %BASE_DIR%services\tenantadmin-service\target\tenantadmin-service-1.0.0-SNAPSHOT.jar"
timeout /t 5 /nobreak >nul

echo       [ 3/12] customer-service       port 8082
start "customer-service" cmd /c "java -jar %BASE_DIR%services\customer-service\target\customer-service-1.0.0-SNAPSHOT.jar"
timeout /t 5 /nobreak >nul

echo       [ 4/12] vehicle-service        port 8083
start "vehicle-service" cmd /c "java -jar %BASE_DIR%services\vehicle-service\target\vehicle-service-1.0.0-SNAPSHOT.jar"
timeout /t 5 /nobreak >nul

echo       [ 5/12] workorder-service      port 8084
start "workorder-service" cmd /c "java -jar %BASE_DIR%services\workorder-service\target\workorder-service-1.0.0-SNAPSHOT.jar"
timeout /t 5 /nobreak >nul

echo       [ 6/12] inventory-service      port 8085
start "inventory-service" cmd /c "java -jar %BASE_DIR%services\inventory-service\target\inventory-service-1.0.0-SNAPSHOT.jar"
timeout /t 5 /nobreak >nul

echo       [ 7/12] payment-service        port 8086
start "payment-service" cmd /c "java -jar %BASE_DIR%services\payment-service\target\payment-service-1.0.0-SNAPSHOT.jar"
timeout /t 5 /nobreak >nul

echo       [ 8/12] appointment-service    port 8087
start "appointment-service" cmd /c "java -jar %BASE_DIR%services\appointment-service\target\appointment-service-1.0.0-SNAPSHOT.jar"
timeout /t 5 /nobreak >nul

echo       [ 9/12] file-service           port 8088
start "file-service" cmd /c "java -jar %BASE_DIR%services\file-service\target\file-service-1.0.0-SNAPSHOT.jar"
timeout /t 5 /nobreak >nul

echo       [10/12] audit-service          port 8089
start "audit-service" cmd /c "java -jar %BASE_DIR%services\audit-service\target\audit-service-1.0.0-SNAPSHOT.jar"
timeout /t 5 /nobreak >nul

echo       [11/12] notification-service   port 8090
start "notification-service" cmd /c "java -jar %BASE_DIR%services\notification-service\target\notification-service-1.0.0-SNAPSHOT.jar"
timeout /t 5 /nobreak >nul

echo       [12/12] query-bff-service      port 8091
start "query-bff-service" cmd /c "java -jar %BASE_DIR%services\query-bff-service\target\query-bff-service-1.0.0-SNAPSHOT.jar"
timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo   All 12 services started!
echo ============================================
echo.
echo   Infrastructure:
echo     Postgres          localhost:5433
echo     Keycloak          http://localhost:9080
echo     Kafka             localhost:9092
echo     Redis             localhost:6379
echo     MinIO             http://localhost:9000
echo     Prometheus        http://localhost:9090
echo     Grafana           http://localhost:3001
echo.
echo   Microservices:
echo     gateway-service       http://localhost:8080
echo     tenantadmin-service   http://localhost:8081
echo     customer-service      http://localhost:8082
echo     vehicle-service       http://localhost:8083
echo     workorder-service     http://localhost:8084
echo     inventory-service     http://localhost:8085
echo     payment-service       http://localhost:8086
echo     appointment-service   http://localhost:8087
echo     file-service          http://localhost:8088
echo     audit-service         http://localhost:8089
echo     notification-service  http://localhost:8090
echo     query-bff-service     http://localhost:8091
echo.
echo   Kullanici Bilgileri:
echo     owner@demo.com     / password123  OWNER
echo     admin@demo.com     / password123  ADMIN
echo     mechanic@demo.com  / password123  MECHANIC
echo     staff@demo.com     / password123  STAFF
echo     admin2@demo.com    / password123  ADMIN - Tenant 2
echo.
echo   Press any key to also start the frontend...
pause >nul

cd /d "%BASE_DIR%frontend"
start "frontend" cmd /c "npm run dev"
echo   Frontend starting at http://localhost:5173
pause
