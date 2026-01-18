# 订阅系统测试说明

## 概述

本项目包含两套测试用例，用于验证订阅系统的完整功能：

1. **subscription-flow.test.ts** - 订阅支付流程测试
2. **subscription-usage-limits.test.ts** - 订阅用量限制和AI模型切换测试

## 测试场景

### subscription-flow.test.ts

测试从免费用户升级到月付/年付用户的完整支付流程：

- ✅ 免费 → 月付Pro用户
- ✅ 免费 → 年付Annual用户
- ✅ 订阅续费
- ✅ 订阅取消
- ✅ 月付 → 年付升级

### subscription-usage-limits.test.ts

测试不同订阅层级下的用量限制和AI模型切换：

- ✅ 免费用户初始状态（5条/天，glm-4-flash）
- ✅ 免费 → Pro升级（限制更新为6条，模型升级为glm-4.7）
- ✅ 免费 → Annual升级（限制更新为6条，模型升级为glm-4.7）
- ✅ Pro → 免费降级（限制恢复为5条，模型降级为glm-4-flash）
- ✅ 实际使用量统计验证
- ✅ 用量超限后的行为
- ✅ Pro用户超出配额后的降级
- ✅ 月付 → 年付升级

## 订阅层级对比

| 层级 | 每日消息限制 | AI模型 | 历史记录保存 |
|------|-------------|--------|-------------|
| 匿名用户 | 100条 | glm-4-flash | ❌ |
| 免费用户 | 5条 | glm-4-flash | ❌ |
| Pro用户 | 6条 | glm-4.7 | ✅ |
| Annual用户 | 6条 | glm-4.7 | ✅ |

## 运行测试

### 前置条件

1. 确保开发服务器正在运行：
   ```bash
   pnpm dev
   ```

2. 设置测试环境变量（创建 `.env.test`）：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   CREEM_WEBHOOK_SECRET=your_webhook_secret
   ZHIPU_API_KEY=your_zhipu_api_key
   ZHIPU_API_FREE=your_zhipu_free_api_key
   ```

### 运行所有测试

```bash
# 使用Jest运行所有测试
pnpm test

# 运行特定测试文件
pnpm test subscription-usage-limits.test.ts

# 运行测试并显示覆盖率
pnpm test:coverage

# 监听模式（开发时使用）
pnpm test:watch
```

### 使用测试运行器

项目中包含一个TypeScript测试运行器：

```bash
# 编译并运行测试运行器
npx tsx tests/subscription-test-runner.ts
```

## 测试辅助函数

### auth.ts

位于 `tests/helpers/auth.ts`，提供以下函数：

- `createUser()` - 创建测试用户
- `deleteUser()` - 删除测试用户及相关数据
- `signIn()` - 用户登录获取token

### subscription-usage-limits.test.ts

包含以下辅助函数：

- `generateTestSignature()` - 生成Creem webhook签名
- `createUsageRecords()` - 创建测试用量记录
- `clearUsageRecords()` - 清理测试用量记录

## API端点

测试中使用的API端点：

- `GET /api/user/tier` - 获取用户订阅层级
- `GET /api/usage/check` - 获取用户用量统计
- `POST /api/creem/webhook` - 处理Creem webhook事件
- `POST /api/chat` - 发送聊天消息

## 注意事项

1. **测试数据库**：建议使用独立的测试数据库，避免污染生产数据
2. **清理数据**：每个测试套件会自动清理创建的测试数据
3. **时间依赖**：用量限制基于24小时窗口，测试记录会在最近12小时内创建
4. **并发测试**：每个测试使用唯一的邮箱地址，避免冲突

## 故障排查

### 测试失败：认证错误

检查 `.env.test` 中的Supabase凭据是否正确：
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 测试失败：连接错误

确保开发服务器正在运行：
```bash
pnpm dev
```

### 测试失败：webhook签名错误

检查 `CREEM_WEBHOOK_SECRET` 环境变量是否设置正确。

## 扩展测试

要添加新的测试场景：

1. 在相应的测试文件中添加 `describe` 块
2. 使用 `beforeAll` 设置测试数据
3. 使用 `afterAll` 清理测试数据
4. 使用 `it` 添加具体测试用例

示例：
```typescript
describe('New Test Scenario', () => {
  let testUserId: string

  beforeAll(async () => {
    const user = await createUser({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    })
    testUserId = user.id
  })

  afterAll(async () => {
    await deleteUser(testUserId)
  })

  it('should do something', async () => {
    // 测试代码
  })
})
```
