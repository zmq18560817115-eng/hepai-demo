import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb, onboardingDaysLeft } from '../db/index.js';
import {
  getDatabaseStats,
  HR_DEPARTMENTS,
  resolveUserDept,
} from '../db/fullSeed.js';
import {
  computeHrDashboardStats,
  computeHrMoodTrends,
  matchDeptFilter,
} from '../services/hrDashboard.js';
import { DEV_USERS } from '../db/seed.js';
import { authRequired, requireRoles, signToken } from '../middleware/auth.js';
import {
  deleteEmployeeProfile,
  getEmployeeProfileRow,
} from '../services/employeeProfiles.js';
import { applyQuizPersonalityOnly } from '../services/quizPersonality.js';
import {
  listPendingNewcomers,
  pendingStatusLabel,
  registerPendingNewcomer,
} from '../services/hrOnboardingRegister.js';
import { DEFAULT_USER_PASSWORD } from '../utils/defaultPassword.js';
import {
  getOrCreateThread,
  listInboxForUser,
  listThreadMessages,
  resolveMenteeMentor,
  sendThreadMessage,
} from '../services/mentorChat.js';
import {
  listNotifications,
  markAllNotificationsRead,
  markMentorPeerNotificationsRead,
  markNotificationRead,
  notifyLunchMatched,
  notifyInterestMatched,
  notifyMentorReply,
} from '../services/notifications.js';
import {
  assignMatchDetails,
  buildRoadmap,
  formatPartnerPersona,
  getNearbyMerchants,
  listVenues,
  pickLunchPartner,
} from '../services/lunchMatch.js';
import {
  assignInterestMatchDetails,
  buildInterestRoadmap,
  formatInterestPartner,
  getInterestNearbyMerchants,
  getUserInterests,
  listInterestVenues,
  pickInterestPartner,
} from '../services/interestMatch.js';
import { completePartnerPendingAtScene } from '../services/sceneMatch.js';
import { getSceneVenue } from '../services/sceneVenues.js';
import { listLunchDeskRewards } from '../services/deskRewards.js';
import {
  ensureNewcomerMentors,
  mapAssignedMentor,
} from '../services/mentorAssignment.js';
import { syncHrAlertForEnergy, notifyNewcomerOfHrIntervention } from '../services/hrAlerts.js';
import { syncUserPersonaAvatar } from '../services/syncPersonaAvatars.js';
import {
  dingtalkPilotPublicConfig,
  resolveDingtalkUserId,
} from '../services/dingtalkOAuth.js';
import { fail, ok } from '../utils/response.js';

const router = Router();

const DEV_AUTH_MAP: Record<string, string> = {
  dev_newcomer: DEV_USERS.dev_newcomer,
  dev_mentor: DEV_USERS.dev_mentor,
  dev_hr: DEV_USERS.dev_hr,
};

function getUserRow(userId: string) {
  return getDb()
    .prepare(`SELECT * FROM users WHERE id = ?`)
    .get(userId) as Record<string, unknown> | undefined;
}

function getUserBatchName(userId: string): string {
  const row = getDb()
    .prepare(
      `SELECT b.name
       FROM user_batches ub JOIN onboarding_batches b ON b.id = ub.batch_id
       WHERE ub.user_id = ?`,
    )
    .get(userId) as { name: string } | undefined;
  return row?.name ?? '5月一批';
}

function getUserDeptName(userId: string, fallbackIdx = 0): string {
  const row = getDb()
    .prepare(
      `SELECT d.name
       FROM user_org uo JOIN org_departments d ON d.id = uo.dept_id
       WHERE uo.user_id = ?`,
    )
    .get(userId) as { name: string } | undefined;
  return row?.name ?? resolveUserDept(userId, fallbackIdx, getDb());
}

function formatUser(u: Record<string, unknown>) {
  return {
    id: u.id,
    username: u.username,
    nickname: u.nickname,
    avatar_url: u.avatar_url,
    role: u.role,
    onboarding_date: u.onboarding_date,
    onboarding_completed: Boolean(u.onboarding_completed),
    onboarding_days_left: onboardingDaysLeft(String(u.onboarding_date)),
  };
}

function getPersona(userId: string): {
  id: unknown;
  name: string;
  tags: string[];
  motto: unknown;
  created_at: unknown;
} | null {
  const row = getDb()
    .prepare(`SELECT * FROM personas WHERE user_id = ?`)
    .get(userId) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: row.id,
    name: String(row.name ?? ''),
    tags: JSON.parse(String(row.tags ?? '[]')) as string[],
    motto: row.motto,
    created_at: row.created_at,
  };
}

function getEnergy(userId: string): number {
  const snap = getDb()
    .prepare(`SELECT energy_level FROM user_energy_snapshot WHERE user_id = ?`)
    .get(userId) as { energy_level: number } | undefined;
  if (snap) return snap.energy_level;
  const log = getDb()
    .prepare(
      `SELECT energy_level FROM mood_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    )
    .get(userId) as { energy_level: number } | undefined;
  return log?.energy_level ?? 75;
}

function upsertEnergy(userId: string, level: number) {
  getDb()
    .prepare(
      `INSERT INTO user_energy_snapshot (user_id, energy_level, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET energy_level = excluded.energy_level, updated_at = datetime('now')`,
    )
    .run(userId, level);
  syncHrAlertForEnergy(getDb(), userId, level);
}

// --- Auth ---
/** 导师 / HR 工号密码登录 */
router.post('/auth/login', (req, res) => {
  const { username, password, role } = req.body as {
    username?: string;
    password?: string;
    role?: string;
  };
  if (!username?.trim() || !password) {
    return fail(res, '请输入工号和密码');
  }
  if (role !== 'mentor' && role !== 'hr' && role !== 'newcomer') {
    return fail(res, '无效登录端', 400);
  }

  const row = getDb()
    .prepare(
      `SELECT * FROM users WHERE username = ? AND password = ? AND role = ?`,
    )
    .get(username.trim(), password, role) as Record<string, unknown> | undefined;

  if (!row) {
    return fail(res, '工号或密码错误，或无权访问该端', 401, 40101);
  }

  const sid = uuid();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  try {
    getDb()
      .prepare(
        `INSERT INTO auth_sessions (id, user_id, expires_at, user_agent, ip) VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        sid,
        String(row.id),
        expiresAt,
        String(req.headers['user-agent'] ?? ''),
        String(req.ip ?? ''),
      );
  } catch {
    // legacy DB without auth_sessions
  }
  const token = signToken(String(row.id), String(row.role), sid);
  const user = formatUser(row);
  return ok(res, {
    access_token: token,
    expires_in: 604800,
    user,
    show_welcome_gift: role === 'newcomer' && !user.onboarding_completed,
  });
});

