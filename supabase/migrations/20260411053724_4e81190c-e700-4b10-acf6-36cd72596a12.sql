CREATE TABLE public.people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  attributes JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  person_id UUID REFERENCES public.people(id) ON DELETE CASCADE,
  person_name TEXT,
  date DATE,
  context TEXT,
  raw_input TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID REFERENCES public.people(id) ON DELETE CASCADE,
  person_name TEXT,
  description TEXT NOT NULL,
  suggested_action TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.inputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raw_text TEXT NOT NULL,
  parsed_data JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to people" ON public.people FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to events" ON public.events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to inputs" ON public.inputs FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_people_updated_at
  BEFORE UPDATE ON public.people
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();