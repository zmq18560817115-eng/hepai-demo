# 和拍后端 API

## 快速启动（SQLite，无需 MySQL 密码）

```bash
cd hepai-server
cp .env.example .env   # 已有 .env 可跳过
npm install
npm run db:setup
npm run dev
```

服务地址：`http://localhost:8080/api/v1`

开发登录 `auth_code`：

| code | 角色 |
|------|------|
| `dev_newcomer` | 新人（未完成盲盒） |
| `dev_mentor` | 导师 |
| `dev_hr` | HR |

导师 / HR **工号密码登录**（`POST /api/v1/auth/login`）：

| 端 | 工号 | 密码 |
|----|------|------|
| 导师 | `M00001` | `dev` |
| 导师 | `M00002` | `dev` |
| HR | `HR0001` | `dev` |

## 可选：MySQL

```bash
MYSQL_PASSWORD=你的密码 bash ../scripts/setup-mysql.sh
```

然后需自行将后端改为 MySQL 驱动（当前默认 SQLite）。

## 接口文档

见 `../和拍---新人入职社交互助平台/docs/08-api-spec-for-frontend.md`
