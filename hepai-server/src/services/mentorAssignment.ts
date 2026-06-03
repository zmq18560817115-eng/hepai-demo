import type Database from 'better-sqlite3';
import { DEFAULT_USER_PASSWORD } from '../utils/defaultPassword.js';

export type MentorProfile = {
  id: string;
  username: string;
  dingtalk_user_id: string;
  nickname: string;
  mainTitle: string;
  projectTitle: string;
  dept: string;
  mentor_status: 'busy' | 'available' | 'syncing';
  avatarSeed: string;
};

/** 与 seed.ts DEV_USERS.dev_mentor 保持一致 */
export const DEV_MENTOR_ID = 'u-mentor-001';

/** 带教导师池（固定 ID，便于种子与分配） */
export const MENTOR_POOL: MentorProfile[] = [
  {
    id: DEV_MENTOR_ID,
    username: 'M00001',
    dingtalk_user_id: 'dev_mentor',
    nickname: '雷军老师',
    mainTitle: '架构师 / 你的主导师',
    projectTitle: '架构评审',
    dept: '研发部',
    mentor_status: 'busy',
    avatarSeed: 'lei',
  },
  {
    id: 'u-mentor-002',
    username: 'M00002',
    dingtalk_user_id: 'dev_mentor2',
    nickname: '张经理',
    mainTitle: '项目主管 / 你的主导师',
    projectTitle: '项目节奏',
    dept: '产品部',
    mentor_status: 'available',
    avatarSeed: 'zhang',
  },
  {
    id: 'u-mentor-003',
    username: 'M00003',
    dingtalk_user_id: 'dev_mentor3',
    nickname: '陈雅',
    mainTitle: '前端技术导师',
    projectTitle: '代码规范',
    dept: '研发部',
    mentor_status: 'available',
    avatarSeed: 'chenya',
  },
  {
    id: 'u-mentor-004',
    username: 'M00004',
    dingtalk_user_id: 'dev_mentor4',
    nickname: '王敏',
    mainTitle: 'HRBP / 融入关怀',
    projectTitle: '入职适应',
    dept: '人力资源部',
    mentor_status: 'syncing',
    avatarSeed: 'wangmin',
  },
  {
    id: 'u-mentor-005',
    username: 'M00005',
    dingtalk_user_id: 'dev_mentor5',
    nickname: '刘工',
    mainTitle: '后端技术导师',
    projectTitle: '接口联调',
    dept: '研发部',
    mentor_status: 'available',
    avatarSeed: 'liugong',
  },
  {
    id: 'u-mentor-006',
    username: 'M00006',
    dingtalk_user_id: 'dev_mentor6',
    nickname: '赵琳',
    mainTitle: '产品经理导师',
    projectTitle: '需求澄清',
    dept: '产品部',
    mentor_status: 'busy',
    avatarSeed: 'zhaolin',
  },
  {
    id: 'u-mentor-007',
    username: 'M00007',
    dingtalk_user_id: 'dev_mentor7',
    nickname: '孙悦',
    mainTitle: '设计协作导师',
    projectTitle: '体验走查',
    dept: '设计部',
    mentor_status: 'available',
    avatarSeed: 'sunyue',
  },
  {
    id: 'u-mentor-008',
    username: 'M00008',
    dingtalk_user_id: 'dev_mentor8',
    nickname: '周航',
    mainTitle: '运营协作导师',
    projectTitle: '跨部门协同',
    dept: '运营部',
    mentor_status: 'available',
    avatarSeed: 'zhouhang',
  },
];

