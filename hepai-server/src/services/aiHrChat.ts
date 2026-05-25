import { GoogleGenAI } from '@google/genai';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/index.js';

interface UserContext {
  nickname: string;
  role: string;
  onboarding_completed: boolean;
  persona_name: string | null;
  persona_tags: string[];
  energy_level: number;
  days_left: number;
}

function loadUserContext(userId: string): UserContext {
  const db = getDb();
  const u = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as Record<
    string,
    unknown
  >;
  const p = db
    .prepare(`SELECT name, tags FROM personas WHERE user_id = ?`)
    .get(userId) as { name: string; tags: string } | undefined;
  const snap = db
    .prepare(`SELECT energy_level FROM user_energy_snapshot WHERE user_id = ?`)
    .get(userId) as { energy_level: number } | undefined;

  let daysLeft = 30;
  if (u?.onboarding_date) {
    const row = db
      .prepare(
        `SELECT CAST(julianday('now') - julianday(?) AS INTEGER) as d`,
      )
      .get(u.onboarding_date) as { d: number };
    daysLeft = Math.max(0, 30 - (row?.d ?? 0));
  }

  return {
    nickname: String(u?.nickname ?? '同事'),
    role: String(u?.role ?? 'newcomer'),
    onboarding_completed: Boolean(u?.onboarding_completed),
    persona_name: p?.name ?? null,
    persona_tags: p?.tags ? JSON.parse(p.tags) : [],
    energy_level: snap?.energy_level ?? 75,
    days_left: daysLeft,
  };
}

function buildSystemPrompt(role: string, ctx: UserContext): string {
  const personaBlock = ctx.persona_name
    ? `当前用户面具：${ctx.persona_name}，标签：${ctx.persona_tags.join('、')}。能量 ${ctx.energy_level}%，入职剩余约 ${ctx.days_left} 天。`
    : `用户尚未完成入职人格测试，请引导其先完成盲盒解锁面具。`;

  const base: Record<string, string> = {
    newcomer: `你是「和拍」企业 AI HR 助手，服务新员工。语气温暖、具体、可执行。
${personaBlock}
可解答：人格面具、社交焦虑、情绪能量、午餐匹配、导师沟通。每次回复 80～200 字，可分点。不透露他人隐私。`,
    mentor: `你是「和拍」AI HR 助手，服务带教导师。${personaBlock}
帮助理解面具标签、识别风险、沟通话术。不泄露盲盒原始答案。`,
    hr: `你是「和拍」AI HR 数据助手，服务 HR。可解读融入指数、情绪趋势、风险告警、干预策略。`,
  };
  return base[role] ?? base.newcomer;
}

