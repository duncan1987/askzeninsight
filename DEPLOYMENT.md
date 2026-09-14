# 迁移部署手册：Vercel → AWS EC2（香港）

> 项目：Ask Zen Insight（Next.js 16 + Supabase）
> 目标：应用从 Vercel 免费版迁移到 AWS EC2 香港（ap-east-1），数据库暂留 Supabase 云端（Mumbai），域名保持 GoDaddy 注册 + Cloudflare DNS（灰云直连）。
> 本文档记录完整迁移过程，供复盘总结。

---

## 0. 架构总览与仓库改动

### 迁移前后对比

```
迁移前:  用户 → Cloudflare(橙云) → Vercel(函数大概率在美东) → Supabase Mumbai
迁移后:  用户 → Cloudflare(灰云, DNS only) → EC2 香港 (Nginx → Node standalone :3000) → Supabase Mumbai
```

| 链路 | 迁移前 | 迁移后 | 变化 |
|------|--------|--------|------|
| 用户 → 应用 | 大陆→美东 ≈ 200-300ms | 大陆→香港 ≈ 30-60ms | ✅ 大幅提升 |
| 应用 → 数据库 | 美东→Mumbai ≈ 230ms/次 | 香港→Mumbai ≈ 90ms/次（AWS 骨干网） | ✅ 提升约 2.5 倍 |
| 构建 | Vercel 托管 | GitHub Actions（免费 2000 分钟/月） | 服务器零构建压力 |

### 本次仓库改动清单

| 文件 | 作用 |
|------|------|
| `next.config.mjs` | 加 `output: 'standalone'`（Vercel 部署会忽略此项，两边兼容） |
| `.github/workflows/deploy.yml` | CI：push main → 构建 → rsync 到 EC2 → 重启服务 |
| `deploy/askzen.service` | systemd 守护单元（崩溃自动拉起、内存上限保护） |
| `deploy/nginx-askzen.conf` | Nginx 反代配置（含 SSE 流式支持，AI 聊天不卡） |

### 关键决策记录

1. **不需要 sharp**：项目已配置 `images.unoptimized: true`，Windows/CI 构建产物可直接在 Linux 运行，无平台二进制问题
2. **standalone 输出加了 Windows 平台守卫**：Windows 本地构建复制 pnpm 的 symlink 布局会报 EPERM（无符号链接权限），故 `next.config.mjs` 仅在非 Windows 平台启用 `output: 'standalone'`。**本地 `pnpm build` 走普通模式，CI（Linux）走 standalone 模式**，部署产物只来自 CI
2. **不用 Coolify/Dokploy**：无状态应用 + GitHub Actions 已覆盖自动部署，面板全家桶省下 300-500MB 内存（2C2G 意义重大）
3. **环境变量单一来源**：GitHub Secret `ENV_PRODUCTION` 存完整 .env 内容，构建时写入 `.env.production`（烘焙 NEXT_PUBLIC_* 进前端包），部署时上传为 `/opt/askzen/.env`（systemd EnvironmentFile 提供运行时变量）
4. **cron 迁移**：Vercel cron（`0 8 * * *` 调 subscription-reminders）改用服务器 crontab，保持同一时刻

---

## 1. 服务器初始化（一次性，约 30 分钟）

### 1.1 EC2 基础检查

- [ ] 实例：香港 ap-east-1，Ubuntu 24.04 LTS，gp3 30GB
- [ ] 绑定 **Elastic IP** 并关联到实例（关联运行中实例免费，否则停启后 IP 会变）
- [ ] **安全组**只开放：22（建议限制为你的 IP）、80、443
- [ ] 已设 Billing Alarm（超 $50 告警）

### 1.2 SSH 登录与基础配置

```bash
ssh -i <你的pem密钥> ubuntu@<EIP>

# 系统更新
sudo apt update && sudo apt upgrade -y

# 4GB swap（防构建/突发内存不足）
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h   # 确认 Swap 显示 4.0Gi

# 时区（可选，便于看日志）
sudo timedatectl set-timezone Asia/Shanghai
```

### 1.3 安装 Node.js 22（NodeSource）

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v22.x
```

### 1.4 安装 Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable --now nginx
```

### 1.5 创建应用目录与部署用户授权

```bash
sudo mkdir -p /opt/askzen/app
sudo chown -R ubuntu:ubuntu /opt/askzen
```

### 1.6 systemd 服务

```bash
sudo cp /opt/askzen/askzen.service /etc/systemd/system/askzen.service
# （首次可先手写，内容见 deploy/askzen.service，路径 /opt/askzen/*）
sudo systemctl daemon-reload
sudo systemctl enable askzen
```

### 1.7 允许 CI 免密重启服务

```bash
sudo visudo -f /etc/sudoers.d/askzen-deploy
# 写入这一行（只放行重启命令，不给全量 sudo）：
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart askzen

-CTRL+O 写入+ Enter保存，CTRL+X 退出

sudo chmod 440 /etc/sudoers.d/askzen-deploy
```

### 1.8 Nginx 站点

