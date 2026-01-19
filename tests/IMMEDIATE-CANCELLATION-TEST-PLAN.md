# Immediate Cancellation Test Plan

## Overview
This document outlines the test scenarios for the new immediate cancellation feature that prevents users from accessing Pro features after receiving refunds.

## Critical Changes to Test

### 1. Database Schema
- [ ] Verify `refund_status` column exists in `subscriptions` table
- [ ] Verify default value is 'none'
- [ ] Verify column accepts: 'none', 'requested', 'approved', 'rejected', 'processed'

**SQL to verify:**
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions' AND column_name = 'refund_status';
```

---

## Test Scenarios

### Scenario 1: Immediate Cancellation (Within 48 Hours, Low Usage)

**Setup:**
- User created subscription less than 48 hours ago
- User has used ≤ 5 messages
- Subscription status: 'active'
- Plan: 'pro' or 'annual'

**Steps:**
1. User logs into dashboard
2. User clicks "Cancel Subscription" button
3. User confirms cancellation

**Expected Results:**
- [ ] HTTP 200 response
- [ ] `refund_status` updated to 'requested' in database
- [ ] Subscription DELETED from database (immediate, not scheduled)
- [ ] Creem API called with `mode: 'immediate'`
- [ ] Response includes:
  - `immediateCancellation: true`
  - `refundInfo` object with:
    - `usageCount: ≤5`
    - `fullyRefundable: true`
    - `refundPercentage: '100%'`
    - `estimatedRefund: '$2.99'` or `'$24.90'`
  - `newTier: 'free'`
  - `newModel: 'glm-4-flash'`
  - `dailyLimit: 20`

**Verification After Cancellation:**
- [ ] Call `getUserSubscription(userId)` - should return:
  - `tier: 'free'`
  - `model: 'glm-4-flash'`
  - `saveHistory: false`
  - `apiKey: ZHIPU_API_FREE`

---

### Scenario 2: Immediate Cancellation (Within 48 Hours, High Usage)

**Setup:**
- User created subscription less than 48 hours ago
- User has used 50 messages
- Subscription status: 'active'

**Steps:**
1. User clicks "Cancel Subscription"
2. User confirms cancellation

**Expected Results:**
- [ ] HTTP 200 response
- [ ] `refund_status` set to 'requested'
- [ ] Subscription DELETED from database
- [ ] Response includes:
  - `refundInfo.fullyRefundable: false`
  - `refundInfo.refundPercentage: '99.XX%'` (calculated based on usage)
  - `refundInfo.daysOfQuotaUsed: 1` (50 messages / 100 per day)

**Post-Cancellation:**
- [ ] User immediately downgraded to free tier
- [ ] User cannot access glm-4.7 model

---

### Scenario 3: Immediate Cancellation (48 Hours - 7 Days)

**Setup:**
- User created subscription 3 days ago (72 hours)
- User has used any number of messages
- Subscription status: 'active'

**Steps:**
1. User clicks "Cancel Subscription"
2. User confirms cancellation

**Expected Results:**
- [ ] HTTP 200 response
- [ ] `refund_status` set to 'requested'
- [ ] Subscription DELETED from database
- [ ] Response includes:
  - `immediateCancellation: true`
  - No `refundInfo` object (not eligible for automatic refund)
  - Message about contacting support for refund consideration

**Post-Cancellation:**
- [ ] User immediately downgraded to free tier
- [ ] User can still use free tier (20 messages/day)

---

### Scenario 4: Blocked Cancellation (After 7 Days)

**Setup:**
- User created subscription 8 days ago
- Subscription status: 'active'

**Steps:**
1. User clicks "Cancel Subscription"
2. User confirms cancellation

**Expected Results:**
- [ ] HTTP 403 Forbidden response
- [ ] Response includes:
  - `error: 'Cancellation period expired'`
  - `message: "According to our refund policy, subscription cancellations must be submitted within 7 days of purchase. Your subscription was created 8 days ago."`
  - `policyUrl: '/refund'`
- [ ] NO changes to database (subscription remains active)
- [ ] User still has Pro access

**Frontend Behavior:**
- [ ] Alert shown with error message
- [ ] User returns to dashboard with subscription still active

---

### Scenario 5: getUserSubscription with refund_status

**Test 5.1: Active subscription, refund_status='none'**
```typescript
const result = await getUserSubscription(userId)
// Expected:
// - tier: 'pro'
// - model: 'glm-4.7'
// - saveHistory: true
```

**Test 5.2: Active subscription, refund_status='requested'**
```typescript
const result = await getUserSubscription(userId)
// Expected:
// - tier: 'free'
// - model: 'glm-4-flash'
// - saveHistory: false
```

**Test 5.3: Active subscription, refund_status='approved'**
```typescript
const result = await getUserSubscription(userId)
// Expected:
// - tier: 'free'
// - model: 'glm-4-flash'
// - saveHistory: false
```

**Test 5.4: Active subscription, refund_status='rejected'**
```typescript
const result = await getUserSubscription(userId)
// Expected:
// - tier: 'pro'
// - model: 'glm-4.7'
// - saveHistory: true
```

**Test 5.5: Cancelled subscription, refund_status='none'**
```typescript
const result = await getUserSubscription(userId)
// Expected:
// - tier: 'free'
// - model: 'glm-4-flash'
// - saveHistory: false
```

---

### Scenario 6: Chat Usage After Cancellation

**Setup:**
- User just cancelled subscription (within 48 hours)
- Database: subscription DELETED
- User tries to send a chat message

**Steps:**
1. User navigates to chat page
2. User sends a message

**Expected Results:**
- [ ] `getUserSubscription()` returns free tier
- [ ] Message sent using `ZHIPU_API_FREE` key
- [ ] Model used: `glm-4-flash`
- [ ] Daily limit: 20 messages
- [ ] Chat history NOT saved
- [ ] No error occurred

---

### Scenario 7: Dashboard Display After Cancellation

**Setup:**
- User just cancelled subscription
- User refreshes dashboard

**Expected Results:**
- [ ] No subscription card shown (because subscription deleted)
- [ ] Or card shows "Free Tier" status
- [ ] Usage meter shows 20/20 messages per day
- [ ] Model indicator shows "glm-4-flash"

---

## Regression Tests

### Test 8: New Subscription Still Works

**Steps:**
1. New user signs up
2. User purchases Pro subscription via Creem checkout
3. Webhook processes `checkout.completed` event

**Expected Results:**
- [ ] Subscription created in database
- [ ] `status: 'active'`
- [ ] `refund_status: 'none'` (default)
- [ ] `getUserSubscription()` returns pro tier
- [ ] User has access to glm-4.7

---

### Test 9: Subscription Renewal Still Works

**Steps:**
1. Active subscription approaches renewal date
2. Creem sends `subscription.paid` event
3. Webhook processes renewal

**Expected Results:**
- [ ] `current_period_end` updated to new date
- [ ] `status: 'active'` maintained
- [ ] `refund_status: 'none'` unchanged
- [ ] User continues to have Pro access

---

## Database Migration Verification

### Migration File: `supabase/migrations/YYYYMMDD_add_refund_status.sql`

```sql
-- Add refund_status column to subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none';

