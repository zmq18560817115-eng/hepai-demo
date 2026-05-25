# 08 · 前端对接 API 规范（RESTful）

> 版本：`v1` · 基础路径：`/api/v1` · 与原型 UI 一一对应  
> 配套实现步骤见：[09-backend-integration-steps.md](./09-backend-integration-steps.md)

---

## 0. 通用约定

### 0.1 Base URL

```
开发: http://localhost:8080/api/v1
生产: https://your-domain.com/api/v1
```

### 0.2 认证

除 `POST /auth/dingtalk` 外，所有接口需在 Header 携带：

```
Authorization: Bearer <access_token>
```

### 0.3 统一响应外壳

**成功**

```json
{
  "code": 0,
  "message": "ok",
  "data": { }
}
```

**失败**

```json
{
  "code": 40001,
  "message": "入职盲盒已完成，不可重复提交",
  "data": null
}
```

| HTTP 状态 | 含义 |
|-----------|------|
| 200 | 成功（GET/PATCH/DELETE） |
| 201 | 创建成功（POST） |
| 400 | 参数错误 |
| 401 | 未登录 / Token 失效 |
| 403 | 无权限（如新人访问 HR 接口） |
| 404 | 资源不存在 |
| 409 | 业务冲突（重复提交盲盒等） |
| 500 | 服务器错误 |

### 0.4 角色与权限

| `role` | 可访问接口前缀 |
|--------|----------------|
| `newcomer` | `/users/me`, `/onboarding/*`, `/quiz/*`, `/personas/me`, `/workplace`, `/mood/*`, `/mentors`, `/lunch/*` |
| `mentor` | 上述中与自己相关的 + `/mentor/*` |
| `hr` | `/hr/*` + 只读部分统计（按需） |

---

## 1. 认证与用户

### 1.1 钉钉登录

`POST /auth/dingtalk`

**Request**

```json
{
  "auth_code": "dingtalk_oauth_code_from_jsapi"
}
```

**Response `data`**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 7200,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "E00123",
    "nickname": "程序员小智",
    "avatar_url": "https://static.dingtalk.com/avatar/xxx.png",
    "role": "newcomer",
    "onboarding_date": "2026-05-01",
    "onboarding_completed": false
  }
}
```

**驱动 UI**：App 启动、替换原型顶栏角色切换；写入 Token。

---

### 1.2 当前用户

`GET /users/me`

**Response `data`**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "E00123",
  "nickname": "程序员小智",
  "avatar_url": "https://static.dingtalk.com/avatar/xxx.png",
  "role": "newcomer",
  "onboarding_date": "2026-05-01",
  "onboarding_completed": true,
  "onboarding_days_left": 22
}
```

**驱动 UI**：顶栏头像区、安全屋昵称、`#NEWBIE_D22` 天数。

---

## 2. 入职盲盒（P0）

### 2.1 入职状态

`GET /onboarding/status`

**Response `data`**

```json
{
  "completed": false,
  "persona_id": null
}
```

**驱动 UI**：`App` 路由守卫 — `completed === false` 时强制 `blindbox` 视图。

---

### 2.2 获取题目

`GET /quiz/onboarding`

**Response `data`**

```json
{
  "questions": [
    {
      "id": "q1-uuid",
      "text": "到了下班时间，你此刻真实的内心OS是？",
      "options": [
        { "text": "火速撤离，回家充电", "value": "I" },
        { "text": "看看谁还没走，约个饭？", "value": "E" },
        { "text": "再磨蹭一会儿，避开晚高峰", "value": "N" }
      ]
    }
  ]
}
```

**驱动 UI**：`BlindBoxView` 题目卡、进度条 `questions.length`。

---

### 2.3 提交答案并生成面具

`POST /quiz/submit`

**Request**

```json
{
  "answers": [
    { "question_id": "q1-uuid", "answer_value": "I" },
    { "question_id": "q2-uuid", "answer_value": "I" },
    { "question_id": "q3-uuid", "answer_value": "I" }
  ]
}
```

**Response `data`**

