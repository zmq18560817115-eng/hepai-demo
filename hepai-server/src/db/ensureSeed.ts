import type Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import { PERSONALITY_QUIZ } from './quizQuestions.js';
import { DEV_USERS } from './seed.js';

/** 在已有数据库上补全题库与演示数据（不删用户） */
export function ensureExtendedSeed(db: Database.Database) {
  const insQ = db.prepare(
    `INSERT OR IGNORE INTO quiz_questions (id, text, options, sort_order) VALUES (?, ?, ?, ?)`,
  );
  for (const q of PERSONALITY_QUIZ) {
    insQ.run(q.id, q.text, JSON.stringify(q.options), q.sort);
  }

  const newcomerId = DEV_USERS.dev_newcomer;

  const moodCount = db
    .prepare(`SELECT COUNT(*) as c FROM mood_logs WHERE user_id = ?`)
    .get(newcomerId) as { c: number };
  if (moodCount.c === 0) {
    db.prepare(
      `INSERT INTO mood_logs (id, user_id, energy_level, log_text, created_at) VALUES (?, ?, ?, ?, datetime('now', '-2 days'))`,
    ).run(uuid(), newcomerId, 68, '熟悉了工位和茶水间，没那么紧张了');
    db.prepare(
      `INSERT INTO mood_logs (id, user_id, energy_level, log_text, created_at) VALUES (?, ?, ?, ?, datetime('now', '-1 days'))`,
    ).run(uuid(), newcomerId, 72, '和导师打了第一次招呼，感觉还行');
    db.prepare(
      `INSERT INTO user_energy_snapshot (user_id, energy_level) VALUES (?, 75)
       ON CONFLICT(user_id) DO UPDATE SET energy_level = 75`,
    ).run(newcomerId);
  }

  const aiCount = db
    .prepare(`SELECT COUNT(*) as c FROM ai_hr_messages WHERE session_id IN (SELECT id FROM ai_hr_sessions WHERE user_id = ?)`)
    .get(newcomerId) as { c: number };
  if (aiCount.c === 0) {
    const sid = uuid();
    db.prepare(
      `INSERT OR IGNORE INTO ai_hr_sessions (id, user_id, title) VALUES (?, ?, ?)`,
    ).run(sid, newcomerId, '入职适应咨询');
    db.prepare(
      `INSERT INTO ai_hr_messages (id, session_id, role, content) VALUES (?, ?, 'assistant', ?)`,
    ).run(
      uuid(),
      sid,
      '你好，我是企业 AI HR 助手。完成上方「入职人格测试」后会生成你的专属面具；之后可问我社交减压、午餐匹配、导师沟通等问题。',
    );
  }

  const lunchCount = db
    .prepare(`SELECT COUNT(*) as c FROM lunch_match_requests`)
    .get() as { c: number };
  if (lunchCount.c < 2) {
    db.prepare(
      `INSERT INTO lunch_match_requests (id, user_id, venue_id, status, match_code, meeting_point, matched_at, created_at)
       VALUES (?, ?, 'venue-1', 'matched', 'GREEN-M42', '食堂3楼 A08', datetime('now', '-1 day'), datetime('now', '-2 days'))`,
    ).run(uuid(), DEV_USERS.partner);
  }
}
