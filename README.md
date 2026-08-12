# 家庭明日菜单投票

> 在微信里分享，全家一起选明天吃啥 · 一人一票 · 198 道家常菜

---

## 最简单 5 分钟上线（推荐 Render 免费部署）

```
┌─────────────────────────────────────────────┐
│  1. GitHub 创建空仓库 (1 分钟)              │
│     ↓                                       │
│  2. 双击 push-to-github.bat 推送代码 (1分钟) │
│     ↓                                       │
│  3. render.com 点几下部署 (3 分钟)          │
│     ↓                                       │
│  4. 微信群里发链接，全家开始投票 🎉         │
└─────────────────────────────────────────────┘
```

### 详细步骤

**Step 1: 创建 GitHub 仓库**
- 打开 [github.com/new](https://github.com/new)
- 填仓库名（如 `family-meal`），选 `Public`
- **不要勾选** "Add a README file"
- 点 `Create repository`

**Step 2: 推送代码**
- 双击项目里的 `push-to-github.bat`
- 按提示输入 GitHub 用户名和仓库名
- 第一次推送会让你登录 GitHub

**Step 3: Render 部署**
- 注册 [render.com](https://render.com)（用 GitHub 一键登录）
- 点 `New +` → `Blueprint Instance`
- 选刚才的 `family-meal` 仓库
- Render 自动读取 `render.yaml`，点 `Apply`
- 等 2-3 分钟，看到 `Your service is live 🎉`

**Step 4: 分享**
你会得到 `https://family-meal-vote.onrender.com`，发到家庭群就行。

> **完全免费**：Render 免费 750 小时/月，足够全天候运行
> **自动 HTTPS**：微信要求 HTTPS，免费给
> **永久链接**：除非你自己删，不会变

---

## 其他方案对比

| 方案 | 难度 | 费用 | 适用场景 |
|------|------|------|----------|
| **Render 一键** | ⭐ | 完全免费 | **首选！**永久链接 |
| 本机 start.bat | ⭐ | 0 | 局域网内/临时 |
| Docker deploy.bat | ⭐⭐ | 0 | NAS/树莓派 |
| 云服务器 | ⭐⭐⭐⭐ | ¥30+/月起 | 不推荐家庭 |

---

## 备选 1: 本机一键启动

```bash
# Windows
双击 start.bat

# Linux/macOS
./start.sh
```

浏览器打开 `http://localhost:3000`，把**局域网 IP** 发到家庭群：

```bash
# 查看本机 IP
ipconfig        # Windows
ifconfig        # macOS/Linux
```

---

## 备选 2: Docker 一键部署

```bash
# Windows
双击 deploy.bat

# Linux/macOS
./deploy.sh
```

数据库自动保存在 `./data/db/`。

---

## 备选 3: 内网穿透（本机+公网访问）

启动服务后用 Cloudflare Tunnel 暴露：

```bash
# 下载 cloudflared
# https://github.com/cloudflare/cloudflared/releases

cloudflared tunnel --url http://localhost:3000
```

会得到临时 `https://xxx.trycloudflare.com`，免费但每次会变。

---

## 不想折腾？还有零代码方案

如果觉得上面都麻烦，直接用现成工具：

| 工具 | 做法 |
|------|------|
| **腾讯文档** | 创建表格 → 投票功能 |
| **金山文档** | 同上 |
| **飞书表格** | 内置投票 |
| **接龙小程序** | 微信里搜"接龙" |
| **微信群投票** | 群聊里点"+→投票" |

这些 1 分钟搞定，但功能简陋（没有菜谱库、做法）。

**本项目的优势**就是 198 道家常菜 + 完整做法 + 投完直接看菜谱。

---

## 功能

- 微信内置浏览器打开，不跳出
- 198 道家常菜（17 道扬州特色 + 川鲁粤淮扬）
- 一人一票，可改投
- 中晚餐分开投
- 实时揭晓排名
- 自定义菜谱
- 复制链接分享

## 目录

```
family-meal-vote/
├── push-to-github.bat   推代码到 GitHub
├── start.bat / .sh      本机一键启动
├── deploy.bat / .sh     Docker 一键部署
├── render.yaml          Render 一键部署配置
├── Dockerfile
├── docker-compose.yml
├── server.js            后端
├── db.js                数据库
├── data/recipes.json    198 道菜谱
├── public/              前端
└── README.md
```

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/recipes | 菜谱（支持 `?q= ?category=`） |
| POST | /api/recipes | 添加菜谱 |
| GET | /api/members | 家庭成员 |
| POST | /api/members | 添加成员 |
| GET | /api/votes?date=&meal= | 某餐投票 |
| POST | /api/votes | 投票（一人一票） |
| GET | /api/stats | 统计 |
| GET | /api/health | 健康检查 |

## License

MIT
