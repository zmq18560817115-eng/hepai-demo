import { GoogleGenAI } from '@google/genai';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/index.js';
import { buildRoleSystemPrompt, getSkillMetaForRole } from './skillLoader.js';
import { generateSkillReply } from './skillReplyEngine.js';
import { buildLiveDataBlock, loadOrgContext } from './aiHrKnowledge.js';
import {
  buildGuidelinePromptBlock,
  buildGuidelineReply,
  chunksToCitations,
  getGuidelineCatalog,
  isPolicyQuestion,
  searchGuidelines,
  type GuidelineCitation,
} from './enterpriseGuidelines.js';
import {
  loadExtendedContext,
  loadUserContext,
  type UserContext,
} from './userContext.js';

export type AiHrResponsePayload = {
  reply: string;
  source: string;
  topic: string;
  citations: GuidelineCitation[];
  policy_version: string | null;
  integrated_sources: string[];
};

function buildPersonaBlock(ctx: UserContext): string {
  return ctx.persona_name
    ? `当前用户面具：${ctx.persona_name}，标签：${ctx.persona_tags.join('、')}。能量 ${ctx.energy_level}%，入职剩余约 ${ctx.days_left} 天。`
    : `用户尚未完成入职人格测试（onboarding_completed=0），请结合问题回答，仅在相关时引导完成盲盒 8 题。`;
}

function buildSystemPrompt(
  role: string,
  ctx: UserContext,
  userId: string,
  guidelineBlock: string,
): string {
  const ext = loadExtendedContext(userId);
  const org = buildLiveDataBlock(ctx, ext, loadOrgContext(userId));
  const policySection = guidelineBlock
    ? `\n\n${guidelineBlock}\n\n要求：回答制度流程时必须基于上述准则摘录，并注明条款类别；不得编造不存在的审批节点。`
    : '';
  return `${buildRoleSystemPrompt(role, buildPersonaBlock(ctx))}\n\n## 当前用户实时数据（必须优先引用作答，禁止答非所问）\n${org}${policySection}\n\n要求：用户问部门人数、功能、隐私、焦虑、午餐、导师、制度流程等问题时，必须直接回答其问题，不要回复「请说具体」或只报题库条数。`;
}

export function getAiHrSkill(role: string) {
  return getSkillMetaForRole(role);
}

export function getAiHrGuidelines() {
  return getGuidelineCatalog();
}

export function searchAiHrGuidelines(query: string, limit = 6) {
  const results = searchGuidelines(query, limit);
  return {
    query,
    policy_version: getGuidelineCatalog().version,
    results: results.map((r) => ({
      score: r.score,
      citation: chunksToCitations([r])[0],
      chunk_id: r.chunk.id,
    })),
  };
}

function skillAwareReply(
  userId: string,
  role: string,
  message: string,
): { reply: string; source: string; topic: string } {
  const ctx = loadUserContext(userId);
  const ext = loadExtendedContext(userId);
  return generateSkillReply(message, role, ctx, ext, userId);
}

function integratedSources(
  source: string,
  hasGuidelines: boolean,
): string[] {
  const list = ['ai-hr-onboarding'];
  if (hasGuidelines || source.startsWith('enterprise')) {
    list.push('enterprise-management-guidelines');
  }
  if (source.includes('gemini')) list.push('gemini');
  return [...new Set(list)];
}

async function geminiReply(
  userId: string,
  role: string,
  ctx: UserContext,
  history: { role: string; content: string }[],
  userMessage: string,
  guidelineBlock: string,
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

    const res = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
        config: {
          systemInstruction: buildSystemPrompt(
            role,
            ctx,
            userId,
            guidelineBlock,
          ),
          temperature: 0.5,
          maxOutputTokens: 680,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini timeout')), 12000),
      ),
    ]);
    const text = res?.text?.trim();
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
): Promise<AiHrResponsePayload> {
  try {
    return await generateAiHrResponseInner(userId, role, userMessage);
  } catch (e) {
    console.error('generateAiHrResponse error:', e);
    const fallback = skillAwareReply(userId, role, userMessage);
    return {
      ...fallback,
      reply: `${fallback.reply}\n\n（系统提示：已切换为本地 Skill 回复，请稍后重试。）`,
      source: 'skill-fallback',
      citations: [],
      policy_version: getGuidelineCatalog().version ?? null,
      integrated_sources: integratedSources('skill-fallback', false),
    };
  }
}

