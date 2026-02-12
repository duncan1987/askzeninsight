# Plan Change Bug Fix

## Critical Bug: Users Lose Access When Switching Plans

### Problem Scenario

**User Action:**
1. Free user subscribes to **Annual plan** ($24.99/year, 365 days)
2. Sends **5 messages** as Pro user (5/100 used)
3. Clicks **"Switch to Monthly"** to change to **Monthly plan** ($2.99/month)

**Expected Behavior:**
- ✅ User should continue having Pro access until Annual subscription period ends
- ✅ User's 5 messages should not count against new Monthly plan quota
- ✅ New Monthly plan should start after checkout completes
- ✅ No service interruption

**Actual Behavior (BEFORE FIX):**
- ❌ Annual subscription was deleted from database immediately
- ❌ User loses Pro access right away
- ❌ `getUserSubscription()` returns `tier: 'free'`
- ❌ User gets error: "You're on free tier (20 messages/day)"
- ❌ User cannot use chat until new Monthly subscription is created
- ❌ **Service interruption during plan change!**

---

## Root Cause

### Old Code (WRONG)

**File: `app/api/subscription/change-plan/route.ts`**

```typescript
// 1. Cancel in Creem with mode: 'scheduled'
await cancelSubscription({
  subscriptionId: activeSubscription.creem_subscription_id,
  mode: 'scheduled',  // Keep until period end in Creem
})

// 2. DELETE subscription from database ❌ WRONG!
await adminClient
  .from('subscriptions')
  .delete()
  .eq('id', activeSubscription.id)

// 3. Redirect to checkout
```

### Why This Was Wrong

1. **Inconsistent cancellation modes:**
   - Plan change: `mode: 'scheduled'` (keep in Creem)
   - User cancellation: `mode: 'immediate'` (cancel in Creem immediately)
   - Both deleted from database, but different behavior in Creem!

2. **Database deletion broke access:**
   - After deletion, `getUserSubscription()` finds NO subscriptions
   - Returns `tier: 'free'` instead of `tier: 'pro'`
   - User loses access even though Annual subscription has 364 days left!

3. **User experience:**
   ```
   Time 0: User has Annual subscription (364 days remaining)
   Time 0: User clicks "Switch to Monthly"
   Time 0: Annual subscription deleted from DB ❌
   Time 0: getUserSubscription() returns tier='free' ❌
   Time 0: User redirected to checkout
   Time 10s: User completes checkout for Monthly plan
   Time 11s: Webhook creates new Monthly subscription
   Time 11s: getUserSubscription() returns tier='pro' ✅
   ```

   **Result:** 11 seconds of service interruption (or more if checkout takes longer!)

---

## Solution

### New Code (CORRECT)

```typescript
// 1. Cancel in Creem with mode: 'immediate' (consistent with user cancellation)
await cancelSubscription({
  subscriptionId: activeSubscription.creem_subscription_id,
  mode: 'immediate',  // Cancel immediately in Creem
})

// 2. UPDATE subscription status (DO NOT DELETE!) ✅
await adminClient
  .from('subscriptions')
  .update({
    status: 'cancelled',
    cancel_at_period_end: true,
    replaced_by_new_plan: true,  // Mark as being replaced
    updated_at: new Date().toISOString(),
  })
  .eq('id', activeSubscription.id)

// 3. Redirect to checkout
```

### Why This Works

1. **Consistent cancellation mode:**
   - Now uses `mode: 'immediate'` for both plan changes and user cancellations
   - Uniform behavior across all cancellation scenarios

2. **Database update preserves access:**
   - Annual subscription remains in database
   - `getUserSubscription()` query finds it:
     ```typescript
     .in('status', ['active', 'cancelled', 'canceled'])  // ✅ Includes 'cancelled'
     .gte('current_period_end', now)  // ✅ Within period
     ```
   - Returns `tier: 'pro'` because subscription is still valid
   - User keeps Pro access until new subscription is created

3. **Smooth user experience:**
   ```
   Time 0: User has Annual subscription (364 days remaining)
   Time 0: User clicks "Switch to Monthly"
   Time 0: Annual subscription marked as cancelled (kept in DB) ✅
   Time 0: getUserSubscription() returns tier='pro' ✅
   Time 0: User redirected to checkout (can still use chat in background tab)
   Time 10s: User completes checkout for Monthly plan
   Time 11s: Webhook creates new Monthly subscription
   Time 11s: New subscription becomes the active one ✅
   ```

   **Result:** No service interruption! ✅

---

## Database Schema Changes

### Added `replaced_by_new_plan` Column

**File: `supabase/schema.sql`**

```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID,
  creem_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  plan TEXT,
  interval TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  refund_status TEXT DEFAULT 'none',
  replaced_by_new_plan BOOLEAN DEFAULT false,  -- ✅ NEW
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

**Purpose:**
- Track subscriptions that were replaced by plan changes
- Distinguish from user-initiated cancellations
- Useful for analytics and reporting

---

## Updated Flow Diagrams

### Annual → Monthly Switch

```
┌─────────────────────────────────────────────────────────────┐
│ User has Annual subscription (365 days, 5 messages used)    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Switch to Monthly Pro" button                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ POST /api/subscription/change-plan { newPlan: 'pro' }      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─────────────────────────────────┐
                            ▼                                 ▼
