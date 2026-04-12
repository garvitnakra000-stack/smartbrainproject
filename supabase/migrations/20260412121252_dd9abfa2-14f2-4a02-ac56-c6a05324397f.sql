
-- Add user_id to all tables
ALTER TABLE public.people ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.events ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.inputs ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add last_interaction_at to people
ALTER TABLE public.people ADD COLUMN last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create unique constraint for duplicate prevention (user_id + lowercase name)
CREATE UNIQUE INDEX idx_people_user_name ON public.people (user_id, lower(name));

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all access to people" ON public.people;
DROP POLICY IF EXISTS "Allow all access to events" ON public.events;
DROP POLICY IF EXISTS "Allow all access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow all access to inputs" ON public.inputs;

-- User-scoped RLS for people
CREATE POLICY "Users manage own people" ON public.people FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User-scoped RLS for events
CREATE POLICY "Users manage own events" ON public.events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User-scoped RLS for tasks
CREATE POLICY "Users manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User-scoped RLS for inputs
CREATE POLICY "Users manage own inputs" ON public.inputs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
