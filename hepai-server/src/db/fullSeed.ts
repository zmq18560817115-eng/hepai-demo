/**
 * 和拍 · 统一演示数据（前后端共创数据源）
 * 可重复执行：INSERT OR IGNORE / 按条件补全，不删已有用户答题记录
 */
import type Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import { PERSONALITY_QUIZ } from './quizQuestions.js';
import { DEV_USERS } from './seed.js';
import {
  refreshAllNewcomerMentors,
  seedMentorPool,
} from '../services/mentorAssignment.js';
import {
  backfillEmployeeProfileFromPersona,
  getEmployeeDept,
} from '../services/employeeProfiles.js';
import {
  HOBBY_BY_LETTER,
  inferDominantFromPersonaName,
} from '../utils/employeeProfile.js';
import { DEFAULT_USER_PASSWORD } from '../utils/defaultPassword.js';
import { buildPersonaAvatarUrl } from '../utils/personaAvatars.js';
import { EIGHT_DEMO_NEWCOMERS } from './demoNewcomers.js';

/** 五大部门 — 与 HR 看板搜索、告警一致 */
export const HR_DEPARTMENTS = [
  '内容创作部门',
  '账号运营部门',
  '数据分析部门',
  '商务市场部门',
  '职能部门',
] as const;

const AVATAR =
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4';

/** @deprecated 使用 EIGHT_DEMO_NEWCOMERS */
export const DEPT_NEWCOMERS = EIGHT_DEMO_NEWCOMERS.filter((n) => !n.firstTime).slice(2);

const HR_ALERT_SEED = [
  { id: 'hr-alert-01', alias: '蓝色小象', dept: '内容创作部门', reason: '连续3天情绪分极低', severity: 'red', userId: 'u-newcomer-002' },
  { id: 'hr-alert-02', alias: '薄荷小熊', dept: '账号运营部门', reason: '午餐匹配失败率偏高', severity: 'yellow', userId: 'u-newcomer-007' },
  { id: 'hr-alert-03', alias: '云端小鹿', dept: '数据分析部门', reason: '导师7天未互动', severity: 'yellow', userId: 'u-newcomer-003' },
  { id: 'hr-alert-04', alias: '极光海豚', dept: '商务市场部门', reason: '能量低于40%持续一周', severity: 'red', userId: 'u-newcomer-004' },
  { id: 'hr-alert-05', alias: '栗子同学', dept: '职能部门', reason: '入职第二周未更新面具', severity: 'yellow', userId: 'u-newcomer-005' },
  { id: 'hr-alert-06', alias: '飞翔橘子', dept: '内容创作部门', reason: '盲盒显示偏I人，需HR关注', severity: 'yellow', userId: DEV_USERS.dev_newcomer },
] as const;

const USER_DEPT_MAP: Record<string, string> = {
  ...Object.fromEntries(EIGHT_DEMO_NEWCOMERS.map((n) => [n.id, n.dept])),
};

/** HR 看板部门展示：优先答题生成的 employee_profiles，再种子映射，否则轮询 */
export function resolveUserDept(
  userId: string,
  index = 0,
  db?: import('better-sqlite3').Database,
): string {
  if (db) {
    const orgRow = db
      .prepare(
        `SELECT d.name
         FROM user_org uo JOIN org_departments d ON d.id = uo.dept_id
         WHERE uo.user_id = ?`,
      )
      .get(userId) as { name: string } | undefined;
    if (orgRow?.name) return orgRow.name;
    const row = db
      .prepare(`SELECT dept FROM employee_profiles WHERE user_id = ?`)
      .get(userId) as { dept: string } | undefined;
    if (row?.dept) return row.dept;
  }
  return USER_DEPT_MAP[userId] ?? HR_DEPARTMENTS[index % HR_DEPARTMENTS.length];
}