function pickKeywordReply(
  message: string,
  role: string,
  ctx: UserContext,
): string | null {
  const m = message.toLowerCase();
  const n = ctx.nickname;

  if (role === 'newcomer') {
    if (!ctx.onboarding_completed || /面具|盲盒|人格|测试|解锁/.test(message)) {
      return `【人格面具说明】${n}，入职人格测试共 8 道题，在「入职盲盒」里完成。系统会根据你的选择生成对外展示的「人格面具」（不是评判你好坏），真实性格受保护约 30 天。\n\n完成后你会得到专属面具名、标签和职场格言，安全屋会自动同步。现在若还没做完，请先在左侧完成盲盒；做完后我可以结合你的面具给更贴身的建议。`;
    }
    if (/焦虑|紧张|害怕|社恐|不敢/.test(message)) {
      return `我理解这种感受，${n}。入职前两周的焦虑很常见。\n\n你可以：① 用面具标签对外互动，降低「被看穿」的压力；② 能量低时去安全屋记一条闪光小事；③ 用「蹭饭地图」轻量匹配，不必强行社交。\n\n你当前能量约 ${ctx.energy_level}%，${ctx.energy_level < 50 ? '建议优先做一件 5 分钟就能完成的小事，再考虑约饭' : '状态尚可，可以选一位状态为「可打扰」的导师发一句简短问候'}。`;
    }
    if (/午餐|吃饭|蹭饭|饭搭子|匹配/.test(message)) {
      return `午餐匹配是为新人设计的低压力社交：\n\n① 在「蹭饭地图」发起匹配，系统按你的面具标签 ${ctx.persona_tags.length ? `（${ctx.persona_tags.slice(0, 2).join('、')}）` : ''} 找氛围相近的人；② 见面只用暗号，不见真实花名；③ 线下觉得投缘再申请解锁。\n\n通常 2～5 分钟会有结果，别把它当成「必须社交」的任务。`;
    }
    if (/导师|带教|老师|打扰/.test(message)) {
      return `联系导师前建议先看状态灯：绿色「可打扰」再发消息。\n\n话术示例：「老师您好，我是新来的 ${n}，有个小问题想请教您 5 分钟，您现在方便吗？」\n\n你已在系统里分配了主导师和项目导师，在「带教导师」页可查看。记住：简短、具体、尊重对方状态，比长篇汇报更轻松。`;
    }
    if (/情绪|能量|低落|累|闪光/.test(message)) {
      return `你现在的情绪能量约 ${ctx.energy_level}%。\n\n${ctx.energy_level < 50 ? '偏低时不必硬撑：可先记录「今日闪光」——哪怕只是「按时吃了早饭」；或发起午餐匹配换个场景。' : '状态不错，可以记录一条闪光时刻积累「情绪资产」，或主动约一次轻量午餐。'}\n\n平台不会把你的能量数据公开给同事，只有你和授权导师/HR 策略可见聚合信息。`;
    }
    if (/面具|标签|格言|人格/.test(message) && ctx.persona_name) {
      return `你当前的面具是「${ctx.persona_name}」，外显标签：${ctx.persona_tags.join('、')}。\n\n面具的作用：让同事了解你的「互动偏好」，而不是评判性格好坏。前 30 天你可以用面具社交，逐步建立信任后再选择是否展示更多真实一面。\n\n若你觉得标签不够贴切，完成更多互动后系统会建议微调（正式版功能）。`;
    }
    if (/入职|流程|第一天|适应/.test(message)) {
      return `给 ${n} 一个轻量入职节奏建议：\n\n**第 1 天**：完成人格测试 + 浏览安全屋\n**第 2～3 天**：记一条闪光、看导师状态\n**第 1 周**：尝试 1 次午餐匹配\n\n不必一次做完，按能量来。你还有约 ${ctx.days_left} 天的「新人保护期」，平台设计就是让你慢一点、稳一点融入。`;
    }
  }

  if (role === 'hr' && /风险|告警|关注|干预/.test(message)) {
    return `建议干预优先级：\n① 能量 < 50 且 3 天未更新 → 导师 48h 内非正式问候\n② 红色告警 → HRBP 推送 + 批次复盘\n③ 午餐匹配成功率 < 70% → 检查食堂时段与标签匹配策略\n\n可在「HR 数智看板」查看批次柱图与实时告警，使用「推送关怀」按钮记录干预。`;
  }

  if (role === 'mentor' && /沟通|话术|关注/.test(message)) {
    return `与新人沟通建议：\n① 开场用观察而非评判：「我注意到你最近…」\n② 一次只谈一个具体小事\n③ 能量低时提供「可拒绝」的选项\n\n系统只向你展示面具标签与能量区间，不展示人格测试原始答案，保护新人隐私。`;
  }

  return null;
}

const FALLBACK_POOL: Record<string, string[]> = {
  newcomer: [
    '谢谢你的提问。作为新人助手，我建议把问题说具体一点，例如「午餐怎么匹配」「面具是什么」「能量低怎么办」，我会结合你的数据回答。',
    '收到。你可在安全屋查看面具与能量，在蹭饭地图尝试匹配，或问我某一位导师是否适合现在联系。',
    '每个人都有适合自己的融入节奏。你完成人格测试后，我能根据你的面具标签给出更贴身的建议。',
    '如果想减压，试试：完成一件 5 分钟小任务 → 记闪光 → 再考虑轻量社交。一步一步来就好。',
    '平台里的「人格面具」是为了降低社交压力，不是考试。有困惑可以继续问我。',
  ],
  mentor: [
    '如需具体建议，可说明是哪位新人、什么场景，我会从面具与能量角度帮你准备沟通要点。',
    '关注能量趋势比单次分数更重要，连续偏低建议轻量问候而非问责。',
  ],
  hr: [
    '可从看板查看批次融入指数与告警列表，如需我帮你解读某条指标，请直接说出指标名称。',
    '干预建议：先处理红色告警，再跟进黄色关注，并记录 HRBP 推送结果。',
  ],
};

