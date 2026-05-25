# 和拍 · 新人入职社交互助平台（完整工作区）

本目录包含**前端原型 + 后端服务 + 数据库脚本**，相对最初仅前端的版本已大幅扩展。

## 快速启动

```bash
# 1. 后端（:8080）
cd hepai-server && npm install && npm run dev

# 2. 前端（:3000）
cd "和拍---新人入职社交互助平台" && npm install && npm run dev
```

浏览器打开 http://127.0.0.1:3000 ，演示登录码：`dev_newcomer` / `dev_mentor` / `dev_hr`。

## 文档与变更

- 产品设计文档：`和拍---新人入职社交互助平台/docs/README.md`
- **全部改动说明**：[`CHANGELOG.md`](./CHANGELOG.md)
- 用 Git 查看 diff：`git log` / Cursor 源代码管理面板

## 目录说明

| 路径 | 说明 |
|------|------|
| `和拍---新人入职社交互助平台/` | React + Vite 前端 |
| `hepai-server/` | Express + SQLite API |
| `db/` | MySQL 建表与种子（可选） |
