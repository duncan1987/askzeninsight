<!--
 * @Description: 
 * @Version: 1.0
 * @Author: duncan
 * @Date: 2026-01-23 14:28:54
 * @LastEditors: duncan
 * @LastEditTime: 2026-02-03 23:21:02
 * @FilePath: \aibudda\docs\prd.md
-->
1.订阅用户发消息往user_records表中写入数据时应该把订阅用户的subscription_id也写        入，这样在统计每天的使用消息数量时应该把subscription_id这个条件也加进来统计。2.现在用户    
  订阅后会在subscriptions表中生成订阅记录，取消订阅后这条记录就会被删除，我希望取消订阅时      
  只是订阅记录变为失效了，而不是完全被删除了；3.系统对用户订阅行为，1次只能选择1个订阅计划     
  ，并且数据库中同一个用户只有1条有效的订阅记录；4.当某个有效订阅计划快要到期的前7天，发邮     
  件提醒用户订阅快到期了，同时在系统Dashboard页面同样提醒，继续使用需要重新订阅；5.若用户      
  在某个有效订阅计划到期之前重新订阅了，那重新订阅的计划应该在当前订阅计划到期后才生效 



  ● 基于代码分析，以下是客服手动处理 Creem 订阅的完整流程：                                       
                                                                                                
  手动处理 Creem 订阅的步骤                                                                        
  1. 收集必要信息                                                                               
  
  从系统日志和数据库中获取以下信息：
  ┌───────────────────────┬───────────────────────────────────────┬────────────────────────────┐
  │         信息          │                 来源                  │            示例            │
  ├───────────────────────┼───────────────────────────────────────┼────────────────────────────┤
  │ Creem Subscription ID │ subscriptions.creem_subscription_id   │ sub_5UxuImybaAONHG0mNW8VKL │
  ├───────────────────────┼───────────────────────────────────────┼────────────────────────────┤
  │ 用户邮箱              │ auth.users.email                      │ bnuduncan@gmail.com        │
  ├───────────────────────┼───────────────────────────────────────┼────────────────────────────┤
  │ 取消时间              │ subscriptions.updated_at              │ 2026-02-03T09:45:42Z       │
  ├───────────────────────┼───────────────────────────────────────┼────────────────────────────┤
  │ 退款状态              │ subscriptions.refund_status           │ requested                  │
  ├───────────────────────┼───────────────────────────────────────┼────────────────────────────┤
  │ 退款金额              │ API 返回的 refundInfo.estimatedRefund │ $2.99                      │
  └───────────────────────┴───────────────────────────────────────┴────────────────────────────┘
  2. 登录 Creem Dashboard

  https://dashboard.creem.io

  3. 查找订阅

  方式 1：通过 Subscription ID 搜索
  Dashboard → Subscriptions → 搜索框输入 "sub_5UxuImybaAONHG0mNW8VKL"

  方式 2：通过客户邮箱搜索
  Dashboard → Customers → 搜索用户邮箱 → 查看该客户的订阅列表

  4. 手动取消订阅

  在 Creem Dashboard 中：

  1. 打开订阅详情页
  2. 点击 "Cancel Subscription" 按钮
  3. 选择取消模式：
     - Immediate: 立即取消（用于 ≤48h 且 ≤5 条消息的情况）
     - Scheduled: 周期结束时取消（用于其他情况）
  4. 确认取消

  5. 处理退款

  对于自动退款资格用户（≤48h, ≤5 条消息）

  Dashboard → Subscriptions → 选择订阅 → Refund

  退款信息：
  - 金额：根据 estimatedRefund 字段（例如 $2.99 或 $24.99）
  - 原因：用户取消，符合 48 小时退款政策
  - 退款方式：原路返回（自动）

  对于非自动退款资格用户

  需要根据 refundInfo 计算的退款比例：
  消息数: 10
  退款比例: 99.73%
  退款金额: $2.89 (年付 $24.84)

  6. 更新系统状态

  在 Supabase 数据库中更新 refund_status：

  -- 批准退款
  UPDATE subscriptions
  SET refund_status = 'approved',
      updated_at = NOW()
  WHERE id = 'subscription_id';

  -- 退款已处理
  UPDATE subscriptions
  SET refund_status = 'processed',
      updated_at = NOW()
  WHERE id = 'subscription_id';

  -- 拒绝退款
  UPDATE subscriptions
  SET refund_status = 'rejected',
      updated_at = NOW()
  WHERE id = 'subscription_id';

  7. 通知用户

  发送邮件通知用户退款状态：

  模板：
  主题：退款处理完成 - Ask Zen Insight

  尊敬的 [用户名]，

  您的退款请求已处理完成：
  • 退款金额：$2.99
  • 退款方式：原路返回到您的支付账户
  • 到账时间：3-5 个工作日

  您的账户已降级为免费层级，可以继续使用我们的基础服务。

  如有疑问，请回复此邮件联系我们。

  祝好，
  Ask Zen Insight 团队

  常见场景处理

  场景 1：Creem API 网络超时

  系统日志：Creem cancel subscription failed (504)
  处理步骤：
  1. 重试 API 调用（可能只是临时网络问题）
  2. 如果仍失败，手动在 Dashboard 取消
  3. 更新 refund_status 为 'processed'

  场景 2：Creem Subscription ID 无效

  系统日志：Subscription not found in Creem
  处理步骤：
  1. 通过客户邮箱在 Creem 查找订阅
  2. 如果找不到，可能是支付未完成
  3. 联系用户确认支付状态
  4. 如果确实已支付，Creem 客服协助查找

  场景 3：订阅已在 Creem 取消

  系统日志：Subscription already canceled
  处理步骤：
  1. 确认 Creem 端状态
  2. 只需处理数据库端的退款更新
  3. 通知用户退款进度

  客服需要的 API 密钥

  如果需要通过 API 而非 Dashboard 操作：

  # Creem API Key
  CREEM_API_KEY=creem_test_xxx  # 测试环境
  CREEM_API_KEY=creem_live_xxx  # 生产环境

  # API Base URL
  测试: https://test-api.creem.io
  生产: https://api.creem.io

  调试 API 调用

  如果需要测试或手动调用 Creem API：

  curl -X POST "https://test-api.creem.io/v1/subscriptions/sub_5UxuImybaAONHG0mNW8VKL/cancel" \ 
    -H "content-type: application/json" \
    -H "x-api-key: creem_test_xxx" \
    -d '{
      "mode": "immediate",
      "onExecute": "cancel"
    }'

  监控未处理的取消

  定期查询需要手动处理的取消请求：

  -- 查找需要手动处理的取消请求
  SELECT
    s.id,
    s.creem_subscription_id,
    s.user_id,
    s.status,
    s.refund_status,
    s.updated_at,
    u.email
  FROM subscriptions s
  JOIN auth.users u ON s.user_id = u.id
  WHERE s.refund_status = 'requested'
    AND s.status = 'cancelled'
    AND s.updated_at > NOW() - INTERVAL '7 days'
  ORDER BY s.updated_at DESC;

  这样可以确保所有 API 失败的取消请求都得到手动处理。