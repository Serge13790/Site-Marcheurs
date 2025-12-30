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

-- Helper Functions to bypass RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_approved BOOLEAN;
BEGIN
  SELECT role, approved INTO v_role, v_approved
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN v_role = 'admin' AND v_approved = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_editor_or_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_approved BOOLEAN;
BEGIN
  SELECT role, approved INTO v_role, v_approved
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN (v_role = 'admin' OR v_role = 'editor') AND v_approved = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Policies for profiles
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles USING (
  public.is_admin()
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
  start_time TEXT,
  
  -- Stats
  distance NUMERIC,
  elevation INTEGER,
  difficulty TEXT,
  duration TEXT,
  
  -- Meta
  status TEXT DEFAULT 'draft',
  participants_count INTEGER DEFAULT 0,
  cover_image_url TEXT,
  map_embed_code TEXT,
  
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hikes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view hikes" ON public.hikes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = TRUE)
);

CREATE POLICY "Editors/Admins can manage hikes" ON public.hikes USING (
  public.is_editor_or_admin()
);


-- ==========================================
-- 3. PHOTOS & STORAGE
-- ==========================================
CREATE TABLE public.photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  hike_id UUID REFERENCES public.hikes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  storage_path TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view photos" ON public.photos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = TRUE)
);

CREATE POLICY "Users can upload photos" ON public.photos FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = TRUE)
);

CREATE POLICY "Users manage own photos" ON public.photos FOR DELETE USING (
  auth.uid() = user_id OR
  public.is_admin()
);

-- Storage Bucket Setup
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow public viewing of photos (necessary for img tags usually, or use authenticated URL signing)
CREATE POLICY "Allow public viewing" ON storage.objects FOR SELECT TO public USING (bucket_id = 'photos');


-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos');


-- ==========================================
-- 4. REGISTRATIONS & TRIGGERS
-- ==========================================

-- Create registrations table to track hike participants
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hike_id UUID REFERENCES public.hikes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hike_id, user_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Everyone can see who is registered (or at least the count)
CREATE POLICY "Registrations are viewable by everyone" ON public.registrations
    FOR SELECT USING (true);

-- 2. Authenticated users can register themselves
CREATE POLICY "Users can register themselves" ON public.registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Users can cancel their own registration
CREATE POLICY "Users can unregister themselves" ON public.registrations
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update the participants_count in hikes table
CREATE OR REPLACE FUNCTION update_participants_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.hikes
        SET participants_count = participants_count + 1
        WHERE id = NEW.hike_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.hikes
        SET participants_count = participants_count - 1
        WHERE id = OLD.hike_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function on INSERT or DELETE in registrations
CREATE TRIGGER trigger_update_participants_count
AFTER INSERT OR DELETE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION update_participants_count();
