@echo off
echo ============================================
echo   AutoRepairShop - Starting All Services
echo ============================================
echo.

set BASE_DIR=%~dp0

echo [1/12] Starting gateway-service (port 8080)...
start "gateway-service [8080]" cmd /c "java -jar %BASE_DIR%services\gateway-service\target\gateway-service-1.0.0-SNAPSHOT.jar"
timeout /t 5 /nobreak >nul

echo [2/12] Starting tenantadmin-service (port 8081)...
start "tenantadmin-service [8081]" cmd /c "java -jar %BASE_DIR%services\tenantadmin-service\target\tenantadmin-service-1.0.0-SNAPSHOT.jar"
timeout /t 3 /nobreak >nul

echo [3/12] Starting customer-service (port 8082)...
start "customer-service [8082]" cmd /c "java -jar %BASE_DIR%services\customer-service\target\customer-service-1.0.0-SNAPSHOT.jar"
timeout /t 3 /nobreak >nul

echo [4/12] Starting vehicle-service (port 8083)...
start "vehicle-service [8083]" cmd /c "java -jar %BASE_DIR%services\vehicle-service\target\vehicle-service-1.0.0-SNAPSHOT.jar"
timeout /t 3 /nobreak >nul

echo [5/12] Starting workorder-service (port 8084)...
start "workorder-service [8084]" cmd /c "java -jar %BASE_DIR%services\workorder-service\target\workorder-service-1.0.0-SNAPSHOT.jar"
timeout /t 3 /nobreak >nul

echo [6/12] Starting inventory-service (port 8085)...
start "inventory-service [8085]" cmd /c "java -jar %BASE_DIR%services\inventory-service\target\inventory-service-1.0.0-SNAPSHOT.jar"
timeout /t 3 /nobreak >nul

echo [7/12] Starting payment-service (port 8086)...
start "payment-service [8086]" cmd /c "java -jar %BASE_DIR%services\payment-service\target\payment-service-1.0.0-SNAPSHOT.jar"
timeout /t 3 /nobreak >nul

echo [8/12] Starting appointment-service (port 8087)...
start "appointment-service [8087]" cmd /c "java -jar %BASE_DIR%services\appointment-service\target\appointment-service-1.0.0-SNAPSHOT.jar"
timeout /t 3 /nobreak >nul

echo [9/12] Starting file-service (port 8088)...
start "file-service [8088]" cmd /c "java -jar %BASE_DIR%services\file-service\target\file-service-1.0.0-SNAPSHOT.jar"
timeout /t 3 /nobreak >nul

echo [10/12] Starting audit-service (port 8089)...
start "audit-service [8089]" cmd /c "java -jar %BASE_DIR%services\audit-service\target\audit-service-1.0.0-SNAPSHOT.jar"
timeout /t 3 /nobreak >nul

echo [11/12] Starting notification-service (port 8090)...
start "notification-service [8090]" cmd /c "java -jar %BASE_DIR%services\notification-service\target\notification-service-1.0.0-SNAPSHOT.jar"
timeout /t 3 /nobreak >nul

echo [12/12] Starting query-bff-service (port 8091)...
start "query-bff-service [8091]" cmd /c "java -jar %BASE_DIR%services\query-bff-service\target\query-bff-service-1.0.0-SNAPSHOT.jar"

echo.
echo ============================================
echo   All 12 services started!
echo ============================================
echo.
echo   gateway-service       http://localhost:8080
echo   tenantadmin-service   http://localhost:8081
echo   customer-service      http://localhost:8082
echo   vehicle-service       http://localhost:8083
echo   workorder-service     http://localhost:8084
echo   inventory-service     http://localhost:8085
echo   payment-service       http://localhost:8086
echo   appointment-service   http://localhost:8087
echo   file-service          http://localhost:8088
echo   audit-service         http://localhost:8089
echo   notification-service  http://localhost:8090
echo   query-bff-service     http://localhost:8091
echo.
echo   Frontend: npm run dev  (http://localhost:5173)
echo ============================================
pause
