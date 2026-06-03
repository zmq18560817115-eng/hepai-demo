/**
 * 根据 8 题盲盒答案生成并落库的员工档案（部门、昵称、能量基线等）
 */
import { HR_DEPARTMENTS } from '../db/fullSeed.js';
import { generatePersonaFromAnswers } from './persona.js';
import { buildPersonaAvatarUrl } from './personaAvatars.js';

export type PersonalityLetter = 'I' | 'E' | 'P' | 'S' | 'N';

export interface QuizAnswerInput {
  question_id: string;
  answer_value: string;
}

export interface GeneratedEmployeeProfile {
  employee_no: string;
  dept: string;
  display_title: string;
  nickname: string;
  avatar_url: string;
  energy_level: number;
  dominant_type: PersonalityLetter;
  secondary_type: PersonalityLetter | null;
  work_style: string;
  social_style: string;
  lunch_preference: string;
  support_preference: string;
  traits: string[];
  interests: string[];
  answer_snapshot: QuizAnswerInput[];
}

export const TYPE_CONFIG: Record<
  PersonalityLetter,
  {
    dept: (typeof HR_DEPARTMENTS)[number];
    nicknamePrefix: string;
    title: string;
    energy: number;
    avatarSeed: string;
    work_style: string;
    social_style: string;
    lunch_preference: string;
    support_preference: string;
  }
> = {
  I: {
    dept: '内容创作部门',
    nicknamePrefix: '内容',
    title: '内容创作专员',
    energy: 72,
    avatarSeed: 'hepai-i',
    work_style: '深度专注 · 文档驱动',
    social_style: '低打扰 · 异步沟通优先',
    lunch_preference: '独食快充 · 错峰用餐',
    support_preference: '清晰文档与自学路径',
  },
  E: {
    dept: '账号运营部门',
    nicknamePrefix: '运营',
    title: '账号运营专员',
    energy: 58,
    avatarSeed: 'hepai-e',
    work_style: '快速协同 · 面对面推进',
    social_style: '饭局破冰 · 主动链接',
    lunch_preference: '拼桌社交 · 午餐破冰',
    support_preference: '团队介绍与饭局带教',
  },
  N: {
    dept: '数据分析部门',
    nicknamePrefix: '数据',
    title: '数据分析专员',
    energy: 65,
    avatarSeed: 'hepai-n',
    work_style: '先谋后动 · 信息敏感',
    social_style: '观察入场 · 会后跟进',
    lunch_preference: '灵活错峰 · 轻量交流',
    support_preference: '目标对齐与节奏反馈',
  },
  S: {
    dept: '商务市场部门',
    nicknamePrefix: '商务',
    title: '商务市场专员',
    energy: 55,
    avatarSeed: 'hepai-s',
    work_style: '步骤清晰 · 稳定交付',
    social_style: '小圈深交 · 靠谱搭子',
    lunch_preference: '固定饭搭 · 稳定节奏',
    support_preference: '稳定带教节奏与阶段反馈',
  },
  P: {
    dept: '职能部门',
    nicknamePrefix: '职能',
    title: '职能协作专员',
    energy: 80,
    avatarSeed: 'hepai-p',
    work_style: '灵感快闪 · 群聊协作',
    social_style: '表情包外交 · 轻松求助',
    lunch_preference: '看心情拼桌 · 轻量社交',
    support_preference: '灵活答疑与轻量检查点',
  },
};

const NICK_SUFFIX: Record<PersonalityLetter, string> = {
  I: '小智',
  E: '阿凯',
  N: '小鹿',
  S: 'Lily',
  P: '小周',
};

/** 盲盒人格字母 → 兴趣标签（用于兴趣搭子匹配） */
export const HOBBY_BY_LETTER: Record<PersonalityLetter, string[]> = {
  I: ['阅读', '观影', '咖啡'],
  E: ['健身', '聚餐', '桌游'],
  N: ['CityWalk', '摄影', '播客'],
  S: ['徒步', '下厨', '园艺'],
  P: ['手游', 'Livehouse', '汉服'],
};

