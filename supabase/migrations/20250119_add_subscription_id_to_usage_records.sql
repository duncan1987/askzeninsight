-- Migration: Add subscription_id column to usage_records table
-- Date: 2025-01-19
-- Description: Track which subscription each message was sent under.
--              This ensures usage counters reset when users change plans (monthly <-> annual).

-- Add subscription_id column (nullable, references subscriptions table)
ALTER TABLE public.usage_records
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.usage_records.subscription_id IS 'ID of the subscription that was active when this message was sent. Used to reset usage counters when users change plans (monthly <-> annual). Each subscription has independent usage tracking.';

-- Create index for efficient queries filtering by subscription_id
CREATE INDEX IF NOT EXISTS usage_records_subscription_id_idx
ON public.usage_records(subscription_id);

-- Create composite index for efficient subscription+time queries
CREATE INDEX IF NOT EXISTS usage_records_subscription_timestamp_idx
ON public.usage_records(subscription_id, timestamp DESC)
WHERE subscription_id IS NOT NULL;

-- Migration verification query (run this to verify the migration succeeded):
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'usage_records' AND column_name = 'subscription_id';

-- Note: Existing usage records will have subscription_id = NULL.
-- This is expected behavior - they represent "legacy" usage before subscription tracking.
-- The system will handle NULL subscription_id correctly:
-- - Old records (NULL) are filtered out when filtering by specific subscription_id
-- - New records will have subscription_id populated
-- - Usage counters will effectively reset for users when they change plans
