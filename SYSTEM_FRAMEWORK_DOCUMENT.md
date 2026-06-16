# 和拍 - 新人入职社交互助平台：系统框架说明文档

## 1. 概述

### 1.1. 项目目标

“和拍”是一个旨在帮助新入职员工快速融入公司环境、建立社交联系、获取情感支持的互助平台。它通过游戏化的方式，连接新员工、老员工和 HR，降低新人的社交压力，提升入职体验和归属感。

### 1.2. 文档目的

本文档旨在为“和拍”平台定义一个清晰、可扩展的前后端分离系统框架。它将作为前后端开发团队的核心参考，确保双方对系统架构、功能模块、数据模型和 API 接口有一致的理解。

---

## 2. 系统架构

### 2.1. 整体架构

系统采用标准的前后端分离架构：

- **前端 (Client)**：基于 React 的单页面应用 (SPA)，负责用户界面渲染、交互逻辑和用户体验。
- **后端 (Server)**：提供 RESTful API，负责业务逻辑处理、数据持久化、用户认证和第三方服务集成。
- **数据库 (Database)**：用于存储所有业务数据，如用户信息、社交关系、内容等。

```
+-----------------+      +------------------------+      +---------------+
|   用户浏览器     |      |                        |      |               |
| (React App)     |----->|       后端服务器        |----->|    数据库      |
|                 |      |      (RESTful API)     |      | (PostgreSQL)  |
+-----------------+      |                        |      |               |
                       +------------------------+      +---------------+
```

### 2.2. 前端技术栈

- **核心框架**: `React 19` + `TypeScript`
- **构建工具**: `Vite`
- **UI & 样式**: `TailwindCSS`
- **动画**: `Framer Motion`
- **图表**: `Recharts`
- **图标**: `Lucide React`

### 2.3. 后端技术栈建议

- **语言**: `Node.js` (推荐 `NestJS` 框架以获得更好的结构和可维护性) 或 `Go`
- **数据库**: `PostgreSQL` (功能强大，适合处理关系数据)
- **认证**: `JWT` (JSON Web Tokens)
- **部署**: `Docker` 容器化部署

---

## 3. 功能模块与数据模型

### 3.1. 核心概念

- **用户 (User)**: 系统中的所有参与者，分为“新员工”和“HR”两种角色。
- **虚拟形象/人格面具 (Persona)**: 新员工在入职初期（如30天）对外展示的虚拟身份，通过入职盲盒问答生成。
- **情绪能量 (Energy)**: 反映用户当前状态的数值，可由用户主动更新。
- **导师 (Mentor)**: 分配给新员工的带教老师或主管。

### 3.2. 用户模块 (User)

#### 3.2.1. 数据模型

`**User`**


| 字段名               | 类型          | 描述                      |
| ----------------- | ----------- | ----------------------- |
| `id`              | `UUID`      | 主键，用户唯一标识               |
| `username`        | `String`    | 用户名/工号                  |
| `password`        | `String`    | 加密后的密码                  |
| `nickname`        | `String`    | 昵称                      |
| `avatar_url`      | `String`    | 头像 URL                  |
| `role`            | `Enum`      | 用户角色 (`newcomer`, `hr`) |
| `onboarding_date` | `Date`      | 入职日期                    |
| `created_at`      | `Timestamp` | 创建时间                    |


#### 3.2.2. API 接口

- `POST /api/auth/login`: 用户登录
- `POST /api/auth/register`: 用户注册 (HR或管理员使用)
- `GET /api/users/me`: 获取当前登录用户信息

### 3.3. 入职盲盒模块 (Onboarding Blind Box)

#### 3.3.1. 功能描述

新员工首次登录时，通过一系列问答生成初始的“人格面具”。

#### 3.3.2. 数据模型

`**QuizQuestion**`


| 字段名       | 类型       | 描述                                   |
| --------- | -------- | ------------------------------------ |
| `id`      | `UUID`   | 问题 ID                                |
| `text`    | `String` | 问题内容                                 |
| `options` | `JSONB`  | 选项 `[{text: string, value: string}]` |


`**UserAnswer**`


| 字段名            | 类型       | 描述                         |
| -------------- | -------- | -------------------------- |
| `id`           | `UUID`   | 答案 ID                      |
| `user_id`      | `UUID`   | 用户 ID (FK to User)         |
| `question_id`  | `UUID`   | 问题 ID (FK to QuizQuestion) |
| `answer_value` | `String` | 用户选择的答案值                   |


