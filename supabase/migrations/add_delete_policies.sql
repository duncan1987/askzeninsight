-- Add DELETE policies for conversations and messages tables
-- This allows users to delete their own conversations and associated messages

-- Delete policy for conversations
CREATE POLICY "Users can delete own conversations"
  ON public.conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Delete policy for messages (via CASCADE, but explicit policy for clarity)
CREATE POLICY "Users can delete messages of own conversations"
  ON public.messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );
