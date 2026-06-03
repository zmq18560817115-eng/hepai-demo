/**
 * 工位奖励：持久化记录（优先从 desk_rewards 读取；缺失时可从历史匹配补齐）
 */
import type Database from 'better-sqlite3';
import { getSceneVenue } from './sceneVenues.js';

export type DeskRewardDto = {
  id: string;
  source: 'lunch_match' | 'interest_match' | 'mentor' | 'hr' | 'event';
  request_id?: string;
  reward_kind: 'meal_voucher' | 'scene_perk' | 'outdoor_badge';
  title: string;
  detail?: string;
  venue_name?: string;
  earned_at?: string;
};

function rewardKindForVenue(venueId: string): DeskRewardDto['reward_kind'] {
  const tag = getSceneVenue(venueId).scene_tag;
  if (tag === '户外') return 'outdoor_badge';
  if (tag === '用餐') return 'meal_voucher';
  return 'scene_perk';
}

function rewardTitle(kind: DeskRewardDto['reward_kind']): string {
  switch (kind) {
    case 'meal_voucher':
      return '饭搭子餐券';
    case 'outdoor_badge':
      return '户外碰头徽章';
    default:
      return '场景奖励贴';
  }
}

export function listLunchDeskRewards(
  db: Database.Database,
  userId: string,
): DeskRewardDto[] {
  // Primary: read persisted rewards
  try {
    const rows = db
      .prepare(
        `SELECT id, source, ref_id, reward_kind, title, detail, venue_id, earned_at
         FROM desk_rewards
         WHERE user_id = ? AND source = 'lunch_match'
         ORDER BY earned_at ASC`,
      )
      .all(userId) as {
      id: string;
      source: DeskRewardDto['source'];
      ref_id: string | null;
      reward_kind: DeskRewardDto['reward_kind'];
      title: string;
      detail: string | null;
      venue_id: string | null;
      earned_at: string;
    }[];
    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        source: r.source,
        request_id: r.ref_id ?? undefined,
        reward_kind: r.reward_kind,
        title: r.title,
        detail: r.detail ?? undefined,
        venue_name: r.venue_id ? getSceneVenue(r.venue_id).name : undefined,
        earned_at: r.earned_at,
      }));
    }
  } catch {
    // legacy DB without desk_rewards
  }

  // Fallback: derive from matched records (legacy mode)
  const legacyRows = db
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

  return legacyRows.map((row) => {
    const venueId = row.venue_id ?? 'venue-1';
    const venue = getSceneVenue(venueId);
    const kind = rewardKindForVenue(venueId);
    const parts = [venue.name, row.match_code].filter(Boolean);
    return {
      id: `lunch-${row.id}`,
      source: 'lunch_match' as const,
      request_id: row.id,
      reward_kind: kind,
      title: rewardTitle(kind),
      detail: parts.join(' · ') || row.meeting_point || undefined,
      venue_name: venue.name,
      earned_at: row.matched_at ?? row.created_at,
    };
  });
}