```bash
# 将 deploy/nginx-askzen.conf 内容放到服务器（记得把 server_name 改成你的域名）-
sudo vim /etc/nginx/sites-available/askzen
- 将nginx-askzen.conf中的内容拷贝到askzen，然后Esc，:wq保存退出

sudo ln -s /etc/nginx/sites-available/askzen /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

---

## 2. CI 自动部署配置（一次性）

### 2.1 生成部署专用 SSH 密钥对

> **原理**：SSH 密钥对 = 私钥 + 公钥。私钥相当于"身份证"，公钥相当于服务器登记的"准入名单"。
> 谁持有私钥，谁就能登录。这里生成一对**部署专用**密钥：私钥交给 GitHub Actions（部署时用），公钥登记到 EC2。
> 它和 AWS 的 .pem 是**两把独立的钥匙**：.pem 是你本人手动登录用的（保持不变），deploy 密钥是 CI 机器用的，互不影响。

**第一步：在你的 Windows 电脑上生成密钥对**（PowerShell，Windows 10+ 自带 ssh-keygen）：

```powershell
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\askzen_deploy
# 提示 Enter passphrase：直接按回车（空密码，CI 无法交互输入密码）
# 提示 Enter same passphrase again：再按回车
```

生成两个文件（在 `C:\Users\你的用户名\.ssh\` 下）：

| 文件 | 是什么 | 去向 |
|------|--------|------|
| `askzen_deploy` | 私钥 | 之后粘贴到 GitHub Secret `SSH_PRIVATE_KEY` |
| `askzen_deploy.pub` | 公钥 | 下面第二步登记到 EC2 |

**第二步：把公钥登记到 EC2 服务器**

```powershell
# 1. 先复制公钥内容到剪贴板（本地 PowerShell）：
cat $env:USERPROFILE\.ssh\askzen_deploy.pub | clip
# 输出形如 ssh-ed25519 AAAAC3Nza...的一整行

# 2. 用 AWS 的 pem 密钥登录服务器（和平时一样）：
ssh -i C:\Users\admin\.ssh\MyChanRSA.pem ubuntu@<EIP>
```

登录后**在服务器上**执行：

```bash
# 把刚才复制的公钥粘贴到引号里（一整行，注意必须用 >> 追加，不能是 > 覆盖，
# 否则会把你自己的 pem 登录权限抹掉！）
echo '粘贴的内容' >> ~/.ssh/authorized_keys

# 确认文件里现在有两行公钥（一行是 AWS pem 的，一行是刚加的 deploy 公钥）
cat ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

**第三步：本地验证 deploy 密钥能免密登录**（回到本地 PowerShell）：

```powershell
ssh -i $env:USERPROFILE\.ssh\askzen_deploy ubuntu@<EIP>
# 不要求任何密码、直接进入服务器 = 配置成功，exit 退出
```

> 为什么这样就是"CI 能部署"？GitHub Actions 的构建机器每次部署时从 Secrets 里读出私钥，
> 用它 SSH 连接你的服务器。服务器只认钥匙不认人——和第三步你本地验证的完全同一机制。

### 2.2 GitHub 仓库 Secrets（Settings → Secrets and variables → Actions）
**采用New Reposotiry secret的方式逐个添加**
| Secret | 内容 |
|--------|------|
| `SSH_HOST` | Elastic IP |
| `SSH_USER` | `ubuntu` |
| `SSH_PRIVATE_KEY` | `~/.ssh/askzen_deploy` 私钥**全部内容**（含 BEGIN/END 行） |
| `ENV_PRODUCTION` | 完整 `.env` 文件内容（以本地 `.env.local` 为基础，**注意把 `NEXT_PUBLIC_SITE_URL` 改成正式域名 `https://...`**） |

### 2.3 触发首次部署

```bash
git add . && git commit -m "ci: self-hosted deployment (standalone + GH Actions + nginx/systemd)" && git push
```

push 到 main 即触发 Actions。到仓库 Actions 页看进度：构建约 3-5 分钟，rsync 约 1 分钟。

### 2.4 服务器侧验证

```bash
sudo systemctl status askzen          # active (running)
curl -I http://127.0.0.1:3000         # HTTP 200/307
sudo journalctl -u askzen -n 50       # 无报错
curl -I http://<EIP>/                 # Nginx 反代正常
```

---

## 3. 域名切换（Cloudflare，停机约 0-2 分钟）

> 前提：先用 `http://<EIP>/` 直接全功能验收一遍（登录、聊天、课程、共创、后台、支付回调除外——回调类需域名）。

1. Cloudflare DNS：**删除** Vercel 的 CNAME 记录，**新增** `A` 记录 → Elastic IP，**云朵置灰（DNS only）**
2. `www` 同样处理（或 CNAME 指向主域名）
3. 等待 DNS 生效（灰云无 CDN 缓存，TTL 默认 5 分钟内）：
   ```bash
   nslookup 你的域名   # 返回 EIP 即生效
   ```
4. **HTTPS**：灰云下 Cloudflare 不再提供边缘证书，需要服务器自己签：
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d 你的域名 -d www.你的域名
   # 自动配置 443 + 90 天自动续期（systemd timer 已自动启用）
   ```
5. 验证：`https://你的域名` 全流程走一遍（见 §5 验收清单）

