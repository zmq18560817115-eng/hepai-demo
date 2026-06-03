/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MOCK_MENTOR_ASSIGNEES,
  MOCK_MENTORS,
  QUIZ_QUESTIONS,
  type UserPersona,
} from '../types';
import skillManifest from '../skills/ai-hr-manifest.json';
import type { UserType } from '../types';
import type {
  HrPendingNewcomerItem,
  HrRegisterNewcomerResponse,
  AiHrSkillMeta,
  AuthUser,
  HrAlert,
  HrDashboardStats,
  HrMoodTrendPoint,
  LoginResponse,
  LunchMerchant,
  LunchRoadmapStep,
  LunchStatusResponse,
  LunchVenue,
  MentorAssigneeDto,
  MentorDto,
  MoodLogResponse,
  OnboardingStatus,
  PersonaDto,
  QuizQuestionDto,
  QuizSubmitResponse,
  EmployeeProfileDto,
  FlashJarItem,
  FlashJarResponse,
  MentorChatInboxItem,
  MentorChatMessage,
  MentorChatThreadResponse,
  NotificationItem,
  NotificationsResponse,
  AiHrMessage,
  WorkplaceResponse,
} from './types';
import {
  EIGHT_DEMO_NEWCOMERS,
  DEMO_NEWCOMER_PASSWORD,
} from '../constants/demoNewcomers';
import {
  applyQuizPersonalityOnlyMock,
  buildDefaultNewcomerEmployee,
  buildPendingNewcomerEmployee,
  derivePersonalityPatchFromAnswers,
} from '../utils/employeeProfile';
import { generatePersonaFromAnswers } from '../types';
import { buildPersonaAvatarUrlForEmployee } from '../utils/personaAvatar';
import { buildDeskPayload } from '../utils/buildDeskItems';
import type { DeskReward, DeskRewardsResponse, MyDeskResponse } from './types';
import { bindAuthUser } from './sessionScope';
import {
  activeStore,
  mockLogoutSession,
  mockSwitchUser,
} from './mockUserStore';

const MOCK_QUIZ_IDS = [
  'mock-q1',
  'mock-q2',
  'mock-q3',
  'mock-q4',
  'mock-q5',
  'mock-q6',
  'mock-q7',
  'mock-q8',
];

/** 用户级状态见 mockUserStore.activeStore */

const MOCK_SCENE_VENUES: LunchVenue[] = [
  {
    id: 'venue-1',
    name: '园区食堂 · 3F 休闲区',
    floor: '3F',
    building: 'A 座',
    scene_tag: '用餐',
    waiting_count: 8,
    active_buddies_count: 24,
  },
  {
    id: 'venue-2',
    name: '园区食堂 · 2F 快餐区',
    floor: '2F',
    building: 'A 座',
    scene_tag: '用餐',
    waiting_count: 5,
    active_buddies_count: 14,
  },
  {
    id: 'spot-lawn',
    name: '园区草坪 · 阳光驿站',
    floor: '户外',
    building: '园区',
    scene_tag: '户外',
    waiting_count: 3,
    active_buddies_count: 9,
  },
  {
    id: 'spot-interest',
    name: 'A 座 3F 兴趣角',
    floor: '3F',
    building: 'A 座',
    scene_tag: '社交',
    waiting_count: 6,
    active_buddies_count: 12,
  },
  {
    id: 'spot-activity',
    name: '员工活动中心',
    floor: '1F',
    building: 'B 座',
    scene_tag: '活动',
    waiting_count: 4,
    active_buddies_count: 11,
  },
  {
    id: 'spot-coffee',
    name: 'B 座 咖啡露台',
    floor: '2F',
    building: 'B 座',
    scene_tag: '轻社交',
    waiting_count: 7,
    active_buddies_count: 15,
  },
  {
    id: 'spot-gym',
    name: '园区健身房 · 休息区',
    floor: '1F',
    building: 'C 座',
    scene_tag: '运动',
    waiting_count: 2,
    active_buddies_count: 6,
  },
  {
    id: 'spot-book',
    name: '园区书屋 · 静读区',
    floor: '1F',
    building: 'A 座',
    scene_tag: '阅读',
    waiting_count: 4,
    active_buddies_count: 8,
  },
];

function mockSceneVenueName(venueId: string) {
  return MOCK_SCENE_VENUES.find((v) => v.id === venueId)?.name ?? '园区场景';
}

const MOCK_LUNCH_PARTNERS = [
  { name: '静谧 I 人忍者型', tags: ['独处充电', '文档达人'] },
  { name: '社交 E 人带玩型', tags: ['饭局发起人', '气氛组'] },
  { name: '观察 N 人策谋型', tags: ['信息敏感', '低调进场'] },
  { name: '踏实 S 人守护型', tags: ['步骤清晰', '靠谱搭子'] },
  { name: '玩梗 P 人协作型', tags: ['表情包外交', '群聊活跃'] },
];

const MOCK_INTEREST_PARTNERS = [
  { name: '静谧 I 人忍者型', tags: ['阅读', '观影', '咖啡'] },
  { name: '社交 E 人带玩型', tags: ['健身', '聚餐', '桌游'] },
  { name: '观察 N 人策谋型', tags: ['CityWalk', '摄影', '播客'] },
  { name: '踏实 S 人守护型', tags: ['徒步', '下厨', '园艺'] },
  { name: '玩梗 P 人协作型', tags: ['手游', 'Livehouse', '汉服'] },
];

const MOCK_INTEREST_CODES = ['HOBBY-A12', 'HOBBY-B34', 'HOBBY-C56'];
const MOCK_INTEREST_POINTS = [
  'A 座 3F 兴趣角 · 书架区',
  '园区草坪 · 阳光驿站',
  '员工活动中心 · 桌游室门口',
];

const MOCK_LUNCH_CODES = ['BLUE-K88', 'PINK-M21', 'JADE-T09', 'GREEN-M42'];
const MOCK_MEETING_POINTS = [
  '食堂3楼休闲区 A15座',
  '食堂3楼休闲区 B06座',
  '食堂3楼休闲区 C12座',
];

const MOCK_ROADMAP: LunchRoadmapStep[] = [
  { step: 1, title: '从工位出发', detail: '前往 A 座 园区食堂 · 3F 休闲区' },
  { step: 2, title: '到达 3F', detail: '跟随导视牌「休闲就餐区」' },
  { step: 3, title: '寻找集合点', detail: '食堂3楼休闲区 A15座' },
  { step: 4, title: '碰头识别', detail: '出示相同暗号 · 建议 1 小时内到达' },
];

const MOCK_MERCHANTS: LunchMerchant[] = [
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
];

function pickMockLunchPartner(myTags: string[]) {
  activeStore.lunchMatchSeq += 1;
  const scored = MOCK_LUNCH_PARTNERS.map((p, i) => {
    const common = p.tags.filter((t) => myTags.includes(t)).length;
    return { p, score: common + ((activeStore.lunchMatchSeq + i) % 3) * 0.2 };
  }).sort((a, b) => b.score - a.score);
  const pick =
    scored[activeStore.lunchMatchSeq % scored.length]?.p ?? MOCK_LUNCH_PARTNERS[0];
  const common = pick.tags.filter((t) => myTags.includes(t));
  return {
    name: pick.name,
    tags: pick.tags,
    common_tags: common,
    affinity_label:
      common.length >= 2
        ? '高度合拍'
        : common.length === 1
          ? '标签相近'
          : '互补型搭子',
  };
}
let mockSessionUser: AuthUser | null = null;

const MOCK_MENTEE_ID = 'u-newcomer-001';
const MOCK_PARTNER_ID = 'u-newcomer-002';
const MOCK_MENTOR_ID = 'u-mentor-001';

