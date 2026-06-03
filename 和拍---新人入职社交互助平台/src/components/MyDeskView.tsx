/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { hepaiApi } from '../api/hepaiApi';
import type { DeskPlacedItem, MyDeskResponse } from '../api/types';
import { usePrototype } from '../context/PrototypeContext';
import { useAuthSessionScope } from '../hooks/useAuthSessionScope';
import { buildDeskPayload } from '../utils/buildDeskItems';
import DeskSurface from './desk/DeskSurface';
import {
  ZoneHonorSticker,
  ZoneJarSticker,
  ZoneMentorSticker,
  ZoneTicketSticker,
} from './desk/DeskStickers';

interface MyDeskViewProps {
  onOpenFlashStar: () => void;
  onOpenLunch: () => void;
  onOpenMentors: () => void;
}

export default function MyDeskView({
  onOpenFlashStar,
  onOpenLunch,
  onOpenMentors,
}: MyDeskViewProps) {
  const { persona, onboardingDone } = usePrototype();
  const { sessionEpoch } = useAuthSessionScope();
  const [desk, setDesk] = useState<MyDeskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDesk = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await hepaiApi.getMyDesk();
      setDesk(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '工位加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setDesk(null);
    if (onboardingDone) void loadDesk();
    else setLoading(false);
  }, [onboardingDone, sessionEpoch, loadDesk]);

  const handleItemClick = (item: DeskPlacedItem) => {
    if (item.kind === 'star_jar' || item.slot === 'star_scatter') {
      onOpenFlashStar();
      return;
    }
    if (item.kind === 'buddy_ticket') {
      onOpenLunch();
      return;
    }
    if (item.kind === 'mentor_reward') {
      onOpenMentors();
      return;
    }
    if (item.kind === 'honor') {
      onOpenFlashStar();
    }
  };

  if (!onboardingDone) {
    return (
      <p className="text-center text-slate-500 text-sm py-12 font-mono">
        请先完成入职盲盒
      </p>
    );
  }

  if (loading) {
    return (
      <p className="text-center text-slate-500 text-sm py-12 font-mono">
        正在布置你的工位…
      </p>
    );
  }

  if (error && !desk) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-rose-600 text-sm font-mono">{error}</p>
        <button type="button" onClick={() => void loadDesk()} className="neo-button text-xs">
          重试
        </button>
      </div>
    );
  }

  const payload = desk ?? {
    items: [],
    star_count: 0,
    buddy_ticket_count: 0,
    lunch_voucher_count: 0,
  };

  return (
    <div className="space-y-5 w-full max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <LayoutGrid
            size={20}
            strokeWidth={2.5}
            className="text-primary shrink-0 lg:w-6 lg:h-6"
          />
          <span className="text-base lg:text-lg font-bold text-on-surface">
            我的工位
          </span>
          <div className="flex items-center gap-1.5 lg:gap-2" aria-hidden>
            <ZoneHonorSticker size={22} className="lg:scale-125" />
            <ZoneJarSticker size={22} className="lg:scale-125" />
            <ZoneTicketSticker size={22} className="lg:scale-125" />
            <ZoneMentorSticker size={22} className="lg:scale-125" />
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadDesk()}
          className="neo-button text-xs lg:text-sm px-3 py-1.5 lg:px-4 lg:py-2 shrink-0"
        >
          刷新
        </button>
      </div>
      <p className="text-xs lg:text-sm font-mono text-on-surface-variant -mt-1">
        悬停或点击贴画查看详情
        {payload.lunch_voucher_count > 0 && (
          <span className="text-primary font-bold">
            {' '}
            · 已收集 {payload.lunch_voucher_count} 张饭搭子餐券
          </span>
        )}
      </p>

      {error && (
        <p className="text-rose-600 text-[10px] font-mono text-center">{error}</p>
      )}

      <DeskSurface
        items={payload.items}
        starCount={payload.star_count}
        personaName={persona?.role}
        onItemClick={handleItemClick}
      />

      <div
        className="flex justify-center gap-4 text-sm lg:text-base font-medium text-on-surface-variant"
        aria-label="桌面收集概览"
      >
        <span title={`${payload.star_count} 颗高光星`}>⭐×{payload.star_count}</span>
        {payload.lunch_voucher_count > 0 && (
          <span title={`${payload.lunch_voucher_count} 张饭搭子餐券`}>
            🎫×{payload.lunch_voucher_count}
          </span>
        )}
      </div>
    </div>
  );
}