-- Add check constraint for valid values
ALTER TABLE public.subscriptions
ADD CONSTRAINT check_refund_status
CHECK (refund_status IN ('none', 'requested', 'approved', 'rejected', 'processed'));

-- Add comment for documentation
COMMENT ON COLUMN public.subscriptions.refund_status IS 'Tracks refund request status: none, requested, approved, rejected, processed';
```

**Verification Steps:**
1. [ ] Run migration in development environment
2. [ ] Verify column exists
3. [ ] Test inserting records with each refund_status value
4. [ ] Test that invalid values are rejected
5. [ ] Verify default value is 'none'

---

## Performance Tests

### Test 10: Multiple Concurrent Cancellations

**Setup:**
- 10 users cancel subscriptions simultaneously
- All within 48-hour window

**Expected Results:**
- [ ] All cancellations processed successfully
- [ ] All subscriptions deleted
- [ ] All refund_status set to 'requested' before deletion
- [ ] No race conditions
- [ ] No orphaned records

---

## Security Tests

### Test 11: Unauthorized Cancellation Attempts

**Test 11.1: Not logged in**
```bash
curl -X POST http://localhost:3000/api/subscription/cancel
# Expected: 401 Unauthorized
```

**Test 11.2: Wrong user**
```bash
# User A tries to cancel User B's subscription
# Expected: 404 Subscription not found (query filters by user_id)
```

---

## Manual Testing Checklist

### Pre-Test Setup
- [ ] Backup production database
- [ ] Run migration to add `refund_status` column
- [ ] Create test user accounts
- [ ] Set up Creem test environment

### Execute Tests
- [ ] Scenario 1: Immediate cancellation (≤48h, ≤5 messages)
- [ ] Scenario 2: Immediate cancellation (≤48h, >5 messages)
- [ ] Scenario 3: Immediate cancellation (48h-7d)
- [ ] Scenario 4: Blocked cancellation (>7d)
- [ ] Scenario 5: getUserSubscription refund_status checks
- [ ] Scenario 6: Chat usage after cancellation
- [ ] Scenario 7: Dashboard display after cancellation
- [ ] Scenario 8: New subscription creation
- [ ] Scenario 9: Subscription renewal
- [ ] Scenario 10: Concurrent cancellations
- [ ] Scenario 11: Security tests

### Post-Test Verification
- [ ] All test data cleaned up
- [ ] Database has no orphaned records
- [ ] No error logs in application
- [ ] Creem dashboard shows correct subscription states

---

## Success Criteria

✅ **All cancellations within 7 days result in immediate database deletion**
✅ **Users are immediately downgraded to free tier after cancellation**
✅ **Users cannot access Pro features after refund is requested**
✅ **Cancellation is blocked after 7 days with 403 error**
✅ **Refund calculation is correct for ≤48h cancellations**
✅ **Existing subscription flows (creation, renewal) are not affected**

---

## Rollback Plan

If critical issues are found:

1. **Revert API changes:**
   ```bash
   git revert <commit-hash>
   ```

2. **Database rollback:**
   ```sql
   ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS refund_status;
   ```

3. **Restore previous cancellation logic**
4. **Notify users of any service disruption**

---

## Test Data Setup Scripts

### Create Test Subscription
```sql
INSERT INTO public.subscriptions (
  user_id,
  creem_subscription_id,
  status,
  plan,
  interval,
  current_period_end,
  refund_status,
  created_at,
  updated_at
) VALUES (
  'test-user-id',
  'sub_test_123',
  'active',
  'pro',
  'month',
  NOW() + INTERVAL '30 days',
  'none',
  NOW(),
  NOW()
);
```

### Update Created Time for Testing
```sql
-- Set created_at to 24 hours ago (for ≤48h test)
UPDATE public.subscriptions
SET created_at = NOW() - INTERVAL '24 hours'
WHERE creem_subscription_id = 'sub_test_123';

-- Set created_at to 8 days ago (for >7d test)
UPDATE public.subscriptions
SET created_at = NOW() - INTERVAL '8 days'
WHERE creem_subscription_id = 'sub_test_123';
```

### Create Usage Records
```sql
-- Create 3 usage records (for ≤5 messages test)
INSERT INTO public.usage_records (user_id, message_type, timestamp)
SELECT 'test-user-id', 'user', NOW() - INTERVAL '1 hour' * generate_series(1,3);
```

---

## Notes

- All tests should be run in development/staging environment first
- Production deployment should be done during low-traffic hours
- Monitor error logs closely after deployment
- Have rollback plan ready before production deployment
- User communication should be prepared for any service issues