router.post('/auth/dingtalk', async (req, res) => {
  const { auth_code } = req.body as { auth_code?: string };
  if (!auth_code) return fail(res, '缺少 auth_code');

  let userId = DEV_AUTH_MAP[auth_code];

  if (!userId) {
    const dingUserId = await resolveDingtalkUserId(auth_code);
    if (dingUserId) {
      const row = getDb()
        .prepare(`SELECT id FROM users WHERE dingtalk_user_id = ?`)
        .get(dingUserId) as { id: string } | undefined;
      if (row) userId = row.id;
    }
  }

  if (!userId) {
    const row = getDb()
      .prepare(`SELECT id FROM users WHERE dingtalk_user_id = ?`)
      .get(auth_code) as { id: string } | undefined;
    if (!row) return fail(res, '未知用户或未绑定钉钉账号', 401);
    userId = row.id;
  }

  const user = getUserRow(userId);
  if (!user) return fail(res, '用户不存在', 404);

  const sid = uuid();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  try {
    getDb()
      .prepare(
        `INSERT INTO auth_sessions (id, user_id, expires_at, user_agent, ip) VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        sid,
        userId,
        expiresAt,
        String(req.headers['user-agent'] ?? ''),
        String(req.ip ?? ''),
      );
  } catch {
    // legacy DB without auth_sessions
  }
  const token = signToken(userId, String(user.role), sid);
  return ok(res, {
    access_token: token,
    expires_in: 604800,
    user: formatUser(user),
    show_welcome_gift:
      String(user.role) === 'newcomer' && !user.onboarding_completed,
  });
});

router.get('/dingtalk/pilot-config', (_req, res) => {
  return ok(res, dingtalkPilotPublicConfig());
});

router.get('/health', (_req, res) => ok(res, { status: 'up' }));

router.get('/health/db', (_req, res) => ok(res, getDatabaseStats(getDb())));

// --- Protected ---
router.use(authRequired);

router.post('/auth/logout', (req, res) => {
  try {
    getDb()
      .prepare(`UPDATE auth_sessions SET revoked_at = datetime('now') WHERE id = ?`)
      .run(req.auth!.sessionId);
  } catch {
    // ignore on legacy DB
  }
  return ok(res, { logged_out: true });
});

router.get('/users/me', (req, res) => {
  const user = getUserRow(req.auth!.userId);
  if (!user) return fail(res, '用户不存在', 404);
  return ok(res, formatUser(user));
});

router.get('/onboarding/status', (req, res) => {
  const user = getUserRow(req.auth!.userId)!;
  const persona = getPersona(req.auth!.userId);
  return ok(res, {
    completed: Boolean(user.onboarding_completed),
    persona_id: persona?.id ?? null,
    can_retake: true,
  });
});

/** 清空当前用户盲盒进度，可重新答 8 题（保留角色名/档案，仅重置答题与完成状态） */
router.post('/onboarding/reset', (req, res) => {
  const userId = req.auth!.userId;
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM user_answers WHERE user_id = ?`).run(userId);
    db.prepare(`UPDATE users SET onboarding_completed = 0 WHERE id = ?`).run(userId);
  });
  tx();
  return ok(res, {
    reset: true,
    onboarding_completed: false,
    message: '已重置入职盲盒，请重新完成 8 题人格测试',
  });
});

router.get('/quiz/onboarding', (_req, res) => {
  const rows = getDb()
    .prepare(
      `SELECT id, text, options FROM quiz_questions ORDER BY sort_order ASC`,
    )
    .all() as { id: string; text: string; options: string }[];
  return ok(res, {
    questions: rows.map((r) => ({
      id: r.id,
      text: r.text,
      options: JSON.parse(r.options),
    })),
  });
});

router.post('/quiz/submit', (req, res) => {
  const userId = req.auth!.userId;
  const user = getUserRow(userId)!;
  if (user.onboarding_completed) {
    return fail(res, '入职盲盒已完成，不可重复提交', 409, 40901);
  }

  const { answers } = req.body as {
    answers: { question_id: string; answer_value: string }[];
  };
  if (!answers?.length) return fail(res, '答案不能为空');

  const db = getDb();
  let result!: ReturnType<typeof applyQuizPersonalityOnly>;

  const tx = db.transaction(() => {
    for (const a of answers) {
      db.prepare(
        `INSERT INTO user_answers (id, user_id, question_id, answer_value) VALUES (?, ?, ?, ?)`,
      ).run(uuid(), userId, a.question_id, a.answer_value);
    }
    result = applyQuizPersonalityOnly(db, userId, answers);
    db.prepare(`UPDATE users SET onboarding_completed = 1 WHERE id = ?`).run(userId);
    upsertEnergy(userId, result.energy_level);
    ensureNewcomerMentors(db, userId);
  });

  tx();
  const employee = result.employee;
  return ok(res, {
    onboarding_completed: true,
    persona: {
      id: result.persona_id,
      name: result.persona.name,
      tags: result.persona.tags,
      motto: result.persona.motto,
    },
    employee,
  });
});

