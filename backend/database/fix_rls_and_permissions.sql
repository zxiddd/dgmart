-- Fix RLS Policies and Triggers for Degloor Mart

-- 1. Reset RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public users" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Create comprehensive policies
-- Allow everyone to read user profiles (needed for determining roles, etc.)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT 
USING (true);

-- Allow users to insert their own profile (if trigger fails or direct insert)
CREATE POLICY "Users can insert their own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- 2. Ensure Delivery Partners table has correct policies
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Delivery partners viewable by everyone" ON public.delivery_partners;
DROP POLICY IF EXISTS "Partners can insert their own record" ON public.delivery_partners;
DROP POLICY IF EXISTS "Partners can update their own record" ON public.delivery_partners;

CREATE POLICY "Delivery partners viewable by everyone" 
ON public.delivery_partners FOR SELECT 
USING (true);

CREATE POLICY "Partners can insert their own record" 
ON public.delivery_partners FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Partners can update their own record" 
ON public.delivery_partners FOR UPDATE 
USING (auth.uid() = user_id);

-- 3. Fix and Re-apply the Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Backfill missing users from auth.users to public.users
-- Handles NULL names by falling back to email prefix
INSERT INTO public.users (id, email, name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'role', 'customer')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);

-- 5. Grant permissions to authenticated users to ensure they can actually use the tables
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
