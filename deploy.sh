#!/bin/bash
set -e

echo ""
echo "========================================"
echo "   Docker 一键部署"
echo "========================================"
echo ""

if ! command -v docker >/dev/null 2>&1; then
    echo "[错误] 未检测到 Docker，请先安装"
    echo "安装文档: https://docs.docker.com/engine/install/"
    exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
    echo "[错误] 未检测到 docker compose v2"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "[→] 创建 .env 文件"
    cp .env.example .env
fi

echo "[→] 构建镜像..."
docker compose build

echo ""
echo "[→] 启动容器..."
docker compose up -d

echo ""
echo "========================================"
echo "   部署成功！"
echo "========================================"
echo ""
echo "访问地址: http://localhost:3000"
echo ""
echo "常用命令:"
echo "  查看日志:   docker compose logs -f"
echo "  停止服务:   docker compose down"
echo "  重启服务:   docker compose restart"
echo "  更新镜像:   ./deploy.sh"
