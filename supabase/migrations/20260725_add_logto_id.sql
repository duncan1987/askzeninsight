-- Add logto_id column to profiles for Logto authentication
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS logto_id TEXT UNIQUE;
