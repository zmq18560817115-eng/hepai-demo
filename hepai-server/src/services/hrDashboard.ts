import type Database from 'better-sqlite3';
import { HR_DEPARTMENTS, resolveUserDept } from '../db/fullSeed.js';

export type NewcomerRow = {
  id: string;
  nickname: string;
  onboarding_date: string;
  onboarding_completed: number;
  dept: string;
};

function getEnergy(db: Database.Database, userId: string): number {
  const snap = db
    .prepare(`SELECT energy_level FROM user_energy_snapshot WHERE user_id = ?`)
    .get(userId) as { energy_level: number } | undefined;
  if (snap) return snap.energy_level;
  const log = db
    .prepare(
      `SELECT energy_level FROM mood_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    )
    .get(userId) as { energy_level: number } | undefined;
  return log?.energy_level ?? 75;
}

/** 解析搜索词对应的 canonical 部门名 */
export function resolveDeptQuery(q: string): (typeof HR_DEPARTMENTS)[number] | null {
  const query = q.trim().toLowerCase();
  if (!query) return null;
  for (const name of HR_DEPARTMENTS) {
    const short = name.replace('部门', '').toLowerCase();
    if (
      query === name.toLowerCase() ||
      name.toLowerCase().includes(query) ||
      query.includes(short)
    ) {
      return name;
    }
  }
  return null;
}

/** 行部门字段是否属于本次筛选（避免「任意 short 命中所有部门」） */
export function matchDeptFilter(dept: string, q: string): boolean {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  const target = resolveDeptQuery(q);
  if (!target) {
    return dept.toLowerCase().includes(query);
  }
  return dept === target;
}

export function listNewcomersWithDept(db: Database.Database): NewcomerRow[] {
  const rows = db
    .prepare(
      `SELECT id, nickname, onboarding_date, onboarding_completed
       FROM users WHERE role = 'newcomer' ORDER BY onboarding_date DESC`,
    )
    .all() as Omit<NewcomerRow, 'dept'>[];

  return rows.map((r, idx) => ({
    ...r,
    dept: resolveUserDept(r.id, idx, db),
  }));
}

export function filterNewcomersByDept(
  rows: NewcomerRow[],
  deptQuery?: string,
): NewcomerRow[] {
  const q = deptQuery?.trim();
  if (!q) return rows;
  return rows.filter((r) => matchDeptFilter(r.dept, q));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function formatTrend(delta: number, asPercent = true): string {
  const sign = delta >= 0 ? '+' : '';
  if (asPercent) return `${sign}${round1(delta)}%`;
  return `${sign}${Math.round(delta)}`;
}

function batchNameFromDate(onboardingDate: string): string {
  const d = new Date(`${onboardingDate}T12:00:00`);
  const month = d.getMonth() + 1;
  const suffix = d.getDate() <= 15 ? '一批' : '二批';
  return `${month}月${suffix}`;
}

function groupBatches(
  rows: NewcomerRow[],
  db: Database.Database,
  limit: number,
) {
  const map = new Map<string, { members: NewcomerRow[]; sortKey: string }>();
  for (const r of rows) {
    const name = batchNameFromDate(r.onboarding_date);
    if (!map.has(name)) {
      map.set(name, { members: [], sortKey: r.onboarding_date });
    }
    const entry = map.get(name)!;
    entry.members.push(r);
    if (r.onboarding_date > entry.sortKey) entry.sortKey = r.onboarding_date;
  }

  return [...map.entries()]
    .map(([name, { members, sortKey }]) => {
      const energies = members.map((m) => getEnergy(db, m.id));
      const active =
        energies.length > 0
          ? round1(energies.reduce((a, b) => a + b, 0) / energies.length)
          : 0;
      const risk = members.filter((m) => getEnergy(db, m.id) < 50).length;
      return { name, active, risk, sortKey };
    })
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
    .slice(0, limit)
    .map(({ name, active, risk }) => ({ name, active, risk }));
}

function countAtRisk(
  db: Database.Database,
  scoped: NewcomerRow[],
  deptQuery?: string,
): number {
  const ids = new Set<string>();
  for (const r of scoped) {
    if (getEnergy(db, r.id) < 50) ids.add(r.id);
  }

  const alerts = db
    .prepare(
      `SELECT user_id, dept FROM hr_alerts WHERE resolved = 0`,
    )
    .all() as { user_id: string; dept: string }[];

  for (const a of alerts) {
    if (deptQuery?.trim()) {
      if (matchDeptFilter(a.dept, deptQuery)) ids.add(a.user_id);
    } else {
      ids.add(a.user_id);
    }
  }
  return ids.size;
}

function mentorActivityRate(db: Database.Database, userIds: string[]): number {
  if (userIds.length === 0) return 0;
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  let active = 0;
  for (const menteeId of userIds) {
    const touch = db
      .prepare(
        `SELECT COUNT(*) as c FROM mentor_touchpoints
         WHERE mentee_id = ? AND created_at >= ?`,
      )
      .get(menteeId, cutoff) as { c: number };
    if (touch.c > 0) {
      active += 1;
      continue;
    }
    const chat = db
      .prepare(
        `SELECT COUNT(*) as c FROM mentor_chat_messages m
         JOIN mentor_chat_threads t ON t.id = m.thread_id
         WHERE t.mentee_id = ? AND m.created_at >= ?`,
      )
      .get(menteeId, cutoff) as { c: number };
    if (chat.c > 0) active += 1;
  }
  return active / userIds.length;
}

function lunchSuccessRate(db: Database.Database, userIds: string[]): number {
  if (userIds.length === 0) return 0;
  const placeholders = userIds.map(() => '?').join(',');
  const rows = db
    .prepare(
      `SELECT status, COUNT(*) as c FROM lunch_match_requests
       WHERE user_id IN (${placeholders}) GROUP BY status`,
    )
    .all(...userIds) as { status: string; c: number }[];

  let matched = 0;
  let total = 0;
  for (const r of rows) {
    total += r.c;
    if (r.status === 'matched') matched += r.c;
  }
  if (total === 0) {
    const avg =
      userIds.reduce((s, id) => s + getEnergy(db, id), 0) / userIds.length;
    return Math.min(0.95, Math.max(0.35, avg / 100));
  }
  return matched / total;
}

function buildStatsForScope(
  db: Database.Database,
  scoped: NewcomerRow[],
  batchLimit: number,
) {
  const userIds = scoped.map((r) => r.id);
  const energies = userIds.map((id) => getEnergy(db, id));
  const integration_index =
    energies.length > 0
      ? round1(energies.reduce((a, b) => a + b, 0) / energies.length)
      : 0;

  return {
    integration_index,
    newcomers_at_risk: countAtRisk(db, scoped, undefined),
    mentor_activity_rate: mentorActivityRate(db, userIds),
    lunch_match_success_rate: lunchSuccessRate(db, userIds),
    batches: groupBatches(scoped, db, batchLimit),
    newcomer_count: scoped.length,
  };
}

export function computeHrDashboardStats(
  db: Database.Database,
  opts: { dept?: string; batchLimit?: number },
) {
  const batchLimit = opts.batchLimit ?? 4;
  const all = listNewcomersWithDept(db);
  const scoped = filterNewcomersByDept(all, opts.dept);
  const company = buildStatsForScope(db, all, batchLimit);

  const scopedStats =
    scoped.length > 0
      ? {
          ...buildStatsForScope(db, scoped, batchLimit),
          newcomers_at_risk: countAtRisk(db, scoped, opts.dept),
        }
      : {
          integration_index: 0,
          newcomers_at_risk: countAtRisk(db, [], opts.dept),
          mentor_activity_rate: 0,
          lunch_match_success_rate: 0,
          batches: [] as { name: string; active: number; risk: number }[],
          newcomer_count: 0,
        };

  return {
    scope_dept: opts.dept?.trim() || null,
    integration_index: scopedStats.integration_index,
    integration_trend: formatTrend(
      scopedStats.integration_index - company.integration_index,
    ),
    newcomers_at_risk: scopedStats.newcomers_at_risk,
    newcomers_at_risk_trend: formatTrend(
      scopedStats.newcomers_at_risk - company.newcomers_at_risk,
      false,
    ),
    mentor_activity_rate: round1(scopedStats.mentor_activity_rate * 100) / 100,
    mentor_activity_trend: formatTrend(
      (scopedStats.mentor_activity_rate - company.mentor_activity_rate) * 100,
    ),
    lunch_match_success_rate:
      round1(scopedStats.lunch_match_success_rate * 100) / 100,
    lunch_match_success_trend: formatTrend(
      (scopedStats.lunch_match_success_rate -
        company.lunch_match_success_rate) *
        100,
    ),
    batches:
      scopedStats.batches.length > 0
        ? scopedStats.batches
        : company.batches,
    newcomer_count: scopedStats.newcomer_count,
  };
}

const MOOD_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

export function computeHrMoodTrends(
  db: Database.Database,
  dept?: string,
): { points: { time: string; score: number }[] } {
  const scoped = filterNewcomersByDept(listNewcomersWithDept(db), dept);
  const userIds = scoped.map((r) => r.id);

  if (userIds.length === 0) {
    return {
      points: MOOD_SLOTS.map((time, i) => ({
        time,
        score: 60 + i * 3,
      })),
    };
  }

  const placeholders = userIds.map(() => '?').join(',');
  const logs = db
    .prepare(
      `SELECT energy_level, created_at FROM mood_logs
       WHERE user_id IN (${placeholders})
       ORDER BY created_at ASC`,
    )
    .all(...userIds) as { energy_level: number; created_at: string }[];

  const bucket = new Map<string, number[]>();
  for (const slot of MOOD_SLOTS) bucket.set(slot, []);

  for (const log of logs) {
    const hour = parseInt(log.created_at.slice(11, 13), 10);
    const slot =
      hour < 11
        ? '10:00'
        : hour < 12
          ? '11:00'
          : hour < 13
            ? '12:00'
            : hour < 14
              ? '13:00'
              : hour < 15
                ? '14:00'
                : hour < 16
                  ? '15:00'
                  : '16:00';
    bucket.get(slot)!.push(log.energy_level);
  }

  const avgEnergy =
    userIds.reduce((s, id) => s + getEnergy(db, id), 0) / userIds.length;
  const deptOffset = optsDeptHash(dept);

  const points = MOOD_SLOTS.map((time, idx) => {
    const vals = bucket.get(time)!;
    if (vals.length > 0) {
      return {
        time,
        score: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      };
    }
    const wave = [-6, -2, 4, 8, -10, -4, 0][idx] ?? 0;
    return {
      time,
      score: Math.min(
        100,
        Math.max(20, Math.round(avgEnergy + wave + deptOffset)),
      ),
    };
  });

  return { points };
}

function optsDeptHash(dept?: string): number {
  if (!dept?.trim()) return 0;
  const idx = HR_DEPARTMENTS.findIndex((d) => matchDeptFilter(d, dept));
  return idx >= 0 ? idx * 2 - 4 : 0;
}