```json
{
  "onboarding_completed": true,
  "persona": {
    "id": "persona-uuid",
    "name": "静谧 I 人忍者型",
    "tags": ["独处充电", "文档达人", "咖啡续命"],
    "motto": "不打扰是我的温柔，交付是我的靠谱。"
  }
}
```

**业务规则**

- 每人仅可提交一次；重复提交返回 `409`。
- `name` / `tags` / `motto` 由服务端根据 `answer_value` 聚合生成（勿信任前端计算）。

**驱动 UI**：开盒预览页、进入安全屋后的面具标签。

---

### 2.4 获取当前面具

`GET /personas/me`

**Response `data`**

```json
{
  "id": "persona-uuid",
  "name": "静谧 I 人忍者型",
  "tags": ["独处充电", "文档达人", "咖啡续命"],
  "motto": "不打扰是我的温柔，交付是我的靠谱。",
  "created_at": "2026-05-25T08:00:00Z"
}
```

**驱动 UI**：刷新页面后 P1/P2 面具回显；未创建时返回 `404`。

---

## 3. 安全屋（P1）

### 3.1 职场聚合（推荐：进入 P1 只调这一个）

`GET /workplace`

**Response `data`**

```json
{
  "user": {
    "nickname": "程序员小智",
    "avatar_url": "https://static.dingtalk.com/avatar/xxx.png",
    "onboarding_days_left": 22
  },
  "persona": {
    "name": "静谧 I 人忍者型",
    "tags": ["独处充电", "文档达人", "咖啡续命"],
    "motto": "不打扰是我的温柔，交付是我的靠谱。"
  },
  "mood": {
    "energy_level": 75,
    "log_text": "今天独立完成首个需求评审",
    "updated_at": "2026-05-25T10:30:00Z"
  },
  "mentors": [
    {
      "id": "mentor-uuid-1",
      "name": "雷军老师",
      "avatar_url": "https://cdn.example.com/a1.png",
      "role": "架构师 / 你的主导师",
      "status": "busy",
      "type": "main"
    },
    {
      "id": "mentor-uuid-2",
      "name": "张经理",
      "avatar_url": "https://cdn.example.com/a2.png",
      "role": "项目主管",
      "status": "available",
      "type": "project"
    }
  ],
  "lunch": {
    "active_buddies_count": 24,
    "current_status": "idle"
  }
}
```

**驱动 UI**：`WorkplaceView` 全部主区块（除滑块实时交互用 PATCH）。

---

### 3.2 记录情绪 + 闪光时刻

`POST /mood`

**Request**

```json
{
  "energy_level": 65,
  "log_text": "今天独立完成首个需求评审"
}
```

**Response `data`**

```json
{
  "id": "mood-log-uuid",
  "energy_level": 65,
  "log_text": "今天独立完成首个需求评审",
  "created_at": "2026-05-25T11:00:00Z"
}
```

**驱动 UI**：「保存闪光」按钮；可同时更新能量条。

---

### 3.3 仅更新能量（滑块防抖后调用）

`PATCH /mood/energy`

**Request**

```json
{
  "energy_level": 42
}
```

**Response `data`**

```json
{
  "energy_level": 42,
  "updated_at": "2026-05-25T11:05:00Z"
}
```

**驱动 UI**：`WorkplaceView` 能量滑块；建议 debounce 500ms。

---

### 3.4 闪光历史（二期，格子历法）

`GET /mood/logs?page=1&page_size=10`

**Response `data`**

```json
{
  "items": [
    {
      "id": "mood-log-uuid",
      "energy_level": 75,
      "log_text": "第一次独立完成联调",
      "created_at": "2026-05-24T18:00:00Z"
    }
  ],
  "total": 12,
  "page": 1,
  "page_size": 10
}
```

---

### 3.5 导师列表

`GET /mentors`

**Response `data`**

```json
{
  "mentors": [
    {
      "id": "mentor-uuid-1",
      "name": "雷军老师",
      "avatar_url": "https://cdn.example.com/a1.png",
      "role": "架构师 / 你的主导师",
      "status": "busy",
      "type": "main"
    }
  ]
}
```

**驱动 UI**：`WorkplaceView` 摘要、`MentorsView` 完整列表。

**`status` 枚举**：`busy` | `available` | `syncing`（导师在钉钉设忙闲或 HR 配置）