`**Persona**` (用户的虚拟形象)


| 字段名       | 类型              | 描述                    |
| --------- | --------------- | --------------------- |
| `id`      | `UUID`          | 主键                    |
| `user_id` | `UUID`          | 用户 ID (FK to User)    |
| `name`    | `String`        | 人格面具名称 (如 "AI I人自嗨型") |
| `tags`    | `Array<String>` | 性格标签 (如 "重度咖啡依赖")     |
| `motto`   | `String`        | 职场格言                  |


#### 3.3.3. API 接口

- `GET /api/quiz/onboarding`: 获取入职问答题目。
- `POST /api/quiz/submit`: 用户提交问答答案，后端处理并生成 `Persona`。
- `GET /api/personas/me`: 获取当前用户的 `Persona` 信息。

### 3.4. 职场视图模块 (Workplace View)

#### 3.4.1. 功能描述

用户的个人主页，展示个人信息、情绪状态、导师列表和功能入口。

#### 3.4.2. 数据模型

`**MoodLog**`


| 字段名            | 类型          | 描述                 |
| -------------- | ----------- | ------------------ |
| `id`           | `UUID`      | 日志 ID              |
| `user_id`      | `UUID`      | 用户 ID (FK to User) |
| `energy_level` | `Integer`   | 情绪能量值 (0-100)      |
| `log_text`     | `String`    | "闪光时刻"的文字记录        |
| `created_at`   | `Timestamp` | 记录时间               |


`**MentorAssignment**`


| 字段名         | 类型     | 描述                       |
| ----------- | ------ | ------------------------ |
| `mentee_id` | `UUID` | 新员工 ID (FK to User)      |
| `mentor_id` | `UUID` | 导师 ID (FK to User)       |
| `type`      | `Enum` | 导师类型 (`main`, `project`) |


#### 3.4.3. API 接口

- `GET /api/workplace`: 获取职场视图所需的所有聚合数据（个人信息, Persona, 最新情绪, 导师列表）。
- `POST /api/mood`: 用户记录新的情绪能量和闪光时刻。
- `GET /api/mentors`: 获取当前用户的导师列表。

### 3.5. 午餐匹配模块 (Lunch Match)

#### 3.5.1. 功能描述

帮助员工（特别是新员工）找到午餐伙伴。

#### 3.5.2. 数据模型

`**LunchMatchRequest**`


| 字段名          | 类型          | 描述                                     |
| ------------ | ----------- | -------------------------------------- |
| `id`         | `UUID`      | 请求 ID                                  |
| `user_id`    | `UUID`      | 发起请求的用户 ID                             |
| `status`     | `Enum`      | 状态 (`pending`, `matched`, `cancelled`) |
| `created_at` | `Timestamp` | 请求时间                                   |


#### 3.5.2. API 接口

- `POST /api/lunch/match`: 发起一个午餐匹配请求。
- `GET /api/lunch/status`: 查询当前用户的匹配状态。
- `DELETE /api/lunch/match`: 取消匹配请求。

### 3.6. HR 仪表盘模块 (HR Dashboard)

#### 3.6.1. 功能描述

为 HR 提供数据洞察，如新员工活跃度、情绪趋势、社交匹配成功率等。

#### 3.6.2. API 接口

- `GET /api/hr/dashboard/stats`: 获取仪表盘的核心统计数据。
- `GET /api/hr/newcomers`: 获取新员工列表及其状态。
- `GET /api/hr/mood/trends`: 获取公司或部门的情绪趋势图表数据。

---

## 4. API 设计原则

- **风格**: 遵循 RESTful 设计规范，使用标准的 HTTP 方法 (GET, POST, PUT, DELETE)。
- **路径**: API 统一添加 `/api` 前缀，并进行版本管理 (如 `/api/v1`)。
- **数据格式**: 所有请求和响应主体均使用 `application/json` 格式。
- **认证**: 除登录注册等少数公开接口外，所有 API 均需通过 `Authorization: Bearer <JWT>` 进行身份验证。
- **错误处理**: 定义统一的错误响应格式，包含错误码和详细信息。

---

## 5. 部署与运维建议

- **前端部署**: 使用 `Vite` 构建静态文件，部署在 `Nginx` 或 `Vercel`、`Netlify` 等静态托管平台。
- **后端部署**: 将后端应用打包成 `Docker` 镜像，通过 `Docker Compose` 或 `Kubernetes` 进行部署和管理。
- **CI/CD**: 建立自动化构建、测试和部署流水线，提高交付效率和质量。

