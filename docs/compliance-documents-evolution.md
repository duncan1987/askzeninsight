# 合规文档演进历史

本文档记录了隐私政策、服务条款和退款政策的创建和演进过程，基于Git提交历史重构。

---

## 目录

1. [服务条款（Terms of Service）](#服务条款terms-of-service)
2. [隐私政策（Privacy Policy）](#隐私政策privacy-policy)
3. [退款政策（Refund Policy）](#退款政策refund-policy)
4. [关键演进节点](#关键演进节点)

---

## 服务条款（Terms of Service）

### 初版创建

**Commit:** `f989738` - feat: Add subscription management, conversation history, and testing infrastructure
**日期:** 2025-01-18（估计）

**初版内容结构：**
```tsx
<section>Service Description</section>
<section>Subscriptions & Billing</section>
<section>Acceptable Use</section>
<section>Disclaimers</section>
<section>Termination</section>
<section>Governing Law</section>
```

**核心条款：**
- ✅ 服务描述：AI-powered spiritual guidance
- ✅ 订阅计费：Automatic renewal
- ✅ 支付处理：Creem as merchant of record
- ✅ 可接受使用：No unlawful activities
- ✅ 免责声明：Informational purposes only

### 第一次重大更新

**Commit:** `b90c47d` - fix: Prevent duplicate conversation creation and add AI cost adjustment clause
**日期:** 2025-01-20

**新增条款：**

```tsx
<section>Payment Terms</section>
  <li><strong>Payment Changes:</strong> We reserve the right to change
      prices with 30 days notice.</li>
  <li><strong>AI Model Cost Adjustment:</strong> Subscription fees are
      subject to adjustment in response to changes in third-party AI model
      pricing and infrastructure costs...</li>
```

**更新原因：**
- AI模型成本可能变化，需要保留调整权利
- 第三方提供商（Zhipu AI、OpenAI、Anthropic等）
- 提前30天通知
- 用户可在新价格生效前取消

**位置：** app/terms/page.tsx 第152-163行

### 第二次重大更新

**Commit:** `5d3a1af` - docs: Major update to Pricing, About, and new FAQ page
**日期:** 2025-01-20

**更新内容：**
- 完善了所有条款的描述
- 增加了更详细的用户权利说明
- 强化了医疗免责声明
- 统一了文案表述

---

## 隐私政策（Privacy Policy）

### 初版创建

**Commit:** 约 `f989738` 同期
**日期:** 2025-01-18（估计）

**初版内容结构：**
```tsx
<section>Information We Collect</section>
<section>How We Use Your Information</section>
<section>Data Sharing</section>
<section>Data Security</section>
<section>User Rights</section>
<section>Changes to This Policy</section>
<section>Contact Us</section>
```

**核心内容：**
- ✅ 收集的信息：Email, name, usage data
- ✅ 使用目的：Provide service, improve experience
- ✅ 数据安全：Encryption, secure servers
- ✅ 用户权利：Access, delete, update
- ✅ Cookie使用：Authentication, analytics

### 演进过程

**关键改进：**
1. **明确聊天记录处理**
   - Free用户：不保存
   - Pro用户：永久保存
   - 用户可删除单个对话

2. **数据使用限制**
   - ❌ Not used for AI training
   - ❌ Not sold to third parties
   - ✅ Only for service delivery

3. **GDPR兼容性**
   - Right to data portability
   - Right to be forgotten
   - Data retention policies

---

## 退款政策（Refund Policy）

### 初版创建

**Commit:** `324e09e` - feat: Improve subscription cancellation UX and refund policy display
**日期:** 2025-01-18

**初版内容结构：**
```tsx
<section>Refund Eligibility</section>
<section>Refund Calculation</section>
<section>How to Request</section>
<section>Processing Time</section>
```

**核心政策：**
- ✅ 48小时：≤5条消息全额退款
- ✅ 48小时后：按使用量比例退款
- ✅ 7天内：可取消（需审核）
- ❌ 超过7天：不予退款

### 演进过程

**第一次改进**

**Commit:** `85ef6dd` - feat: Implement immediate subscription cancellation

**改进内容：**
- 明确立即取消（not period end）
- 取消后访问权限说明
- Dashboard显示退款状态

**第二次改进**

**Commit:** `9323cc7` - fix: Correct usage counting

**关键修复：**
- 只统计user消息，不算assistant
- 退款计算公式明确化

**退款计算公式：**
```
退款金额 = 计划价格 × ((计划天数 - 已用天数) / 计划天数)

月付$2.99，发了8条消息：
已用天数 = 8 / 100 = 0.08天
退款比例 = (30 - 0.08) / 30 = 99.73%
退款金额 = $2.99 × 99.73% ≈ $2.98
```

---

## 关键演进节点

### 节点1：订阅系统基础

**Commit:** `f989738` - feat: Add subscription management

**新增内容：**
- Terms中添加"Subscriptions & Billing"章节
- 明确Creem为merchant of record
- 自动续费说明
- 取消流程描述

### 节点2：退款政策完善

**Commit:** `324e09e` - feat: Improve subscription cancellation UX

**新增内容：**
- 创建独立退款政策页面
- Dashboard显示退款资格
- SubscriptionStatusCard组件
- 使用量追踪

### 节点3：合规性强化

**Commit:** `b90c47d` - fix: Add AI cost adjustment clause

**新增内容：**
- AI模型成本调整条款
- 30天通知承诺
- 用户取消权利
- Fair Use Policy说明

### 节点4：Bug修复驱动的改进

**Commit:** `9323cc7` - fix: Correct usage counting

**修复内容：**
- 只统计user消息（不算assistant）
- subscription_id查询优化
- 退款计算精确化

---

## 文档对比：初版 vs 当前版

### 服务条款对比

| 方面 | 初版 | 当前版 |
|------|------|--------|
| 章节数量 | 6个 | 21个 |
| 字数 | ~500 | ~3000 |
| AI成本调整 | ❌ | ✅ |
| Fair Use Policy | ❌ | ✅ |
| 详细退款条款 | 简单 | 详细 |
| 医疗免责声明 | 1处 | 多处强化 |

### 隐私政策对比

| 方面 | 初版 | 当前版 |
|------|------|--------|
| Cookie说明 | 简单 | 详细（必要+分析） |
| 聊天记录 | 未明确 | 明确Free不保存 |
| 用户权利 | 基本 | GDPR兼容 |
| 数据训练 | 未提及 | 明确不用于训练 |
| 第三方共享 | 简单 | 详细说明 |

### 退款政策对比

| 方面 | 初版 | 当前版 |
|------|------|--------|
| 计算公式 | 文字描述 | 具体公式+示例 |
| 使用量定义 | 不明确 | 只统计user消息 |
| 时间限制 | 48小时/7天 | 明确表格 |
| 不予退款 | 未说明 | 详细列举 |

---

## 创建时间线

```
2025-01-15  [7b2e095] Initial commit（无合规文档）
            ↓
2025-01-18  [f989738] 添加订阅管理
            ├── Terms初版创建
            ├── Privacy初版创建
            └── 基础退款说明（在Terms中）
            ↓
2025-01-18  [324e09e] 改进取消UX
            ├── 创建独立Refund页面
            ├── SubscriptionStatusCard组件
            └── Dashboard退款状态显示
            ↓
2025-01-20  [b90c47d] Bug修复+AI成本条款
            ├── Terms添加AI成本调整
            └── 防重复创建conversation
            ↓
2025-01-20  [9323cc7] Usage计数修复
            ├── 只统计user消息
            ├── subscription_id修复
            └── 禅意错误消息
            ↓
2025-01-20  [5d3a1af] 文档大更新
            ├── Pricing全面重写
            ├── About全面重写
            ├── FAQ全新创建
            └── 统一文案表述
```

---

## 设计决策记录

### 1. 为什么Refund Policy独立成页？

**决策：** 创建独立的 `/refund` 页面

**原因：**
- 建立用户信任
- SEO友好（用户搜索"refund"时能找到）
- 减少客服工单
- 可以提供更详细的说明

**实施：** Commit `324e09e`

### 2. 为什么只统计user消息？

**决策：** 退款计算只算`message_type='user'`

**原因：**
- User主动发起对话
- Assistant是被动响应
- 对话轮次：1 user + 1 assistant = 1次交互

**实施：** Commit `9323cc7`

### 3. 为什么添加AI成本调整条款？

**决策：** Terms中明确AI成本可调整

**原因：**
- AI模型定价不稳定
- Zhipu AI等可能涨价
- 需要保留调整权利
- 30天通知保障用户权益

**实施：** Commit `b90c47d`

### 4. 为什么多处强调医疗免责？

**决策：** Chat界面、Terms、About、FAQ都强调

**原因：**
- 产品涉及心理健康
- 必须明确不是医疗建议
- 法律合规要求
- 避免误导用户

**实施位置：**
- Chat界面横幅
- Terms section 10
- About红色警告框
- FAQ dedicated section

---

## 技术实现细节

### Terms页面结构

```tsx
<header>Acceptance of Terms</header>
<section>Service Description</section>
  ├── AI-Generated Content Disclaimer
  └── Service Purpose
<section>Eligibility</section>
<section>Account Registration</section>
<section>Subscription Plans & Billing</section>
<section>Payment Terms</section>
  ├── Payment Changes
  ├── AI Model Cost Adjustment ← 新增
  └── Dispute Resolution
<section>Cancellation & Refunds</section>
<section>Usage Limits & Fair Use Policy</section>
<section>Acceptable Use</section>
<section>Health & Medical Disclaimer</section>
<section>Intellectual Property</section>
<section>Privacy</section>
<section>Disclaimers & Warranties</section>
<section>Limitation of Liability</section>
<section>Indemnification</section>
<section>Termination</section>
<section>Changes to Terms</section>
<section>Governing Law</section>
<section>Severability</section>
<section>Waiver</section>
<section>Contact Us</section>
```

### Refund Policy计算逻辑

**文件：** `app/api/subscription/cancel/route.ts`

```typescript
// 只统计user消息
const { data: usageRecords } = await adminClient
  .from('usage_records')
  .select('id')
  .eq('user_id', userId)
  .eq('message_type', 'user')  // 关键！
  .gte('timestamp', today.toISOString())

// 计算退款
const usageCount = usageRecords?.length || 0
const messagesPerDay = 100
const daysOfQuotaUsed = Math.ceil(usageCount / messagesPerDay)
const planDays = subscription.plan === 'annual' ? 365 : 30
const refundPercentage = Math.max(0, ((planDays - daysOfQuotaUsed) / planDays) * 100)
const estimatedRefund = (refundPercentage / 100) * (subscription.plan === 'annual' ? 24.99  : 2.99)
```

---

## 未来改进方向

### 短期（1个月）

- [ ] Cookie同意管理横幅
- [ ] 数据导出功能
- [ ] 政策版本控制（version history）

### 中期（3个月）

- [ ] GDPR合规性审计
- [ ] CCPA合规（加州消费者隐私法）
- [ ] 数据处理协议（DPA）

### 长期（6个月）

- [ ] ISO 27001认证
- [ ] SOC 2合规
- [ ] 隐私影响评估（PIA）

---

## 附录：相关Commit列表

### Terms相关
- `f989738` - 初版创建
- `b90c47d` - 添加AI成本调整条款
- `5d3a1af` - 全面更新

### Privacy相关
- `f989738` - 初版创建
- `5d3a1af` - 内容完善

### Refund相关
- `324e09e` - 独立页面创建
- `85ef6dd` - 立即取消实施
- `9323cc7` - Usage计算修复
- `5d3a1af` - 详细化说明

### Dashboard相关
- `324e09e` - SubscriptionStatusCard组件
- `9323cc7` - Usage统计修复

---

**文档版本：** v1.0
**最后更新：** 2025-01-21
**基于Git历史重构：** 7b2e095 → 5d3a1af
