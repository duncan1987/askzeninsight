# PRD：共学打卡社区模块

## Goal

在中文环境下，用数据库驱动的共学打卡社区系统 **完全替代** 现有硬编码的冥想课程模块（`/meditation`）。管理员通过统一后台管理课程、评论、用户等，学员打卡解锁全文并评论互动。热门课程可一键发布为博客（面向所有用户含 en），课程内容作为知识库融入聊天 AI 回答。仅 zh locale 可见共学功能，en locale 不受影响。

## Scope / Non-goals

### In Scope
- 新建 `/study` 路由替代 `/meditation`（zh-only，en 不可见）
- 课程列表页（卡片式，打卡状态标识）
- 课程详情页（截断预览 → 打卡解锁全文 → 评论区）
- **管理员统一后台** `/admin`（侧边栏导航，整合所有管理功能）
- 管理员课程管理（Tiptap 富文本编辑器 + 截断线插件）
- 管理员评论审核（删除违规评论）
- 管理员打卡数据统计（学员×课程二维表）
- 管理员用户审核（整合现有 `/admin/users`）
- 管理员退款审核（整合现有 `/admin/refunds`）
- **课程发布为博客**（管理员一键将热门课程转为博客文章，添加配图，面向全量用户）
- **课程内容融入聊天**（AI 回答时优先引用课程内容，附课程链接作为引文注解）
- Dashboard 新增打卡日历组件
- 数据库迁移（新增表 + 博客表）
- i18n 扩展（study + admin namespace）
- 头部导航"课程"链接改为 `/study`

### Non-goals
- en locale 共学打卡功能（完全不可见）
- 课程分类/标签系统（后续迭代）
- 课程付费/订阅（全部免费）
- 评论点赞/回复（后续迭代）
- 移动端专属 UI（当前 H5 响应式即可）
- 保留旧冥想课程 i18n 内容
- 博客评论区（博客无评论，仅课程有评论）
- AI 自动生成课程摘要（手动操作）

---

## ⚠️ en 用户不受影响保证

| 保障层 | 说明 |
|--------|------|
| 路由守卫 | `/study` 页面检测 `locale !== 'zh'` 时重定向到首页 |
| Header 导航 | zh locale 显示「课程→/study」，en locale 不显示该链接 |
| API 鉴权 | 管理员 API 用 `x-admin-key`，学员 API 用 Supabase session，无交叉 |
| 数据库隔离 | 新表独立，不修改 profiles/subscriptions 等现有表 |
| 博客面向全量 | 博客是公开内容，zh 和 en 用户均可查看，不涉及打卡机制 |
| 聊天无差别 | AI 引用课程时仅增加引文注解，不改变对话逻辑和额度体系 |

---

## 核心业务流程

```
=== 学员流程 ===
学员访问 /study → 课程列表（卡片）
  → 点击课程 → 课程详情页
    → 未打卡：显示截断内容 + 遮罩 +「打卡解锁全文」按钮
      → 未登录：跳转登录页 → 登录后返回该课程
      → 已登录：打卡成功 → 遮罩消失 → 完整内容 + 评论区 + 吸底评论框
    → 已打卡：直接显示完整内容 + 评论区

=== 管理员流程 ===
管理员访问 /admin → 统一后台首页（概览统计）
  → 侧边栏导航：
    ├─ 用户审核     （原 /admin/users 整合）
    ├─ 退款审核     （原 /admin/refunds 整合）
    ├─ 课程管理     （列表 + 新建/编辑 + Tiptap 编辑器 + 截断线）
    ├─ 评论审核     （按课程筛选 + 删除）
    ├─ 打卡统计     （学员×课程二维表）
    └─ 博客管理     （课程→博客发布 + 配图）

=== 课程→博客发布流程 ===
管理员在课程列表 → 点击「发布为博客」
  → 进入博客编辑器（预填课程标题+内容HTML）
  → 添加配图（URL 输入或上传）
  → 设置博客分类/标签/描述
  → 发布 → 博客出现在 /blog 列表，所有用户可见

=== 聊天引用课程流程 ===
用户在 /chat 发送消息
  → Chat API 收到请求
  → 提取用户消息关键词
  → 搜索 study_courses 中已发布课程，匹配相关内容
  → 将匹配的课程内容摘要注入 system prompt
  → AI 生成回答时引用课程内容
  → 回复末尾附引文注解：📌 相关课程：《课程标题》/study/xxx
```

---

## Design

### 1. 路由结构

#### 学员端

| 路由 | 类型 | 说明 |
|------|------|------|
| `/study` | 学员页 | 课程列表（zh-only） |
| `/study/[courseId]` | 学员页 | 课程详情+打卡+评论（zh-only） |

#### 管理员端（统一后台）

