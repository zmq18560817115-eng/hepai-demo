/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { MessageCircle, ExternalLink } from 'lucide-react';
import { hepaiApi } from '../api/hepaiApi';
import type { MentorDto } from '../api/types';

const DEFAULT_AVATAR =
  'https://api.dicebear.com/7.x/identicon/svg?seed=mentor';

export default function MentorsView() {
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
      <p className="text-center text-slate-500 text-sm py-12 font-mono">加载导师列表…</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b-2 border-slate-900 pb-4">
        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
          带教导师库
        </h2>
        <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase">
          查看状态后再联系，减少「怕打扰」的焦虑
        </p>
      </div>

      {error && (
        <p className="text-rose-600 text-xs font-mono text-center">{error}</p>
      )}

      <div className="space-y-4">
        {mentors.map((m) => (
          <div key={m.id} className="neo-card p-4 flex items-center gap-4">
            <div className="w-14 h-14 border-2 border-slate-900 overflow-hidden shrink-0">
              <img
                src={m.avatar_url ?? DEFAULT_AVATAR}
                alt={m.name}
                className="w-full h-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-black text-sm uppercase truncate">{m.name}</h4>
                <span
                  className={`text-[8px] font-black px-1.5 py-0.5 border border-slate-900 uppercase ${
                    m.status === 'available'
                      ? 'bg-emerald-400'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {m.status}
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-500 truncate">{m.role}</p>
            </div>
            <button
              type="button"
              className="neo-button text-[9px] shrink-0 opacity-50 cursor-not-allowed"
              title="二期：钉钉 IM"
            >
              联系
            </button>
          </div>
        ))}
        {mentors.length === 0 && !error && (
          <p className="text-center text-slate-400 text-xs font-mono py-8">
            带教老师还没就位，HR 正在配置
          </p>
        )}
      </div>

      <p className="text-[10px] text-slate-400 font-mono text-center flex items-center justify-center gap-1">
        <MessageCircle size={12} />
        正式版将通过钉钉会话发起
        <ExternalLink size={10} />
      </p>
    </div>
  );
}
