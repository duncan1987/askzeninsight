-- Migration: Set monthly subscription for test user
-- Run this in Supabase SQL Editor
-- This script sets bnudufan@gmail.com as a monthly pro subscriber

-- Step 1: Delete existing subscriptions for this user (if any)
DELETE FROM public.subscriptions
WHERE user_id = (
  SELECT id FROM public.profiles WHERE email = 'bnudufan@gmail.com'
);

-- Step 2: Insert new subscription
INSERT INTO public.subscriptions (
  user_id,
  creem_subscription_id,
  status,
  plan,
  interval,
  current_period_end
)
SELECT
  id,
  'test_monthly_' || id, -- Mock Creem subscription ID
  'active',
  'pro',
  'month',
  NOW() + INTERVAL '1 year' -- Subscription valid for 1 year
FROM public.profiles
WHERE email = 'bnudufan@gmail.com';

-- Step 3: Verify the subscription was created
SELECT
  p.email,
  s.id as subscription_id,
  s.status,
  s.plan,
  s.interval,
  s.current_period_end,
  s.created_at
FROM public.profiles p
JOIN public.subscriptions s ON p.id = s.user_id
WHERE p.email = 'bnudufan@gmail.com';
