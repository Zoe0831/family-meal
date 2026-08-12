@echo off
chcp 65001 >nul
title 推送到 GitHub

echo.
echo ========================================
echo    推送到 GitHub 一键脚本
echo ========================================
echo.

set /p GH_USER="请输入你的 GitHub 用户名: "
set /p REPO_NAME="请输入仓库名 (默认 family-meal): "
if "%REPO_NAME%"=="" set REPO_NAME=family-meal

echo.
echo 仓库地址: https://github.com/%GH_USER%/%REPO_NAME%.git
echo.
echo 请先在 GitHub 网站上创建空仓库 %REPO_NAME% (不要初始化 README)
echo 然后回到这里按任意键继续...
pause >nul

REM 检查 git
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 git，请先安装
    echo 下载: https://git-scm.com/
    pause
    exit /b 1
)

REM 初始化
if not exist ".git" (
    echo [→] 初始化 git...
    git init
    git branch -M main
)

echo [→] 添加文件...
git add .

echo [→] 提交...
git commit -m "init: family meal vote"

echo [→] 设置远程...
git remote remove origin 2>nul
git remote add origin https://github.com/%GH_USER%/%REPO_NAME%.git

echo.
echo [→] 推送到 GitHub...
echo （第一次推送会要求登录 GitHub）
echo.
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [错误] 推送失败
    echo 常见原因:
    echo   1. GitHub 仓库不存在
    echo   2. 需要配置 Personal Access Token (PAT)
    echo      教程: https://docs.github.com/zh/authentication
    pause
    exit /b 1
)

echo.
echo ========================================
echo    推送成功！
echo ========================================
echo.
echo 下一步: 打开 https://render.com
echo   1. 用 GitHub 登录
echo   2. New + → Blueprint
echo   3. 选仓库 %REPO_NAME%
echo   4. 等 2-3 分钟完成部署
echo.
pause
