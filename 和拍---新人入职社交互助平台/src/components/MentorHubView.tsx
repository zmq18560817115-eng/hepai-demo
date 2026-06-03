/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, MessageCircle, Users, ChevronRight } from 'lucide-react';
import { hepaiApi } from '../api/hepaiApi';
import type { MentorAssigneeDto } from '../api/types';

interface MentorHubViewProps {
  onOpenMenteeChat: (assignee: MentorAssigneeDto) => void;
}

export default function MentorHubView({ onOpenMenteeChat }: MentorHubViewProps) {
  const [assignees, setAssignees] = useState<MentorAssigneeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hepaiApi
      .getMentorAssignees()
      .then((res) => setAssignees(res.assignees))
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="text-center text-slate-500 text-sm py-12 font-sans">加载工作台…</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="ding-panel p-6 bg-primary-container/70">
        <div className="flex items-center gap-3 mb-2">
          <Users className="text-primary" size={22} />
          <h2 className="text-xl font-medium">导师工作台</h2>
        </div>
        <p className="text-xs text-slate-600 font-medium">
          点击新人卡片进入对话，回复将实时同步至新人端。
        </p>
      </div>

      {error && (
        <p className="text-rose-600 text-xs font-sans text-center">{error}</p>
      )}

      <div className="space-y-3">
        {assignees.map((u) => (
          <button
            key={u.user_id}
            type="button"
            onClick={() => onOpenMenteeChat(u)}
            className="ding-panel p-4 w-full text-left hover:bg-primary-container/40 transition-all"
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                <h3 className="font-medium text-slate-900 text-sm">
                  {u.nickname}
                </h3>
                <p className="text-[10px] font-sans text-primary mt-1">
                  面具：{u.persona.name}
                </p>
                <p className="text-[10px] font-sans text-slate-500 mt-1">
                  入职剩余 D{u.onboarding_days_left} · 能量 {u.energy_level}%
                </p>
                {u.latest_mood_note && (
                  <p className="text-[10px] font-sans text-slate-400 mt-1 line-clamp-2">
                    最近闪光：{u.latest_mood_note}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                {(u.risk === 'watch' || u.risk === 'alert') && (
                  <span className="flex items-center gap-1 text-[9px] font-medium bg-amber-100 border border-amber-400 px-2 py-1 text-amber-900">
                    <AlertCircle size={12} />
                    {u.risk === 'alert' ? '预警' : '关注'}
                  </span>
                )}
                <span className="neo-button-primary text-xs flex items-center gap-1 px-2 py-1.5">
                  <MessageCircle size={12} />
                  回复
                  <ChevronRight size={12} />
                </span>
              </div>
            </div>
            <div className="mt-3 h-2 bg-surface-container border border-outline-variant/40">
              <div
                className={`h-full ${
                  u.energy_level < 50 ? 'bg-rose-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${u.energy_level}%` }}
              />
            </div>
          </button>
        ))}
        {assignees.length === 0 && !error && (
          <p className="text-center text-slate-400 text-xs font-sans py-8">
            暂无分配的新人
          </p>
        )}
      </div>
    </div>
  );
}
