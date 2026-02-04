-- =============================================================================
-- Cafe - Supabase Schema
-- Run this in Supabase SQL Editor: https://kykeogkeeevaklihohsy.supabase.co
--
-- Before running: In Supabase Dashboard > Authentication > Providers > Email
--   disable "Confirm email" for simple signup without confirmation.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies: users can only read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- products (reference data: coffee, pepper)
-- -----------------------------------------------------------------------------
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'saca',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read products
CREATE POLICY "Authenticated users can view products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

-- Seed products
INSERT INTO public.products (slug, name, unit) VALUES
  ('coffee', 'Café', 'saca'),
  ('pepper', 'Pimenta', 'saca')
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- user_inventory (user-owned bags per product and harvest season)
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  harvest_season TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id, harvest_season)
);

-- Enable RLS
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

-- Policies: users can only CRUD their own inventory
CREATE POLICY "Users can view own inventory"
  ON public.user_inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory"
  ON public.user_inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory"
  ON public.user_inventory FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory"
  ON public.user_inventory FOR DELETE
  USING (auth.uid() = user_id);

-- Index for common queries
CREATE INDEX idx_user_inventory_user_id ON public.user_inventory(user_id);
CREATE INDEX idx_user_inventory_harvest_season ON public.user_inventory(harvest_season);

-- -----------------------------------------------------------------------------
-- market_prices (price per bag per product - base for revenue forecasting)
-- -----------------------------------------------------------------------------
CREATE TABLE public.market_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price_per_bag DECIMAL(12, 2) NOT NULL CHECK (price_per_bag >= 0),
  scenario TEXT NOT NULL CHECK (scenario IN ('current', 'harvest')),
  harvest_season TEXT,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read market prices
CREATE POLICY "Authenticated users can view market prices"
  ON public.market_prices FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert/update prices (for simplicity; restrict later if needed)
CREATE POLICY "Authenticated users can manage market prices"
  ON public.market_prices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Index for lookups
CREATE INDEX idx_market_prices_product ON public.market_prices(product_id);
CREATE INDEX idx_market_prices_scenario ON public.market_prices(scenario);

-- Seed initial market prices (example values - update as needed)
INSERT INTO public.market_prices (product_id, price_per_bag, scenario, harvest_season, effective_date)
SELECT p.id, 1200.00, 'current', NULL, CURRENT_DATE
FROM public.products p WHERE p.slug = 'coffee';

INSERT INTO public.market_prices (product_id, price_per_bag, scenario, harvest_season, effective_date)
SELECT p.id, 800.00, 'current', NULL, CURRENT_DATE
FROM public.products p WHERE p.slug = 'pepper';

-- Optional: harvest scenario prices (estimates for revenue comparison)
INSERT INTO public.market_prices (product_id, price_per_bag, scenario, harvest_season, effective_date)
SELECT p.id, 1350.00, 'harvest', '2025', CURRENT_DATE
FROM public.products p WHERE p.slug = 'coffee';

INSERT INTO public.market_prices (product_id, price_per_bag, scenario, harvest_season, effective_date)
SELECT p.id, 920.00, 'harvest', '2025', CURRENT_DATE
FROM public.products p WHERE p.slug = 'pepper';

-- -----------------------------------------------------------------------------
-- revenue_forecasts (cached/historical revenue estimates per scenario)
-- -----------------------------------------------------------------------------
CREATE TABLE public.revenue_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  harvest_season TEXT NOT NULL,
  scenario TEXT NOT NULL CHECK (scenario IN ('now', 'harvest')),
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  price_per_bag DECIMAL(12, 2) NOT NULL,
  total_revenue DECIMAL(14, 2) NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.revenue_forecasts ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own forecasts
CREATE POLICY "Users can view own revenue forecasts"
  ON public.revenue_forecasts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own revenue forecasts"
  ON public.revenue_forecasts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own revenue forecasts"
  ON public.revenue_forecasts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own revenue forecasts"
  ON public.revenue_forecasts FOR DELETE
  USING (auth.uid() = user_id);

-- Index for lookups
CREATE INDEX idx_revenue_forecasts_user_id ON public.revenue_forecasts(user_id);

-- -----------------------------------------------------------------------------
-- updated_at trigger helper
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER user_inventory_updated_at
  BEFORE UPDATE ON public.user_inventory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