router.get('/personas/me', (req, res) => {
  const persona = getPersona(req.auth!.userId);
  if (!persona) return fail(res, '面具尚未创建', 404);
  return ok(res, persona);
});

router.get('/workplace', (req, res) => {
  const userId = req.auth!.userId;
  const db = getDb();
  const user = getUserRow(userId)!;
  const persona = getPersona(userId);
  if (!persona) return fail(res, '请先完成入职盲盒', 400);

  ensureNewcomerMentors(db, userId);

  const mentors = db
    .prepare(
      `SELECT u.id, u.nickname as name, u.avatar_url, u.mentor_status as status, ma.type
       FROM mentor_assignments ma
       JOIN users u ON u.id = ma.mentor_id
       WHERE ma.mentee_id = ?`,
    )
    .all(userId) as {
    id: string;
    name: string;
    avatar_url: string;
    status: string;
    type: string;
  }[];

  const latestMood = db
    .prepare(
      `SELECT log_text, created_at FROM mood_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    )
    .get(userId) as { log_text: string; created_at: string } | undefined;

  const lunch = db
    .prepare(
      `SELECT status FROM lunch_match_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    )
    .get(userId) as { status: string } | undefined;

  const activeCount =
    (
      db
        .prepare(
          `SELECT COUNT(*) as c FROM lunch_match_requests WHERE status IN ('pending','matched') AND date(created_at) = date('now')`,
        )
        .get() as { c: number }
    ).c + 12;

  const employee = getEmployeeProfileRow(db, userId);

  return ok(res, {
    user: {
      nickname: user.nickname,
      avatar_url: user.avatar_url,
      onboarding_days_left: onboardingDaysLeft(String(user.onboarding_date)),
    },
    employee: employee
      ? {
          employee_no: employee.employee_no,
          dept: employee.dept,
          display_title: employee.display_title,
          work_style: employee.work_style,
          social_style: employee.social_style,
          lunch_preference: employee.lunch_preference,
          support_preference: employee.support_preference,
          dominant_type: employee.dominant_type,
          interests: employee.interests,
        }
      : null,
    persona: {
      name: persona.name,
      tags: persona.tags,
      motto: persona.motto,
    },
    mood: {
      energy_level: getEnergy(userId),
      log_text: latestMood?.log_text ?? null,
      updated_at: latestMood?.created_at ?? new Date().toISOString(),
    },
    mentors: mentors.map((m) => mapAssignedMentor(m)),
    lunch: {
      active_buddies_count: activeCount,
      current_status: lunch?.status ?? 'idle',
    },
  });
});

router.get('/desk/rewards', (req, res) => {
  const db = getDb();
  const userId = req.auth!.userId;
  const user = getUserRow(userId)!;
  if (!Boolean(user.onboarding_completed)) {
    return ok(res, {
      rewards: [],
      lunch_voucher_count: 0,
      total_count: 0,
    });
  }
  // Backfill persisted desk_rewards from legacy lunch_match_requests (one-time, idempotent)
  try {
    const hasAny = db
      .prepare(`SELECT COUNT(*) as c FROM desk_rewards WHERE user_id = ?`)
      .get(userId) as { c: number };
    if (hasAny.c === 0) {
      const legacy = db
        .prepare(
          `SELECT id, venue_id, match_code, meeting_point, matched_at, created_at
           FROM lunch_match_requests
           WHERE user_id = ? AND matched_at IS NOT NULL
           ORDER BY matched_at ASC`,
        )
        .all(userId) as {
        id: string;
        venue_id: string | null;
        match_code: string | null;
        meeting_point: string | null;
        matched_at: string | null;
        created_at: string;
      }[];
      const ins = db.prepare(
        `INSERT OR IGNORE INTO desk_rewards
         (id, user_id, source, ref_id, reward_kind, title, detail, venue_id, earned_at)
         VALUES (?, ?, 'lunch_match', ?, ?, ?, ?, ?, ?)`,
      );
      for (const row of legacy) {
        const venueId = row.venue_id ?? 'venue-1';
        const venue = getSceneVenue(venueId);
        const tag = venue.scene_tag;
        const kind =
          tag === '户外'
            ? 'outdoor_badge'
            : tag === '用餐'
              ? 'meal_voucher'
              : 'scene_perk';
        const title =
          kind === 'meal_voucher'
            ? '饭搭子餐券'
            : kind === 'outdoor_badge'
              ? '户外碰头徽章'
              : '场景奖励贴';
        const parts = [venue.name, row.match_code].filter(Boolean);
        ins.run(
          `lunch-${row.id}`,
          userId,
          row.id,
          kind,
          title,
          parts.join(' · ') || row.meeting_point || null,
          venueId,
          row.matched_at ?? row.created_at,
        );
      }
    }
  } catch {
    // ignore if desk_rewards not present
  }

  const rewards = listLunchDeskRewards(db, userId);
  return ok(res, {
    rewards,
    lunch_voucher_count: rewards.filter((r) => r.reward_kind === 'meal_voucher')
      .length,
    total_count: rewards.length,
  });
});

router.post('/mood', (req, res) => {
  const userId = req.auth!.userId;
  const { energy_level, log_text } = req.body as {
    energy_level: number;
    log_text?: string;
  };
  const id = uuid();
  getDb()
    .prepare(
      `INSERT INTO mood_logs (id, user_id, energy_level, log_text) VALUES (?, ?, ?, ?)`,
    )
    .run(id, userId, energy_level, log_text ?? null);
  upsertEnergy(userId, energy_level);
  return ok(res, {
    id,
    energy_level,
    log_text: log_text ?? null,
    created_at: new Date().toISOString(),
  });
});

router.get('/mood/flash-jar', (req, res) => {
  const userId = req.auth!.userId;
  const user = getUserRow(userId)!;
  if (!Boolean(user.onboarding_completed)) {
    return ok(res, { items: [], total: 0 });
  }
  const items = getDb()
    .prepare(
      `SELECT id, log_text, energy_level, created_at FROM mood_logs
       WHERE user_id = ? AND log_text IS NOT NULL AND log_text != ''
       ORDER BY created_at DESC LIMIT 30`,
    )
    .all(userId) as {
    id: string;
    log_text: string;
    energy_level: number;
    created_at: string;
  }[];
  return ok(res, { items, total: items.length });
});

