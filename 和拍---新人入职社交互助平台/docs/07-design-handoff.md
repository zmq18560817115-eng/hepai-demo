# 07 · 设计交付物

## 组件清单


| 组件                  | 路径                                  | 用途            |
| ------------------- | ----------------------------------- | ------------- |
| `App`               | `src/App.tsx`                       | 外壳、路由、角色切换、底栏 |
| `BlindBoxView`      | `src/components/BlindBoxView.tsx`   | P0 入职问答       |
| `WorkplaceView`     | `src/components/WorkplaceView.tsx`  | P1 安全屋        |
| `LunchMatchView`    | `src/components/LunchMatchView.tsx` | P2 午餐匹配       |
| `MentorHubView`     | `src/components/MentorHubView.tsx`  | P4 导师工作台      |
| `MentorsView`       | `src/components/MentorsView.tsx`    | P3 导师列表       |
| `HRDashboard`       | `src/components/HRDashboard.tsx`    | P5 HR 看板      |
| `PrototypeProvider` | `src/context/PrototypeContext.tsx`  | 跨页 mock 状态    |


## Design Tokens（`src/index.css`）


| Token                         | 值                   | 用途     |
| ----------------------------- | ------------------- | ------ |
| `--shadow-neo`                | `4px 4px 0 #0f172a` | 卡片阴影   |
| `--shadow-neo-lg`             | `8px 8px 0 #0f172a` | 强调阴影   |
| `@utility neo-card`           | 白底 + 2px 边框         | 容器     |
| `@utility neo-button`         | 白底描边按钮              | 次要操作   |
| `@utility neo-button-primary` | 深色底                 | 主 CTA  |
| 主色                            | `indigo-600`        | 品牌强调   |
| 描边                            | `slate-900` 2px     | Neo 风格 |


字体：正文 `Inter` / 装饰 `JetBrains Mono`（顶栏状态、标签）。

## UI 字段 ↔ API 字段映射

### Persona（盲盒 → `POST /api/quiz/submit` 响应）


| UI（`UserPersona`）     | API（`Persona`） | 说明                |
| --------------------- | -------------- | ----------------- |
| `role`                | `name`         | 面具名称，如「静谧 I 人忍者型」 |
| `tags[]`              | `tags`         | 外显标签              |
| `hiddenPreferences[]` | —              | 仅前端推荐用，不上传        |
| `motto`               | `motto`        | 职场格言              |
| —                     | `user_id`      | 后端填充              |


### 情绪（安全屋）


| UI            | API（`MoodLog`） |
| ------------- | -------------- |
| `energyLevel` | `energy_level` |
| 闪光记录文案        | `log_text`     |


### 午餐匹配


| UI `lunchStatus` | API `LunchMatchRequest.status` |
| ---------------- | ------------------------------ |
| `idle`           | —                              |
| `matching`       | `pending`                      |
| `success`        | `matched`                      |


### HR 仪表盘


| UI 常量                   | API                                |
| ----------------------- | ---------------------------------- |
| `BATCH_DATA[].active`   | `GET /api/hr/dashboard/stats` 批次活跃 |
| `EMOTION_TREND[].score` | `GET /api/hr/mood/trends`          |


## 演示脚本（5 分钟）

1. **新人首登**：保持「C端-新入职」→ 答 3 题 → 开盒 → 确认安全屋面具标签与盲盒一致。
2. **情绪**：拖动能量滑块 → 刷新页面 → 数值仍在。
3. **午餐**：底栏「蹭饭地图」→ 发起匹配 → 等待成功卡。
4. **导师**：顶栏「导师」→ 查看新人列表与面具标签。
5. **HR**：顶栏「B端」→ 看图表，确认无底部导航。

## 文件索引

```
docs/
  01-problems-and-roles.md
  02-user-journeys.md
  03-information-architecture.md
  04-platform-constraints.md
  06-prototype-review-checklist.md
  07-design-handoff.md
```

