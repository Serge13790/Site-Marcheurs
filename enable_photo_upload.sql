
-- Create photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true) 
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload files to 'photos' bucket
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'photos');

-- Policy to allow everyone to view photos
CREATE POLICY "Allow public viewing" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'photos');

-- Policy to allow authenticated users to insert rows into photos table
CREATE POLICY "Allow authenticated users to insert photos"
ON public.photos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Ensure profiles are updatable by admins (if not already set)
-- This relies on the boolean check or role check defined in previous RLS fixes
