-- Migration: Add user_tier column to usage_records table
-- Date: 2025-01-19
-- Description: Track the user's tier at the time of message sending to prevent
--              free-tier usage from counting against pro-tier quota

-- Add user_tier column with default value 'free'
ALTER TABLE public.usage_records
ADD COLUMN IF NOT EXISTS user_tier TEXT NOT NULL DEFAULT 'free';

-- Add check constraint for valid values
ALTER TABLE public.usage_records
ADD CONSTRAINT check_user_tier
CHECK (user_tier IN ('anonymous', 'free', 'pro'));

-- Add comment for documentation
COMMENT ON COLUMN public.usage_records.user_tier IS 'User tier at time of message: anonymous (not logged in), free (logged in, no subscription), pro (active subscription). Usage limits are calculated separately for each tier.';

-- Create index for better query performance (used for tier-based filtering)
CREATE INDEX IF NOT EXISTS usage_records_user_tier_idx ON public.usage_records(user_tier);

-- Create composite index for efficient tier+time queries
CREATE INDEX IF NOT EXISTS usage_records_user_tier_timestamp_idx ON public.usage_records(user_id, user_tier, timestamp DESC);

-- Migrate existing data: For records without subscription context, assume 'free'
-- For records that have a corresponding active subscription, assume 'pro'
-- Note: This is a best-effort migration for historical data
UPDATE public.usage_records u
SET user_tier = CASE
  WHEN EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = u.user_id
      AND s.status = 'active'
      AND u.timestamp >= s.created_at
      AND u.timestamp < COALESCE(
        (SELECT updated_at FROM public.subscriptions s2
         WHERE s2.user_id = u.user_id
           AND s2.status IN ('cancelled', 'canceled')
           AND s2.updated_at > u.timestamp
         LIMIT 1),
        s.current_period_end
      )
  ) THEN 'pro'
  WHEN u.user_id IS NOT NULL THEN 'free'
  ELSE 'anonymous'
END
WHERE user_tier = 'free';  -- Only update rows that still have the default

-- Set column to NOT NULL (PostgreSQL requires this to be done separately)
ALTER TABLE public.usage_records
ALTER COLUMN user_tier SET NOT NULL;

-- Migration verification query (run this to verify the migration succeeded):
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'usage_records' AND column_name = 'user_tier';
--
-- Also verify data distribution:
-- SELECT user_tier, COUNT(*) as count
-- FROM public.usage_records
-- GROUP BY user_tier;
