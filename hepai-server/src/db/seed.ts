import type Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import { PERSONALITY_QUIZ } from './quizQuestions.js';

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
    VALUES (?, ?, ?, 'dev', ?, ?, ?, ?, date('now', '-8 days'), ?)
  `);

  insUser.run(
    DEV_USERS.dev_newcomer,
    'E00001',
    'dev_newcomer',
    '程序员小智',
    AVATAR,
    'newcomer',
    'available',
    0,
  );
  insUser.run(
    DEV_USERS.partner,
    'E00002',
    'dev_partner',
    '产品小美',
    AVATAR,
    'newcomer',
    'available',
    1,
  );
  insUser.run(
    DEV_USERS.dev_mentor,
    'M00001',
    'dev_mentor',
    '雷军老师',
    'https://api.dicebear.com/7.x/identicon/svg?seed=lei',
    'mentor',
    'busy',
    1,
  );
  db.prepare(`
    INSERT INTO users (id, username, dingtalk_user_id, password, nickname, avatar_url, role, mentor_status, onboarding_date, onboarding_completed)
    VALUES (?, 'M00002', 'dev_mentor2', 'dev', '张经理', ?, 'mentor', 'available', date('now'), 1)
  `).run(uuid(), 'https://api.dicebear.com/7.x/identicon/svg?seed=zhang');

  const mentor2 = db
    .prepare(`SELECT id FROM users WHERE username = 'M00002'`)
    .get() as { id: string };

  insUser.run(
    DEV_USERS.dev_hr,
    'HR0001',
    'dev_hr',
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

  db.prepare(
    `INSERT INTO mentor_assignments (mentee_id, mentor_id, type) VALUES (?, ?, 'main')`,
  ).run(DEV_USERS.dev_newcomer, DEV_USERS.dev_mentor);
  db.prepare(
    `INSERT INTO mentor_assignments (mentee_id, mentor_id, type) VALUES (?, ?, 'project')`,
  ).run(DEV_USERS.dev_newcomer, mentor2.id);
  db.prepare(
    `INSERT INTO mentor_assignments (mentee_id, mentor_id, type) VALUES (?, ?, 'main')`,
  ).run(DEV_USERS.partner, DEV_USERS.dev_mentor);

  db.prepare(
    `INSERT INTO hr_alerts (id, user_id, user_alias, dept, reason, severity) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    uuid(),
    DEV_USERS.partner,
    '蓝色小象',
    '研发中心 / 测试组',
    '连续3天情绪分极低',
    'red',
  );
  db.prepare(
    `INSERT INTO hr_alerts (id, user_id, user_alias, dept, reason, severity) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    uuid(),
    DEV_USERS.dev_newcomer,
    '飞翔橘子',
    '市场部 / 品牌组',
    '入职盲盒显示偏I人，导师3天未互动',
    'yellow',
  );
}
