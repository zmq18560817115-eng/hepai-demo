/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { hepaiApi } from '../api/hepaiApi';
import type { MentorDto } from '../api/types';

const DEFAULT_AVATAR =
  'https://api.dicebear.com/7.x/identicon/svg?seed=mentor';

interface MentorsViewProps {
  onOpenMentorChat: (mentor: MentorDto) => void;
}

export default function MentorsView({ onOpenMentorChat }: MentorsViewProps) {
  const [mentors, setMentors] = useState<MentorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hepaiApi
      .getMentors()
      .then((res) => setMentors(res.mentors))
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="text-center text-slate-500 text-sm py-12 font-sans">加载导师列表…</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-outline-variant/50 pb-4">
        <h2 className="ding-title text-2xl text-slate-900">
          带教导师库
        </h2>
        <p className="ding-subtitle mt-1">
          点击进入对话 · 消息实时入库同步
        </p>
      </div>

      {error && (
        <p className="text-rose-600 text-xs font-sans text-center">{error}</p>
      )}

      <div className="space-y-4">
        {mentors.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onOpenMentorChat(m)}
            className="ding-panel p-4 flex items-center gap-4 w-full text-left hover:bg-primary-container/40 transition-all"
          >
            <div className="w-14 h-14 rounded-xl border border-outline-variant/40 overflow-hidden shrink-0">
              <img
                src={m.avatar_url ?? DEFAULT_AVATAR}
                alt={m.name}
                className="w-full h-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-medium text-sm truncate text-on-surface">{m.name}</h4>
                <span
                  className={`text-[8px] font-medium px-1.5 py-0.5 border border-outline-variant/40 ${
                    m.status === 'available'
                      ? 'bg-emerald-400'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {m.status}
                </span>
              </div>
              <p className="text-[10px] font-sans text-slate-500 truncate">{m.role}</p>
            </div>
            <span className="neo-button-primary text-[9px] shrink-0 flex items-center gap-1 px-3 py-2">
              对话
              <ChevronRight size={14} />
            </span>
          </button>
        ))}
        {mentors.length === 0 && !error && (
          <p className="text-center text-slate-400 text-xs font-sans py-8">
            带教老师还没就位，HR 正在配置
          </p>
        )}
      </div>

      <p className="text-[10px] text-slate-400 font-sans text-center flex items-center justify-center gap-1">
        <MessageCircle size={12} />
        导师在工作台可收到并回复你的消息
      </p>
    </div>
  );
}
