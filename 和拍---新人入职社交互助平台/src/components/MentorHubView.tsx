/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, Users } from 'lucide-react';
import { hepaiApi } from '../api/hepaiApi';
import type { MentorAssigneeDto } from '../api/types';

export default function MentorHubView() {
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
      <p className="text-center text-slate-500 text-sm py-12 font-mono">加载工作台…</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="neo-card p-6 bg-indigo-50">
        <div className="flex items-center gap-3 mb-2">
          <Users className="text-indigo-600" size={22} />
          <h2 className="text-xl font-black uppercase">导师工作台</h2>
        </div>
        <p className="text-xs text-slate-600 font-medium">
          仅展示新人授权的面具标签与情绪区间，不显示盲盒原始答案。
        </p>
      </div>

      {error && (
        <p className="text-rose-600 text-xs font-mono text-center">{error}</p>
      )}

      <div className="space-y-3">
        {assignees.map((u) => (
          <div key={u.user_id} className="neo-card p-4">
            <div className="flex justify-between items-start gap-2">
              <div>
                <h3 className="font-black text-slate-900 uppercase text-sm">
                  {u.nickname}
                </h3>
                <p className="text-[10px] font-mono text-indigo-600 mt-1">
                  面具：{u.persona.name}
                </p>
                <p className="text-[10px] font-mono text-slate-500 mt-1">
                  入职剩余 D{u.onboarding_days_left} · 能量 {u.energy_level}%
                </p>
              </div>
              {(u.risk === 'watch' || u.risk === 'alert') && (
                <span className="flex items-center gap-1 text-[9px] font-black uppercase bg-amber-100 border border-amber-400 px-2 py-1 text-amber-900 shrink-0">
                  <AlertCircle size={12} />
                  {u.risk === 'alert' ? '预警' : '关注'}
                </span>
              )}
            </div>
            <div className="mt-3 h-2 bg-slate-100 border border-slate-900">
              <div
                className={`h-full ${
                  u.energy_level < 50 ? 'bg-rose-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${u.energy_level}%` }}
              />
            </div>
          </div>
        ))}
        {assignees.length === 0 && !error && (
          <p className="text-center text-slate-400 text-xs font-mono py-8">
            暂无分配的新人
          </p>
        )}
      </div>
    </div>
  );
}
