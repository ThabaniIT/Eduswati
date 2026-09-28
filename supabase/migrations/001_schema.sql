-- supabase/migrations/001_schema.sql
-- Paste this into Supabase Dashboard → SQL Editor → Run
-- OR use: supabase db push

-- ─── ROLES ENUM ──────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('student', 'admin');

-- ─── PROFILES ────────────────────────────────────────────────
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'student',
  grade       INTEGER CHECK (grade BETWEEN 8 AND 12),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SUBSCRIPTION PLANS ──────────────────────────────────────
CREATE TABLE plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  price_szl   INTEGER NOT NULL,
  duration    TEXT NOT NULL CHECK (duration IN ('monthly','yearly')),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SUBSCRIPTIONS ───────────────────────────────────────────
CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id         UUID REFERENCES plans(id),
  payment_method  TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','expiring','overdue','cancelled')),
  starts_at       TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EBOOKS ──────────────────────────────────────────────────
CREATE TABLE ebooks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  subject     TEXT NOT NULL,
  grade       INTEGER CHECK (grade BETWEEN 8 AND 12),
  emoji       TEXT DEFAULT '📚',
  color       TEXT DEFAULT '#eef2ff',
  pages       INTEGER DEFAULT 0,
  file_url    TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── VIDEOS ──────────────────────────────────────────────────
CREATE TABLE videos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  subject     TEXT NOT NULL,
  grade       INTEGER CHECK (grade BETWEEN 8 AND 12),
  video_url   TEXT NOT NULL,
  duration    TEXT,
  description TEXT,
  thumbnail   TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROGRESS ────────────────────────────────────────────────
CREATE TABLE progress (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id   UUID NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('ebook','video')),
  status        TEXT DEFAULT 'not_started'
                CHECK (status IN ('not_started','in_progress','completed')),
  score         INTEGER CHECK (score BETWEEN 0 AND 100),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, resource_id)
);

-- ─── QUIZ RESULTS ────────────────────────────────────────────
CREATE TABLE quiz_results (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL,
  title       TEXT NOT NULL,
  score       INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  taken_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STUDY SESSIONS ──────────────────────────────────────────
CREATE TABLE study_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  hours        NUMERIC(4,2) NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PAYMENTS ────────────────────────────────────────────────
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id),
  student_id      UUID REFERENCES profiles(id),
  amount_szl      INTEGER NOT NULL,
  method          TEXT NOT NULL,
  status          TEXT DEFAULT 'paid' CHECK (status IN ('paid','pending','failed')),
  paid_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebooks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress       ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results   ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() = 'admin';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "Read own profile or admin"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR is_admin());
CREATE POLICY "Update own profile"
  ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins insert profiles"
  ON profiles FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins delete profiles"
  ON profiles FOR DELETE TO authenticated USING (is_admin());

-- PLANS (public read, admin write)
CREATE POLICY "Anyone reads plans" ON plans FOR SELECT USING (true);
CREATE POLICY "Admins manage plans"
  ON plans FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- SUBSCRIPTIONS
CREATE POLICY "Own or admin subscription read"
  ON subscriptions FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR is_admin());
CREATE POLICY "Admins manage subscriptions"
  ON subscriptions FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- EBOOKS (only active subscribers + admins)
CREATE POLICY "Subscribed students read ebooks"
  ON ebooks FOR SELECT TO authenticated
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE student_id = auth.uid()
        AND status IN ('active','expiring')
        AND expires_at > NOW()
    )
  );
CREATE POLICY "Admins manage ebooks"
  ON ebooks FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- VIDEOS
CREATE POLICY "Subscribed students read videos"
  ON videos FOR SELECT TO authenticated
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE student_id = auth.uid()
        AND status IN ('active','expiring')
        AND expires_at > NOW()
    )
  );
CREATE POLICY "Admins manage videos"
  ON videos FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- PROGRESS
CREATE POLICY "Own progress"
  ON progress FOR ALL TO authenticated
  USING (student_id = auth.uid() OR is_admin())
  WITH CHECK (student_id = auth.uid() OR is_admin());

-- QUIZ RESULTS
CREATE POLICY "Own quiz results"
  ON quiz_results FOR ALL TO authenticated
  USING (student_id = auth.uid() OR is_admin())
  WITH CHECK (student_id = auth.uid() OR is_admin());

