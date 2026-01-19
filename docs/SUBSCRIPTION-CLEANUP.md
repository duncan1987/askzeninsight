# Subscription Cleanup - Implementation Documentation

## Overview

This document describes the implementation of automatic subscription cleanup to prevent database clutter and user confusion when users upgrade plans or cancel subscriptions.

## Problem Statement

### Original Behavior (Before Fix)

When users performed plan changes and cancellations, multiple subscription records would accumulate in the database, all marked with `cancel_at_period_end=true`:

**Scenario Example**:
```
Step 1: User subscribes to Monthly plan
→ subscription_1 created (status='active', cancel_at_period_end=false)

Step 2: User upgrades to Annual plan
→ subscription_1 updated (status='active', cancel_at_period_end=true)
→ subscription_2 created (status='active', cancel_at_period_end=false)

Step 3: User cancels subscription
→ subscription_2 updated (status='active', cancel_at_period_end=true)

Result: TWO subscriptions with cancel_at_period_end=true
```

**Issues**:
- Database contains multiple obsolete subscriptions
- Dashboard query returns multiple records
- User confusion: "Why do I have multiple cancelled subscriptions?"
- Complex logic needed to determine "active" subscription
- Debugging becomes difficult

### User-Reported Issue

User followed these steps:
1. Subscribed to Monthly plan
2. Upgraded to Annual plan
3. Sent 6 messages in chat
4. Cancelled subscription

**Observed Result**:
```
Database: 2 subscriptions, both with cancel_at_period_end=true
Dashboard: Shows "Cancelled" with access until 2027/1/18
```

**User Feedback**: "这个逻辑有问题吧" (This logic seems wrong)

## Solution Implemented

### Strategy: Delete Instead of Mark

The core principle: **One subscription per user at a time**

Instead of marking old subscriptions as `cancel_at_period_end=true`, we **DELETE** them from the database.

### Implementation 1: Plan Upgrade (change-plan API)

**File**: `app/api/subscription/change-plan/route.ts`

**Before**:
```typescript
// Mark old subscription as scheduled to cancel
await adminClient
  .from('subscriptions')
  .update({ cancel_at_period_end: true })
  .eq('id', activeSubscription.id)
```

**After**:
```typescript
// 1. Cancel in Creem first
await cancelSubscription({
  subscriptionId: activeSubscription.creem_subscription_id,
  mode: 'scheduled',
})

// 2. DELETE from database (not update)
await adminClient
  .from('subscriptions')
  .delete()
  .eq('id', activeSubscription.id)

console.log('[Change Plan] Old subscription deleted successfully from database')
```

**Why This Order**:
1. Cancel in Creem first → stops future charges
2. Delete from database → keeps data clean
3. User still has access until period end (Creem tracks this)

**Result After Upgrade**:
- Before: 2 subscriptions (old Monthly + new Annual)
- After: 1 subscription (Annual only)

### Implementation 2: Subscription Cancellation (cancel API)

**File**: `app/api/subscription/cancel/route.ts`

**Added Cleanup Step**:
```typescript
// After marking current subscription as cancelled
await adminClient
  .from('subscriptions')
  .update({ cancel_at_period_end: true })
  .eq('id', subscription.id)

// CLEANUP: Delete old subscriptions
const { error: cleanupError } = await adminClient
  .from('subscriptions')
  .delete()
  .eq('user_id', user.id)
  .eq('cancel_at_period_end', true)
  .neq('id', subscription.id) // Don't delete the one we just updated

if (!cleanupError) {
  console.log('[Cancel Subscription] Cleaned up old subscriptions')
}
```

**What This Does**:
1. Marks current subscription as cancelled
2. Deletes ALL old subscriptions with `cancel_at_period_end=true`
3. Excludes the subscription we just cancelled
4. Result: Only the current subscription remains

**Result After Cancellation**:
- Before: Multiple subscriptions (current + old cancelled ones)
- After: 1 subscription (the current one, marked as cancelled)

## Benefits

### 1. Clean Database
- One subscription per user
- No accumulation of obsolete records
- Simpler queries

### 2. Clear User Experience
- Dashboard shows one clear subscription
- No confusion from multiple "cancelled" entries
- Status is unambiguous

### 3. Easier Debugging
- Can query `/api/debug/subscriptions-detail` and see one record
- No need to filter through old subscriptions
- Clear subscription history

### 4. Better Performance
- Fewer database records
- Simpler queries (no need for complex filtering)
- Faster dashboard loading

## User Flow Examples

### Example 1: New Subscription
```
Action: User subscribes to Monthly
Result: 1 subscription (Monthly, active)
```

### Example 2: Plan Upgrade
```
Before: 1 subscription (Monthly, active)
Action: User upgrades to Annual
Process:
  1. Cancel Monthly in Creem
  2. DELETE Monthly from database
  3. Create Annual subscription via webhook
After: 1 subscription (Annual, active)
```

### Example 3: Cancellation
```
Before: 1 subscription (Annual, active)
Action: User cancels subscription
Process:
  1. Cancel Annual in Creem
  2. Mark Annual as cancel_at_period_end=true
  3. No old subscriptions to clean up (none exist)
After: 1 subscription (Annual, cancel_at_period_end=true)
```

### Example 4: Upgrade Then Cancel
```
Step 1: Subscribe to Monthly
→ 1 subscription (Monthly, active)

Step 2: Upgrade to Annual
→ 1 subscription (Annual, active) ← Monthly DELETED

Step 3: Cancel subscription
→ 1 subscription (Annual, cancel_at_period_end=true)

Final State: 1 subscription
```

## Technical Details

