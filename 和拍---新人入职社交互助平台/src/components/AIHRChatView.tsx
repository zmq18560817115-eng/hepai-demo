/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Bot, Send, Sparkles, Trash2, User, RefreshCw, BookOpen } from 'lucide-react';
import { hepaiApi } from '../api/hepaiApi';
import { getAccessToken } from '../api/client';
import { USE_MOCK_API } from '../api/config';
import { useAuthSessionScope } from '../hooks/useAuthSessionScope';
import type {
  AiHrCitation,
  AiHrGuidelinesCatalog,
  AiHrSkillMeta,
  SystemStatusResponse,
} from '../api/types';
import type { UserType } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  meta?: {
    source?: string;
    topic?: string;
    citations?: AiHrCitation[];
    integrated_sources?: string[];
  };
}

const FALLBACK_WELCOME: Record<UserType, string> = {
  newcomer:
    '你好，我是企业 AI HR 助手，可解答请假、报销、入职等制度问题，也能结合和拍帮你融入团队。建议先完成「入职盲盒」8 题，也可直接提问。',
  mentor: '你好，我是 AI HR 助手（导师版），可协助理解新人面具与带教话术。',
  hr: '你好，我是 AI HR 运营助手，可解读融入看板与风险告警。',
};

function stripReplyForDisplay(content: string): string {
  return content
    .replace(/\n\n引用条款\n(?:·[^\n]+\n?)+/g, '')
    .replace(/\*\*引用条款\*\*[\s\S]*?(?=\n\n请走|\n\n【|$)/g, '')
    .replace(/\*\*/g, '');
}

function welcomeMessage(skill: AiHrSkillMeta | null, userRole: UserType): string {
  const raw = skill?.welcome ?? FALLBACK_WELCOME[userRole];
  return stripReplyForDisplay(raw);
}

interface AIHRChatViewProps {
  userRole: UserType;
  autoFocusChat?: boolean;
}

