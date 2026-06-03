import type Database from 'better-sqlite3';
import { buildPersonaAvatarUrl } from '../utils/personaAvatars.js';

function latestEnergy(db: Database.Database, userId: string): number {
  const row = db
    .prepare(
      `SELECT energy_level FROM mood_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    )
    .get(userId) as { energy_level: number } | undefined;
  return row?.energy_level ?? 75;
}

/** 按人格类型 + 最新能量，刷新新人 avatar_url */
export function syncAllNewcomerPersonaAvatars(db: Database.Database): number {
  const rows = db
    .prepare(
      `SELECT u.id, u.nickname, ep.dominant_type
       FROM users u
       LEFT JOIN employee_profiles ep ON ep.user_id = u.id
       WHERE u.role = 'newcomer'`,
    )
    .all() as { id: string; nickname: string; dominant_type: string | null }[];

  const update = db.prepare(`UPDATE users SET avatar_url = ? WHERE id = ?`);
  let n = 0;
  for (const row of rows) {
    const energy = latestEnergy(db, row.id);
    const url = buildPersonaAvatarUrl(
      energy,
      row.dominant_type,
      row.nickname,
      row.id,
    );
    update.run(url, row.id);
    n += 1;
  }
  return n;
}

export function syncUserPersonaAvatar(
  db: Database.Database,
  userId: string,
  energyLevel: number,
): string {
  const row = db
    .prepare(
      `SELECT u.nickname, ep.dominant_type
       FROM users u
       LEFT JOIN employee_profiles ep ON ep.user_id = u.id
       WHERE u.id = ?`,
    )
    .get(userId) as
    | { nickname: string; dominant_type: string | null }
    | undefined;
  const url = buildPersonaAvatarUrl(
    energyLevel,
    row?.dominant_type,
    row?.nickname,
    userId,
  );
  db.prepare(`UPDATE users SET avatar_url = ? WHERE id = ?`).run(url, userId);
  return url;
}
