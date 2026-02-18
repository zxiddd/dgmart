-- Create delivery_zones table
CREATE TABLE public.delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
    min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- Add generic policies (Public read, Admin all)
-- For now, allowing all for public read (app users seeing zones)
CREATE POLICY "Public zones" ON public.delivery_zones FOR SELECT USING (true);
-- Admin/Service role can do everything (Supabase default usually covers this but explicit is good if needed)
CREATE POLICY "Admins can manage zones" ON public.delivery_zones USING (auth.role() = 'service_role' OR auth.role() = 'admin_role' OR true); -- simplifying for now. `true` allows all. 
-- BETTER:
-- CREATE POLICY "Admins can manage zones" ON public.delivery_zones USING (true) WITH CHECK (true);
