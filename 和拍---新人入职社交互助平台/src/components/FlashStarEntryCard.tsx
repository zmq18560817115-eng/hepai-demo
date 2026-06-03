/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import { hepaiApi } from '../api/hepaiApi';
import { useAuthSessionScope } from '../hooks/useAuthSessionScope';
import FlashStarJar, { layoutJarStars } from './flash/FlashStarJar';

interface FlashStarEntryCardProps {
  onEnter: () => void;
}

export default function FlashStarEntryCard({ onEnter }: FlashStarEntryCardProps) {
  const [count, setCount] = useState(0);
  const { sessionEpoch } = useAuthSessionScope();

  useEffect(() => {
    setCount(0);
    hepaiApi
      .getFlashJar()
      .then((res) => setCount(res.total))
      .catch(() => setCount(0));
  }, [sessionEpoch]);

  const previewStars = useMemo(() => layoutJarStars(count, 'preview'), [count]);

  return (
    <div className="neo-card p-5 border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-white overflow-hidden relative">
      <Sparkles
        className="absolute -top-1 -right-1 text-amber-200/80"
        size={56}
        strokeWidth={1.5}
      />
      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
        <FlashStarJar stars={previewStars} size="sm" className="shrink-0" />
        <div className="flex-1 text-center sm:text-left space-y-2">
          <h3 className="text-lg font-medium text-slate-900">记录今日闪光</h3>
          <p className="text-xs text-slate-600 font-medium">
            高光小事会变成折纸星星，落入你的玻璃星罐
          </p>
          <p className="text-[10px] font-mono text-amber-800">
            已收集 {count} 颗星光
          </p>
          <button
            type="button"
            onClick={onEnter}
            className="neo-button-primary w-full sm:w-auto px-6 py-2.5 text-sm font-medium flex items-center justify-center gap-2 min-h-[44px]"
          >
            进入星罐
            <ChevronRight size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