type PortalRole = 'mentor' | 'hr' | 'newcomer';

interface PortalAccount {
  password: string;
  role: PortalRole;
  username?: string;
  nickname: string;
  userId: string;
  dept: string;
  onboardingCompleted: boolean;
  personaName: string;
  personaTags: string[];
  personaMotto: string;
  energy: number;
  /** 演示库中是否从未完成过盲盒（仅 E00001） */
  firstTimeSeed?: boolean;
}

const mockHrRegistered: Record<string, PortalAccount> = {};

const MOCK_PORTAL_USERS: Record<string, PortalAccount> = {
  ...Object.fromEntries(
    EIGHT_DEMO_NEWCOMERS.map((n) => [
      n.username,
      {
        password: DEMO_NEWCOMER_PASSWORD,
        role: 'newcomer' as const,
        username: n.username,
        nickname: n.nickname,
        userId: n.userId,
        dept: n.dept,
        onboardingCompleted: !n.firstTime,
        personaName: n.personaName,
        personaTags: [...n.personaTags],
        personaMotto: n.personaMotto,
        energy: n.energy,
        firstTimeSeed: n.firstTime,
      },
    ]),
  ),
  M00001: {
    password: DEMO_NEWCOMER_PASSWORD,
    role: 'mentor',
    nickname: '雷军老师',
    userId: MOCK_MENTOR_ID,
    dept: '',
    onboardingCompleted: true,
    personaName: '',
    personaTags: [],
    personaMotto: '',
    energy: 75,
  },
  M00002: {
    password: DEMO_NEWCOMER_PASSWORD,
    role: 'mentor',
    nickname: '张经理',
    userId: 'u-mentor-002',
    dept: '',
    onboardingCompleted: true,
    personaName: '',
    personaTags: [],
    personaMotto: '',
    energy: 75,
  },
  HR0001: {
    password: DEMO_NEWCOMER_PASSWORD,
    role: 'hr',
    nickname: 'HR管理员',
    userId: 'u-hr-001',
    dept: '',
    onboardingCompleted: true,
    personaName: '',
    personaTags: [],
    personaMotto: '',
    energy: 75,
  },
};

function findPortalAccountByUserId(userId: string): PortalAccount | undefined {
  return Object.values(MOCK_PORTAL_USERS).find((a) => a.userId === userId);
}

function persistPortalPersonaFromStore(username?: string) {
  const key = username?.trim().toUpperCase();
  const acct =
    (key && MOCK_PORTAL_USERS[key]) ??
    findPortalAccountByUserId(mockSessionUser?.id ?? '');
  if (!acct || !activeStore.persona) return;
  acct.onboardingCompleted = activeStore.onboardingDone;
  acct.personaName = activeStore.persona.name;
  acct.personaTags = [...activeStore.persona.tags];
  acct.personaMotto = activeStore.persona.motto;
  acct.firstTimeSeed = false;
}

function ensureMockNewcomerStore(account: PortalAccount): void {
  mockSwitchUser(account.userId);
  if (account.role !== 'newcomer') return;

  const lockedIdentity =
    Boolean(account.personaName) && !account.firstTimeSeed;

  if (!account.onboardingCompleted) {
    if (!lockedIdentity) {
      activeStore.persona = null;
      activeStore.employee = buildPendingNewcomerEmployee(
        account.userId,
        account.username ?? account.userId,
        account.nickname,
        account.dept || '内容创作部门',
      );
    } else {
      activeStore.persona = {
        id: `mock-persona-${account.userId}`,
        name: account.personaName,
        tags: [...account.personaTags],
        motto: account.personaMotto,
      };
      const employee = buildDefaultNewcomerEmployee(
        account.userId,
        account.personaName,
        account.nickname,
      );
      employee.dept = account.dept;
      employee.energy_level = account.energy;
      activeStore.employee = employee;
    }
    activeStore.onboardingDone = false;
    activeStore.energy = account.energy;
    return;
  }

  const persona: PersonaDto = {
    id: `mock-persona-${account.userId}`,
    name: account.personaName,
    tags: [...account.personaTags],
    motto: account.personaMotto,
  };
  const employee = buildDefaultNewcomerEmployee(
    account.userId,
    account.personaName,
    account.nickname,
  );
  employee.dept = account.dept;
  employee.energy_level = account.energy;

  activeStore.persona = persona;
  activeStore.employee = employee;
  activeStore.onboardingDone = true;
  activeStore.energy = account.energy;
}

/** 重置盲盒进度：保留已锁定的人格名称/头像，仅允许重答并刷新社交标签 */
export function mockReset() {
  activeStore.onboardingDone = false;
  const acct = findPortalAccountByUserId(mockSessionUser?.id ?? '');
  if (acct) {
    acct.onboardingCompleted = false;
  }
}

export function mockLogout() {
  mockLogoutSession();
  mockSessionUser = null;
  bindAuthUser(null);
}

export function mockLoginPortal(
  username: string,
  password: string,
  role: PortalRole,
): LoginResponse {
  const u =
    MOCK_PORTAL_USERS[username.trim()] ??
    mockHrRegistered[username.trim().toUpperCase()];
  if (!u || u.password !== password || u.role !== role) {
    throw new Error('工号或密码错误，或无权访问该端');
  }

  if (u.role === 'newcomer') {
    ensureMockNewcomerStore(u);
  } else {
    mockSwitchUser(u.userId);
  }

  const user: AuthUser = {
    id: u.userId,
    username: username.trim(),
    nickname: u.nickname,
    avatar_url:
      activeStore.employee?.avatar_url ??
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
    role: u.role,
    onboarding_date: '2026-05-01',
    onboarding_completed: u.role === 'newcomer' ? u.onboardingCompleted : true,
    onboarding_days_left: u.userId === MOCK_PARTNER_ID ? 18 : 22,
  };
  mockSessionUser = user;
  bindAuthUser(user.id);
  return {
    access_token: `mock-token-${role}-${username}`,
    expires_in: 7200,
    user,
    show_welcome_gift: u.role === 'newcomer' && !u.onboardingCompleted,
  };
}

export function mockLogin(authCode: string): LoginResponse {
  const role =
    authCode === 'dev_mentor'
      ? 'mentor'
      : authCode === 'dev_hr'
        ? 'hr'
        : 'newcomer';
  const userId =
    role === 'newcomer'
      ? MOCK_MENTEE_ID
      : role === 'mentor'
        ? MOCK_MENTOR_ID
        : 'u-hr-001';
  mockSwitchUser(userId);
  const user: AuthUser = {
    id: userId,
    username: 'E00001',
    nickname: role === 'newcomer' ? '程序员小智' : role === 'mentor' ? '雷军老师' : 'HR管理员',
    avatar_url:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
    role,
    onboarding_date: '2026-05-01',
    onboarding_completed: activeStore.onboardingDone,
    onboarding_days_left: 22,
  };
  mockSessionUser = user;
  bindAuthUser(user.id);
  return {
    access_token: `mock-token-${role}`,
    expires_in: 7200,
    user,
  };
}

export function mockGetUsersMe(): AuthUser {
  if (mockSessionUser) {
    mockSwitchUser(mockSessionUser.id);
    return mockSessionUser;
  }
  return {
    id: 'mock-user-id',
    username: 'E00001',
    nickname: '程序员小智',
    avatar_url:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
    role: 'newcomer',
    onboarding_date: '2026-05-01',
    onboarding_completed: activeStore.onboardingDone,
    onboarding_days_left: 22,
  };
}

export function mockGetOnboardingStatus(): OnboardingStatus {
  return {
    completed: activeStore.onboardingDone,
    persona_id: activeStore.persona?.id ?? null,
  };
}

