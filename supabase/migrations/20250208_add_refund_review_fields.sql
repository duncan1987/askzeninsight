-- Add refund review fields for better refund processing
-- This supports the staged downgrade approach (方案A)

-- Add refund amount and tracking fields
ALTER TABLE subscriptions
ADD COLUMN refund_amount DECIMAL(10, 2),
ADD COLUMN refund_estimated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN refund_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN refund_reviewed_by TEXT,
ADD COLUMN refund_notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.refund_amount IS 'Estimated refund amount in USD';
COMMENT ON COLUMN subscriptions.refund_estimated_at IS 'When the refund was initially calculated';
COMMENT ON COLUMN subscriptions.refund_reviewed_at IS 'When the refund was reviewed by admin';
COMMENT ON COLUMN subscriptions.refund_reviewed_by IS 'Admin user ID who reviewed the refund';
COMMENT ON COLUMN subscriptions.refund_notes IS 'Notes explaining refund approval/rejection decision';

-- Create index for refund review queries
CREATE INDEX idx_refund_status_requested ON subscriptions(refund_status) WHERE refund_status = 'requested';
