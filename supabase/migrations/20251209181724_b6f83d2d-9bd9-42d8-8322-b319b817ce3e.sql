-- Create enums
CREATE TYPE public.facade_template AS ENUM ('modern_neon', 'minimal_white', 'classic_brick', 'cyber_tech');
CREATE TYPE public.shop_status AS ENUM ('pending_review', 'active', 'rejected', 'suspended');
CREATE TYPE public.app_role AS ENUM ('merchant', 'admin', 'player');

-- Create streets table
CREATE TABLE public.streets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create shop_spots table
CREATE TABLE public.shop_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  street_id UUID REFERENCES public.streets(id) ON DELETE CASCADE NOT NULL,
  spot_label TEXT NOT NULL,
  position_3d JSONB NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(street_id, spot_label)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  business_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create shops table
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  spot_id UUID REFERENCES public.shop_spots(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  external_link TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  accent_color TEXT DEFAULT '#10B981',
  facade_template facade_template DEFAULT 'modern_neon',
  status shop_status DEFAULT 'pending_review',
  duplicate_brand BOOLEAN DEFAULT false,
  branch_label TEXT,
  branch_justification TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create shop_reviews table
CREATE TABLE public.shop_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'suspended')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.streets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_reviews ENABLE ROW LEVEL SECURITY;

-- Create security definer functions for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

CREATE OR REPLACE FUNCTION public.is_merchant(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'merchant')
$$;

-- Trigger function to create profile and assign role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  
  -- Get role from metadata, default to 'player'
  user_role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::app_role,
    'player'
  );
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Streets: Public read, admin write
CREATE POLICY "Streets are viewable by everyone" ON public.streets
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage streets" ON public.streets
  FOR ALL USING (public.is_admin(auth.uid()));

-- Shop spots: Public read, admin write
CREATE POLICY "Shop spots are viewable by everyone" ON public.shop_spots
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage shop spots" ON public.shop_spots
  FOR ALL USING (public.is_admin(auth.uid()));

-- Profiles: Own profile read/write, public read
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles: Users see own, admins see all
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.is_admin(auth.uid()));

-- Shops: Merchants see own, admins see all, public sees active
CREATE POLICY "Anyone can view active shops" ON public.shops
  FOR SELECT USING (status = 'active' OR merchant_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Merchants can create shops" ON public.shops
  FOR INSERT WITH CHECK (auth.uid() = merchant_id AND public.is_merchant(auth.uid()));

CREATE POLICY "Merchants can update own shops" ON public.shops
  FOR UPDATE USING (merchant_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete shops" ON public.shops
  FOR DELETE USING (public.is_admin(auth.uid()));

-- Shop reviews: Admins only
CREATE POLICY "Admins can manage reviews" ON public.shop_reviews
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Shop owners can view reviews of their shops" ON public.shop_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shops 
      WHERE shops.id = shop_reviews.shop_id 
      AND shops.merchant_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_shops_merchant_id ON public.shops(merchant_id);
CREATE INDEX idx_shops_spot_id ON public.shops(spot_id);
CREATE INDEX idx_shops_status ON public.shops(status);
CREATE INDEX idx_shop_spots_street_id ON public.shop_spots(street_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);