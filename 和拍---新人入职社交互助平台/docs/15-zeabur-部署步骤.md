# 和拍 · Zeabur 免费部署（傻瓜步骤）

> 目标：得到固定网址，例如 `https://hepai-xxxx.zeabur.app`，钉钉只配置一次。  
> 费用：**Free 档 0 元**，注册一般**不需要信用卡**。

---

## 你要准备

| 项 | 说明 |
|----|------|
| GitHub 账号 | 免费注册 https://github.com |
| 本机项目 | `Downloads/text/` 文件夹（含 `Dockerfile`） |
| 约 30～60 分钟 | 首次推代码 + 部署 |

---

# 第一步：把代码推到 GitHub

## 1.1 在 GitHub 新建仓库

1. 登录 https://github.com/
2. 右上角 **+** → **New repository**
3. 仓库名填：`hepai-demo`（英文即可）
4. 选 **Private** 或 Public 都行
5. **不要**勾选 “Add a README”
6. 点 **Create repository**
7. 记下仓库地址，例如：  
   `https://github.com/你的用户名/hepai-demo.git`

## 1.2 在本机 Mac 上传代码

打开 **终端**，整段复制执行（把 `你的用户名` 改成你的）：

```bash
cd ~/Downloads/text

# 若还没有 git 仓库
git init
git add Dockerfile docker-compose.yml .dockerignore render.yaml
git add hepai-server
git add "和拍---新人入职社交互助平台"

git commit -m "和拍 Zeabur 部署"

git branch -M main
git remote add origin https://github.com/你的用户名/hepai-demo.git
git push -u origin main
```

> 若提示要登录 GitHub：按提示用浏览器登录，或配置 Personal Access Token。

---

# 第二步：Zeabur 部署

## 2.1 注册 Zeabur

1. 打开 https://zeabur.com/
2. 点 **Sign in** → 用 **GitHub** 登录（推荐）
3. 授权 Zeabur 访问你的仓库

## 2.2 创建项目并导入仓库

1. 控制台点 **New Project**（新建项目）
2. 选区域（可选 **Hong Kong** 或离你近的）
3. 点 **Deploy New Service** → **Git**
4. 选择仓库 **`hepai-demo`**
5. 分支选 **`main`**

## 2.3 使用 Dockerfile 构建

Zeabur 应自动识别根目录的 `Dockerfile`。

若没有自动识别：

1. 进入该 **Service** → **Settings**
2. **Build** 方式选 **Dockerfile**
3. **Dockerfile Path** 填：`Dockerfile`
4. **Root Directory** 留空（仓库根就是 `text` 内容）

## 2.4 设置端口（重要）

1. 进入 Service → **Networking** 或 **端口 / Port**
2. 暴露端口填：**8080**
3. 协议：**HTTP**

保存后触发重新部署（Redeploy）。

## 2.5 等待构建完成

1. 打开 **Logs** 标签
2. 看到类似 `和拍 API`、`试点入口` 或构建成功
3. 状态变为 **Running**

首次构建约 **5～15 分钟**（要编译前端 + 后端）。

---

# 第三步：绑定固定域名

1. 在该 Service 页面找到 **Domains** / **域名**
2. 点 **Generate Domain** 或 **绑定 Zeabur 子域名**
3. 得到地址，例如：  
   `https://hepai-demo-abc123.zeabur.app`

## 自测

浏览器打开：

```
https://你的域名.zeabur.app/
```

应看到 **我是新人 / 导师 / HR**。

健康检查：

```
https://你的域名.zeabur.app/api/v1/health
```

应返回 `"status":"up"`。

登录：**E00001** 密码 **123456**。

> **免费档**：很久没人访问会休眠，第一次打开可能慢 10～30 秒，属正常。

---

# 第四步：钉钉开放平台（只配一次）

1. 打开 https://open.dingtalk.com/
2. 你的企业内部应用 → **网页应用 / H5**

| 配置项 | 填写 |
|--------|------|
| 应用首页 | `https://你的域名.zeabur.app/` |
| 可信域名 | `你的域名.zeabur.app`（不要 https、不要 `/`） |

3. 保存 → 发布 **测试版**
4. 工作台添加应用，或在钉钉聊天里发链接测试

### 演示账号

| 工号 | 密码 | 说明 |
|------|------|------|
| E00001 | 123456 | 首次完整流程 |
| E00008 | 123456 | 已完成新人 |
| M00001 | 123456 | 导师 |
| HR0001 | 123456 | HR |

---

# 第五步：以后更新代码

本机改完代码后：

```bash
cd ~/Downloads/text
git add -A
git commit -m "更新说明"
git push
```

Zeabur 会自动重新构建（或在控制台点 **Redeploy**）。

---

# 常见问题

**Q：构建失败？**  
- 看 Zeabur **Logs** 里红色报错  
- 确认仓库根目录有 `Dockerfile`、`hepai-server`、`和拍---新人入职社交互助平台`

**Q：打开网页 502？**  
- 确认暴露端口是 **8080**  
- 等构建完全结束再访问

**Q：要绑信用卡吗？**  
- Free 档一般 **不需要**

**Q：会收钱吗？**  
- 不升级套餐、不租专用服务器 = **0 元**  
- 只有升级 Dev（约 $5/月）等才会扣费

**Q：数据会丢吗？**  
- 免费容器重建后演示数据可能重置；重新部署会自动 `db:sync` 灌演示账号

---

# 流程一览

```
GitHub 建仓库 → Mac 上 git push
       ↓
Zeabur 登录 → 导入仓库 → 端口 8080
       ↓
绑定 xxx.zeabur.app → 浏览器测试
       ↓
钉钉填首页 + 可信域名（一次）
```

---

# 不想用 GitHub？

可改用本机 Docker + 临时隧道（见 [14-更方便部署.md](./14-更方便部署.md)）：

```bash
npm run docker
npx localtunnel --port 8080 --local-host 127.0.0.1
```

但链接会变，不适合长期钉在钉钉工作台。
