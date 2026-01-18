# 订阅支付流程手动测试计划

## 前置条件

1. 配置环境变量：
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   CREEM_API_KEY=your_creem_api_key
   CREEM_WEBHOOK_SECRET=your_webhook_secret
   CREEM_PRO_PRODUCT_ID=your_pro_product_id
   CREEM_ANNUAL_PRODUCT_ID=your_annual_product_id
   ```

2. 确保Supabase数据库中存在 `subscriptions` 表，结构如下：
   ```sql
   CREATE TABLE subscriptions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID NOT NULL REFERENCES auth.users(id),
     creem_subscription_id TEXT UNIQUE NOT NULL,
     status TEXT NOT NULL DEFAULT 'active',
     plan TEXT, -- 'pro' or 'annual'
     interval TEXT, -- 'month' or 'year'
     current_period_end TIMESTAMPTZ NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. 启动开发服务器：
   ```bash
   pnpm dev
   ```

---

## 测试场景 1: 免费用户 → 月付Pro用户

### 步骤

1. **注册/登录免费用户**
   - 访问 `http://localhost:3000`
   - 点击 "Get Started" 注册新用户

2. **验证免费用户状态**
   - 访问 `http://localhost:3000/api/user/tier`
   - 预期响应：
     ```json
     {
       "tier": "free",
       "plan": null,
       "model": "glm-4-flash",
       "saveHistory": false,
       "authenticated": true
     }
     ```

3. **发起月付订阅**
   - 访问 `http://localhost:3000/pricing`
   - 点击 "Pro" 卡片的 "Subscribe Now" 按钮
   - 应该跳转到Creem支付页面

4. **模拟支付成功**
   - 在Creem测试环境完成支付
   - 或者使用以下命令模拟webhook：

   ```bash
   curl -X POST http://localhost:3000/api/creem/webhook \
     -H "Content-Type: application/json" \
     -H "creem-signature: v1=<your_signature>" \
     -d '{
       "eventType": "checkout.completed",
       "object": {
         "request_id": "<user_id>",
         "subscription": {
           "id": "sub_test_monthly_123",
           "status": "active",
           "interval": "month",
           "current_period_end_date": "2025-02-15 00:00:00"
         },
         "metadata": {
           "referenceId": "<user_id>",
           "userEmail": "<user_email>",
           "plan": "pro",
           "interval": "month"
         }
       }
     }'
   ```

5. **验证月付Pro用户状态**
   - 访问 `http://localhost:3000/api/user/tier`
   - 预期响应：
     ```json
     {
       "tier": "pro",
       "plan": "pro",
       "model": "glm-4.7",
       "saveHistory": true,
       "authenticated": true
     }
     ```

6. **验证数据库记录**
   - 在Supabase Dashboard查看 `subscriptions` 表
   - 应该有一条记录：
     ```sql
     SELECT * FROM subscriptions WHERE user_id = '<user_id>';
     ```
     预期结果：
     - `status`: 'active'
     - `plan`: 'pro'
     - `interval`: 'month'

---

## 测试场景 2: 免费用户 → 年付Annual用户

### 步骤

1-3. 同场景1的步骤1-3

4. **发起年付订阅**
   - 访问 `http://localhost:3000/pricing`
   - 点击 "Annual" 卡片的 "Subscribe Now" 按钮
   - 应该跳转到Creem支付页面

5. **模拟支付成功webhook**

   ```bash
   curl -X POST http://localhost:3000/api/creem/webhook \
     -H "Content-Type: application/json" \
     -H "creem-signature: v1=<your_signature>" \
     -d '{
       "eventType": "checkout.completed",
       "object": {
         "request_id": "<user_id>",
         "subscription": {
           "id": "sub_test_annual_456",
           "status": "active",
           "interval": "year",
           "current_period_end_date": "2026-01-15 00:00:00"
         },
         "metadata": {
           "referenceId": "<user_id>",
           "userEmail": "<user_email>",
           "plan": "annual",
           "interval": "year"
         }
       }
     }'
   ```

6. **验证年付Pro用户状态**
   - 访问 `http://localhost:3000/api/user/tier`
   - 预期响应：
     ```json
     {
       "tier": "pro",
       "plan": "annual",
       "model": "glm-4.7",
       "saveHistory": true,
       "authenticated": true
     }
     ```

---

## 测试场景 3: 订阅续费

### 步骤

1. **创建初始订阅**（同场景1）

