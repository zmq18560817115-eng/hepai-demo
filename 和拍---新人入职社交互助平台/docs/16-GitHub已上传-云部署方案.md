# 代码已在 GitHub · 还能怎么部署？

> Zeabur 在大陆常受限。你已推 GitHub 后，**优先用 Render**（项目里已写好 `render.yaml`）。

---

## 方案对比（有 GitHub 时）

| 方案 | 难度 | 费用 | 固定网址 | 大陆访问 | 推荐度 |
|------|------|------|----------|----------|--------|
| **Render** | ⭐⭐ | 免费档 | ✅ `*.onrender.com` | 一般能开，偶慢 | ⭐⭐⭐⭐⭐ |
| **Railway** | ⭐⭐ | 有免费额度 | ✅ `*.up.railway.app` | 一般能开 | ⭐⭐⭐⭐ |
| **Fly.io** | ⭐⭐⭐ | 有免费额度 | ✅ `*.fly.dev` | 一般能开 | ⭐⭐⭐ |
| **Oracle 云** | ⭐⭐⭐⭐ | 0 元 | ✅ DuckDNS | 稳定 | 长期首选 |
| **本机 Docker+cpolar** | ⭐ | 0 元 | 看 cpolar | 好 | 临时演示 |

---

## 部署前检查：GitHub 仓库结构

打开你的 GitHub 仓库网页，**根目录**应能看到：

```
Dockerfile
docker-compose.yml
render.yaml
hepai-server/
和拍---新人入职社交互助平台/
```

若 **只有** `和拍---新人入职社交互助平台` 文件夹、**没有** 根目录 `Dockerfile`，需要把 **`text` 整个文件夹的内容** 作为仓库根目录重新 push（见文末「仓库结构错了怎么办」）。

---

# 方案一：Render（最推荐，已配好蓝图）

## 1. 注册

1. 打开 https://render.com/
2. **Get Started** → 用 **GitHub** 登录并授权

## 2. 用 Blueprint 部署（最简单）

1. 控制台点 **New +** → **Blueprint**
2. 选你的仓库（如 `hepai-demo`）
3. Render 会读取仓库里的 **`render.yaml`**
4. 点 **Apply** / **Deploy Blueprint**
5. 等待 **hepai** 服务状态变成 **Live**（约 10～20 分钟）

## 3. 若找不到 Blueprint

改用手动创建：

1. **New +** → **Web Service**
2. 连接 GitHub 仓库
3. 设置：

| 项 | 值 |
|----|-----|
| Name | `hepai` |
| Runtime | **Docker** |
| Dockerfile Path | `Dockerfile` |
| Instance Type | **Free** |

4. **Advanced** → Health Check Path：`/api/v1/health`
5. **Create Web Service**

## 4. 拿到网址

部署成功后地址类似：

```
https://hepai-xxxx.onrender.com
```

浏览器打开 → 身份选择页 → E00001 / 123456。

> 免费档 **15 分钟无人访问会休眠**，第一次打开可能等 30～60 秒唤醒。

## 5. 钉钉（只配一次）

| 项 | 填写 |
|----|------|
| H5 首页 | `https://hepai-xxxx.onrender.com/` |
| 可信域名 | `hepai-xxxx.onrender.com` |

## 6. 以后更新

```bash
cd ~/Downloads/text
git add -A && git commit -m "更新" && git push
```

Render 会自动重新部署。

---

# 方案二：Railway

1. https://railway.app/ → GitHub 登录  
2. **New Project** → **Deploy from GitHub repo**  
3. 选你的仓库  
4. **Settings** → **Build**：Dockerfile  
5. **Networking** → 生成域名，端口 **8080**  
6. 部署完成后用 `https://xxx.up.railway.app` 访问  

免费额度用完后可能需付费，注意控制台用量。

---

# 方案三：Fly.io（会用命令行可选）

```bash
# 本机安装 flyctl 后，在 text 目录
fly launch --no-deploy
# 按提示选区域（选 Hong Kong 或 Tokyo）
fly deploy
fly certs setup
```

适合熟悉终端的用户，步骤较多，见 https://fly.io/docs/

---

# 方案四：Oracle 免费云（最稳、不依赖 GitHub 平台）

不依赖 Render/Railway，适合 **钉钉长期固定地址**。  
见 [13-oracle-傻瓜部署.md](./13-oracle-傻瓜部署.md)。

也可：GitHub 仅作备份，服务器上用 `git clone` 拉代码再 `docker compose up`。

---

# 方案五：本机演示（不依赖任何云平台）

```bash
npm run docker
cpolar http 8080
```

适合大陆网络、今天就要给人看。

---

## 仓库结构错了怎么办？

若 GitHub 上只有前端文件夹、没有 `Dockerfile`：

```bash
cd ~/Downloads/text
git init   # 若已有可跳过
git remote add origin https://github.com/你的用户名/hepai-demo.git
git add Dockerfile docker-compose.yml render.yaml hepai-server "和拍---新人入职社交互助平台"
git commit -m "修正为 text 根目录结构"
git push -u origin main --force
```

（`--force` 会覆盖远程，仅在你确认远程可覆盖时用。）

---

## 30 秒怎么选

```
已有 GitHub、想最少配置？
  → Render（Blueprint 或 Web Service + Docker）

Render 也慢/打不开？
  → 本机 npm run docker + cpolar

要长期稳定、电脑可关？
  → Oracle 傻瓜部署
```
