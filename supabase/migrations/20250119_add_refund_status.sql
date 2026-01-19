-- Migration: Add refund_status column to subscriptions table
-- Date: 2025-01-19
-- Description: Tracks refund request status to prevent users from accessing Pro features after refund

-- Add refund_status column with default value 'none'
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none';

-- Add check constraint to ensure only valid values can be set
ALTER TABLE public.subscriptions
ADD CONSTRAINT check_refund_status
CHECK (refund_status IN ('none', 'requested', 'approved', 'rejected', 'processed'));

-- Add comment for documentation
COMMENT ON COLUMN public.subscriptions.refund_status IS 'Tracks refund request status: none (default), requested, approved, rejected, processed. When refund_status is set, users are immediately downgraded to free tier to prevent free Pro access after refund.';

-- Create index on refund_status for faster queries (optional but recommended for performance)
CREATE INDEX IF NOT EXISTS subscriptions_refund_status_idx ON public.subscriptions(refund_status);

-- Migration verification query (run this to verify the migration succeeded):
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'subscriptions' AND column_name = 'refund_status';
