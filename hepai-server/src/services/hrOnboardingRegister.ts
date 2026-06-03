/**
 * HR 录入待入职新人：工号 + 姓名 + 部门 → 写入 users / employee_profiles
 * 新人首次登录 → 大礼包 → 8 题测试 → 获得人格标签 → onboarding_completed=1
 */
import type Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import { HR_DEPARTMENTS } from '../db/fullSeed.js';
import { DEFAULT_USER_PASSWORD } from '../utils/defaultPassword.js';
import { buildPersonaAvatarUrl } from '../utils/personaAvatars.js';
import { assignMentorsToNewcomer } from './mentorAssignment.js';

export interface RegisterPendingNewcomerInput {
  username: string;
  nickname: string;
  dept: string;
}

export interface PendingNewcomerRow {
  id: string;
  username: string;
  nickname: string;
  dept: string;
  onboarding_completed: boolean;
  has_persona: boolean;
  dominant_type: string | null;
  created_at: string;
}

const USERNAME_RE = /^E\d{5}$/i;

export function normalizeUsername(raw: string): string {
  return raw.trim().toUpperCase();
}

export function validateRegisterInput(input: RegisterPendingNewcomerInput): string | null {
  const username = normalizeUsername(input.username);
  const nickname = input.nickname?.trim();
  const dept = input.dept?.trim();
  if (!username || !USERNAME_RE.test(username)) {
    return '工号格式应为 E 开头 + 5 位数字，例如 E00009';
  }
  if (!nickname || nickname.length < 2) return '请输入员工姓名（至少 2 个字）';
  if (!dept || !HR_DEPARTMENTS.includes(dept as (typeof HR_DEPARTMENTS)[number])) {
    return '请选择有效的部门';
  }
  return null;
}

export function registerPendingNewcomer(
  db: Database.Database,
  input: RegisterPendingNewcomerInput,
): {
  user_id: string;
  username: string;
  nickname: string;
  dept: string;
  default_password: string;
  onboarding_completed: false;
} {
  const err = validateRegisterInput(input);
  if (err) throw new Error(err);

  const username = normalizeUsername(input.username);
  const nickname = input.nickname.trim();
  const dept = input.dept.trim();

  const taken = db
    .prepare(`SELECT id FROM users WHERE username = ? COLLATE NOCASE`)
    .get(username) as { id: string } | undefined;
  if (taken) throw new Error(`工号 ${username} 已存在，请更换工号`);

  const userId = uuid();
  const avatar = buildPersonaAvatarUrl(75, 'I', null, userId);

  db.prepare(
    `INSERT INTO org_departments (id, name) VALUES (?, ?) ON CONFLICT(id) DO NOTHING`,
  ).run(`dept-${dept}`, dept);

  db.prepare(
    `INSERT INTO users (id, username, dingtalk_user_id, password, nickname, avatar_url, role, mentor_status, onboarding_date, onboarding_completed)
     VALUES (?, ?, ?, ?, ?, ?, 'newcomer', 'available', date('now'), 0)`,
  ).run(
    userId,
    username,
    `hr_reg_${username.toLowerCase()}`,
    DEFAULT_USER_PASSWORD,
    nickname,
    avatar,
  );

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

  db.prepare(
    `INSERT OR IGNORE INTO user_org (user_id, dept_id) VALUES (?, ?)`,
  ).run(userId, `dept-${dept}`);

  db.prepare(
    `INSERT INTO user_energy_snapshot (user_id, energy_level) VALUES (?, 75)
     ON CONFLICT(user_id) DO UPDATE SET energy_level = 75`,
  ).run(userId);

  const batchRow = db
    .prepare(`SELECT id FROM onboarding_batches ORDER BY created_at DESC LIMIT 1`)
    .get() as { id: string } | undefined;
  if (batchRow) {
    db.prepare(
      `INSERT OR IGNORE INTO user_batches (user_id, batch_id) VALUES (?, ?)`,
    ).run(userId, batchRow.id);
  }

  assignMentorsToNewcomer(db, userId);

  return {
    user_id: userId,
    username,
    nickname,
    dept,
    default_password: DEFAULT_USER_PASSWORD,
    onboarding_completed: false,
  };
}

export function listPendingNewcomers(db: Database.Database): PendingNewcomerRow[] {
  const rows = db
    .prepare(
      `SELECT u.id, u.username, u.nickname, u.onboarding_completed, u.created_at,
              ep.dept, ep.dominant_type,
              (SELECT COUNT(*) FROM personas p WHERE p.user_id = u.id) as persona_count
       FROM users u
       LEFT JOIN employee_profiles ep ON ep.user_id = u.id
       WHERE u.role = 'newcomer'
       ORDER BY u.created_at DESC`,
    )
    .all() as {
    id: string;
    username: string;
    nickname: string;
    onboarding_completed: number;
    created_at: string;
    dept: string | null;
    dominant_type: string | null;
    persona_count: number;
  }[];

  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    nickname: r.nickname,
    dept: r.dept ?? '—',
    onboarding_completed: Boolean(r.onboarding_completed),
    has_persona: r.persona_count > 0,
    dominant_type: r.dominant_type,
    created_at: r.created_at,
  }));
}

export function pendingStatusLabel(row: PendingNewcomerRow): string {
  if (row.onboarding_completed) return '已转正（老员工）';
  if (row.has_persona) return '测试中';
  return '待首次登录 / 人格测试';
}