function smartMockReply(
  userId: string,
  role: string,
  message: string,
): string {
  const ctx = loadUserContext(userId);
  const keyword = pickKeywordReply(message, role, ctx);
  if (keyword) return keyword;

  const pool = FALLBACK_POOL[role] ?? FALLBACK_POOL.newcomer;
  const idx =
    Math.abs(message.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) %
    pool.length;
  let reply = pool[idx];

  if (ctx.persona_name && role === 'newcomer') {
    reply += `\n\n（已读取你的面具「${ctx.persona_name}」，能量 ${ctx.energy_level}%）`;
  }
  return reply;
}

async function geminiReply(
  role: string,
  ctx: UserContext,
  history: { role: string; content: string }[],
  userMessage: string,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.length < 10) {
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const contents = [
      ...history
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-12)
        .map((m) => ({
          role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
          parts: [{ text: m.content }],
        })),
      { role: 'user' as const, parts: [{ text: userMessage }] },
    ];

    const res = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        systemInstruction: buildSystemPrompt(role, ctx),
        temperature: 0.85,
        maxOutputTokens: 512,
      },
    });
    const text = res.text?.trim();
    return text && text.length > 5 ? text : null;
  } catch (e) {
    console.error('Gemini error:', e);
    return null;
  }
}

export async function generateAiHrResponse(
  userId: string,
  role: string,
  userMessage: string,
): Promise<string> {
  const db = getDb();
  const ctx = loadUserContext(userId);

  let session = db
    .prepare(
      `SELECT id FROM ai_hr_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1`,
    )
    .get(userId) as { id: string } | undefined;

  if (!session) {
    const sid = uuid();
    db.prepare(
      `INSERT INTO ai_hr_sessions (id, user_id, title) VALUES (?, ?, ?)`,
    ).run(sid, userId, '企业 AI HR 对话');
    session = { id: sid };
  }

  const history = db
    .prepare(
      `SELECT role, content FROM ai_hr_messages WHERE session_id = ? ORDER BY created_at ASC`,
    )
    .all(session.id) as { role: string; content: string }[];

  db.prepare(
    `INSERT INTO ai_hr_messages (id, session_id, role, content) VALUES (?, ?, 'user', ?)`,
  ).run(uuid(), session.id, userMessage);

  const reply =
    (await geminiReply(role, ctx, history, userMessage)) ??
    smartMockReply(userId, role, userMessage);

  db.prepare(
    `INSERT INTO ai_hr_messages (id, session_id, role, content) VALUES (?, ?, 'assistant', ?)`,
  ).run(uuid(), session.id, reply);

  db.prepare(
    `UPDATE ai_hr_sessions SET updated_at = datetime('now') WHERE id = ?`,
  ).run(session.id);

  return reply;
}

export function getAiHrHistory(userId: string) {
  const db = getDb();
  const session = db
    .prepare(
      `SELECT id, title, created_at FROM ai_hr_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1`,
    )
    .get(userId) as { id: string; title: string; created_at: string } | undefined;

  if (!session) {
    return {
      session_id: null,
      messages: [] as {
        id: string;
        role: string;
        content: string;
        created_at: string;
      }[],
    };
  }

  const messages = db
    .prepare(
      `SELECT id, role, content, created_at FROM ai_hr_messages WHERE session_id = ? AND role != 'system' ORDER BY created_at ASC`,
    )
    .all(session.id) as {
      id: string;
      role: string;
      content: string;
      created_at: string;
    }[];

  return { session_id: session.id, title: session.title, messages };
}