> 注意：橙云→灰云后，Cloudflare 的免费 SSL/CDN/防护不再生效，HTTPS 由服务器 Let's Encrypt 提供，防护靠 Nginx + 安全组。若将来想恢复橙云防护，代价是国内访问绕行 CF 海外节点（速度回退）。

---

## 4. 定时任务（cron）

替换 Vercel cron（原 schedule `0 8 * * *` 为 UTC 8:00 = 北京 16:00）：

```bash
crontab -e
# 若 §1.2 已把时区设为 Asia/Shanghai，用北京时间表达：
# 每天 16:00 发订阅到期提醒
0 16 * * * curl -fsS -X POST "http://127.0.0.1:3000/api/cron/subscription-reminders" -H "Authorization: Bearer <CRON_SECRET>" >> /var/log/askzen-cron.log 2>&1
```

- `<CRON_SECRET>` 与 `.env` 中的 `CRON_SECRET` 一致
- 检查接口方法：`subscription-reminders` 路由用 POST 还是 GET，以 `app/api/cron/subscription-reminders/route.ts` 导出为准
- 验证：手动 curl 一次，看 `/var/log/askzen-cron.log`

---

## 5. 上线验收清单

- [ ] 首页/博客/课程列表正常加载（中英文）
- [ ] 登录/注册（Supabase Auth 邮箱验证邮件能收到）
- [ ] AI 聊天流式输出不卡顿（Nginx SSE 配置生效）
- [ ] 课程详情页、打卡、评论
- [ ] 共创课程：认领→填内容→合并→后台发布全链路
- [ ] 后台管理：会话登录、数据加载、各管理页
- [ ] Creem 支付 webhook 正常（域名切换后在新地址接收）
- [ ] 定时任务手动触发成功
- [ ] `https` 证书有效、http 自动跳转 https
- [ ] 大陆实测访问速度（对比迁移前）

## 6. 收尾

- [ ] Vercel 项目删除或暂停（确认不再计费/部署），先观察 EC2 稳定运行 3-7 天再删
- [ ] Supabase 控制台：Auth URL Configuration 确认 Site URL / Redirect URLs（域名没变则无需动）
- [ ] 服务器每日数据库备份（Supabase 免费版无自动备份）：
      ```bash
      # pg_dump 需用 Supabase 提供的数据库连接串（Settings → Database）
      # 建议备份到 Cloudflare R2（10GB 免费）或本地，见文档末尾复盘
      ```
- [ ] UptimeRobot（免费）监控 `https://域名`，顺带保活 Supabase 免费项目（防一周无活动自动暂停）

## 7. 回滚方案

| 场景 | 动作 |
|------|------|
| 新版本代码有 bug | `git revert` + push，CI 自动重新部署（约 5 分钟）；或直接回滚：上一版产物已被 rsync `--delete` 覆盖，故重要发布前可先 `ssh` 手动备份 `/opt/askzen/app` 为 `app.bak.<日期>` |
| EC2 整体异常 | Cloudflare DNS 把 A 记录临时切回 Vercel CNAME（**Vercel 项目保留 7 天再删**就是为了这一步），TTL 5 分钟内恢复 |
| 数据库问题 | 与本次迁移无关（Supabase 未动），排除应用侧即可 |

---

## 8. 复盘要点

### 成本账（6 个月视角）

| 项目 | 金额 |
|------|------|
| EC2 T4g.small + 30GB gp3 + EIP | ~$17-20/月，$200 抵扣金覆盖约 6 个月+ |
| GitHub Actions | 免费（每月构建 ~100 次 × 5 分钟 ≈ 500 分钟 < 2000 免费） |
| Supabase | 免费版（500MB 上限，`SELECT pg_size_pretty(pg_database_size(current_database()));` 定期检查，超 ~350MB 启动自托管迁移） |
| Cloudflare / GoDaddy | 不变，0 新增 |

### 经验沉淀

1. **无状态应用迁移成本极低**：数据全在 Supabase，应用侧迁移=传文件+改 DNS，全程可回退
2. **构建与运行分离**是 2C2G 小实例的正解：CI 构建、服务器只跑 standalone，内存压力消失
3. **跨境链路是之前 401/挂起问题的根因**：迁移后 dev→生产、用户→应用、应用→DB 三段链路全部改观
4. **灰云是大陆访问速度的关键取舍**：放弃 CF 免费防护换直连速度，用 Nginx + 安全组 + fail2ban（可选）补位
5. **两个遗留决策点**（6 个月后）：抵扣金耗尽 → 续费(~$20/月) or 迁国产云香港；Supabase 逼近 500MB → Pro $25/月 or 自托管（届时需 4C8G）

### 已知限制

- EC2 单实例无高可用（对当前 ~100 用户体量可接受；CloudWatch 免费告警建议配 CPU/内存/状态检查）
- Supabase 免费版一周无活动会暂停（UptimeRobot 保活解决）
- 大陆访问香港线路晚高峰可能波动（AWS 非 CN2 优化线路，可接受；极端情况未来可换 DMIT CN2 GIA）
