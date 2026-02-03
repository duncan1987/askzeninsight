-- Migration: Add reminder_sent_at field to subscriptions table
-- Date: 2025-02-03
-- Description: Track when expiry reminder email was sent to prevent duplicate emails

-- Add reminder_sent_at column (nullable, timestamp)
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN public.subscriptions.reminder_sent_at IS 'Timestamp when the expiry reminder email was last sent. Used to prevent sending duplicate reminder emails for the same subscription period.';

-- Create index for efficient queries filtering by reminder_sent_at
CREATE INDEX IF NOT EXISTS subscriptions_reminder_sent_at_idx
ON public.subscriptions(reminder_sent_at)
WHERE reminder_sent_at IS NOT NULL;

-- Migration verification query (run this to verify the migration succeeded):
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'subscriptions' AND column_name = 'reminder_sent_at';
