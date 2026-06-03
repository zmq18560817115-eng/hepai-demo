/**
 * 与后端 employeeProfile.ts 一致的盲盒 → 员工档案映射（Mock 模式使用）
 */
import type { EmployeeProfileDto, PersonaDto } from '../api/types';
import { buildPersonaAvatarUrlForEmployee } from './personaAvatar';

type Letter = 'I' | 'E' | 'P' | 'S' | 'N';

const CFG: Record<
  Letter,
  {
    dept: string;
    prefix: string;
    title: string;
    energy: number;
    seed: string;
    work_style: string;
    social_style: string;
    lunch_preference: string;
    support_preference: string;
  }
> = {
  I: {
    dept: '内容创作部门',
    prefix: '内容',
    title: '内容创作专员',
    energy: 72,
    seed: 'hepai-i',
    work_style: '深度专注 · 文档驱动',
    social_style: '低打扰 · 异步沟通优先',
    lunch_preference: '独食快充 · 错峰用餐',
    support_preference: '清晰文档与自学路径',
  },
  E: {
    dept: '账号运营部门',
    prefix: '运营',
    title: '账号运营专员',
    energy: 58,
    seed: 'hepai-e',
    work_style: '快速协同 · 面对面推进',
    social_style: '饭局破冰 · 主动链接',
    lunch_preference: '拼桌社交 · 午餐破冰',
    support_preference: '团队介绍与饭局带教',
  },
  N: {
    dept: '数据分析部门',
    prefix: '数据',
    title: '数据分析专员',
    energy: 65,
    seed: 'hepai-n',
    work_style: '先谋后动 · 信息敏感',
    social_style: '观察入场 · 会后跟进',
    lunch_preference: '灵活错峰 · 轻量交流',
    support_preference: '目标对齐与节奏反馈',
  },
  S: {
    dept: '商务市场部门',
    prefix: '商务',
    title: '商务市场专员',
    energy: 55,
    seed: 'hepai-s',
    work_style: '步骤清晰 · 稳定交付',
    social_style: '小圈深交 · 靠谱搭子',
    lunch_preference: '固定饭搭 · 稳定节奏',
    support_preference: '稳定带教节奏与阶段反馈',
  },
  P: {
    dept: '职能部门',
    prefix: '职能',
    title: '职能协作专员',
    energy: 80,
    seed: 'hepai-p',
    work_style: '灵感快闪 · 群聊协作',
    social_style: '表情包外交 · 轻松求助',
    lunch_preference: '看心情拼桌 · 轻量社交',
    support_preference: '灵活答疑与轻量检查点',
  },
};

const SUFFIX: Record<Letter, string> = {
  I: '小智',
  E: '阿凯',
  N: '小鹿',
  S: 'Lily',
  P: '小周',
};

