# 和拍 · 变更日志

本仓库相对**最初前端原型**（仅手机框 + 本地 Mock）的完整演进记录。  
基准提交：`git log` 中第一条 commit「和拍：前端+后端+文档完整版」。

---

## 总览

| 维度 | 最初原型 | 当前版本 |
|------|----------|----------|
| 载体 | 手机框 H5 原型 | 电脑端侧栏布局 + 保留移动端组件 |
| 数据 | 纯前端 Mock | Express + SQLite 后端，可切 Mock/真实 API |
| 人格测试 | 3 题 | **8 题**，完成后解锁人格面具 |
| AI HR | 无 / 极少 | 企业 AI HR 对话页 + 关键词/上下文回复 |
| 文档 | 无 | `docs/01`～`11` + API 规范与接入清单 |
| 数据库脚本 | 无 | `db/init.sql`、`migrations/`、`seed.sql` |

---

## 新增目录与项目

```
text/
├── 和拍---新人入职社交互助平台/   # 前端（已有，大幅增强）
├── hepai-server/                  # 【新增】Node 后端，默认 :8080
├── db/                            # 【新增】MySQL 建表 / 迁移 / 种子
├── scripts/setup-mysql.sh         # 【新增】MySQL 可选安装脚本
├── CHANGELOG.md                   # 本文件
└── SYSTEM_FRAMEWORK_DOCUMENT.md   # 系统框架说明（若有）
```

---

## 前端改动（`和拍---新人入职社交互助平台/`）

### 布局与导航

- `App.tsx`：桌面侧栏导航（入职盲盒、安全屋、蹭饭地图、带教导师、AI HR、导师台、HR 看板）
- 演示登录：`dev_newcomer` / `dev_mentor` / `dev_hr`

### 功能页面

- `BlindBoxView.tsx`：文案改为「入职人格测试 · 8 题解锁面具」
- `AIHRChatView.tsx`：企业 AI HR 助手（欢迎语、快捷问题、历史对话）
- 各业务页接入 `hepaiApi`（盲盒、安全屋、午餐、导师、HR 看板等）

### API 层

- `src/api/hepaiApi.ts`：统一 API，`VITE_USE_MOCK_API` 切换 Mock / 真实后端
- `src/api/mock.ts`、`types.ts`：Mock 题库扩至 **8 题**；AI 关键词 mock 对齐后端
- `.env.local`：`VITE_API_BASE_URL=http://localhost:8080/api/v1`，`VITE_USE_MOCK_API=false`

### 配置修复

- `package.json`：`dev` 使用 `--host=127.0.0.1`，避免部分 macOS 上 `uv_interface_addresses` 报错

### 文档（`docs/`）

| 文件 | 说明 |
|------|------|
| 01～04 | 问题角色、用户旅程、信息架构、钉钉约束 |
| 06～07 | 评审清单、设计交付 |
| 08 | REST API 规范（约 23 个接口） |
| 09～10 | 后端接入步骤、手动操作清单 |
| 11 | 数据库 / SQLite 就绪说明 |

---

## 后端改动（`hepai-server/`）【全新】

### 技术栈

- Express + better-sqlite3 + JWT
- 可选 `@google/genai`（配置 `GEMINI_API_KEY` 时启用完整 AI）

### 主要模块

- `src/routes/api.ts`：认证、盲盒、安全屋、情绪、午餐、导师、HR、AI HR
- `src/services/aiHrChat.ts`：AI 回复（关键词 + 用户面具/能量上下文；Gemini 可选）
- `src/db/quizQuestions.ts`：8 道人格测试题
- `src/db/ensureSeed.ts`：对**已有库**补全题库与演示数据（不删用户）
- `src/db/enrich.ts`：命令 `npm run db:enrich` 手动补种

### 演示账号（种子数据）

- `dev_newcomer`：未完成盲盒（可体验 8 题流程）
- `dev_mentor`、`dev_hr`：导师 / HR 角色
- 另有已完成盲盒的对比用户

### 常用命令

```bash
cd hepai-server
npm install
npm run dev          # 启动 :8080
npm run db:setup     # 初始化 SQLite
npm run db:reset     # 清空并重建库
npm run db:enrich    # 已有库补 8 题 + 演示数据
```

---

## 数据库（`db/` + SQLite）

- `init.sql`：核心表结构
- `migrations/001_*`：API v1 扩展字段
- `migrations/002_ai_hr_chat.sql`：AI HR 会话与消息表
- `seed.sql`：MySQL 种子（含 **8 题** 题库）
- 运行时默认：`hepai-server/data/hepai.sqlite`（已在 `.gitignore`，不提交）

---

## 如何查看「整个改变」

### 1. Git（推荐，本次已初始化）

```bash
cd /Users/zhangmingqi/Downloads/text
git log --oneline
git show HEAD --stat          # 首版提交了哪些文件
git diff HEAD~1 HEAD          # 以后每次提交后对比上一版
```

在 **Cursor / VS Code** 左侧打开「源代码管理」，可图形化看每次 diff。

### 2. 浏览器演示

```bash
# 终端1
cd hepai-server && npm run dev

# 终端2
cd "和拍---新人入职社交互助平台" && npm run dev
# 打开 http://127.0.0.1:3000 ，登录 dev_newcomer
```

### 3. 读文档索引

`和拍---新人入职社交互助平台/docs/README.md`

### 4. 与旧 zip 对比（若你仍保留最初下载包）

```bash
diff -rq "/path/to/旧原型" "/Users/zhangmingqi/Downloads/text/和拍---新人入职社交互助平台" | less
```

---

## 后续提交建议

每完成一阶段功能后：

```bash
git add -A
git commit -m "简短说明：例如 增强 AI HR 或 修复午餐匹配"
```

并在本文件顶部追加一节 `## [日期] 标题` 记录要点。

---

## 版本记录

### [2026-05-25] 和拍：前端+后端+文档完整版

- 初始化 Git 仓库（`text/` 根目录）
- 人格测试 3 题 → 8 题；`ensureExtendedSeed` / `db:enrich`
- 新增 `hepai-server` 与 AI HR 智能 mock
- 前端桌面布局、API 层、docs 01～11
- 本 `CHANGELOG.md`