router.patch('/mood/energy', (req, res) => {
  const userId = req.auth!.userId;
  const { energy_level } = req.body as { energy_level: number };
  const db = getDb();
  upsertEnergy(userId, energy_level);
  db.prepare(
    `INSERT INTO mood_logs (id, user_id, energy_level, log_text) VALUES (?, ?, ?, ?)`,
  ).run(
    uuid(),
    userId,
    energy_level,
    `安全屋能量调整至 ${energy_level}%`,
  );
  const avatar_url = syncUserPersonaAvatar(db, userId, energy_level);
  return ok(res, {
    energy_level,
    avatar_url,
    updated_at: new Date().toISOString(),
  });
});

router.get('/mentors', (req, res) => {
  const userId = req.auth!.userId;
  const db = getDb();
  ensureNewcomerMentors(db, userId);
  const mentors = db
    .prepare(
      `SELECT u.id, u.nickname as name, u.avatar_url, u.mentor_status as status, ma.type
       FROM mentor_assignments ma JOIN users u ON u.id = ma.mentor_id WHERE ma.mentee_id = ?`,
    )
    .all(userId) as {
    id: string;
    name: string;
    avatar_url: string;
    status: string;
    type: string;
  }[];
  return ok(res, {
    mentors: mentors.map((m) => mapAssignedMentor(m)),
  });
});

router.get('/notifications', (req, res) => {
  const userId = req.auth!.userId;
  const unreadOnly = String(req.query.unread_only ?? '') === 'true';
  return ok(res, listNotifications(getDb(), userId, unreadOnly));
});

router.patch('/notifications/:id/read', (req, res) => {
  const userId = req.auth!.userId;
  const id = String(req.params.id);
  const okRead = markNotificationRead(getDb(), userId, id);
  if (!okRead) return fail(res, '通知不存在', 404);
  return ok(res, { read: true });
});

router.post('/notifications/read-all', (req, res) => {
  const userId = req.auth!.userId;
  markAllNotificationsRead(getDb(), userId);
  return ok(res, { read: true });
});

router.get('/mentor-chat/inbox', (req, res) => {
  const userId = req.auth!.userId;
  const items = listInboxForUser(getDb(), userId);
  return ok(res, { items });
});

router.get('/mentor-chat/with/:peerId', (req, res) => {
  const userId = req.auth!.userId;
  const peerId = String(req.params.peerId);
  const pair = resolveMenteeMentor(getDb(), userId, peerId);
  if (!pair) return fail(res, '未找到带教关系，无法开启对话', 403);

  const threadId = getOrCreateThread(getDb(), pair.menteeId, pair.mentorId);
  const peer = getUserRow(peerId);
  if (!peer) return fail(res, '对方用户不存在', 404);

  markMentorPeerNotificationsRead(getDb(), userId, peerId);

  const messages = listThreadMessages(getDb(), threadId).map((m) => ({
    id: m.id,
    sender_id: m.sender_id,
    sender_name: m.sender_name,
    sender_role: m.sender_role,
    content: m.content,
    created_at: m.created_at,
    is_mine: m.sender_id === userId,
  }));

  return ok(res, {
    thread_id: threadId,
    peer: {
      id: peer.id,
      name: peer.nickname,
      avatar_url: peer.avatar_url,
      role: peer.role,
      mentor_status: peer.mentor_status,
    },
    messages,
  });
});

router.post('/mentor-chat/with/:peerId/messages', (req, res) => {
  const userId = req.auth!.userId;
  const peerId = String(req.params.peerId);
  const { content } = req.body as { content?: string };
  const trimmed = String(content ?? '').trim();
  if (!trimmed) return fail(res, '消息不能为空', 400);

  const pair = resolveMenteeMentor(getDb(), userId, peerId);
  if (!pair) return fail(res, '未找到带教关系', 403);

  const threadId = getOrCreateThread(getDb(), pair.menteeId, pair.mentorId);
  const msg = sendThreadMessage(getDb(), threadId, userId, trimmed);
  if (peerId !== userId) {
    notifyMentorReply(
      getDb(),
      peerId,
      msg.sender_name,
      msg.content,
      userId,
    );
  }
  return ok(res, {
    message: {
      id: msg.id,
      sender_id: msg.sender_id,
      sender_name: msg.sender_name,
      sender_role: msg.sender_role,
      content: msg.content,
      created_at: msg.created_at,
      is_mine: true,
    },
  });
});

router.get('/lunch/venues', (req, res) => {
  return ok(res, listVenues(getDb(), req.auth!.userId));
});

router.get('/scenes/venues', (req, res) => {
  return ok(res, listVenues(getDb(), req.auth!.userId));
});

function scheduleLunchMatch(
  requestId: string,
  userId: string,
  venueId: string,
  myTags: string[],
) {
  setTimeout(() => {
    const db = getDb();
    const partner = pickLunchPartner(db, userId, myTags, requestId, venueId);
    if (!partner) return;

    const { matchCode, meetingPoint } = assignMatchDetails(requestId, venueId);
    const sameScene = Boolean(
      (partner as { from_same_scene_queue?: boolean }).from_same_scene_queue,
    );
    if (sameScene) {
      completePartnerPendingAtScene(
        db,
        partner.user_id,
        userId,
        venueId,
        matchCode,
        meetingPoint,
      );
    }
    db.prepare(
      `UPDATE lunch_match_requests
       SET status = 'matched', match_code = ?, meeting_point = ?,
           meet_before = datetime('now', '+1 hour'), matched_at = datetime('now'),
           partner_user_id = ?, confirmed_at = NULL
       WHERE id = ? AND status = 'pending'`,
    ).run(matchCode, meetingPoint, partner.user_id, requestId);
    notifyLunchMatched(db, userId, matchCode, meetingPoint);
  }, 2500);
}

