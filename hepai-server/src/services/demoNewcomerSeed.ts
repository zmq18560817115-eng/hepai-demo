/**
 * 数据库内置样板新人（E00001–E00008）与 HR 录入新人共用落库逻辑
 */
import type Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import { EIGHT_DEMO_NEWCOMERS } from '../db/demoNewcomers.js';
import { DEFAULT_USER_PASSWORD } from '../utils/defaultPassword.js';
import { buildPersonaAvatarUrl } from '../utils/personaAvatars.js';
import {
  HOBBY_BY_LETTER,
  TYPE_CONFIG,
  type PersonalityLetter,
} from '../utils/employeeProfile.js';
import { assignMentorsToNewcomer } from './mentorAssignment.js';

type DemoRow = (typeof EIGHT_DEMO_NEWCOMERS)[number];

function upsertPendingEmployeeProfile(
  db: Database.Database,
  userId: string,
  username: string,
  nickname: string,
  dept: string,
) {
  db.prepare(`DELETE FROM employee_profiles WHERE user_id = ?`).run(userId);
  db.prepare(
    `INSERT INTO employee_profiles (
      id, user_id, employee_no, dept, display_title, work_style, social_style,
      lunch_preference, support_preference, dominant_type, secondary_type,
      traits, interests, answer_snapshot, batch
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'I', NULL, '[]', '[]', '[]', '5月一批')`,
  ).run(
    uuid(),
    userId,
    username,
    dept,
    `${dept.replace('部门', '')}新人`,
    '待完成人格测试',
    '待完成人格测试',
    '待完成人格测试',
    '待完成人格测试',
  );
}

function upsertVeteranEmployeeProfile(
  db: Database.Database,
  userId: string,
  n: DemoRow,
) {
  const cfg = TYPE_CONFIG[n.dominant as PersonalityLetter];
  const hobbies = HOBBY_BY_LETTER[n.dominant as PersonalityLetter] ?? [];
  const existing = db
    .prepare(`SELECT id FROM employee_profiles WHERE user_id = ?`)
    .get(userId) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE employee_profiles SET
        employee_no = ?, dept = ?, display_title = ?,
        work_style = ?, social_style = ?, lunch_preference = ?, support_preference = ?,
        dominant_type = ?, traits = ?, interests = ?
       WHERE user_id = ?`,
    ).run(
      n.username,
      n.dept,
      cfg.title,
      cfg.work_style,
      cfg.social_style,
      cfg.lunch_preference,
      cfg.support_preference,
      n.dominant,
      JSON.stringify(n.tags),
      JSON.stringify(hobbies),
      userId,
    );
  } else {
    db.prepare(
      `INSERT INTO employee_profiles (
        id, user_id, employee_no, dept, display_title, work_style, social_style,
        lunch_preference, support_preference, dominant_type, secondary_type,
        traits, interests, answer_snapshot, batch
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, '[]', '5月一批')`,
    ).run(
      uuid(),
      userId,
      n.username,
      n.dept,
      cfg.title,
      cfg.work_style,
      cfg.social_style,
      cfg.lunch_preference,
      cfg.support_preference,
      n.dominant,
      JSON.stringify(n.tags),
      JSON.stringify(hobbies),
    );
  }
}

/** 同步单条样板新人（可重复执行） */
export function upsertDemoNewcomer(db: Database.Database, n: DemoRow): string {
  const completed = n.firstTime ? 0 : 1;
  const avatar = buildPersonaAvatarUrl(
    n.energy,
    n.dominant,
    n.firstTime ? null : n.persona,
    n.id,
  );

  db.prepare(
    `INSERT OR IGNORE INTO org_departments (id, name) VALUES (?, ?)`,
  ).run(`dept-${n.dept}`, n.dept);

  db.prepare(
    `INSERT OR IGNORE INTO users (id, username, dingtalk_user_id, password, nickname, avatar_url, role, mentor_status, onboarding_date, onboarding_completed)
     VALUES (?, ?, ?, ?, ?, ?, 'newcomer', 'available', date('now', '-10 days'), ?)`,
  ).run(
    n.id,
    n.username,
    n.dingtalk,
    DEFAULT_USER_PASSWORD,
    n.nickname,
    avatar,
    completed,
  );

  db.prepare(
    `UPDATE users SET password = ?, nickname = ?, avatar_url = ?, onboarding_completed = ? WHERE username = ?`,
  ).run(DEFAULT_USER_PASSWORD, n.nickname, avatar, completed, n.username);

  const row = db
    .prepare(`SELECT id FROM users WHERE username = ?`)
    .get(n.username) as { id: string };
  const userId = row.id;

  if (n.firstTime) {
    db.prepare(`DELETE FROM personas WHERE user_id = ?`).run(userId);
    db.prepare(`DELETE FROM mood_logs WHERE user_id = ?`).run(userId);
    db.prepare(`DELETE FROM desk_rewards WHERE user_id = ?`).run(userId);
    db.prepare(`DELETE FROM lunch_match_requests WHERE user_id = ?`).run(userId);
    db.prepare(`DELETE FROM interest_match_requests WHERE user_id = ?`).run(userId);
    db.prepare(`DELETE FROM notifications WHERE user_id = ?`).run(userId);
    db.prepare(`DELETE FROM mentor_chat_messages WHERE sender_id = ?`).run(userId);
    db.prepare(`DELETE FROM mentor_chat_threads WHERE mentee_id = ?`).run(userId);
    const sessions = db
      .prepare(`SELECT id FROM ai_hr_sessions WHERE user_id = ?`)
      .all(userId) as { id: string }[];
    for (const s of sessions) {
      db.prepare(`DELETE FROM ai_hr_messages WHERE session_id = ?`).run(s.id);
    }
    db.prepare(`DELETE FROM ai_hr_sessions WHERE user_id = ?`).run(userId);
    upsertPendingEmployeeProfile(db, userId, n.username, n.nickname, n.dept);
  } else {
    const personaExists = db
      .prepare(`SELECT id FROM personas WHERE user_id = ?`)
      .get(userId) as { id: string } | undefined;
    if (personaExists) {
      db.prepare(`UPDATE personas SET name = ?, tags = ?, motto = ? WHERE user_id = ?`).run(
        n.persona,
        JSON.stringify(n.tags),
        n.motto,
        userId,
      );
    } else {
      db.prepare(
        `INSERT INTO personas (id, user_id, name, tags, motto) VALUES (?, ?, ?, ?, ?)`,
      ).run(uuid(), userId, n.persona, JSON.stringify(n.tags), n.motto);
    }
    upsertVeteranEmployeeProfile(db, userId, n);
  }

  db.prepare(
    `INSERT INTO user_energy_snapshot (user_id, energy_level) VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET energy_level = excluded.energy_level`,
  ).run(userId, n.energy);

  db.prepare(
    `INSERT OR IGNORE INTO user_org (user_id, dept_id) VALUES (?, ?)`,
  ).run(userId, `dept-${n.dept}`);

  const mentorCount = db
    .prepare(`SELECT COUNT(*) as c FROM mentor_assignments WHERE mentee_id = ?`)
    .get(userId) as { c: number };
  if (mentorCount.c === 0) {
    assignMentorsToNewcomer(db, userId);
  }

  return userId;
}

export function syncAllDemoNewcomers(db: Database.Database): number {
  let n = 0;
  for (const row of EIGHT_DEMO_NEWCOMERS) {
    upsertDemoNewcomer(db, row);
    n += 1;
  }
  return n;
}
