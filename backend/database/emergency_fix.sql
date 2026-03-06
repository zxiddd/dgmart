-- Emergency Fix: Resolve Schema Mismatches and Check Constraint Violations
-- Run this on your Supabase/PostgreSQL database SQL Editor

-- 1. Fix delivery_assignments table (Missing columns often referenced by triggers/code)
ALTER TABLE public.delivery_assignments 
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

-- 2. Expand orders.status CHECK constraint
-- We drop and re-add to manage the list of valid statuses
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN (
    'placed', 'confirmed', 'preparing', 'ready', 'searching_rider', 
    'accepted_by_driver', 'picked_up', 'out_for_delivery', 'delivered', 
    'cancelled', 'refunded'
));

-- 3. Expand delivery_assignments.status CHECK constraint
ALTER TABLE public.delivery_assignments DROP CONSTRAINT IF EXISTS delivery_assignments_status_check;
ALTER TABLE public.delivery_assignments 
ADD CONSTRAINT delivery_assignments_status_check 
CHECK (status IN (
    'assigned', 'accepted', 'rejected', 'picked_up', 'out_for_delivery', 
    'delivered', 'cancelled'
));

-- 4. Fix notifications.type CHECK constraint
-- The error log shows violations for 'new_available_order'
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    'order_update', 'new_available_order', 'promo', 'system', 'new_order', 'payment_update'
));

-- 5. Final Permission Grant (Just to be sure)
GRANT ALL ON TABLE public.delivery_assignments TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.orders TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.notifications TO postgres, anon, authenticated, service_role;
