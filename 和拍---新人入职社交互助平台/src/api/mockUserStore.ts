/**
 * Mock API：按 userId 隔离高光 / 导师对话 / AI HR 等内存数据
 */
import type {
  AiHrMessage,
  EmployeeProfileDto,
  FlashJarItem,
  LunchStatusResponse,
  MentorChatMessage,
  NotificationItem,
  PersonaDto,
} from './types';
import type { DeskReward } from './types';

const MOCK_MENTEE_ID = 'u-newcomer-001';
const MOCK_MENTOR_ID = 'u-mentor-001';

export interface MockUserStore {
  persona: PersonaDto | null;
  employee: EmployeeProfileDto | null;
  onboardingDone: boolean;
  energy: number;
  flashJarItems: FlashJarItem[];
  aiHrSessionId: string | null;
  aiHrMessages: AiHrMessage[];
  mentorChatMessages: MentorChatMessage[];
  notifications: NotificationItem[];
  lunchStatus: LunchStatusResponse;
  lunchDeskRewards: DeskReward[];
  lunchTimer: ReturnType<typeof setTimeout> | null;
  lunchMatchSeq: number;
  lunchVenueId: string;
  interestStatus: LunchStatusResponse;
  interestTimer: ReturnType<typeof setTimeout> | null;
  interestMatchSeq: number;
}

const stores = new Map<string, MockUserStore>();

function defaultNotifications(): NotificationItem[] {
  return [
    {
      id: 'notif-mc-1',
      type: 'mentor_reply',
      title: '雷军老师 回复了你',
      body: '欢迎加入！先看内网 Wiki 新人手册，周三可约 15 分钟同步。',
      read: false,
      peer_id: MOCK_MENTOR_ID,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'notif-sys-1',
      type: 'system',
      title: '入职指引',
      body: '完成人格盲盒后即可使用安全屋、蹭饭地图与导师私信。',
      read: false,
      peer_id: null,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];
}

function defaultMentorChat(): MentorChatMessage[] {
  return [
    {
      id: 'mc-mock-1',
      sender_id: MOCK_MENTEE_ID,
      sender_name: '程序员小智',
      sender_role: 'newcomer',
      content: '老师您好，想请教一下新人文档规范有推荐阅读吗？',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      is_mine: false,
    },
    {
      id: 'mc-mock-2',
      sender_id: MOCK_MENTOR_ID,
      sender_name: '雷军老师',
      sender_role: 'mentor',
      content: '欢迎加入！先看内网 Wiki 新人手册，周三可约 15 分钟同步。',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      is_mine: false,
    },
  ];
}

function clearTimers(store: MockUserStore) {
  if (store.lunchTimer) clearTimeout(store.lunchTimer);
  if (store.interestTimer) clearTimeout(store.interestTimer);
  store.lunchTimer = null;
  store.interestTimer = null;
}

export function createDefaultStore(
  userId: string,
  opts?: { freshOnboarding?: boolean },
): MockUserStore {
  const isNewcomer =
    userId === MOCK_MENTEE_ID || userId.startsWith('u-newcomer');
  const isMentor = userId.includes('mentor') || userId === MOCK_MENTOR_ID;

  return {
    persona: opts?.freshOnboarding ? null : null,
    employee: null,
    onboardingDone: opts?.freshOnboarding ? false : false,
    energy: 75,
    flashJarItems: [],
    aiHrSessionId: null,
    aiHrMessages: [],
    mentorChatMessages:
      isNewcomer || isMentor ? defaultMentorChat() : [],
    notifications: isNewcomer ? defaultNotifications() : [],
    lunchStatus: { status: 'idle' },
    lunchDeskRewards: [],
    lunchTimer: null,
    lunchMatchSeq: 0,
    lunchVenueId: 'venue-1',
    interestStatus: { status: 'idle' },
    interestTimer: null,
    interestMatchSeq: 0,
  };
}

/** 当前登录用户绑定的 store（由 mockSwitchUser 切换） */
export let activeStore: MockUserStore = createDefaultStore(MOCK_MENTEE_ID);

export function mockSwitchUser(userId: string): void {
  if (!stores.has(userId)) {
    stores.set(userId, createDefaultStore(userId));
  }
  activeStore = stores.get(userId)!;
}

export function mockLogoutSession(): void {
  clearTimers(activeStore);
}

export function mockResetActiveUserOnboarding(userId: string): void {
  const prev = stores.get(userId);
  if (prev) clearTimers(prev);
  const fresh = createDefaultStore(userId, { freshOnboarding: true });
  stores.set(userId, fresh);
  activeStore = fresh;
}
