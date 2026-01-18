# Model Display Bug Fix

## Problem

**Issue**: Subscribed users were seeing incorrect model information in the chat interface.

**Observed Behavior**:
- Expected: "Pro • glm-4.7"
- Actual: "Free • glm-4-flash"

**Impact**: Users who paid for Pro/Annual subscriptions were not seeing the correct model indication, making it unclear they had premium access.

## Root Cause Analysis

The bug was in the `getUserSubscription()` function in `lib/subscription.ts`.

### Original Code Issues

1. **Used `.maybeSingle()`**:
   ```typescript
   const { data: subscription, error } = await supabase
     .from('subscriptions')
     .select('status, current_period_end, plan')
     .eq('user_id', userId)
     .in('status', ['active', 'cancelled', 'canceled'])
     .gte('current_period_end', new Date().toISOString())
     .maybeSingle() // ❌ Problem: only gets one record
   ```

   Problem: If user had multiple subscription records (e.g., old cancelled + new active), it would return a random one, possibly the cancelled one.

2. **Did not check `cancel_at_period_end`**:
   - A subscription with `status='active'` but `cancel_at_period_end=true` is scheduled to cancel
   - The code didn't distinguish between truly active and scheduled-to-cancel subscriptions

3. **Implicit date comparison**:
   ```typescript
   const isPro = subscription && ['active', 'cancelled', 'canceled'].includes(subscription.status)
   ```
   - Only checked status field
   - Did not explicitly verify that `current_period_end >= now`

### Why This Happened

When users upgraded from Monthly to Annual:
1. Old monthly subscription: `status='active'`, `cancel_at_period_end=true`
2. New annual subscription: `status='active'`, `cancel_at_period_end=false`
3. The `.maybeSingle()` query might return either record
4. If it returned the monthly subscription, the code would still see it as "active"
5. But depending on how the comparison logic worked, it might fail the `isPro` check

## Solution

### Fixed Code

```typescript
// Get ALL subscriptions for the user, ordered by creation date
const { data: subscriptions, error } = await supabase
  .from('subscriptions')
  .select('status, current_period_end, plan, cancel_at_period_end')
  .eq('user_id', userId)
  .in('status', ['active', 'cancelled', 'canceled'])
  .gte('current_period_end', now)
  .order('created_at', { ascending: false }) // ✅ Get all, newest first

// Find the most recent subscription that is actually active
const subscription = subscriptions?.find(sub =>
  sub.status === 'active' && !sub.cancel_at_period_end // ✅ Filter out scheduled cancellations
) || subscriptions?.[0] // Fallback to first if none fully active

// Explicit date comparison
const isPro = subscription &&
  ['active', 'cancelled', 'canceled'].includes(subscription.status) &&
  new Date(subscription.current_period_end) >= new Date(now) // ✅ Explicit check
```

### Key Improvements

1. **Fetch all subscriptions**: Changed from `.maybeSingle()` to `.order()` to get all records
2. **Smart filtering**: Find the most recent subscription that's actually active (not scheduled to cancel)
3. **Explicit date comparison**: Verify that `current_period_end >= now` using Date objects
4. **Added cancel_at_period_end to query**: Include this field in selection for filtering
5. **Comprehensive debug logging**: Added detailed logs for troubleshooting

### Debug Logs Added

```typescript
console.log('[getUserSubscription] userId:', userId)
console.log('[getUserSubscription] query time:', now)
console.log('[getUserSubscription] subscriptions error:', error)
console.log('[getUserSubscription] subscriptions data:', subscriptions)
console.log('[getUserSubscription] selected subscription:', subscription)
console.log('[getUserSubscription] isPro check:', {
  hasSubscription: !!subscription,
  status: subscription?.status,
  cancelAtPeriodEnd: subscription?.cancel_at_period_end,
  periodEnd: subscription?.current_period_end,
  now: now,
  periodEndAfterNow: subscription ? new Date(subscription.current_period_end) >= new Date(now) : false
})
```

These logs help diagnose issues by showing:
- What subscriptions were found
- Which one was selected
- Why it was or wasn't considered "Pro"

## Testing

### Test Scenarios

1. **Free User (No Subscription)**:
   - Expected Display: "Free • glm-4-flash"
   - Expected Model: `glm-4-flash`
   - Expected API Key: `ZHIPU_API_FREE`

2. **Pro Monthly Subscriber**:
   - Expected Display: "Pro • glm-4.7"
   - Expected Model: `glm-4.7`
   - Expected API Key: `ZHIPU_API_KEY`

3. **Annual Subscriber**:
   - Expected Display: "Pro • glm-4.7"
   - Expected Model: `glm-4.7`
   - Expected API Key: `ZHIPU_API_KEY`

4. **Cancelled Subscription (Still Active)**:
   - User cancelled but period hasn't ended
   - Expected Display: "Pro • glm-4.7" (still has access)
   - Expected Model: `glm-4.7`

5. **Expired Subscription**:
   - Period has ended
   - Expected Display: "Free • glm-4-flash"
   - Expected Model: `glm-4-flash`

6. **Plan Change (Monthly → Annual)**:
   - User had monthly, upgraded to annual
   - Expected Display: "Pro • glm-4.7" (shows annual subscription)
   - Expected Model: `glm-4.7`

### How to Test

1. **Check Vercel Logs**:
   - Go to Vercel Dashboard
   - View deployment logs
   - Look for `[getUserSubscription]` log entries
   - Verify the debug output shows correct subscription detection

2. **Browser Testing**:
   - Open chat interface
   - Look at top-right corner badge
   - Verify correct tier and model displayed

3. **API Testing**:
   ```bash
   # Get user tier info
   curl https://zeninsight.xyz/api/user/tier \
     -H "Authorization: Bearer <token>"

   # Expected response for subscriber:
   {
     "tier": "pro",
     "model": "glm-4.7",
     "saveHistory": true,
     "authenticated": true
   }
   ```

## Related Files

- `lib/subscription.ts` - Core subscription detection logic
- `app/api/user/tier/route.ts` - API endpoint that uses getUserSubscription
- `components/chat-interface.tsx` - Displays model name to users
- `app/api/chat/route.ts` - Uses subscription info to select model

## Prevention

To prevent similar issues in the future:

1. **Always use explicit comparisons**:
   - Don't rely on truthy/falsy checks alone
   - Use explicit date/time comparisons

2. **Handle multiple records**:
   - Don't assume `.single()` or `.maybeSingle()` is enough
   - Consider ordering and filtering when there could be multiple matches

3. **Add comprehensive logging**:
   - Log query conditions, results, and decision logic
   - Include intermediate values in logs

4. **Test edge cases**:
   - Plan upgrades/downgrades
   - Cancelled subscriptions
   - Expired subscriptions
   - Multiple subscriptions per user

## Rollback Plan

If this fix causes issues:

1. Revert commit `575ebde`
2. Redeploy to Vercel
3. Previous behavior will be restored (but with the bug)

## Deployment

- **Commit**: `575ebde`
- **Status**: Deployed to Vercel
- **Action Required**: Test with a real subscriber account
