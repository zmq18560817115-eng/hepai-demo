import type Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import {
  assignMentorsToNewcomer,
  seedMentorPool,
} from '../services/mentorAssignment.js';
import { PERSONALITY_QUIZ } from './quizQuestions.js';
import { DEFAULT_USER_PASSWORD } from '../utils/defaultPassword.js';
import { buildPersonaAvatarUrl } from '../utils/personaAvatars.js';

const AVATAR =
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4';

export const DEV_USERS = {
  dev_newcomer: 'u-newcomer-001',
  dev_mentor: 'u-mentor-001',
  dev_hr: 'u-hr-001',
  partner: 'u-newcomer-002',
} as const;

export function seedDatabase(db: Database.Database) {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
  if (count.c > 0) return;

  const insUser = db.prepare(`
    INSERT INTO users (id, username, dingtalk_user_id, password, nickname, avatar_url, role, mentor_status, onboarding_date, onboarding_completed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now', '-8 days'), ?)
  `);

  const newcomerAvatar = buildPersonaAvatarUrl(
    72,
    'I',
    null,
    DEV_USERS.dev_newcomer,
  );

  insUser.run(
    DEV_USERS.dev_newcomer,
    'E00001',
    'dev_newcomer',
    DEFAULT_USER_PASSWORD,
    '程序员小智',
    newcomerAvatar,
    'newcomer',
    'available',
    0,
  );
  insUser.run(
    DEV_USERS.partner,
    'E00002',
    'dev_partner',
    DEFAULT_USER_PASSWORD,
    '产品小美',
    buildPersonaAvatarUrl(58, 'E', '社交 E 人带玩型', DEV_USERS.partner),
    'newcomer',
    'available',
    1,
  );

  seedMentorPool(db);

  insUser.run(
    DEV_USERS.dev_hr,
    'HR0001',
    'dev_hr',
    DEFAULT_USER_PASSWORD,
    'HR管理员',
    AVATAR,
    'hr',
    'available',
    1,
  );

  const insQ = db.prepare(
    `INSERT INTO quiz_questions (id, text, options, sort_order) VALUES (?, ?, ?, ?)`,
  );
  for (const q of PERSONALITY_QUIZ) {
    insQ.run(q.id, q.text, JSON.stringify(q.options), q.sort);
  }

  /* E00001 不预置 persona，待首次 8 题测试后生成人格标签 */
  db.prepare(
    `INSERT INTO personas (id, user_id, name, tags, motto) VALUES (?, ?, ?, ?, ?)`,
  ).run(
    uuid(),
    DEV_USERS.partner,
    '社交 E 人带玩型',
    JSON.stringify(['饭局发起人', '气氛组']),
    '先连接人，再连接事。',
  );

  db.prepare(
    `INSERT INTO user_energy_snapshot (user_id, energy_level) VALUES (?, ?)`,
  ).run(DEV_USERS.partner, 42);

  assignMentorsToNewcomer(db, DEV_USERS.dev_newcomer);
  assignMentorsToNewcomer(db, DEV_USERS.partner);

  /* HR 告警、五大部门新人、午餐/AI 演示数据由 applyFullSeed 在 seed 之后写入 */
}