function tally(values: string[]) {
  const counts: Record<string, number> = {};
  for (const v of values) {
    if (CFG[v as Letter]) counts[v] = (counts[v] ?? 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const dominant = (sorted[0]?.[0] ?? 'I') as Letter;
  const secondary = (sorted[1]?.[0] ?? null) as Letter | null;
  return { dominant, secondary };
}

const HOBBY_BY_LETTER: Record<Letter, string[]> = {
  I: ['阅读', '观影', '咖啡'],
  E: ['健身', '聚餐', '桌游'],
  N: ['CityWalk', '摄影', '播客'],
  S: ['徒步', '下厨', '园艺'],
  P: ['手游', 'Livehouse', '汉服'],
};

export const ANSWER_TRAIT_LABELS: Record<string, string> = {
  I: '偏好独处恢复',
  E: '偏好面对面交流',
  P: '偏好轻量群聊求助',
  S: '偏好小圈稳定社交',
  N: '偏好错峰与观察',
};

export function inferDominantFromPersonaName(name: string): Letter {
  if (name.includes(' E ') || name.startsWith('社交 E')) return 'E';
  if (name.includes(' P ') || name.startsWith('玩梗 P')) return 'P';
  if (name.includes(' S ') || name.startsWith('踏实 S')) return 'S';
  if (name.includes(' N ') || name.startsWith('观察 N')) return 'N';
  return 'I';
}

function deriveInterestsFromAnswers(values: string[]): string[] {
  const set = new Set<string>();
  for (const v of values) {
    const list = HOBBY_BY_LETTER[v as Letter];
    if (list) list.forEach((h) => set.add(h));
  }
  return [...set].slice(0, 8);
}

export function derivePersonalityPatchFromAnswers(values: string[]) {
  const { dominant, secondary } = tally(values);
  const cfg = CFG[dominant];
  const traits = [
    ...new Set(values.map((v) => ANSWER_TRAIT_LABELS[v]).filter(Boolean)),
  ] as string[];
  const tags =
    traits.length > 0
      ? traits.slice(0, 6)
      : cfg.social_style.split(' · ').filter(Boolean);
  return {
    dominant,
    secondary,
    tags,
    traits,
    interests: deriveInterestsFromAnswers(values),
    work_style: cfg.work_style,
    social_style: cfg.social_style,
    lunch_preference: cfg.lunch_preference,
    support_preference: cfg.support_preference,
  };
}

/** Mock：8 题仅更新性格标签，不更换角色名/昵称/部门 */
export function applyQuizPersonalityOnlyMock(
  persona: PersonaDto,
  employee: EmployeeProfileDto,
  values: string[],
  userId: string,
): {
  persona: PersonaDto;
  employee: EmployeeProfileDto;
  energy: number;
} {
  const patch = derivePersonalityPatchFromAnswers(values);
  const headDominant = inferDominantFromPersonaName(persona.name);
  const energy = employee.energy_level ?? 75;
  return {
    persona: { ...persona, tags: patch.tags },
    employee: {
      ...employee,
      nickname: employee.nickname,
      dept: employee.dept,
      display_title: employee.display_title,
      dominant_type: headDominant,
      secondary_type: patch.secondary,
      work_style: patch.work_style,
      social_style: patch.social_style,
      lunch_preference: patch.lunch_preference,
      support_preference: patch.support_preference,
      traits: patch.traits,
      interests: patch.interests,
      avatar_url: buildPersonaAvatarUrlForEmployee(
        energy,
        headDominant,
        persona.name,
        userId,
      ),
    },
    energy,
  };
}

export function buildPendingNewcomerEmployee(
  userId: string,
  username: string,
  nickname: string,
  dept: string,
): EmployeeProfileDto {
  return {
    employee_no: username,
    dept,
    display_title: `${dept.replace('部门', '')}新人`,
    nickname,
    avatar_url: buildPersonaAvatarUrlForEmployee(75, 'I', null, userId),
    energy_level: 75,
    dominant_type: 'I',
    work_style: '待完成人格测试',
    social_style: '待完成人格测试',
    lunch_preference: '待完成人格测试',
    support_preference: '待完成人格测试',
    traits: [],
    interests: [],
  };
}

export function buildDefaultNewcomerEmployee(
  userId: string,
  personaName: string,
  nickname: string,
): EmployeeProfileDto {
  const dominant = inferDominantFromPersonaName(personaName);
  const cfg = CFG[dominant];
  const prefixNo: Record<Letter, string> = {
    I: 'NC',
    E: 'NO',
    N: 'ND',
    S: 'NB',
    P: 'NF',
  };
  const tail = userId.replace(/\D/g, '').slice(-4).padStart(4, '0') || '0001';
  return {
    employee_no: `${prefixNo[dominant]}${tail}`,
    dept: cfg.dept,
    display_title: cfg.title,
    nickname,
    avatar_url: buildPersonaAvatarUrlForEmployee(
      cfg.energy,
      dominant,
      nickname,
      userId,
    ),
    energy_level: cfg.energy,
    dominant_type: dominant,
    work_style: cfg.work_style,
    social_style: cfg.social_style,
    lunch_preference: cfg.lunch_preference,
    support_preference: cfg.support_preference,
    traits: [],
    interests: HOBBY_BY_LETTER[dominant],
  };
}

export function buildMockEmployeeFromAnswers(
  values: string[],
  userId = 'mock',
): EmployeeProfileDto {
  const { dominant, secondary } = tally(values);
  const cfg = CFG[dominant];
  const suffixKey = (secondary && CFG[secondary] ? secondary : dominant) as Letter;
  const prefixNo: Record<Letter, string> = {
    I: 'NC',
    E: 'NO',
    N: 'ND',
    S: 'NB',
    P: 'NF',
  };
  return {
    employee_no: `${prefixNo[dominant]}0001`,
    dept: cfg.dept,
    display_title: cfg.title,
    nickname: `${cfg.prefix}${SUFFIX[suffixKey]}`,
    avatar_url: buildPersonaAvatarUrlForEmployee(
      cfg.energy,
      dominant,
      `${cfg.prefix}${SUFFIX[suffixKey]}`,
      userId,
    ),
    energy_level: cfg.energy,
    dominant_type: dominant,
    work_style: cfg.work_style,
    social_style: cfg.social_style,
    lunch_preference: cfg.lunch_preference,
    support_preference: cfg.support_preference,
    traits: [...new Set(values)].map((v) => {
      const labels: Record<string, string> = {
        I: '偏好独处恢复',
        E: '偏好面对面交流',
        P: '偏好轻量群聊求助',
        S: '偏好小圈稳定社交',
        N: '偏好错峰与观察',
      };
      return labels[v] ?? v;
    }),
  };
}
