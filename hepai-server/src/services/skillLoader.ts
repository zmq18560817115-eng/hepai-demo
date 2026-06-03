import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  loadGuidelineChunks,
  loadGuidelineManifest,
} from './enterpriseGuidelines.js';

const SKILL_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../skills/ai-hr-onboarding',
);

export interface AiHrSkillManifest {
  name: string;
  display_name: string;
  version: string;
  source_desktop: string;
  philosophy: string[];
  welcome: Record<string, string>;
  suggestions: Record<string, string[]>;
  first_week_roadmap: { phase: string; tasks: string[] }[];
  reference_files: string[];
}

let cachedManifest: AiHrSkillManifest | null = null;
let cachedPromptCore: string | null = null;

function readUtf8(relativePath: string, maxChars?: number): string {
  const full = path.join(SKILL_DIR, relativePath);
  if (!fs.existsSync(full)) return '';
  let text = fs.readFileSync(full, 'utf8');
  if (relativePath === 'SKILL.md') {
    text = text.replace(/^---[\s\S]*?---\n*/, '');
  }
  if (maxChars && text.length > maxChars) {
    return `${text.slice(0, maxChars)}\n\n[…Skill 正文已截断，完整版见 skills/ai-hr-onboarding/]`;
  }
  return text;
}

export function getSkillDir(): string {
  return SKILL_DIR;
}

const FALLBACK_MANIFEST: AiHrSkillManifest = {
  name: 'ai-hr-onboarding',
  display_name: '新人 AI HR 交流基础',
  version: '1.0.0',
  source_desktop: 'skills/ai-hr-onboarding',
  philosophy: [
    'Learn by Doing',
    'Work Smart not Hard',
    '目标是穿越沼泽，不是对付每一条鳄鱼',
  ],
  welcome: {
    newcomer:
      '你好，我是企业 AI HR 助手。建议先完成「入职盲盒」8 题人格测试；也可直接问：面具是什么、焦虑怎么办、如何蹭饭、怎么联系导师。',
    mentor: '你好，我是 AI HR 助手（导师版），可协助理解新人面具与带教话术。',
    hr: '你好，我是 AI HR 运营助手，可解读融入看板与风险告警。',
  },
  suggestions: {
    newcomer: [
      '人格面具是什么？和 8 题测试有什么关系？',
      '入职第一周很焦虑怎么办？',
      '情绪能量很低时可以做些什么？',
      '如何用蹭饭地图找饭搭子？',
      '怎么联系导师才不尴尬？',
    ],
    mentor: ['如何根据面具标签理解新人？', '新人能量连续偏低该怎么沟通？'],
    hr: ['如何解读本批次融入指数？', '待关注新人名单如何优先干预？'],
  },
  first_week_roadmap: [
    { phase: '第 1 天', tasks: ['完成 8 题人格测试', '浏览安全屋'] },
    { phase: '第 1 周', tasks: ['尝试午餐匹配', '按能量调整社交强度'] },
  ],
  reference_files: ['SKILL.md'],
};

export function loadSkillManifest(): AiHrSkillManifest {
  if (cachedManifest) return cachedManifest;
  const manifestPath = path.join(SKILL_DIR, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.warn(`AI HR Skill manifest 缺失，使用内置配置: ${manifestPath}`);
    cachedManifest = FALLBACK_MANIFEST;
    return cachedManifest;
  }
  cachedManifest = JSON.parse(
    fs.readFileSync(manifestPath, 'utf8'),
  ) as AiHrSkillManifest;
  return cachedManifest;
}

/** 供 Gemini / mock 使用的 Skill 知识核（桌面 ai-native-onboarding + 和拍手册） */
export function buildSkillKnowledgeCore(): string {
  if (cachedPromptCore) return cachedPromptCore;

  const manifest = loadSkillManifest();
  const skillBody = readUtf8('SKILL.md', 3500);
  const hepaiPlaybook = readUtf8('references/hepai-newcomer-playbook.md', 2500);
  const problemFramework = readUtf8(
    'references/problem_solving_framework.md',
    1200,
  );

  let guidelinesNote = '';
  try {
    const gm = loadGuidelineManifest();
    const count = loadGuidelineChunks().length;
    if (count > 0) {
      guidelinesNote = [
        '',
        '## 企业管理准则（制度层 · 与和拍 Skill 整合）',
        `已挂载 ${gm.display_name} v${gm.version}，共 ${count} 个可检索条款。`,
        gm.answer_policy,
        '制度/流程/请假/报销/绩效/保密类问题必须引用准则原文，并与和拍融入能力区分说明。',
      ].join('\n');
    }
  } catch {
    guidelinesNote = '';
  }

  cachedPromptCore = [
    `# Agent Skill: ${manifest.name}`,
    manifest.display_name,
    '',
    '## 核心理念',
    manifest.philosophy.map((p) => `- ${p}`).join('\n'),
    '',
    '## 桌面 Skill 正文（ai-native-onboarding）',
    skillBody,
    '',
    '## 和拍新人交流手册',
    hepaiPlaybook,
    '',
    '## 问题解决框架（节选）',
    problemFramework,
    guidelinesNote,
  ].join('\n');

  return cachedPromptCore;
}

export function getSkillMetaForRole(role: string) {
  const m = loadSkillManifest();
  const r = role === 'mentor' || role === 'hr' ? role : 'newcomer';
  let guidelines: {
    name: string;
    version: string;
    chunk_count: number;
  } | null = null;
  try {
    const gm = loadGuidelineManifest();
    guidelines = {
      name: gm.name,
      version: gm.version,
      chunk_count: loadGuidelineChunks().length,
    };
  } catch {
    guidelines = null;
  }
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
    skill_dir: SKILL_DIR,
    enterprise_guidelines: guidelines,
    integrated_skills: guidelines
      ? [m.name, guidelines.name]
      : [m.name],
  };
}

export function buildRoleSystemPrompt(
  role: string,
  personaBlock: string,
): string {
  const core = buildSkillKnowledgeCore();
  const roleGuide: Record<string, string> = {
    newcomer: `你是「和拍」企业 AI HR。制度/流程类问题必须以《企业管理准则》为准并标注引用条款；融入/面具/午餐/情绪类结合和拍 Skill。语气温暖、可执行，每次 120～280 字。未完成 8 题时仅在相关时引导盲盒。`,
    mentor: `你是「和拍」AI HR 导师版。制度问题引用企业管理准则；带教场景结合 ai-hr-onboarding 与带教准则。不泄露盲盒原始答案。`,
    hr: `你是「和拍」AI HR 运营版。解读融入数据时引用运营 Skill；涉及劳动制度、合规流程时引用企业管理准则。`,
  };
  const guide = roleGuide[role] ?? roleGuide.newcomer;

  return `${core}\n\n---\n\n## 当前用户上下文\n${personaBlock}\n\n## 你的角色\n${guide}`;
}
