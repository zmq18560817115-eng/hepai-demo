import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb, onboardingDaysLeft } from '../db/index.js';
import { DEV_USERS } from '../db/seed.js';
import { authRequired, requireRoles, signToken } from '../middleware/auth.js';
import { generatePersonaFromAnswers } from '../utils/persona.js';
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

function getPersona(userId: string) {
  const row = getDb()
    .prepare(`SELECT * FROM personas WHERE user_id = ?`)
    .get(userId) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    tags: JSON.parse(String(row.tags ?? '[]')),
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
}

// --- Auth ---
router.post('/auth/dingtalk', (req, res) => {
  const { auth_code } = req.body as { auth_code?: string };
  if (!auth_code) return fail(res, '缺少 auth_code');

  let userId = DEV_AUTH_MAP[auth_code];
  if (!userId) {
    const row = getDb()
      .prepare(`SELECT id FROM users WHERE dingtalk_user_id = ?`)
      .get(auth_code) as { id: string } | undefined;
    if (!row) return fail(res, '未知用户', 401);
    userId = row.id;
  }

  const user = getUserRow(userId);
  if (!user) return fail(res, '用户不存在', 404);

  const token = signToken(userId, String(user.role));
  return ok(res, {
    access_token: token,
    expires_in: 604800,
    user: formatUser(user),
  });
});

router.get('/health', (_req, res) => ok(res, { status: 'up' }));

// --- Protected ---
router.use(authRequired);

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

  const values = answers.map((a) => a.answer_value);
  const persona = generatePersonaFromAnswers(values);
  const db = getDb();

  const tx = db.transaction(() => {
    for (const a of answers) {
      db.prepare(
        `INSERT INTO user_answers (id, user_id, question_id, answer_value) VALUES (?, ?, ?, ?)`,
      ).run(uuid(), userId, a.question_id, a.answer_value);
    }
    const personaId = uuid();
    db.prepare(
      `INSERT INTO personas (id, user_id, name, tags, motto) VALUES (?, ?, ?, ?, ?)`,
    ).run(
      personaId,
      userId,
      persona.name,
      JSON.stringify(persona.tags),
      persona.motto,
    );
    db.prepare(`UPDATE users SET onboarding_completed = 1 WHERE id = ?`).run(
      userId,
    );
    upsertEnergy(userId, 75);
    return personaId;
  });

  const personaId = tx();
  return ok(res, {
    onboarding_completed: true,
    persona: {
      id: personaId,
      name: persona.name,
      tags: persona.tags,
      motto: persona.motto,
    },
  });
});

router.get('/personas/me', (req, res) => {
  const persona = getPersona(req.auth!.userId);
  if (!persona) return fail(res, '面具尚未创建', 404);
  return ok(res, persona);
});

