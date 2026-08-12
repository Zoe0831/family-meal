@echo off
chcp 65001 >nul
title 打包项目为 zip

echo.
echo ========================================
echo    打包 family-meal-vote 为 zip
echo ========================================
echo.

REM 创建临时目录
set TMP_DIR=family-meal-deploy
if exist "%TMP_DIR%" rd /s /q "%TMP_DIR%"
mkdir "%TMP_DIR%"

REM 复制项目文件（排除 node_modules、.db、.log 等）
echo [→] 复制项目文件...
xcopy /e /i /y /q public "%TMP_DIR%\public" >nul
xcopy /e /i /y /q data "%TMP_DIR%\data" >nul
xcopy /e /i /y /q scripts "%TMP_DIR%\scripts" >nul
copy /y server.js "%TMP_DIR%\" >nul
copy /y db.js "%TMP_DIR%\" >nul
copy /y package.json "%TMP_DIR%\" >nul
copy /y Dockerfile "%TMP_DIR%\" >nul
copy /y docker-compose.yml "%TMP_DIR%\" >nul
copy /y render.yaml "%TMP_DIR%\" >nul
copy /y .dockerignore "%TMP_DIR%\" >nul
copy /y .env.example "%TMP_DIR%\" >nul
copy /y README.md "%TMP_DIR%\" >nul
copy /y DEPLOY.md "%TMP_DIR%\" >nul
copy /y start.bat "%TMP_DIR%\" >nul
copy /y start.sh "%TMP_DIR%\" >nul
copy /y deploy.bat "%TMP_DIR%\" >nul
copy /y deploy.sh "%TMP_DIR%\" >nul
copy /y push-to-github.bat "%TMP_DIR%\" >nul

REM 检查 PowerShell 的 Compress-Archive
echo [→] 打包 zip...
powershell -Command "Compress-Archive -Path '%TMP_DIR%\*' -DestinationPath 'family-meal-vote.zip' -Force"

REM 清理临时目录
rd /s /q "%TMP_DIR%"

echo.
echo ========================================
echo    打包完成！
echo ========================================
echo.
echo 文件: family-meal-vote.zip
echo.
echo 下一步:
echo   1. 解压 zip
echo   2. 进入解压后的 family-meal-vote 文件夹
echo   3. 全选里面所有文件，拖到 GitHub 上传页面
echo.
echo 详细步骤看 DEPLOY.md
echo.
pause
