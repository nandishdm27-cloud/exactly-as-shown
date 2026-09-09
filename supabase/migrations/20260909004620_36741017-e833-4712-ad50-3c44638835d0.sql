CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  campus_id TEXT,
  department TEXT,
  year_level TEXT,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.campus_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  published_label TEXT NOT NULL,
  accent TEXT NOT NULL DEFAULT 'mint',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campus_announcements TO authenticated;
GRANT ALL ON public.campus_announcements TO service_role;
ALTER TABLE public.campus_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view announcements" ON public.campus_announcements FOR SELECT TO authenticated USING (true);

CREATE TABLE public.campus_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT NOT NULL,
  attendees_label TEXT NOT NULL DEFAULT 'Open to campus',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campus_events TO authenticated;
GRANT ALL ON public.campus_events TO service_role;
ALTER TABLE public.campus_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view events" ON public.campus_events FOR SELECT TO authenticated USING (true);

CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  due_label TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'submitted', 'overdue', 'completed')),
  accent TEXT NOT NULL DEFAULT 'cobalt',
  owner_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their assignments" ON public.assignments FOR SELECT TO authenticated USING (owner_id IS NULL OR owner_id = auth.uid());
CREATE POLICY "Users can create their assignments" ON public.assignments FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update their assignments" ON public.assignments FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  attended_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  trend_label TEXT NOT NULL DEFAULT '',
  owner_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.attendance_records TO authenticated;
GRANT ALL ON public.attendance_records TO service_role;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their attendance" ON public.attendance_records FOR SELECT TO authenticated USING (owner_id IS NULL OR owner_id = auth.uid());
CREATE POLICY "Users can manage their attendance" ON public.attendance_records FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  category TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  owner_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT TO authenticated USING (owner_id IS NULL OR owner_id = auth.uid());
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.campus_announcements (title, source, published_label, accent) VALUES
  ('Library open until 2 AM during finals week', 'Student Affairs', '2h ago', 'mint'),
  ('New AI tutoring rooms in the east wing', 'Academic Services', 'yesterday', 'gold'),
  ('Spring career fair — bring 10 resumes', 'Career Center', '2d ago', 'coral');
INSERT INTO public.campus_events (title, category, location, event_date, event_time, attendees_label) VALUES
  ('AI & Robotics Fair', 'Technical', 'Innovation Hub', '2026-05-21', '14:00', '328 registered'),
  ('Designing for Climate Futures', 'Seminar', 'North Auditorium', '2026-05-24', '11:30', 'Open to campus'),
  ('Campus Night Run', 'Sports', 'East Quad', '2026-05-28', '18:00', '146 registered');
INSERT INTO public.assignments (subject, title, due_label, status, accent) VALUES
  ('Statistics', 'Problem Set 6', 'Due in 3 days · 23:59', 'pending', 'coral'),
  ('Data Structures', 'Lab report · pair submission', 'Due in 6 days', 'pending', 'cobalt'),
  ('Machine Learning', 'Quiz 2 · 30 min', 'Due in 11 days', 'submitted', 'gold');
INSERT INTO public.attendance_records (subject, attended_count, total_count, trend_label) VALUES
  ('Linear Algebra', 18, 19, '+2% this month'),
  ('Data Structures', 13, 14, 'On track'),
  ('Statistics', 11, 13, 'Needs attention'),
  ('Machine Learning', 12, 13, '+4% this month');
INSERT INTO public.notifications (title, detail, category) VALUES
  ('Dr. Osei posted Lecture 12 notes', 'Linear Algebra · 18 minutes ago', 'Academics'),
  ('Your study plan was optimized', 'Campus AI · Yesterday', 'AI Studio'),
  ('Career fair registration is open', 'Campus Events · 2 days ago', 'Events');