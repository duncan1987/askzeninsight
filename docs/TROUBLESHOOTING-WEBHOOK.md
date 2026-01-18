# Webhook 调试指南

## 问题：订阅支付成功后 Supabase 数据库中没有记录

### 可能的原因：

1. **Creem Dashboard 中 Webhook URL 未配置或配置错误**
2. **Webhook 签名验证失败**
3. **网络问题导致 Creem 无法访问你的服务器**

---

## 解决方案

### 步骤 1: 配置 Creem Webhook URL

1. 登录 Creem Dashboard (https://dashboard.creem.io)
2. 进入 **Developers** → **Webhooks**
3. 点击 **Add Webhook**
4. 输入你的 Webhook URL：
   ```
   https://zeninsight.xyz/api/creem/webhook
   ```
5. 选择要监听的事件：
   - `checkout.completed`
   - `subscription.active`
   - `subscription.paid`
   - `subscription.update`
   - `subscription.cancelled`
   - `subscription.canceled`
   - `subscription.expired`
6. 保存 Webhook Secret 到环境变量 `CREEM_WEBHOOK_SECRET`

### 步骤 2: 检查 Vercel 环境变量

在 Vercel 项目设置中，确保以下环境变量已配置：

```bash
CREEM_API_KEY=your_creem_api_key
CREEM_WEBHOOK_SECRET=your_webhook_secret
CREEM_PRO_PAYMENT_LINK=your_pro_payment_link
CREEM_ANNUAL_PAYMENT_LINK=your_annual_payment_link
```

### 步骤 3: 检查 Vercel 日志

1. 访问 Vercel Dashboard
2. 选择你的项目
3. 进入 **Logs** 标签
4. 完成一次测试订阅
5. 查找以下日志：
   - `[Creem Webhook] Received webhook` - 说明 webhook 被调用
   - `[Webhook] Creating subscription:` - 说明正在创建订阅
   - `[Webhook] Upsert result:` - 说明数据库操作结果

### 步骤 4: 测试 Webhook

#### 方法 A: 使用 Creem Dashboard 的 "Send Test Webhook" 功能

1. 在 Creem Dashboard 的 Webhooks 页面
2. 找到你的 webhook
3. 点击 **Send test webhook**
4. 选择 `checkout.completed` 事件
5. 检查 Vercel 日志确认收到

#### 方法 B: 使用 curl 测试

```bash
curl -X POST https://zeninsight.xyz/api/creem/webhook \
  -H "Content-Type: application/json" \
  -H "creem-signature: t=123456,v1=test" \
  -d '{
    "type": "checkout.completed",
    "data": {
      "request_id": "test_user_id",
      "subscription": {
        "id": "sub_test123",
        "interval": "month"
      },
      "metadata": {
        "plan": "pro"
      }
    }
  }'
```

### 步骤 5: 使用调试端点（临时）

部署后，可以暂时访问调试端点查看订阅状态：

```
https://zeninsight.xyz/api/debug/subscriptions
```

**注意**：此端点仅用于开发调试，生产环境应该移除或添加身份验证。

---

## 常见问题

### Q1: Webhook 日志显示 "Invalid signature"

**原因**：Webhook Secret 不匹配

**解决**：
1. 从 Creem Dashboard 复制正确的 Webhook Secret
2. 更新 Vercel 环境变量 `CREEM_WEBHOOK_SECRET`
3. 在 Vercel 触发重新部署

### Q2: Vercel 日志中没有 webhook 相关日志

**原因**：Creem 无法访问你的服务器

**解决**：
1. 确认 Webhook URL 正确：`https://zeninsight.xyz/api/creem/webhook`
2. 确认服务器在线且可访问
3. 检查是否有防火墙或 CDN 规则阻止 POST 请求

### Q3: Webhook 被调用但数据库没有记录

**原因**：可能是 request_id 或 metadata 丢失

**解决**：
1. 检查 Vercel 日志中的完整 payload
2. 确认 checkout 创建时传递了 `request_id` 参数
3. 确认 metadata 中包含了 `plan` 信息

---

## 支付流程调试清单

- [ ] Creem Dashboard 中配置了正确的 Webhook URL
- [ ] Webhook Secret 已添加到 Vercel 环境变量
- [ ] Checkout 创建时传递了 `request_id`（用户 ID）
- [ ] Vercel 日志显示 webhook 被接收
- [ ] Supabase 数据库中 `subscriptions` 表存在
- [ ] Supabase `SUPABASE_SERVICE_ROLE_KEY` 环境变量已配置
- [ ] Supabase RLS 策略允许服务角色写入

---

## 联系支持

如果以上步骤都无法解决问题，请收集以下信息并联系支持：

1. Vercel 日志（包含 webhook 请求）
2. Creem Transaction ID
3. Creem Dashboard 中 Webhook 配置截图
4. 浏览器控制台错误（如果有）
