-- Fix RLS policies for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public users" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Re-create policies to allow SELECT for everyone (authenticated or not for public data)
-- and proper write access for authenticated users
CREATE POLICY "Public users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Ensure other tables are readable
CREATE POLICY "Public restaurants" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Public menu_items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Public menu_categories" ON public.menu_categories FOR SELECT USING (true);
