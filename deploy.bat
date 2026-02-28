@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set BASE_DIR=%~dp0
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set CYAN=[96m
set RESET=[0m

echo %CYAN%============================================%RESET%
echo %CYAN%  AutoRepairShop - Full Deploy Script%RESET%
echo %CYAN%============================================%RESET%
echo.

:: ──────────────────────────────────────────
:: STEP 0: Parse arguments
:: ──────────────────────────────────────────
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

:: ──────────────────────────────────────────
:: STEP 1: Stop existing Java services
:: ──────────────────────────────────────────
echo %YELLOW%[1/6] Stopping existing Java services...%RESET%
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080 :8081 :8082 :8083 :8084 :8085 :8086 :8087 :8088 :8089 :8090 :8091" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo %GREEN%       Done.%RESET%
echo.

:: ──────────────────────────────────────────
:: STEP 2: Maven clean install
:: ──────────────────────────────────────────
if %SKIP_BUILD%==1 (
    echo %YELLOW%[2/6] Skipping Maven build (--skip-build)%RESET%
) else (
    echo %YELLOW%[2/6] Building all services with Maven...%RESET%
    echo       This may take a few minutes...
    cd /d "%BASE_DIR%"
    call mvn clean install -DskipTests -q
    if !errorlevel! neq 0 (
        echo %RED%       Maven build FAILED! Fix errors and retry.%RESET%
        pause
        exit /b 1
    )
    echo %GREEN%       Maven build SUCCESS.%RESET%
)
echo.

:: ──────────────────────────────────────────
:: STEP 3: Podman compose (infra)
:: ──────────────────────────────────────────
if %SKIP_INFRA%==1 (
    echo %YELLOW%[3/6] Skipping infrastructure (--skip-infra)%RESET%
) else (
    echo %YELLOW%[3/6] Starting infrastructure (podman-compose)...%RESET%
    cd /d "%BASE_DIR%infra"
    podman-compose down >nul 2>&1
    podman-compose up -d
    if !errorlevel! neq 0 (
        echo %RED%       podman-compose up FAILED!%RESET%
        pause
        exit /b 1
    )
    echo %GREEN%       Infrastructure started.%RESET%
)
echo.

:: ──────────────────────────────────────────
:: STEP 4: Reset Keycloak DB (optional)
:: ──────────────────────────────────────────
if %RESET_KC%==1 (
    echo %YELLOW%[4/6] Resetting Keycloak database...%RESET%
    cd /d "%BASE_DIR%infra"
    podman-compose stop keycloak >nul 2>&1
    podman-compose rm -f keycloak >nul 2>&1
    podman exec infra-postgres-1 psql -U postgres -c "DROP DATABASE IF EXISTS keycloak_db;" >nul 2>&1
    podman exec infra-postgres-1 psql -U postgres -c "CREATE DATABASE keycloak_db OWNER postgres;" >nul 2>&1
    podman-compose up -d keycloak
    echo %GREEN%       Keycloak DB reset and restarted.%RESET%
) else (
    echo %YELLOW%[4/6] Keycloak DB reset skipped (use --reset-keycloak to reset)%RESET%
)
echo.

:: ──────────────────────────────────────────
:: STEP 5: Wait for infra to be ready
:: ──────────────────────────────────────────
echo %YELLOW%[5/6] Waiting for infrastructure to be ready...%RESET%
set RETRIES=0

:wait_postgres
set /a RETRIES+=1
if %RETRIES% gtr 30 (
    echo %RED%       Postgres did not become ready in 30s!%RESET%
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
    echo %YELLOW%       Keycloak not ready after 60s, continuing anyway...%RESET%
    goto keycloak_done
)
curl -s -o nul -w "" http://localhost:9080/realms/autorepairshop/.well-known/openid-configuration >nul 2>&1
if !errorlevel! neq 0 (
    timeout /t 2 /nobreak >nul
    goto wait_keycloak
)
echo       Keycloak ready.
:keycloak_done
echo %GREEN%       Infrastructure is ready.%RESET%
echo.

:: ──────────────────────────────────────────
:: STEP 6: Start all Java microservices
:: ──────────────────────────────────────────
echo %YELLOW%[6/6] Starting all microservices...%RESET%
echo.

cd /d "%BASE_DIR%"

set SVC[0]=gateway-service
set PORT[0]=8080
set WAIT[0]=8

set SVC[1]=tenantadmin-service
set PORT[1]=8081
set WAIT[1]=5

set SVC[2]=customer-service
set PORT[2]=8082
set WAIT[2]=5

set SVC[3]=vehicle-service
set PORT[3]=8083
set WAIT[3]=5

set SVC[4]=workorder-service
set PORT[4]=8084
set WAIT[4]=5

set SVC[5]=inventory-service
set PORT[5]=8085
set WAIT[5]=5

set SVC[6]=payment-service
set PORT[6]=8086
set WAIT[6]=5

set SVC[7]=appointment-service
set PORT[7]=8087
set WAIT[7]=5

set SVC[8]=file-service
set PORT[8]=8088
set WAIT[8]=5

set SVC[9]=audit-service
set PORT[9]=8089
set WAIT[9]=5

set SVC[10]=notification-service
set PORT[10]=8090
set WAIT[10]=5

set SVC[11]=query-bff-service
set PORT[11]=8091
set WAIT[11]=3

for /L %%i in (0,1,11) do (
    set "svc=!SVC[%%i]!"
    set "port=!PORT[%%i]!"
    set "wait=!WAIT[%%i]!"
    set /a num=%%i+1
    echo       [!num!/12] !svc! ^(port !port!^)
    start "!svc! [!port!]" cmd /c "java -jar %BASE_DIR%services\!svc!\target\!svc!-1.0.0-SNAPSHOT.jar"
    timeout /t !wait! /nobreak >nul
)

echo.
echo %GREEN%============================================%RESET%
echo %GREEN%  All services started!%RESET%
echo %GREEN%============================================%RESET%
echo.
echo   %CYAN%Infrastructure:%RESET%
echo     Postgres          localhost:5433
echo     Keycloak          http://localhost:9080
echo     Kafka             localhost:9092
echo     Redis             localhost:6379
echo     MinIO             http://localhost:9000
echo     Prometheus        http://localhost:9090
echo     Grafana           http://localhost:3001
echo.
echo   %CYAN%Microservices:%RESET%
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
echo   %CYAN%Frontend:%RESET%
echo     Run manually:  cd frontend ^&^& npm run dev
echo     URL:           http://localhost:5173
echo.
echo   %CYAN%Kullanici Bilgileri:%RESET%
echo     owner@demo.com     / password123  (OWNER)
echo     admin@demo.com     / password123  (ADMIN)
echo     mechanic@demo.com  / password123  (MECHANIC)
echo     staff@demo.com     / password123  (STAFF)
echo     admin2@demo.com    / password123  (ADMIN - Tenant 2)
echo.
echo %YELLOW%  Press any key to also start the frontend...%RESET%
pause >nul

cd /d "%BASE_DIR%frontend"
start "frontend [5173]" cmd /c "npm run dev"
echo %GREEN%  Frontend starting at http://localhost:5173%RESET%
pause