export default function AIHRChatView({
  userRole,
  autoFocusChat = false,
}: AIHRChatViewProps) {
  const { sessionEpoch } = useAuthSessionScope();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skill, setSkill] = useState<AiHrSkillMeta | null>(null);
  const [guidelines, setGuidelines] = useState<AiHrGuidelinesCatalog | null>(
    null,
  );
  const [dbStatus, setDbStatus] = useState<SystemStatusResponse | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const welcomeRef = useRef(welcomeMessage(null, userRole));

  const suggestions = skill?.suggestions ?? [];
  const canChat = !booting && !loading && !clearing;

  const scrollToBottom = useCallback((instant = false) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const top = el.scrollHeight;
    if (instant) {
      el.scrollTop = top;
    } else {
      el.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  const applyWelcomeOnly = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: welcomeRef.current,
      },
    ]);
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const data = await hepaiApi.getAiHrHistory();
      if (data.messages.length > 0) {
        setMessages(
          data.messages.filter(
            (m): m is ChatMessage =>
              m.role === 'user' || m.role === 'assistant',
          ),
        );
      } else {
        applyWelcomeOnly();
      }
    } catch {
      applyWelcomeOnly();
    }
  }, [applyWelcomeOnly]);

  const bootstrap = useCallback(async () => {
    setBooting(true);
    setError(null);
    if (!getAccessToken() && !USE_MOCK_API) {
      setError('未登录，请从首页重新进入新人模块');
      applyWelcomeOnly();
      setBooting(false);
      return;
    }
    try {
      const [meta, status, catalog] = await Promise.all([
        hepaiApi.getAiHrSkill(userRole),
        hepaiApi.getSystemStatus().catch(() => null),
        hepaiApi.getAiHrGuidelines().catch(() => null),
      ]);
      setSkill(meta);
      welcomeRef.current = welcomeMessage(meta, userRole);
      setDbStatus(status);
      if (catalog && 'categories' in catalog) {
        setGuidelines(catalog);
      }
      await loadHistory();
    } catch (e) {
      setSkill(null);
      welcomeRef.current = welcomeMessage(null, userRole);
      setError(
        e instanceof Error
          ? e.message
          : 'AI HR 加载失败，请确认后端已启动（:8080）',
      );
      applyWelcomeOnly();
    } finally {
      setBooting(false);
    }
  }, [userRole, loadHistory, applyWelcomeOnly]);

  useEffect(() => {
    setMessages([]);
    setInput('');
    setError(null);
    setSkill(null);
    setGuidelines(null);
    void bootstrap();
  }, [sessionEpoch, bootstrap]);

  useEffect(() => {
    if (booting) return;
    scrollToBottom(true);
    const t = window.setTimeout(() => scrollToBottom(true), 80);
    return () => window.clearTimeout(t);
  }, [booting, scrollToBottom]);

  useEffect(() => {
    if (booting) return;
    scrollToBottom(false);
  }, [messages, loading, booting, scrollToBottom]);

  useEffect(() => {
    if (!autoFocusChat || booting) return;
    scrollToBottom(true);
    const t = window.setTimeout(() => {
      scrollToBottom(true);
      inputRef.current?.focus({ preventScroll: true });
    }, 120);
    return () => window.clearTimeout(t);
  }, [autoFocusChat, booting, scrollToBottom]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !canChat) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await hepaiApi.postAiHrChat(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: res.reply,
          meta: {
            source: res.reply_source,
            topic: res.topic,
            citations: res.citations,
            integrated_sources: res.integrated_sources,
          },
        },
      ]);
      hepaiApi.getSystemStatus().then(setDbStatus).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送失败，请检查网络与登录状态');
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (clearing) return;
    setClearing(true);
    setError(null);
    try {
      await hepaiApi.clearAiHrHistory();
      applyWelcomeOnly();
    } catch (e) {
      setError(e instanceof Error ? e.message : '清空失败');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant/30 gap-3 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-xl border border-outline-variant/40 flex items-center justify-center text-white shadow-neo">
            <Bot size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-medium text-slate-900 tracking-tight">
              企业 AI HR · 制度与融入
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-1 flex items-center gap-1 flex-wrap">
              <Sparkles size={12} className="text-primary" />
              {skill?.integrated_skills?.join(' + ') ??
                skill?.name ??
                'ai-hr-onboarding'}
              {skill?.version && ` v${skill.version}`}
              {guidelines?.version && ` · 准则 v${guidelines.version}`}
              {dbStatus?.skill.reply_mode && ` · ${dbStatus.skill.reply_mode}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void bootstrap()}
            disabled={booting}
            className="neo-button text-xs flex items-center gap-2 text-slate-600 min-h-[44px] disabled:opacity-50"
            title="重新加载 Skill 与对话"
          >
            <RefreshCw size={14} className={booting ? 'animate-spin' : ''} />
            刷新
          </button>
          <button
            type="button"
            onClick={() => void clearHistory()}
            disabled={clearing || booting}
            className="neo-button text-xs flex items-center gap-2 text-slate-500 min-h-[44px] disabled:opacity-50"
          >
            <Trash2 size={14} />
            {clearing ? '清空中…' : '清空对话'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-300 text-rose-700 text-xs font-sans flex flex-wrap items-center justify-between gap-2">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void bootstrap()}
            className="neo-button text-xs py-1 px-2"
          >
            重试
          </button>
        </div>
      )}

      <div className="flex-1 flex gap-6 min-h-0">
        <aside className="w-72 shrink-0 hidden lg:block space-y-3">
          {guidelines && (
            <div className="ding-panel p-3 text-xs space-y-2">
              <p className="font-bold text-on-surface flex items-center gap-1.5">
                <BookOpen size={14} className="text-primary" />
                企业管理准则
              </p>
              <p className="text-on-surface-variant leading-relaxed">
                {guidelines.description}
              </p>
              <p className="font-sans text-[9px] text-slate-500">
                v{guidelines.version} · {guidelines.chunk_count} 条 ·{' '}
                {guidelines.owner}
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {guidelines.categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      void sendMessage(`${cat.title}相关规定是什么？`)
                    }
                    disabled={!canChat}
                    className="w-full text-left px-2 py-1.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-slate-700 disabled:opacity-50"
                  >
                    {cat.title}
                  </button>
                ))}
              </div>
            </div>
          )}
          {skill && userRole === 'newcomer' && (
            <div className="ding-panel p-3 bg-primary-container/60 text-xs space-y-2">
              <p className="font-medium text-indigo-800 tracking-wide">
                首周路线 · Skill
              </p>
              {skill.first_week_roadmap.map((row) => (
                <div key={row.phase}>
                  <p className="font-bold text-slate-800">{row.phase}</p>
                  <ul className="text-slate-600 list-disc pl-3">
                    {row.tasks.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] font-medium text-slate-400 tracking-wide">
            快捷提问
          </p>
          {suggestions.length === 0 && !booting && (
            <p className="text-[10px] text-slate-400">暂无快捷问题，请直接输入</p>
          )}
          {suggestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => void sendMessage(q)}
              disabled={!canChat}
              className="w-full text-left p-3 rounded-xl border border-outline-variant/40 bg-white hover:bg-primary-container text-xs font-medium shadow-neo hover:shadow-md transition-all disabled:opacity-50 min-h-[44px]"
            >
              {q}
            </button>
          ))}
          {dbStatus && (
            <div className="ding-panel p-3 border-emerald-200 bg-success-container/90 text-xs space-y-1 font-sans">
              <p className="font-medium text-emerald-800 tracking-wide">
                数据库 · {dbStatus.database.engine}
              </p>
              <p>面具 {dbStatus.user.persona_name ?? '未完成'}</p>
              <p>能量 {dbStatus.user.energy_level}%</p>
              <p>AI 消息 {dbStatus.ai_history_count} 条（已入库）</p>
              <p>午餐 {dbStatus.user_data.lunch_status ?? 'idle'}</p>
            </div>
          )}
        </aside>

        <div className="flex-1 flex flex-col min-h-0 ding-panel rounded-xl overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/80 scroll-smooth"
          >
            {booting && (
              <p className="text-center text-slate-400 text-sm font-sans">
                正在加载 Skill 与对话记录…
              </p>
            )}
            {!booting &&
              messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-9 h-9 shrink-0 rounded-xl border border-outline-variant/40 flex items-center justify-center ${
                      m.role === 'assistant'
                        ? 'bg-primary text-white'
                        : 'bg-white'
                    }`}
                  >
                    {m.role === 'assistant' ? (
                      <Bot size={18} />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <div
                    className={`max-w-[75%] p-4 rounded-xl border border-outline-variant/40 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === 'assistant'
                        ? 'bg-white shadow-neo'
                        : 'bg-primary text-white shadow-neo'
                    }`}
                  >
                    {stripReplyForDisplay(m.content)}
                  </div>
                </motion.div>
              ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-primary rounded-xl border border-outline-variant/40 flex items-center justify-center text-white">
                  <Bot size={18} className="animate-pulse" />
                </div>
                <div className="p-4 rounded-xl border border-outline-variant/40 bg-white text-slate-400 text-sm font-sans">
                  正在思考…
                </div>
              </div>
            )}
          </div>

          <form
            className="p-4 border-t border-outline-variant/30 bg-white flex gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                booting
                  ? '加载中…'
                  : '问制度流程（请假/报销/入职）或融入问题…'
              }
              disabled={!canChat}
              className="ding-input flex-1 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!canChat || !input.trim()}
              className="neo-button-primary px-6 flex items-center gap-2 disabled:opacity-50 min-w-[100px] justify-center min-h-[44px]"
            >
              <Send size={18} />
              发送
            </button>
          </form>

          <div className="lg:hidden px-4 pb-4 flex flex-wrap gap-2 border-t border-slate-100">
            {suggestions.slice(0, 3).map((q) => (
              <button
                key={q}
                type="button"
                disabled={!canChat}
                onClick={() => void sendMessage(q)}
                className="text-[10px] px-2 py-1 border border-slate-300 font-medium text-slate-600 disabled:opacity-50"
              >
                {q.length > 14 ? `${q.slice(0, 14)}…` : q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
