-- System notifications shown in the navbar bell (components/notification-icon.tsx).
-- NOTE: this table already exists in the production database (created manually);
-- this migration documents its structure and is idempotent.

CREATE TABLE IF NOT EXISTS system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'system_notifications_type_check'
  ) THEN
    ALTER TABLE system_notifications
      ADD CONSTRAINT system_notifications_type_check
      CHECK (type IN ('info', 'warning', 'success', 'announcement'));
  END IF;
END $$;

-- Only the service role (admin APIs) should read/write this table
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
