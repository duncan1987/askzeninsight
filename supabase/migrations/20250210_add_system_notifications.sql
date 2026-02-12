-- Create system_notifications table for admin announcements
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'announcement')),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create simple index for active notifications (without WHERE clause)
CREATE INDEX IF NOT EXISTS system_notifications_active_idx ON public.system_notifications(is_active, expires_at);

-- Create index for expiration
CREATE INDEX IF NOT EXISTS system_notifications_expires_at_idx ON public.system_notifications(expires_at);

-- Enable RLS
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- Allow public to read active notifications
CREATE POLICY "Anyone can view active notifications"
  ON public.system_notifications FOR SELECT
  TO public
  USING (is_active = true AND (expires_at IS NULL OR expires_at > TIMEZONE('utc', NOW())));

-- Allow service role to manage notifications
CREATE POLICY "Service role can manage notifications"
  ON public.system_notifications FOR ALL
  TO service_role
  USING (true);