export function getDatabaseStats(db: Database.Database) {
  const tables = [
    'users',
    'quiz_questions',
    'personas',
    'user_answers',
    'mood_logs',
    'user_energy_snapshot',
    'mentor_assignments',
    'lunch_match_requests',
    'hr_alerts',
    'ai_hr_sessions',
    'ai_hr_messages',
    'mentor_chat_threads',
    'mentor_chat_messages',
    'notifications',
  ] as const;
  const counts: Record<string, number> = {};
  for (const t of tables) {
    counts[t] = (db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get() as { c: number }).c;
  }
  const newcomers = (
    db
      .prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'newcomer'`)
      .get() as { c: number }
  ).c;
  return { tables: counts, newcomers, departments: [...HR_DEPARTMENTS] };
}

/** 统一补全：题库、五大部门新人、HR告警、情绪、午餐、AI对话 */
export function applyFullSeed(db: Database.Database) {
  const defaultBatchId = 'batch-2026-05-a';
  db.prepare(
    `INSERT OR IGNORE INTO onboarding_batches (id, name, starts_at, protection_days)
     VALUES (?, ?, date('now', '-20 days'), 30)`,
  ).run(defaultBatchId, '5月一批');

  const insDept = db.prepare(
    `INSERT OR IGNORE INTO org_departments (id, name) VALUES (?, ?)`,
  );
  for (const dept of HR_DEPARTMENTS) {
    insDept.run(`dept-${dept}`, dept);
  }

  const insQ = db.prepare(
    `INSERT OR IGNORE INTO quiz_questions (id, text, options, sort_order) VALUES (?, ?, ?, ?)`,
  );
  for (const q of PERSONALITY_QUIZ) {
    insQ.run(q.id, q.text, JSON.stringify(q.options), q.sort);
  }

  const insUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, username, dingtalk_user_id, password, nickname, avatar_url, role, mentor_status, onboarding_date, onboarding_completed)
    VALUES (?, ?, ?, ?, ?, ?, 'newcomer', 'available', date('now', '-10 days'), ?)
  `);
  const updUserOnboard = db.prepare(
    `UPDATE users SET password = ?, nickname = ?, avatar_url = ?, onboarding_completed = ? WHERE username = ?`,
  );
  const insPersona = db.prepare(
    `INSERT OR IGNORE INTO personas (id, user_id, name, tags, motto) VALUES (?, ?, ?, ?, ?)`,
  );
  const insEnergy = db.prepare(
    `INSERT OR IGNORE INTO user_energy_snapshot (user_id, energy_level) VALUES (?, ?)`,
  );
  const insUserBatch = db.prepare(
    `INSERT OR IGNORE INTO user_batches (user_id, batch_id) VALUES (?, ?)`,
  );
  const insUserOrg = db.prepare(
    `INSERT OR IGNORE INTO user_org (user_id, dept_id) VALUES (?, ?)`,
  );

  seedMentorPool(db);

  for (const n of EIGHT_DEMO_NEWCOMERS) {
    const completed = n.firstTime ? 0 : 1;
    const avatar = buildPersonaAvatarUrl(n.energy, n.dominant, n.persona, n.id);
    insUser.run(
      n.id,
      n.username,
      n.dingtalk,
      DEFAULT_USER_PASSWORD,
      n.nickname,
      avatar,
      completed,
    );
    updUserOnboard.run(
      DEFAULT_USER_PASSWORD,
      n.nickname,
      avatar,
      completed,
      n.username,
    );

    const userRow = db
      .prepare(`SELECT id FROM users WHERE username = ?`)
      .get(n.username) as { id: string } | undefined;
    if (!userRow) continue;
    const userId = userRow.id;

    const personaExists = db
      .prepare(`SELECT id FROM personas WHERE user_id = ?`)
      .get(userId) as { id: string } | undefined;
    if (n.firstTime) {
      db.prepare(`DELETE FROM personas WHERE user_id = ?`).run(userId);
    } else if (personaExists) {
      db.prepare(`UPDATE personas SET name = ?, tags = ?, motto = ? WHERE user_id = ?`).run(
        n.persona,
        JSON.stringify(n.tags),
        n.motto,
        userId,
      );
    } else {
      insPersona.run(uuid(), userId, n.persona, JSON.stringify(n.tags), n.motto);
    }
    insEnergy.run(userId, n.energy);
    insUserBatch.run(userId, defaultBatchId);
    insUserOrg.run(userId, `dept-${n.dept}`);
    if (!getEmployeeDept(db, userId)) {
      backfillEmployeeProfileFromPersona(db, userId, n.persona, n.nickname);
    }
    db.prepare(`UPDATE employee_profiles SET dept = ? WHERE user_id = ?`).run(
      n.dept,
      userId,
    );
  }

  refreshAllNewcomerMentors(db);

  const insAlert = db.prepare(
    `INSERT OR IGNORE INTO hr_alerts (id, user_id, user_alias, dept, reason, severity, resolved) VALUES (?, ?, ?, ?, ?, ?, 0)`,
  );
  for (const a of HR_ALERT_SEED) {
    insAlert.run(a.id, a.userId, a.alias, a.dept, a.reason, a.severity);
  }

  const newcomerId = DEV_USERS.dev_newcomer;
  insUserBatch.run(newcomerId, defaultBatchId);
  insUserBatch.run(DEV_USERS.partner, defaultBatchId);
  insUserOrg.run(newcomerId, `dept-${resolveUserDept(newcomerId, 0, db)}`);
  insUserOrg.run(DEV_USERS.partner, `dept-${resolveUserDept(DEV_USERS.partner, 0, db)}`);

  // E00001 为首次接入样板：保持空白态，不注入历史闪光/奖励/通知等数据
  db.prepare(`DELETE FROM mood_logs WHERE user_id = ?`).run(newcomerId);
  db.prepare(`DELETE FROM desk_rewards WHERE user_id = ?`).run(newcomerId);
  db.prepare(`DELETE FROM lunch_match_requests WHERE user_id = ?`).run(newcomerId);
  db.prepare(`DELETE FROM interest_match_requests WHERE user_id = ?`).run(newcomerId);
  db.prepare(`DELETE FROM notifications WHERE user_id = ?`).run(newcomerId);
  db.prepare(`DELETE FROM mentor_chat_messages WHERE sender_id = ?`).run(newcomerId);
  db.prepare(`DELETE FROM mentor_chat_threads WHERE mentee_id = ?`).run(newcomerId);
  const newcomerSessions = db
    .prepare(`SELECT id FROM ai_hr_sessions WHERE user_id = ?`)
    .all(newcomerId) as { id: string }[];
  for (const s of newcomerSessions) {
    db.prepare(`DELETE FROM ai_hr_messages WHERE session_id = ?`).run(s.id);
  }
  db.prepare(`DELETE FROM ai_hr_sessions WHERE user_id = ?`).run(newcomerId);
  db.prepare(
    `INSERT INTO user_energy_snapshot (user_id, energy_level) VALUES (?, 75)
     ON CONFLICT(user_id) DO UPDATE SET energy_level = 75`,
  ).run(newcomerId);

  for (const username of ['E00002', 'E00003', 'E00007']) {
    const uidRow = db
      .prepare(`SELECT id FROM users WHERE username = ?`)
      .get(username) as { id: string } | undefined;
    if (!uidRow) continue;
    const uid = uidRow.id;
    const c = db
      .prepare(`SELECT COUNT(*) as x FROM mood_logs WHERE user_id = ?`)
      .get(uid) as { x: number };
    if (c.x === 0) {
      db.prepare(
        `INSERT INTO mood_logs (id, user_id, energy_level, log_text) VALUES (?, ?, ?, ?)`,
      ).run(uuid(), uid, 45, '本周压力偏大，已记录闪光小事减压');
    }
  }

  const lunchPartner = db
    .prepare(`SELECT id FROM users WHERE username = 'E00002'`)
    .get() as { id: string } | undefined;
  const lunchBuddy = db
    .prepare(`SELECT id FROM users WHERE username = 'E00007'`)
    .get() as { id: string } | undefined;
  const lunchNc = db
    .prepare(`SELECT id FROM users WHERE username = 'E00006'`)
    .get() as { id: string } | undefined;
  const lunchPending = db
    .prepare(`SELECT id FROM users WHERE username = 'E00008'`)
    .get() as { id: string } | undefined;

  const lunchCount = db
    .prepare(`SELECT COUNT(*) as c FROM lunch_match_requests`)
    .get() as { c: number };
  if (lunchCount.c < 3 && lunchPartner && lunchBuddy) {
    db.prepare(
      `INSERT OR IGNORE INTO lunch_match_requests (id, user_id, venue_id, status, match_code, meeting_point, matched_at, partner_user_id, created_at)
       VALUES ('lunch-partner-1', ?, 'venue-1', 'matched', 'GREEN-M42', '食堂3楼 A08', datetime('now', '-1 day'), ?, datetime('now', '-2 days'))`,
    ).run(lunchPartner.id, lunchBuddy.id);
    if (lunchNc) {
      db.prepare(
        `INSERT OR IGNORE INTO lunch_match_requests (id, user_id, venue_id, status, created_at)
         VALUES ('lunch-nc-1', ?, 'venue-1', 'matched', datetime('now', '-3 hours'))`,
      ).run(lunchNc.id);
    }
    if (lunchPending) {
      db.prepare(
        `INSERT OR IGNORE INTO lunch_match_requests (id, user_id, venue_id, status, created_at)
         VALUES ('lunch-pending-1', ?, 'venue-2', 'pending', datetime('now'))`,
      ).run(lunchPending.id);
    }
  }

  // 首次样板不预置 AI HR 历史，避免显示“已有记录”
  seedAiHrDemo(db, DEV_USERS.dev_mentor, '导师带教咨询');
  seedMentorChatDemo(db, DEV_USERS.partner);
  seedNotificationsDemo(db, DEV_USERS.partner);

  const missing = db
    .prepare(
      `SELECT u.id, p.name as persona_name
       FROM users u
       INNER JOIN personas p ON p.user_id = u.id
       LEFT JOIN employee_profiles ep ON ep.user_id = u.id
       WHERE u.role = 'newcomer' AND ep.user_id IS NULL`,
    )
    .all() as { id: string; persona_name: string }[];
  for (const row of missing) {
    backfillEmployeeProfileFromPersona(db, row.id, row.persona_name, '');
  }

  const needInterests = db
    .prepare(
      `SELECT ep.user_id, p.name as persona_name
       FROM employee_profiles ep
       INNER JOIN personas p ON p.user_id = ep.user_id
       WHERE ep.interests IS NULL OR ep.interests = '[]'`,
    )
    .all() as { user_id: string; persona_name: string }[];
  const upd = db.prepare(
    `UPDATE employee_profiles SET interests = ? WHERE user_id = ?`,
  );
  for (const row of needInterests) {
    const d = inferDominantFromPersonaName(row.persona_name);
    upd.run(JSON.stringify(HOBBY_BY_LETTER[d] ?? HOBBY_BY_LETTER.I), row.user_id);
  }
}