function lunchStatusPayload(
  row: Record<string, unknown>,
  userId: string,
) {
  const persona = getPersona(userId);
  const myTags = persona?.tags ?? [];

  if (row.status === 'pending') {
    const venueId = String(row.venue_id ?? 'venue-1');
    return {
      status: 'pending' as const,
      request_id: row.id,
      venue_id: venueId,
      venue_name: getSceneVenue(venueId).name,
      matching_tags: myTags,
    };
  }

  if (row.status === 'matched') {
    const partner = row.partner_user_id
      ? getPersona(String(row.partner_user_id))
      : null;
    const partnerPersona = partner
      ? formatPartnerPersona(partner.name, partner.tags, myTags)
      : undefined;
    const venueId = String(row.venue_id ?? 'venue-1');
    const confirmed = Boolean(row.confirmed_at);
    const base = {
      status: 'matched' as const,
      request_id: row.id,
      match_code: row.match_code,
      meeting_point: row.meeting_point,
      meet_before: row.meet_before,
      venue_id: venueId,
      venue_name: getSceneVenue(venueId).name,
      partner_persona: partnerPersona,
      confirmed,
    };
    if (confirmed) {
      return {
        ...base,
        roadmap: buildRoadmap(
          venueId,
          String(row.meeting_point ?? ''),
          row.meet_before ? String(row.meet_before) : null,
        ),
        nearby_merchants: getNearbyMerchants(venueId),
      };
    }
    return base;
  }

  return { status: 'idle' as const };
}

router.post('/lunch/match', (req, res) => {
  const userId = req.auth!.userId;
  const { venue_id } = req.body as { venue_id?: string };
  const pending = getDb()
    .prepare(
      `SELECT id FROM lunch_match_requests WHERE user_id = ? AND status = 'pending'`,
    )
    .get(userId);
  if (pending) return fail(res, '已有进行中的匹配', 409);

  const id = uuid();
  const vId = venue_id ?? 'venue-1';
  const persona = getPersona(userId);
  const myTags = persona?.tags ?? [];
  getDb()
    .prepare(
      `INSERT INTO lunch_match_requests (id, user_id, venue_id, status) VALUES (?, ?, ?, 'pending')`,
    )
    .run(id, userId, vId);
  scheduleLunchMatch(id, userId, vId, myTags);
  return ok(res, {
    request_id: id,
    status: 'pending',
    created_at: new Date().toISOString(),
  });
});

router.get('/lunch/status', (req, res) => {
  const userId = req.auth!.userId;
  const row = getDb()
    .prepare(
      `SELECT * FROM lunch_match_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    )
    .get(userId) as Record<string, unknown> | undefined;

  if (!row || row.status === 'cancelled') {
    return ok(res, { status: 'idle' });
  }

  return ok(res, lunchStatusPayload(row, userId));
});

router.post('/lunch/match/confirm', (req, res) => {
  const userId = req.auth!.userId;
  const row = getDb()
    .prepare(
      `SELECT * FROM lunch_match_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    )
    .get(userId) as Record<string, unknown> | undefined;

  if (!row || row.status !== 'matched') {
    return fail(res, '当前没有可确认的匹配', 400);
  }

  const db = getDb();
  db
    .prepare(
      `UPDATE lunch_match_requests SET confirmed_at = datetime('now') WHERE id = ?`,
    )
    .run(row.id);

  try {
    const rewardExists = db
      .prepare(`SELECT 1 FROM desk_rewards WHERE source = 'lunch_match' AND ref_id = ?`)
      .get(String(row.id));
    if (!rewardExists) {
      const venueId = String(row.venue_id ?? 'venue-1');
      const venue = getSceneVenue(venueId);
      const kind =
        venue.scene_tag === '户外'
          ? 'outdoor_badge'
          : venue.scene_tag === '用餐'
            ? 'meal_voucher'
            : 'scene_perk';
      const title =
        kind === 'meal_voucher'
          ? '饭搭子餐券'
          : kind === 'outdoor_badge'
            ? '户外碰头徽章'
            : '场景奖励贴';
      db.prepare(
        `INSERT INTO desk_rewards
         (id, user_id, source, ref_id, reward_kind, title, detail, venue_id, earned_at)
         VALUES (?, ?, 'lunch_match', ?, ?, ?, ?, ?, datetime('now'))`,
      ).run(
        `lunch-${String(row.id)}`,
        userId,
        String(row.id),
        kind,
        title,
        [venue.name, String(row.match_code ?? '')].filter(Boolean).join(' · ') || null,
        venueId,
      );
    }
  } catch {
    // ignore on legacy DB
  }

  const updated = db
    .prepare(`SELECT * FROM lunch_match_requests WHERE id = ?`)
    .get(row.id) as Record<string, unknown>;

  return ok(res, lunchStatusPayload(updated, userId));
});

