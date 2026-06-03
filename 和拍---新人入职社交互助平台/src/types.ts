/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserType = 'newcomer' | 'mentor' | 'hr';

export type AppView =
  | 'blindbox'
  | 'workplace'
  | 'my_desk'
  | 'flash_star'
  | 'lunch'
  | 'interest'
  | 'mentors'
  | 'mentor_chat'
  | 'mentor_hub'
  | 'hr'
  | 'ai_hr';

export interface UserPersona {
  /** 面具名称，对应 API Persona.name */
  role: string;
  tags: string[];
  hiddenPreferences: string[];
  moodScore: number;
  /** 职场格言，对应 API Persona.motto */
  motto: string;
}

export interface MentorStatus {
  id: string;
  name: string;
  avatar: string;
  status: 'busy' | 'available' | 'syncing';
  role: string;
}

export interface OnboardingQuiz {
  question: string;
  options: {
    text: string;
    value: string;
  }[];
}

export const QUIZ_QUESTIONS: OnboardingQuiz[] = [
  {
    question: '到了下班时间，你此刻真实的内心OS是？',
    options: [
      { text: '火速撤离，回家充电', value: 'I' },
      { text: '看看谁还没走，约个饭？', value: 'E' },
      { text: '再磨蹭一会儿，避开晚高峰', value: 'N' },
    ],
  },
  {
    question: '遇到卡壳的工作难题，你更喜欢？',
    options: [
      { text: '独自钻研，查遍文档', value: 'I' },
      { text: '直接转头问旁边的前辈', value: 'E' },
      { text: '发个表情包到群里求助', value: 'P' },
    ],
  },
  {
    question: '下班后，你更偏向于怎样放松？',
    options: [
      { text: '阅读或看一部安静的电影', value: 'I' },
      { text: '去健身房或户外跑步', value: 'E' },
      { text: '和三五好友小聚', value: 'S' },
    ],
  },
  {
    question: '开会时你更倾向于？',
    options: [
      { text: '先听别人说，最后再发言', value: 'I' },
      { text: '积极接话，带动讨论', value: 'E' },
      { text: '记笔记，会后私聊跟进', value: 'N' },
    ],
  },
  {
    question: '午餐时间，你更愿意？',
    options: [
      { text: '一个人快速吃完', value: 'I' },
      { text: '和同事一起聊聊', value: 'E' },
      { text: '看心情，偶尔拼桌', value: 'P' },
    ],
  },
  {
    question: '面对新任务，你的第一反应是？',
    options: [
      { text: '列清单，按步骤推进', value: 'S' },
      { text: '先找类似案例抄作业', value: 'P' },
      { text: '想清楚目标再动手', value: 'N' },
    ],
  },
  {
    question: '如果可以选择工位氛围，你更喜欢？',
    options: [
      { text: '安静角落，减少打扰', value: 'I' },
      { text: '热闹区域，随时能聊', value: 'E' },
      { text: '灵活流动，哪里需要去哪', value: 'P' },
    ],
  },
  {
    question: '入职第一周，你最希望获得的支持是？',
    options: [
      { text: '清晰的文档和自学路径', value: 'I' },
      { text: '有人带我认识团队和饭局', value: 'E' },
      { text: '稳定的带教节奏和反馈', value: 'S' },
    ],
  },
];

const PERSONA_TEMPLATES: Record<
  string,
  Omit<UserPersona, 'moodScore' | 'hiddenPreferences'>
> = {
  I: {
    role: '静谧 I 人忍者型',
    tags: ['独处充电', '文档达人', '咖啡续命'],
    motto: '不打扰是我的温柔，交付是我的靠谱。',
  },
  E: {
    role: '社交 E 人带玩型',
    tags: ['饭局发起人', '气氛组', '跨界聊得来'],
    motto: '先连接人，再连接事——团队节奏我来带。',
  },
  P: {
    role: '玩梗 P 人协作型',
    tags: ['表情包外交', '群聊活跃', '灵感快闪'],
    motto: '严肃问题也可以轻松问，求助不丢人。',
  },
  S: {
    role: '踏实 S 人守护型',
    tags: ['步骤清晰', '靠谱搭子', '桌游局常驻'],
    motto: '一步一步来，把小事做好就是最好的融入。',
  },
  N: {
    role: '观察 N 人策谋型',
    tags: ['错峰出行', '信息敏感', '低调进场'],
    motto: '先看清局面再开口，是我的职场安全感。',
  },
};

/** 根据盲盒答案生成 Persona（原型 mock，正式版由 POST /api/quiz/submit 返回） */
export function generatePersonaFromAnswers(answers: string[]): UserPersona {
  const counts: Record<string, number> = {};
  for (const a of answers) {
    counts[a] = (counts[a] ?? 0) + 1;
  }
  const dominant =
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'I';
  const template = PERSONA_TEMPLATES[dominant] ?? PERSONA_TEMPLATES.I;

  const secondary = Object.entries(counts)
    .filter(([k]) => k !== dominant)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  const hiddenPreferences = answers.map((a) => {
    const labels: Record<string, string> = {
      I: '偏好独处恢复',
      E: '偏好面对面交流',
      P: '偏好轻量群聊求助',
      S: '偏好小圈稳定社交',
      N: '偏好错峰与观察',
    };
    return labels[a] ?? a;
  });

  return {
    ...template,
    hiddenPreferences: [...new Set(hiddenPreferences)],
    moodScore: 75,
    tags: secondary
      ? [...template.tags, `${PERSONA_TEMPLATES[secondary]?.role.split(' ')[1] ?? ''}倾向`.trim()]
      : template.tags,
  };
}

export const MOCK_MENTORS: MentorStatus[] = [
  {
    id: 'm1',
    name: '雷军老师',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=lei',
    status: 'busy',
    role: '架构师 / 你的主导师',
  },
  {
    id: 'm2',
    name: '张经理',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=zhang',
    status: 'available',
    role: '项目主管',
  },
];

export const MOCK_MENTOR_ASSIGNEES = [
  {
    id: 'u1',
    nickname: '程序员小智',
    personaRole: '', // filled at runtime from context
    energyLevel: 75,
    daysLeft: 22,
    risk: 'normal' as const,
  },
  {
    id: 'u2',
    nickname: '产品小美',
    personaRole: '社交 E 人带玩型',
    energyLevel: 42,
    daysLeft: 18,
    risk: 'watch' as const,
  },
];
