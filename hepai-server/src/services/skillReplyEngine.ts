import { getSkillMetaForRole, loadSkillManifest } from './skillLoader.js';
import { loadOrgContext, tryDirectAnswer } from './aiHrKnowledge.js';
import type { UserContext } from './userContext.js';

export interface ExtendedUserContext {
  mood_log_count: number;
  latest_mood_text: string | null;
  lunch_status: string | null;
  lunch_code: string | null;
  mentor_names: string[];
  ai_message_count: number;
  quiz_question_count: number;
}

interface ReplyCtx {
  nickname: string;
  role: string;
  onboarding_completed: boolean;
  persona_name: string | null;
  persona_tags: string[];
  energy_level: number;
  days_left: number;
}

type Topic =
  | 'mask'
  | 'anxiety'
  | 'lunch'
  | 'mentor'
  | 'mood'
  | 'roadmap'
  | 'dept'
  | 'privacy'
  | 'platform'
  | 'five_step'
  | 'blindbox_nudge'
  | 'general';

function detectTopic(message: string): Topic | null {
  const m = message.trim();
  if (/部门.*(几|多少|几个|几位|几人)|多少人|有几个|有几位|有几人|几个人|团队.*(几|多少)|同事.*(多少|几个)|咱们.*(几|多少)/.test(m)) {
    return 'dept';
  }
  if (/哪个部门|什么部门|我.*部门|所属部门/.test(m)) return 'dept';
  if (/隐私|泄露|匿名|真实.*(名字|姓名|花名)/.test(m)) return 'privacy';
  if (/怎么用|如何使用|和拍.*(是什么|能干)|功能|入口/.test(m)) return 'platform';
  if (/面具|盲盒|人格|测试|解锁|8题|八道题/.test(m)) return 'mask';
  if (/焦虑|紧张|害怕|社恐|不敢|压力|慌/.test(m)) return 'anxiety';
  if (/午餐|吃饭|蹭饭|饭搭子|匹配|食堂/.test(m)) return 'lunch';
  if (/导师|带教|老师|打扰|请教/.test(m)) return 'mentor';
  if (/情绪|能量|低落|累|闪光|心情/.test(m)) return 'mood';
  if (/首周|第一周|融入路线|入职.*(流程|怎么办)/.test(m)) return 'roadmap';
  if (/入职|适应|第一天/.test(m)) return 'roadmap';
  if (/五步法|伪需求|瞎忙|沼泽/.test(m)) return 'five_step';
  return null;
}

function hashPick(seed: string, n: number): number {
  return Math.abs(seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % n;
}

function philosophyLine(message: string): string {
  const manifest = loadSkillManifest();
  const line = manifest.philosophy[hashPick(message, manifest.philosophy.length)];
  return `（${line}）`;
}

function buildContextualFallback(
  message: string,
  ctx: ReplyCtx,
  userId: string,
  ext: ExtendedUserContext,
): { reply: string; source: string; topic: string } {
  const org = loadOrgContext(userId);
  const snippet = message.slice(0, 40);
  return {
    reply: `【和拍 AI HR】${ctx.nickname}，关于「${snippet}${message.length > 40 ? '…' : ''}」：我这边能结合你的数据回答——你在「${org.my_dept}」（本部门新人 ${org.dept_newcomer_count} 人）、面具「${ctx.persona_name ?? '待完成盲盒'}」、能量 ${ctx.energy_level}%、导师 ${ext.mentor_names.join('、') || '待分配'}。\n\n你可以直接问：部门有几个人、焦虑怎么办、怎么蹭饭、怎么联系导师、面具是什么。${philosophyLine(message)}`,
    source: 'skill-contextual',
    topic: 'general',
  };
}

export function generateSkillReply(
  message: string,
  role: string,
  ctx: ReplyCtx,
  ext: ExtendedUserContext,
  userId?: string,
): { reply: string; source: string; topic: string } {
  const uid = userId ?? '';
  const userCtx: UserContext = {
    nickname: ctx.nickname,
    role: ctx.role,
    onboarding_completed: ctx.onboarding_completed,
    persona_name: ctx.persona_name,
    persona_tags: ctx.persona_tags,
    energy_level: ctx.energy_level,
    days_left: ctx.days_left,
  };

  if (uid) {
    const direct = tryDirectAnswer(message, uid, userCtx, ext);
    if (direct) return direct;
  }

  const n = ctx.nickname;
  let topic = detectTopic(message) ?? 'general';

  if (
    !ctx.onboarding_completed &&
    topic === 'general' &&
    /^(你好|hi|哈喽|在吗|帮助|开始|怎么用)$/i.test(message.trim())
  ) {
    topic = 'blindbox_nudge';
  }

  const tagHint =
    ctx.persona_tags.length > 0
      ? ctx.persona_tags.slice(0, 2).join('、')
      : '待测试生成';
  const mentorHint =
    ext.mentor_names.length > 0 ? ext.mentor_names.join('、') : '你的带教导师';
  const lunchHint =
    ext.lunch_status === 'matched'
      ? `你已有匹配记录，暗号 ${ext.lunch_code ?? '见蹭饭页'}`
      : ext.lunch_status === 'pending'
        ? '你的午餐匹配正在进行中'
        : '尚未发起匹配，可在蹭饭地图一键求配子';
  const moodHint =
    ext.mood_log_count > 0
      ? `已记录 ${ext.mood_log_count} 条情绪日志${ext.latest_mood_text ? `，最近：「${ext.latest_mood_text.slice(0, 24)}」` : ''}`
      : '尚未记录闪光时刻，建议在安全屋写一条';

  const org = uid ? loadOrgContext(uid) : null;

  const replies: Record<Topic, string[]> = {
    dept: [
      `【部门】${n}，所属「${org?.my_dept ?? '待 HR 分配'}」，和拍登记本部门新人 ${org?.dept_newcomer_count ?? '—'} 人。`,
    ],
    privacy: [
      `【隐私】${n}，和拍只展示面具称号，不公开盲盒原始答案；情绪数据不对同事全员可见。`,
    ],
    platform: [
      `【功能入口】${n}：盲盒 → 安全屋 → 蹭饭地图 → 导师私信；有问题继续在本对话问我。`,
    ],
    mask: [
      `【人格面具】${n}，8 题在「入职盲盒」。面具是外显互动偏好，不是好坏评判；真实性格保护约 30 天。${ctx.persona_name ? `你已完成，当前面具「${ctx.persona_name}」。` : '你尚未完成，建议今天先做完 8 题。'}`,
      `【Skill 解读】面具由 8 题生成名称、标签与格言。${ctx.persona_name ? `你的面具「${ctx.persona_name}」，标签 ${tagHint}。` : '完成后安全屋与 AI 对话都会读取同一份数据。'}`,
    ],
    anxiety: [
      `【入职焦虑】${n}，这很常见。你能量 ${ctx.energy_level}%，${moodHint}。\n\n建议：① 先完成可控小事 ② 安全屋记闪光 ③ 能量够再轻量蹭饭或问候导师，不必硬撑。`,
      `【减压】${n}，和拍不考核社交 KPI。当前 ${ctx.energy_level}%${ctx.energy_level < 50 ? '，优先休息与小任务' : '，可尝试约绿灯导师'}。${philosophyLine(message)}`,
    ],
    lunch: [
      `【午餐匹配】${n}，${lunchHint}。在「蹭饭地图」按面具标签匹配，见面用暗号、仅展示虚拟称号。`,
    ],
    mentor: [
      `【导师】${n}，你的带教：${mentorHint}。先看状态灯再联系：「有个 5 分钟问题，您方便吗？」`,
    ],
    mood: [
      `【情绪能量】${n}，${moodHint}。当前 ${ctx.energy_level}%，可在安全屋调整能量或记闪光。`,
    ],
    roadmap: [
      (() => {
        const roadmap = getSkillMetaForRole('newcomer').first_week_roadmap
          .map((r) => `${r.phase}：${r.tasks.join('；')}`)
          .join('\n');
        return `【首周路线】${n}：\n${roadmap}\n\n保护期剩余约 ${ctx.days_left} 天。${ctx.onboarding_completed ? `面具「${ctx.persona_name}」已就绪。` : '请先完成盲盒 8 题。'}`;
      })(),
    ],
    five_step: [
      `【五步法】${n}：1 质疑是否必须做 2 删冗余 3 简化 4 小步验证 5 再求助。和拍帮你过滤「必须社交」的伪需求。`,
    ],
    blindbox_nudge: [
      `【引导】${n}，请先完成「入职盲盒」8 题解锁面具，之后我能结合你的部门与能量数据更精准回答。`,
    ],
    general: [],
  };

  if (role === 'mentor') {
    const mentorReplies = [
      `【带教版】${n}，只向你看新人面具标签与能量区间，不看盲盒原始答案。沟通建议：观察式开场、一次一事、可拒绝。`,
    ];
    return {
      reply: mentorReplies[0],
      source: 'skill-mentor',
      topic: 'mentor',
    };
  }

  if (role === 'hr') {
    return {
      reply: `【HR 版】${n}，优先处理红色告警，再看黄色关注与批次融入指数；午餐成功率异常时检查时段与标签策略。`,
      source: 'skill-hr',
      topic: 'hr',
    };
  }

  if (topic === 'general' && uid) {
    return buildContextualFallback(message, ctx, uid, ext);
  }

  const pool = replies[topic];
  const reply =
    pool.length > 0
      ? pool[hashPick(message + String(ext.ai_message_count), pool.length)]
      : buildContextualFallback(message, ctx, uid, ext).reply;

  let finalReply = reply;
  if (!ctx.onboarding_completed && topic !== 'mask' && topic !== 'blindbox_nudge') {
    finalReply += `\n\n💡 完成「入职盲盒」8 题后，我会结合你的面具与部门数据继续优化建议。`;
  }

  return { reply: finalReply, source: `skill-${topic}`, topic };
}
