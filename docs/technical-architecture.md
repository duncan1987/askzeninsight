# Ask Zen Insight -- 技术架构文档

> 2026 International AI OPC Entrepreneurship Competition 参赛项目
>
> 项目名称: Ask Zen Insight (AI 禅修智慧导师)
>
> 版本: v1.0 | 日期: 2026-03-29

---

## 目录

1. [系统架构总览](#1-系统架构总览)
2. [技术栈选型与理由](#2-技术栈选型与理由)
3. [核心模块设计](#3-核心模块设计)
4. [数据流](#4-数据流)
5. [数据库设计](#5-数据库设计)
6. [API 文档](#6-api-文档)
7. [部署架构](#7-部署架构)
8. [安全设计](#8-安全设计)
9. [性能与可扩展性](#9-性能与可扩展性)
10. [技术亮点](#10-技术亮点)

---

## 1. 系统架构总览

### 1.1 系统全景架构图

```
+------------------------------------------------------------------+
|                        用户端 (Client)                            |
|  +------------------+  +------------------+  +------------------+ |
|  |   Landing Page   |  |   Chat Interface |  |  Blog / Pricing  | |
|  |  (Server Comp.)  |  | (Client Comp.)   |  |  (Server Comp.)  | |
|  +--------+---------+  +--------+---------+  +--------+---------+ |
|           |                     |                     |           |
|           +----------+----------+----------+----------+           |
|                      |                     |                      |
+----------------------+---------------------+----------------------+
                       |                     |
              HTTP/SSE |              REST API |
                       |                     |
+==================================================================+
|                     Next.js 16 App Router                        |
|  +------------------+  +--------------------+  +----------------+ |
|  | Server Components|  | API Route Handlers |  |  Middleware    | |
|  | (RSC Rendering)  |  | (21 endpoints)     |  | (Auth Guard)  | |
|  +------------------+  +--------------------+  +----------------+ |
|                                                                   |
|  +----------------------------------------------------------------+|
|  |                     Core Library Layer                         ||
|  | +----------+ +-----------+ +--------+ +--------+ +-----------+ ||
|  | |supabase/ | |subscription| |usage-  | |sensitive| | creem.ts  | ||
|  | |client.ts | | .ts       | |limits  | |keywords| | (Payment) | ||
|  | |admin.ts  | |           | |.ts     | |.ts     | |           | ||
|  | +----------+ +-----------+ +--------+ +--------+ +-----------+ ||
|  +----------------------------------------------------------------+|
+==================================================================+
          |                |                |              |
    +-----+-----+   +-----+-----+   +-----+-----+  +----+-----+
    | Supabase   |   | Zhipu AI  |   |  Creem    |  |  Resend  |
    | PostgreSQL |   | GLM-4.7   |   | Payment   |  |  Email   |
    | (Auth+DB)  |   | GLM-4-    |   | Platform  |  | Service  |
    |            |   | Flash     |   |           |  |          |
    +-----+------+   +-----+-----+   +-----+-----+  +----+-----+
          |                |                |              |
+==================================================================+
|                        Infrastructure Layer                       |
|  +-------------+  +-------------+  +-----------+  +-----------+   |
|  | Vercel Edge |  | Supabase    |  | Zhipu AI  |  | Google    |   |
|  | Network/CDN |  | Cloud (DB)  |  | Cloud API |  | Analytics |   |
|  +-------------+  +-------------+  +-----------+  +-----------+   |
+==================================================================+
```

### 1.2 分层架构说明

本系统采用经典的三层架构设计，并在此基础上增加了 AI 推理层和支付处理层:

| 层级 | 职责 | 关键技术 |
|------|------|---------|
| **表现层 (Presentation)** | 页面渲染、用户交互、流式响应展示 | Next.js RSC, React 19, Tailwind CSS v4 |
| **业务逻辑层 (Business Logic)** | API 路由处理、认证鉴权、使用量管控 | Next.js Route Handlers, TypeScript |
| **数据持久层 (Data Persistence)** | 用户数据、对话记录、订阅信息存储 | Supabase PostgreSQL + RLS |
| **AI 推理层 (AI Inference)** | 禅修智慧生成、危机检测 | Zhipu AI GLM-4.7/GLM-4-Flash |
| **支付处理层 (Payment)** | 订阅生命周期管理、退款流程 | Creem Payment Platform |

---

## 2. 技术栈选型与理由

### 2.1 核心框架

| 技术 | 版本 | 选型理由 |
|------|------|---------|
| **Next.js** | 16.0.10 | App Router 提供原生 Server Components，减少客户端 JS 体积；Edge Runtime 支持全球低延迟部署；内置 API Routes 简化后端开发 |
| **React** | 19.2.0 | 最新版本支持 Concurrent Features，提升复杂 UI 交互的响应性；Server Components 实现零客户端 JS 的静态页面 |
| **TypeScript** | 5.9.3 | Strict Mode 提供完整的类型安全保障；增强代码可维护性和团队协作效率 |

### 2.2 AI 与大模型

| 技术 | 选型理由 |
|------|---------|
| **Zhipu AI GLM-4.7** | 智谱 AI 旗舰模型，中文理解能力突出；适合禅修、哲学等需要深度语义理解的应用场景；API 价格优势明显 |
| **Zhipu AI GLM-4-Flash** | 轻量级模型，响应延迟 < 500ms；适合免费用户的快速响应需求；成本仅为 GLM-4.7 的 1/10 |
| **Raw Fetch + SSE** | 放弃 Vercel AI SDK，采用原生 `fetch` + `ReadableStream` 实现流式传输；避免 SDK 抽象层带来的性能损耗；完全掌控错误处理和重试逻辑 |

### 2.3 数据库与认证

| 技术 | 选型理由 |
|------|---------|
| **Supabase PostgreSQL** | 开源 PostgreSQL 托管服务，提供 Row Level Security (RLS) 实现数据隔离；内置 Auth 模块支持 Google OAuth + PKCE；Realtime 能力为未来功能预留 |
| **Google OAuth (PKCE)** | 国际化用户首选登录方式；PKCE 流程增强安全性，防止授权码拦截攻击 |

### 2.4 支付系统

| 技术 | 选型理由 |
|------|---------|
| **Creem** | 专为 SaaS 设计的支付平台；支持订阅管理、退款流程、Billing Portal；Webhook 机制实现订阅状态实时同步；HMAC-SHA256 签名验证保障安全性 |

### 2.5 内容与样式

| 技术 | 选型理由 |
|------|---------|
| **MDX + next-mdx-remote** | Markdown 中嵌入 React 组件，实现博客富文本内容；gray-matter 解析 frontmatter 元数据 |
| **Tailwind CSS v4** | 全新 OKLCH 色彩空间，感知均匀性更优；零配置 JIT 编译，生产环境 CSS 体积 < 20KB |
| **shiki + rehype-pretty-code** | 服务端代码高亮，零客户端 JS 开销；支持 200+ 编程语言语法着色 |

---

## 3. 核心模块设计

### 3.1 AI 对话系统

#### 3.1.1 系统架构

```
用户输入
    |
    v
+-------------------+     +------------------+     +------------------+
|  Client (React)   |---->|  API Route       |---->|  Zhipu AI API    |
|  fetch + Readable | SSE |  /api/chat       | SSE |  GLM-4.7/Flash   |
|  Stream           |<----|  TransformStream |<----|  Streaming       |
+-------------------+     +------------------+     +------------------+
                                |
                    +-----------+-----------+
                    |                       |
              +-----+------+          +-----+------+
              | Crisis     |          | Usage      |
              | Detection  |          | Tracking   |
              | (Keywords) |          | (DB Record)|
              +-----+------+          +-----+------+
                    |                       |
              +-----+------+          +-----+------+
              | Professional|          | Rate       |
              | Referral    |          | Limiting   |
              +------------+          +------------+
```

#### 3.1.2 模型选择策略 (Tiered Model Routing)

系统实现了基于用户层级的智能模型路由:

```
if (用户未登录 || free tier) {
    model = "glm-4-flash"     // 轻量模型, 快速响应
    max_tokens = 2048
    daily_limit = 10
} else if (pro tier && premium_quota_remaining > 0) {
    model = "glm-4.7"         // 旗舰模型, 深度理解
    max_tokens = 4096
    daily_limit = 30 (premium)
} else if (pro tier && premium_quota_exhausted) {
    model = "glm-4-flash"     // 公平使用策略降级
    max_tokens = 2048
    daily_limit = unlimited (basic)
}
```

这种设计在保证 Pro 用户获得优质体验的同时，通过动态降级机制控制 AI API 成本。

#### 3.1.3 流式传输实现

客户端采用原生 Web API 实现零依赖的流式响应处理:

```typescript
// Client: 使用 ReadableStream API 逐块读取
const reader = response.body?.getReader()
const decoder = new TextDecoder()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  const text = decoder.decode(value)
  // 逐字追加到消息内容，实现打字机效果
}
```

服务端通过 `TransformStream` 将 Zhipu AI 的 SSE 格式转换为纯文本流:

```typescript
// Server: TransformStream 将 OpenAI SSE 格式转为纯文本
const transformStream = new TransformStream({
  transform(chunk, controller) {
    // 解析 SSE data: 前缀 -> JSON -> 提取 delta.content -> 编码输出
    controller.enqueue(new TextEncoder().encode(content))
  }
})
const transformedStream = response.body?.pipeThrough(transformStream)
```

#### 3.1.4 System Prompt 设计

System Prompt 约 500 tokens，定义了 AI 人格 "空寂" (Emptiness and Stillness):

- **核心教学理念**: 引导用户发现内在智慧，而非给予直接建议
- **语气风格**: 温和、极简、深刻，善用水、云、镜子等禅宗隐喻
- **响应模式**: 承认 (Acknowledge) -> 启发 (Illuminate) -> 引导提问 (Guide) -> 陪伴 (Sit)
- **安全约束**: 检测到自伤倾向时，立即引导至专业心理援助

#### 3.1.5 危机检测系统 (Crisis Detection)

```typescript
// 双语关键词检测 (中文 + 英文共 75+ 关键词)
const SENSITIVE_KEYWORDS = [
  // 中文: 自杀, 想死, 自残, 割腕, 抑郁症, 绝望, 崩溃 ...
  // 英文: suicide, kill myself, self-harm, depressed, hopeless ...
]

function containsSensitiveKeywords(message: string): boolean {
  return SENSITIVE_KEYWORDS.some(kw =>
    message.toLowerCase().includes(kw.toLowerCase())
  )
}
```

检测触发后，系统返回包含多国紧急求助热线 (911/999/112/988) 和专业心理援助资源的信息，拒绝进行 AI 对话。

### 3.2 用户认证系统

#### 3.2.1 认证架构

```
用户
  |
  | 1. 点击 Google 登录
  v
+------------------+
| Google OAuth     |
| Authorization    |
+--------+---------+
         |
         | 2. Authorization Code + PKCE Verifier
         v
+------------------+     +------------------+
| Supabase Auth    |---->| auth.users 表     |
| (Server-Side)    |     | (自动创建 profile)|
+--------+---------+     +------------------+
         |
         | 3. Session Cookie (httpOnly, secure, sameSite)
         v
+------------------+
| Client Cookies   |
| (浏览器自动管理)  |
+------------------+
         |
         | 4. 每次请求自动携带
         v
+------------------+
| API Route        |
| supabase.auth    |
| .getUser()       |
+------------------+
```

#### 3.2.2 Supabase Client 分层设计

系统实现了四个层次的 Supabase Client:

| Client | 权限 | 使用场景 |
|--------|------|---------|
| `server.ts` | 用户级 (RLS) | API Route 中的用户数据操作 |
| `client.ts` | 用户级 (RLS) | Client Component 直接操作 |
| `admin.ts` | 服务级 (Bypass RLS) | 跨用户数据查询、管理后台 |
| `service-role.ts` | 服务级 (Bypass RLS) | Webhook 处理、定时任务 |

```typescript
// admin.ts: 使用 service_role key 绕过 RLS
export function createAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}
```

#### 3.2.3 自动 Profile 创建

通过 PostgreSQL Trigger 实现用户注册后自动创建 profile:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 3.3 订阅支付系统

#### 3.3.1 支付流程

```
用户选择套餐
    |
    v
+-------------------+     +-------------------+     +------------------+
| /api/creem/       |---->| Creem API         |---->| Checkout Page    |
| checkout          |     | POST /v1/checkouts|     | (Creem Hosted)   |
+-------------------+     +-------------------+     +--------+---------+
                                                            |
                                          支付成功 / 取消   |
                                                            v
+-------------------+     +-------------------+     +------------------+
| /api/creem/       |<----| Creem Webhook     |<----| Creem Platform   |
| webhook           |     | (HMAC-SHA256 验证)|     |                  |
+--------+----------+     +-------------------+     +------------------+
         |
         | 处理订阅事件
         +-----> checkout.completed: 创建 subscription 记录
         +-----> subscription.renewed: 更新 current_period_end
         +-----> subscription.cancelled: 标记 cancel_at_period_end
         +-----> subscription.expired: 更新 status = expired
         |
         v
+-------------------+
| Email Notification|
| (Resend)          |
+-------------------+
```

#### 3.3.2 订阅状态机

```
                 checkout.completed
    [none] ------------------------> [active]
                                        |
                         +--------------+--------------+
                         |              |              |
                    cancel()       expire()      refund request
                         |              |              |
                         v              v              v
                   [cancelled]     [expired]    [refund_status=requested]
                         |                             |
                         |                     +-------+-------+
                         |                     |               |
                         |              3-day review    approved/
                         |              period           rejected
                         |                     |               |
                         |              keep Pro       downgrade
                         |              access           to Free
                         v                     v               v
                    [past_due]          [active]        [cancelled]
```

#### 3.3.3 Webhook 签名验证

```typescript
function verifyCreemWebhook(payload: string, signature: string, secret: string): boolean {
  // HMAC-SHA256 签名验证
  const expectedHex = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex')
  // 使用 timingSafeEqual 防止时序攻击
  return crypto.timingSafeEqual(expected, received)
}
```

#### 3.3.4 退款流程 (Staged Downgrade)

系统实现了独特的分阶段降级退款策略:

1. **48 小时内取消 + 使用 <= 5 条消息**: 自动计算按比例退款
2. **48 小时后申请退款**: 进入 3 个工作日审核期
3. **审核期间**: 保持 Pro 权限 (用户不受影响)
4. **审核完成**: 批准则退款并降级；拒绝则仅降级

### 3.4 内容管理系统 (MDX Blog)

```
content/blog/
  ├── *.mdx 文件 (gray-matter 解析 frontmatter)
  |
  v
+-------------------+     +-------------------+     +------------------+
| lib/blog.ts       |---->| Server Component  |---->| next-mdx-remote  |
| (文件系统读取)     |     | (静态生成)        |     | (MDX 渲染)       |
+-------------------+     +-------------------+     +--------+---------+
                                                            |
                                                   rehype-pretty-code
                                                   shiki (语法高亮)
```

支持功能: 分类筛选、标签系统、相关文章推荐、阅读时间估算、特色文章标记、draft 草稿机制。

### 3.5 安全防护系统

#### 3.5.1 多层安全架构

```
Layer 1: 网络层
  +-- Vercel Edge Network (DDoS 防护, WAF)
  +-- HTTPS/TLS 1.3 强制加密
  +-- Secure Cookies (httpOnly, sameSite=Strict)

Layer 2: 认证层
  +-- Google OAuth + PKCE 流程
  +-- Supabase Auth Session 管理
  +-- JWT Token 自动刷新

Layer 3: 数据层
  +-- Row Level Security (RLS) 全表启用
  +-- Service Role Key 隔离
  +-- Admin Secret Key 鉴权

Layer 4: 应用层
  +-- 危机关键词检测 (中英双语)
  +-- 消息长度限制 (10,000 字符/条)
  +-- 使用量速率限制 (基于 tier)
  +-- Webhook 签名验证 (HMAC-SHA256)
```

---

## 4. 数据流

### 4.1 AI 对话完整数据流

```
Step 1: 用户发送消息
  Client: handleSubmit() -> fetch("/api/chat", { messages })

Step 2: 服务端接收请求
  POST /api/chat -> req.json() -> messages 数组

Step 3: 认证检查 (可选)
  supabase.auth.getUser() -> userId (支持匿名访问)

Step 4: 订阅与模型选择
  getUserSubscription(userId) -> { tier, model, apiKey, saveHistory }

Step 5: Fair Use 检查
  isWithinPremiumQuota(userId) -> true/false
  若 false: model 降级为 glm-4-flash, 设置 X-Fair-Use-Notice header

Step 6: 使用量限制检查
  checkUsageLimit(userId) -> { canProceed, limit, remaining }
  若 !canProceed: 返回 429 + 禅意提示消息

Step 7: 消息长度校验
  遍历 messages -> content.length <= MESSAGE_LENGTH_LIMIT (10,000)

Step 8: 记录用户消息使用量
  recordUsage(userId, 'user') -> INSERT usage_records

Step 9: 危机关键词检测
  containsSensitiveKeywords(userMessage) -> true/false
  若 true: 返回专业求助资源 (HTTP 200)

Step 10: 调用 AI API
  fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
    model, messages: [system, ...userMessages], stream: true
  })

Step 11: 流式响应转换
  TransformStream: SSE data -> JSON parse -> delta.content -> 纯文本

Step 12: 记录 AI 响应使用量 (异步)
  recordUsage(userId, 'assistant') -> INSERT usage_records

Step 13: 客户端流式渲染
  ReadableStream.getReader() -> 逐块 decode -> setState 追加内容
```

### 4.2 支付订阅数据流

```
Step 1: 用户选择套餐 (Pro Monthly / Pro Annual)
  Client: 点击订阅按钮

Step 2: 创建 Checkout Session
  POST /api/creem/checkout
  -> createCreemCheckout({ productId, successUrl, metadata: { userId } })
  -> 返回 { checkout_url }

Step 3: 用户在 Creem 托管页面完成支付

Step 4: Creem 发送 Webhook
  POST /api/creem/webhook
  -> verifyCreemWebhook(payload, signature, secret)
  -> 解析事件类型

Step 5: 处理订阅事件
  checkout.completed:
    -> INSERT subscriptions (status: active/queued)
    -> UPDATE profiles (creem_customer_id)
    -> sendWelcomeEmail()

  subscription.renewed:
    -> UPDATE subscriptions (current_period_end)

  subscription.cancelled:
    -> UPDATE subscriptions (status: cancelled, cancel_at_period_end: true)
    -> sendCancellationEmail()

  subscription.expired:
    -> UPDATE subscriptions (status: expired)
    -> sendExpiryReminderEmail()

Step 6: 用户下次请求自动获取 Pro 权限
  getUserSubscription() 查询 active subscription
  -> tier: 'pro', model: 'glm-4.7'
```

### 4.3 用户认证数据流

```
Step 1: 用户点击 Google 登录
  Client: supabase.auth.signInWithOAuth({ provider: 'google' })

Step 2: OAuth 重定向
  -> Google 授权页面
  -> 用户同意授权
  -> 回调携带 authorization code

Step 3: Supabase 交换 Token
  -> POST /api/auth/callback
  -> Supabase Auth Server 交换 code -> access_token + refresh_token
  -> 设置 httpOnly Cookie

Step 4: 数据库自动创建 Profile
  PostgreSQL Trigger: handle_new_user()
  -> INSERT profiles (id, email, full_name, avatar_url)

Step 5: 客户端自动刷新 Session
  Middleware: supabase.auth.getUser() -> 验证 session
  -> 有效: 放行
  -> 无效/过期: 刷新 token 或重定向登录
```

---

## 5. 数据库设计

### 5.1 ER 关系图

```
+------------------+       1:1       +------------------+
|   auth.users     |<----------------|    profiles      |
| (Supabase 内置)  |                 | (用户扩展信息)    |
+------------------+                 +--------+---------+
       | id (PK)                               | id (FK -> auth.users)
       | email                                 | email
       | raw_user_meta_data                    | full_name
                                              | avatar_url
                                              | creem_customer_id
                                              |
                                    +---------+---------+
                                    |                   |
                              1:N   |             1:N   |
                         +----------+-------+ +---------+--------+
                         |  subscriptions   | |  conversations   |
                         |  (订阅记录)       | |  (对话记录)       |
                         +------------------+ +---------+--------+
                         | id (PK)          |           | id (PK)
                         | user_id (FK)     |           | user_id (FK)
                         | creem_sub_id     |           | title
                         | status           |           | created_at
                         | plan             |           | updated_at
                         | current_period   |           |
                         |   _end           |     1:N   |
                         | refund_status    |           |
                         +------------------+           |
                                                         |
                                              +----------+--------+
                                              |    messages       |
                                              |  (消息内容)        |
                                              +-------------------+
                                              | id (PK)           |
                                              | conversation_id   |
                                              | role              |
                                              | content           |
                                              +-------------------+

+------------------+
| usage_records    |
| (使用量追踪)      |
+------------------+
| id (PK)          |
| user_id (FK)     |
| message_type     |
| user_tier        |
| subscription_id  |
| timestamp        |
+------------------+
```

### 5.2 表结构详细说明

#### profiles (用户资料表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK, FK) | 关联 auth.users.id |
| email | TEXT | 用户邮箱 |
| full_name | TEXT | 显示名称 |
| avatar_url | TEXT | 头像 URL |
| creem_customer_id | TEXT | Creem 支付客户 ID |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 (Trigger 自动维护) |

#### subscriptions (订阅表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 订阅记录 ID |
| user_id | UUID (FK) | 关联 profiles.id |
| creem_subscription_id | TEXT | Creem 订阅 ID (唯一) |
| status | TEXT | 状态: active/cancelled/past_due/expired/queued |
| plan | TEXT | 套餐: pro/annual |
| interval | TEXT | 周期: month/year |
| current_period_end | TIMESTAMPTZ | 当前周期结束时间 |
| cancel_at_period_end | BOOLEAN | 是否在周期结束时取消 |
| refund_status | TEXT | 退款状态: none/requested/approved/rejected/processed |
| replaced_by_new_plan | BOOLEAN | 是否被新套餐替换 |

#### messages (消息表)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID (PK) | | 消息 ID |
| conversation_id | UUID (FK) | ON DELETE CASCADE | 所属对话 |
| role | TEXT | CHECK (user/assistant) | 消息角色 |
| content | TEXT | NOT NULL | 消息内容 |

#### usage_records (使用量记录表)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID (PK) | | 记录 ID |
| user_id | UUID (FK) | ON DELETE SET NULL | 用户 ID |
| message_type | TEXT | CHECK (user/assistant) | 消息类型 |
| user_tier | TEXT | CHECK (anonymous/free/pro) | 使用时层级 |
| subscription_id | UUID (FK) | ON DELETE SET NULL | 关联订阅 (用于 plan 切换时计数重置) |
| timestamp | TIMESTAMPTZ | | 使用时间戳 |

### 5.3 RLS 策略

所有业务表均启用 Row Level Security，核心策略:

```sql
-- 用户只能查看自己的 profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

-- 用户只能查看自己对话中的消息 (通过子查询关联)
CREATE POLICY "Users can view messages of own conversations"
  ON messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );
```

关键设计: messages 表的 RLS 不是直接检查 `user_id`，而是通过 `conversations` 表进行间接关联查询，确保用户无法通过直接访问 messages 端点获取其他用户的对话内容。

### 5.4 索引优化

```sql
-- 订阅查询优化: 支持按用户+状态+替换标记+有效期联合查询
CREATE INDEX subscriptions_user_status_replaced_idx
  ON subscriptions(user_id, status, replaced_by_new_plan, current_period_end);

-- 使用量查询优化: 按时间戳倒序 (24 小时滑动窗口)
CREATE INDEX usage_records_timestamp_idx
  ON usage_records(timestamp DESC);

-- 对话列表优化: 按更新时间倒序
CREATE INDEX conversations_updated_at_idx
  ON conversations(updated_at DESC);
```

---

## 6. API 文档

### 6.1 API 端点总览

系统共实现 21 个 API 端点:

| 类别 | 端点 | 方法 | 认证 | 说明 |
|------|------|------|------|------|
| **AI 对话** | `/api/chat` | POST | 可选 | AI 流式对话 (SSE) |
| **对话管理** | `/api/conversations` | GET/POST | 必须 | 对话列表/创建 |
| | `/api/conversations/save` | POST | 必须 | 保存消息到数据库 |
| **订阅支付** | `/api/creem/checkout` | POST | 必须 | 创建支付会话 |
| | `/api/creem/portal` | POST | 必须 | 跳转 Billing Portal |
| | `/api/creem/webhook` | POST | 签名验证 | Creem Webhook 回调 |
| **订阅管理** | `/api/subscription/check` | GET | 必须 | 检查订阅状态 |
| | `/api/subscription/cancel` | POST | 必须 | 取消订阅 |
| **使用量** | `/api/usage/check` | GET | 可选 | 检查使用量限制 |
| | `/api/user/tier` | GET | 可选 | 获取用户层级 |
| | `/api/user/usage-stats` | GET | 必须 | 获取使用量统计 |
| **用户数据** | `/api/user/all-conversations` | GET | 必须 | 所有对话列表 |
| | `/api/user/export-conversations` | POST | 必须 | 导出对话数据 |
| **交互功能** | `/api/message-feedback` | POST/GET | 必须 | 消息反馈 (赞/踩) |
| | `/api/shares` | POST | 可选 | 创建分享卡片 |
| | `/api/shares/[shareId]` | GET | 无 | 获取分享内容 |
| **管理后台** | `/api/admin/refund-review` | POST | Secret Key | 退款审核 |
| **系统** | `/api/auth/webhook` | POST | 签名验证 | 认证 Webhook |
| | `/api/cron/subscription-reminders` | GET | Secret Key | 订阅到期提醒 |
| | `/api/notifications` | GET | 必须 | 用户通知 |

### 6.2 核心 API 详细说明

#### POST /api/chat -- AI 对话

```
Request:
  Headers: { Content-Type: application/json }
  Body: {
    messages: Array<{
      role: "user" | "assistant",
      parts: Array<{ type: "text", text: string }>
    }>
  }

Response (Success):
  Status: 200
  Headers: {
    Content-Type: text/plain; charset=utf-8,
    X-Fair-Use-Notice: <encoded notice>  // 仅在降级时出现
  }
  Body: <Streaming plain text>

Response (Rate Limited):
  Status: 429
  Body: {
    error: "禅意提示消息",
    limit: 10,
    remaining: 0
  }

Response (Crisis Detected):
  Status: 200
  Body: 专业求助资源信息 (纯文本)
```

#### POST /api/creem/webhook -- 支付回调

```
Request:
  Headers: {
    creem-signature: "v1=<hmac-sha256-hex>"
  }
  Body: <Raw JSON payload>

Processing:
  1. verifyCreemWebhook(rawBody, signature, CREEM_WEBHOOK_SECRET)
  2. 解析事件类型 (checkout.completed, subscription.renewed, etc.)
  3. 更新数据库状态
  4. 发送邮件通知

Response:
  Status: 200 (无论处理成功与否，防止 Creem 重试)
```

---

## 7. 部署架构

### 7.1 部署拓扑

```
+------------------------------------------------------------------+
|                        Vercel Platform                           |
|  +--------------------------------------------------------------+ |
|  |                     Edge Network (全球)                       | |
|  |  +--------+  +--------+  +--------+  +--------+  +--------+  | |
|  |  | US East|  | EU West|  | Asia   |  | US West|  | AU     |  | |
|  |  | (CDN)  |  | (CDN)  |  | (CDN)  |  | (CDN)  |  | (CDN)  |  | |
|  |  +--------+  +--------+  +--------+  +--------+  +--------+  | |
|  +--------------------------------------------------------------+ |
|                                                                   |
|  +--------------------------------------------------------------+ |
|  |                     Serverless Functions                      | |
|  |  maxDuration = 60s (Vercel Pro Plan)                         | |
|  |  API Routes: 21 endpoints                                    | |
|  |  Server Components: 自动缓存 + ISR                           | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
         |                    |                    |
         |                    |                    |
+--------+-----+  +----------+-----+  +-----------+------+
| Supabase     |  | Zhipu AI       |  | Creem            |
| Cloud        |  | Cloud API      |  | Payment Platform |
| - PostgreSQL |  | open.bigmodel  |  | api.creem.io     |
| - Auth       |  | .cn            |  |                  |
| - Storage    |  |                |  |                  |
+--------------+  +----------------+  +------------------+
         |
         |                    +------------------+
         +------------------- | Resend Email API |
                              | resend.com       |
                              +------------------+
```

### 7.2 静态资源优化

| 资源类型 | 优化策略 |
|---------|---------|
| 页面 (Landing/Blog) | Server Components 零客户端 JS |
| 字体 (Inter/Crimson) | Google Fonts, next/font 自动优化 |
| 图片 | next/image 自动 WebP/AVIF 转换 |
| CSS | Tailwind JIT, OKLCH 色彩空间 |
| 代码高亮 | shiki 服务端渲染, 零运行时 |

### 7.3 环境变量管理

系统依赖以下关键环境变量 (通过 Vercel Environment Variables 管理):

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名 Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务端 Key (Bypass RLS) |
| `ZHIPU_API_KEY` | GLM-4.7 Pro 模型 API Key |
| `ZHIPU_API_FREE` | GLM-4-Flash 免费模型 API Key |
| `CREEM_API_KEY` | Creem 支付 API Key |
| `CREEM_WEBHOOK_SECRET` | Webhook 签名密钥 |
| `RESEND_API_KEY` | 邮件服务 API Key |
| `NEXT_PUBLIC_SITE_URL` | 站点域名 |

---

## 8. 安全设计

### 8.1 威胁模型与缓解策略

| 威胁 | 影响 | 缓解措施 |
|------|------|---------|
| **SQL 注入** | 数据泄露 | Supabase 参数化查询 + RLS |
| **XSS 攻击** | Session 劫持 | React 自动转义 + CSP Headers |
| **CSRF 攻击** | 未授权操作 | SameSite Cookie + OAuth PKCE |
| **数据越权** | 用户数据泄露 | Row Level Security 全表启用 |
| **Webhook 伪造** | 订阅状态篡改 | HMAC-SHA256 签名验证 + timingSafeEqual |
| **时序攻击** | 签名密钥泄露 | crypto.timingSafeEqual() 常量时间比较 |
| **暴力破解** | API 滥用 | 消息长度限制 (10,000 字符) + 每日使用量限制 |
| **DDoS 攻击** | 服务不可用 | Vercel Edge Network 自动防护 |
| **敏感信息泄露** | 用户隐私 | API Key 环境变量隔离; Admin/Service Role Key 不暴露到客户端 |
| **心理危机** | 用户安全风险 | 双语关键词检测 + 专业求助引导 |

### 8.2 数据隔离机制

```
用户 A 的数据访问路径:
  Request (auth.uid() = A)
    -> Supabase Auth 验证 JWT
    -> RLS Policy: WHERE user_id = auth.uid()
    -> 仅返回用户 A 的数据

管理员的数据访问路径:
  Request (Admin Secret Key)
    -> Secret Key 验证
    -> createAdminClient() (Service Role Key)
    -> 绕过 RLS, 访问全量数据
```

### 8.3 API Key 安全隔离

系统实现了双 API Key 架构，将免费用户和付费用户的 AI 调用物理隔离:

```
Free/Anonymous: ZHIPU_API_FREE (glm-4-flash, 低成本)
Pro:             ZHIPU_API_KEY   (glm-4.7, 高性能)
```

这确保了免费用户的突发流量不会消耗 Pro 用户的 API 配额，同时也为成本监控提供了清晰的分账维度。

---

## 9. 性能与可扩展性

### 9.1 当前性能指标

| 指标 | 目标值 | 实现方式 |
|------|--------|---------|
| **首屏加载 (LCP)** | < 1.5s | Server Components + Vercel Edge CDN |
| **AI 首字延迟 (TTFT)** | < 1.0s | GLM-4-Flash: ~500ms; GLM-4.7: ~800ms |
| **流式传输吞吐** | > 50 tokens/s | ReadableStream + TransformStream |
| **API 响应时间** | < 200ms | Supabase Connection Pooling + 索引优化 |
| **Lighthouse 评分** | > 90 | 零客户端 JS 静态页面 + 图片优化 |

### 9.2 使用量管控 (Fair Use Policy)

```
+------------------+------------+------------+------------------+
| 用户层级          | 每日消息数  | AI 模型     | 超限处理          |
+------------------+------------+------------+------------------+
| Anonymous        | 10         | glm-4-flash| 拒绝, 引导登录    |
| Free             | 10         | glm-4-flash| 拒绝, 引导升级    |
| Pro (premium)    | 30         | glm-4.7    | 降级为 glm-4-flash|
| Pro (basic)      | 无限       | glm-4-flash| 不限制            |
+------------------+------------+------------+------------------+
```

### 9.3 可扩展性考虑

| 维度 | 当前方案 | 扩展方向 |
|------|---------|---------|
| **AI 模型** | Zhipu AI 单一供应商 | 多模型路由 (OpenAI, Anthropic) |
| **数据库** | Supabase 单实例 | Read Replica + Connection Pooling |
| **缓存** | Next.js 内置缓存 | Redis 缓存热门对话 + 用户 Session |
| **消息队列** | 同步处理 | Webhook 异步队列 (Upstash/SQS) |
| **搜索** | 无 | 向量数据库 (Pinecone) 实现对话语义搜索 |
| **国际化** | 英文为主 | next-intl 多语言支持 |

---

## 10. 技术亮点

### 10.1 零 SDK 依赖的流式 AI 对话

放弃 Vercel AI SDK (`ai` v6.0.7 虽已安装但未使用)，采用原生 `fetch` + `ReadableStream` + `TransformStream` 实现完整的 SSE 流式对话。这种设计:

- 消除 SDK 版本升级带来的破坏性变更风险
- 完全掌控错误处理、超时控制和重试逻辑
- 减少 bundle 体积，降低冷启动时间
- 实现 `TransformStream` 将 OpenAI SSE 格式实时转换为纯文本流

### 10.2 分层 AI 模型路由与动态降级

基于用户订阅状态和实时使用量，实现三级模型路由策略:

1. **免费层**: 始终使用 `glm-4-flash`，快速响应
2. **Pro 高级配额**: 前 30 条消息使用 `glm-4.7`，获得深度禅修指导
3. **Pro 基础配额**: 超出 30 条后自动降级为 `glm-4-flash`，无限制继续使用

通过 HTTP 响应头 `X-Fair-Use-Notice` 实时通知客户端模型切换，前端同步更新 UI 状态。

### 10.3 基于 Subscription ID 的使用量隔离

使用量记录同时绑定 `user_tier` 和 `subscription_id`，解决了订阅切换场景下的计数问题:

- 从 Free 升级到 Pro: 计数器自动重置
- 从 Monthly 切换到 Annual: 新订阅独立计数
- 退款降级后重新订阅: 旧订阅使用量不影响新订阅

### 10.4 双语危机检测与安全响应

系统内置 75+ 中英文关键词的实时扫描引擎，覆盖自伤、自杀、重度抑郁等高危场景。检测触发后:

- 立即中断 AI 对话
- 返回包含多国紧急热线 (911/999/112/988) 的专业求助信息
- 不记录为正常 AI 响应，避免训练数据污染

### 10.5 完整的订阅生命周期管理

实现了 SaaS 产品级的订阅管理系统:

- **Checkout**: Creem 托管支付页面
- **Webhook**: HMAC-SHA256 签名验证，7 种事件类型处理
- **Plan Change**: 支持 Monthly <-> Annual 平滑切换，旧订阅标记为 `replaced_by_new_plan`
- **Queued Subscription**: 新订阅在旧周期结束后自动激活
- **Staged Refund**: 3 天审核期内保持 Pro 权限
- **Email**: 5 种事务性邮件模板 (Welcome/Cancel/Expiry/Queued/Refund)
- **Cron Job**: 定时扫描即将到期的订阅并发送提醒邮件

### 10.6 PostgreSQL RLS 实现细粒度数据隔离

所有 5 张业务表均启用 Row Level Security，通过 PostgreSQL 原生机制实现:

- 用户只能访问自己的 profile、对话、消息
- messages 表通过子查询关联 conversations 表，实现二级权限校验
- API 层通过 admin client (Service Role Key) 在必要时绕过 RLS
- Trigger 自动维护 `updated_at` 字段和用户注册后自动创建 profile

### 10.7 Server Components + Client Components 混合渲染

充分利用 Next.js 16 App Router 的混合渲染能力:

- **Landing Page / Blog / Pricing**: 纯 Server Components，零客户端 JS
- **Chat Interface**: Client Component，管理复杂交互状态 (1365 行)
- **Dashboard**: Server Components 获取数据 + Client Components 处理交互

---

## 附录: 项目文件结构

```
aibudda/
├── app/
│   ├── api/                    # 21 个 API 端点
│   │   ├── chat/route.ts       # AI 对话 (流式 SSE)
│   │   ├── conversations/      # 对话 CRUD
│   │   ├── creem/              # 支付集成
│   │   │   ├── checkout/       # 创建支付会话
│   │   │   ├── portal/         # Billing Portal
│   │   │   └── webhook/        # Webhook 回调
│   │   ├── subscription/       # 订阅管理
│   │   ├── usage/              # 使用量检查
│   │   ├── user/               # 用户相关
│   │   ├── admin/              # 管理后台
│   │   ├── shares/             # 分享功能
│   │   ├── message-feedback/   # 消息反馈
│   │   ├── auth/webhook/       # 认证回调
│   │   └── cron/               # 定时任务
│   ├── chat/                   # 聊天页面
│   ├── blog/                   # 博客系统
│   ├── dashboard/              # 用户仪表盘
│   ├── pricing/                # 定价页面
│   ├── page.tsx                # 首页
│   └── layout.tsx              # 根布局
├── components/
│   ├── chat-interface.tsx      # 核心聊天组件 (~1365 行)
│   ├── share-card.tsx          # 分享卡片
│   ├── message-actions.tsx     # 消息操作
│   └── ui/                     # 50+ Radix UI 基础组件
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # 客户端 Supabase
│   │   ├── server.ts           # 服务端 Supabase (RLS)
│   │   ├── admin.ts            # 管理端 Supabase (Bypass RLS)
│   │   └── service-role.ts     # Service Role 客户端
│   ├── subscription.ts         # 订阅逻辑 (分层查询)
│   ├── usage-limits.ts         # 使用量管控 (Fair Use)
│   ├── sensitive-keywords.ts   # 危机检测 (中英双语)
│   ├── creem.ts                # 支付集成 (server-only)
│   ├── email.ts                # 5 种邮件模板
│   ├── blog.ts                 # MDX 博客系统
│   └── utils.ts                # 工具函数
├── supabase/
│   └── schema.sql              # 完整数据库 Schema
├── content/blog/               # MDX 博客文章
├── package.json                # 依赖管理 (pnpm)
├── next.config.mjs             # Next.js 配置
├── tailwind.config.ts          # Tailwind CSS v4 配置
└── tsconfig.json               # TypeScript 严格模式配置
```

---

> 本文档由项目团队编写，用于 2026 International AI OPC Entrepreneurship Competition 技术评审。
>
> 项目地址: https://ask.zeninsight.xyz
