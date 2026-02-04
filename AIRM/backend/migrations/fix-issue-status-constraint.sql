-- Fix Issue Status Constraint
-- Removes the restrictive CHECK constraint on the status column to allow custom statuses

-- Drop the existing CHECK constraint on status
ALTER TABLE erp.issues DROP CONSTRAINT IF EXISTS issues_status_check;

-- Optionally, you can add a more flexible constraint or leave it unconstrained
-- For now, we'll leave it unconstrained to support custom kanban columns

COMMENT ON COLUMN erp.issues.status IS 'Issue status - supports custom values for flexible kanban boards';

SELECT '✅ Issue status constraint removed successfully!' as status;