router.post('/lunch/match/back', (req, res) => {
  const userId = req.auth!.userId;
  const row = getDb()
    .prepare(
      `SELECT * FROM lunch_match_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    )
    .get(userId) as Record<string, unknown> | undefined;

  if (!row || row.status !== 'matched') {
    return fail(res, '当前没有可返回的匹配结果', 400);
  }

  getDb()
    .prepare(
      `UPDATE lunch_match_requests SET confirmed_at = NULL WHERE id = ?`,
    )
    .run(row.id);

  const updated = getDb()
    .prepare(`SELECT * FROM lunch_match_requests WHERE id = ?`)
    .get(row.id) as Record<string, unknown>;

  return ok(res, lunchStatusPayload(updated, userId));
});

router.delete('/lunch/match', (req, res) => {
  const userId = req.auth!.userId;
  getDb()
    .prepare(
      `UPDATE lunch_match_requests SET status = 'cancelled', confirmed_at = NULL
       WHERE user_id = ? AND status IN ('pending', 'matched')`,
    )
    .run(userId);
  return res.status(204).send();
});

router.get('/interest/venues', (req, res) => {
  return ok(res, listInterestVenues(getDb(), req.auth!.userId));
});

function scheduleInterestMatch(
  requestId: string,
  userId: string,
  venueId: string,
  myInterests: string[],
) {
  setTimeout(() => {
    const db = getDb();
    const partner = pickInterestPartner(
      db,
      userId,
      myInterests,
      requestId,
      venueId,
    );
    if (!partner) return;

    const { matchCode, meetingPoint } = assignInterestMatchDetails(
      requestId,
      venueId,
    );
    const sameScene = Boolean(
      (partner as { from_same_scene_queue?: boolean }).from_same_scene_queue,
    );
    if (sameScene) {
      completePartnerPendingAtScene(
        db,
        partner.user_id,
        userId,
        venueId,
        matchCode,
        meetingPoint,
      );
    }
    db.prepare(
      `UPDATE interest_match_requests
       SET status = 'matched', match_code = ?, meeting_point = ?,
           meet_before = datetime('now', '+1 hour'), matched_at = datetime('now'),
           partner_user_id = ?, confirmed_at = NULL
       WHERE id = ? AND status = 'pending'`,
    ).run(matchCode, meetingPoint, partner.user_id, requestId);
    notifyInterestMatched(db, userId, matchCode, meetingPoint);
  }, 2500);
}

function interestStatusPayload(
  row: Record<string, unknown>,
  userId: string,
) {
  const myInterests = getUserInterests(getDb(), userId);

  if (row.status === 'pending') {
    const venueId = String(row.venue_id ?? 'spot-interest');
    return {
      status: 'pending' as const,
      request_id: row.id,
      venue_id: venueId,
      venue_name: getSceneVenue(venueId).name,
      matching_tags: myInterests,
    };
  }

  if (row.status === 'matched') {
    const partnerId = row.partner_user_id
      ? String(row.partner_user_id)
      : null;
    const partnerPersona = partnerId
      ? (() => {
          const p = getPersona(partnerId);
          const partnerInterests = getUserInterests(getDb(), partnerId);
          return p
            ? formatInterestPartner(p.name, partnerInterests, myInterests)
            : undefined;
        })()
      : undefined;
    const venueId = String(row.venue_id ?? 'spot-interest');
    const confirmed = Boolean(row.confirmed_at);
    const base = {
      status: 'matched' as const,
      request_id: row.id,
      match_code: row.match_code,
      meeting_point: row.meeting_point,
      meet_before: row.meet_before,
      venue_id: venueId,
      venue_name: getSceneVenue(venueId).name,
      partner_persona: partnerPersona,
      confirmed,
    };
    if (confirmed) {
      return {
        ...base,
        roadmap: buildInterestRoadmap(
          venueId,
          String(row.meeting_point ?? ''),
          row.meet_before ? String(row.meet_before) : null,
        ),
        nearby_merchants: getInterestNearbyMerchants(venueId),
      };
    }
    return base;
  }

  return { status: 'idle' as const };
}

router.post('/interest/match', (req, res) => {
  const userId = req.auth!.userId;
  const { venue_id } = req.body as { venue_id?: string };
  const pending = getDb()
    .prepare(
      `SELECT id FROM interest_match_requests WHERE user_id = ? AND status = 'pending'`,
    )
    .get(userId);
  if (pending) return fail(res, '已有进行中的兴趣匹配', 409);

  const id = uuid();
  const vId = venue_id ?? 'spot-1';
  const myInterests = getUserInterests(getDb(), userId);
  if (myInterests.length === 0) {
    return fail(res, '请先完成入职盲盒以生成兴趣标签', 400);
  }
  getDb()
    .prepare(
      `INSERT INTO interest_match_requests (id, user_id, venue_id, status) VALUES (?, ?, ?, 'pending')`,
    )
    .run(id, userId, vId);
  scheduleInterestMatch(id, userId, vId, myInterests);
  return ok(res, {
    request_id: id,
    status: 'pending',
    created_at: new Date().toISOString(),
  });
});

router.get('/interest/status', (req, res) => {
  const userId = req.auth!.userId;
  const row = getDb()
    .prepare(
      `SELECT * FROM interest_match_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    )
    .get(userId) as Record<string, unknown> | undefined;

  if (!row || row.status === 'cancelled') {
    return ok(res, { status: 'idle' });
  }

  return ok(res, interestStatusPayload(row, userId));
});

router.post('/interest/match/confirm', (req, res) => {
  const userId = req.auth!.userId;
  const row = getDb()
    .prepare(
      `SELECT * FROM interest_match_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    )
    .get(userId) as Record<string, unknown> | undefined;

  if (!row || row.status !== 'matched') {
    return fail(res, '当前没有可确认的匹配', 400);
  }

  const db = getDb();
  db
    .prepare(
      `UPDATE interest_match_requests SET confirmed_at = datetime('now') WHERE id = ?`,
    )
    .run(row.id);

  try {
    const rewardExists = db
      .prepare(`SELECT 1 FROM desk_rewards WHERE source = 'interest_match' AND ref_id = ?`)
      .get(String(row.id));
    if (!rewardExists) {
      const venueId = String(row.venue_id ?? 'spot-interest');
      const venue = getSceneVenue(venueId);
      db.prepare(
        `INSERT INTO desk_rewards
         (id, user_id, source, ref_id, reward_kind, title, detail, venue_id, earned_at)
         VALUES (?, ?, 'interest_match', ?, 'scene_perk', ?, ?, ?, datetime('now'))`,
      ).run(
        `interest-${String(row.id)}`,
        userId,
        String(row.id),
        '兴趣场景奖励贴',
        [venue.name, String(row.match_code ?? '')].filter(Boolean).join(' · ') || null,
        venueId,
      );
    }
  } catch {
    // ignore on legacy DB
  }

  const updated = db
    .prepare(`SELECT * FROM interest_match_requests WHERE id = ?`)
    .get(row.id) as Record<string, unknown>;

  return ok(res, interestStatusPayload(updated, userId));
});

router.post('/interest/match/back', (req, res) => {
  const userId = req.auth!.userId;
  const row = getDb()
    .prepare(
      `SELECT * FROM interest_match_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    )
    .get(userId) as Record<string, unknown> | undefined;

  if (!row || row.status !== 'matched') {
    return fail(res, '当前没有可返回的匹配结果', 400);
  }

  getDb()
    .prepare(
      `UPDATE interest_match_requests SET confirmed_at = NULL WHERE id = ?`,
    )
    .run(row.id);

  const updated = getDb()
    .prepare(`SELECT * FROM interest_match_requests WHERE id = ?`)
    .get(row.id) as Record<string, unknown>;

  return ok(res, interestStatusPayload(updated, userId));
});

