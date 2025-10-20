@echo off
REM luckygo Docker Management Script for Windows
REM Usage: docker-scripts.bat [command] [options]

setlocal enabledelayedexpansion

REM Check if Docker and Docker Compose are installed
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker first.
    exit /b 1
)

where docker-compose >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

REM Handle commands
set command=%1
if "%command%"=="" set command=help

if "%command%"=="dev:up" goto dev_up
if "%command%"=="dev-up" goto dev_up
if "%command%"=="dev:down" goto dev_down
if "%command%"=="dev-down" goto dev_down
if "%command%"=="dev:logs" goto dev_logs
if "%command%"=="dev-logs" goto dev_logs
if "%command%"=="prod:up" goto prod_up
if "%command%"=="prod-up" goto prod_up
if "%command%"=="prod:nginx" goto prod_nginx
if "%command%"=="prod-nginx" goto prod_nginx
if "%command%"=="prod:down" goto prod_down
if "%command%"=="prod-down" goto prod_down
if "%command%"=="prod:logs" goto prod_logs
if "%command%"=="prod-logs" goto prod_logs
if "%command%"=="build" goto build
if "%command%"=="status" goto status
if "%command%"=="clean" goto clean
if "%command%"=="backup" goto backup
if "%command%"=="help" goto help
if "%command%"=="-h" goto help
if "%command%"=="--help" goto help

echo [ERROR] Unknown command: %command%
echo.
goto help

:dev_up
echo [INFO] Starting development environment...
if not exist .env (
    copy .env.example .env >nul 2>nul
)
docker-compose -f docker-compose.dev.yml up -d
echo [SUCCESS] Development environment started!
echo [INFO] Application: http://localhost:3000
echo [INFO] Redis Commander: http://localhost:8081
goto end

:dev_down
echo [INFO] Stopping development environment...
docker-compose -f docker-compose.dev.yml down
echo [SUCCESS] Development environment stopped!
goto end

:dev_logs
docker-compose -f docker-compose.dev.yml logs -f
goto end

:prod_up
echo [INFO] Starting production environment...
if not exist .env (
    echo [WARNING] No .env file found. Copying from .env.docker
    copy .env.docker .env >nul
)
docker-compose up -d
echo [SUCCESS] Production environment started!
echo [INFO] Application: http://localhost:3000
goto end

:prod_nginx
echo [INFO] Starting production environment with Nginx...
if not exist .env (
    echo [WARNING] No .env file found. Copying from .env.docker
    copy .env.docker .env >nul
)
docker-compose --profile production up -d
echo [SUCCESS] Production environment with Nginx started!
echo [INFO] Application: http://localhost:80
goto end

:prod_down
echo [INFO] Stopping production environment...
docker-compose down
echo [SUCCESS] Production environment stopped!
goto end

:prod_logs
docker-compose logs -f
goto end

:build
echo [INFO] Building Docker images...
docker-compose build
echo [SUCCESS] Images built successfully!
goto end

:status
echo [INFO] Checking service status...
echo === Development Services ===
docker-compose -f docker-compose.dev.yml ps 2>nul || echo Development environment not running
echo.
echo === Production Services ===
docker-compose ps 2>nul || echo Production environment not running
goto end

:clean
echo [WARNING] This will remove all containers, networks, and images. Are you sure? (y/N)
set /p response=
if /i "%response%"=="y" (
    echo [INFO] Cleaning up Docker resources...
    docker-compose -f docker-compose.dev.yml down --rmi all --volumes --remove-orphans 2>nul
    docker-compose down --rmi all --volumes --remove-orphans 2>nul
    docker system prune -f
    echo [SUCCESS] Cleanup completed!
) else (
    echo [INFO] Cleanup cancelled.
)
goto end

:backup
echo [INFO] Creating Redis backup...
docker-compose exec -T redis redis-cli BGSAVE
timeout /t 2 >nul
for /f %%i in ('docker-compose ps -q redis') do (
    docker cp %%i:/data/dump.rdb redis-backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%.rdb
)
echo [SUCCESS] Redis backup created!
goto end

:help
echo luckygo Docker Management Script for Windows
echo.
echo Usage: %0 [command]
echo.
echo Development Commands:
echo   dev:up       Start development environment
echo   dev:down     Stop development environment
echo   dev:logs     View development logs
echo.
echo Production Commands:
echo   prod:up      Start production environment
echo   prod:nginx   Start production with Nginx
echo   prod:down    Stop production environment
echo   prod:logs    View production logs
echo.
echo Utility Commands:
echo   build        Build Docker images
echo   status       Show service status
echo   clean        Clean up all Docker resources
echo   backup       Backup Redis data
echo   help         Show this help message
echo.
echo Examples:
echo   %0 dev:up              # Start development environment
echo   %0 prod:nginx          # Start production with Nginx
echo   %0 backup              # Backup Redis data
goto end

:end
endlocal