function seedMentorChatDemo(db: Database.Database, menteeId: string) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS mentor_chat_threads (
      id TEXT PRIMARY KEY,
      mentee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mentor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(mentee_id, mentor_id)
    );
    CREATE TABLE IF NOT EXISTS mentor_chat_messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL REFERENCES mentor_chat_threads(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const mainMentor = db
    .prepare(
      `SELECT mentor_id FROM mentor_assignments WHERE mentee_id = ? AND type = 'main' LIMIT 1`,
    )
    .get(menteeId) as { mentor_id: string } | undefined;
  const mentorId = mainMentor?.mentor_id ?? DEV_USERS.dev_mentor;
  const existing = db
    .prepare(
      `SELECT id FROM mentor_chat_threads WHERE mentee_id = ? AND mentor_id = ?`,
    )
    .get(menteeId, mentorId) as { id: string } | undefined;
  const threadId = existing?.id ?? 'mentor-thread-demo-1';
  if (!existing) {
    db.prepare(
      `INSERT OR IGNORE INTO mentor_chat_threads (id, mentee_id, mentor_id) VALUES (?, ?, ?)`,
    ).run(threadId, menteeId, mentorId);
  }

  const msgCount = db
    .prepare(`SELECT COUNT(*) as c FROM mentor_chat_messages WHERE thread_id = ?`)
    .get(threadId) as { c: number };
  if (msgCount.c > 0) return;

  db.prepare(
    `INSERT INTO mentor_chat_messages (id, thread_id, sender_id, content, created_at)
     VALUES ('mc-msg-1', ?, ?, ?, datetime('now', '-2 days'))`,
  ).run(
    threadId,
    menteeId,
    '老师您好，我是本周入职的新人，想请教一下文档规范有推荐阅读吗？',
  );
  db.prepare(
    `INSERT INTO mentor_chat_messages (id, thread_id, sender_id, content, created_at)
     VALUES ('mc-msg-2', ?, ?, ?, datetime('now', '-1 days'))`,
  ).run(
    threadId,
    mentorId,
    '欢迎加入！先看内网 Wiki 新人手册，周三下午可以约 15 分钟同步。',
  );
}