| 路由 | 类型 | 说明 |
|------|------|------|
| `/admin` | 管理员页 | 后台首页（概览统计仪表盘） |
| `/admin/users` | 管理员页 | 用户审核（现有，整合进侧边栏） |
| `/admin/refunds` | 管理员页 | 退款审核（现有，整合进侧边栏） |
| `/admin/study/courses` | 管理员页 | 课程列表管理 |
| `/admin/study/courses/new` | 管理员页 | 新建课程（Tiptap 编辑器） |
| `/admin/study/courses/[courseId]/edit` | 管理员页 | 编辑课程 |
| `/admin/study/comments` | 管理员页 | 评论审核 |
| `/admin/study/checkins` | 管理员页 | 打卡统计 |
| `/admin/blog/new` | 管理员页 | 新建博客（可从课程预填） |
| `/admin/blog` | 管理员页 | 博客列表管理 |

旧路由处理：
- `/meditation` 及 `/meditation/level-1` → 301 重定向到 `/study`

### 2. 管理员统一后台设计

所有管理员页面共享统一的布局框架，通过侧边栏导航切换功能模块。

```
┌──────────┬──────────────────────────────────────────┐
│          │ 管理后台                                  │
│ 🔧 管理  │──────────────────────────────────────────│
│          │ 概览统计卡片                               │
│ ├ 👥 用户│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│ ├ 💰 退款│ │待审核 │ │待退款│ │课程数│ │评论数│     │
│ ├ 📚 课程│ │  3   │ │  2  │ │  12  │ │  45  │     │
│ ├ 💬 评论│ └──────┘ └──────┘ └──────┘ └──────┘     │
│ ├ 📊 打卡│                                          │
│ └ 📝 博客│ 最近活动...                               │
│          │                                          │
│ ─────── │                                          │
│ 🚪 退出  │                                          │
└──────────┴──────────────────────────────────────────┘
```

- **布局组件**：`app/admin/layout.tsx` — 共享侧边栏 + 顶栏 + 内容区
- **侧边栏菜单项**：
  - 🏠 概览（`/admin`）
  - 👥 用户审核（`/admin/users`）— 现有功能
  - 💰 退款审核（`/admin/refunds`）— 现有功能
  - 📚 课程管理（`/admin/study/courses`）
  - 💬 评论审核（`/admin/study/comments`）
  - 📊 打卡统计（`/admin/study/checkins`）
  - 📝 博客管理（`/admin/blog`）
  - 🚪 退出登录
- **鉴权**：所有管理员页面共用 `x-admin-key` 验证，在 layout 层统一检查
- **现有页面整合**：`/admin/users` 和 `/admin/refunds` 保持独立路由，但纳入统一布局

### 3. 数据库设计

**迁移文件**: `supabase/migrations/20260902_study_module.sql`