---

## 4. 午餐匹配（P2）

### 4.1 食堂 / 地图信息

`GET /lunch/venues`

**Response `data`**

```json
{
  "venues": [
    {
      "id": "venue-1",
      "name": "园区食堂 · 3F 休闲区",
      "floor": "3F",
      "active_buddies_count": 24
    }
  ],
  "default_venue_id": "venue-1"
}
```

**驱动 UI**：`LunchMatchView` 地图头部文案、在线人数。

---

### 4.2 发起匹配

`POST /lunch/match`

**Request**

```json
{
  "venue_id": "venue-1"
}
```

**Response `data`**

```json
{
  "request_id": "match-req-uuid",
  "status": "pending",
  "created_at": "2026-05-25T12:00:00Z"
}
```

**驱动 UI**：「一键派发碎片」→ 进入 matching 状态。

---

### 4.3 查询匹配状态（轮询）

`GET /lunch/status`

**Response `data` — idle**

```json
{
  "status": "idle"
}
```

**Response `data` — pending**

```json
{
  "status": "pending",
  "request_id": "match-req-uuid",
  "matching_tags": ["独处充电", "文档达人"]
}
```

**Response `data` — matched**

```json
{
  "status": "matched",
  "request_id": "match-req-uuid",
  "match_code": "BLUE-K88",
  "meeting_point": "食堂3楼休闲区 A15座",
  "meet_before": "2026-05-25T11:50:00+08:00",
  "partner_persona": {
    "name": "社交 E 人带玩型",
    "tags": ["饭局发起人", "气氛组"]
  }
}
```

**Response `data` — cancelled**

```json
{
  "status": "cancelled"
}
```

**驱动 UI**：matching 动画（轮询 2s）、成功卡、匹配中标签行。

**后端实现提示**：`pending` 可由定时任务 / 队列在 2～5 秒内改为 `matched` 并写入 `match_code`。

---

### 4.4 取消匹配

`DELETE /lunch/match`

**Response**：`204 No Content` 或 `{ "code": 0, "data": { "status": "cancelled" } }`

**驱动 UI**：「暂时放弃」按钮。

---

## 5. 导师工作台（P4）

### 5.1 我负责的新人

`GET /mentor/assignees`

**Response `data`**

```json
{
  "assignees": [
    {
      "user_id": "newcomer-uuid-1",
      "nickname": "程序员小智",
      "persona": {
        "name": "静谧 I 人忍者型",
        "tags": ["独处充电", "文档达人"]
      },
      "energy_level": 75,
      "onboarding_days_left": 22,
      "risk": "normal"
    },
    {
      "user_id": "newcomer-uuid-2",
      "nickname": "产品小美",
      "persona": {
        "name": "社交 E 人带玩型",
        "tags": ["饭局发起人"]
      },
      "energy_level": 42,
      "onboarding_days_left": 18,
      "risk": "watch"
    }
  ]
}
```

**权限**：仅 `role === mentor`；返回数据中 **不得包含** `user_answers` 原始答题。

**驱动 UI**：`MentorHubView` 列表、能量条、关注标签。

**`risk` 规则建议**

| 条件 | `risk` |
|------|--------|
| `energy_level` < 50 连续 3 天 | `watch` |
| `energy_level` < 30 或 7 天无 mood | `alert` |
| 其他 | `normal` |

---

## 6. HR 仪表盘（P5）

### 6.1 核心统计 + 批次柱图

`GET /hr/dashboard/stats?batch_limit=4`

**Response `data`**

```json
{
  "integration_index": 84.2,
  "integration_trend": "+3.4%",
  "newcomers_at_risk": 12,
  "newcomers_at_risk_trend": "-2",
  "mentor_activity_rate": 0.96,
  "mentor_activity_trend": "+1.2%",
  "lunch_match_success_rate": 0.78,
  "lunch_match_success_trend": "+5.0%",
  "batches": [
    { "name": "5月一批", "active": 92, "risk": 5 },
    { "name": "5月二批", "active": 88, "risk": 8 }
  ]
}
```

**驱动 UI**：4 张 KPI 卡 + `HRDashboard` 柱状图。

---

### 6.2 情绪趋势

