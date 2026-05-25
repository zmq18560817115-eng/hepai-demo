# 09 · 后端实现与前端接入步骤

> 按顺序执行；每阶段结束可用 [Postman/Apifox 集合](#阶段-0准备) 或 curl 自测，再改前端。

---

## 阶段 0：准备（半天）

### 0.1 仓库与运行环境

1. 在 `text/` 下创建后端项目（推荐 **NestJS + TypeORM/Prisma + MySQL**，与现有 `db/init.sql` 一致）。
2. 执行基础库表：

```bash
mysql -u root -p your_db < ../db/init.sql
mysql -u root -p your_db < ../db/migrations/001_api_v1_extensions.sql
```

3. 配置 `.env`：

```env
PORT=8080
DATABASE_URL=mysql://user:pass@localhost:3306/hepai
JWT_SECRET=your-secret
DINGTALK_APP_KEY=
DINGTALK_APP_SECRET=
```

### 0.2 工程骨架

```
backend/
  src/
    main.ts              # 全局前缀 /api/v1
    common/
      auth.guard.ts
      response.interceptor.ts   # 包装 { code, message, data }
    modules/
      auth/
      users/
      onboarding/
      quiz/
      persona/
      workplace/
      mood/
      mentors/
      lunch/
      mentor-hub/
      hr/
```

### 0.3 种子数据（必做）

- 插入 3 条 `quiz_questions`（与前端 `types.ts` 文案一致）。
- 创建测试用户：
  - `newcomer` × 1（未完成盲盒）
  - `newcomer` × 1（已完成盲盒 + persona）
  - `mentor` × 1，并写入 `mentor_assignments`
  - `hr` × 1
- 为已完成新人插入 2 条 `mentor_assignments`、`1～2 条 `mood_logs`。

### 0.4 验收标准

- `GET http://localhost:8080/api/v1/health` 返回 200（自建健康检查）。

---

## 阶段 1：认证 + 用户（1 天）

### 实现顺序

| 步骤 | 接口 | 要点 |
|------|------|------|
| 1.1 | `POST /auth/dingtalk` | 用 `auth_code` 调钉钉 API 换 `userid`；查/建 `users`；签发 JWT |
| 1.2 | `GET /users/me` | 从 JWT 解析 `user_id`；计算 `onboarding_days_left = max(0, 30 - days_since(onboarding_date))` |
| 1.3 | 全局 `AuthGuard` | 白名单：`/auth/dingtalk`、`/health` |

### 自测 curl

```bash
# 开发阶段可用「开发登录」代替钉钉（建议你自己加一个仅 dev 的接口）
curl -X POST http://localhost:8080/api/v1/auth/dingtalk \
  -H "Content-Type: application/json" \
  -d '{"auth_code":"dev_newcomer"}'

export TOKEN="<access_token>"

curl http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### 前端接入（本阶段）

1. 新建 `src/api/client.ts`：`fetch` 封装，自动带 `Authorization`。
2. App 启动时：`login()` → 存 `localStorage.access_token` → `getUsersMe()`。
3. 用 `user.role` 替代原型顶栏手动切换（演示环境可保留切换 + 调 dev 登录）。

---

## 阶段 2：入职盲盒（1 天）

### 实现顺序

| 步骤 | 接口 | 要点 |
|------|------|------|
| 2.1 | `GET /onboarding/status` | `personas` 表有记录则 `completed: true` |
| 2.2 | `GET /quiz/onboarding` | 按 `sort_order` 查 `quiz_questions` |
| 2.3 | `POST /quiz/submit` | 事务：写 `user_answers` → 生成 `personas` → `users.onboarding_completed=1` |
| 2.4 | `GET /personas/me` | 仅返回面具字段，无答题详情 |
| 2.5 | 面具算法 | 端口 `src/modules/quiz/persona.generator.ts`，从 `generatePersonaFromAnswers` 迁到服务端 |

### 自测

```bash
curl http://localhost:8080/api/v1/onboarding/status -H "Authorization: Bearer $TOKEN"
curl http://localhost:8080/api/v1/quiz/onboarding -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:8080/api/v1/quiz/submit \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"answers":[{"question_id":"q1","answer_value":"I"},{"question_id":"q2","answer_value":"I"},{"question_id":"q3","answer_value":"I"}]}'
```

### 前端接入

| 文件 | 改动 |
|------|------|
| `BlindBoxView.tsx` | `GET /quiz/onboarding` 拉题；提交 `POST /quiz/submit`；删除本地 `generatePersonaFromAnswers` |
| `PrototypeContext.tsx` | `completeOnboarding` 改为调 API；persona 来自响应 |
| `App.tsx` | 启动 `GET /onboarding/status` 决定 `blindbox` / `workplace` |

---

## 阶段 3：安全屋 + 导师列表（1～2 天）

### 实现顺序

| 步骤 | 接口 | 要点 |
|------|------|------|
| 3.1 | `GET /workplace` | 聚合：user + persona + 最新 mood + mentors + lunch 摘要 |
| 3.2 | `POST /mood` | 插入 `mood_logs` |
| 3.3 | `PATCH /mood/energy` | 可插入一条仅能量记录，或更新用户「当前能量」缓存表 |
| 3.4 | `GET /mentors` | join `mentor_assignments` + `users`，映射 `status` |

### 前端接入

| 文件 | 改动 |
|------|------|
| `WorkplaceView.tsx` | `useEffect` 调 `GET /workplace`；滑块 debounce → `PATCH /mood/energy`；保存闪光 → `POST /mood` |
| `MentorsView.tsx` | `GET /mentors` |
| 删除 | `MOCK_MENTORS` 常量（或仅 dev fallback） |

---

## 阶段 4：午餐匹配（1 天）

### 实现顺序

| 步骤 | 接口 | 要点 |
|------|------|------|
| 4.1 | `GET /lunch/venues` | 静态配置或表 `lunch_venues` |
| 4.2 | `POST /lunch/match` | 创建 `pending` 记录；投递异步匹配任务 |
| 4.3 | 匹配 Worker | 2～5 秒后：按 `persona.tags` 假匹配或查队列；写 `match_code`、`meeting_point`、`status=matched` |
| 4.4 | `GET /lunch/status` | 返回当前用户最新一条未结束请求 |
| 4.5 | `DELETE /lunch/match` | `status=cancelled` |

### 前端接入

| 文件 | 改动 |
|------|------|
| `LunchMatchView.tsx` | 进入页 `GET /lunch/status`；点击匹配 `POST` + `setInterval` 轮询 `GET /lunch/status`；取消 `DELETE` |
| 删除 | `setTimeout` 假匹配 |

---

## 阶段 5：导师工作台 + HR（2 天）

### 实现顺序

| 步骤 | 接口 | 要点 |
|------|------|------|
| 5.1 | `GET /mentor/assignees` | `role=mentor` 守卫；join persona + 最近 mood |
| 5.2 | `GET /hr/dashboard/stats` | `role=hr` 守卫；SQL 聚合批次 |
| 5.3 | `GET /hr/mood/trends` | 按小时 avg(energy_level) |
| 5.4 | `GET /hr/newcomers` | 分页 + 批次筛选 |
| 5.5 | `GET /hr/alerts` | 规则引擎或定时任务写 `hr_alerts` 表 |
| 5.6 | `POST /hr/interventions` | 记日志 + 调钉钉工作通知（可选） |

### 前端接入

| 文件 | 改动 |
|------|------|
| `MentorHubView.tsx` | `GET /mentor/assignees` |
| `HRDashboard.tsx` | 三个 GET 替换 `BATCH_DATA` / `EMOTION_TREND` 常量；搜索、干预按钮接 API |

---

## 阶段 6：联调与上线检查（1 天）

### 6.1 联调清单（按用户旅程）

1. 新人钉钉登录 → 未答题 → 盲盒 3 题 → 安全屋面具一致。
2. 拖能量 → 刷新 → 数值保持。
3. 午餐匹配 → 轮询成功 → 显示暗号。
4. 导师账号 → 能看到新人面具，看不到答题原文。
5. HR 账号 → 图表有数；新人搜不到 HR 接口 403。

### 6.2 前端环境变量

```env
# .env.local
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

`vite.config.ts` 开发代理（可选）：

```ts
server: {
  proxy: {
    '/api': 'http://localhost:8080',
  },
},
```

### 6.3 CORS

后端允许前端源：`http://localhost:3000`（Vite 默认端口）。

### 6.4 错误处理

前端 `api/client.ts` 统一处理：

- `401` → 清 Token，重定向登录
- `409` → Toast 业务提示
- `code !== 0` → 展示 `message`

---

## 推荐前端 API 层结构（接入时创建）

```
src/api/
  client.ts          # fetch + token + 统一解包 data
  auth.ts
  onboarding.ts
  quiz.ts
  workplace.ts
  mood.ts
  lunch.ts
  mentors.ts
  mentorHub.ts
  hr.ts
  types.ts           # 与 08 文档 Response 对齐的 TS 类型
```

**`client.ts` 最小示例**

```ts
const BASE = import.meta.env.VITE_API_BASE_URL;

export async function api<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  const json = await res.json();
  if (!res.ok || json.code !== 0) {
    throw new Error(json.message ?? res.statusText);
  }
  return json.data as T;
}
```

---

## 时间估算（单人全栈）

| 阶段 | 内容 | 约耗时 |
|------|------|--------|
| 0 | 库表 + 骨架 + 种子 | 0.5 天 |
| 1 | 认证 | 1 天 |
| 2 | 盲盒 | 1 天 |
| 3 | 安全屋 | 1.5 天 |
| 4 | 午餐 | 1 天 |
| 5 | 导师 + HR | 2 天 |
| 6 | 联调 | 1 天 |
| **合计** | MVP（P0+P1 接口） | **~8 天** |

---

## 相关文档

- API 字段详情：[08-api-spec-for-frontend.md](./08-api-spec-for-frontend.md)
- UI ↔ 模块映射：[07-design-handoff.md](./07-design-handoff.md)
- 系统架构：[SYSTEM_FRAMEWORK_DOCUMENT.md](../../SYSTEM_FRAMEWORK_DOCUMENT.md)
