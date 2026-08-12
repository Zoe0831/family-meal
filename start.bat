@echo off
chcp 65001 >nul
title 家庭明日菜单投票 - 一键启动

echo.
echo ========================================
echo    🍱 家庭明日菜单投票 一键启动
echo ========================================
echo.

REM 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装
    echo 下载地址: https://nodejs.org/
    echo 推荐版本: Node.js 20 LTS 或更高
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [✓] 检测到 %NODE_VER%

REM 检查 npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 npm
    pause
    exit /b 1
)

REM 检查依赖
if not exist "node_modules" (
    echo.
    echo [→] 第一次运行，正在安装依赖...
    call npm install --no-audit --no-fund
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo [✓] 依赖安装完成
) else (
    echo [✓] 依赖已就绪
)

REM 检查端口
set PORT=3000
echo.
echo [→] 端口: %PORT%
echo [→] 浏览器访问: http://localhost:%PORT%
echo.
echo 小提示:
echo   - 在家庭群里分享 http://你的电脑IP:%PORT% 给家人
echo   - 如需从外网访问，请配置内网穿透（参考 README.md）
echo   - 按 Ctrl+C 停止服务
echo.
echo ========================================
echo.

REM 启动服务
node server.js
