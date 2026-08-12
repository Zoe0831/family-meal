# 零命令行部署指南（推荐！）

> 完全不用装 git，不用记命令，全程鼠标点击

---

## 整体流程（5 分钟）

```
Phase 1: GitHub 网页上传文件     3 分钟
   创建仓库 → 拖拽上传 → 搞定
        ↓
Phase 2: Render 一键部署         1 分钟
   登录 → 选仓库 → Apply
        ↓
Phase 3: 分享到家庭群             1 分钟
   复制链接 → 发群里
```

---

## Phase 1: GitHub 上传代码

### 1.1 注册 GitHub

打开 https://github.com/signup

填邮箱、密码、用户名，验证邮箱。

### 1.2 创建空仓库

打开 https://github.com/new

填写：

| 字段 | 填什么 |
|------|--------|
| Repository name | `family-meal` |
| Public/Private | **Public** |
| Add README | **不勾** |

点 `Create repository`

### 1.3 上传项目文件

创建后会跳到仓库页面，看到：

```
Quick setup — if you've done this kind of thing before
```

往下找，看到：

```
or create a new repository on the command line
or upload an existing file            ← 点这个
```

点 `uploading an existing file` 链接。

进入上传页面后：

1. **打开主人电脑上的 `family-meal-vote` 文件夹**
2. **进入文件夹内部**（不是父目录）
3. **全选所有文件和子文件夹**（Ctrl+A）
4. **拖拽到浏览器上传区**
   ```
   ┌────────────────────────────┐
   │   Drop files here to       │
   │   upload them to your      │
   │       repository           │
   └────────────────────────────┘
   ```

上传会花 1-2 分钟（198 道菜谱比较大）。

最后点绿色 `Commit changes`。

### 1.4 验证

打开 `https://github.com/你的用户名/family-meal`

应该能看到所有文件，包括 `data/recipes.json`、`server.js`、`public/` 等。

---

## Phase 2: Render 部署

### 2.1 注册 Render

打开 https://render.com

点 `Get Started for Free` → 用 GitHub 登录（**重要**）

### 2.2 一键部署

1. 登录后点右上角 `New +`
2. 选 `Blueprint`
3. 在仓库列表找 `family-meal`，点 `Connect`

Render 自动检测到 `render.yaml`：

```
1 service: family-meal-vote
  Plan: Free
```

直接点蓝色 `Apply`

### 2.3 等待部署

等 2-3 分钟，看到：

```
==> Your service is live
```

就是成功了！

---

## Phase 3: 分享

复制 Render 给主人的链接：

```
https://family-meal-vote-xxxx.onrender.com
```

发到家庭群：

```
明天吃啥？投票工具已上线 🎉
https://family-meal-vote-xxxx.onrender.com
```

家人在微信里点开就能用 🎉

---

## 常见问题

### Q: 上传文件提示文件太大？

GitHub 网页上传限制 25MB/文件，主人项目总共 150KB，应该没问题。
如果 `recipes.json` 上传失败，分两步：
1. 先上传其他文件
2. 再单独上传 `data/recipes.json`

### Q: Render 部署失败？

控制台 → `Logs` 看错误。
最常见：依赖装不上，点 `Manual Deploy` 重试。

### Q: 微信打不开链接？

Render 自动 HTTPS，肯定能开。如果不行：
- 完整复制链接
- 在电脑浏览器先测一下

### Q: 15 分钟不用就休眠？

免费版会休眠，但下次访问自动唤醒（30 秒）。

### Q: 想更新菜谱 / 加新菜？

最简单：网页上点 `+ 添加我的菜`。

### Q: 想绑定自己的域名？

Render 控制台 → Settings → Custom Domain → 加 CNAME。

---

## 完成后体验

```
微信群 → 点链接 → 选身份 → 投票
                        ↓
              看结果、查菜谱
                        ↓
                出门买菜做饭 🍳
```

---

## 主人测试清单

部署成功后，在电脑浏览器打开链接，验证：

- [ ] 能看到角色选择页（爸爸/妈妈/爷爷）
- [ ] 选一个角色能进主页
- [ ] 点"选一道菜"能浏览 198 道菜
- [ ] 搜索"扬州"能找到扬州炒饭
- [ ] 点菜能看完整做法
- [ ] 投一票成功
- [ ] 在另一台手机打开同一链接
- [ ] 也能看到刚才的投票

全部 OK 就发到家庭群！
