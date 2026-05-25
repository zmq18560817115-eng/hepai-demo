# 和拍 · 新人入职社交互助平台（前端原型）

钉钉 H5 插件方向的可点击高保真原型，用于评审与前后端对齐。

## 设计文档（按流程顺序）

| 步骤 | 文档 |
|------|------|
| 1 问题与角色 | [docs/01-problems-and-roles.md](docs/01-problems-and-roles.md) |
| 2 用户旅程 | [docs/02-user-journeys.md](docs/02-user-journeys.md) |
| 3 信息架构 | [docs/03-information-architecture.md](docs/03-information-architecture.md) |
| 4 载体约束 | [docs/04-platform-constraints.md](docs/04-platform-constraints.md) |
| 6 评审清单 | [docs/06-prototype-review-checklist.md](docs/06-prototype-review-checklist.md) |
| 7 设计交付 | [docs/07-design-handoff.md](docs/07-design-handoff.md) |

系统/API 契约见上级目录：[SYSTEM_FRAMEWORK_DOCUMENT.md](../SYSTEM_FRAMEWORK_DOCUMENT.md)

**后端接入（必读）**

- [docs/08-api-spec-for-frontend.md](docs/08-api-spec-for-frontend.md) — 接口规范与 JSON 示例  
- [docs/09-backend-integration-steps.md](docs/09-backend-integration-steps.md) — 分阶段实现与前端改哪些文件  
- **[docs/10-manual-checklist.md](docs/10-manual-checklist.md)** — **你需要手动完成的步骤（必读）**  
- [db/migrations/001_api_v1_extensions.sql](../db/migrations/001_api_v1_extensions.sql) — 库表补充迁移  

前端 API 层：`src/api/hepaiApi.ts`

## 本地全栈启动（步骤 2–4 已就绪）

**终端 1 — 后端**（`text/hepai-server`，SQLite 免 MySQL 密码）：

```bash
cd ../hepai-server
npm install
npm run db:setup
npm run dev
```

**终端 2 — 前端**（已配置 `.env.local` 连接真实 API）：

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:3000`，顶栏可切换新人 / 导师 / HR。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开后可见 **390px 手机框**（模拟钉钉视口）。

## 5 分钟演示脚本

1. **新人**：顶栏「新人」→ 完成 3 题盲盒 → 开盒预览面具 → 进入安全屋（标签与盲盒一致）
2. **情绪**：拖动能量滑块 → 刷新页面 → 数值保留
3. **午餐**：底栏「蹭饭」→ 发起匹配 → 成功（标签来自面具）
4. **导师**：顶栏「导师」→ 查看分配新人与面具
5. **HR**：顶栏「HR」→ 仪表盘（无底栏）

右上角「重置盲盒」可清空 localStorage 重新走流程。

## 技术栈

React 19 · TypeScript · Vite · Tailwind CSS 4 · Motion

跨页状态：`src/context/PrototypeContext.tsx`（localStorage 持久化）
