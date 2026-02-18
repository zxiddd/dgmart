-- Fix Schema Mismatches for Order Acceptance

-- 1. Add missing accepted_at column to delivery_assignments
ALTER TABLE public.delivery_assignments 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

-- 2. Update orders status check constraint to include 'accepted_by_driver'
-- We must drop the query constraint and re-add it to allow the new status value.
-- Note: Postgres might have named it 'orders_status_check' automatically.
-- If the name is different, you can find it using: \d orders
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN (
    'placed', 'confirmed', 'preparing', 'ready', 
    'picked_up', 'delivered', 'cancelled', 'refunded',
    'accepted_by_driver'
));
