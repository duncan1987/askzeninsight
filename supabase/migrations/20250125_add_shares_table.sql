-- Create shares table for sharing conversations
CREATE TABLE IF NOT EXISTS public.shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(12), 'base64'),
  username TEXT,
  messages JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc', NOW()) + INTERVAL '30 days')
);

-- Create index for share_id lookups
CREATE INDEX IF NOT EXISTS shares_share_id_idx ON public.shares(share_id);

-- Create index for expiration cleanup
CREATE INDEX IF NOT EXISTS shares_expires_at_idx ON public.shares(expires_at);

-- No RLS policies needed - shares are public read-only
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- Allow public reads
CREATE POLICY "Anyone can view shares"
  ON public.shares FOR SELECT
  USING (expires_at > TIMEZONE('utc', NOW()));

-- Allow service-side insert (for API routes)
-- No INSERT policy needed when using service role key,
-- but anon key needs a policy. For public share creation:
CREATE POLICY "Anyone can create shares"
  ON public.shares FOR INSERT
  WITH CHECK (true);
