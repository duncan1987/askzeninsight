# Monthly → Annual Upgrade Flow Verification

## Scenario: Free → Monthly → Annual Upgrade

### User Actions
```
1. Free user subscribes to Monthly plan ($2.99/month, 30 days)
2. Uses 5 messages (Pro tier: 5/100 used)
3. Clicks "Upgrade to Annual" to switch to Annual plan ($24.9/year, 365 days)
```

---

## Expected Behavior

### Step 1: User Subscribes to Monthly Plan

**Action:** User completes checkout for Monthly plan

**Creem Side:**
- Creates subscription with unique ID: `sub_monthly_abc123`
- Status: `active`
- Interval: `month`

**Webhook (`checkout.completed`):**
```json
{
  "eventType": "checkout.completed",
  "object": {
    "request_id": "user_uuid_123",
    "subscription": {
      "id": "sub_monthly_abc123",
      "status": "active",
      "interval": "month",
      "current_period_end_date": "2025-02-18 00:00:00"
    },
    "metadata": {
      "referenceId": "user_uuid_123",
      "userEmail": "user@example.com",
      "plan": "pro",
      "interval": "month"
    }
  }
}
```

**Database After Step 1:**
```sql
INSERT INTO subscriptions (
  user_id: 'user_uuid_123',
  creem_subscription_id: 'sub_monthly_abc123',
  status: 'active',
  plan: 'pro',
  interval: 'month',
  current_period_end: '2025-02-18 00:00:00',
  refund_status: 'none',
  replaced_by_new_plan: false
)
```

**Email Sent:** ✅ Welcome email for Monthly plan

---

### Step 2: User Uses 5 Messages

**Action:** User sends 5 messages as Pro user

**Database Records Created:**
```sql
-- 5 usage records
INSERT INTO usage_records (user_id, message_type, user_tier, timestamp)
VALUES
  ('user_uuid_123', 'user', 'pro', '2025-01-19 10:00:00'),
  ('user_uuid_123', 'user', 'pro', '2025-01-19 10:05:00'),
  ...
```

**Usage Check:**
- Query: `SELECT COUNT(*) FROM usage_records WHERE user_id = 'user_uuid_123' AND user_tier = 'pro' AND timestamp > NOW() - INTERVAL '24 hours'`
- Result: `5 used / 100 remaining`

---

### Step 3: User Clicks "Upgrade to Annual"

**Action:** User clicks upgrade button

**Frontend Call:**
```typescript
POST /api/subscription/change-plan
{
  "newPlan": "annual"
}
```

**API Processing (`change-plan/route.ts`):**

1. **Get Current Subscription:**
   ```sql
   SELECT * FROM subscriptions
   WHERE user_id = 'user_uuid_123'
     AND status IN ('active', 'cancelled', 'canceled')
     AND current_period_end >= NOW()
   ORDER BY created_at DESC
   -- Result: 1 row (Monthly subscription)
   ```

2. **Cancel in Creem:**
   ```typescript
   await cancelSubscription({
     subscriptionId: 'sub_monthly_abc123',
     mode: 'immediate'  // ✅ Consistent with user cancellation
   })
   ```

3. **Update Database (NOT DELETE):**
   ```sql
   UPDATE subscriptions
   SET
     status = 'cancelled',
     cancel_at_period_end = true,
     replaced_by_new_plan = true,
     updated_at = NOW()
   WHERE id = 'sub_monthly_id'
   ```

   **Critical:** Subscription record is preserved in database!

4. **Return Success:**
   ```json
   {
     "success": true,
     "message": "Your Pro subscription has been cancelled and will expire on Feb 18, 2025. You can now subscribe to the Annual plan.",
     "currentPlan": "pro",
     "newPlan": "annual",
     "accessUntil": "2025-02-18 00:00:00",
     "canSubscribeNow": true
   }
   ```

**Database After Step 3:**
```sql
-- Monthly subscription (cancelled but preserved)
user_id: 'user_uuid_123',
creem_subscription_id: 'sub_monthly_abc123',
status: 'cancelled',  -- ✅ Cancelled
cancel_at_period_end: true,
replaced_by_new_plan: true,  -- ✅ Marked as replaced
current_period_end: '2025-02-18 00:00:00'
```

**User Access Status:** ✅ Pro tier maintained
- `getUserSubscription()` finds the cancelled subscription
- Checks: `status IN ('active', 'cancelled', 'canceled')` ✅
- Checks: `current_period_end >= NOW()` ✅
- Returns: `tier: 'pro'` ✅

---

### Step 4: Redirect to Checkout

**Action:** User is redirected to Annual plan checkout

**Frontend Code:**
```typescript
// After successful change-plan response
const checkoutRes = await fetch('/api/creem/checkout', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ plan: 'annual' }),
})

const checkoutData = await checkoutRes.json()
window.location.href = checkoutData.checkout_url
```

