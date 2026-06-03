/**
 * 园区休闲场景（饭搭子 / 兴趣搭子统一按场景匹配）
 */
import type Database from 'better-sqlite3';

export type SceneVenueDef = {
  id: string;
  name: string;
  floor: string;
  building: string;
  scene_tag: string;
  meeting_points: string[];
};

export const SCENE_VENUES: SceneVenueDef[] = [
  {
    id: 'venue-1',
    name: '园区食堂 · 3F 休闲区',
    floor: '3F',
    building: 'A 座',
    scene_tag: '用餐',
    meeting_points: ['食堂3楼休闲区 A15座', '食堂3楼休闲区 B06座', '食堂3楼休闲区 C12座'],
  },
  {
    id: 'venue-2',
    name: '园区食堂 · 2F 快餐区',
    floor: '2F',
    building: 'A 座',
    scene_tag: '用餐',
    meeting_points: ['食堂2楼靠窗区 D03座', '食堂2楼中庭 E08座'],
  },
  {
    id: 'spot-lawn',
    name: '园区草坪 · 阳光驿站',
    floor: '户外',
    building: '园区',
    scene_tag: '户外',
    meeting_points: ['草坪东侧凉亭', '阳光驿站木平台'],
  },
  {
    id: 'spot-interest',
    name: 'A 座 3F 兴趣角',
    floor: '3F',
    building: 'A 座',
    scene_tag: '社交',
    meeting_points: ['兴趣角书架区', '兴趣角沙发区'],
  },
  {
    id: 'spot-activity',
    name: '员工活动中心',
    floor: '1F',
    building: 'B 座',
    scene_tag: '活动',
    meeting_points: ['桌游室门口', '活动室前台'],
  },
  {
    id: 'spot-coffee',
    name: 'B 座 咖啡露台',
    floor: '2F',
    building: 'B 座',
    scene_tag: '轻社交',
    meeting_points: ['露台靠栏杆 01', '露台圆桌 02'],
  },
  {
    id: 'spot-gym',
    name: '园区健身房 · 休息区',
    floor: '1F',
    building: 'C 座',
    scene_tag: '运动',
    meeting_points: ['器械区旁休息凳', '更衣室出口等候区'],
  },
  {
    id: 'spot-book',
    name: '园区书屋 · 静读区',
    floor: '1F',
    building: 'A 座',
    scene_tag: '阅读',
    meeting_points: ['静读区长桌', '窗边单人座区'],
  },
];

export function getSceneVenue(venueId: string) {
  return SCENE_VENUES.find((v) => v.id === venueId) ?? SCENE_VENUES[0];
}

/** 同场景下正在等待匹配的人数（含午餐 + 兴趣请求） */
export function countWaitingAtScene(
  db: Database.Database,
  venueId: string,
  excludeUserId: string,
): number {
  const row = db
    .prepare(
      `SELECT COUNT(DISTINCT user_id) as c FROM (
         SELECT user_id FROM lunch_match_requests
           WHERE venue_id = ? AND status = 'pending' AND user_id != ?
         UNION
         SELECT user_id FROM interest_match_requests
           WHERE venue_id = ? AND status = 'pending' AND user_id != ?
       )`,
    )
    .get(venueId, excludeUserId, venueId, excludeUserId) as { c: number };
  return row.c;
}

export function listSceneVenuesForApi(db: Database.Database, userId?: string) {
  const venues = SCENE_VENUES.map((v) => {
    const waiting = userId ? countWaitingAtScene(db, v.id, userId) : 0;
    const active =
      waiting +
      (v.id === 'venue-1' ? 6 : v.id === 'spot-interest' ? 4 : 2);
    return {
      id: v.id,
      name: v.name,
      floor: v.floor,
      building: v.building,
      scene_tag: v.scene_tag,
      waiting_count: waiting,
      active_buddies_count: active,
    };
  });
  return {
    venues,
    default_venue_id: 'venue-1',
  };
}
