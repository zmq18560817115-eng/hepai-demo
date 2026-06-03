import { getDb } from '../db/index.js';
import type { ExtendedUserContext } from './skillReplyEngine.js';

export interface UserContext {
  nickname: string;
  role: string;
  onboarding_completed: boolean;
  persona_name: string | null;
  persona_tags: string[];
  energy_level: number;
  days_left: number;
}

export function loadUserContext(userId: string): UserContext {
  const db = getDb();
  const u = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as Record<
    string,
    unknown
  >;
  const p = db
    .prepare(`SELECT name, tags FROM personas WHERE user_id = ?`)
    .get(userId) as { name: string; tags: string } | undefined;
  const snap = db
    .prepare(`SELECT energy_level FROM user_energy_snapshot WHERE user_id = ?`)
    .get(userId) as { energy_level: number } | undefined;

  let daysLeft = 30;
  if (u?.onboarding_date) {
    const row = db
      .prepare(
        `SELECT CAST(julianday('now') - julianday(?) AS INTEGER) as d`,
      )
      .get(u.onboarding_date) as { d: number };
    daysLeft = Math.max(0, 30 - (row?.d ?? 0));
  }

  return {
    nickname: String(u?.nickname ?? '同事'),
    role: String(u?.role ?? 'newcomer'),
    onboarding_completed: Boolean(u?.onboarding_completed),
    persona_name: p?.name ?? null,
    persona_tags: p?.tags ? JSON.parse(p.tags) : [],
    energy_level: snap?.energy_level ?? 75,
    days_left: daysLeft,
  };
}

export function loadExtendedContext(userId: string): ExtendedUserContext {
  const db = getDb();

  const moodCount = db
    .prepare(`SELECT COUNT(*) as c FROM mood_logs WHERE user_id = ?`)
    .get(userId) as { c: number };
  const latestMood = db
    .prepare(
      `SELECT log_text FROM mood_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    )
    .get(userId) as { log_text: string | null } | undefined;

  const lunch = db
    .prepare(
      `SELECT status, match_code FROM lunch_match_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    )
    .get(userId) as { status: string; match_code: string | null } | undefined;

  const mentors = db
    .prepare(
      `SELECT u.nickname FROM mentor_assignments ma
       JOIN users u ON ma.mentor_id = u.id
       WHERE ma.mentee_id = ?`,
    )
    .all(userId) as { nickname: string }[];

  const aiCount = db
    .prepare(
      `SELECT COUNT(*) as c FROM ai_hr_messages m
       JOIN ai_hr_sessions s ON m.session_id = s.id
       WHERE s.user_id = ? AND m.role IN ('user','assistant')`,
    )
    .get(userId) as { c: number };

  const quizCount = db
    .prepare(`SELECT COUNT(*) as c FROM quiz_questions`)
    .get() as { c: number };

  return {
    mood_log_count: moodCount.c,
    latest_mood_text: latestMood?.log_text ?? null,
    lunch_status: lunch?.status ?? null,
    lunch_code: lunch?.match_code ?? null,
    mentor_names: mentors.map((m) => m.nickname),
    ai_message_count: aiCount.c,
    quiz_question_count: quizCount.c,
  };
}