**User Experience:**
- Redirected to Creem checkout page
- Sees: Annual plan, $24.9/year
- Completes payment

---

### Step 5: Creem Sends Webhook for Annual Subscription

**Action:** User completes Annual plan checkout

**Creem Side:**
- Creates NEW subscription with unique ID: `sub_annual_xyz789` (different from monthly!)
- Status: `active`
- Interval: `year`

**Webhook Payload:**
```json
{
  "eventType": "checkout.completed",
  "object": {
    "request_id": "user_uuid_123",
    "subscription": {
      "id": "sub_annual_xyz789",  // ✅ Different ID!
      "status": "active",
      "interval": "year",
      "current_period_end_date": "2026-01-19 00:00:00"
    },
    "metadata": {
      "referenceId": "user_uuid_123",
      "userEmail": "user@example.com",
      "plan": "annual",
      "interval": "year"
    }
  }
}
```

**Webhook Processing (`webhook/route.ts`):**

1. **Extract Data:**
   ```typescript
   const subscriptionId = 'sub_annual_xyz789'
   const userId = 'user_uuid_123'
   const planType = 'annual'
   const interval = 'year'
   const userEmail = 'user@example.com'
   ```

2. **Upsert Subscription:**
   ```typescript
   await supabase
     .from('subscriptions')
     .upsert(
       {
         user_id: 'user_uuid_123',
         creem_subscription_id: 'sub_annual_xyz789',  // ✅ NEW ID
         status: 'active',
         current_period_end: '2026-01-19 00:00:00',
         plan: 'annual',
         interval: 'year',
       },
       { onConflict: 'creem_subscription_id' }
     )
   ```

   **Critical Point:**
   - `onConflict: 'creem_subscription_id'` checks if `sub_annual_xyz789` exists
   - It doesn't exist (it's a new ID)
   - Therefore, a **new row is created** ✅
   - Old monthly subscription (sub_monthly_abc123) remains untouched

3. **Send Welcome Email:**
   ```typescript
   const isNewSubscription = data && Array.isArray(data) && data.length > 0

   if (isNewSubscription) {
     await sendWelcomeEmail({
       userEmail: 'user@example.com',
       plan: 'annual',
       currentPeriodEnd: '2026-01-19 00:00:00',
       subscriptionId: 'sub_annual_xyz789',
     })
   }
   ```

   **Email Sent:** ✅ Welcome email for Annual plan

**Database After Step 5:**
```sql
-- Two subscriptions in database:

-- 1. Monthly subscription (cancelled, old)
id: 1,
user_id: 'user_uuid_123',
creem_subscription_id: 'sub_monthly_abc123',
status: 'cancelled',
plan: 'pro',
interval: 'month',
current_period_end: '2025-02-18 00:00:00',
replaced_by_new_plan: true

-- 2. Annual subscription (active, new)
id: 2,
user_id: 'user_uuid_123',
creem_subscription_id: 'sub_annual_xyz789',  -- ✅ Different!
status: 'active',  -- ✅ Active
plan: 'annual',
interval: 'year',
current_period_end: '2026-01-19 00:00:00',
replaced_by_new_plan: false
```

---

### Step 6: User Access After Upgrade

**Action:** User sends a message

**`getUserSubscription()` Logic:**
```typescript
const { data: subscriptions } = await supabase
  .from('subscriptions')
  .select('status, current_period_end, plan, cancel_at_period_end, refund_status')
  .eq('user_id', 'user_uuid_123')
  .in('status', ['active', 'cancelled', 'canceled'])
  .gte('current_period_end', NOW())
  .order('created_at', { ascending: false })  // ✅ Most recent first
```

**Query Results:**
1. Annual subscription (created_at: 2025-01-19 10:30:00) - newest
2. Monthly subscription (created_at: 2025-01-18 10:00:00) - older

**Result:**
- Takes first (newest) subscription
- `subscription.plan = 'annual'`
- `subscription.status = 'active'`
- Returns: `tier: 'pro', plan: 'annual', model: 'glm-4.7'` ✅

**Usage Check:**
- Query: `SELECT COUNT(*) FROM usage_records WHERE user_id = 'user_uuid_123' AND user_tier = 'pro' AND timestamp > NOW() - INTERVAL '24 hours'`
- Result: `5 used / 100 remaining`

**Wait!** This is wrong! The user should have 0/100 for the new Annual subscription!

---

## ❌ IDENTIFIED BUG

### Problem: Usage Counter Not Resetting on Plan Change

**Current Behavior:**
- User used 5 messages on Monthly plan
- User upgrades to Annual plan
- Usage query counts ALL messages with `user_tier='pro'`
- Shows: 5/100 used (incorrect!)
- **User loses 5 messages of their Annual quota!**

**Root Cause:**
- Usage tracking is based on `user_tier`, not on individual subscription
- Both Monthly and Annual subscriptions have `user_tier='pro'`
- The query doesn't distinguish between different Pro subscriptions

