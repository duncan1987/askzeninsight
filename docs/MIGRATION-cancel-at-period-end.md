# Database Migration Guide

## Adding `cancel_at_period_end` Column

This migration adds a new column to track whether a subscription is scheduled to cancel at the end of the billing period.

### What This Fixes

**Before:** When users cancelled their subscription, the status remained `active` and the "Cancel" button was still visible, causing confusion.

**After:** When a subscription is cancelled, we set `cancel_at_period_end = true` so the UI can properly show it as "Cancelled" while still allowing access until the period ends.

### How to Apply

#### Option 1: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Paste the following SQL:

```sql
-- Add column to track if subscription is scheduled to cancel at period end
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.subscriptions.cancel_at_period_end IS 'True if subscription is scheduled to cancel at the end of the current billing period';
```

6. Click **Run** (or press Ctrl+Enter)

#### Option 2: Via Migration File

The migration file is located at:
```
supabase/migrations/add_cancel_at_period_end.sql
```

You can apply it using the Supabase CLI:
```bash
supabase db push
```

### Verify the Migration

Run this query to verify the column was added:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name = 'cancel_at_period_end';
```

Expected result:
```
column_name              | data_type | column_default
-------------------------|-----------|----------------
cancel_at_period_end     | boolean   | false
```

### Update Existing Data (Optional)

If you have existing subscriptions that were cancelled but not marked, you can update them:

```sql
-- For subscriptions that are active but past their period end
-- Mark them appropriately
UPDATE public.subscriptions
SET cancel_at_period_end = true
WHERE status = 'active'
  AND current_period_end < NOW();

-- Note: This is just an example. Adjust based on your needs.
```

### Rollback (If Needed)

To remove this column:

```sql
ALTER TABLE public.subscriptions
DROP COLUMN IF EXISTS cancel_at_period_end;
```

---

## Next Steps

After applying the migration:
1. ✅ Test the cancellation flow
2. ✅ Verify the Dashboard shows correct status
3. ✅ Confirm Cancel button is hidden for cancelled subscriptions
4. ✅ Check email notifications are sent

---

## Questions?

If you encounter any issues, check:
- Supabase Dashboard → Database → Logs
- Vercel Dashboard → Logs
- Database schema matches the expected structure
