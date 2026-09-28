// lib/study-stats.ts
// Shared helpers for keeping study_statistics and achievements in sync.
// Called from the various student API routes after a relevant write.

import type { SupabaseClient } from '@supabase/supabase-js'

type Trigger =
  | { type: 'quiz'; score: number }
  | { type: 'study_session'; hours: number; hourOfDay?: number }
  | { type: 'test_completed' }
  | { type: 'planner_session_completed' }

const ACHIEVEMENT_DEFS: Record<string, { title: string; icon: string }> = {
  first_quiz:        { title: 'First Quiz',        icon: '📚' },
  perfect_score:     { title: '100% Score',        icon: '🏆' },
  streak_7:          { title: '7-Day Streak',       icon: '🔥' },
  early_bird:        { title: 'Early Bird',         icon: '⏰' },
  night_owl:         { title: 'Night Owl',          icon: '🌙' },
  sessions_50:       { title: '50 Study Sessions',  icon: '🎯' },
  hours_100:         { title: '100 Hours Studied',  icon: '💯' },
}

async function getOrCreateStats(supabase: SupabaseClient, studentId: string) {
  const { data } = await supabase
    .from('study_statistics')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle()

  if (data) return data

  const { data: created } = await supabase
    .from('study_statistics')
    .insert({ student_id: studentId })
    .select()
    .single()

  return created
}

// Updates streak counters based on "today" activity. Call on any meaningful
// daily activity (quiz taken, study session logged, planner task completed).
export async function touchStreak(supabase: SupabaseClient, studentId: string) {
  const stats = await getOrCreateStats(supabase, studentId)
  if (!stats) return

  const today = new Date().toISOString().split('T')[0]
  if (stats.last_active_date === today) return // already counted today

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const continuingStreak = stats.last_active_date === yesterday
  const newStreak = continuingStreak ? stats.current_streak_days + 1 : 1

  await supabase
    .from('study_statistics')
    .update({
      current_streak_days: newStreak,
      longest_streak_days: Math.max(newStreak, stats.longest_streak_days ?? 0),
      last_active_date: today,
    })
    .eq('student_id', studentId)

  if (newStreak >= 7) {
    await awardAchievement(supabase, studentId, 'streak_7')
  }
}

export async function recordStudyHours(supabase: SupabaseClient, studentId: string, hours: number) {
  const stats = await getOrCreateStats(supabase, studentId)
  if (!stats) return

  const newTotal = Number(stats.total_study_hours ?? 0) + Number(hours)
  await supabase
    .from('study_statistics')
    .update({ total_study_hours: newTotal })
    .eq('student_id', studentId)

  if (newTotal >= 100) {
    await awardAchievement(supabase, studentId, 'hours_100')
  }
}

export async function incrementSessionsCompleted(supabase: SupabaseClient, studentId: string) {
  const stats = await getOrCreateStats(supabase, studentId)
  if (!stats) return

  const newCount = (stats.sessions_completed ?? 0) + 1
  await supabase
    .from('study_statistics')
    .update({ sessions_completed: newCount })
    .eq('student_id', studentId)

  if (newCount >= 50) {
    await awardAchievement(supabase, studentId, 'sessions_50')
  }
}

async function awardAchievement(supabase: SupabaseClient, studentId: string, key: string) {
  const def = ACHIEVEMENT_DEFS[key]
  if (!def) return null

  const { data, error } = await supabase
    .from('achievements')
    .insert({ student_id: studentId, achievement_key: key, title: def.title, icon: def.icon })
    .select()
    .maybeSingle()

  // Unique constraint violation just means it was already earned — that's fine.
  if (error && !error.message.includes('duplicate')) return null
  return data
}

// Checks a trigger event against achievement rules and awards anything newly earned.
// Returns the list of achievements newly granted in this call (for toast/animation display).
export async function checkAndAwardAchievements(
  supabase: SupabaseClient,
  studentId: string,
  trigger: Trigger
) {
  const granted: { key: string; title: string; icon: string }[] = []

  const tryAward = async (key: string) => {
    const def = ACHIEVEMENT_DEFS[key]
    if (!def) return
    const result = await awardAchievement(supabase, studentId, key)
    if (result) granted.push({ key, title: def.title, icon: def.icon })
  }

  if (trigger.type === 'quiz') {
    // First quiz ever?
    const { count } = await supabase
      .from('quiz_results')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
    if ((count ?? 0) <= 1) await tryAward('first_quiz')

    if (trigger.score >= 100) await tryAward('perfect_score')
  }

  if (trigger.type === 'study_session' && trigger.hourOfDay != null) {
    if (trigger.hourOfDay < 7) await tryAward('early_bird')
    if (trigger.hourOfDay >= 22) await tryAward('night_owl')
  }

  return granted
}