export function mockGetQuizOnboarding(): { questions: QuizQuestionDto[] } {
  return {
    questions: QUIZ_QUESTIONS.map((q, i) => ({
      id: MOCK_QUIZ_IDS[i],
      text: q.question,
      options: q.options,
    })),
  };
}

export function mockSubmitQuiz(
  answers: { question_id: string; answer_value: string }[],
): QuizSubmitResponse {
  const values = answers.map((a) => a.answer_value);
  const userId = mockSessionUser?.id ?? MOCK_MENTEE_ID;
  const uname = mockSessionUser?.username?.trim().toUpperCase();
  const account =
    (uname && MOCK_PORTAL_USERS[uname]) ??
    findPortalAccountByUserId(userId);

  const baseEmployee =
    activeStore.employee ??
    buildPendingNewcomerEmployee(
      userId,
      mockSessionUser?.username ?? 'E00001',
      mockSessionUser?.nickname ?? account?.nickname ?? '程序员小智',
      account?.dept ?? '内容创作部门',
    );

  const patch = derivePersonalityPatchFromAnswers(values);
  const lockedPersona: PersonaDto | null =
    activeStore.persona ??
    (account?.personaName
      ? {
          id: `mock-persona-${userId}`,
          name: account.personaName,
          tags: account.personaTags,
          motto: account.personaMotto,
        }
      : null);

  if (lockedPersona) {
    const { persona, employee, energy } = applyQuizPersonalityOnlyMock(
      lockedPersona,
      { ...baseEmployee, nickname: baseEmployee.nickname || account?.nickname || mockSessionUser?.nickname || '程序员小智' },
      values,
      userId,
    );
    activeStore.persona = persona;
    activeStore.employee = employee;
    activeStore.onboardingDone = true;
    activeStore.energy = energy;
  } else {
    const generated = generatePersonaFromAnswers(values);
    activeStore.persona = {
      id: 'mock-persona-id',
      name: generated.role,
      tags: patch.tags,
      motto: generated.motto,
    };
    activeStore.employee = {
      ...baseEmployee,
      nickname: mockSessionUser?.nickname ?? baseEmployee.nickname,
      dominant_type: patch.dominant,
      secondary_type: patch.secondary,
      work_style: patch.work_style,
      social_style: patch.social_style,
      lunch_preference: patch.lunch_preference,
      support_preference: patch.support_preference,
      traits: patch.traits,
      interests: patch.interests,
      display_title: baseEmployee.display_title.includes('待完成')
        ? `${(account?.dept ?? baseEmployee.dept).replace('部门', '')}专员`
        : baseEmployee.display_title,
      avatar_url: buildPersonaAvatarUrlForEmployee(
        baseEmployee.energy_level ?? 75,
        patch.dominant,
        generated.role,
        userId,
      ),
    };
    activeStore.onboardingDone = true;
    activeStore.energy = activeStore.employee.energy_level ?? 75;
  }

  persistPortalPersonaFromStore(uname);
  if (uname && mockHrRegistered[uname]) {
    mockHrRegistered[uname].onboardingCompleted = true;
    mockHrRegistered[uname].personaName = activeStore.persona?.name ?? '';
    mockHrRegistered[uname].personaTags = activeStore.persona?.tags ?? [];
    mockHrRegistered[uname].personaMotto = activeStore.persona?.motto ?? '';
  }

  return {
    onboarding_completed: true,
    persona: activeStore.persona!,
    employee: activeStore.employee!,
  };
}

export function mockGetPersonaMe(): PersonaDto {
  if (!activeStore.persona) throw new Error('面具尚未创建');
  return activeStore.persona;
}

export function personaDtoToUserPersona(p: PersonaDto, energy?: number): UserPersona {
  return {
    role: p.name,
    tags: p.tags,
    motto: p.motto,
    hiddenPreferences: [],
    moodScore: energy ?? activeStore.energy,
  };
}

export function mockGetWorkplace(): WorkplaceResponse {
  if (!activeStore.persona) {
    throw new Error('请先完成入职盲盒');
  }
  const mentors: MentorDto[] = MOCK_MENTORS.map((m) => ({
    id: m.id,
    name: m.name,
    avatar_url: m.avatar,
    role: m.role,
    status: m.status,
    type: m.id === 'm1' ? 'main' : 'project',
  }));
  return {
    user: {
      nickname: activeStore.employee?.nickname ?? '程序员小智',
      avatar_url:
        activeStore.employee?.avatar_url ??
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
      onboarding_days_left: 22,
    },
    employee: activeStore.employee
      ? { ...activeStore.employee, interests: activeStore.employee.interests }
      : null,
    persona: activeStore.persona,
    mood: {
      energy_level: activeStore.energy,
      log_text: null,
      updated_at: new Date().toISOString(),
    },
    mentors,
    lunch: {
      active_buddies_count: 24,
      current_status:
        activeStore.lunchStatus.status === 'idle' ? 'idle' : activeStore.lunchStatus.status,
    },
  };
}

export function mockGetFlashJar(): FlashJarResponse {
  return { items: [...activeStore.flashJarItems], total: activeStore.flashJarItems.length };
}

export function mockGetDeskRewards(): DeskRewardsResponse {
  const lunch_voucher_count = activeStore.lunchDeskRewards.filter(
    (r) => r.reward_kind === 'meal_voucher',
  ).length;
  return {
    rewards: [...activeStore.lunchDeskRewards],
    lunch_voucher_count,
    total_count: activeStore.lunchDeskRewards.length,
  };
}

export function mockGetMyDesk(): MyDeskResponse {
  return buildDeskPayload(
    mockGetWorkplace(),
    mockGetFlashJar().items,
    mockGetLunchStatus(),
    mockGetInterestStatus(),
    mockGetDeskRewards().rewards,
  );
}

export function mockPostMood(body: {
  energy_level: number;
  log_text?: string;
}): MoodLogResponse {
  activeStore.energy = body.energy_level;
  const id = `mock-mood-${Date.now()}`;
  const created_at = new Date().toISOString();
  if (body.log_text?.trim()) {
    activeStore.flashJarItems.unshift({
      id,
      log_text: body.log_text.trim(),
      energy_level: body.energy_level,
      created_at,
    });
  }
  return {
    id,
    energy_level: body.energy_level,
    log_text: body.log_text ?? null,
    created_at,
  };
}

export function mockPatchMoodEnergy(energy_level: number) {
  activeStore.energy = energy_level;
  return { energy_level, updated_at: new Date().toISOString() };
}

export function mockGetMentors(): { mentors: MentorDto[] } {
  return {
    mentors: [
      {
        id: MOCK_MENTOR_ID,
        name: '雷军老师',
        avatar_url: 'https://api.dicebear.com/7.x/identicon/svg?seed=lei',
        role: '架构师 / 你的主导师',
        status: 'busy',
        type: 'main',
      },
      {
        id: 'u-mentor-002',
        name: '张经理',
        avatar_url: 'https://api.dicebear.com/7.x/identicon/svg?seed=zhang',
        role: '项目主管',
        status: 'available',
        type: 'project',
      },
    ],
  };
}

function mockCurrentUserId(): string {
  return mockSessionUser?.id ?? MOCK_MENTEE_ID;
}

function mockPeerForChat(peerId: string) {
  if (peerId === MOCK_MENTOR_ID || peerId === 'u-mentor-002') {
    return mockGetMentors().mentors.find((m) => m.id === peerId)!;
  }
  if (peerId === MOCK_MENTEE_ID) {
    return {
      id: MOCK_MENTEE_ID,
      name: '程序员小智',
      avatar_url: null,
      role: 'newcomer',
      status: 'available' as const,
      type: 'main' as const,
    };
  }
  return null;
}