-- STUDY SESSIONS
CREATE POLICY "Own study sessions"
  ON study_sessions FOR ALL TO authenticated
  USING (student_id = auth.uid() OR is_admin())
  WITH CHECK (student_id = auth.uid() OR is_admin());

-- PAYMENTS
CREATE POLICY "Own payments read"
  ON payments FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR is_admin());
CREATE POLICY "Admins manage payments"
  ON payments FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, grade)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    (NEW.raw_user_meta_data->>'grade')::INTEGER
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ADMIN VIEWS
-- ============================================================
CREATE VIEW admin_student_overview AS
SELECT
  p.id, p.full_name, p.grade,
  pl.name        AS plan_name,
  s.payment_method,
  s.status       AS subscription_status,
  s.expires_at,
  COUNT(DISTINCT pr.id) AS resources_accessed
FROM profiles p
LEFT JOIN subscriptions s
  ON s.student_id = p.id AND s.status IN ('active','expiring','overdue')
LEFT JOIN plans pl ON pl.id = s.plan_id
LEFT JOIN progress pr ON pr.student_id = p.id
WHERE p.role = 'student'
GROUP BY p.id, p.full_name, p.grade, pl.name, s.payment_method, s.status, s.expires_at;

CREATE VIEW admin_revenue_summary AS
SELECT
  DATE_TRUNC('month', paid_at) AS month,
  SUM(amount_szl)              AS total_revenue,
  COUNT(*)                     AS payment_count
FROM payments
WHERE status = 'paid'
GROUP BY 1
ORDER BY 1 DESC;

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO plans (name, price_szl, duration) VALUES
  ('Basic',        80,  'monthly'),
  ('Standard',     200, 'monthly'),
  ('Premium',      350, 'monthly'),
  ('Annual Basic', 720, 'yearly');

INSERT INTO ebooks (title, subject, grade, emoji, color, pages) VALUES
  ('Mathematics Grade 11',    'Mathematics',      11, '📐', '#eef2ff', 328),
  ('Mathematics Grade 10',    'Mathematics',      10, '📐', '#eef2ff', 298),
  ('Physical Science Gr 11',  'Physical Science', 11, '🔬', '#e6f7f2', 412),
  ('Chemistry Basics',        'Physical Science', 10, '⚗️', '#e6f7f2', 310),
  ('Biology Essentials',      'Biology',          11, '🧬', '#fff0f0', 290),
  ('Human Body Systems',      'Biology',          10, '🫀', '#fff0f0', 240),
  ('English Language & Lit.', 'English',          11, '📖', '#fffbea', 188),
  ('Essay Writing Guide',     'English',          12, '✍️', '#fffbea', 120),
  ('History of Africa',       'History',          11, '🌍', '#f3effb', 356),
  ('World History 20th C.',   'History',          12, '📜', '#f3effb', 400),
  ('Physical Geography',      'Geography',        11, '🗺️', '#eafbf0', 280),
  ('Human Geography',         'Geography',        10, '🌐', '#eafbf0', 240);

INSERT INTO videos (title, subject, grade, video_url, duration, description) VALUES
  ('Quadratic Formula Explained', 'Mathematics', 11, 'https://youtube.com/embed/REPLACE_ME', '18:34', 'Step-by-step quadratic formula'),
  ('Newton''s 3 Laws of Motion',  'Physical Science', 11, 'https://youtube.com/embed/REPLACE_ME', '22:10', 'Forces and motion'),
  ('Cell Division: Mitosis',      'Biology',     11, 'https://youtube.com/embed/REPLACE_ME', '25:45', 'Mitosis and meiosis'),
  ('Essay Structure Masterclass', 'English',     12, 'https://youtube.com/embed/REPLACE_ME', '30:00', 'Essay writing guide'),
  ('Colonialism in Africa',       'History',     11, 'https://youtube.com/embed/REPLACE_ME', '28:15', 'Colonial history'),
  ('Climate & Weather Patterns',  'Geography',   11, 'https://youtube.com/embed/REPLACE_ME', '19:50', 'Climate systems');

-- ============================================================
-- MANUALLY CREATE YOUR FIRST ADMIN USER
-- After running the schema, sign up normally then run:
--
--   UPDATE profiles
--   SET role = 'admin'
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@eduswati.com');
--
-- ============================================================
