-- Add column to track if subscription is scheduled to cancel at period end
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.subscriptions.cancel_at_period_end IS 'True if subscription is scheduled to cancel at the end of the current billing period';