export function mockGetNotifications(
  unreadOnly = false,
): NotificationsResponse {
  const items = unreadOnly
    ? activeStore.notifications.filter((n) => !n.read)
    : [...activeStore.notifications];
  return {
    unread_count: activeStore.notifications.filter((n) => !n.read).length,
    items: items.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
  };
}

export function mockMarkNotificationRead(id: string): { read: boolean } {
  const n = activeStore.notifications.find((x) => x.id === id);
  if (n) n.read = true;
  return { read: true };
}

export function mockMarkAllNotificationsRead(): { read: boolean } {
  activeStore.notifications.forEach((n) => {
    n.read = true;
  });
  return { read: true };
}

function mockMarkMentorPeerRead(peerId: string) {
  activeStore.notifications.forEach((n) => {
    if (n.type === 'mentor_reply' && n.peer_id === peerId) n.read = true;
  });
}

export function mockGetMentorChat(peerId: string): MentorChatThreadResponse {
  mockMarkMentorPeerRead(peerId);
  const me = mockCurrentUserId();
  const peer = mockPeerForChat(peerId);
  if (!peer) throw new Error('未找到带教关系');
  return {
    thread_id: 'mock-thread-1',
    peer: {
      id: peer.id,
      name: peer.name,
      avatar_url: peer.avatar_url,
      role: peer.id === MOCK_MENTEE_ID ? 'newcomer' : 'mentor',
      mentor_status: peer.status,
    },
    messages: activeStore.mentorChatMessages.map((m) => ({
      ...m,
      is_mine: m.sender_id === me,
    })),
  };
}

export function mockPostMentorChatMessage(
  peerId: string,
  content: string,
): { message: MentorChatMessage } {
  const me = mockCurrentUserId();
  const peer = mockPeerForChat(peerId);
  if (!peer) throw new Error('未找到带教关系');
  const msg: MentorChatMessage = {
    id: `mc-${Date.now()}`,
    sender_id: me,
    sender_name:
      me === MOCK_MENTEE_ID ? '程序员小智' : (peerId === MOCK_MENTOR_ID ? '雷军老师' : '张经理'),
    sender_role: me === MOCK_MENTEE_ID ? 'newcomer' : 'mentor',
    content: content.trim(),
    created_at: new Date().toISOString(),
    is_mine: true,
  };
  activeStore.mentorChatMessages.push(msg);
  if (peerId !== me) {
    activeStore.notifications.unshift({
      id: `notif-${Date.now()}`,
      type: 'mentor_reply',
      title: `${msg.sender_name} 回复了你`,
      body:
        msg.content.length > 80
          ? `${msg.content.slice(0, 80)}…`
          : msg.content,
      read: false,
      peer_id: me,
      created_at: msg.created_at,
    });
  }
  return { message: msg };
}

export function mockGetMentorChatInbox(): { items: MentorChatInboxItem[] } {
  const me = mockCurrentUserId();
  if (me === MOCK_MENTEE_ID) {
    return {
      items: mockGetMentors().mentors.map((m) => {
        const last = [...activeStore.mentorChatMessages]
          .reverse()
          .find(() => true);
        return {
          thread_id: 'mock-thread-1',
          peer: {
            id: m.id,
            name: m.name,
            avatar_url: m.avatar_url,
            role: 'mentor',
          },
          updated_at: last?.created_at ?? new Date().toISOString(),
          last_message: last
            ? {
                content: last.content,
                sender_id: last.sender_id,
                sender_name: last.sender_name,
                created_at: last.created_at,
                is_mine: last.sender_id === me,
              }
            : null,
          message_count: activeStore.mentorChatMessages.length,
        };
      }),
    };
  }
  return {
    items: [
      {
        thread_id: 'mock-thread-1',
        peer: {
          id: MOCK_MENTEE_ID,
          name: '程序员小智',
          avatar_url: null,
          role: 'newcomer',
        },
        updated_at:
          activeStore.mentorChatMessages[activeStore.mentorChatMessages.length - 1]?.created_at ??
          new Date().toISOString(),
        last_message: (() => {
          const last = activeStore.mentorChatMessages[activeStore.mentorChatMessages.length - 1];
          if (!last) return null;
          return {
            content: last.content,
            sender_id: last.sender_id,
            sender_name: last.sender_name,
            created_at: last.created_at,
            is_mine: last.sender_id === me,
          };
        })(),
        message_count: activeStore.mentorChatMessages.length,
      },
    ],
  };
}

export function mockGetLunchVenues(): {
  venues: LunchVenue[];
  default_venue_id: string;
} {
  return {
    venues: MOCK_SCENE_VENUES,
    default_venue_id: 'venue-1',
  };
}

