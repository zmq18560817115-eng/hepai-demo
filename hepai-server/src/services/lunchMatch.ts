import type Database from 'better-sqlite3';
import { createHash } from 'crypto';
import {
  assignSceneMatchDetails,
  pickScenePartner,
} from './sceneMatch.js';
import {
  getSceneVenue,
  listSceneVenuesForApi,
  SCENE_VENUES,
} from './sceneVenues.js';

export const LUNCH_VENUES = SCENE_VENUES;

export const LUNCH_MERCHANTS: Record<
  string,
  { id: string; name: string; category: string; distance_m: number; perk: string }[]
> = {
  'venue-1': [
    {
      id: 'm-1',
      name: '叁楼轻食',
      category: '轻食沙拉',
      distance_m: 80,
      perk: '搭子双人套餐 -12%',
    },
    {
      id: 'm-2',
      name: '茶屿手作',
      category: '奶茶饮品',
      distance_m: 120,
      perk: '暗号碰头赠小料',
    },
    {
      id: 'm-3',
      name: '食堂自选台',
      category: '自助称重',
      distance_m: 40,
      perk: '新人首单送汤',
    },
  ],
  'venue-2': [
    {
      id: 'm-4',
      name: '麦乐堡快餐',
      category: '快餐',
      distance_m: 60,
      perk: '搭子套餐第二份半价',
    },
    {
      id: 'm-5',
      name: '面点王',
      category: '面食',
      distance_m: 90,
      perk: '加面免费',
    },
  ],
};

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

export function countActiveLunchBuddies(db: Database.Database): number {
  const row = db
    .prepare(
      `SELECT COUNT(DISTINCT user_id) as c FROM lunch_match_requests
       WHERE status IN ('pending', 'matched')
         AND date(created_at) = date('now')`,
    )
    .get() as { c: number };
  return row.c;
}

export function listVenues(db: Database.Database, userId?: string) {
  return listSceneVenuesForApi(db, userId);
}

type PartnerCandidate = {
  user_id: string;
  persona_name: string;
  tags: string[];
};

export function pickLunchPartner(
  db: Database.Database,
  userId: string,
  myTags: string[],
  requestId: string,
  venueId: string,
): PartnerCandidate | null {
  return pickScenePartner(db, userId, venueId, requestId, myTags);
}

export function assignMatchDetails(requestId: string, venueId: string) {
  const { matchCode, meetingPoint } = assignSceneMatchDetails(requestId, venueId);
  return { matchCode, meetingPoint };
}

export function buildRoadmap(
  venueId: string,
  meetingPoint: string,
  meetBefore?: string | null,
) {
  const venue = getSceneVenue(venueId);
  const timeLabel = meetBefore
    ? new Date(meetBefore).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '约 1 小时内';

  return [
    {
      step: 1,
      title: '从工位出发',
      detail: `前往 ${venue.building} ${venue.name}，沿园区主通道步行约 3 分钟。`,
    },
    {
      step: 2,
      title: '进入 A 座大堂',
      detail: `到达 ${venue.floor.replace('F', ' 楼')} 入口大堂，跟随「食堂」导视牌。`,
    },
    {
      step: 3,
      title: '上行至休闲区',
      detail: '乘电梯或楼梯至 3 楼，出梯后跟随「休闲就餐区」指示牌。',
    },
    {
      step: 4,
      title: '到达集合点',
      detail: `${meetingPoint} · 建议 ${timeLabel} 前到达，向同暗号搭子出示碰头暗号。`,
    },
  ];
}

export function getNearbyMerchants(venueId: string) {
  return LUNCH_MERCHANTS[venueId] ?? LUNCH_MERCHANTS['venue-1'];
}

export function formatPartnerPersona(
  name: string,
  tags: string[],
  myTags: string[],
) {
  const common = tags.filter((t) => myTags.includes(t));
  return {
    name,
    tags,
    common_tags: common,
    affinity_label:
      common.length >= 2
        ? '高度合拍'
        : common.length === 1
          ? '标签相近'
          : '互补型搭子',
  };
}
