@echo off
echo ============================================
echo   AutoRepairShop - Stopping All Services
echo ============================================
echo.

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080 :8081 :8082 :8083 :8084 :8085 :8086 :8087 :8088 :8089 :8090 :8091" ^| findstr "LISTENING"') do (
    echo Killing PID %%a...
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo All services stopped.
pause