```sql
-- 启用 pgvector 扩展（RAG 用）
CREATE EXTENSION IF NOT EXISTS vector;

-- 课程表
CREATE TABLE study_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content_html TEXT NOT NULL,           -- Tiptap 输出的完整 HTML
  truncation_index INTEGER,             -- 截断线在 HTML 中的字符位置（null=无截断）
  is_published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  title_embedding vector(1024),         -- 标题向量（RAG 快速匹配）
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 课程内容分块表（RAG 检索用）
CREATE TABLE study_course_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES study_courses(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,                -- 分块纯文本（约 500 字/块）
  embedding vector(1024),              -- Zhipu embedding-3 向量
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 打卡记录表
CREATE TABLE study_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES study_courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)            -- 每人每课仅一条打卡
);

-- 评论表
CREATE TABLE study_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES study_courses(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK(char_length(content) <= 1000 AND char_length(content) > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ                -- 软删除
);

-- 博客文章表（管理员从课程发布或独立创建）
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,             -- URL 友好标识
  description TEXT DEFAULT '',
  content_html TEXT NOT NULL,            -- Tiptap 输出 HTML
  cover_image TEXT,                      -- 封面图 URL
  cover_image_alt TEXT DEFAULT '',
  category TEXT DEFAULT 'meditation',    -- meditation/zen-philosophy/mindfulness/spiritual-growth/practice-guide
  tags TEXT[] DEFAULT '{}',
  author TEXT DEFAULT 'koji',
  is_published BOOLEAN DEFAULT false,
  source_course_id UUID REFERENCES study_courses(id), -- 来源课程（可选）
  locale TEXT DEFAULT 'zh',              -- zh/en/both
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX idx_study_checkins_user ON study_checkins(user_id);
CREATE INDEX idx_study_checkins_course ON study_checkins(course_id);
CREATE INDEX idx_study_comments_course ON study_comments(course_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_study_comments_user ON study_comments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_study_courses_published ON study_courses(is_published, sort_order);
CREATE INDEX idx_study_course_chunks_course ON study_course_chunks(course_id);
CREATE INDEX idx_course_chunks_embedding ON study_course_chunks 
  USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_course_title_embedding ON study_courses
  USING hnsw (title_embedding vector_cosine_ops);
CREATE INDEX idx_blog_posts_published ON blog_posts(is_published, published_at DESC) WHERE is_published = true;
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_category ON blog_posts(category) WHERE is_published = true;

-- RLS 策略
ALTER TABLE study_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_course_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published courses are viewable by all"
  ON study_courses FOR SELECT USING (is_published = true);

CREATE POLICY "Users can view own checkins"
  ON study_checkins FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own checkins"
  ON study_checkins FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Active comments are viewable by all"
  ON study_comments FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Users can create comments"
  ON study_comments FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Course chunks viewable by all"
  ON study_course_chunks FOR SELECT
  USING (EXISTS (SELECT 1 FROM study_courses WHERE study_courses.id = study_course_chunks.course_id AND is_published = true));

CREATE POLICY "Published blogs are viewable by all"
  ON blog_posts FOR SELECT USING (is_published = true);

-- RAG 匹配函数
CREATE OR REPLACE FUNCTION match_study_course_chunks(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  course_id UUID,
  chunk_index INTEGER,
  content TEXT,
  similarity FLOAT,
  course_title TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.course_id,
    sc.chunk_index,
    sc.content,
    1 - (sc.embedding <=> query_embedding) AS similarity,
    stu.title AS course_title
  FROM study_course_chunks sc
  JOIN study_courses stu ON stu.id = sc.course_id
  WHERE stu.is_published = true
    AND 1 - (sc.embedding <=> query_embedding) > match_threshold
  ORDER BY sc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 4. 课程→博客发布

#### 业务规则
- 博客面向 **所有用户**（zh 注册用户 + en Google 用户），不涉及打卡机制
- 管理员可从课程一键预填内容，也可独立创建博客
- 博客与课程是独立内容，发布博客后修改课程不影响博客
- 博客支持封面配图
- 博客分类沿用现有：meditation / zen-philosophy / mindfulness / spiritual-growth / practice-guide

#### 发布流程
```
课程列表 → 点击「发布为博客」→ /admin/blog/new?fromCourseId=xxx
  → 预填：标题（课程标题）、内容（课程完整HTML，去掉截断线）
  → 管理员补充：封面图、描述、分类、标签
  → 修改编辑内容（可添加配图、调整排版）
  → 设置 slug
  → 点击发布 → blog_posts 表新增记录
  → 博客出现在 /blog 列表
```

#### 博客展示整合
- `/blog` 列表页：合并显示 MDX 文件博客 + `blog_posts` 数据库博客
- `/blog/[slug]` 详情页：优先查 MDX 文件，未找到则查 `blog_posts` 表
- 数据库博客用 `dangerouslySetInnerHTML` 渲染 HTML
- 博客卡片样式统一，来源不同但展示一致

### 5. 课程内容融入聊天（RAG 方案）

#### 技术方案

使用 **RAG（Retrieval-Augmented Generation）** 实现课程内容的语义检索与注入，替代简单关键词匹配：

```
课程发布 → 内容分块 → Zhipu Embedding API → 向量存入 Supabase pgvector
                                                          ↓
用户消息 → Embedding 向量化 → pgvector 余弦相似度检索 → Top-K 课程片段 → 注入 system prompt → AI 回答 → 引文注解
```

#### 数据库：向量存储

在 `study_courses` 表增加向量列，并创建课程内容分块表：

```sql
-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 在 study_courses 表增加向量列（课程标题向量，用于快速匹配）
ALTER TABLE study_courses ADD COLUMN title_embedding vector(1024);

