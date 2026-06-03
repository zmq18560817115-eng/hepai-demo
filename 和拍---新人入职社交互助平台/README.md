# 和拍 · 新人入职社交互助平台（前端原型）

钉钉 H5 插件方向的可点击高保真原型，用于评审与前后端对齐。

## 设计文档（按流程顺序）


| 步骤      | 文档                                                                             |
| ------- | ------------------------------------------------------------------------------ |
| 1 问题与角色 | [docs/01-problems-and-roles.md](docs/01-problems-and-roles.md)                 |
| 2 用户旅程  | [docs/02-user-journeys.md](docs/02-user-journeys.md)                           |
| 3 信息架构  | [docs/03-information-architecture.md](docs/03-information-architecture.md)     |
| 4 载体约束  | [docs/04-platform-constraints.md](docs/04-platform-constraints.md)             |
| 6 评审清单  | [docs/06-prototype-review-checklist.md](docs/06-prototype-review-checklist.md) |
| 7 设计交付  | [docs/07-design-handoff.md](docs/07-design-handoff.md)                         |


系统/API 契约见上级目录：[SYSTEM_FRAMEWORK_DOCUMENT.md](../SYSTEM_FRAMEWORK_DOCUMENT.md)

**后端接入（必读）**

- [docs/08-api-spec-for-frontend.md](docs/08-api-spec-for-frontend.md) — 接口规范与 JSON 示例  
- [docs/09-backend-integration-steps.md](docs/09-backend-integration-steps.md) — 分阶段实现与前端改哪些文件  
- **[docs/10-manual-checklist.md](docs/10-manual-checklist.md)** — **你需要手动完成的步骤（必读）**  
- [db/migrations/001_api_v1_extensions.sql](../db/migrations/001_api_v1_extensions.sql) — 库表补充迁移

前端 API 层：`src/api/hepaiApi.ts`

## 测试展示：前后端两种模式


| 模式             | 环境文件                           | 启动方式                               | 说明                         |
| -------------- | ------------------------------ | ---------------------------------- | -------------------------- |
| **全栈展示**（推荐评审） | 复制 `.env.stack` → `.env.local` | `npm run dev:stack` 或开两个终端         | 前端 3000 + 后端 8080 + SQLite |
| **仅前端 Mock**   | 复制 `.env.mock` → `.env.local`  | `npm run dev` 或 `npm run dev:mock` | 无需后端，离线演示                  |


页脚状态栏会同时标明 **前端地址** 与 **后端连接状态**。

### 一键全栈（单终端）

```bash
npm run dev:stack
```

### 手动双终端

**终端 1 — 后端**（`text/hepai-server`）：

```bash
cd ../hepai-server
npm install
npm run db:setup   # 首次
npm run dev        # http://localhost:8080/api/v1
```

**终端 2 — 前端**：

```bash
cp .env.stack .env.local   # 全栈；或 cp .env.mock .env.local 仅 Mock
npm install
npm run dev                # http://127.0.0.1:3000
```

浏览器打开 **[http://127.0.0.1:3000](http://127.0.0.1:3000)**。页面为 **钉钉电脑端工作台外壳**：左侧导航点击 **「新人入职」** → 阅读插件说明 → **进入和拍互助平台** 后，才进入原有身份选择与功能演示（安全屋 · 我的工位 · 蹭饭地图等）。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开后可见 **390px 手机框**（模拟钉钉视口）。

## 5 分钟演示脚本

1. **钉钉外壳 · 首次接入**（仅第一次）：左侧 **新人入职** → 弹窗 **入职大礼包** → **开心收下** → 认识带教与团队 → **继续** → **进入和拍互助平台**（再次进入跳过礼包与团队页，可在说明页点「重新体验首次接入」）
2. **新人**：身份选「我是新人」→ 完成盲盒 → 进入安全屋（标签与盲盒一致）
3. **情绪**：拖动能量滑块 → 刷新页面 → 数值保留
4. **午餐**：底栏「蹭饭」→ 发起匹配 → 成功（标签来自面具）
5. **导师**：顶栏「导师」→ 查看分配新人与面具
6. **HR**：顶栏「HR」→ 仪表盘（无底栏）

右上角「重置盲盒」可清空 localStorage 重新走流程。

## 技术栈

React 19 · TypeScript · Vite · Tailwind CSS 4 · Motion

跨页状态：`src/context/PrototypeContext.tsx`（localStorage 持久化）