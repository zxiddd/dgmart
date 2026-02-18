-- Activate all pending restaurants for testing
UPDATE restaurants 
SET status = 'active', is_active = true, is_approved = true
WHERE status = 'pending_approval';
