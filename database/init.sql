-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. PROFILES
-- ==========================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  
  -- Personal Info
  first_name TEXT,
  last_name TEXT,
  address TEXT,
  address_complement TEXT,
  postal_code TEXT,
  city TEXT,
  phone_mobile TEXT,
  phone_fixed TEXT,
  
  -- Status & Role
  role TEXT CHECK (role IN ('admin', 'editor', 'walker')) DEFAULT 'walker',
  approved BOOLEAN DEFAULT FALSE, -- Must be approved by admin to see content
  is_profile_completed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
-- Public read for own profile
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Admins can read/update all profiles
CREATE POLICY "Admins can manage all profiles" ON public.profiles USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND approved = TRUE)
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role, approved, is_profile_completed)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'display_name', 'walker', FALSE, FALSE);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- 2. HIKES (Randonnées)
-- ==========================================
CREATE TABLE public.hikes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  
  -- Logistics
  location TEXT,
  meeting_point TEXT,
  start_time TEXT, -- e.g. "08:00"
  
  -- Stats
  distance NUMERIC, -- in km
  elevation INTEGER, -- in meters
  difficulty TEXT,
  duration TEXT,
  
  -- Meta
  status TEXT DEFAULT 'draft', -- 'draft', 'planned', 'published'
  participants_count INTEGER DEFAULT 0,
  cover_image_url TEXT,
  map_embed_code TEXT,
  
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hikes ENABLE ROW LEVEL SECURITY;

-- Only approved users can view hikes
CREATE POLICY "Approved users can view hikes" ON public.hikes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = TRUE)
);

-- Only Admin/Editor can create/edit hikes
CREATE POLICY "Editors/Admins can manage hikes" ON public.hikes USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor') AND approved = TRUE)
);


-- ==========================================
-- 3. PHOTOS
-- ==========================================
CREATE TABLE public.photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  hike_id UUID REFERENCES public.hikes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  storage_path TEXT NOT NULL, -- Path in Supabase Storage bucket
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Approved users can view photos
CREATE POLICY "Approved users can view photos" ON public.photos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = TRUE)
);

-- Users can upload (insert) photos
CREATE POLICY "Users can upload photos" ON public.photos FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = TRUE)
);

-- Users can delete their own photos, Admins can delete any
CREATE POLICY "Users manage own photos" ON public.photos FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND approved = TRUE)
);