export function mockPostLunchMatch(venue_id = 'venue-1'): {
  request_id: string;
  status: 'pending';
  created_at: string;
} {
  if (activeStore.lunchTimer) clearTimeout(activeStore.lunchTimer);
  activeStore.lunchVenueId = venue_id;
  const reqId = `mock-req-${Date.now()}`;
  activeStore.lunchStatus = {
    status: 'pending',
    request_id: reqId,
    venue_id: venue_id,
    venue_name: mockSceneVenueName(venue_id),
    matching_tags: activeStore.persona?.tags ?? [],
  };
  activeStore.lunchTimer = setTimeout(() => {
    const myTags = activeStore.persona?.tags ?? [];
    const partner = pickMockLunchPartner(myTags);
    const code = MOCK_LUNCH_CODES[activeStore.lunchMatchSeq % MOCK_LUNCH_CODES.length];
    const point =
      MOCK_MEETING_POINTS[activeStore.lunchMatchSeq % MOCK_MEETING_POINTS.length];
    activeStore.notifications.unshift({
      id: `notif-lunch-${Date.now()}`,
      type: 'lunch',
      title: '午餐匹配成功',
      body: `暗号 ${code}，集合点 ${point}`,
      read: false,
      peer_id: null,
      created_at: new Date().toISOString(),
    });
    activeStore.lunchStatus = {
      status: 'matched',
      request_id: reqId,
      match_code: code,
      meeting_point: point,
      meet_before: new Date(Date.now() + 3600000).toISOString(),
      venue_id: activeStore.lunchVenueId,
      venue_name: mockSceneVenueName(activeStore.lunchVenueId),
      confirmed: false,
      partner_persona: partner,
    };
    const venueName = mockSceneVenueName(activeStore.lunchVenueId);
    const sceneTag =
      MOCK_SCENE_VENUES.find((v) => v.id === activeStore.lunchVenueId)?.scene_tag ?? '用餐';
    const reward_kind =
      sceneTag === '户外'
        ? 'outdoor_badge'
        : sceneTag === '用餐'
          ? 'meal_voucher'
          : 'scene_perk';
    const title =
      reward_kind === 'meal_voucher'
        ? '饭搭子餐券'
        : reward_kind === 'outdoor_badge'
          ? '户外碰头徽章'
          : '场景奖励贴';
    if (!activeStore.lunchDeskRewards.some((r) => r.request_id === reqId)) {
      activeStore.lunchDeskRewards.push({
        id: `lunch-${reqId}`,
        source: 'lunch_match',
        request_id: reqId,
        reward_kind,
        title,
        detail: `${venueName} · ${code}`,
        venue_name: venueName,
        earned_at: new Date().toISOString(),
      });
    }
  }, 2500);
  return {
    request_id: reqId,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
}

export function mockGetLunchStatus(): LunchStatusResponse {
  return { ...activeStore.lunchStatus };
}

export function mockConfirmLunchMatch(): LunchStatusResponse {
  if (activeStore.lunchStatus.status !== 'matched') {
    throw new Error('当前没有可确认的匹配');
  }
  const point = activeStore.lunchStatus.meeting_point ?? MOCK_MEETING_POINTS[0];
  const roadmap = MOCK_ROADMAP.map((s, i) =>
    i === 2 ? { ...s, detail: point } : s,
  );
  activeStore.lunchStatus = {
    ...activeStore.lunchStatus,
    confirmed: true,
    roadmap,
    nearby_merchants: MOCK_MERCHANTS,
  };
  return { ...activeStore.lunchStatus };
}

export function mockBackLunchMatch(): LunchStatusResponse {
  if (activeStore.lunchStatus.status !== 'matched') {
    throw new Error('当前没有可返回的匹配结果');
  }
  const { roadmap: _r, nearby_merchants: _m, confirmed: _c, ...rest } =
    activeStore.lunchStatus;
  activeStore.lunchStatus = { ...rest, confirmed: false };
  return { ...activeStore.lunchStatus };
}

export function mockDeleteLunchMatch(): void {
  if (activeStore.lunchTimer) clearTimeout(activeStore.lunchTimer);
  activeStore.lunchStatus = { status: 'cancelled', confirmed: false };
}

function pickMockInterestPartner(myTags: string[]) {
  activeStore.interestMatchSeq += 1;
  const scored = MOCK_INTEREST_PARTNERS.map((p, i) => {
    const common = p.tags.filter((t) => myTags.includes(t)).length;
    return { p, score: common + ((activeStore.interestMatchSeq + i) % 3) * 0.2 };
  }).sort((a, b) => b.score - a.score);
  const pick = scored[activeStore.interestMatchSeq % scored.length]?.p ?? MOCK_INTEREST_PARTNERS[0];
  const common = pick.tags.filter((t) => myTags.includes(t));
  return {
    name: pick.name,
    tags: pick.tags,
    common_tags: common,
    affinity_label:
      common.length >= 2
        ? '爱好高度重合'
        : common.length === 1
          ? '有共同爱好'
          : '互补型兴趣搭子',
  };
}

export function mockGetInterestVenues() {
  return {
    venues: MOCK_SCENE_VENUES,
    default_venue_id: 'spot-interest',
  };
}

let mockInterestVenueId = 'spot-interest';

export function mockPostInterestMatch(venue_id = 'spot-interest') {
  if (activeStore.interestTimer) clearTimeout(activeStore.interestTimer);
  mockInterestVenueId = venue_id;
  const myTags = activeStore.employee?.interests ?? activeStore.persona?.tags ?? ['阅读'];
  activeStore.interestStatus = {
    status: 'pending',
    venue_id: venue_id,
    venue_name: mockSceneVenueName(venue_id),
    matching_tags: myTags,
  };
  activeStore.interestTimer = setTimeout(() => {
    const partner = pickMockInterestPartner(myTags);
    const code = MOCK_INTEREST_CODES[activeStore.interestMatchSeq % MOCK_INTEREST_CODES.length];
    const point =
      MOCK_INTEREST_POINTS[activeStore.interestMatchSeq % MOCK_INTEREST_POINTS.length];
    activeStore.notifications.unshift({
      id: `notif-interest-${Date.now()}`,
      type: 'system',
      title: '兴趣搭子匹配成功',
      body: `暗号 ${code}，集合点 ${point}`,
      read: false,
      peer_id: null,
      created_at: new Date().toISOString(),
    });
    activeStore.interestStatus = {
      status: 'matched',
      match_code: code,
      meeting_point: point,
      meet_before: new Date(Date.now() + 3600000).toISOString(),
      venue_id: mockInterestVenueId,
      venue_name: mockSceneVenueName(mockInterestVenueId),
      partner_persona: partner,
      confirmed: false,
    };
  }, 2500);
  return {
    request_id: 'mock-interest-req',
    status: 'pending',
    created_at: new Date().toISOString(),
  };
}

export function mockGetInterestStatus(): LunchStatusResponse {
  return { ...activeStore.interestStatus };
}

export function mockConfirmInterestMatch(): LunchStatusResponse {
  if (activeStore.interestStatus.status !== 'matched') {
    throw new Error('当前没有可确认的匹配');
  }
  activeStore.interestStatus = {
    ...activeStore.interestStatus,
    confirmed: true,
    roadmap: MOCK_ROADMAP,
    nearby_merchants: MOCK_MERCHANTS,
  };
  return { ...activeStore.interestStatus };
}

export function mockBackInterestMatch(): LunchStatusResponse {
  if (activeStore.interestStatus.status !== 'matched') {
    throw new Error('当前没有可返回的匹配结果');
  }
  const { roadmap: _r, nearby_merchants: _m, confirmed: _c, ...rest } =
    activeStore.interestStatus;
  activeStore.interestStatus = { ...rest, confirmed: false };
  return { ...activeStore.interestStatus };
}

export function mockDeleteInterestMatch(): void {
  if (activeStore.interestTimer) clearTimeout(activeStore.interestTimer);
  activeStore.interestStatus = { status: 'cancelled', confirmed: false };
}

export function mockGetMentorAssignees(): { assignees: MentorAssigneeDto[] } {
  return {
    assignees: MOCK_MENTOR_ASSIGNEES.map((a) => ({
      user_id: a.id,
      nickname: a.nickname,
      persona: {
        name: a.personaRole || activeStore.persona?.name || '未生成',
        tags: activeStore.persona?.tags ?? [],
      },
      energy_level: a.id === 'u1' ? activeStore.energy : a.energyLevel,
      onboarding_days_left: a.daysLeft,
      risk: a.risk,
    })),
  };
}

const MOCK_DEPT_STATS: Record<string, HrDashboardStats> = {
  内容创作部门: {
    scope_dept: '内容创作部门',
    newcomer_count: 2,
    integration_index: 73.5,
    integration_trend: '-8.2%',
    newcomers_at_risk: 2,
    newcomers_at_risk_trend: '+1',
    mentor_activity_rate: 1,
    mentor_activity_trend: '+5%',
    lunch_match_success_rate: 0.5,
    lunch_match_success_trend: '-12%',
    batches: [{ name: '5月一批', active: 72, risk: 2 }],
  },
  账号运营部门: {
    scope_dept: '账号运营部门',
    newcomer_count: 1,
    integration_index: 58,
    integration_trend: '-24%',
    newcomers_at_risk: 2,
    newcomers_at_risk_trend: '+2',
    mentor_activity_rate: 1,
    mentor_activity_trend: '+5%',
    lunch_match_success_rate: 1,
    lunch_match_success_trend: '+22%',
    batches: [{ name: '5月二批', active: 58, risk: 1 }],
  },
  数据分析部门: {
    scope_dept: '数据分析部门',
    newcomer_count: 1,
    integration_index: 65,
    integration_trend: '-17%',
    newcomers_at_risk: 1,
    newcomers_at_risk_trend: '0',
    mentor_activity_rate: 1,
    mentor_activity_trend: '+5%',
    lunch_match_success_rate: 0,
    lunch_match_success_trend: '-78%',
    batches: [{ name: '5月一批', active: 65, risk: 1 }],
  },
  商务市场部门: {
    scope_dept: '商务市场部门',
    newcomer_count: 1,
    integration_index: 55,
    integration_trend: '-29%',
    newcomers_at_risk: 2,
    newcomers_at_risk_trend: '+2',
    mentor_activity_rate: 1,
    mentor_activity_trend: '+5%',
    lunch_match_success_rate: 0.55,
    lunch_match_success_trend: '-23%',
    batches: [{ name: '5月二批', active: 55, risk: 1 }],
  },
  职能部门: {
    scope_dept: '职能部门',
    newcomer_count: 1,
    integration_index: 80,
    integration_trend: '-2%',
    newcomers_at_risk: 1,
    newcomers_at_risk_trend: '+1',
    mentor_activity_rate: 1,
    mentor_activity_trend: '+5%',
    lunch_match_success_rate: 0.8,
    lunch_match_success_trend: '-2%',
    batches: [{ name: '5月一批', active: 80, risk: 0 }],
  },
};

export function mockGetHrDashboardStats(dept?: string): HrDashboardStats {
  const key = dept?.trim();
  if (key && MOCK_DEPT_STATS[key]) return MOCK_DEPT_STATS[key];
  return {
    integration_index: 84.2,
    integration_trend: '+3.4%',
    newcomers_at_risk: 12,
    newcomers_at_risk_trend: '-2',
    mentor_activity_rate: 0.96,
    mentor_activity_trend: '+1.2%',
    lunch_match_success_rate: 0.78,
    lunch_match_success_trend: '+5.0%',
    batches: [
      { name: '4月一批', active: 85, risk: 12 },
      { name: '5月一批', active: 92, risk: 5 },
    ],
  };
}

export function mockGetHrMoodTrends(dept?: string): { points: HrMoodTrendPoint[] } {
  const base =
    dept === '内容创作部门'
      ? [78, 76, 82, 88, 70, 74, 75]
      : dept === '账号运营部门'
        ? [55, 52, 58, 62, 48, 50, 54]
        : dept === '职能部门'
          ? [82, 84, 86, 90, 78, 80, 81]
          : [80, 75, 85, 90, 65, 70, 75];
  const times = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
  return { points: times.map((time, i) => ({ time, score: base[i] ?? 70 })) };
}

const MOCK_HR_ALERTS: HrAlert[] = [
  {
    id: 'a1',
    user_alias: '蓝色小象',
    dept: '内容创作部门',
    reason: '连续3天情绪分极低',
    severity: 'red',
  },
  {
    id: 'a2',
    user_alias: '薄荷小熊',
    dept: '账号运营部门',
    reason: '午餐匹配失败率偏高',
    severity: 'yellow',
  },
  {
    id: 'a3',
    user_alias: '云端小鹿',
    dept: '数据分析部门',
    reason: '导师7天未互动',
    severity: 'yellow',
  },
  {
    id: 'a4',
    user_alias: '极光海豚',
    dept: '商务市场部门',
    reason: '能量低于40%持续一周',
    severity: 'red',
  },
  {
    id: 'a5',
    user_alias: '栗子同学',
    dept: '职能部门',
    reason: '入职第二周未更新面具',
    severity: 'yellow',
  },
];

const MOCK_HR_NEWCOMERS = [
  {
    id: 'n1',
    alias_name: '程序员小智',
    dept: '内容创作部门',
    batch: '5月一批',
    persona_name: '静谧 I 人忍者型',
    energy_level: 75,
    risk: 'normal' as const,
  },
  {
    id: 'n2',
    alias_name: '产品小美',
    dept: '账号运营部门',
    batch: '5月一批',
    persona_name: '社交 E 人带玩型',
    energy_level: 42,
    risk: 'watch' as const,
  },
  {
    id: 'n3',
    alias_name: '数据阿Ken',
    dept: '数据分析部门',
    batch: '4月二批',
    persona_name: '观察 N 人策谋型',
    energy_level: 68,
    risk: 'normal' as const,
  },
  {
    id: 'n4',
    alias_name: '商务Lily',
    dept: '商务市场部门',
    batch: '5月二批',
    persona_name: '踏实 S 人守护型',
    energy_level: 55,
    risk: 'watch' as const,
  },
  {
    id: 'n5',
    alias_name: '行政小周',
    dept: '职能部门',
    batch: '4月一批',
    persona_name: '玩梗 P 人协作型',
    energy_level: 80,
    risk: 'normal' as const,
  },
];

function filterHrByQuery<T extends { dept: string; user_alias?: string; alias_name?: string; reason?: string; persona_name?: string }>(
  items: T[],
  q: string,
): T[] {
  const query = q.trim().toLowerCase();
  if (!query) return items;
  return items.filter((it) => {
    const dept = it.dept.toLowerCase();
    const alias = (it.user_alias ?? it.alias_name ?? '').toLowerCase();
    const extra = String(it.reason ?? it.persona_name ?? '').toLowerCase();
    if (dept.includes(query) || alias.includes(query) || extra.includes(query)) {
      return true;
    }
    const depts = [
      '内容创作',
      '账号运营',
      '数据分析',
      '商务市场',
      '职能',
    ];
    return depts.some(
      (d) => query.includes(d) && dept.includes(d),
    );
  });
}

export function mockGetHrAlerts(query?: string): import('./types').HrAlertsResponse {
  const filtered = filterHrByQuery(MOCK_HR_ALERTS, query ?? '');
  return {
    alerts: filtered,
    total: filtered.length,
    query: query?.trim() || null,
    departments: [
      '内容创作部门',
      '账号运营部门',
      '数据分析部门',
      '商务市场部门',
      '职能部门',
    ],
  };
}

export function mockSearchHrNewcomers(
  query: string,
  page = 1,
  pageSize = 20,
): import('./types').HrSearchResponse {
  const filtered = filterHrByQuery(MOCK_HR_NEWCOMERS, query);
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    page_size: pageSize,
    departments: [
      '内容创作部门',
      '账号运营部门',
      '数据分析部门',
      '商务市场部门',
      '职能部门',
    ],
    query: query.trim() || null,
  };
}

