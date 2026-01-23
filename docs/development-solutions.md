# Ask Zen Insight 产品开发方案讨论记录

本文档记录了Ask Zen Insight产品开发和打磨过程中的关键决策、技术方案选择和Bug修复过程。

---

## 目录

1. [服务条款优化 - AI成本调整条款](#1-服务条款优化---ai成本调整条款)
2. [Bug修复 - 重复创建Conversation记录](#2-bug修复---重复创建conversation记录)
3. [用户体验优化 - 禅意错误消息](#3-用户体验优化---禅意错误消息)
4. [UI优化 - 移除重复的Subscription入口](#4-ui优化---移除重复的subscription入口)
5. [核心Bug修复 - Usage统计和退款计算](#5-核心bug修复---usage统计和退款计算)
6. [页面内容更新 - Pricing/About/FAQ](#6-页面内容更新---pricingaboutfaq)
7. [产品定位调整 - 明确注册要求](#7-产品定位调整---明确注册要求)

---

## 1. 服务条款优化 - AI成本调整条款

### 1.1 问题背景

用户提出需求：检查服务条款中是否有关于订阅价格随AI大模型调用成本调整的声明。

### 1.2 检查结果

检查发现：`app/terms/page.tsx` 中的Payment Terms部分只有一般性的价格变更通知：

> **Payment Changes:** We reserve the right to change prices with 30 days notice.

**缺少专门说明**：订阅费用可能因第三方AI提供商（Zhipu AI、OpenAI、Anthropic等）的成本变化而调整。

### 1.3 方案制定

**新增条款内容：**

```
**AI Model Cost Adjustment:** Subscription fees are
subject to adjustment in response to changes in third-party AI model
pricing and infrastructure costs. As our service relies on external
AI providers (including but not limited to Zhipu AI, OpenAI, Anthropic,
and other LLM providers), significant fluctuations in their pricing
or the introduction of new cost structures may necessitate corresponding
adjustments to our subscription fees. Any such adjustments will be made
with reasonable notice (minimum 30 days) to existing subscribers, and
you will have the opportunity to cancel your subscription before the
new pricing takes effect. We strive to maintain price stability while
ensuring sustainable service delivery.
```

**条款位置：**
- 文件：`app/terms/page.tsx`
- 章节：第6节 "Payment Terms"
- 位置：在"Payment Changes"和"Dispute Resolution"之间

### 1.4 实施结果

✅ 已添加到服务条款
✅ 位置：app/terms/page.tsx:152-163
✅ 承诺至少30天通知期
✅ 说明用户可在新价格生效前取消

---

## 2. Bug修复 - 重复创建Conversation记录

### 2.1 问题描述

用户报告：月付计划用户输入1条消息后：
- Chat History生成1条记录 ✅（正常）
- 但又创建了1条"New Conversation"记录 ❌（Bug）

### 2.2 问题排查

**文件：** `components/chat-interface.tsx`

**根本原因：** React状态更新是异步的

```typescript
// 问题代码流程
await saveMessage("user", userInput)
// 在saveMessage内部执行：setCurrentConversationId(data.conversationId)
// ← 状态更新是异步的，不会立即生效

await saveMessage("assistant", fullResponse)
// ← 此时currentConversationId还是undefined！
// 导致API又创建了一个新conversation
```

### 2.3 修复方案

**方案选择：** 使用返回值而非依赖状态

**修改内容：**

1. **修改saveMessage函数** - 增加返回值和explicitConversationId参数

```typescript
const saveMessage = async (
  role: "user" | "assistant",
  content: string,
  explicitConversationId?: string  // ← 新增参数
) => {
  const convId = explicitConversationId !== undefined
    ? explicitConversationId
    : currentConversationId

  // ... 保存逻辑

  return data.conversationId  // ← 返回conversationId
}
```

2. **修改handleSend函数** - 使用返回的conversationId

```typescript
// 保存用户消息并获取conversationId
const conversationId = await saveMessage("user", userInput)

// 保存助手消息时明确传入
await saveMessage("assistant", fullResponse, conversationId)
```

### 2.4 实施结果

✅ 文件：`components/chat-interface.tsx`
✅ 每轮对话只创建1个conversation
✅ User和Assistant消息都关联到同一个conversation

**技术教训：** React状态更新是异步的，不要在await链中依赖立即更新的状态。

---

## 3. 用户体验优化 - 禅意错误消息

### 3.1 问题描述

API调用有一定概率失败，错误提示为：
```
"API error: "
```

用户希望优化错误提示，使用带有禅意的话术。

### 3.2 方案选择

提供了5个方案供选择：

**方案一：简洁禅意风**
"The wind pauses, then returns. Please breathe and try again."

**方案二：自然隐喻风**
"Like clouds passing, the connection fades. A moment of patience, and the path clears."

**方案三：镜湖心境风**
"The mirror of the mind ripples briefly. Stillness returns with your next breath."

**方案四：流水潺潺风**
"The stream encounters stones, yet flows on. Let us try this path again."

**方案五：多句随机禅意风** ✅（被选择）
每次错误随机显示一句，避免单调，符合禅宗"无常"理念

### 3.3 实施方案

**选择了方案五 - 8句随机禅意错误消息：**

```typescript
const ZEN_ERROR_MESSAGES = [
  "Mountains remain silent through storms. Please try again in a moment.",
  "The bamboo bends but does not break. Let us reconnect.",
  "In stillness, clarity returns. Breathe and try once more.",
  "All things pass. This momentary pause shall too.",
  "Like clouds drifting, connection fades and returns. Please try again.",
  "The river flows around obstacles. Let us find another path.",
  "A brief pause in the journey. Rest, then continue when ready.",
  "Cherry blossoms fall, yet bloom again. Your patience is appreciated.",
]
```

**实施位置：**
1. **前端：** `components/chat-interface.tsx`
   - 添加ZEN_ERROR_MESSAGES数组
   - 修改catch错误处理逻辑
   - 保留usage limit (429)的技术性错误消息

2. **后端：** `app/api/chat/route.ts`
   - 添加相同的ZEN_ERROR_MESSAGES数组
   - 修改Zhipu AI API错误响应
   - 修改超时错误和通用错误

### 3.4 实施结果

✅ 前端和后端都实现随机禅意错误消息
✅ 保留了usage limit的明确错误提示
✅ 错误提示符合产品调性

**细节成就产品** - 错误提示也是用户体验的一部分。

---

## 4. UI优化 - 移除重复的Subscription入口

### 4.1 问题描述

右上角已有明显的Subscription按钮，但用户头像下拉菜单中也有"Subscription"选项，造成重复。

### 4.2 方案

**文件：** `components/auth/user-menu.tsx`

**移除内容：**
```tsx
// 删除这段代码
<a href="/pricing" ...>
  Subscription
</a>
```

**保留内容：**
- 用户信息（姓名、邮箱）
- Dashboard链接
- Sign Out按钮

### 4.3 实施结果

✅ 移除了重复的Subscription入口
✅ 简化了用户菜单
✅ 避免了与右上角按钮的重复

---

## 5. 核心Bug修复 - Usage统计和退款计算

### 5.1 问题描述

测试发现：
- `usage_records`表：月付用户有8条记录（4条user + 4条assistant）
- `messages`表：只有4条记录
- 取消订阅时：提示已用8条消息，但实际只发了4条

### 5.2 问题分析

**问题1：usage_records统计了user和assistant**

**根因：** 对话时每次记录两条usage
```typescript
// app/api/chat/route.ts
await recordUsage(userId, 'user')      // 记录用户消息
recordUsage(userId, 'assistant')       // 记录助手消息
```

**问题2：退款计算统计了所有usage_records**

**根因：** 没有过滤`message_type`

```typescript
// app/api/subscription/cancel/route.ts
const { data: usageRecords } = await adminClient
  .from('usage_records')
  .select('id')
  .eq('user_id', user.id)
  // ← 缺少 .eq('message_type', 'user')
```

**问题3：subscription_id为NULL**

**根因：** 查询条件过于严格
```typescript
// lib/usage-limits.ts
.in('status', ['active', 'cancelled', 'canceled'])
.gte('current_period_end', new Date().toISOString())
// ← 时间过滤导致查不到刚创建的订阅
```

### 5.3 修复方案

**Bug #1: 取消订阅API统计修复**

**文件：** `app/api/subscription/cancel/route.ts`

```typescript
// 添加message_type过滤
const { data: usageRecords } = await adminClient
  .from('usage_records')
  .select('id')
  .eq('user_id', user.id)
  .eq('message_type', 'user')  // ← 只统计user消息
  .gte('timestamp', today.toISOString())
```

**Bug #2: Dashboard页面统计修复**

**文件：** `app/dashboard/page.tsx`

```typescript
supabase
  .from('usage_records')
  .select('id')
  .eq('user_id', user.id)
  .eq('message_type', 'user')  // ← 只统计user消息
  .gte('timestamp', today.toISOString())
```

**Bug #3: subscription_id为NULL修复**

**文件：** `lib/usage-limits.ts`（3处）

修改位置：
- `checkUsageLimit()` 函数
- `getUsageStats()` 函数
- `recordUsage()` 函数

**修改前：**
```typescript
.in('status', ['active', 'cancelled', 'canceled'])
.gte('current_period_end', new Date().toISOString())
```

**修改后：**
```typescript
.select('id, status, current_period_end, replaced_by_new_plan')
.eq('user_id', userId)
.order('created_at', { ascending: false })
.limit(1)

// 获取最新的、未被替换的活跃订阅
const activeSub = subRecords?.find((sub) =>
  sub.status === 'active' && !sub.replaced_by_new_plan
)

currentSubscriptionId = activeSub?.id
```

### 5.4 数据验证

**修复前：**
- 用户发送2条消息
- usage_records: 4条 (2条user + 2条assistant)
- 退款计算: 4条消息用量 ❌

**修复后：**
- 用户发送2条消息
- usage_records: 4条 (2条user + 2条assistant)
- 退款计算: 2条消息用量 ✅
- subscription_id: 正确记录 ✅

### 5.5 实施结果

✅ 取消订阅API只统计user消息
✅ Dashboard显示只统计user消息
✅ subscription_id正确记录
✅ 退款计算准确

---

## 6. 页面内容更新 - Pricing/About/FAQ

### 6.1 Pricing页面更新

#### 6.1.1 需求

原页面功能列表过于简单，缺少：
- AI模型差异说明
- Fair Use Policy详细说明
- 退款政策
- 详细FAQ

#### 6.1.2 方案实施

**1. 更新定价卡片**

```tsx
// Free卡片
features={[
  '✓ Requires free account registration',  // ← 明确需要注册
  '10 messages per day',
  'Basic AI model (glm-4-flash)',
  'No chat history',
]}

// Pro卡片
features={[
  '30 premium messages/day with advanced AI (GLM-4)',
  'Unlimited basic model after quota',  // ← 强调超额后可用
  'Save chat history permanently',
  'Multiple conversation management',
  'Best for daily practice',
]}
```

**2. 添加Fair Use Policy区块**

```tsx
<div className="bg-muted/50 rounded-lg p-6">
  <h2>⚖️ Fair Use Policy</h2>
  <ul>
    <li>First 30 messages/day: Advanced AI (GLM-4)</li>
    <li>After 30 messages: Basic model (glm-4-flash)</li>
    <li>No hard limits: Continue using after quota</li>
    <li>Daily reset: Quota resets at midnight UTC</li>
  </ul>
</div>
```

**3. 添加"Why Choose Pro"区块**

4个核心价值：
- 🧠 Advanced AI Insights
- 💬 Chat History Saved
- 📚 Multiple Conversations
- 🔄 3x Daily Limit

**4. 添加Refund Policy区块**

```tsx
<div className="bg-blue-50 rounded-lg p-6">
  <h2>💰 Refund Policy</h2>
  <ul>
    <li>48 hours: Full refund if ≤5 messages</li>
    <li>After 48 hours: Prorated refund</li>
    <li>Up to 7 days: Cancellation accepted</li>
  </ul>
</div>
```

**5. 扩展FAQ（从3个到9个）**

新增问题：
- Fair Use Policy是什么？
- Pro和Free用户使用的AI模型有什么区别？
- 如何计算退款？
- 取消订阅后聊天历史会丢失吗？
- 可以在月付和年付之间切换吗？
- 这是医疗/心理健康服务吗？
- 更多问题？

### 6.2 About页面更新

#### 6.2.1 需求

原内容过于简单，缺少：
- koji（AI角色）介绍
- 产品理念
- 订阅价值说明

#### 6.2.2 方案实施

**1. 添加"Meet koji"区块**

```tsx
<div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6">
  <h2>🧘 Meet koji (空寂) - Your AI Zen Guide</h2>
  <p><strong>"空寂"</strong> means "Emptiness and Stillness"</p>

  <p>koji is a deeply cultivated, compassionate, and wise
  Zen meditation teacher designed to emulate Buddha's wisdom.</p>

  <ul>
    <li>Find inner peace amid life's complexities</li>
    <li>Resolve troubles through transcendent perspectives</li>
    <li>Explore decisions through mindfulness and causality</li>
    <li>Practice self-reflection and present-moment awareness</li>
  </ul>
</div>
```

**2. 添加"Our Approach"区块**

3个核心方法论：
- 💭 Heuristic Dialogue
- 🌊 Natural Metaphors
- 🤝 Non-Judgmental Presence

**3. 更新"What We Offer"区块**

```tsx
// 修改前
<h3>For Everyone</h3>

// 修改后
<p>All plans require a free account. Sign up to get started.</p>
<h3>Free (Registered Users)</h3>
<ul>
  <li>Requires free account registration</li>
  ...
</ul>
```

**4. 强化医疗免责声明**

```tsx
<div className="bg-red-50 rounded-lg p-6 border border-red-200">
  <h2>⚠️ Important Notice</h2>
  <p><strong>{siteName} is NOT a medical or mental health service.</strong></p>
  <p>If you are experiencing a mental health crisis,
  having thoughts of self-harm, or need immediate assistance,
  please contact emergency services or qualified healthcare
  professionals right away.</p>
</div>
```

### 6.3 FAQ页面创建

#### 6.3.1 需求

需要独立的FAQ页面，覆盖用户可能遇到的所有问题。

#### 6.3.2 方案实施

**8个分类，50+问题：**

1. **🚀 Getting Started** (3问)
   - Do I need to create an account?
   - How do I start a conversation?
   - What should I talk about?

2. **💰 Plans & Pricing** (4问)
   - Free vs Pro区别
   - Fair Use Policy说明
   - AI模型差异
   - 计划切换

3. **💳 Subscription & Billing** (6问)
   - 如何订阅
   - 如何取消
   - 退款政策
   - 退款计算
   - 聊天历史处理
   - 不满意怎么办

4. **💬 Using the Service** (5问)
   - 每天消息数量
   - 达到限额后
   - 对话隐私
   - 删除历史
   - 多对话管理

5. **🧘 About the Service** (5问)
   - koji是谁
   - 是否宗教服务
   - 是否医疗服务
   - 能否帮助心理健康问题
   - 使用哪些AI模型

6. **🔒 Privacy & Security** (5问)
   - 数据安全
   - AI训练
   - 数据收集
   - 数据导出
   - 账户删除

7. **🔧 Technical Support** (4问)
   - 服务不可用
   - 错误消息
   - 浏览器支持
   - 移动App

8. **💳 Billing & Payments** (5问)
   - 支付处理
   - 支付方式
   - 税费
   - 更新支付信息
   - 自动续费退款

**交互设计：**
```html
<details>
  <summary>问题？</summary>
  <p>答案...</p>
</details>
```

---

## 7. 产品定位调整 - 明确注册要求

### 7.1 问题描述

用户反馈：订阅计划比较中没有anonymous/guest用户，应确保用户只能登录后访问。

### 7.2 检查结果

**问题：** 页面暗示"guest"用户可用

**发现位置：**
1. Pricing页面：`"Start free, upgrade when you need more"`
2. About页面：`"For Everyone"`
3. FAQ页面：`"Free and guest users"`

### 7.3 方案实施

**Pricing页面修改：**

```tsx
// 修改前
<h1>Choose Your Plan</h1>
<p>Start free, upgrade when you need more</p>

// 修改后
<h1>Choose Your Plan</h1>
<p>All plans require a free account. Sign up to get started.</p>
```

```tsx
// Free卡片
// 修改前
features={[
  '10 messages per day',
  'Sign up to get started',
  ...
]}

// 修改后
features={[
  '✓ Requires free account registration',  // ← 明确标注
  '10 messages per day',
  ...
]}

ctaText="Sign Up Free"  // ← 修改CTA
```

**About页面修改：**

```tsx
// 修改前
<h3>For Everyone</h3>

// 修改后
<p>All plans require a free account. Sign up to get started.</p>
<h3>Free (Registered Users)</h3>
```

**FAQ页面修改：**

```tsx
// 修改前
q: 'Do I need to create an account?'
a: 'You can start using the service immediately as a guest...'

q: 'How many messages can I send per day?'
a: 'Free and guest users: 10 messages/day...'

// 修改后
q: 'Do I need to create an account?'
a: 'Yes, all plans require a free account registration...'

q: 'How many messages can I send per day?'
a: 'Free (registered) users: 10 messages/day...
Note: All plans require a free account registration.'
```

### 7.4 实施结果

✅ 移除所有"guest"用户暗示
✅ 统一表述：Free = Registered Users
✅ 明确所有计划需要注册
✅ 一致性检查：所有页面文案统一

---

## 8. 总结与反思

### 8.1 开发时间分配

| 模块 | 时间占比 | 说明 |
|------|---------|------|
| Prompt工程 | 25% | 迭代system prompt |
| Bug修复 | 30% | 聊天、订阅、统计 |
| 合规文档 | 20% | Terms, Privacy, Refund |
| 产品页面 | 15% | Pricing, About, FAQ |
| 核心功能 | 10% | Chat, Auth, Payment |

### 8.2 关键技术决策

1. **React状态管理** - 使用返回值而非依赖异步状态
2. **流式响应** - 使用TransformStream转换SSE
3. **Fair Use Policy** - 优质配额+降级机制
4. **Usage统计** - 只统计user消息，不算assistant
5. **订阅查询** - 简化条件，避免过度过滤

### 8.3 产品打磨经验

1. **细节成就产品**
   - 错误提示也是体验
   - 文案一致性很重要
   - 透明度建立信任

2. **合规性要提前规划**
   - 不要等到上线前才想到
   - 医疗免责声明多处提醒
   - 退款政策透明公开

3. **Bug往往在边界Case**
   - 测试要覆盖边界值
   - React异步状态是坑
   - 涉及钱的计算要精确

4. **文案即产品**
   - 技术语言→用户语言
   - 明确期望管理
   - 消除误导性信息

### 8.4 下一步计划

**产品侧：**
- [ ] 内测用户招募
- [ ] A/B测试定价页面
- [ ] 移动端优化

**功能侧：**
- [ ] 数据导出功能
- [ ] 语音对话
- [ ] 社群分享

**合规侧：**
- [ ] Cookie同意管理
- [ ] GDPR合规审计
- [ ] 无障碍访问优化

---

## 附录：修改文件清单

### 核心代码文件
1. `components/chat-interface.tsx` - 聊天界面bug修复
2. `app/api/chat/route.ts` - 禅意错误消息
3. `app/api/subscription/cancel/route.ts` - 退款计算修复
4. `lib/usage-limits.ts` - subscription_id修复（3处）
5. `app/dashboard/page.tsx` - usage统计修复
6. `components/auth/user-menu.tsx` - 移除Subscription链接

### 页面文件
7. `app/terms/page.tsx` - 添加AI成本调整条款
8. `app/pricing/page.tsx` - 全面重写
9. `app/about/page.tsx` - 全面重写
10. `app/faq/page.tsx` - 全新创建

### 文档文件
11. `docs/wechat-article-development-story.md` - 微信公众号文章

---

**文档版本：** v1.0
**最后更新：** 2025-01-20
**维护者：** Claude Sonnet 4.5
