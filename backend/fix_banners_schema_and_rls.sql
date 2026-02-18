-- 1. Add missing columns to banners table
ALTER TABLE public.banners 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS subtitle TEXT,
ADD COLUMN IF NOT EXISTS gradient_colors TEXT[];  -- Array of strings/colors

-- 2. Clean up existing RLS policies for banners
DROP POLICY IF EXISTS "Public banners" ON public.banners;
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banners;
DROP POLICY IF EXISTS "Restaurant owners can insert banners" ON public.banners;
DROP POLICY IF EXISTS "Restaurant owners can update banners" ON public.banners;

-- 3. Re-enable RLS (just in case)
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 4. Create proper policies

-- VIEW: Everyone can view active banners
CREATE POLICY "Anyone can view active banners" 
ON public.banners FOR SELECT 
USING (is_active = true);

-- INSERT: Restaurant owners can create banners for their OWN restaurants
CREATE POLICY "Restaurant owners can insert banners" 
ON public.banners FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM restaurants 
        WHERE id::text = target_id  -- assuming target_id stores restaurant.id
        AND owner_id = auth.uid()
    )
);

-- UPDATE: Restaurant owners can update banners for their OWN restaurants
CREATE POLICY "Restaurant owners can update banners" 
ON public.banners FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM restaurants 
        WHERE id::text = target_id 
        AND owner_id = auth.uid()
    )
);

-- DELETE: Restaurant owners can delete banners for their OWN restaurants
CREATE POLICY "Restaurant owners can delete banners" 
ON public.banners FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM restaurants 
        WHERE id::text = target_id 
        AND owner_id = auth.uid()
    )
);