-- 课程内容分块表（RAG 检索用）
CREATE TABLE study_course_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES study_courses(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,            -- 分块序号
  content TEXT NOT NULL,                    -- 分块纯文本内容（约 500 字/块）
  embedding vector(1024),                  -- Zhipu embedding-3 向量
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 向量相似度索引（HNSW，查询速度快）
CREATE INDEX idx_course_chunks_embedding ON study_course_chunks 
  USING hnsw (embedding vector_cosine_ops);

-- 课程标题向量索引
CREATE INDEX idx_course_title_embedding ON study_courses
  USING hnsw (title_embedding vector_cosine_ops);

-- RLS
ALTER TABLE study_course_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Course chunks viewable by all"
  ON study_course_chunks FOR SELECT
  USING (EXISTS (SELECT 1 FROM study_courses WHERE study_courses.id = study_course_chunks.course_id AND is_published = true));
```

#### Embedding 生成流程

```
课程发布/更新 → 提取纯文本（去 HTML 标签）→ 按 500 字分块（段落边界切分）
  → 每块调用 Zhipu Embedding API（embedding-3 模型，1024 维）
  → 存入 study_course_chunks（content + embedding）
  → 课程标题单独生成 embedding → 存入 study_courses.title_embedding
```

- **Embedding API**：`https://open.bigmodel.cn/api/paas/v4/embeddings`
- **模型**：`embedding-3`（1024 维，支持中文）
- **API Key**：复用 `ZHIPU_API_KEY`（付费）或 `ZHIPU_API_FREE`
- **分块策略**：按段落边界切分，每块 300-500 字，块间重叠 50 字

#### 聊天检索流程

```typescript
async function searchRelevantCourses(userMessage: string, locale: string): Promise<CourseReference[]> {
  // 1. 将用户消息向量化
  const queryEmbedding = await getEmbedding(userMessage)
  
  // 2. 在 study_course_chunks 中余弦相似度检索 Top-K
  const { data } = await supabase.rpc('match_study_course_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,    // 相似度阈值，低于此不返回
    match_count: 3,          // 最多返回 3 个分块
  })
  
  // 3. 去重（同一课程多个分块只取最佳匹配）
  // 4. 返回课程引用
}
```

Supabase RPC 函数：

```sql
CREATE OR REPLACE FUNCTION match_study_course_chunks(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  course_id UUID,
  chunk_index INTEGER,
  content TEXT,
  similarity FLOAT,
  course_title TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.course_id,
    sc.chunk_index,
    sc.content,
    1 - (sc.embedding <=> query_embedding) AS similarity,
    stu.title AS course_title
  FROM study_course_chunks sc
  JOIN study_courses stu ON stu.id = sc.course_id
  WHERE stu.is_published = true
    AND 1 - (sc.embedding <=> query_embedding) > match_threshold
  ORDER BY sc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

#### 内容注入与引文注解

1. **内容注入**：将匹配课程片段注入 system prompt 末尾：
   ```
   ## 相关课程参考
   
   以下课程内容与用户问题高度相关，请优先参考并在回答中自然引用：
   
   ### 《课程标题》
   相关内容片段...
   
   引用格式：在回答末尾附注 📌 相关课程：《标题》链接
   ```
2. **引文注解格式**：
   - zh: `📌 相关课程：《正念呼吸基础》→ /study/xxx`
   - en: `📌 Related course: "Mindfulness Breathing Basics" → /study/xxx`
3. **限制**：
   - 最多引用 2 篇课程（去重后）
   - 注入内容不超过 1000 字
   - 相似度阈值 0.7（低于此不注入，避免无关引用）
   - 仅引用已发布课程

#### API 修改

```typescript
// lib/course-search.ts
export async function searchRelevantCourses(userMessage: string, locale: string): Promise<CourseReference[]>
export async function getEmbedding(text: string): Promise<number[]>
export async function generateCourseEmbeddings(courseId: string, contentHtml: string, title: string): Promise<void>

interface CourseReference {
  id: string
  title: string
  excerpt: string  // 匹配的分块内容
  similarity: number
}
```

在 `app/api/chat/route.ts` 中，构造 `openaiMessages` 后、调用 Zhipu API 前：

```typescript
const courseRefs = await searchRelevantCourses(lastUserMessage, locale)
let systemPrompt = getSystemPrompt(locale)
if (courseRefs.length > 0) {
  systemPrompt += buildCourseContext(courseRefs, locale)
}
```

#### 课程发布时自动生成 Embedding

在 `/api/admin/study/courses/[courseId]` PUT 和 POST 发布逻辑中：

```typescript
// 课程发布时自动生成 embedding
if (is_published) {
  await generateCourseEmbeddings(courseId, contentHtml, title)
}
```

### 6. API 设计

#### 学员端 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/study/courses` | GET | 课程列表（已发布，含当前用户打卡状态） |
| `/api/study/courses/[courseId]` | GET | 课程详情（含打卡状态+评论列表） |
| `/api/study/checkin` | POST | 打卡 `{ courseId }` |
| `/api/study/checkins` | GET | 当前用户打卡记录（日历用，支持 ?month= 参数） |
| `/api/study/comments` | POST | 发表评论 `{ courseId, content }` |

**注**：课程搜索不再需要独立 API 路由，RAG 检索通过 Supabase RPC `match_study_course_chunks` 直接在 `app/api/chat/route.ts` 中调用。

#### 管理员 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/admin/study/courses` | GET | 所有课程列表（含未发布+评论数+打卡数） |
| `/api/admin/study/courses` | POST | 创建课程 |
| `/api/admin/study/courses/[courseId]` | GET | 课程详情（含全文） |
| `/api/admin/study/courses/[courseId]` | PUT | 更新课程 |
| `/api/admin/study/courses/[courseId]` | DELETE | 删除课程 |
| `/api/admin/study/courses/[courseId]/publish` | POST | 发布课程（设置 is_published + published_at） |
| `/api/admin/study/comments` | GET | 评论列表（支持 ?courseId=&date= 筛选） |
| `/api/admin/study/comments/[commentId]` | DELETE | 删除评论（软删除） |
| `/api/admin/study/checkins` | GET | 打卡统计（二维数据） |
| `/api/admin/blog/posts` | GET | 博客列表 |
| `/api/admin/blog/posts` | POST | 创建博客（支持 ?fromCourseId= 预填） |
| `/api/admin/blog/posts/[postId]` | GET | 博客详情 |
| `/api/admin/blog/posts/[postId]` | PUT | 更新博客 |
| `/api/admin/blog/posts/[postId]` | DELETE | 删除博客 |
| `/api/admin/blog/posts/[postId]/publish` | POST | 发布博客 |
| `/api/admin/stats` | GET | 后台概览统计 |

所有管理员 API 使用 `x-admin-key` header 鉴权，与现有 `/api/admin/user-review` 一致。

#### 博客公开 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/blog/posts` | GET | 数据库博客列表（公开，分页） |
| `/api/blog/posts/[slug]` | GET | 数据库博客详情（公开） |

**注**：课程语义搜索通过 Supabase RPC `match_study_course_chunks` 在 chat route 中直接调用，无需独立 API。

### 7. 页面设计

#### 7.1 课程列表页 `/study`

```
┌──────────────────────────────┐
│ Header（课程导航高亮）         │
├──────────────────────────────┤
│ 页面标题：共学社区             │
│ 副标题：打卡解锁，共修共进     │
├──────────────────────────────┤
│ ┌─────────────────────────┐  │
│ │ 01  第一课：如何拆解需求  │  │
│ │     2026-09-01           │  │
│ │            [去打卡解锁]   │  │
│ └─────────────────────────┘  │
│ ┌─────────────────────────┐  │
│ │ 02  第二课：正念呼吸      │  │
│ │     2026-09-03           │  │
│ │            [已解锁 ✓]     │  │
│ └─────────────────────────┘  │
├──────────────────────────────┤
│ Footer                       │
└──────────────────────────────┘
```

- 每张卡片：左侧序号，右侧标题+发布时间，右侧打卡状态标签
- 未打卡：「去打卡解锁」（amber 按钮）
- 已打卡：「已解锁 ✓」（绿色标签）
- locale 守卫：`locale !== 'zh'` → 重定向首页

#### 7.2 课程详情页 `/study/[courseId]`

**状态 A — 未打卡：**
```
┌──────────────────────────────┐
│ ← 返回课程列表               │
│ 课程标题                      │
│ 发布时间                      │
├──────────────────────────────┤
│ 前 N 字内容（截断线以上）      │
│ ...                          │
│ █████ 渐变遮罩 █████         │
│   [ 📌 打卡解锁完整内容 ]     │
└──────────────────────────────┘
```

**状态 B — 已打卡解锁：**
```
┌──────────────────────────────┐
│ ← 返回课程列表               │
│ 课程标题                      │
│ 发布时间                      │
├──────────────────────────────┤
│ 完整课程内容（截断线上下全部） │
│ ...                          │
│ ...                          │
├──────────────────────────────┤
│ 全部评论 (X 条)               │
│ ┌─────────────────────────┐  │
│ │ 👤 昵称  2026-09-01      │  │
│ │ 评论内容文字...           │  │
│ └─────────────────────────┘  │
├──────────────────────────────┤
│ ┌─────────────┐ [发表]      │  ← 吸底评论框
│ │ 发表心得...   │            │
│ └─────────────┘            │
└──────────────────────────────┘
```

- 截断逻辑：后端返回 `truncation_index`，前端按字符位置截断 HTML
- 渐变遮罩：`bg-gradient-to-b from-transparent to-white` + 居中按钮
- 吸底评论框：`sticky bottom-0`，1000 字限制，实时字数提示
- 评论头像：取 `profiles.avatar_url`，无头像用默认占位

#### 7.3 管理员统一后台 `/admin`

**侧边栏布局（所有管理员页面共享）：**
```
┌──────────┬──────────────────────────────────────────┐
│          │ 页面标题                                  │
│ 🔧 管理  │──────────────────────────────────────────│
│          │                                          │
│ 🏠 概览  │ [当前页面内容区]                           │
│ 👥 用户  │                                          │
│ 💰 退款  │                                          │
│ 📚 课程  │                                          │
│ 💬 评论  │                                          │
│ 📊 打卡  │                                          │
│ 📝 博客  │                                          │
│          │                                          │
│ ─────── │                                          │
│ 🚪 退出  │                                          │
└──────────┴──────────────────────────────────────────┘
```

**概览页 `/admin`：**
```
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│待审核│ │待退款│ │课程数│ │评论数│
│  3   │ │  2  │ │  12  │ │  45  │
└──────┘ └──────┘ └──────┘ └──────┘

最近动态：
• 用户 张三 提交注册申请 - 2分钟前
• 课程《正念呼吸》新增 5 条评论 - 10分钟前
• ...
```

#### 7.4 管理员课程管理 `/admin/study/courses`

课程列表，每行显示：
- 标题 | 状态（草稿/已发布） | 打卡数 | 评论数 | 操作（编辑/删除/发布为博客）

「发布为博客」按钮：跳转 `/admin/blog/new?fromCourseId=xxx`

#### 7.5 管理员课程编辑器 `/admin/study/courses/new`

```
┌──────────────────────────────────────────┐
│ ← 返回课程列表          [保存草稿] [发布] │
├──────────────────────────────────────────┤
│ 课程标题：[________________]             │
├──────────────────────────────────────────┤
│ ┌─ Tiptap 工具栏 ─────────────────────┐ │
│ │ B I U | H1 H2 | UL OL | 📷图片 | ✂截断线│ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 在此处编辑课程内容...                     │
│                                         │
│ ──── ✂ 截断线 ────                      │
│                                         │
│ 截断线以下内容需打卡后可见...              │
│                                         │
└──────────────────────────────────────────┘
```

- 编辑器：**Tiptap** + 自定义 TruncationLine 扩展 + Image 扩展
- 截断线：渲染为虚线 + "✂ 截断线" 标签，不可编辑，可删除
- 图片：支持 URL 插入（`@tiptap/extension-image`）
- 保存时：遍历文档找到截断线节点，计算其前内容字符数为 `truncation_index`
- 输出：HTML 格式存入 `content_html`

#### 7.6 管理员博客编辑器 `/admin/blog/new`

与课程编辑器共用 Tiptap，但无截断线功能，增加封面图和分类设置：

```
┌──────────────────────────────────────────┐
│ ← 返回博客列表           [保存草稿] [发布] │
├──────────────────────────────────────────┤
│ 标题：[________________]                 │
│ Slug：[________________]                 │
│ 封面图 URL：[________________]           │
│ 分类：[下拉选择]  标签：[输入+回车]       │
│ 描述：[________________]                 │
├──────────────────────────────────────────┤
│ ┌─ Tiptap 工具栏 ─────────────────────┐ │
│ │ B I U | H1 H2 | UL OL | 📷图片       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ （从课程预填的内容，可编辑修改）           │
│                                         │
└──────────────────────────────────────────┘
```

- 若 URL 含 `?fromCourseId=xxx`，自动预填标题和内容（去掉截断线）
- 分类沿用：meditation / zen-philosophy / mindfulness / spiritual-growth / practice-guide
- 标签：逗号分隔输入，存为 TEXT[]
- 博客面向全量用户，不受 zh-only 限制

#### 7.7 管理员评论审核 `/admin/study/comments`

- 顶部筛选栏：课程下拉 + 时间选择器 + 搜索按钮
- 表格列：评论内容(前50字) | 所属课程 | 学员昵称 | 发表时间 | 操作
- 操作：红色「删除」按钮 → 二次确认弹窗 → 软删除

#### 7.8 管理员打卡统计 `/admin/study/checkins`

- 二维表格：行=学员，列=课程
- 有评论=绿色 √，仅打卡无评论=黄色 √，未打卡=橙色空格
- 顶部统计：总学员数、总课程数、平均打卡率

#### 7.9 Dashboard 打卡日历

在现有 `app/[locale]/dashboard/page.tsx` 中新增：

```
┌─────────────────────────┐
│ 📅 我的打卡              │
│     2026年9月            │
│ 一 二 三 四 五 六 日     │
│          1  2  3  4      │
│ 5  6  7  8✓ 9  10✓ 11   │  ← 绿色圈+勾=打卡日
│ 12✓ 13 14 15✓ 16 17 18  │
│ 19 20 21 22 23 24 25    │
│ 26 27 28 29 30          │
│                         │
│ 本月打卡 5/22 天         │
└─────────────────────────┘
```

- 数据源：`GET /api/study/checkins?month=2026-09`
- 打卡日：`study_checkins` 中该用户所有 `created_at` 按日期去重
- 组件：`components/study/checkin-calendar.tsx`

### 8. 截断线技术方案

Tiptap 自定义 Node 扩展 `TruncationLine`：

```typescript
const TruncationLine = Node.create({
  name: 'truncationLine',
  group: 'block',
  inline: false,
  draggable: true,
  // 渲染为可视化虚线 + 标签
  // 保存时计算该节点前所有文本的字符数 → truncation_index
});
```

前端渲染截断时：
- 未打卡：取 `content_html` 前 `truncation_index` 个字符渲染
- 已打卡：渲染完整 `content_html`
- 遮罩层：截断内容下方叠加渐变遮罩 + 打卡按钮

### 9. Header 导航修改

修改 `components/header.tsx`：
- zh locale：「课程」→ `/study`
- en locale：不显示「课程」链接
- 「博客」链接保持不变，所有用户可见

### 10. 博客展示页修改

修改 `app/[locale]/blog/page.tsx` 和 `app/[locale]/blog/[slug]/page.tsx`：
- 博客列表：合并 MDX 文件博客（`lib/blog.ts`）+ 数据库博客（`blog_posts` 表）
- 博客详情：优先查 MDX 文件，未找到则查 `blog_posts` 表
- 数据库博客用 `dangerouslySetInnerHTML` 渲染 HTML
- 卡片样式统一

### 11. 旧冥想代码清理

| 操作 | 文件 |
|------|------|
| 删除 | `app/[locale]/meditation/` 目录 |
| 删除 | i18n 中 `meditation` namespace（en.json + zh.json） |
| 修改 | Header 导航链接 |
| 新增 | `/meditation` → `/study` 重定向（next.config.mjs） |

---

## Key Files

| 文件 | 操作 | 说明 |
|------|------|------|
| `supabase/migrations/20260902_study_module.sql` | 新建 | 数据库迁移（4 张新表） |
| **学员端页面** | | |
| `app/[locale]/study/page.tsx` | 新建 | 课程列表页 |
| `app/[locale]/study/[courseId]/page.tsx` | 新建 | 课程详情页 |
| **管理员统一后台** | | |
| `app/admin/layout.tsx` | 新建 | 管理员统一布局（侧边栏+鉴权） |
| `app/admin/page.tsx` | 新建 | 后台概览首页 |
| `app/admin/users/page.tsx` | 修改 | 纳入统一布局 |
| `app/admin/refunds/page.tsx` | 修改 | 纳入统一布局 |
| `app/admin/study/courses/page.tsx` | 新建 | 课程列表管理 |
| `app/admin/study/courses/new/page.tsx` | 新建 | 新建课程 |
| `app/admin/study/courses/[courseId]/edit/page.tsx` | 新建 | 编辑课程 |
| `app/admin/study/comments/page.tsx` | 新建 | 评论审核 |
| `app/admin/study/checkins/page.tsx` | 新建 | 打卡统计 |
| `app/admin/blog/page.tsx` | 新建 | 博客列表管理 |
| `app/admin/blog/new/page.tsx` | 新建 | 新建/从课程发布博客 |
| `app/admin/blog/[postId]/edit/page.tsx` | 新建 | 编辑博客 |
| **学员端 API** | | |
| `app/api/study/courses/route.ts` | 新建 | 课程列表 API |
| `app/api/study/courses/[courseId]/route.ts` | 新建 | 课程详情 API |
| `app/api/study/checkin/route.ts` | 新建 | 打卡 API |
| `app/api/study/checkins/route.ts` | 新建 | 打卡记录 API |
| `app/api/study/comments/route.ts` | 新建 | 评论 API |
| `app/api/admin/stats/route.ts` | 新建 | 后台概览统计 |
| `app/api/admin/study/courses/route.ts` | 新建 | 课程 CRUD |
| `app/api/admin/study/courses/[courseId]/route.ts` | 新建 | 课程详情/更新/删除/发布 |
| `app/api/admin/study/comments/route.ts` | 新建 | 评论审核 |
| `app/api/admin/study/comments/[commentId]/route.ts` | 新建 | 评论删除 |
| `app/api/admin/study/checkins/route.ts` | 新建 | 打卡统计 |
| `app/api/admin/blog/posts/route.ts` | 新建 | 博客 CRUD |
| `app/api/admin/blog/posts/[postId]/route.ts` | 新建 | 博客详情/更新/删除/发布 |
| **博客公开 API** | | |
| `app/api/blog/posts/route.ts` | 新建 | 数据库博客列表（公开） |
| `app/api/blog/posts/[slug]/route.ts` | 新建 | 数据库博客详情（公开） |
| **组件** | | |
| `components/study/checkin-calendar.tsx` | 新建 | Dashboard 打卡日历 |
| `components/study/course-card.tsx` | 新建 | 课程卡片 |
| `components/admin/sidebar.tsx` | 新建 | 管理员侧边栏导航 |
| `components/admin/admin-layout.tsx` | 新建 | 管理员布局框架 |
| `components/admin/stats-card.tsx` | 新建 | 统计卡片组件 |
| `components/editor/tiptap-editor.tsx` | 新建 | Tiptap 编辑器组件（课程+博客共用） |
| `components/editor/truncation-line-extension.ts` | 新建 | 截断线 Tiptap 扩展 |
| **库** | | |
| `lib/study-server.ts` | 新建 | 学员端数据获取函数 |
| `lib/course-search.ts` | 新建 | RAG 检索（pgvector 匹配 + 结果去重） |
| `lib/embedding.ts` | 新建 | Zhipu Embedding API 调用封装 |
| `lib/blog-db.ts` | 新建 | 数据库博客查询函数 |
| **修改的文件** | | |
| `app/api/chat/route.ts` | 修改 | 注入课程知识库检索+引文注解 |
| `app/[locale]/blog/page.tsx` | 修改 | 合并 MDX + 数据库博客 |
| `app/[locale]/blog/[slug]/page.tsx` | 修改 | 支持 MDX + 数据库博客详情 |
| `app/[locale]/dashboard/page.tsx` | 修改 | 新增打卡日历 |
| `components/header.tsx` | 修改 | zh→/study, en 隐藏课程链接 |
| `messages/zh.json` | 修改 | 新增 study + admin namespace，移除 meditation |
| `messages/en.json` | 修改 | 新增 study + admin namespace，移除 meditation |
| `next.config.mjs` | 修改 | `/meditation` → `/study` 重定向 |
| **删除的文件** | | |
| `app/[locale]/meditation/` | 删除 | 旧冥想课程页面 |
| `package.json` | 修改 | 添加 Tiptap + DOMPurify 依赖 |

---

## 执行顺序

1. **数据库迁移** — 创建 4 张新表 + RLS 策略
2. **安装依赖** — `@tiptap/react`、`@tiptap/starter-kit`、`@tiptap/extension-image`、`isomorphic-dompurify`
3. **管理员统一后台** — Layout + 侧边栏 + 概览页 + 整合现有 admin 页面
4. **管理员课程管理** — Tiptap 编辑器 + 截断线 + 课程 CRUD API + 页面
5. **学员端页面** — 课程列表 → 课程详情（截断/打卡/评论）+ API
6. **管理员评论审核 + 打卡统计** — API + 页面
7. **课程→博客发布** — 博客表 + 编辑器 + API + 博客展示页整合
8. **课程融入聊天** — 搜索 API + chat route 修改
9. **Dashboard 集成** — 打卡日历组件
10. **导航与路由** — Header 修改 + 旧冥想重定向
11. **i18n** — study + admin namespace + 清理 meditation namespace
12. **清理** — 删除旧冥想页面和 i18n 内容

---

## Verification

| 检查项 | 方法 |
|--------|------|
| 编译通过 | `pnpm build` |
| 学员课程列表 | zh 登录后访问 `/study`，确认课程卡片+打卡状态 |
| 截断+打卡解锁 | 未打卡课程显示截断遮罩，点击打卡后内容展开 |
| 未登录跳转 | 未登录点击打卡 → 跳转登录页 → 登录后返回课程 |
| 评论功能 | 打卡后发表评论，评论列表显示 |
| 管理员统一后台 | `/admin` 显示侧边栏+概览，点击菜单切换页面 |
| 管理员课程编辑 | 创建课程 + 插入截断线 + 发布 |
| 管理员评论审核 | 删除评论，前端同步消失 |
| 管理员打卡统计 | 二维表格显示正确 √/空格 |
| 课程→博客 | 从课程发布为博客，添加配图，/blog 列表可见 |
| 博客全量可见 | en 用户可查看从课程发布的博客文章 |
| 聊天引用课程 | zh 用户提问相关话题，AI 回答附课程引文注解 |
| Dashboard 日历 | 打卡日显示绿色高亮 |
| en 不受影响 | en locale 访问 `/study` 被重定向，导航无"课程"链接 |
| 旧冥想重定向 | `/meditation` → 301 → `/study` |

---

## Risks And Compatibility

| 风险 | 影响 | 缓解 |
|------|------|------|
| Tiptap SSR 兼容 | 中 | Tiptap 仅在客户端管理员页面使用，学员端渲染 HTML |
| HTML 注入安全 | 高 | 管理员内容用 DOMPurify 净化后存储，渲染时用 dangerouslySetInnerHTML |
| 聊天 token 膨胀 | 中 | 课程注入限制 1000 字 + 最多 2 篇，监控 API 用量 |
| RAG Embedding 成本 | 低 | Zhipu embedding-3 免费额度充足，仅在课程发布时生成 |
| pgvector 扩展 | 低 | Supabase 原生支持，CREATE EXTENSION 即可 |
| 课程搜索准确性 | 中 | RAG 语义匹配准确率高，阈值 0.7 过滤低相关结果 |
| 旧冥想页面 SEO | 低 | 301 重定向保留链接权重 |

---

## Rollback

1. `git revert` 相关 commits
2. 恢复 `app/[locale]/meditation/` 目录
3. 恢复 i18n `meditation` namespace
4. 恢复 Header 导航链接
5. 恢复 `/admin/users` 和 `/admin/refunds` 为独立页面（移除统一布局）
6. 恢复 chat route（移除课程检索逻辑）
7. 恢复 blog 页面（移除数据库博客合并逻辑）
8. 可选：`DROP TABLE study_courses, study_checkins, study_comments, blog_posts;`
9. 卸载 Tiptap + DOMPurify 依赖
10. en 用户全程不受影响
