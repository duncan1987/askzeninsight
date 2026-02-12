# 管理员退款审核使用指南

## 🚀 快速开始

### 1. 设置管理员密钥

在 `.env.local` 文件中添加：

```bash
ADMIN_SECRET_KEY=your-super-secret-admin-key-here
```

**安全提示**：
- 使用强密码（至少32位随机字符）
- 不要将此密钥提交到Git仓库
- 定期更换密钥

生成密钥示例：
```bash
# 方法1: 使用Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 方法2: 使用OpenSSL
openssl rand -hex 32
```

---

## 📱 使用方法

### 方法1: 管理员界面（推荐）

访问：`http://localhost:3000/admin/refunds`

1. 输入管理员密钥
2. 查看待审核的退款列表
3. 点击"Review"按钮审核
4. 选择批准或拒绝
5. 可选添加备注

---

### 方法2: API调用

#### 查看待审核列表

```bash
curl -X GET "http://localhost:3000/api/admin/refund-review?status=requested" \
  -H "x-admin-key: your-admin-secret-key"
```

**响应示例**：
```json
{
  "success": true,
  "count": 2,
  "subscriptions": [
    {
      "id": "sub-uuid-1",
      "user_id": "user-uuid-1",
      "userEmail": "user@example.com",
      "userName": "John Doe",
      "plan": "monthly",
      "refund_amount": 2.50,
      "refund_estimated_at": "2026-02-08T10:00:00Z",
      "refund_notes": null,
      "created_at": "2026-02-05T10:00:00Z"
    }
  ]
}
```

#### 批准退款

```bash
curl -X POST "http://localhost:3000/api/admin/refund-review" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: your-admin-secret-key" \
  -d '{
    "subscriptionId": "sub-uuid-1",
    "action": "approve",
    "notes": "Approved within review period. User had low usage."
  }'
```

#### 拒绝退款

```bash
curl -X POST "http://localhost:3000/api/admin/refund-review" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: your-admin-secret-key" \
  -d '{
    "subscriptionId": "sub-uuid-1",
    "action": "reject",
    "notes": "Usage exceeded acceptable threshold (>200 messages)"
  }'
```

---

## 📊 退款计算逻辑

### 48小时内取消

```
Full refund if ≤ 5 messages used
Otherwise: prorated refund based on usage

示例：
- 使用5条 → 100%退款
- 使用30条 → 按比例退款
```

### 48小时-7天取消

```javascript
refundAmount = planAmount × (remainingDays / totalDays) × (1 - usageRateCoefficient)

使用率系数：
- ≤30条: 10% (几乎全新)
- 31-100条: 50% (轻度使用)
- 101-200条: 80% (中度使用)
- >200条: 100% (重度使用，不退)
```

**计算示例**：
```
月付$2.99, 第3天取消, 使用80条消息

remainingDays = 30 - 3 = 27
remainingDaysRatio = 27 / 30 = 0.9

usageRateCoefficient = 0.5 (31-100条)

refundAmount = 2.99 × 0.9 × (1 - 0.5)
            = 2.99 × 0.9 × 0.5
            = $1.35
```

---

## 🔄 审核流程

```
用户取消 (48h-7天)
    ↓
系统计算预估退款
    ↓
refund_status='requested'
保持Pro权限 (3天审核期)
    ↓
管理员审核
    ↓
├─ 批准 → refund_status='approved'
│         → Creem取消订阅
│         → 发送批准邮件
│         → 用户降级
│
└─ 拒绝 → refund_status='rejected'
          → Creem取消订阅
          → 发送拒绝邮件
          → 用户降级
```

---

## 📧 用户通知

### 审核通过邮件

用户会收到：
```
主题: Refund Approved - Ask Zen Insight

✓ Your Refund Has Been Approved
Refund Amount: $1.35
Your refund will appear in your account within 3-5 business days.
```

### 审核拒绝邮件

用户会收到：
```
主题: Refund Request Update - Ask Zen Insight

✕ Your Refund Request Was Declined
After reviewing your request, we are unable to approve a refund.
[管理员备注]
```

---

## 🔍 查询不同状态的退款

### 所有待审核
```bash
GET /api/admin/refund-review?status=requested
```

### 已批准
```bash
GET /api/admin/refund-review?status=approved
```

### 已拒绝
```bash
GET /api/admin/refund-review?status=rejected
```

### 所有退款记录
```bash
GET /api/admin/refund-review?status=processed
```

---

## 🛡️ 安全注意事项

1. **保护密钥**
   - 永远不要在前端代码中暴露ADMIN_SECRET_KEY
   - 使用环境变量
   - 定期轮换密钥

2. **API访问**
   - 所有管理员API都需要 `x-admin-key` header
   - 未授权请求返回401错误

3. **审计日志**
   - 所有审核操作都记录在数据库
   - `refund_reviewed_at` 和 `refund_reviewed_by` 字段
   - 便于事后追踪

---

## 🧪 测试流程

### 1. 创建测试订阅
```
1. 注册新用户
2. 购买Pro订阅
3. 等待48小时
4. 取消订阅
```

### 2. 检查数据库
```sql
SELECT
  id,
  refund_status,
  refund_amount,
  refund_estimated_at,
  created_at
FROM subscriptions
WHERE refund_status = 'requested';
```

### 3. 测试审核
```bash
# 批准
curl -X POST "http://localhost:3000/api/admin/refund-review" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: test-key" \
  -d '{"subscriptionId": "xxx", "action": "approve"}'
```

### 4. 验证结果
- ✅ 退款状态变为 'approved'
- ✅ 用户收到通知邮件
- ✅ Creem订阅已取消
- ✅ 用户降级到Free tier

---

## 📝 常见问题

**Q: 忘记管理员密钥怎么办？**
A: 在 `.env.local` 中设置新密钥，重启开发服务器

**Q: 审核后能修改决定吗？**
A: 不能，一旦批准或拒绝无法更改。请仔细审核

**Q: 如何批量处理多个退款？**
A: 目前需要逐个处理，可以在管理界面快速操作

**Q: 退款多久能到账？**
A: 邮件中说明3-5个工作日，实际取决于Creem和支付方式

---

## 🔧 生产环境部署

1. **设置环境变量**
   在生产平台(Vercel/Netlify)设置 `ADMIN_SECRET_KEY`

2. **限制访问**
   考虑添加IP白名单或VPN要求

3. **监控**
   设置告警监控新的退款请求

4. **备份**
   定期备份订阅和退款数据

---

## 📞 需要帮助？

如有问题，联系技术团队：
- Email: support@zeninsight.xyz
- 查看：/admin/refunds 管理界面
