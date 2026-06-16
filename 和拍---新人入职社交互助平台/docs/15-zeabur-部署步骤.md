# 和拍 · Zeabur 部署说明（含大陆限制）

---

## ⚠️ 中国大陆用户：为什么可能「用不了」

Zeabur 会提示 **「中国大陆网络环境限制」**，常见原因：

| 限制 | 含义 |
|------|------|
| **区域选错** | 若选 **中国大陆** 机房，服务器 **访问不了 GitHub、Docker Hub**，构建会失败 |
| **域名备案** | 用 Zeabur 子域名或自己的域名给大陆用户长期访问，常需 **实名认证** 或 **已备案域名** |
| **网络环境** | 本机访问 GitHub / Zeabur 控制台也可能慢或失败 |

**结论：** 在大陆做演示，**更推荐下面「替代方案」**，不必死磕 Zeabur。

---

## 大陆用户推荐（按简单程度）

### 方案 A：本机 Docker + cpolar（最省事）

```bash
# 终端 1
cd ~/Downloads/text/和拍---新人入职社交互助平台
npm run docker

# 终端 2（先注册 https://www.cpolar.com/ 拿 token）
cpolar http 8080
```

用 cpolar 给的 **https 地址** 发给别人或填钉钉（若控制台支持保留子域名可固定）。

---

### 方案 B：本机试点 + localtunnel（零注册云）

```bash
# 终端 1
npm run pilot:dingtalk

# 终端 2（关 VPN）
npx localtunnel --port 8080 --local-host 127.0.0.1
```

链接会变，适合 **临时演示**；钉钉聊天发链接即可，不必工作台固定入口。

---

### 方案 C：Oracle 免费云 + DuckDNS（固定网址、电脑可关）

见 [13-oracle-傻瓜部署.md](./13-oracle-傻瓜部署.md)。

---

# 若仍要用 Zeabur（必读设置）

## 关键设置（避免大陆限制）

1. **区域必须选：Hong Kong / Tokyo / Singapore**  
   **不要选** 「中国大陆」「China」「Beijing」等。

2. **完成 Zeabur 账号实名**（若要用平台子域名）。

3. 代码仍需在 **GitHub**；本机 push 前确保能打开 github.com。

---

## 第一步：代码推到 GitHub

### 1.1 新建仓库

1. https://github.com/ → 登录  
2. 右上角 **+** → **New repository**  
3. 名称：`hepai-demo` → **Create**（不要勾选 README）

### 1.2 Mac 上传

```bash
cd ~/Downloads/text
git init
git add Dockerfile docker-compose.yml .dockerignore render.yaml hepai-server "和拍---新人入职社交互助平台"
git commit -m "和拍部署"
git branch -M main
git remote add origin https://github.com/你的用户名/hepai-demo.git
git push -u origin main
```

---

## 第二步：Zeabur 控制台（界面可能略有不同）

登录：https://zeabur.com/ （建议用 GitHub 登录）

### 找入口（对照你屏幕上文字）

| 你想做的 | 在页面上找这些字 |
|----------|------------------|
| 新建项目 | **Create Project** / **新建项目** / 首页 **+** |
| 添加服务 | **Add Service** / **Deploy** / **部署服务** / **Git** 图标 |
| 选仓库 | **GitHub** → 授权 → 选 `hepai-demo` |
| 构建方式 | **Dockerfile**（仓库根目录已有） |
| 区域 | **Region** → 选 **Hong Kong**（香港） |
| 端口 | **Networking** / **网络** → **8080** |
| 域名 | **Domains** / **域名** → **Generate Domain** |

### 若看不到「Deploy New Service」

1. 先点进某个 **Project（项目）** 卡片  
2. 项目 **里面** 才有 **Add Service** 或 **+**  
3. 或首页直接 **Import from GitHub** / **从 GitHub 导入**

### 部署后

- 打开 **Logs**，等构建成功（约 5～15 分钟）  
- **Domains** 里生成 `https://xxx.zeabur.app`  
- 浏览器访问，账号 **E00001 / 123456**

---

## 第三步：钉钉（域名能打开时）

| 项 | 填写 |
|----|------|
| H5 首页 | `https://你的域名.zeabur.app/` |
| 可信域名 | `你的域名.zeabur.app` |

若 Zeabur 域名在大陆打不开，改用 **方案 A/B** 的链接，或 **Oracle 固定域名**。

---

## 常见问题

**构建失败、拉不下 Docker 镜像**  
→ 区域改 **香港**，不要用中国大陆。

**没有域名 / 绑定失败**  
→ 完成 Zeabur 实名，或换 **cpolar / Oracle**。

**控制台全是英文找不到按钮**  
→ 在项目 **内部** 找 **+** 或 **Add Service**，不要只在首页找。

**完全不想折腾**  
→ `npm run docker` + `cpolar http 8080`（方案 A）。

---

## 30 秒决策

```
在大陆、Zeabur 报错或找不到入口？
  → 用方案 A（Docker + cpolar）或方案 B（pilot + localtunnel）

要固定网址、电脑可关？
  → 用方案 C（Oracle 傻瓜部署）

坚持用 Zeabur？
  → 区域选香港 + 完成实名 + 在项目里 Add Service
```
