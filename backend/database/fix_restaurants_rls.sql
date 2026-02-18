-- Fix RLS Policies for Restaurants Table

-- 1. Ensure RLS is enabled
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurants are viewable by everyone" ON public.restaurants;
DROP POLICY IF EXISTS "Owners can update their own restaurant" ON public.restaurants;
DROP POLICY IF EXISTS "Owners can insert their own restaurant" ON public.restaurants;

-- 3. Create comprehensive policies

-- Allow everyone to view restaurants (needed for user app)
CREATE POLICY "Restaurants are viewable by everyone" 
ON public.restaurants FOR SELECT 
USING (true);

-- Allow restaurant owners to update their own restaurant
CREATE POLICY "Owners can update their own restaurant" 
ON public.restaurants FOR UPDATE 
USING (auth.uid() = owner_id);

-- Allow authenticated users (who become owners) to create a restaurant
CREATE POLICY "Owners can insert their own restaurant" 
ON public.restaurants FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Test policy: Allow everything for now to debug if auth.uid() is failing
-- UNCOMMENT THIS IF THE ABOVE FAILS
-- CREATE POLICY "Allow all for authenticated" ON public.restaurants FOR ALL USING (auth.role() = 'authenticated');
