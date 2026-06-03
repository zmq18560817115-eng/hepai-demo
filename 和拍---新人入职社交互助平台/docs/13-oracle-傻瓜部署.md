# 和拍 · Oracle 免费云主机（傻瓜版）

> 目标：得到一个 **永远不变** 的网址，例如 `https://hepai-demo.duckdns.org/`  
> 钉钉里填一次即可，**不用** 再开 cloudflared / Tailscale。

---

## 你要准备的 3 样东西

1. **能收邮件的邮箱**（注册 Oracle）
2. **信用卡**（只验证，只用免费机器不扣费）
3. **Mac 上的和拍项目**（路径：`Downloads/text/...`）

全程大约 **1～2 小时**，第一次会慢一点。

---

# 第一阶段：在 Oracle 上买一台「免费电脑」

## 步骤 1：注册 Oracle

1. 浏览器打开：[https://www.oracle.com/cloud/free/](https://www.oracle.com/cloud/free/)
2. 点 **Start for free**
3. 按页面填邮箱、密码、国家等
4. 绑定信用卡完成验证（选 **Always Free** 资源不会扣费）

注册进控制台：[https://cloud.oracle.com/](https://cloud.oracle.com/)

---

## 步骤 2：创建虚拟机

1. 左上角 **≡** → **Compute** → **Instances**
2. 点 **Create instance**
3. **只改下面几项**，其余默认即可：


| 填什么         | 选什么                                                   |
| ----------- | ----------------------------------------------------- |
| Name        | `hepai`                                               |
| Image       | **Ubuntu 22.04**                                      |
| Shape       | **Change shape** → **Ampere** → `VM.Standard.A1.Flex` |
| OCPU        | `1`                                                   |
| Memory      | `6` GB                                                |
| Public IPv4 | **勾选**                                                |


1. **SSH keys** 区域：选 **Generate a new key pair**
2. 点 **Save private key**，保存到 Mac「下载」文件夹，例如 `oracle-hepai.key`
3. 点 **Create**

等 1～2 分钟，状态变成 **Running**。

1. 在实例页面 **复制 Public IP**，记下来，例如：`123.45.67.89`

---

## 步骤 3：开三个「洞」（不然外网进不来）

1. 在实例页面，点 **Subnet** 蓝色链接
2. 点 **Default Security List**
3. 点 **Add Ingress Rules**，添加 **3 条**（一条一条加）：


| Source CIDR | IP Protocol | Destination Port |
| ----------- | ----------- | ---------------- |
| `0.0.0.0/0` | TCP         | 22               |
| `0.0.0.0/0` | TCP         | 80               |
| `0.0.0.0/0` | TCP         | 443              |


每条填完点 **Add Ingress Rules**。

---

# 第二阶段：申请免费固定网址

## 步骤 4：DuckDNS

1. 打开 [https://www.duckdns.org/](https://www.duckdns.org/)
2. 用 GitHub 或 Google 登录
3. 在 **sub domain** 输入框填：`hepai-demo`（可改成你喜欢的，英文）
4. 点 **add domain**
5. 在 **current ip** 填入 Oracle 的 **Public IP**（步骤 2 复制的）
6. 点 **update ip**

你的固定网址就是：`**https://hepai-demo.duckdns.org`**（若你用了别的子域名，替换即可）

---

# 第三阶段：Mac 打包并上传

## 步骤 5：Mac 上一键打包

打开 **终端**，复制粘贴执行（整段）：

```bash
cd ~/Downloads/text/和拍---新人入职社交互助平台
chmod +x scripts/oracle-pack.sh
bash scripts/oracle-pack.sh
```

看到 `✅ 打包完成` 即可。

---

## 步骤 6：上传到云主机

把下面命令里的 **两处** 改成你的：

- `~/Downloads/oracle-hepai.key` → 你下载的密钥路径
- `123.45.67.89` → 你的 Public IP

```bash
chmod 600 ~/Downloads/oracle-hepai.key

scp -i ~/Downloads/oracle-hepai.key \
  ~/Downloads/text/hepai-deploy.tar.gz \
  ubuntu@123.45.67.89:~/
```

还要上传安装脚本：

```bash
scp -i ~/Downloads/oracle-hepai.key \
  ~/Downloads/text/和拍---新人入职社交互助平台/scripts/oracle-install-on-server.sh \
  ubuntu@123.45.67.89:~/
```

---

# 第四阶段：云主机一键安装

## 步骤 7：登录云主机

```bash
ssh -i ~/Downloads/oracle-hepai.key ubuntu@123.45.67.89
```

（IP 改成你的）

---

## 步骤 8：一键安装（在云主机里执行）

把 `hepai-demo` 改成你在 DuckDNS 填的 **子域名**（不要带 `.duckdns.org`）：

```bash
chmod +x ~/oracle-install-on-server.sh
sudo bash ~/oracle-install-on-server.sh hepai-demo
```

等待 3～5 分钟，最后会打印：

```
网站地址:  https://hepai-demo.duckdns.org/
```

---

## 步骤 9：Mac 浏览器验证

打开：

```
https://hepai-demo.duckdns.org/
```

应看到 **我是新人 / 导师 / HR** 选择页。

登录：**E00001** 密码 **123456**。

---

# 第五阶段：钉钉（只配一次）

1. 打开 [https://open.dingtalk.com/](https://open.dingtalk.com/)
2. 你的应用 → **网页应用 / H5**
3. **应用首页**：`https://hepai-demo.duckdns.org/`
4. **安全设置 → 可信域名**：`hepai-demo.duckdns.org`
5. 发布测试版，工作台添加或聊天发链接测试

---

# 以后怎么维护


| 想做什么  | 命令（Mac 登录 ssh 后）                          |
| ----- | ----------------------------------------- |
| 看是否在跑 | `pm2 status`                              |
| 看日志   | `pm2 logs hepai`                          |
| 重启    | `pm2 restart hepai`                       |
| 更新代码  | Mac 重新 `oracle-pack.sh` + scp 上传，再跑一遍安装脚本 |


---

# 常见问题

**Q：网页打不开？**  

- DuckDNS 的 IP 是否等于 Oracle Public IP  
- 步骤 3 三条防火墙规则是否都加了

**Q：HTTPS 证书失败？**  

- 等 2 分钟再刷新  
- 确认 80、443 端口已开放

**Q：Oracle 注册不了？**  

- 换浏览器 / 换邮箱 / 区域选 Japan 或 Korea 重试

**Q：担心扣费？**  

- 只用 **A1 Flex** 免费机型，不要点付费套餐

---

# 一张图记流程

```
注册 Oracle → 创建 Ubuntu 虚拟机 → 记公网 IP
     ↓
DuckDNS 子域名 → IP 填公网 IP
     ↓
Mac: oracle-pack.sh → scp 上传
     ↓
云主机: oracle-install-on-server.sh 子域名
     ↓
浏览器 https://子域名.duckdns.org  →  钉钉填一次
```

