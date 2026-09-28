-- supabase/migrations/002_study_companion.sql
-- Adds: Quiz Center, School Test Timetable, Study Planner, Study Alarms, Achievements
-- Extends existing quiz_results / study_sessions rather than duplicating them.
-- Paste into Supabase Dashboard → SQL Editor → Run, OR: supabase db push

-- ============================================================
-- EXTEND EXISTING TABLES
-- ============================================================

-- quiz_results: add fields needed by the Quiz Center results screen + history
ALTER TABLE quiz_results
  ADD COLUMN IF NOT EXISTS quiz_type    TEXT DEFAULT 'multiple_choice'
              CHECK (quiz_type IN ('multiple_choice','true_false','fill_blank','short_answer','mixed')),
  ADD COLUMN IF NOT EXISTS difficulty   TEXT DEFAULT 'medium'
              CHECK (difficulty IN ('easy','medium','hard')),
  ADD COLUMN IF NOT EXISTS total_questions   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS correct_answers   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wrong_answers     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quiz_id      UUID;

-- study_sessions: link to a planner task / alarm session and capture subject/type
ALTER TABLE study_sessions
  ADD COLUMN IF NOT EXISTS subject       TEXT,
  ADD COLUMN IF NOT EXISTS source        TEXT DEFAULT 'manual'
              CHECK (source IN ('manual','planner','alarm')),
  ADD COLUMN IF NOT EXISTS plan_id       UUID,
  ADD COLUMN IF NOT EXISTS alarm_id      UUID;

-- ============================================================
-- QUIZZES (question bank, optional — quizzes can also be generated client-side)
-- ============================================================
CREATE TABLE quizzes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject      TEXT NOT NULL,
  title        TEXT NOT NULL,
  quiz_type    TEXT NOT NULL DEFAULT 'multiple_choice'
               CHECK (quiz_type IN ('multiple_choice','true_false','fill_blank','short_answer','mixed')),
  difficulty   TEXT NOT NULL DEFAULT 'medium'
               CHECK (difficulty IN ('easy','medium','hard')),
  timer_minutes INTEGER,
  questions    JSONB NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SCHOOL TESTS (Timetable)
-- ============================================================
CREATE TABLE school_tests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject      TEXT NOT NULL,
  topic        TEXT,
  test_date    DATE NOT NULL,
  test_time    TIME,
  classroom    TEXT,
  teacher      TEXT,
  notes        TEXT,
  status       TEXT NOT NULL DEFAULT 'upcoming'
               CHECK (status IN ('upcoming','completed')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STUDY PLANS (Smart Study Planner)
-- ============================================================
CREATE TABLE study_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject         TEXT NOT NULL,
  topic           TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  priority        TEXT NOT NULL DEFAULT 'medium'
                  CHECK (priority IN ('low','medium','high')),
  study_type      TEXT NOT NULL DEFAULT 'reading'
                  CHECK (study_type IN ('reading','practice_questions','quiz_revision','flashcards','past_papers')),
  repeat_mode     TEXT NOT NULL DEFAULT 'once'
                  CHECK (repeat_mode IN ('once','daily','weekly')),
  scheduled_date  DATE,
  status          TEXT NOT NULL DEFAULT 'not_started'
                  CHECK (status IN ('not_started','in_progress','completed')),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STUDY ALARMS (Pomodoro / reminder sessions)
-- ============================================================
CREATE TABLE study_alarms (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  alarm_name        TEXT NOT NULL,
  subject           TEXT,
  alarm_time        TIME NOT NULL,
  alarm_date        DATE,
  repeat_mode       TEXT NOT NULL DEFAULT 'once'
                    CHECK (repeat_mode IN ('once','daily','weekdays','weekends','weekly','custom')),
  custom_days       JSONB DEFAULT '[]',
  notification_type TEXT NOT NULL DEFAULT 'popup'
                    CHECK (notification_type IN ('browser','sound','popup')),
  study_mode        TEXT NOT NULL DEFAULT 'pomodoro'
                    CHECK (study_mode IN ('pomodoro','custom')),
  study_minutes     INTEGER NOT NULL DEFAULT 25,
  break_minutes     INTEGER NOT NULL DEFAULT 5,
  goal              TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACHIEVEMENTS (gamification)
-- ============================================================
CREATE TABLE achievements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  title        TEXT NOT NULL,
  icon         TEXT NOT NULL DEFAULT '🏆',
  earned_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, achievement_key)
);

