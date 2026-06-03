import type Database from 'better-sqlite3';
import { createHash } from 'crypto';
import {
  assignSceneMatchDetails,
  pickScenePartner,
} from './sceneMatch.js';
import { getSceneVenue, listSceneVenuesForApi } from './sceneVenues.js';

const MATCH_CODES = ['HOBBY-A12', 'HOBBY-B34', 'HOBBY-C56', 'HOBBY-D78', 'HOBBY-E90'];
const MEETING_POINTS = [
  'A 座 3F 兴趣角 · 书架区',
  '园区草坪 · 阳光驿站',
  'B 座 1F 咖啡角 · 靠窗位',
  '员工活动中心 · 桌游室门口',
];

export const INTEREST_VENUES = [
  {
    id: 'spot-1',
    name: '园区兴趣角 · 3F',
    floor: '3F',
    building: 'A 座',
  },
  {
    id: 'spot-2',
    name: '员工活动中心',
    floor: '1F',
    building: 'B 座',
  },
] as const;

export const INTEREST_MERCHANTS: Record<
  string,
  { id: string; name: string; category: string; distance_m: number; perk: string }[]
> = {
  'spot-1': [
    {
      id: 'h-1',
      name: '纸间书屋',
      category: '阅读社交',
      distance_m: 50,
      perk: '搭子双人饮品 -15%',
    },
    {
      id: 'h-2',
      name: '拾光咖啡',
      category: '咖啡轻食',
      distance_m: 90,
      perk: '出示暗号赠小点心',
    },
    {
      id: 'h-3',
      name: '兴趣角服务台',
      category: '活动咨询',
      distance_m: 20,
      perk: '免费借用桌游/球拍',
    },
  ],
  'spot-interest': [
    {
      id: 'h-1',
      name: '纸间书屋',
      category: '阅读社交',
      distance_m: 50,
      perk: '搭子双人饮品 -15%',
    },
    {
      id: 'h-3',
      name: '兴趣角服务台',
      category: '活动咨询',
      distance_m: 20,
      perk: '免费借用桌游/球拍',
    },
  ],
  'spot-activity': [
    {
      id: 'h-4',
      name: '活力健身房',
      category: '运动',
      distance_m: 70,
      perk: '体验课预约优先',
    },
    {
      id: 'h-5',
      name: '创客手作坊',
      category: '手作体验',
      distance_m: 110,
      perk: '双人材料包 9 折',
    },
  ],
};

function parseJsonArray(raw: unknown): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(String(raw));
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

function interestOverlap(a: string[], b: string[]): number {
  const setB = new Set(b);
  return a.filter((t) => setB.has(t)).length;
}

function stablePick<T>(seed: string, items: T[]): T {
  const h = createHash('sha256').update(seed).digest();
  const idx = h.readUInt32BE(0) % items.length;
  return items[idx];
}

export function getUserInterests(
  db: Database.Database,
  userId: string,
): string[] {
  const row = db
    .prepare(`SELECT interests FROM employee_profiles WHERE user_id = ?`)
    .get(userId) as { interests: string } | undefined;
  const fromProfile = parseJsonArray(row?.interests);
  if (fromProfile.length > 0) return fromProfile;

  const p = db
    .prepare(`SELECT tags FROM personas WHERE user_id = ?`)
    .get(userId) as { tags: string } | undefined;
  return parseJsonArray(p?.tags).slice(0, 4);
}

export function countActiveInterestBuddies(db: Database.Database): number {
  const row = db
    .prepare(
      `SELECT COUNT(DISTINCT user_id) as c FROM interest_match_requests
       WHERE status IN ('pending', 'matched')
         AND date(created_at) = date('now')`,
    )
    .get() as { c: number };
  return row.c;
}

export function listInterestVenues(db: Database.Database, userId?: string) {
  return listSceneVenuesForApi(db, userId);
}

type PartnerCandidate = {
  user_id: string;
  persona_name: string;
  interests: string[];
};

export function pickInterestPartner(
  db: Database.Database,
  userId: string,
  myInterests: string[],
  requestId: string,
  venueId: string,
): PartnerCandidate | null {
  const p = pickScenePartner(db, userId, venueId, requestId, myInterests);
  if (!p) return null;
  return {
    user_id: p.user_id,
    persona_name: p.persona_name,
    interests: p.tags,
  };
}

export function assignInterestMatchDetails(requestId: string, venueId: string) {
  const { matchCode, meetingPoint } = assignSceneMatchDetails(requestId, venueId);
  return { matchCode, meetingPoint };
}

export function buildInterestRoadmap(
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
      detail: `前往 ${venue.building} ${venue.name}，沿园区步道步行约 3 分钟。`,
    },
    {
      step: 2,
      title: '到达活动区域',
      detail: `进入 ${venue.floor.replace('F', ' 楼')}，跟随「兴趣角 / 活动」导视牌。`,
    },
    {
      step: 3,
      title: '寻找同好标识',
      detail: '在公告板查看今日兴趣活动，留意同暗号搭子。',
    },
    {
      step: 4,
      title: '到达集合点',
      detail: `${meetingPoint} · 建议 ${timeLabel} 前到达，出示碰头暗号。`,
    },
  ];
}

export function getInterestNearbyMerchants(venueId: string) {
  return (
    INTEREST_MERCHANTS[venueId] ??
    INTEREST_MERCHANTS['spot-interest'] ??
    INTEREST_MERCHANTS['spot-1']
  );
}

export function formatInterestPartner(
  name: string,
  interests: string[],
  myInterests: string[],
) {
  const common = interests.filter((t) => myInterests.includes(t));
  return {
    name,
    tags: interests,
    common_tags: common,
    affinity_label:
      common.length >= 2
        ? '爱好高度重合'
        : common.length === 1
          ? '有共同爱好'
          : '互补型兴趣搭子',
  };
}