router.delete('/interest/match', (req, res) => {
  const userId = req.auth!.userId;
  getDb()
    .prepare(
      `UPDATE interest_match_requests SET status = 'cancelled', confirmed_at = NULL
       WHERE user_id = ? AND status IN ('pending', 'matched')`,
    )
    .run(userId);
  return res.status(204).send();
});

router.get('/mentor/assignees', requireRoles('mentor'), (req, res) => {
  const mentorId = req.auth!.userId;
  const rows = getDb()
    .prepare(
      `SELECT u.id as user_id, u.nickname, u.onboarding_date, p.name as persona_name, p.tags
       FROM mentor_assignments ma
       JOIN users u ON u.id = ma.mentee_id
       LEFT JOIN personas p ON p.user_id = u.id
       WHERE ma.mentor_id = ?`,
    )
    .all(mentorId) as Record<string, unknown>[];

  const assignees = rows.map((r) => {
    const uid = String(r.user_id);
    const energy = getEnergy(uid);
    const latestMood = getDb()
      .prepare(
        `SELECT log_text FROM mood_logs WHERE user_id = ? AND log_text IS NOT NULL AND log_text != ''
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get(uid) as { log_text: string } | undefined;
    let risk: 'normal' | 'watch' | 'alert' = 'normal';
    if (energy < 30) risk = 'alert';
    else if (energy < 50) risk = 'watch';
    return {
      user_id: uid,
      nickname: r.nickname,
      persona: {
        name: r.persona_name ?? '未生成',
        tags: r.tags ? JSON.parse(String(r.tags)) : [],
      },
      energy_level: energy,
      latest_mood_note: latestMood?.log_text ?? null,
      onboarding_days_left: onboardingDaysLeft(String(r.onboarding_date)),
      risk,
    };
  });
  return ok(res, { assignees });
});

router.get('/hr/dashboard/stats', requireRoles('hr'), (req, res) => {
  const limit = Number(req.query.batch_limit) || 4;
  const dept = String(req.query.dept ?? req.query.q ?? '').trim() || undefined;
  return ok(res, computeHrDashboardStats(getDb(), { dept, batchLimit: limit }));
});

router.get('/hr/mood/trends', requireRoles('hr'), (req, res) => {
  const dept = String(req.query.dept ?? req.query.q ?? '').trim() || undefined;
  return ok(res, computeHrMoodTrends(getDb(), dept));
});

router.get('/hr/newcomers', requireRoles('hr'), (_req, res) => {
  const rows = getDb()
    .prepare(
      `SELECT u.id, u.nickname, p.name as persona_name FROM users u
       LEFT JOIN personas p ON p.user_id = u.id WHERE u.role = 'newcomer'`,
    )
    .all() as Record<string, unknown>[];

  return ok(res, {
    items: rows.map((r, idx) => ({
      id: r.id,
      alias_name: r.nickname,
      dept: getUserDeptName(String(r.id), idx),
      batch: getUserBatchName(String(r.id)),
      persona_name: r.persona_name ?? '—',
      energy_level: getEnergy(String(r.id)),
      risk: getEnergy(String(r.id)) < 50 ? 'watch' : 'normal',
    })),
    total: rows.length,
    page: 1,
    page_size: 20,
  });
});

router.get('/hr/newcomers/search', requireRoles('hr'), (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.page_size) || 20;

  const rows = getDb()
    .prepare(
      `SELECT u.id, u.nickname, p.name as persona_name, u.onboarding_date
       FROM users u
       LEFT JOIN personas p ON p.user_id = u.id
       WHERE u.role = 'newcomer'`,
    )
    .all() as Record<string, unknown>[];

  let items = rows.map((r, idx) => {
    const uid = String(r.id);
    const dept = getUserDeptName(uid, idx);
    const energy = getEnergy(uid);
    return {
      id: uid,
      alias_name: String(r.nickname),
      dept,
      batch: getUserBatchName(uid),
      persona_name: r.persona_name ?? '—',
      energy_level: energy,
      risk: energy < 50 ? 'watch' : 'normal',
    };
  });

  if (q) {
    items = items.filter(
      (it) =>
        matchDeptFilter(it.dept, q) ||
        it.alias_name.includes(q) ||
        String(it.persona_name).includes(q),
    );
  }

  const total = items.length;
  const start = (page - 1) * pageSize;
  return ok(res, {
    items: items.slice(start, start + pageSize),
    total,
    page,
    page_size: pageSize,
    departments: HR_DEPARTMENTS,
    query: q || null,
  });
});

router.get('/hr/alerts', requireRoles('hr'), (req, res) => {
  const limit = Number(req.query.limit) || 20;
  const q = String(req.query.q ?? '').trim();
  const rows = getDb()
    .prepare(
      `SELECT id, user_alias, dept, reason, severity FROM hr_alerts WHERE resolved = 0 ORDER BY created_at DESC`,
    )
    .all() as {
    id: string;
    user_alias: string;
    dept: string;
    reason: string;
    severity: string;
  }[];

  const alerts = q
    ? rows.filter(
        (a) =>
          matchDeptFilter(a.dept, q) ||
          a.user_alias.includes(q) ||
          a.reason.includes(q),
      )
    : rows;

  return ok(res, {
    alerts: alerts.slice(0, limit),
    total: alerts.length,
    query: q || null,
    departments: HR_DEPARTMENTS,
  });
});

router.get('/system/status', async (req, res) => {
  const { getSystemStatus } = await import('../services/aiHrChat.js');
  return ok(res, getSystemStatus(req.auth!.userId));
});

router.get('/ai/hr/skill', async (req, res) => {
  try {
    const user = getUserRow(req.auth!.userId)!;
    const { getAiHrSkill } = await import('../services/aiHrChat.js');
    return ok(res, getAiHrSkill(String(user.role)));
  } catch (e) {
    console.error('ai/hr/skill', e);
    return fail(res, 'AI HR Skill 加载失败', 500);
  }
});

router.get('/ai/hr/history', async (req, res) => {
  try {
    const { getAiHrHistory } = await import('../services/aiHrChat.js');
    return ok(res, getAiHrHistory(req.auth!.userId));
  } catch (e) {
    console.error('ai/hr/history', e);
    return fail(res, '对话记录加载失败', 500);
  }
});

router.get('/ai/hr/guidelines', async (req, res) => {
  try {
    const q = String(req.query.q ?? '').trim();
    const { getAiHrGuidelines, searchAiHrGuidelines } = await import(
      '../services/aiHrChat.js'
    );
    if (q) return ok(res, searchAiHrGuidelines(q));
    return ok(res, getAiHrGuidelines());
  } catch (e) {
    console.error('ai/hr/guidelines', e);
    return fail(res, '企业管理准则加载失败', 500);
  }
});

router.post('/ai/hr/chat', async (req, res) => {
  try {
    const { message } = req.body as { message?: string };
    if (!message?.trim()) return fail(res, '消息不能为空', 400);
    const user = getUserRow(req.auth!.userId)!;
    const { generateAiHrResponse } = await import('../services/aiHrChat.js');
    const result = await generateAiHrResponse(
      req.auth!.userId,
      String(user.role),
      message.trim(),
    );
    return ok(res, {
      reply: result.reply,
      role: user.role,
      reply_source: result.source,
      topic: result.topic,
      citations: result.citations,
      policy_version: result.policy_version,
      integrated_sources: result.integrated_sources,
    });
  } catch (e) {
    console.error('ai/hr/chat', e);
    return fail(res, 'AI 回复生成失败，请稍后重试', 500);
  }
});

router.delete('/ai/hr/history', (req, res) => {
  try {
    const userId = req.auth!.userId;
    const db = getDb();
    const sessions = db
      .prepare(`SELECT id FROM ai_hr_sessions WHERE user_id = ?`)
      .all(userId) as { id: string }[];
    for (const s of sessions) {
      db.prepare(`DELETE FROM ai_hr_messages WHERE session_id = ?`).run(s.id);
      db.prepare(`DELETE FROM ai_hr_sessions WHERE id = ?`).run(s.id);
    }
    return ok(res, { cleared: true });
  } catch (e) {
    console.error('ai/hr/history delete', e);
    return fail(res, '清空对话失败', 500);
  }
});

router.post('/hr/interventions', requireRoles('hr'), (req, res) => {
  const { alert_ids, channel, note } = req.body as {
    alert_ids?: string[];
    channel?: string;
    note?: string;
  };
  const ids = alert_ids ?? [];
  const sentIds: string[] = [];
  if (ids.length) {
    const placeholders = ids.map(() => '?').join(',');
    const db = getDb();
    db
      .prepare(`UPDATE hr_alerts SET resolved = 1 WHERE id IN (${placeholders})`)
      .run(...ids);
    try {
      const ins = db.prepare(
        `INSERT INTO hr_interventions
         (id, alert_id, target_user_id, operator_user_id, channel, action, note)
         VALUES (?, ?, ?, ?, ?, 'resolve_alert', ?)`,
      );
      for (const aid of ids) {
        const row = db
          .prepare(`SELECT user_id FROM hr_alerts WHERE id = ?`)
          .get(aid) as { user_id: string } | undefined;
        const iid = uuid();
        ins.run(
          iid,
          aid,
          row?.user_id ?? null,
          req.auth!.userId,
          channel ?? 'hrbp',
          note?.trim() || null,
        );
        if (row?.user_id) {
          notifyNewcomerOfHrIntervention(db, row.user_id, note);
        }
        sentIds.push(iid);
      }
    } catch {
      // ignore on legacy DB
    }
  }
  return ok(res, { sent: ids.length, failed: 0, intervention_ids: sentIds });
});

/** HR 录入待入职新人（工号 + 姓名 + 部门） */
router.get('/hr/onboarding/pending', requireRoles('hr'), (_req, res) => {
  const items = listPendingNewcomers(getDb()).map((row) => ({
    ...row,
    status_label: pendingStatusLabel(row),
  }));
  return ok(res, { items, total: items.length });
});

router.post('/hr/onboarding/register', requireRoles('hr'), (req, res) => {
  const { username, nickname, dept } = req.body as {
    username?: string;
    nickname?: string;
    dept?: string;
  };
  if (!username?.trim() || !nickname?.trim() || !dept?.trim()) {
    return fail(res, '请填写工号、姓名与部门');
  }
  try {
    const created = registerPendingNewcomer(getDb(), {
      username,
      nickname,
      dept,
    });
    return ok(res, {
      ...created,
      message: `已创建待入职账号 ${created.username}，默认密码 ${created.default_password}，新人首次登录后将完成人格测试并自动转为老员工。`,
    });
  } catch (e) {
    return fail(res, e instanceof Error ? e.message : '录入失败', 400);
  }
});

export default router;