-- ============================================================
-- STUDY STATISTICS (rollup, updated by app on write; one row per student)
-- ============================================================
CREATE TABLE study_statistics (
  student_id            UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_study_hours     NUMERIC(7,2) NOT NULL DEFAULT 0,
  total_quizzes_taken   INTEGER NOT NULL DEFAULT 0,
  average_quiz_score    NUMERIC(5,2) NOT NULL DEFAULT 0,
  tests_completed       INTEGER NOT NULL DEFAULT 0,
  sessions_completed    INTEGER NOT NULL DEFAULT 0,
  sessions_missed       INTEGER NOT NULL DEFAULT 0,
  current_streak_days   INTEGER NOT NULL DEFAULT 0,
  longest_streak_days   INTEGER NOT NULL DEFAULT 0,
  last_active_date      DATE,
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_quizzes_student            ON quizzes(student_id);
CREATE INDEX idx_school_tests_student        ON school_tests(student_id);
CREATE INDEX idx_school_tests_date           ON school_tests(student_id, test_date);
CREATE INDEX idx_study_plans_student         ON study_plans(student_id);
CREATE INDEX idx_study_plans_date            ON study_plans(student_id, scheduled_date);
CREATE INDEX idx_study_alarms_student        ON study_alarms(student_id);
CREATE INDEX idx_achievements_student        ON achievements(student_id);
CREATE INDEX idx_quiz_results_student_date   ON quiz_results(student_id, taken_at);
CREATE INDEX idx_study_sessions_student_date ON study_sessions(student_id, session_date);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE quizzes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_tests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_alarms      ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_statistics  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own quizzes"
  ON quizzes FOR ALL TO authenticated
  USING (student_id = auth.uid() OR is_admin())
  WITH CHECK (student_id = auth.uid() OR is_admin());

CREATE POLICY "Own school tests"
  ON school_tests FOR ALL TO authenticated
  USING (student_id = auth.uid() OR is_admin())
  WITH CHECK (student_id = auth.uid() OR is_admin());

CREATE POLICY "Own study plans"
  ON study_plans FOR ALL TO authenticated
  USING (student_id = auth.uid() OR is_admin())
  WITH CHECK (student_id = auth.uid() OR is_admin());

CREATE POLICY "Own study alarms"
  ON study_alarms FOR ALL TO authenticated
  USING (student_id = auth.uid() OR is_admin())
  WITH CHECK (student_id = auth.uid() OR is_admin());

CREATE POLICY "Own achievements read"
  ON achievements FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR is_admin());
CREATE POLICY "Own achievements insert"
  ON achievements FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() OR is_admin());

CREATE POLICY "Own study statistics"
  ON study_statistics FOR ALL TO authenticated
  USING (student_id = auth.uid() OR is_admin())
  WITH CHECK (student_id = auth.uid() OR is_admin());

-- ============================================================
-- TRIGGER: updated_at maintenance
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_school_tests_updated
  BEFORE UPDATE ON school_tests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_study_plans_updated
  BEFORE UPDATE ON study_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_study_alarms_updated
  BEFORE UPDATE ON study_alarms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TRIGGER: auto-mark school_tests completed once date has passed
-- (run via a scheduled job / pg_cron in production; this is a safety-net
--  function the app can also call)
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_past_tests_completed(p_student UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE school_tests
  SET status = 'completed'
  WHERE student_id = p_student
    AND status = 'upcoming'
    AND test_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
