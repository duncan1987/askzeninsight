-- Add username column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add account_status column to profiles
-- DEFAULT 'approved' ensures existing Google OAuth users are unaffected
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'approved'
  CHECK (account_status IN ('pending', 'approved', 'rejected'));

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_account_status_idx ON public.profiles(account_status);

-- Update user_tier constraint to include 'approved_zh'
ALTER TABLE public.usage_records DROP CONSTRAINT IF EXISTS usage_records_user_tier_check;
ALTER TABLE public.usage_records ADD CONSTRAINT usage_records_user_tier_check
  CHECK (user_tier IN ('anonymous', 'free', 'pro', 'approved_zh'));

-- Update handle_new_user trigger
-- COALESCE(metadata->>'account_status', 'approved') ensures:
--   Google OAuth users (no account_status in metadata) -> 'approved'
--   zh username users (account_status='pending' in metadata) -> 'pending'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, username, account_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'account_status', 'approved')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