┌─────────────────────────────────────┐   ┌──────────────────────────────────┐
│ Creem: Cancel Annual subscription   │   │ Database: UPDATE subscription     │
│ mode: 'immediate'                   │   │   status='cancelled'              │
│                                    │   │   cancel_at_period_end=true       │
│                                    │   │   replaced_by_new_plan=true       │
│                                    │   │   (KEEPS RECORD IN DB!)          │
└─────────────────────────────────────┘   └──────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Response: { success: true, canSubscribeNow: true }         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ POST /api/creem/checkout { plan: 'pro' }                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Redirect user to Creem checkout page                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ User completes payment for Monthly plan                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Creem sends webhook: checkout.completed                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Webhook handler creates NEW Monthly subscription in DB      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ getUserSubscription()                                       │
│   → Finds BOTH subscriptions                                │
│   → Orders by created_at DESC                               │
│   → Returns NEWEST subscription (Monthly)                  │
│   → tier: 'pro', model: 'glm-4.7'                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ User now has Monthly subscription (30 days, 0 messages)    │
│ Old Annual subscription: cancelled but preserved in DB      │
└─────────────────────────────────────────────────────────────┘
```

---

## Behavior After Fix

### Scenario: Annual → Monthly

| Step | Action | Database State | getUserSubscription | User Access |
|------|--------|----------------|---------------------|-------------|
| 1 | User has Annual sub | 1 Annual (active) | Returns Annual | Pro ✅ |
| 2 | Click "Switch to Monthly" | 1 Annual (cancelled, replaced=true) | Returns Annual (still in period) | Pro ✅ |
| 3 | Redirected to checkout | 1 Annual (cancelled) | Returns Annual | Pro ✅ |
| 4 | Complete checkout | 1 Annual (cancelled) + 1 Monthly (active) | Returns Monthly (newest) | Pro ✅ |
| 5 | Send message | Usage recorded with tier='pro' | Monthly: 1/100 | Pro ✅ |

**Key Point:** User maintains Pro access throughout the entire process! ✅

### Old Annual Subscription Usage

- Old Annual subscription messages: **5 used**
- These are recorded with `user_tier='pro'`
- When new Monthly subscription is created, message counter resets to 0
- User gets full 100 messages for the new Monthly plan ✅

This is correct behavior because:
- User is paying for a new subscription period
- Old usage shouldn't count against new quota
- Each subscription is independent

---

## Testing

### Manual Test Case

1. **Setup:**
   ```sql
   -- Create Annual subscription
   INSERT INTO subscriptions (
     user_id, creem_subscription_id, status, plan, interval,
     current_period_end, created_at, updated_at
   ) VALUES (
     'user123', 'sub_annual_123', 'active', 'annual', 'year',
     NOW() + INTERVAL '365 days',
     NOW() - INTERVAL '1 day', NOW()
   );
   ```

2. **Test:**
   - User sends 5 messages (verify usage: 5/100, tier='pro')
   - User clicks "Switch to Monthly"
   - Verify Annual subscription status changes to 'cancelled'
   - Verify Annual subscription still in database
   - Verify user still has Pro access (tier='pro')
   - Complete Monthly checkout
   - Verify new Monthly subscription created
   - Verify message counter: 0/100 (reset)

3. **Expected:**
   - ✅ No interruption in service
   - ✅ User always sees Pro tier
   - ✅ Message usage resets after new subscription

---

## Migration Details

### File: `supabase/migrations/20250119_add_replaced_by_new_plan.sql`

**Steps:**
1. Add `replaced_by_new_plan` column with default `false`
2. Add comment for documentation
3. Create index for efficient queries (optional)

**Backward Compatible:**
- Existing subscriptions: `replaced_by_new_plan = false` (default)
- New replaced subscriptions: `replaced_by_new_plan = true`
- No impact on existing functionality

---

## Files Modified

| File | Changes | Lines Changed |
|------|---------|---------------|
| `app/api/subscription/change-plan/route.ts` | Changed from DELETE to UPDATE, changed mode from 'scheduled' to 'immediate' | +25 -40 |
| `supabase/schema.sql` | Added replaced_by_new_plan column | +1 |
| `supabase/migrations/20250119_add_replaced_by_new_plan.sql` | New migration file | +20 |

---

## Success Criteria

✅ **No service interruption during plan change**
✅ **User maintains Pro access throughout entire process**
✅ **Old subscription preserved in database until period ends**
✅ **Message usage resets for new subscription**
✅ **Consistent cancellation mode across all scenarios**

---

## Related Fixes

This fix is related to:
1. **Immediate cancellation logic** (commit `85ef6dd`)
2. **Tier-based usage tracking** (commit `74a93e9`)

All three fixes ensure:
- Users don't lose access they've paid for
- Usage tracking is accurate and fair
- System behavior is consistent

---

## Rollback Plan

If issues are found:

1. **Revert code changes:**
   ```bash
   git revert <commit-hash>
   ```

2. **Drop new column (optional):**
   ```sql
   ALTER TABLE subscriptions DROP COLUMN IF EXISTS replaced_by_new_plan;
   DROP INDEX IF EXISTS subscriptions_replaced_by_new_plan_idx;
   ```

3. **Restore old logic** (via code revert)

---

## Notes

- The `replaced_by_new_plan` flag is primarily for analytics and debugging
- It doesn't affect the core logic (status='cancelled' is sufficient)
- Future enhancements could include:
  - Reporting on plan change frequency
  - Analytics on user plan preferences
  - Automated cleanup of very old replaced subscriptions