2. **模拟续费webhook**

   ```bash
   curl -X POST http://localhost:3000/api/creem/webhook \
     -H "Content-Type: application/json" \
     -H "creem-signature: v1=<your_signature>" \
     -d '{
       "eventType": "subscription.paid",
       "object": {
         "id": "sub_test_monthly_123",
         "status": "active",
         "interval": "month",
         "current_period_end_date": "2025-03-15 00:00:00",
         "metadata": {
           "referenceId": "<user_id>",
           "plan": "pro",
           "interval": "month"
         }
       }
     }'
   ```

3. **验证周期结束日期已更新**
   - 查询数据库，确认 `current_period_end` 已更新

---

## 测试场景 4: 订阅取消

### 步骤

1. **创建订阅**（同场景1）

2. **模拟取消webhook**

   ```bash
   curl -X POST http://localhost:3000/api/creem/webhook \
     -H "Content-Type: application/json" \
     -H "creem-signature: v1=<your_signature>" \
     -d '{
       "eventType": "subscription.canceled",
       "object": {
         "id": "sub_test_monthly_123",
         "status": "canceled"
       }
     }'
   ```

3. **验证订阅状态已更新**
   - 查询数据库，确认 `status` 为 'cancelled'
   - 访问 `/api/user/tier`，确认用户降级为免费用户

---

## 测试场景 5: 月付用户升级为年付用户

### 步骤

1. **创建月付订阅**（同场景1）

2. **模拟月付订阅取消**

   ```bash
   curl -X POST http://localhost:3000/api/creem/webhook \
     -H "Content-Type: application/json" \
     -H "creem-signature: v1=<your_signature>" \
     -d '{
       "eventType": "subscription.canceled",
       "object": {
         "id": "sub_test_monthly_123",
         "status": "canceled"
       }
     }'
   ```

3. **创建年付订阅**（同场景2）

4. **验证升级成功**
   - 查询数据库，应该有两条订阅记录：
     - 月付：status = 'cancelled'
     - 年付：status = 'active', plan = 'annual'
   - 访问 `/api/user/tier`，确认 plan = 'annual'

---

## 快速测试脚本

创建一个测试脚本文件 `test-subscription.sh`：

```bash
#!/bin/bash

# 设置变量
USER_ID="your_test_user_id"
USER_EMAIL="test@example.com"
WEBHOOK_SECRET="your_webhook_secret"
BASE_URL="http://localhost:3000"

# 生成签名的函数
generate_signature() {
  payload=$1
  echo -n "$payload" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | awk '{print "v1="$2}'
}

# 测试月付订阅
echo "Testing monthly subscription..."
MONTHLY_PAYLOAD='{
  "eventType": "checkout.completed",
  "object": {
    "request_id": "'$USER_ID'",
    "subscription": {
      "id": "sub_test_monthly_'$(date +%s)'",
      "status": "active",
      "interval": "month",
      "current_period_end_date": "2025-02-15 00:00:00"
    },
    "metadata": {
      "referenceId": "'$USER_ID'",
      "userEmail": "'$USER_EMAIL'",
      "plan": "pro",
      "interval": "month"
    }
  }
}'

SIGNATURE=$(generate_signature "$MONTHLY_PAYLOAD")

curl -X POST $BASE_URL/api/creem/webhook \
  -H "Content-Type: application/json" \
  -H "creem-signature: $SIGNATURE" \
  -d "$MONTHLY_PAYLOAD"

echo -e "\n\nVerifying subscription status..."
curl $BASE_URL/api/user/tier \
  -H "Authorization: Bearer <your_access_token>"

echo -e "\n\n✅ Monthly subscription test completed!"
```

---

## 预期问题排查

### 问题1: Webhook签名验证失败
- 检查 `CREEM_WEBHOOK_SECRET` 是否正确
- 确保签名生成方式与Creem文档一致（HMAC-SHA256）

### 问题2: 订阅状态未更新
- 检查Supabase连接是否正常
- 查看 `subscriptions` 表是否存在
- 查看服务器日志获取详细错误信息

### 问题3: Plan字段为空
- 确认已应用最新的webhook代码修改
- 检查数据库 `subscriptions` 表是否有 `plan` 和 `interval` 列

---

## 完成检查清单

- [ ] 免费用户可以注册
- [ ] 免费用户查询返回正确状态
- [ ] 月付订阅流程正常工作
- [ ] 年付订阅流程正常工作
- [ ] Webhook正确处理 checkout.completed 事件
- [ ] Webhook正确处理 subscription.paid 事件
- [ ] Webhook正确处理 subscription.canceled 事件
- [ ] 数据库正确保存 plan 和 interval 字段
- [ ] /api/user/tier 正确返回用户订阅信息
- [ ] 月付用户升级为年付用户流程正常
