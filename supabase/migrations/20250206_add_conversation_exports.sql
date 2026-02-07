-- Create conversation_exports table for async export functionality
CREATE TABLE IF NOT EXISTS public.conversation_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  format TEXT NOT NULL CHECK (format IN ('json', 'markdown')),
  file_url TEXT,
  error_message TEXT,
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS conversation_exports_user_id_idx ON public.conversation_exports(user_id);
CREATE INDEX IF NOT EXISTS conversation_exports_status_idx ON public.conversation_exports(status);
CREATE INDEX IF NOT EXISTS conversation_exports_expires_at_idx ON public.conversation_exports(expires_at);

-- Enable Row Level Security
ALTER TABLE public.conversation_exports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own exports"
  ON public.conversation_exports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own exports"
  ON public.conversation_exports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exports"
  ON public.conversation_exports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exports"
  ON public.conversation_exports FOR DELETE
  USING (auth.uid() = user_id);
