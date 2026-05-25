# 10 · 你需要手动完成的步骤清单

> 带 `[ ]` 的项必须你本人操作；带 `[x]` 的已由项目生成，无需重复做。

---

## 一、当前项目里已经做好的（不用你做）

- [x] 前端页面原型（盲盒 / 安全屋 / 午餐 / 导师 / HR）
- [x] 设计文档 `docs/01`～`07`
- [x] API 规范 `docs/08`、接入步骤 `docs/09`
- [x] 数据库脚本 `text/db/*` + MySQL 种子 `text/db/seed.sql`
- [x] **后端服务** `text/hepai-server`（SQLite 默认可用，已实现 P0/P1 接口）
- [x] 前端 API 层 `src/api/*`，**`.env.local` 已设为连接真实 API**
- [x] MySQL 初始化脚本 `text/scripts/setup-mysql.sh`（可选，需你自己填密码）

---

## 二、环境准备（第一次必做）

### 2.1 本机软件

- [ ] 安装 **Node.js 18+**（前端已用）
- [ ] 安装 **MySQL 8**（或你团队统一的数据库）
- [ ] 安装 **MySQL 客户端** 或图形工具（Navicat / DBeaver / TablePlus）
- [ ] （推荐）安装 **Postman** 或 **Apifox**，用于测后端接口

### 2.2 前端环境变量

- [x] 已创建 `.env.local`（`VITE_USE_MOCK_API=false`）
- [ ] 若需回到纯前端演示，可改为 `VITE_USE_MOCK_API=true`

### 2.3 启动前端（验证 UI）

- [ ] 执行：

```bash
npm install
npm run dev
```

- [ ] 浏览器打开终端提示的地址（一般为 `http://localhost:3000`）
- [ ] 能正常走通盲盒 → 安全屋 → 午餐，即前端 OK

---

## 三、数据库

### 方案 A：SQLite（已完成，推荐本地开发）

- [x] 后端首次启动自动建表 + 种子数据（`hepai-server/data/hepai.sqlite`）
- [ ] 你只需在 `hepai-server` 执行一次：`npm run db:setup`

### 方案 B：MySQL（生产/团队统一，需你手动）

- [ ] 配置 MySQL 密码后执行：

```bash
cd text
MYSQL_PASSWORD=你的密码 bash scripts/setup-mysql.sh
```

- [ ] 脚本会依次执行：`init.sql` → `migrations/001_*` → `seed.sql`

---

## 四、后端项目

- [x] 已创建 `text/hepai-server`（Express + SQLite + JWT）
- [x] 已实现 P0/P1 全部接口（见 `08-api-spec`）
- [x] 开发登录：`dev_newcomer` / `dev_mentor` / `dev_hr`
- [x] CORS 已允许 `localhost:3000`
- [ ] 你本地启动：`cd hepai-server && npm run dev`
- [ ] 生产部署前：更换 `JWT_SECRET`、按需切 MySQL

---

## 五、钉钉（上线前必做，开发期可跳过）

- [ ] 在 [钉钉开放平台](https://open.dingtalk.com/) 创建 **企业内部应用**
- [ ] 配置 H5 **应用首页 URL**（指向前端部署地址）
- [ ] 获取 **AppKey / AppSecret**，填入后端 `.env`
- [ ] 实现真实 `auth_code` → 钉钉 `userid` → 你们 `users` 表映射
- [ ] 在 `metadata.json` 中只保留真实用到的权限（当前已清空相机/定位等）
- [ ] 真机钉钉内打开应用，验证登录与页面 390px 布局

---

## 六、前端切换到真实 API

- [x] `.env.local` 已配置 `VITE_USE_MOCK_API=false`
- [ ] 确认后端已启动后，前端执行 `npm run dev`

### 6.3 前端页面与 API 对接状态

以下文件 **已全部接入 `hepaiApi`**（`VITE_USE_MOCK_API=true` 时走 mock，false 时走真实后端）：

| 文件 | 已接 API |
|------|----------|
| `src/App.tsx` | 启动 + 切角色 `loginDingtalk(dev_*)` |
| `src/context/PrototypeContext.tsx` | `onboarding/status`、`workplace`、`submitQuiz` |
| `src/components/BlindBoxView.tsx` | `getQuizOnboarding`、`submitQuiz` |
| `src/components/WorkplaceView.tsx` | `getWorkplace`、`patchMoodEnergy`、`postMood` |
| `src/components/LunchMatchView.tsx` | `getLunchVenues`、`postLunchMatch`、轮询 `getLunchStatus`、`deleteLunchMatch` |
| `src/components/MentorsView.tsx` | `getMentors` |
| `src/components/MentorHubView.tsx` | `getMentorAssignees` |
| `src/components/HRDashboard.tsx` | `getHrDashboardStats`、`getHrMoodTrends`、`getHrAlerts`、`postHrInterventions` |

你只需完成后端，并把 `.env.local` 中 `VITE_USE_MOCK_API=false`。

### 6.4 Vite 代理（可选）

若不想处理 CORS，可在 `vite.config.ts` 已配置的代理下，把 `VITE_API_BASE_URL` 设为 `/api/v1`。

- [ ] 确认 `vite.config.ts` 中 `server.proxy` 指向 `http://localhost:8080`

---

## 七、联调验收（后端 + 前端都就绪后）

按顺序勾选：

- [ ] 新人：`dev_newcomer` 登录 → 未完成盲盒 → 答 3 题 → 安全屋面具与开盒一致
- [ ] 拖动能量条 → 刷新页面 → 数值仍在
- [ ] 午餐匹配 → 2～5 秒内 `matched` → 显示暗号
- [ ] 导师：只能看到面具标签，**看不到**答题原文
- [ ] HR：能看图表；用新人 token 访问 `/hr/*` 返回 403
- [ ] 对照 `docs/06-prototype-review-checklist.md` 全勾

---

## 八、部署（上线前）

### 8.1 前端

- [ ] `npm run build` 通过
- [ ] 静态资源部署到 CDN / Nginx / 钉钉托管
- [ ] 生产 `.env`：`VITE_USE_MOCK_API=false`，`VITE_API_BASE_URL` 为生产 API 域名

### 8.2 后端

- [ ] 生产数据库执行迁移（先备份）
- [ ] 配置生产 JWT、钉钉密钥、HTTPS
- [ ] 关闭 `dev_newcomer` 等开发登录

---

## 九、快速对照：你现在该做哪一步？

| 你的进度 | 下一步手动做什么 |
|----------|------------------|
| 只看 UI | 完成 **第二节**，`npm run dev` |
| 要做后端 | 完成 **第三节 + 第四节** |
| 后端已通 2 个接口 | **第六节** 关 mock，联调盲盒 |
| 准备上钉钉 | **第五节 + 第八节** |

---

## 十、相关文档索引

| 文档 | 内容 |
|------|------|
| [08-api-spec-for-frontend.md](./08-api-spec-for-frontend.md) | 每个接口 JSON |
| [09-backend-integration-steps.md](./09-backend-integration-steps.md) | 后端分阶段实现细节 |
| [../src/api/hepaiApi.ts](../src/api/hepaiApi.ts) | 前端统一调用入口 |
