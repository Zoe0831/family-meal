@echo off
chcp 65001 >nul
title Docker 一键部署

echo.
echo ========================================
echo    Docker 一键部署
echo ========================================
echo.

REM 检查 Docker
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Docker
    echo 下载 Docker Desktop: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

REM 检查 docker-compose
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    set USE_COMPOSE_V1=true
)

REM 创建 .env
if not exist ".env" (
    echo [→] 创建 .env 文件
    copy .env.example .env >nul
)

echo [→] 构建镜像...
docker compose build
if %errorlevel% neq 0 (
    docker-compose build
    if %errorlevel% neq 0 (
        echo [错误] 镜像构建失败
        pause
        exit /b 1
    )
)

echo.
echo [→] 启动容器...
docker compose up -d
if %errorlevel% neq 0 (
    docker-compose up -d
    if %errorlevel% neq 0 (
        echo [错误] 启动失败
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo    部署成功！
echo ========================================
echo.
echo 访问地址: http://localhost:3000
echo.
echo 常用命令:
echo   查看日志:   docker compose logs -f
echo   停止服务:   docker compose down
echo   重启服务:   docker compose restart
echo   更新镜像:   deploy.bat
echo.
pause