export function deriveInterestsFromAnswers(values: string[]): string[] {
  const set = new Set<string>();
  for (const v of values) {
    const list = HOBBY_BY_LETTER[v as PersonalityLetter];
    if (list) list.forEach((h) => set.add(h));
  }
  return [...set].slice(0, 8);
}

export const ANSWER_TRAIT_LABELS: Record<string, string> = {
  I: '偏好独处恢复',
  E: '偏好面对面交流',
  P: '偏好轻量群聊求助',
  S: '偏好小圈稳定社交',
  N: '偏好错峰与观察',
};

export function tallyAnswerTypes(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const v of values) {
    const key = v as PersonalityLetter;
    if (TYPE_CONFIG[key]) counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function dominantAndSecondary(counts: Record<string, number>): {
  dominant: PersonalityLetter;
  secondary: PersonalityLetter | null;
} {
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const dominant = (sorted[0]?.[0] ?? 'I') as PersonalityLetter;
  const secondary = (sorted[1]?.[0] ?? null) as PersonalityLetter | null;
  return { dominant, secondary };
}

function employeeNoFrom(dominant: PersonalityLetter, userId: string): string {
  const prefix: Record<PersonalityLetter, string> = {
    I: 'NC',
    E: 'NO',
    N: 'ND',
    S: 'NB',
    P: 'NF',
  };
  const tail = userId.replace(/\D/g, '').slice(-4).padStart(4, '0');
  return `${prefix[dominant]}${tail || '0001'}`;
}

/** 根据 8 题答案生成完整员工档案（面具 + 组织信息） */
export function generateEmployeeProfileFromAnswers(
  userId: string,
  answers: QuizAnswerInput[],
): GeneratedEmployeeProfile & { persona: ReturnType<typeof generatePersonaFromAnswers> } {
  const values = answers.map((a) => a.answer_value);
  const persona = generatePersonaFromAnswers(values);
  const counts = tallyAnswerTypes(values);
  const { dominant, secondary } = dominantAndSecondary(counts);
  const cfg = TYPE_CONFIG[dominant] ?? TYPE_CONFIG.I;
  const suffixKey = (secondary && TYPE_CONFIG[secondary] ? secondary : dominant) as PersonalityLetter;

  const traits = [
    ...new Set(values.map((v) => ANSWER_TRAIT_LABELS[v]).filter(Boolean)),
  ] as string[];
  const interests = deriveInterestsFromAnswers(values);

  return {
    persona,
    interests,
    employee_no: employeeNoFrom(dominant, userId),
    dept: cfg.dept,
    display_title: cfg.title,
    nickname: `${cfg.nicknamePrefix}${NICK_SUFFIX[suffixKey]}`,
    avatar_url: buildPersonaAvatarUrl(
      cfg.energy,
      dominant,
      `${cfg.nicknamePrefix}${NICK_SUFFIX[suffixKey]}`,
      userId,
    ),
    energy_level: cfg.energy,
    dominant_type: dominant,
    secondary_type: secondary,
    work_style: cfg.work_style,
    social_style: cfg.social_style,
    lunch_preference: cfg.lunch_preference,
    support_preference: cfg.support_preference,
    traits,
    answer_snapshot: answers,
  };
}

/** 从已有人格面具名称反推主导类型（历史数据回填） */
export function inferDominantFromPersonaName(name: string): PersonalityLetter {
  if (name.includes(' E ') || name.startsWith('社交 E')) return 'E';
  if (name.includes(' P ') || name.startsWith('玩梗 P')) return 'P';
  if (name.includes(' S ') || name.startsWith('踏实 S')) return 'S';
  if (name.includes(' N ') || name.startsWith('观察 N')) return 'N';
  return 'I';
}
