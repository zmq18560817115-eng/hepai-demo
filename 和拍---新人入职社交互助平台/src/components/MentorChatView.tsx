/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 新人 ↔ 导师 真实对话（SQLite mentor_chat_*）
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Send, User } from 'lucide-react';
import { hepaiApi } from '../api/hepaiApi';
import { useAuthSessionScope } from '../hooks/useAuthSessionScope';
import type { MentorChatMessage, MentorChatPeer } from '../api/types';

const DEFAULT_AVATAR =
  'https://api.dicebear.com/7.x/identicon/svg?seed=mentor';

interface MentorChatViewProps {
  peerId: string;
  peerName: string;
  peerAvatar?: string | null;
  viewerRole: 'newcomer' | 'mentor';
  onBack: () => void;
}

export default function MentorChatView({
  peerId,
  peerName,
  peerAvatar,
  viewerRole,
  onBack,
}: MentorChatViewProps) {
  const { sessionEpoch } = useAuthSessionScope();
  const [peer, setPeer] = useState<MentorChatPeer | null>(null);
  const [messages, setMessages] = useState<MentorChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback((instant = false) => {
    const el = scrollRef.current;
    if (!el) return;
    const top = el.scrollHeight;
    if (instant) el.scrollTop = top;
    else el.scrollTo({ top, behavior: 'smooth' });
  }, []);

  const loadChat = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await hepaiApi.getMentorChat(peerId);
      setPeer(data.peer);
      setMessages(data.messages);
    } catch (e) {
      setError(e instanceof Error ? e.message : '对话加载失败');
    } finally {
      setLoading(false);
    }
  }, [peerId]);

  useEffect(() => {
    setPeer(null);
    setMessages([]);
    setInput('');
    setError(null);
    void loadChat();
  }, [sessionEpoch, peerId, loadChat]);

  useEffect(() => {
    if (loading) return;
    scrollToBottom(true);
    const t = window.setTimeout(() => {
      scrollToBottom(true);
      inputRef.current?.focus({ preventScroll: true });
    }, 100);
    return () => window.clearTimeout(t);
  }, [loading, scrollToBottom]);

  useEffect(() => {
    if (!loading) scrollToBottom(false);
  }, [messages, sending, loading, scrollToBottom]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await hepaiApi.postMentorChatMessage(peerId, trimmed);
      setMessages((prev) => [...prev, res.message]);
      setInput('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送失败');
    } finally {
      setSending(false);
    }
  };

  const displayName = peer?.name ?? peerName;
  const avatar = peer?.avatar_url ?? peerAvatar ?? DEFAULT_AVATAR;
  const status =
    peer?.mentor_status === 'available'
      ? '可联系'
      : peer?.mentor_status === 'busy'
        ? '忙碌'
        : null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-10rem)]">
      <button
        type="button"
        onClick={onBack}
        className="neo-button text-[10px] font-medium flex items-center gap-1 px-3 py-2 mb-4 self-start"
      >
        <ArrowLeft size={14} />
        返回
      </button>

      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-outline-variant/30">
        <img
          src={avatar}
          alt=""
          className="w-12 h-12 rounded-2xl border border-outline-variant/40 object-cover"
        />
        <div>
          <h2 className="text-xl font-medium text-slate-900">{displayName}</h2>
          <p className="text-[10px] font-mono text-slate-500">
            {viewerRole === 'newcomer' ? '带教导师 · 站内私信' : '新人 · 站内私信'}
            {status ? ` · ${status}` : ''}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col neo-card rounded-2xl border border-outline-variant/40 overflow-hidden min-h-[420px]">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/80"
        >
          {loading && (
            <p className="text-center text-slate-400 text-sm font-mono">
              同步对话记录…
            </p>
          )}
          {!loading && messages.length === 0 && (
            <p className="text-center text-slate-400 text-xs font-mono py-8">
              还没有消息，发第一条向{viewerRole === 'newcomer' ? '导师' : '新人'}
              提问吧
            </p>
          )}
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${m.is_mine ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 shrink-0 rounded-2xl border border-outline-variant/40 flex items-center justify-center ${
                  m.is_mine ? 'bg-primary text-white' : 'bg-white'
                }`}
              >
                <User size={14} />
              </div>
              <div
                className={`max-w-[80%] p-3 rounded-2xl border border-outline-variant/40 text-sm ${
                  m.is_mine
                    ? 'bg-primary text-white shadow-neo'
                    : 'bg-white shadow-neo'
                }`}
              >
                {!m.is_mine && (
                  <p className="text-[9px] font-medium opacity-70 mb-1">
                    {m.sender_name}
                  </p>
                )}
                {m.content}
                <p
                  className={`text-[9px] font-mono mt-1.5 ${
                    m.is_mine ? 'text-primary-container' : 'text-slate-400'
                  }`}
                >
                  {new Date(m.created_at).toLocaleString('zh-CN', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </motion.div>
          ))}
          {sending && (
            <p className="text-[10px] font-mono text-slate-400 text-center animate-pulse">
              发送中…
            </p>
          )}
        </div>

        {error && (
          <p className="px-3 py-2 text-rose-600 text-xs font-mono bg-rose-50 border-t border-rose-200">
            {error}
          </p>
        )}

        <form
          className="p-3 border-t border-outline-variant/30 bg-white flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              viewerRole === 'newcomer'
                ? '向导师提问…'
                : '回复新人…'
            }
            disabled={sending || loading}
            className="flex-1 px-3 py-2.5 rounded-2xl border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            disabled={sending || loading || !input.trim()}
            className="neo-button-primary px-4 flex items-center gap-1 disabled:opacity-50"
          >
            <Send size={16} />
            发送
          </button>
        </form>
      </div>
    </div>
  );
}