`GET /hr/mood/trends?date=2026-05-25&granularity=hour`

**Response `data`**

```json
{
  "points": [
    { "time": "10:00", "score": 80 },
    { "time": "11:00", "score": 75 },
    { "time": "12:00", "score": 85 }
  ]
}
```

**驱动 UI**：情绪面积图 `EMOTION_TREND`。

---

### 6.3 新人列表

`GET /hr/newcomers?page=1&page_size=20&batch=5月一批`

**Response `data`**

```json
{
  "items": [
    {
      "id": "newcomer-uuid",
      "alias_name": "蓝色小象",
      "dept": "研发中心 / 测试组",
      "batch": "5月一批",
      "persona_name": "静谧 I 人忍者型",
      "energy_level": 35,
      "risk": "alert"
    }
  ],
  "total": 48,
  "page": 1,
  "page_size": 20
}
```

---

### 6.4 搜索新人

`GET /hr/newcomers/search?q=蓝色&page=1&page_size=10`

**Response `data`**：同 6.3 的 `items` + 分页。

**驱动 UI**：HR 顶栏搜索框。

---

### 6.5 风险告警

`GET /hr/alerts?limit=10`

**Response `data`**

```json
{
  "alerts": [
    {
      "id": "alert-uuid-1",
      "user_alias": "蓝色小象",
      "dept": "研发中心 / 测试组",
      "reason": "连续3天情绪分极低",
      "severity": "red"
    }
  ]
}
```

**驱动 UI**：「实时干预防火墙」两条 Alert。

---

### 6.6 推送干预

`POST /hr/interventions`

**Request**

```json
{
  "alert_ids": ["alert-uuid-1", "alert-uuid-2"],
  "channel": "hrbp"
}
```

**Response `data`**

```json
{
  "sent": 2,
  "failed": 0
}
```

**驱动 UI**：「推送隐秘关怀提示至 HRBP」按钮。

---

### 6.7 导出报表（二期）

`GET /hr/reports/export?type=monthly&month=2026-05`

**Response**：文件流 `Content-Type: text/csv` 或异步任务 ID。

---

## 7. 通知（顶栏铃铛，二期）

`GET /notifications?unread_only=true`

```json
{
  "unread_count": 2,
  "items": [
    {
      "id": "n1",
      "title": "午餐匹配成功",
      "body": "暗号 BLUE-K88，11:50 前到 A15",
      "read": false,
      "created_at": "2026-05-25T12:01:00Z"
    }
  ]
}
```

---

## 8. 数据库补充（相对 `db/init.sql`）

执行迁移脚本：`db/migrations/001_api_v1_extensions.sql`（项目根目录 `text/db/` 下）。

主要变更：

- `users.role` 增加 `mentor`
- `users` 增加 `dingtalk_user_id`、`onboarding_completed`
- `lunch_match_requests` 增加 `match_code`、`meeting_point`、`venue_id`、`matched_at`
- 可选：`mentor_status` 字段或独立表

---

## 9. 接口总览（23 个）

| 优先级 | 方法 | 路径 |
|--------|------|------|
| P0 | POST | `/auth/dingtalk` |
| P0 | GET | `/users/me` |
| P0 | GET | `/onboarding/status` |
| P0 | GET | `/quiz/onboarding` |
| P0 | POST | `/quiz/submit` |
| P0 | GET | `/personas/me` |
| P0 | GET | `/workplace` |
| P0 | POST | `/mood` |
| P0 | PATCH | `/mood/energy` |
| P0 | GET | `/mentors` |
| P0 | POST | `/lunch/match` |
| P0 | GET | `/lunch/status` |
| P0 | DELETE | `/lunch/match` |
| P1 | GET | `/lunch/venues` |
| P1 | GET | `/mentor/assignees` |
| P1 | GET | `/hr/dashboard/stats` |
| P1 | GET | `/hr/mood/trends` |
| P1 | GET | `/hr/newcomers` |
| P2 | GET | `/hr/alerts` |
| P2 | POST | `/hr/interventions` |
| P2 | GET | `/hr/newcomers/search` |
| P2 | GET | `/mood/logs` |
| P2 | GET | `/notifications` |
