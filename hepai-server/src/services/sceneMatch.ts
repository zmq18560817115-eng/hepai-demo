import type Database from 'better-sqlite3';
import { createHash } from 'crypto';
import { getUserInterests } from './interestMatch.js';
import { getSceneVenue } from './sceneVenues.js';

function parseTags(raw: unknown): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(String(raw));
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

function tagOverlap(a: string[], b: string[]): number {
  const setB = new Set(b);
  return a.filter((t) => setB.has(t)).length;
}

function stablePick<T>(seed: string, items: T[]): T {
  const h = createHash('sha256').update(seed).digest();
  const idx = h.readUInt32BE(0) % items.length;
  return items[idx];
}

export type ScenePartnerCandidate = {
  user_id: string;
  persona_name: string;
  tags: string[];
  from_same_scene_queue?: boolean;
};

/** 优先匹配「也在等待同一场景」的用户，否则按标签/爱好相近 */
export function pickScenePartner(
  db: Database.Database,
  userId: string,
  venueId: string,
  requestId: string,
  myTags: string[],
): ScenePartnerCandidate | null {
  const waitingRows = db
    .prepare(
      `SELECT user_id FROM lunch_match_requests
       WHERE venue_id = ? AND status = 'pending' AND user_id != ?
       UNION
       SELECT user_id FROM interest_match_requests
       WHERE venue_id = ? AND status = 'pending' AND user_id != ?`,
    )
    .all(venueId, userId, venueId, userId) as { user_id: string }[];

  if (waitingRows.length > 0) {
    const pickId = stablePick(
      requestId,
      waitingRows.map((r) => r.user_id),
    );
    const p = db
      .prepare(
        `SELECT u.id as user_id, p.name as persona_name, p.tags
         FROM users u
         INNER JOIN personas p ON p.user_id = u.id
         WHERE u.id = ?`,
      )
      .get(pickId) as
      | { user_id: string; persona_name: string; tags: string }
      | undefined;
    if (p) {
      const interests = getUserInterests(db, p.user_id);
      return {
        user_id: p.user_id,
        persona_name: p.persona_name,
        tags: interests.length ? interests : parseTags(p.tags),
        from_same_scene_queue: true,
      };
    }
  }

  const rows = db
    .prepare(
      `SELECT u.id as user_id, p.name as persona_name, p.tags
       FROM users u
       INNER JOIN personas p ON p.user_id = u.id
       WHERE u.role = 'newcomer'
         AND u.onboarding_completed = 1
         AND u.id != ?
       ORDER BY u.created_at`,
    )
    .all(userId) as { user_id: string; persona_name: string; tags: string }[];

  if (rows.length === 0) return null;

  const recentPartners = new Set(
    (
      db
        .prepare(
          `SELECT partner_user_id FROM lunch_match_requests
           WHERE user_id = ? AND partner_user_id IS NOT NULL
             AND status = 'matched' AND created_at > datetime('now', '-7 days')
           UNION
           SELECT partner_user_id FROM interest_match_requests
           WHERE user_id = ? AND partner_user_id IS NOT NULL
             AND status = 'matched' AND created_at > datetime('now', '-7 days')`,
        )
        .all(userId, userId) as { partner_user_id: string }[]
    ).map((r) => r.partner_user_id),
  );

  let pool = rows.map((r) => {
    const interests = getUserInterests(db, r.user_id);
    const tags = interests.length ? interests : parseTags(r.tags);
    return {
      user_id: r.user_id,
      persona_name: r.persona_name,
      tags,
    };
  });

  const fresh = pool.filter((p) => !recentPartners.has(p.user_id));
  if (fresh.length > 0) pool = fresh;

  const scored = pool
    .map((p) => ({
      ...p,
      score: tagOverlap(myTags, p.tags) + Math.random() * 0.35,
    }))
    .sort((a, b) => b.score - a.score);

  const topN = scored.slice(0, Math.min(3, scored.length));
  return stablePick(requestId, topN);
}

export function assignSceneMatchDetails(requestId: string, venueId: string) {
  const venue = getSceneVenue(venueId);
  const codes = ['BLUE-K88', 'PINK-M21', 'JADE-T09', 'GREEN-M42', 'HOBBY-A12'];
  return {
    matchCode: stablePick(requestId, codes),
    meetingPoint: stablePick(`${requestId}:${venueId}`, venue.meeting_points),
    venue_name: venue.name,
  };
}

/** 将双方同场景请求一并标为已匹配 */
export function completePartnerPendingAtScene(
  db: Database.Database,
  partnerUserId: string,
  currentUserId: string,
  venueId: string,
  matchCode: string,
  meetingPoint: string,
) {
  const params = [
    matchCode,
    meetingPoint,
    currentUserId,
    partnerUserId,
    venueId,
  ];
  for (const table of ['lunch_match_requests', 'interest_match_requests'] as const) {
    db.prepare(
      `UPDATE ${table}
       SET status = 'matched', match_code = ?, meeting_point = ?,
           meet_before = datetime('now', '+1 hour'), matched_at = datetime('now'),
           partner_user_id = ?, confirmed_at = NULL
       WHERE user_id = ? AND venue_id = ? AND status = 'pending'`,
    ).run(...params);
  }
}

export function formatScenePartner(
  name: string,
  tags: string[],
  myTags: string[],
  sameScene: boolean,
) {
  const common = tags.filter((t) => myTags.includes(t));
  return {
    name,
    tags,
    common_tags: common,
    affinity_label: sameScene
      ? '同场景候补中'
      : common.length >= 2
        ? '高度合拍'
        : common.length === 1
          ? '标签相近'
          : '互补型搭子',
  };
}
