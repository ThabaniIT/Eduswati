// lib/types.ts

export type UserRole = 'student' | 'admin'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  grade: number | null
  avatar_url: string | null
  created_at: string
}

export interface Plan {
  id: string
  name: string
  price_szl: number
  duration: 'monthly' | 'yearly'
  is_active: boolean
  created_at: string
}

export interface Subscription {
  id: string
  student_id: string
  plan_id: string
  payment_method: string
  status: 'active' | 'expiring' | 'overdue' | 'cancelled'
  starts_at: string
  expires_at: string
  created_at: string
  plan?: Plan
}

export interface EBook {
  id: string
  title: string
  subject: string
  grade: number
  emoji: string
  color: string
  pages: number
  file_url: string | null
  is_active: boolean
  created_at: string
}

export interface Video {
  id: string
  title: string
  subject: string
  grade: number
  video_url: string
  duration: string | null
  description: string | null
  thumbnail: string | null
  is_active: boolean
  created_at: string
}

export interface Progress {
  id: string
  student_id: string
  resource_id: string
  resource_type: 'ebook' | 'video'
  status: 'not_started' | 'in_progress' | 'completed'
  score: number | null
  updated_at: string
}

export type QuizType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer' | 'mixed'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface QuizResult {
  id: string
  student_id: string
  subject: string
  title: string
  score: number
  quiz_type: QuizType
  difficulty: Difficulty
  total_questions: number
  correct_answers: number
  wrong_answers: number
  time_taken_seconds: number
  quiz_id: string | null
  taken_at: string
}

export interface StudySession {
  id: string
  student_id: string
  hours: number
  session_date: string
  subject: string | null
  source: 'manual' | 'planner' | 'alarm'
  plan_id: string | null
  alarm_id: string | null
  created_at: string
}

export interface QuizQuestion {
  question: string
  type: QuizType
  options?: string[]
  correct_answer: string
}

export interface Quiz {
  id: string
  student_id: string
  subject: string
  title: string
  quiz_type: QuizType
  difficulty: Difficulty
  timer_minutes: number | null
  questions: QuizQuestion[]
  created_at: string
}

export type TestStatus = 'upcoming' | 'completed'

export interface SchoolTest {
  id: string
  student_id: string
  subject: string
  topic: string | null
  test_date: string
  test_time: string | null
  classroom: string | null
  teacher: string | null
  notes: string | null
  status: TestStatus
  created_at: string
  updated_at: string
}

export type Priority = 'low' | 'medium' | 'high'
export type StudyType = 'reading' | 'practice_questions' | 'quiz_revision' | 'flashcards' | 'past_papers'
export type RepeatMode = 'once' | 'daily' | 'weekly'
export type PlanStatus = 'not_started' | 'in_progress' | 'completed'

export interface StudyPlan {
  id: string
  student_id: string
  subject: string
  topic: string | null
  duration_minutes: number
  priority: Priority
  study_type: StudyType
  repeat_mode: RepeatMode
  scheduled_date: string | null
  status: PlanStatus
  sort_order: number
  created_at: string
  updated_at: string
}

export type AlarmRepeat = 'once' | 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'custom'
export type NotificationType = 'browser' | 'sound' | 'popup'
export type StudyMode = 'pomodoro' | 'custom'

export interface StudyAlarm {
  id: string
  student_id: string
  alarm_name: string
  subject: string | null
  alarm_time: string
  alarm_date: string | null
  repeat_mode: AlarmRepeat
  custom_days: number[]
  notification_type: NotificationType
  study_mode: StudyMode
  study_minutes: number
  break_minutes: number
  goal: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  student_id: string
  achievement_key: string
  title: string
  icon: string
  earned_at: string
}

export interface StudyStatistics {
  student_id: string
  total_study_hours: number
  total_quizzes_taken: number
  average_quiz_score: number
  tests_completed: number
  sessions_completed: number
  sessions_missed: number
  current_streak_days: number
  longest_streak_days: number
  last_active_date: string | null
  updated_at: string
}

export interface Payment {
  id: string
  subscription_id: string
  student_id: string
  amount_szl: number
  method: string
  status: 'paid' | 'pending' | 'failed'
  paid_at: string
}

// Admin view types (from DB views)
export interface AdminStudentOverview {
  id: string
  full_name: string
  grade: number | null
  plan_name: string | null
  payment_method: string | null
  subscription_status: string | null
  expires_at: string | null
  resources_accessed: number
}

export interface AdminRevenueSummary {
  month: string
  total_revenue: number
  payment_count: number
}