**Expected Behavior:**
- When user upgrades to Annual plan, usage counter should reset to 0
- User gets full 100 messages for the new Annual subscription
- Previous Monthly usage shouldn't count against new quota

---

## ✅ SOLUTION: Add Subscription ID to Usage Tracking

### Database Schema Change

**Add `subscription_id` column to `usage_records`:**
```sql
ALTER TABLE usage_records
ADD COLUMN subscription_id UUID REFERENCES public.subscriptions(id);

CREATE INDEX usage_records_subscription_id_idx
ON usage_records(subscription_id);
```

**New Structure:**
```sql
CREATE TABLE usage_records (
  id UUID,
  user_id UUID,
  message_type TEXT,
  user_tier TEXT,  -- 'anonymous', 'free', 'pro'
  subscription_id UUID,  -- ✅ NEW: Link to specific subscription
  timestamp TIMESTAMP
)
```

### Code Changes

**1. Update `recordUsage()` to save subscription_id:**
```typescript
export async function recordUsage(
  userId: string | undefined,
  messageType: 'user' | 'assistant'
) {
  const supabase = await createClient()
  if (!supabase) return

  // Get user's current subscription
  const subscription = await getUserSubscription(userId)

  // Get the actual subscription record ID from database
  let subscriptionId: string | undefined
  if (userId && subscription.tier === 'pro') {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    const { data: subRecords } = await adminClient
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('current_period_end', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    subscriptionId = subRecords?.[0]?.id
  }

  const record = {
    user_id: userId || null,
    message_type: messageType,
    user_tier: subscription.tier,
    subscription_id: subscriptionId,  // ✅ Save subscription ID
    timestamp: new Date().toISOString(),
  }

  await supabase.from('usage_records').insert(record)
}
```

**2. Update `checkUsageLimit()` to count only current subscription:**
```typescript
export async function checkUsageLimit(userId?: string) {
  const subscription = await getUserSubscription(userId)

  // Get current subscription ID
  let currentSubscriptionId: string | undefined
  if (userId && subscription.tier === 'pro') {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    const { data: subRecords } = await adminClient
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['active', 'cancelled', 'canceled'])
      .gte('current_period_end', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    currentSubscriptionId = subRecords?.[0]?.id
  }

  const limit = subscription.tier === 'pro' ? 100 : 20

  // Count messages for current subscription only
  const { count } = await supabase
    .from('usage_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('message_type', 'user')
    .eq('subscription_id', currentSubscriptionId)  // ✅ Filter by subscription
    .gte('timestamp', twentyFourHoursAgo.toISOString())

  const used = count || 0
  const remaining = Math.max(0, limit - used)
  const canProceed = used < limit

  return { canProceed, limit, remaining }
}
```

---

## ✅ CORRECTED BEHAVIOR AFTER FIX

### Step 2 (Revisited): User Uses 5 Messages on Monthly Plan

**Usage Records Created:**
```sql
INSERT INTO usage_records (
  user_id, message_type, user_tier, subscription_id, timestamp
) VALUES
  ('user_uuid_123', 'user', 'pro', 'monthly_subscription_id', '2025-01-19 10:00:00'),
  ('user_uuid_123', 'user', 'pro', 'monthly_subscription_id', '2025-01-19 10:05:00'),
  ... (5 records with subscription_id = 'monthly_subscription_id')
```

### Step 6 (Revisited): User Sends Message After Annual Upgrade

**Usage Query:**
```sql
SELECT COUNT(*)
FROM usage_records
WHERE user_id = 'user_uuid_123'
  AND message_type = 'user'
  AND subscription_id = 'annual_subscription_id'  -- ✅ Only Annual!
  AND timestamp > NOW() - INTERVAL '24 hours'
```

**Result:** `0 used / 100 remaining` ✅

**Perfect!** Usage counter reset for new subscription!

---

## Summary

### Before Fix: ❌
- Monthly usage: 5/100
- Upgrade to Annual
- Annual usage: 5/100 (incorrect!)
- User loses 5 messages

### After Fix: ✅
- Monthly usage: 5/100 (with subscription_id=monthly_id)
- Upgrade to Annual
- Annual usage: 0/100 (with subscription_id=annual_id)
- User gets full 100 messages ✅

### Benefits:
✅ Usage counter resets when user changes plans
✅ Each subscription has independent usage tracking
✅ Fair billing - users get what they pay for
✅ Consistent behavior across all plan changes

---

## Migration Required

This fix requires a database migration:
1. Add `subscription_id` column to `usage_records`
2. Update `recordUsage()` to save subscription_id
3. Update `checkUsageLimit()` and `getUsageStats()` to filter by subscription_id
4. Backfill existing usage records (if possible) or mark as legacy

**Priority:** HIGH - This is a billing accuracy issue!