const mentorById = new Map(MENTOR_POOL.map((m) => [m.id, m]));

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`;
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 写入导师池用户（可重复执行；兼容旧库 username 已存在但 id 不同的情况） */
export function seedMentorPool(db: Database.Database) {
  const ins = db.prepare(`
    INSERT OR IGNORE INTO users (id, username, dingtalk_user_id, password, nickname, avatar_url, role, mentor_status, onboarding_date, onboarding_completed)
    VALUES (?, ?, ?, ?, ?, ?, 'mentor', ?, date('now'), 1)
  `);
  const upd = db.prepare(`
    UPDATE users SET nickname = ?, avatar_url = ?, mentor_status = ? WHERE id = ?
  `);

  for (const m of MENTOR_POOL) {
    const byUsername = db
      .prepare(`SELECT id FROM users WHERE username = ?`)
      .get(m.username) as { id: string } | undefined;

    if (!byUsername) {
      ins.run(
        m.id,
        m.username,
        m.dingtalk_user_id,
        DEFAULT_USER_PASSWORD,
        m.nickname,
        avatarUrl(m.avatarSeed),
        m.mentor_status,
      );
    }
    const rowId = (
      db.prepare(`SELECT id FROM users WHERE username = ?`).get(m.username) as
        | { id: string }
        | undefined
    )?.id;
    if (rowId) {
      upd.run(m.nickname, avatarUrl(m.avatarSeed), m.mentor_status, rowId);
    }
  }
}

/** 当前库中可分配的导师（按 username 对齐种子配置） */
export function listAssignableMentors(db: Database.Database): MentorProfile[] {
  seedMentorPool(db);
  const out: MentorProfile[] = [];
  for (const m of MENTOR_POOL) {
    const row = db
      .prepare(
        `SELECT id, mentor_status FROM users WHERE username = ? AND role = 'mentor'`,
      )
      .get(m.username) as { id: string; mentor_status: string } | undefined;
    if (row) {
      out.push({
        ...m,
        id: row.id,
        mentor_status: (row.mentor_status as MentorProfile['mentor_status']) ?? m.mentor_status,
      });
    }
  }
  return out.length >= 2 ? out : MENTOR_POOL;
}

function pickMentorPair(
  menteeId: string,
  pool: MentorProfile[],
): { mainId: string; projectId: string } {
  const ranked = [...pool].sort(
    (a, b) => hashSeed(`${menteeId}:${a.id}`) - hashSeed(`${menteeId}:${b.id}`),
  );
  const main = ranked[0]!;
  let project = ranked[1]!;
  if (project.id === main.id) {
    project = ranked[2] ?? ranked[0]!;
  }
  return { mainId: main.id, projectId: project.id };
}

export function assignMentorsToNewcomer(
  db: Database.Database,
  menteeId: string,
  options?: { replace?: boolean },
) {
  const existing = db
    .prepare(`SELECT COUNT(*) as c FROM mentor_assignments WHERE mentee_id = ?`)
    .get(menteeId) as { c: number };
  if (existing.c > 0 && !options?.replace) return;

  if (options?.replace) {
    db.prepare(`DELETE FROM mentor_assignments WHERE mentee_id = ?`).run(menteeId);
  }

  const pool = listAssignableMentors(db);
  const { mainId, projectId } = pickMentorPair(menteeId, pool);
  const ins = db.prepare(
    `INSERT OR IGNORE INTO mentor_assignments (mentee_id, mentor_id, type) VALUES (?, ?, ?)`,
  );
  ins.run(menteeId, mainId, 'main');
  if (projectId !== mainId) {
    ins.run(menteeId, projectId, 'project');
  }
}

export function ensureNewcomerMentors(db: Database.Database, menteeId: string) {
  seedMentorPool(db);
  assignMentorsToNewcomer(db, menteeId);
}

export function refreshAllNewcomerMentors(db: Database.Database) {
  seedMentorPool(db);
  const newcomers = db
    .prepare(`SELECT id FROM users WHERE role = 'newcomer'`)
    .all() as { id: string }[];
  for (const row of newcomers) {
    assignMentorsToNewcomer(db, row.id, { replace: true });
  }
}

export function formatMentorRole(mentorId: string, type: string): string {
  const profile =
    mentorById.get(mentorId) ??
    [...MENTOR_POOL].find((m) => m.id === mentorId);
  if (!profile) {
    return type === 'main' ? '主导师' : '项目导师';
  }
  return type === 'main' ? profile.mainTitle : profile.projectTitle;
}

export function mapAssignedMentor(row: {
  id: string;
  name: string;
  avatar_url: string;
  status: string;
  type: string;
}) {
  const profile = [...MENTOR_POOL].find(
    (m) => m.nickname === row.name || m.id === row.id,
  );
  const role = profile
    ? row.type === 'main'
      ? profile.mainTitle
      : profile.projectTitle
    : formatMentorRole(row.id, row.type);
  return {
    id: row.id,
    name: row.name,
    avatar_url: row.avatar_url,
    role,
    status: row.status ?? 'available',
    type: row.type,
  };
}