### Database State

**Active User**:
```sql
SELECT * FROM subscriptions WHERE user_id = 'xxx';
-- Returns: 1 row (the current subscription)
```

**User After Upgrade**:
```sql
SELECT * FROM subscriptions WHERE user_id = 'xxx';
-- Returns: 1 row (the new plan, old one deleted)
```

**User After Cancellation**:
```sql
SELECT * FROM subscriptions WHERE user_id = 'xxx';
-- Returns: 1 row (marked as cancel_at_period_end=true)
```

### Dashboard Query

Dashboard uses this query (from `app/dashboard/page.tsx`):
```typescript
supabase
  .from('subscriptions')
  .select('*')
  .eq('user_id', user.id)
  .in('status', ['active', 'cancelled', 'canceled'])
  .gte('current_period_end', new Date().toISOString())
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()
```

**Before Fix**: Could return wrong subscription if multiple exist
**After Fix**: Always returns the correct one (only one exists)

### Webhook Handling

Webhooks still create/update subscriptions based on `creem_subscription_id`:
```typescript
.onConflict: 'creem_subscription_id')
```

This works because:
- Each Creem subscription has unique ID
- Old subscription is deleted before new one is created
- No conflict on `creem_subscription_id`

## Testing

### Manual Test Scenarios

#### Scenario 1: Simple Subscription
1. Subscribe to Monthly plan
2. Check `/api/debug/subscriptions-detail`
3. ✅ Should show: 1 subscription (Monthly, active)

#### Scenario 2: Plan Upgrade
1. Subscribe to Monthly plan
2. Upgrade to Annual plan
3. Check `/api/debug/subscriptions-detail`
4. ✅ Should show: 1 subscription (Annual, active)
5. ❌ Should NOT show: Monthly subscription

#### Scenario 3: Cancellation
1. Subscribe to Annual plan
2. Cancel subscription
3. Check `/api/debug/subscriptions-detail`
4. ✅ Should show: 1 subscription (Annual, cancel_at_period_end=true)
5. ✅ Dashboard shows: "Cancelled" with access date

#### Scenario 4: Upgrade Then Cancel
1. Subscribe to Monthly
2. Upgrade to Annual
3. Cancel subscription
4. Check `/api/debug/subscriptions-detail`
5. ✅ Should show: 1 subscription (Annual, cancel_at_period_end=true)
6. ❌ Should NOT show: Monthly subscription

### Automated Tests

Consider adding tests in `tests/` directory:
```typescript
describe('Subscription Cleanup', () => {
  it('should delete old subscription when upgrading', async () => {
    // Subscribe to Monthly
    // Upgrade to Annual
    // Verify only Annual exists
    // Verify Monthly is deleted
  })

  it('should clean up old subscriptions on cancel', async () => {
    // Create multiple old subscriptions
    // Cancel current subscription
    // Verify old ones are deleted
    // Verify only current one remains
  })
})
```

## Debugging Tools

### API Endpoint

Use `/api/debug/subscriptions-detail` to inspect subscription state:

**Request**:
```bash
curl https://zeninsight.xyz/api/debug/subscriptions-detail \
  -H "Cookie: <session-cookie>"
```

**Response**:
```json
{
  "userId": "uuid",
  "userEmail": "user@example.com",
  "totalSubscriptions": 1,
  "subscriptions": [
    {
      "id": "uuid",
      "plan": "annual",
      "status": "active",
      "cancel_at_period_end": false,
      "analysis": {
        "isActive": true,
        "interpretation": "ACTIVE - Currently in use"
      }
    }
  ],
  "dashboardWouldShow": { ... }
}
```

### Database Query

Run directly in Supabase SQL Editor:
```sql
-- Check user's subscriptions
SELECT
  id,
  plan,
  status,
  cancel_at_period_end,
  created_at,
  current_period_end
FROM subscriptions
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;

-- Should return: 1 row for active users
```

## Rollback Plan

If issues occur, revert commit `088bc64`:

```bash
git revert 088bc64
git push origin main
```

**Note**: Reverting will restore old behavior (mark instead of delete).

## Related Files

- `app/api/subscription/change-plan/route.ts` - Plan upgrade logic
- `app/api/subscription/cancel/route.ts` - Cancellation logic
- `app/api/debug/subscriptions-detail/route.ts` - Debug tool
- `app/dashboard/page.tsx` - Dashboard display
- `components/subscription-status-card.tsx` - Status display component

## Future Improvements

### Potential Enhancements

1. **Soft Delete**: Add `deleted_at` timestamp instead of hard delete
   - Allows audit trail
   - Can restore if needed
   - Requires query filtering

2. **Archive Table**: Move old subscriptions to archive table
   - Keep historical data
   - Don't clutter main table
   - Useful for analytics

3. **Automatic Cleanup Cron Job**: Periodically clean up old subscriptions
   - Run daily/weekly
   - Delete subscriptions expired > 30 days ago
   - Additional safety layer

4. **Subscription History Table**: Track all subscription changes
   - Store history of plan changes
   - Useful for analytics
   - Keep main table clean

## Summary

This fix implements automatic subscription cleanup:

**Plan Upgrade**:
- Old subscription: DELETED from database
- New subscription: Created
- Result: One subscription in database

**Cancellation**:
- Current subscription: Marked as `cancel_at_period_end=true`
- Old subscriptions with `cancel_at_period_end=true`: DELETED
- Result: One subscription in database

**Benefits**:
- Clean database
- Clear UX
- Easier debugging
- Better performance

**Deployment**: ✅ Deployed (commit `088bc64`)
**Status**: ✅ Ready for testing