export function mockPostHrInterventions(alert_ids: string[]) {
  return { sent: alert_ids.length, failed: 0 };
}

function allMockNewcomerAccounts(): PortalAccount[] {
  return [
    ...Object.values(MOCK_PORTAL_USERS).filter((a) => a.role === 'newcomer'),
    ...Object.values(mockHrRegistered),
  ];
}

function pendingStatusFor(account: PortalAccount): string {
  if (account.onboardingCompleted) return '已转正（老员工）';
  return '待首次登录 / 人格测试';
}

export function mockGetHrPendingNewcomers(): {
  items: HrPendingNewcomerItem[];
  total: number;
} {
  const items = allMockNewcomerAccounts().map((a) => ({
    id: a.userId,
    username: a.username ?? '',
    nickname: a.nickname,
    dept: a.dept || '—',
    onboarding_completed: a.onboardingCompleted,
    has_persona: a.onboardingCompleted,
    dominant_type: a.onboardingCompleted
      ? a.personaName.match(/\b([IENS P])\b/)?.[1]?.trim() ??
        (a.personaName.includes('I') ? 'I' : 'E')
      : null,
    status_label: pendingStatusFor(a),
  }));
  return { items, total: items.length };
}

export function mockRegisterHrNewcomer(body: {
  username: string;
  nickname: string;
  dept: string;
}): HrRegisterNewcomerResponse {
  const username = body.username.trim().toUpperCase();
  if (!/^E\d{5}$/.test(username)) {
    throw new Error('工号格式应为 E 开头 + 5 位数字，例如 E00009');
  }
  if (MOCK_PORTAL_USERS[username] || mockHrRegistered[username]) {
    throw new Error(`工号 ${username} 已存在，请更换工号`);
  }
  const userId = `u-hr-reg-${Date.now()}`;
  mockHrRegistered[username] = {
    password: DEMO_NEWCOMER_PASSWORD,
    role: 'newcomer',
    username,
    nickname: body.nickname.trim(),
    userId,
    dept: body.dept,
    onboardingCompleted: false,
    personaName: '',
    personaTags: [],
    personaMotto: '',
    energy: 75,
  };
  return {
    user_id: userId,
    username,
    nickname: body.nickname.trim(),
    dept: body.dept,
    default_password: DEMO_NEWCOMER_PASSWORD,
    onboarding_completed: false,
    message: `已创建待入职账号 ${username}，默认密码 ${DEMO_NEWCOMER_PASSWORD}，新人首次登录后将完成人格测试并自动转为老员工。`,
  };
}

