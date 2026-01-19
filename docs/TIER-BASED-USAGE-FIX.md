# Tier-Based Usage Tracking Fix

## Problem

**Critical Bug:** The system was counting all messages in the last 24 hours regardless of the user's subscription tier at the time of sending.

### Impact

If a user:
1. Sends 7 messages as a **free user** (20/day limit)
2. Subscribes to **Pro** (100/day limit)
3. The system would show: **93 messages remaining** instead of **100**

**Result:** Users lost their free-tier usage quota when upgrading!

### Root Cause

The `usage_records` table structure:
```sql
CREATE TABLE usage_records (
  id UUID,
  user_id UUID,
  message_type TEXT,  -- 'user' or 'assistant'
  timestamp TIMESTAMP
  -- MISSING: No record of user's tier at time of sending!
)
```

The counting query:
```typescript
// ❌ WRONG: Counts all messages regardless of tier
await supabase
  .from('usage_records')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('message_type', 'user')
  .gte('timestamp', twentyFourHoursAgo)
```

---

## Solution

### 1. Database Schema Change

**Added `user_tier` column to `usage_records` table:**
```sql
ALTER TABLE usage_records
ADD COLUMN user_tier TEXT NOT NULL CHECK (user_tier IN ('anonymous', 'free', 'pro'));
```

**New structure:**
```sql
CREATE TABLE usage_records (
  id UUID,
  user_id UUID,
  message_type TEXT,
  user_tier TEXT,  -- 'anonymous', 'free', or 'pro'
  timestamp TIMESTAMP
)
```

### 2. Code Changes

#### `recordUsage()` Function
Now records the user's tier at message sending time:
```typescript
export async function recordUsage(userId: string | undefined, messageType: 'user' | 'assistant') {
  // Get user's current tier
  const subscription = await getUserSubscription(userId)
  const userTier = subscription.tier  // 'anonymous', 'free', or 'pro'

  const record = {
    user_id: userId || null,
    message_type: messageType,
    user_tier: userTier,  // ✅ Record tier at time of sending
    timestamp: new Date().toISOString(),
  }

  await supabase.from('usage_records').insert(record)
}
```

#### `checkUsageLimit()` Function
Now filters by current tier:
```typescript
export async function checkUsageLimit(userId?: string) {
  const subscription = await getUserSubscription(userId)
  const currentTier = subscription.tier

  // ✅ Only count messages sent at current tier level
  const { count } = await supabase
    .from('usage_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('message_type', 'user')
    .eq('user_tier', currentTier)  // Filter by tier!
    .gte('timestamp', twentyFourHoursAgo)

  return { canProceed, limit, remaining }
}
```

#### `getUsageStats()` Function
Same filtering applied:
```typescript
const { count } = await supabase
  .from('usage_records')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('message_type', 'user')
  .eq('user_tier', currentTier)  // Filter by tier!
  .gte('timestamp', twentyFourHoursAgo)
```

---

## Behavior After Fix

### Scenario 1: Free → Pro Upgrade

| Step | User Action | Messages Sent | Usage Count |
|------|-------------|---------------|-------------|
| 1 | Free user sends messages | 7 messages | **Free tier:** 7/20 used |
| 2 | User subscribes to Pro | - | **Free tier:** 7/20 (unchanged)<br>**Pro tier:** 0/100 ✅ |
| 3 | Pro user sends messages | 50 messages | **Pro tier:** 50/100 used ✅ |
| 4 | Check remaining | - | **Pro tier:** 50 remaining ✅ |

**Result:** User gets full 100 message Pro quota! ✅

### Scenario 2: Pro → Free Downgrade (Cancellation)

| Step | User Action | Messages Sent | Usage Count |
|------|-------------|---------------|-------------|
| 1 | Pro user sends messages | 50 messages | **Pro tier:** 50/100 used |
| 2 | User cancels subscription | - | **Pro tier:** 50/100 (historical)<br>**Free tier:** 0/20 ✅ |
| 3 | Free user sends messages | 5 messages | **Free tier:** 5/20 used ✅ |
| 4 | Check remaining | - | **Free tier:** 15 remaining ✅ |

**Result:** Previous Pro usage doesn't count against free tier! ✅

### Scenario 3: Anonymous → Authenticated

| Step | User Action | Messages Sent | Usage Count |
|------|-------------|---------------|-------------|
| 1 | Anonymous user sends messages | 5 messages | **Anonymous:** 5/20 used |
| 2 | User signs up/logs in | - | **Anonymous:** 5/20 (historical)<br>**Free tier:** 0/20 ✅ |
| 3 | Authenticated user sends messages | 10 messages | **Free tier:** 10/20 used ✅ |
| 4 | Check remaining | - | **Free tier:** 10 remaining ✅ |

**Result:** Anonymous usage doesn't count against authenticated user quota! ✅

---

## Migration Details

### File: `supabase/migrations/20250119_add_user_tier_to_usage_records.sql`

