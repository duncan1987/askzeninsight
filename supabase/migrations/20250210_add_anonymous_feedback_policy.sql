-- Add policy to allow anonymous users to insert feedback (without user_id)
CREATE POLICY "Anonymous users can create feedback"
  ON public.message_feedback FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Add policy to allow anonymous users to update their own feedback (by matching a unique identifier)
-- For now, we'll allow updates to feedback without a user_id
CREATE POLICY "Anonymous users can update own feedback"
  ON public.message_feedback FOR UPDATE
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);
