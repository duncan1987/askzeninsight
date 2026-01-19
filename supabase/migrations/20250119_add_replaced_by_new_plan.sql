-- Migration: Add replaced_by_new_plan column to subscriptions table
-- Date: 2025-01-19
-- Description: Track subscriptions that were replaced by plan changes (annual <-> monthly)

-- Add replaced_by_new_plan column with default value false
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS replaced_by_new_plan BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.subscriptions.replaced_by_new_plan IS 'True if this subscription was replaced by a plan change (switching between annual and monthly). The subscription remains in the database to preserve user access until period_end, but is marked as cancelled.';

-- Create index for efficient queries on replaced subscriptions (optional, for reporting)
CREATE INDEX IF NOT EXISTS subscriptions_replaced_by_new_plan_idx
ON public.subscriptions(replaced_by_new_plan) WHERE replaced_by_new_plan = true;

-- Migration verification query (run this to verify the migration succeeded):
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'subscriptions' AND column_name = 'replaced_by_new_plan';
