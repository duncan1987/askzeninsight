-- Fix share_id to use URL-safe base64 encoding
-- This replaces + with - and / with _ to avoid URL path issues

-- First, update existing records to use URL-safe IDs
UPDATE public.shares
SET share_id = replace(replace(share_id, '+', '-'), '/', '_')
WHERE share_id ~ '[+/]';

-- Drop the old default and recreate with URL-safe encoding
ALTER TABLE public.shares
ALTER COLUMN share_id DROP DEFAULT;

-- Set new URL-safe default (replaces + and / with safe characters)
ALTER TABLE public.shares
ALTER COLUMN share_id
SET DEFAULT replace(replace(encode(gen_random_bytes(12), 'base64'), '+', '-'), '/', '_');

-- Remove any trailing padding (=)
UPDATE public.shares
SET share_id = rtrim(share_id, '=')
WHERE share_id LIKE '%=';

-- Ensure all IDs are URL-safe
ALTER TABLE public.shares
ADD CONSTRAINT share_id_url_safe CHECK (share_id !~ '[+/=]');