router.get('/workplace', (req, res) => {
  const userId = req.auth!.userId;
  const user = getUserRow(userId)!;
  const persona = getPersona(userId);
  if (!persona) return fail(res, '请先完成入职盲盒', 400);

  const mentors = getDb()
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

  const latestMood = getDb()
    .prepare(
      `SELECT log_text, created_at FROM mood_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    )
    .get(userId) as { log_text: string; created_at: string } | undefined;

  const lunch = getDb()
    .prepare(
      `SELECT status FROM lunch_match_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    )
    .get(userId) as { status: string } | undefined;

  const activeCount =
    (
      getDb()
        .prepare(
          `SELECT COUNT(*) as c FROM lunch_match_requests WHERE status IN ('pending','matched') AND date(created_at) = date('now')`,
        )
        .get() as { c: number }
    ).c + 12;

  return ok(res, {
    user: {
      nickname: user.nickname,
      avatar_url: user.avatar_url,
      onboarding_days_left: onboardingDaysLeft(String(user.onboarding_date)),
    },
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
    mentors: mentors.map((m) => ({
      id: m.id,
      name: m.name,
      avatar_url: m.avatar_url,
      role:
        m.type === 'main' ? '架构师 / 你的主导师' : '项目主管',
      status: m.status ?? 'available',
      type: m.type,
    })),
    lunch: {
      active_buddies_count: activeCount,
      current_status: lunch?.status ?? 'idle',
    },
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

router.patch('/mood/energy', (req, res) => {
  const userId = req.auth!.userId;
  const { energy_level } = req.body as { energy_level: number };
  upsertEnergy(userId, energy_level);
  return ok(res, {
    energy_level,
    updated_at: new Date().toISOString(),
  });
});

router.get('/mentors', (req, res) => {
  const userId = req.auth!.userId;
  const mentors = getDb()
    .prepare(
      `SELECT u.id, u.nickname as name, u.avatar_url, u.mentor_status as status, ma.type
       FROM mentor_assignments ma JOIN users u ON u.id = ma.mentor_id WHERE ma.mentee_id = ?`,
    )
    .all(userId);
  return ok(res, {
    mentors: (mentors as Record<string, string>[]).map((m) => ({
      id: m.id,
      name: m.name,
      avatar_url: m.avatar_url,
      role: m.type === 'main' ? '架构师 / 你的主导师' : '项目主管',
      status: m.status,
      type: m.type,
    })),
  });
});

router.get('/lunch/venues', (_req, res) => {
  return ok(res, {
    venues: [
      {
        id: 'venue-1',
        name: '园区食堂 · 3F 休闲区',
        floor: '3F',
        active_buddies_count: 24,
      },
    ],
    default_venue_id: 'venue-1',
  });
});

function scheduleLunchMatch(requestId: string, userId: string) {
  setTimeout(() => {
    const partner = getDb()
      .prepare(
        `SELECT p.name, p.tags FROM personas p WHERE p.user_id = ?`,
      )
      .get(DEV_USERS.partner) as { name: string; tags: string } | undefined;

    const codes = ['BLUE-K88', 'PINK-M21', 'JADE-T09'];
    const code = codes[Math.floor(Math.random() * codes.length)];

    getDb()
      .prepare(
        `UPDATE lunch_match_requests SET status = 'matched', match_code = ?, meeting_point = ?, meet_before = datetime('now', '+1 hour'), matched_at = datetime('now'), partner_user_id = ? WHERE id = ? AND status = 'pending'`,
      )
      .run(
        code,
        '食堂3楼休闲区 A15座',
        DEV_USERS.partner,
        requestId,
      );
  }, 2500);
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
  getDb()
    .prepare(
      `INSERT INTO lunch_match_requests (id, user_id, venue_id, status) VALUES (?, ?, ?, 'pending')`,
    )
    .run(id, userId, venue_id ?? 'venue-1');
  scheduleLunchMatch(id, userId);
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

  const persona = getPersona(userId);
  if (row.status === 'pending') {
    return ok(res, {
      status: 'pending',
      request_id: row.id,
      matching_tags: persona?.tags ?? [],
    });
  }

  if (row.status === 'matched') {
    const partner = row.partner_user_id
      ? getPersona(String(row.partner_user_id))
      : null;
    return ok(res, {
      status: 'matched',
      request_id: row.id,
      match_code: row.match_code,
      meeting_point: row.meeting_point,
      meet_before: row.meet_before,
      partner_persona: partner
        ? { name: partner.name, tags: partner.tags }
        : undefined,
    });
  }

  return ok(res, { status: 'idle' });
});

router.delete('/lunch/match', (req, res) => {
  const userId = req.auth!.userId;
  getDb()
    .prepare(
      `UPDATE lunch_match_requests SET status = 'cancelled' WHERE user_id = ? AND status = 'pending'`,
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
    const energy = getEnergy(String(r.user_id));
    let risk: 'normal' | 'watch' | 'alert' = 'normal';
    if (energy < 30) risk = 'alert';
    else if (energy < 50) risk = 'watch';
    return {
      user_id: r.user_id,
      nickname: r.nickname,
      persona: {
        name: r.persona_name ?? '未生成',
        tags: r.tags ? JSON.parse(String(r.tags)) : [],
      },
      energy_level: energy,
      onboarding_days_left: onboardingDaysLeft(String(r.onboarding_date)),
      risk,
    };
  });
  return ok(res, { assignees });
});

router.get('/hr/dashboard/stats', requireRoles('hr'), (req, res) => {
  const limit = Number(req.query.batch_limit) || 4;
  return ok(res, {
    integration_index: 84.2,
    integration_trend: '+3.4%',
    newcomers_at_risk: 12,
    newcomers_at_risk_trend: '-2',
    mentor_activity_rate: 0.96,
    mentor_activity_trend: '+1.2%',
    lunch_match_success_rate: 0.78,
    lunch_match_success_trend: '+5.0%',
    batches: [
      { name: '5月一批', active: 92, risk: 5 },
      { name: '5月二批', active: 88, risk: 8 },
      { name: '4月二批', active: 78, risk: 18 },
      { name: '4月一批', active: 85, risk: 12 },
    ].slice(0, limit),
  });
});

router.get('/hr/mood/trends', requireRoles('hr'), (_req, res) => {
  return ok(res, {
    points: [
      { time: '10:00', score: 80 },
      { time: '11:00', score: 75 },
      { time: '12:00', score: 85 },
      { time: '13:00', score: 90 },
      { time: '14:00', score: 65 },
      { time: '15:00', score: 70 },
      { time: '16:00', score: 75 },
    ],
  });
});

router.get('/hr/newcomers', requireRoles('hr'), (_req, res) => {
  const rows = getDb()
    .prepare(
      `SELECT u.id, u.nickname, p.name as persona_name FROM users u
       LEFT JOIN personas p ON p.user_id = u.id WHERE u.role = 'newcomer'`,
    )
    .all() as Record<string, unknown>[];

  return ok(res, {
    items: rows.map((r) => ({
      id: r.id,
      alias_name: r.nickname,
      dept: '研发中心 / 测试组',
      batch: '5月一批',
      persona_name: r.persona_name ?? '—',
      energy_level: getEnergy(String(r.id)),
      risk: getEnergy(String(r.id)) < 50 ? 'watch' : 'normal',
    })),
    total: rows.length,
    page: 1,
    page_size: 20,
  });
});

router.get('/hr/alerts', requireRoles('hr'), (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const alerts = getDb()
    .prepare(
      `SELECT id, user_alias, dept, reason, severity FROM hr_alerts WHERE resolved = 0 ORDER BY created_at DESC LIMIT ?`,
    )
    .all(limit);
  return ok(res, { alerts });
});

router.get('/ai/hr/history', async (req, res) => {
  const { getAiHrHistory } = await import('../services/aiHrChat.js');
  return ok(res, getAiHrHistory(req.auth!.userId));
});

router.post('/ai/hr/chat', async (req, res) => {
  const { message } = req.body as { message?: string };
  if (!message?.trim()) return fail(res, '消息不能为空');
  const user = getUserRow(req.auth!.userId)!;
  const { generateAiHrResponse } = await import('../services/aiHrChat.js');
  const reply = await generateAiHrResponse(
    req.auth!.userId,
    String(user.role),
    message.trim(),
  );
  return ok(res, { reply, role: user.role });
});

router.delete('/ai/hr/history', (req, res) => {
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
});

router.post('/hr/interventions', requireRoles('hr'), (req, res) => {
  const { alert_ids } = req.body as { alert_ids?: string[] };
  const ids = alert_ids ?? [];
  if (ids.length) {
    const placeholders = ids.map(() => '?').join(',');
    getDb()
      .prepare(`UPDATE hr_alerts SET resolved = 1 WHERE id IN (${placeholders})`)
      .run(...ids);
  }
  return ok(res, { sent: ids.length, failed: 0 });
});

export default router;
