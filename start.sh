#!/bin/bash
set -e

echo ""
echo "========================================"
echo "   家庭明日菜单投票 一键启动"
echo "========================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
    echo "[错误] 未检测到 Node.js"
    echo "Ubuntu/Debian: sudo apt install nodejs npm"
    echo "macOS: brew install node"
    echo "或下载: https://nodejs.org/"
    exit 1
fi

NODE_VER=$(node -v)
echo "[OK] Node.js: $NODE_VER"

NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1 | tr -d 'v')
if [ "$NODE_MAJOR" -lt 20 ]; then
    echo "[警告] 建议 Node.js 20+ (当前 $NODE_VER)"
fi

if [ ! -d "node_modules" ]; then
    echo ""
    echo "[安装] 第一次运行，正在安装依赖..."
    npm install --no-audit --no-fund
    echo "[OK] 依赖安装完成"
else
    echo "[OK] 依赖已就绪"
fi

PORT=${PORT:-3000}
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ip route get 1 2>/dev/null | awk '{print $7; exit}' || echo "")

echo ""
echo "[端口] $PORT"
echo "[本机] http://localhost:$PORT"
if [ -n "$LOCAL_IP" ]; then
    echo "[局域网] http://$LOCAL_IP:$PORT"
fi
echo ""
echo "把局域网地址发到家庭群，家人扫码就能用"
echo "按 Ctrl+C 停止服务"
echo ""
echo "========================================"
echo ""

exec node server.js