function seedNotificationsDemo(db: Database.Database, newcomerId: string) {
  const mainMentor = db
    .prepare(
      `SELECT mentor_id FROM mentor_assignments WHERE mentee_id = ? AND type = 'main' LIMIT 1`,
    )
    .get(newcomerId) as { mentor_id: string } | undefined;
  const mentorId = mainMentor?.mentor_id ?? DEV_USERS.dev_mentor;
  const mentorNick = db
    .prepare(`SELECT nickname FROM users WHERE id = ?`)
    .get(mentorId) as { nickname: string } | undefined;
  const existing = db
    .prepare(`SELECT COUNT(*) as c FROM notifications WHERE user_id = ?`)
    .get(newcomerId) as { c: number };
  if (existing.c > 0) return;

  db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, body, read, peer_id, created_at)
     VALUES ('notif-mc-1', ?, 'mentor_reply', ?,
             '欢迎加入！先看内网 Wiki 新人手册，周三下午可以约 15 分钟同步。', 0, ?, datetime('now', '-1 days'))`,
  ).run(
    newcomerId,
    `${mentorNick?.nickname ?? '导师'} 回复了你`,
    mentorId,
  );
  db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, body, read, peer_id, created_at)
     VALUES ('notif-sys-1', ?, 'system', '入职指引',
             '完成人格盲盒后即可使用安全屋、蹭饭地图与导师私信。', 0, NULL, datetime('now', '-2 days'))`,
  ).run(newcomerId);
}