async function generateAiHrResponseInner(
  userId: string,
  role: string,
  userMessage: string,
): Promise<AiHrResponsePayload> {
  const db = getDb();
  const ctx = loadUserContext(userId);
  const catalog = getGuidelineCatalog();
  const policyVersion = catalog.version || null;

  const guidelineHits = searchGuidelines(userMessage, 4);
  const guidelineBlock = buildGuidelinePromptBlock(guidelineHits);
  const citations =
    guidelineHits.length > 0 ? chunksToCitations(guidelineHits) : [];
  const policyQ = isPolicyQuestion(userMessage);

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
    `INSERT INTO ai_hr_messages (id, session_id, role, content, topic) VALUES (?, ?, 'user', ?, ?)`,
  ).run(uuid(), session.id, userMessage, policyQ ? 'policy_question' : 'general');

  const topScore = guidelineHits[0]?.score ?? 0;

  if (policyQ && topScore >= 5) {
    const gReply = buildGuidelineReply(
      userMessage,
      guidelineHits,
      ctx.nickname,
      role,
    );
    db.prepare(
      `INSERT INTO ai_hr_messages
       (id, session_id, role, content, reply_source, topic, policy_version, citations_json, integrated_sources_json)
       VALUES (?, ?, 'assistant', ?, ?, ?, ?, ?, ?)`,
    ).run(
      uuid(),
      session.id,
      gReply.reply,
      gReply.source,
      gReply.topic,
      policyVersion,
      JSON.stringify(citations),
      JSON.stringify(integratedSources(gReply.source, true)),
    );
    db.prepare(
      `UPDATE ai_hr_sessions SET updated_at = datetime('now') WHERE id = ?`,
    ).run(session.id);
    return {
      ...gReply,
      citations,
      policy_version: policyVersion,
      integrated_sources: integratedSources(gReply.source, true),
    };
  }

  const skillResult = skillAwareReply(userId, role, userMessage);
  const preferSkill =
    skillResult.source.startsWith('skill-dept') ||
    skillResult.source.startsWith('skill-privacy') ||
    skillResult.source.startsWith('skill-platform') ||
    (skillResult.topic !== 'general' && !policyQ) ||
    skillResult.source === 'skill-contextual';

  let reply = skillResult.reply;
  let source = skillResult.source;
  let topic = skillResult.topic;
  let replyCitations = citations;

  if (!preferSkill || (policyQ && topScore >= 3)) {
    const gemini = await geminiReply(
      userId,
      role,
      ctx,
      history,
      userMessage,
      guidelineBlock,
    );
    if (gemini && !/请把问题说具体|道题在题库|避免泛泛/.test(gemini)) {
      reply = gemini;
      source = guidelineBlock ? 'gemini+guidelines+skill' : 'gemini+skill';
      if (policyQ) topic = guidelineHits[0]?.chunk.category_id ?? 'policy';
    } else if (policyQ && topScore >= 3) {
      const gReply = buildGuidelineReply(
        userMessage,
        guidelineHits,
        ctx.nickname,
        role,
      );
      reply = gReply.reply;
      source = gReply.source;
      topic = gReply.topic;
      replyCitations = citations;
    }
  } else if (policyQ && topScore >= 3 && skillResult.topic === 'general') {
    const gReply = buildGuidelineReply(
      userMessage,
      guidelineHits,
      ctx.nickname,
      role,
    );
    reply = `${gReply.reply}\n\n---\n\n${skillResult.reply}`;
    source = 'enterprise-guidelines+skill';
    topic = gReply.topic;
    replyCitations = citations;
  }

  db.prepare(
    `INSERT INTO ai_hr_messages
     (id, session_id, role, content, reply_source, topic, policy_version, citations_json, integrated_sources_json)
     VALUES (?, ?, 'assistant', ?, ?, ?, ?, ?, ?)`,
  ).run(
    uuid(),
    session.id,
    reply,
    source,
    topic,
    policyVersion,
    JSON.stringify(replyCitations),
    JSON.stringify(integratedSources(source, replyCitations.length > 0)),
  );

  db.prepare(
    `UPDATE ai_hr_sessions SET updated_at = datetime('now') WHERE id = ?`,
  ).run(session.id);

  return {
    reply,
    source,
    topic,
    citations: replyCitations,
    policy_version: policyVersion,
    integrated_sources: integratedSources(source, replyCitations.length > 0),
  };
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
      message_count: 0,
    };
  }

  const messages = db
    .prepare(
      `SELECT id, role, content, reply_source, topic, policy_version, citations_json, integrated_sources_json, created_at
       FROM ai_hr_messages
       WHERE session_id = ? AND role != 'system'
       ORDER BY created_at ASC`,
    )
    .all(session.id) as {
      id: string;
      role: string;
      content: string;
      reply_source?: string;
      topic?: string;
      policy_version?: string | null;
      citations_json?: string | null;
      integrated_sources_json?: string | null;
      created_at: string;
    }[];

  return {
    session_id: session.id,
    title: session.title,
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      created_at: m.created_at,
      reply_source: m.reply_source ?? undefined,
      topic: m.topic ?? undefined,
      policy_version: m.policy_version ?? undefined,
      citations: m.citations_json
        ? (JSON.parse(m.citations_json) as GuidelineCitation[])
        : undefined,
      integrated_sources: m.integrated_sources_json
        ? (JSON.parse(m.integrated_sources_json) as string[])
        : undefined,
    })),
    message_count: messages.length,
  };
}

export function getSystemStatus(userId: string) {
  const db = getDb();
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as Record<
    string,
    unknown
  >;
  const ctx = loadUserContext(userId);
  const ext = loadExtendedContext(userId);
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const geminiOk = Boolean(
    apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length >= 10,
  );
  const catalog = getGuidelineCatalog();

  const tableCounts: Record<string, number> = {};
  for (const table of [
    'users',
    'personas',
    'quiz_questions',
    'mood_logs',
    'lunch_match_requests',
    'ai_hr_messages',
    'mentor_assignments',
  ]) {
    const row = db
      .prepare(`SELECT COUNT(*) as c FROM ${table}`)
      .get() as { c: number };
    tableCounts[table] = row.c;
  }

  return {
    database: {
      engine: 'sqlite',
      path: process.env.SQLITE_PATH ?? 'data/hepai.sqlite',
      connected: true,
      tables: tableCounts,
    },
    skill: {
      name: 'ai-hr-onboarding',
      loaded: true,
      reply_mode: geminiOk ? 'gemini+guidelines+skill' : 'guidelines+skill',
      enterprise_guidelines: {
        name: catalog.name,
        version: catalog.version,
        chunk_count: catalog.chunk_count,
        loaded: catalog.chunk_count > 0,
      },
    },
    user: {
      id: user?.id,
      nickname: ctx.nickname,
      role: ctx.role,
      onboarding_completed: ctx.onboarding_completed,
      persona_name: ctx.persona_name,
      energy_level: ctx.energy_level,
      days_left: ctx.days_left,
    },
    user_data: ext,
    ai_history_count: ext.ai_message_count,
  };
}
