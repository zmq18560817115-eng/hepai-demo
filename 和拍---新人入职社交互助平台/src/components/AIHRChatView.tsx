/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Bot, Send, Sparkles, Trash2, User } from 'lucide-react';
import { hepaiApi } from '../api/hepaiApi';
import type { UserType } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

const SUGGESTIONS: Record<UserType, string[]> = {
  newcomer: [
    '人格面具是什么？和人格测试有什么关系？',
    '入职第一周很焦虑怎么办？',
    '情绪能量很低时可以做些什么？',
    '如何用蹭饭地图找饭搭子？',
    '怎么联系导师才不尴尬？',
    '入职人格测试要答几道题？',
  ],
  mentor: [
    '如何根据面具标签理解新人？',
    '新人能量连续偏低该怎么沟通？',
    '带教时有哪些减压话术？',
  ],
  hr: [
    '如何解读本批次融入指数？',
    '待关注新人名单如何优先干预？',
    '午餐匹配成功率偏低怎么优化？',
    '风险告警推送 HRBP 的最佳实践？',
  ],
};

const WELCOME: Record<UserType, string> = {
  newcomer:
    '你好，我是企业 AI HR 助手。\n\n建议你先完成左侧「入职盲盒」里的人格测试（8 题），解锁专属面具后，我能结合你的面具与能量数据，回答社交焦虑、午餐匹配、导师沟通等问题。\n\n也可以直接问我：面具是什么、能量低了怎么办、如何约饭搭子。',
  mentor:
    '你好，我是 AI HR 助手（导师版）。可协助你理解新人面具标签、识别情绪风险、设计低压力沟通话术。',
  hr: '你好，我是 AI HR 运营助手。可协助解读看板数据、风险告警、批次融入与干预策略。',
};

interface AIHRChatViewProps {
  userRole: UserType;
}

export default function AIHRChatView({ userRole }: AIHRChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await hepaiApi.getAiHrHistory();
      if (data.messages.length > 0) {
        setMessages(
          data.messages.filter(
            (m): m is ChatMessage => m.role === 'user' || m.role === 'assistant',
          ),
        );
      } else {
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: WELCOME[userRole],
          },
        ]);
      }
    } catch {
      setMessages([
        { id: 'welcome', role: 'assistant', content: WELCOME[userRole] },
      ]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [userRole]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

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
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送失败');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await hepaiApi.clearAiHrHistory();
      setMessages([
        { id: 'welcome', role: 'assistant', content: WELCOME[userRole] },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '清空失败');
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-slate-900">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-white shadow-neo">
            <Bot size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              企业 AI HR 对话
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-1">
              <Sparkles size={12} className="text-indigo-500" />
              入职适应 · 数据分析 · 隐私合规
              {userRole === 'hr' && ' · HR 运营增强'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearHistory}
          className="neo-button text-xs flex items-center gap-2 text-slate-500"
        >
          <Trash2 size={14} />
          清空对话
        </button>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <aside className="w-64 shrink-0 hidden lg:block space-y-3">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            快捷提问
          </p>
          {SUGGESTIONS[userRole].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => sendMessage(q)}
              disabled={loading}
              className="w-full text-left p-3 border-2 border-slate-900 bg-white hover:bg-indigo-50 text-xs font-medium shadow-neo hover:shadow-neo-lg transition-all disabled:opacity-50"
            >
              {q}
            </button>
          ))}
          <p className="text-[10px] text-slate-400 font-mono leading-relaxed pt-4 border-t border-slate-200">
            对话记录已存入数据库。配置 GEMINI_API_KEY 后可启用真实大模型（否则为智能演示回复）。
          </p>
        </aside>

        <div className="flex-1 flex flex-col min-h-0 neo-card border-2 border-slate-900 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/80">
            {historyLoading && (
              <p className="text-center text-slate-400 text-sm font-mono">加载对话记录…</p>
            )}
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-9 h-9 shrink-0 border-2 border-slate-900 flex items-center justify-center ${
                    m.role === 'assistant' ? 'bg-indigo-600 text-white' : 'bg-white'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <Bot size={18} />
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <div
                  className={`max-w-[75%] p-4 border-2 border-slate-900 text-sm leading-relaxed ${
                    m.role === 'assistant'
                      ? 'bg-white shadow-neo'
                      : 'bg-indigo-600 text-white shadow-neo'
                  }`}
                >
                  {m.content}
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-white">
                  <Bot size={18} className="animate-pulse" />
                </div>
                <div className="p-4 border-2 border-slate-900 bg-white text-slate-400 text-sm font-mono">
                  正在思考…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <p className="px-4 py-2 text-rose-600 text-xs font-mono border-t border-rose-200 bg-rose-50">
              {error}
            </p>
          )}

          <form
            className="p-4 border-t-2 border-slate-900 bg-white flex gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你的问题，按 Enter 发送…"
              disabled={loading}
              className="flex-1 px-4 py-3 border-2 border-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="neo-button-primary px-6 flex items-center gap-2 disabled:opacity-50 min-w-[100px] justify-center"
            >
              <Send size={18} />
              发送
            </button>
          </form>

          <div className="lg:hidden px-4 pb-4 flex flex-wrap gap-2 border-t border-slate-100">
            {SUGGESTIONS[userRole].slice(0, 2).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendMessage(q)}
                className="text-[10px] px-2 py-1 border border-slate-300 rounded font-medium text-slate-600"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
