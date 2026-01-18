-- Migration: Add interval column to subscriptions table
-- Run this in Supabase SQL Editor

-- Add interval column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions'
    AND column_name = 'interval'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN interval TEXT;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.subscriptions.interval IS 'Billing interval: month or year';

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subscriptions'
AND table_schema = 'public'
ORDER BY ordinal_position;
