import type Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import { resolveUserDept } from '../db/fullSeed.js';
import { createNotification } from './notifications.js';

function newcomerAlias(db: Database.Database, userId: string): string {
  const row = db
    .prepare(`SELECT nickname FROM users WHERE id = ?`)
    .get(userId) as { nickname: string } | undefined;
  return row?.nickname ?? '新人';
}

function newcomerDept(db: Database.Database, userId: string): string {
  const ep = db
    .prepare(`SELECT dept FROM employee_profiles WHERE user_id = ?`)
    .get(userId) as { dept: string } | undefined;
  if (ep?.dept) return ep.dept;
  return resolveUserDept(userId, 0, db);
}

/** 能量偏低时自动写入/更新 HR 告警，供 HR 看板实时干预 */
export function syncHrAlertForEnergy(
  db: Database.Database,
  userId: string,
  energyLevel: number,
) {
  const user = db
    .prepare(`SELECT role FROM users WHERE id = ?`)
    .get(userId) as { role: string } | undefined;
  if (user?.role !== 'newcomer') return;

  const open = db
    .prepare(
      `SELECT id FROM hr_alerts
       WHERE user_id = ? AND resolved = 0 AND reason LIKE '能量%' LIMIT 1`,
    )
    .get(userId) as { id: string } | undefined;

  if (energyLevel >= 50) {
    if (open) {
      db.prepare(`UPDATE hr_alerts SET resolved = 1 WHERE id = ?`).run(open.id);
    }
    return;
  }

  const alias = newcomerAlias(db, userId);
  const dept = newcomerDept(db, userId);
  const severity = energyLevel < 40 ? 'red' : 'yellow';
  const reason = `能量 ${energyLevel}% 偏低，建议 HR/导师关注`;

  if (open) {
    db.prepare(
      `UPDATE hr_alerts SET reason = ?, severity = ?, user_alias = ?, dept = ? WHERE id = ?`,
    ).run(reason, severity, alias, dept, open.id);
    return;
  }

  db.prepare(
    `INSERT INTO hr_alerts (id, user_id, user_alias, dept, reason, severity, resolved)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
  ).run(uuid(), userId, alias, dept, reason, severity);
}

/** HR 干预后通知对应新人（系统消息入库） */
export function notifyNewcomerOfHrIntervention(
  db: Database.Database,
  targetUserId: string,
  note?: string | null,
) {
  if (!targetUserId) return;
  createNotification(db, {
    userId: targetUserId,
    type: 'system',
    title: 'HR 关怀提示',
    body:
      note?.trim() ||
      'HR 已关注你的入职适应情况，如需支持可在 AI HR 助手或带教导师处留言。',
  });
}
