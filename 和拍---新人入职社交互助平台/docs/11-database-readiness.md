# 11 · 数据库就绪情况说明

## 结论：**本地开发已就绪**（SQLite）

| 模块 | 表 | 种子数据 | 状态 |
|------|-----|----------|------|
| 用户与角色 | `users` | 新人×2、导师×2、HR×1 | ✅ |
| 入职盲盒 | `quiz_questions`, `user_answers`, `personas` | 3 道题；新人 B 已完成面具 | ✅ |
| 安全屋 | `mood_logs`, `user_energy_snapshot` | 产品小美能量 42 | ✅ |
| 导师 | `mentor_assignments` | 雷军+张经理 ↔ 新人 | ✅ |
| 午餐 | `lunch_match_requests` | 运行时写入 | ✅ |
| HR | `hr_alerts` | 2 条风险告警 | ✅ |
| **AI HR 对话** | `ai_hr_sessions`, `ai_hr_messages` | 对话时自动创建 | ✅ 新增 |

数据库文件：`text/hepai-server/data/hepai.sqlite`

重新初始化：

```bash
cd text/hepai-server
npm run db:reset
```

## MySQL（生产可选）

脚本齐全，需你本机 MySQL 密码后执行：

```bash
cd text
MYSQL_PASSWORD=你的密码 bash scripts/setup-mysql.sh
```

`seed.sql` 已含与 SQLite 一致的测试账号；**AI 对话表**需在 MySQL 中追加与 `schema.ts` 中 `ai_hr_*` 相同的建表语句（或从 SQLite 迁移脚本复制）。

## 尚未覆盖（可二期）

- 通知表 `notifications`
- 导出报表文件存储
- 钉钉真实 userId 映射批量导入
