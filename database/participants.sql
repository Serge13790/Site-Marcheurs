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
