-- ==========================================
-- COMPLETE SUPABASE SCHEMA FOR NIPPON TOYOTA
-- ==========================================

-- Enable the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
-- Tracks user roles and metadata
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'officer' CHECK (role IN ('admin', 'officer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Enable read access for all authenticated users" ON public.users FOR SELECT USING (auth.role() = 'authenticated');

-- Trigger to automatically create a public.users row when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Toyota Employee'),
    COALESCE(new.raw_user_meta_data->>'role', 'officer')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to prevent errors on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. INCENTIVE SLABS TABLE
-- Dynamic tiered incentive configuration
CREATE TABLE IF NOT EXISTS public.incentive_slabs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_name TEXT NOT NULL,
  min_cars INTEGER NOT NULL,
  max_cars INTEGER,
  incentive_per_car INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for incentive_slabs
ALTER TABLE public.incentive_slabs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view slabs" ON public.incentive_slabs FOR SELECT USING (true);
CREATE POLICY "Admins can manage slabs" ON public.incentive_slabs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Insert Default Slabs
INSERT INTO public.incentive_slabs (tier_name, min_cars, max_cars, incentive_per_car)
VALUES 
  ('Tier A', 1, 3, 1000),
  ('Tier S', 4, 7, 2000),
  ('Tier Premium', 8, NULL, 3500)
ON CONFLICT DO NOTHING;


-- 3. CARS TABLE (INVENTORY)
-- Admin configuration for car models and stock
CREATE TABLE IF NOT EXISTS public.cars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name TEXT NOT NULL,
  variant TEXT NOT NULL,
  base_suffix TEXT,
  stock INTEGER DEFAULT 0,
  status TEXT DEFAULT 'In Stock',
  tier TEXT DEFAULT 'Tier A',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for cars
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view cars" ON public.cars FOR SELECT USING (true);
CREATE POLICY "Admins can manage cars" ON public.cars FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);


-- 4. MONTHLY SALES TABLE
-- Officer portal tracking for calculated sales payouts
CREATE TABLE IF NOT EXISTS public.monthly_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  user_name TEXT,
  month TEXT NOT NULL,
  total_cars INTEGER DEFAULT 0,
  total_incentive NUMERIC(10, 2) DEFAULT 0,
  breakdown JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for monthly_sales
ALTER TABLE public.monthly_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sales" ON public.monthly_sales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sales" ON public.monthly_sales FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can insert their own sales" ON public.monthly_sales FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sales" ON public.monthly_sales FOR UPDATE USING (auth.uid() = user_id);
