-- Migration: Add 'out_for_delivery' to orders.status CHECK constraint
-- Run this on your Supabase/PostgreSQL database

-- Step 1: Drop the existing CHECK constraint on status
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Step 2: Re-add it with 'out_for_delivery' and 'accepted_by_driver' (in case not yet added)
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'placed',
    'confirmed',
    'preparing',
    'ready',
    'searching_rider',
    'accepted_by_driver',
    'picked_up',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'refunded'
  ));

-- Step 3: Add 'out_for_delivery' to delivery_assignments.status too (if it has a CHECK)
ALTER TABLE public.delivery_assignments DROP CONSTRAINT IF EXISTS delivery_assignments_status_check;
ALTER TABLE public.delivery_assignments
  ADD CONSTRAINT delivery_assignments_status_check
  CHECK (status IN (
    'assigned',
    'accepted',
    'rejected',
    'picked_up',
    'out_for_delivery',
    'delivered',
    'cancelled'
  ));