function seedAiHrDemo(
  db: Database.Database,
  userId: string,
  title = '企业 AI HR 对话',
) {
  const existing = db
    .prepare(`SELECT id FROM ai_hr_sessions WHERE user_id = ? LIMIT 1`)
    .get(userId) as { id: string } | undefined;
  if (existing) return;

  const sid = uuid();
  db.prepare(
    `INSERT INTO ai_hr_sessions (id, user_id, title) VALUES (?, ?, ?)`,
  ).run(sid, userId, title);
  const insMsg = db.prepare(
    `INSERT INTO ai_hr_messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, datetime('now', ?))`,
  );
  insMsg.run(
    uuid(),
    sid,
    'assistant',
    '你好，我是企业 AI HR 助手。数据已接入 SQLite，可结合你的面具、能量与部门信息回答问题。',
    '-1 hour',
  );
  if (userId === DEV_USERS.dev_newcomer) {
    insMsg.run(
      uuid(),
      sid,
      'user',
      '入职第一周很焦虑怎么办？',
      '-55 minutes',
    );
    insMsg.run(
      uuid(),
      sid,
      'assistant',
      '【Skill · 焦虑】入职前两周焦虑很常见。建议先完成 8 题人格测试获得面具，再尝试轻量午餐匹配。',
      '-50 minutes',
    );
  }
}