**Steps:**
1. Add `user_tier` column with default 'free'
2. Add check constraint for valid values
3. Create indexes for performance
4. **Migrate existing data:** Best-effort assignment based on subscription history
5. Set column to NOT NULL

**Data Migration Logic:**
- If user had active subscription at message time → `user_tier = 'pro'`
- If user was logged in → `user_tier = 'free'`
- If anonymous → `user_tier = 'anonymous'`

**Note:** Historical data migration is best-effort. Only new messages will have accurate tier tracking.

---

## Performance Considerations

### New Indexes

```sql
-- Simple index on user_tier
CREATE INDEX usage_records_user_tier_idx ON usage_records(user_tier);

-- Composite index for efficient tier+time queries
CREATE INDEX usage_records_user_tier_timestamp_idx
ON usage_records(user_id, user_tier, timestamp DESC);
```

**Query Performance:**
- Before: Full table scan on user_id + timestamp
- After: Index-only scan on user_id + user_tier + timestamp
- **Result:** Faster queries with less data scanned

---

## Testing

### Manual Test Scenarios

1. **Free user upgrades to Pro:**
   ```sql
   -- Send 5 messages as free user
   INSERT INTO usage_records (user_id, message_type, user_tier, timestamp)
   VALUES ('user123', 'user', 'free', NOW());

   -- Verify count
   SELECT user_tier, COUNT(*) FROM usage_records
   WHERE user_id = 'user123' AND timestamp > NOW() - INTERVAL '24 hours'
   GROUP BY user_tier;
   -- Expected: free: 5, pro: 0

   -- Upgrade to Pro (in app)
   -- Send 10 messages as Pro user
   -- Verify count
   -- Expected: free: 5, pro: 10
   ```

2. **Pro user downgrades to Free:**
   ```sql
   -- Send 20 messages as Pro user
   -- Cancel subscription
   -- Send 5 messages as Free user
   -- Verify: Pro tier shows 20, Free tier shows 5
   ```

3. **Anonymous user signs up:**
   ```sql
   -- Send 3 messages as anonymous (user_id = NULL)
   -- User signs up
   -- Send 5 messages as authenticated
   -- Verify: Anonymous shows 3, Free tier shows 5
   ```

### Unit Test

```typescript
describe('Tier-Based Usage Tracking', () => {
  it('should not count free-tier messages against pro quota', async () => {
    // User sends 5 messages as free tier
    for (let i = 0; i < 5; i++) {
      await recordUsage('user123', 'user')
    }

    // User upgrades to Pro
    await createSubscription('user123', 'pro')

    // Check usage
    const stats = await getUsageStats('user123')
    expect(stats.used).toBe(0)  // Pro tier should show 0 used!
    expect(stats.limit).toBe(100)
    expect(stats.remaining).toBe(100)
  })

  it('should not count pro-tier messages against free quota after downgrade', async () => {
    // Pro user sends 20 messages
    await createSubscription('user123', 'pro')
    for (let i = 0; i < 20; i++) {
      await recordUsage('user123', 'user')
    }

    // User cancels
    await cancelSubscription('user123')

    // Free user sends 5 messages
    for (let i = 0; i < 5; i++) {
      await recordUsage('user123', 'user')
    }

    // Check usage
    const stats = await getUsageStats('user123')
    expect(stats.used).toBe(5)  // Only free-tier messages counted!
    expect(stats.limit).toBe(20)
    expect(stats.remaining).toBe(15)
  })
})
```

---

## Rollback Plan

If issues are found:

1. **Revert code changes:**
   ```bash
   git revert <commit-hash>
   ```

2. **Drop new column (optional - old queries will ignore it):**
   ```sql
   ALTER TABLE usage_records DROP COLUMN IF EXISTS user_tier;
   DROP INDEX IF EXISTS usage_records_user_tier_idx;
   DROP INDEX IF EXISTS usage_records_user_tier_timestamp_idx;
   ```

3. **Restore old counting logic** (via code revert)

---

## Files Modified

| File | Changes | Lines Changed |
|------|---------|---------------|
| `supabase/schema.sql` | Added user_tier column | +1 |
| `lib/usage-limits.ts` | Updated recordUsage, checkUsageLimit, getUsageStats | +50 -20 |
| `supabase/migrations/20250119_add_user_tier_to_usage_records.sql` | New migration file | +60 |

---

## Success Criteria

✅ **Free-tier usage doesn't count against Pro quota**
✅ **Pro-tier usage doesn't count against Free quota after downgrade**
✅ **Anonymous usage doesn't count against authenticated user quota**
✅ **Query performance is maintained or improved**
✅ **Historical data is migrated (best-effort)**

---

## Notes

- Tier tracking is **per-message**, not per-session
- Old messages before migration will have estimated tier (free/pro based on subscription history)
- New messages will have accurate tier tracking
- Usage counters **reset** when tier changes (upgrade/downgrade/login)
- This is the **expected and correct behavior** - users should not be penalized for past usage at different tier levels
