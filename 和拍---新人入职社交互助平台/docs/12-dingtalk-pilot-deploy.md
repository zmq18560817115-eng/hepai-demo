# 钉钉插件试点部署指南

> 目标：在**真实钉钉客户端**里打开和拍（H5 微应用），而不是只在本地浏览器看「假钉钉外壳」。  
> 若 HTTPS / 开放平台配置遇到困难，可退回 **单端口演示包**（去掉 `VITE_DINGTALK_EMBED`，本地浏览器演示）。

---

## 一、你需要准备


| 项                     | 说明              |
| --------------------- | --------------- |
| 钉钉管理员权限               | 能创建「企业内部应用」     |
| Node.js 18+           | 本机构建            |
| （推荐）Cloudflare Tunnel | 免费 HTTPS，无需买服务器 |
| 可选：云服务器 + 域名          | 正式试点            |


---

## 二、一键本地构建 + 单端口启动

在项目根目录 **和拍---新人入职社交互助平台** 执行：

```bash
chmod +x scripts/pilot-dingtalk.sh
bash scripts/pilot-dingtalk.sh
```

会依次：

1. 使用 `.env.pilot`（同源 API、`VITE_DINGTALK_EMBED=true`）
2. `npm run build` 前端
3. `npm run db:sync` 灌演示数据
4. 后端 **8080** 同时提供页面 + `/api/v1`

浏览器自测：**[http://127.0.0.1:8080/](http://127.0.0.1:8080/)**（此时无假钉钉外壳，直接是和拍身份选择）

---

## 三、暴露 HTTPS（钉钉必填）

钉钉 H5 **必须 HTTPS**。最快方式：Cloudflare Tunnel

```bash
# 另开一个终端（需已安装 cloudflared）
cloudflared tunnel --url http://127.0.0.1:8080
```

记下输出的地址，例如：`https://abc-xyz.trycloudflare.com`

用 curl 自测：

```bash
curl -s https://abc-xyz.trycloudflare.com/api/v1/health
```

---

## 四、钉钉开放平台配置

1. 打开 [钉钉开放平台](https://open.dingtalk.com/) → **应用开发** → **企业内部开发** → **创建应用**
2. **应用类型**：H5 微应用（或网页应用）
3. **应用首页地址**（电脑端工作台）填：
  ```
   https://你的HTTPS域名/
  ```
4. **开发管理 → 安全设置**：把 HTTPS 域名加入「可信域名 / 重定向 URL（白名单）」
5. **权限**：至少开通「通讯录只读」「成员信息读」等（用于免登时可再细化）
6. 发布到 **测试版 / 体验版**，在本企业工作台添加应用

### 试点阶段可不配 OAuth

未配置 AppKey 时，用户在钉钉内打开应用后，仍可用 **工号 + 密码** 登录演示：


| 角色      | 工号     | 密码     |
| ------- | ------ | ------ |
| 新人（首次）  | E00001 | 123456 |
| 新人（老员工） | E00008 | 123456 |
| 导师      | M00001 | 123456 |
| HR      | HR0001 | 123456 |


---

## 五、配置钉钉免登（可选，第二步再做）

在 `hepai-server/.env` 增加：

```env
DINGTALK_APP_KEY=你的AppKey
DINGTALK_APP_SECRET=你的AppSecret
DINGTALK_CORP_ID=你的企业CorpId
DINGTALK_AGENT_ID=你的AgentId
```

重启后端。用户在 **真钉钉** 内打开时会尝试 JSAPI 免登；失败则回退工号登录。

员工 `users.dingtalk_user_id` 需与钉钉 userid 一致（演示账号已预置 `dev_newcomer` 等开发映射）。

---

## 六、验收清单

- `https://域名/api/v1/health` 返回 `up`
- `https://域名/` 能打开身份选择页（无假钉钉左侧栏）
- 钉钉 PC 工作台 → 点击应用 → 同样页面
- E00001 登录 → 大礼包 → 团队 → 盲盒
- 免登（若已配 OAuth）或工号登录均可用

---

## 七、完不成时：退回单端口演示包

1. 复制 `.env.stack` 为 `.env.local`，或新建：
  ```env
   VITE_USE_MOCK_API=false
   VITE_API_BASE_URL=/api/v1
   VITE_DINGTALK_EMBED=false
  ```
2. `npm run build && cd ../hepai-server && FRONTEND_DIST=../和拍---新人入职社交互助平台/dist npm run start`
3. 浏览器打开 `http://127.0.0.1:8080`，保留 **假钉钉外壳** 演示。

---

## 八、正式上云（试点成功后）

1. 云服务器安装 Node.js，上传 `hepai-server` + 前端 `dist`
2. 配置 Nginx 反向代理 + 正式域名 + SSL 证书
3. 钉钉应用首页改为 `https://hepai.你的公司.com/`
4. 更换 `JWT_SECRET`，按需切 MySQL