export function mockGetSystemStatus(): import('./types').SystemStatusResponse {
  return {
    database: {
      engine: 'mock',
      path: 'localStorage',
      connected: false,
      tables: {
        users: 1,
        personas: activeStore.onboardingDone ? 1 : 0,
        quiz_questions: 8,
        mood_logs: 0,
        lunch_match_requests: 0,
        ai_hr_messages: 0,
        mentor_assignments: 0,
      },
    },
    skill: {
      name: 'ai-hr-onboarding',
      loaded: true,
      reply_mode: 'mock-local+guidelines',
      enterprise_guidelines: {
        name: 'enterprise-management-guidelines',
        version: '2025.05',
        chunk_count: 18,
        loaded: true,
      },
    },
    user: {
      id: 'mock-user-id',
      nickname: '程序员小智',
      role: 'newcomer',
      onboarding_completed: activeStore.onboardingDone,
      persona_name: activeStore.persona?.name ?? null,
      energy_level: activeStore.energy,
      days_left: 22,
    },
    user_data: {
      mood_log_count: 0,
      latest_mood_text: null,
      lunch_status: activeStore.lunchStatus.status,
      lunch_code: null,
      mentor_names: ['张经理', '雷军老师'],
      ai_message_count: 0,
      quiz_question_count: 8,
    },
    ai_history_count: 0,
  };
}

function buildMockAiHrReply(message: string): {
  reply: string;
  topic: string;
  source: string;
  citations: import('./types').AiHrCitation[];
  integrated_sources: string[];
} {
  const m = message;
  const policyVersion = '2025.05';
  let reply = `你好，我已收到你的问题。当前能量 ${activeStore.energy}%，面具 ${activeStore.persona?.name ?? '未完成（请先做完 8 题盲盒）'}。`;
  let topic = 'general';
  let source = 'skill-general';
  let citations: import('./types').AiHrCitation[] = [];
  let integrated_sources = ['ai-hr-onboarding'];

  const cite = (
    id: string,
    title: string,
    section: string,
    excerpt: string,
    file: string,
  ) => {
    citations = [
      {
        id,
        title,
        section,
        excerpt,
        source: file,
        policy_version: policyVersion,
      },
    ];
    integrated_sources = ['ai-hr-onboarding', 'enterprise-management-guidelines'];
    source = 'enterprise-guidelines';
  };

  if (/请假|年假|休假|病假|事假|考勤|打卡|加班|调休/.test(m)) {
    topic = 'policy_attendance';
    cite(
      'attendance__leave',
      '考勤与休假',
      '请假类型与审批',
      '年假/事假提前 1 个工作日提交；病假可事后 24 小时内补单。',
      'policies/02-attendance-leave.md',
    );
    reply = `【企业管理准则 · 考勤与休假】${mockSessionUser?.nickname ?? '同事'}，根据集团现行制度（v${policyVersion}）：\n\n**请假类型与审批**\n· 年假：按工龄 5～15 天，审批链 主管 → HRBP\n· 事假：主管 → 部门负责人，无薪，优先冲抵年假\n· 病假：主管审批，≥3 天需二级以上医院证明\n· **提前量**：年假/事假提前 1 个工作日；病假 24 小时内补单\n\n**引用条款**\n· 考勤与休假 › 请假类型与审批（${policyVersion}）\n\n请走钉钉「人事服务」提交申请。`;
  } else if (/报销|差旅|发票|发薪|工资|薪酬/.test(m)) {
    topic = 'policy_compensation';
    cite(
      'compensation__expense',
      '薪酬与报销',
      '费用报销流程',
      '费控报销审批通过后 5 个工作日打款至工资卡。',
      'policies/03-compensation-expense.md',
    );
    reply = `【企业管理准则 · 薪酬与报销】费用报销：① 费控 App 建单 ② 上传电子发票 ③ 主管 → 财务共享（≥5000 元加签负责人）④ 审批通过后 **5 个工作日** 打款。\n\n差旅标准：机票经济舱；一线住宿 500 元/晚；出差餐补 120 元/天包干。\n\n**引用条款**\n· 薪酬与报销 › 费用报销流程（${policyVersion}）`;
  } else if (/入职|试用期|转正|手续|第一天/.test(m)) {
    topic = 'policy_onboarding';
    cite(
      'onboarding__process',
      '入职与试用期',
      '入职手续办理流程',
      '3 个工作日内提交入职材料并签署电子签；和拍盲盒在完成集团手续后进行。',
      'policies/01-onboarding-probation.md',
    );
    reply = `【企业管理准则 · 入职与试用期】\n\n**入职手续**：offer 接受后 3 个工作日内提交材料 → 签署劳动合同/保密协议 → 账号开通 → 半天入职培训。\n\n**和拍联动**：完成集团手续后，在插件完成 **8 题盲盒** 并查看安全屋。\n\n**引用条款**\n· 入职与试用期 › 入职手续办理流程（${policyVersion}）`;
  } else if (/绩效|OKR|考核|申诉/.test(m)) {
    topic = 'policy_performance';
    cite(
      'performance__okr',
      '绩效与发展',
      'OKR 设定规则',
      '每季度初 5 个工作日内完成 OKR 录入并与主管对齐。',
      'policies/04-performance-development.md',
    );
    reply = `【企业管理准则 · 绩效与发展】季度 OKR + 半年度绩效；新人当季不参与强制分布。\n\nOKR：每季度初 **5 个工作日** 内录入；O 不超过 3 个；含至少 1 条团队贡献 KR。\n\n异议：结果公布后 **3 个工作日** 内向 HRBP 申诉。\n\n**引用条款**\n· 绩效与发展 › OKR 设定规则（${policyVersion}）`;
  } else if (/保密|信息安全|账号|权限|泄露/.test(m)) {
    topic = 'policy_security';
    cite(
      'security__duty',
      '信息安全与保密',
      '保密义务范围',
      '未公开财务、客户、源码、薪酬等；禁止未授权 AI 粘贴代码与客户数据。',
      'policies/05-info-security.md',
    );
    reply = `【企业管理准则 · 信息安全】在职及离职后 2 年内负有保密义务；禁止个人网盘存工作文件、禁止向未授权 AI 粘贴代码与客户数据。\n\n和拍：向 AI HR 提问时勿粘贴合同号、完整身份证号、未脱敏薪酬。\n\n**引用条款**\n· 信息安全与保密 › 保密义务范围（${policyVersion}）`;
  } else if (/面具|盲盒|人格|测试|8题|八道题/.test(m)) {
    topic = 'mask';
    source = 'skill-mask';
    reply = `【人格面具】8 题在「入职盲盒」生成虚拟称号与标签，不评判好坏；真实性格有约 30 天保护期。${activeStore.persona ? `你的面具：${activeStore.persona.name}，标签 ${activeStore.persona.tags.slice(0, 2).join('、')}。` : '你尚未完成测试，建议今天先做完。'}`;
  } else if (/焦虑|紧张|社恐|害怕|压力/.test(m)) {
    topic = 'anxiety';
    source = 'skill-anxiety';
    reply = `【入职焦虑】很常见。你当前能量 ${activeStore.energy}%，建议：① 安全屋记一条闪光 ② 轻量发起午餐匹配 ③ 导师状态为绿灯再私信，不必硬撑。`;
  } else if (/午餐|蹭饭|饭搭子|食堂/.test(m)) {
    topic = 'lunch';
    source = 'skill-lunch';
    reply = `【午餐匹配】当前状态：${activeStore.lunchStatus.status}。在「蹭饭地图」按面具标签匹配，见面用暗号、仅展示虚拟称号。`;
  } else if (/导师|带教|老师/.test(m)) {
    topic = 'mentor';
    source = 'skill-mentor';
    reply =
      '【联系导师】先看导师状态灯（绿灯再联系）。话术示例：「老师好，有个 5 分钟问题想请教，您方便吗？」';
  } else if (/情绪|能量|闪光|心情|低落/.test(m)) {
    topic = 'mood';
    source = 'skill-mood';
    reply = `【情绪能量】当前 ${activeStore.energy}%。可在安全屋调整能量条或「记录今日闪光」，数据仅用于自助与 HR 风险预警，不对同事公开。`;
  } else if (
    /部门.*(几|多少|几个|几位|几人)|多少人|有几个|有几位|有几人|几个人|咱们.*(几|多少)/.test(
      m,
    )
  ) {
    topic = 'dept_size';
    source = 'skill-dept-data';
    reply = `【部门人数】你属于「内容创作部门」（演示数据）。和拍已登记本部门新人约 2 人（含你），全平台约 7 名新人。这是融入平台统计，完整编制请咨询 HR。`;
  } else if (/哪个部门|什么部门|我.*部门/.test(m)) {
    topic = 'dept_info';
    source = 'skill-dept-data';
    reply = '【你的部门】在和拍里登记为「内容创作部门」（演示）。';
  } else if (/隐私|匿名|真实.*(名字|花名)/.test(m)) {
    topic = 'privacy';
    source = 'skill-privacy';
    reply =
      '【隐私】和拍只展示面具称号，不公开盲盒原始答案；情绪不对全员公开。';
  } else if (/首周|路线|入职|第一周/.test(m)) {
    topic = 'roadmap';
    source = 'skill-roadmap';
    reply =
      '【首周路线】第 1 天：完成 8 题 + 安全屋；第 2～3 天：闪光 + 导师问候；第 1 周：尝试 1 次午餐匹配。';
  } else if (/你好|帮助|怎么用|开始/.test(m.trim())) {
    topic = 'welcome';
    source = 'skill-welcome';
    reply = activeStore.persona
      ? `我是企业 AI HR 助手。你的面具「${activeStore.persona.name}」已解锁，可问：焦虑、午餐、导师、情绪。`
      : '我是企业 AI HR 助手。请先完成左侧「入职盲盒」8 题，之后我能结合你的面具与能量给更贴身的建议。';
  }

  return { reply, topic, source, citations, integrated_sources };
}

