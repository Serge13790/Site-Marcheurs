-- Fix infinite recursion in RLS policies by using SECURITY DEFINER functions
-- Access logic is moved to functions that bypass RLS to verify permissions safely

-- 1. Function to check if current user is Admin (Bypasses RLS)
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

-- 2. Function to check if current user is Editor (Bypasses RLS)
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

-- 3. Update Profiles Policy
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles USING (
  public.is_admin()
);

-- 4. Update Hikes Policy
DROP POLICY IF EXISTS "Editors/Admins can manage hikes" ON public.hikes;
CREATE POLICY "Editors/Admins can manage hikes" ON public.hikes USING (
  public.is_editor_or_admin()
);

-- 5. Update Photos Policies
DROP POLICY IF EXISTS "Users manage own photos" ON public.photos;
CREATE POLICY "Users manage own photos" ON public.photos FOR DELETE USING (
  auth.uid() = user_id OR
  public.is_admin()
);
