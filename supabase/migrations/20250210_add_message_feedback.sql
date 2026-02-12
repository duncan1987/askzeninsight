-- Create message_feedback table for storing likes/dislikes on messages
CREATE TABLE IF NOT EXISTS public.message_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id TEXT NOT NULL,
  user_id UUID,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('like', 'dislike')),
  feedback_reason TEXT,
  feedback_custom_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index for message_id lookups
CREATE INDEX IF NOT EXISTS message_feedback_message_id_idx ON public.message_feedback(message_id);

-- Create index for user feedback lookups
CREATE INDEX IF NOT EXISTS message_feedback_user_id_idx ON public.message_feedback(user_id);

-- Create unique constraint to prevent duplicate feedback from same user on same message
CREATE UNIQUE INDEX IF NOT EXISTS message_feedback_user_message_idx
  ON public.message_feedback(user_id, message_id)
  WHERE user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own feedback
CREATE POLICY "Authenticated users can create feedback"
  ON public.message_feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to update their own feedback
CREATE POLICY "Authenticated users can update own feedback"
  ON public.message_feedback FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow service role to read all feedback (for analytics)
CREATE POLICY "Service role can read all feedback"
  ON public.message_feedback FOR SELECT
  TO service_role
  USING (true);