export function mockGetAiHrHistory(): import('./types').AiHrHistoryResponse {
  return {
    session_id: activeStore.aiHrSessionId,
    messages: [...activeStore.aiHrMessages],
  };
}

export function mockPostAiHrChat(message: string): import('./types').AiHrChatResponse {
  const trimmed = message.trim();
  const { reply, topic, source, citations, integrated_sources } =
    buildMockAiHrReply(trimmed);
  const now = new Date().toISOString();

  activeStore.aiHrMessages.push({
    id: `u-${Date.now()}`,
    role: 'user',
    content: trimmed,
    created_at: now,
  });
  activeStore.aiHrMessages.push({
    id: `a-${Date.now()}`,
    role: 'assistant',
    content: reply,
    created_at: now,
  });
  if (!activeStore.aiHrSessionId) activeStore.aiHrSessionId = 'mock-ai-hr-session';

  return {
    reply,
    role: mockSessionUser?.role ?? 'newcomer',
    reply_source: source,
    topic,
    citations,
    policy_version: citations[0]?.policy_version ?? '2025.05',
    integrated_sources,
  };
}

export function mockClearAiHrHistory(): { cleared: boolean } {
  activeStore.aiHrSessionId = null;
  activeStore.aiHrMessages.length = 0;
  return { cleared: true };
}

export function mockGetAiHrSkill(role: UserType): AiHrSkillMeta {
  const r = role === 'mentor' || role === 'hr' ? role : 'newcomer';
  const m = skillManifest as {
    name: string;
    display_name: string;
    version: string;
    source_desktop: string;
    philosophy: string[];
    welcome: Record<string, string>;
    suggestions: Record<string, string[]>;
    first_week_roadmap: { phase: string; tasks: string[] }[];
    reference_files: string[];
  };
  return {
    name: m.name,
    display_name: m.display_name,
    version: m.version,
    source_desktop: m.source_desktop,
    philosophy: m.philosophy,
    welcome: m.welcome[r] ?? m.welcome.newcomer,
    suggestions: m.suggestions[r] ?? m.suggestions.newcomer,
    first_week_roadmap: m.first_week_roadmap,
    reference_files: m.reference_files,
    skill_dir: 'skills/ai-hr-onboarding (mock)',
    enterprise_guidelines: {
      name: 'enterprise-management-guidelines',
      version: '2025.05',
      chunk_count: 18,
    },
    integrated_skills: ['ai-hr-onboarding', 'enterprise-management-guidelines'],
  };
}

export function mockGetAiHrGuidelines(
  query?: string,
): import('./types').AiHrGuidelinesCatalog | import('./types').AiHrGuidelineSearchResponse {
  const catalog: import('./types').AiHrGuidelinesCatalog = {
    name: 'enterprise-management-guidelines',
    display_name: '企业管理准则（制度与流程知识库）',
    version: '2025.05',
    effective_date: '2025-01-01',
    owner: '集团人力资源部',
    description: '入职、考勤休假、薪酬报销、绩效发展、信息安全、带教融入等准则与办事流程。',
    integrated_with: ['ai-hr-onboarding'],
    chunk_count: 18,
    categories: [
      {
        id: 'onboarding',
        title: '入职与试用期',
        file: 'policies/01-onboarding-probation.md',
        sections: [
          {
            id: 'onboarding__process',
            section: '入职手续办理流程',
            excerpt: '3 个工作日内提交入职材料并签署电子签…',
          },
        ],
      },
      {
        id: 'attendance',
        title: '考勤与休假',
        file: 'policies/02-attendance-leave.md',
        sections: [
          {
            id: 'attendance__leave',
            section: '请假类型与审批',
            excerpt: '年假/事假提前 1 个工作日提交…',
          },
        ],
      },
      {
        id: 'compensation',
        title: '薪酬与报销',
        file: 'policies/03-compensation-expense.md',
        sections: [
          {
            id: 'compensation__expense',
            section: '费用报销流程',
            excerpt: '费控报销 → 主管 → 财务共享…',
          },
        ],
      },
    ],
  };
  if (!query?.trim()) return catalog;
  const q = query.trim();
  const hits = catalog.categories
    .flatMap((c) =>
      c.sections.map((s) => ({
        score: 8,
        chunk_id: s.id,
        citation: {
          id: s.id,
          title: c.title,
          section: s.section,
          excerpt: s.excerpt,
          source: c.file,
          policy_version: catalog.version,
        },
      })),
    )
    .filter(
      (h) =>
        h.citation.title.includes(q) ||
        h.citation.section.includes(q) ||
        q.length <= 2,
    )
    .slice(0, 4);
  return {
    query: q,
    policy_version: catalog.version,
    results: hits.length ? hits : catalog.categories.slice(0, 1).map((c) => ({
      score: 5,
      chunk_id: c.sections[0].id,
      citation: {
        id: c.sections[0].id,
        title: c.title,
        section: c.sections[0].section,
        excerpt: c.sections[0].excerpt,
        source: c.file,
        policy_version: catalog.version,
      },
    })),
  };
}
