-- Enable RLS (just in case)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to update their own profile
-- Check if policy exists before creating to avoid errors (or drop and recreate)
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Ensure users can also view their own profile (usually exists, but good to double check)
-- DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
-- CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
