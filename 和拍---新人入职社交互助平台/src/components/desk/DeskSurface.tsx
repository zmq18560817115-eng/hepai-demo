/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 俯视工位桌面 · 贴画摆放（无文字标签）
 */

import React from 'react';
import { motion } from 'motion/react';
import type { DeskPlacedItem } from '../../api/types';
import FlashStarJar, { layoutJarStars } from '../flash/FlashStarJar';
import {
  itemStickerForKind,
  MaskSticker,
  MonitorSticker,
  zoneStickerForSlot,
} from './DeskStickers';

type DeskSurfaceProps = {
  items: DeskPlacedItem[];
  starCount: number;
  personaName?: string;
  onItemClick?: (item: DeskPlacedItem) => void;
};

const SLOT_STYLE: Record<
  DeskPlacedItem['slot'],
  { className: string; zone?: 'honor' | 'jar' | 'tickets' | 'mentor' }
> = {
  honor: { className: 'left-[5%] top-[8%] w-[28%]', zone: 'honor' },
  jar: { className: 'right-[6%] top-[6%] w-[30%]', zone: 'jar' },
  tickets: { className: 'right-[5%] top-[40%] w-[32%]', zone: 'tickets' },
  mentor: { className: 'left-[5%] bottom-[12%] w-[30%]', zone: 'mentor' },
  star_scatter: { className: 'left-[30%] bottom-[16%] w-[40%]' },
};

function itemLabel(item: DeskPlacedItem) {
  return [item.title, item.detail].filter(Boolean).join(' · ');
}

function DeskStickerButton({
  item,
  children,
  onClick,
  className = '',
}: {
  item: DeskPlacedItem;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={itemLabel(item)}
      aria-label={itemLabel(item)}
      className={`rounded-xl border-2 border-ink bg-surface shadow-[2px_2px_0_#1b2838] hover:-translate-y-px hover:shadow-[var(--shadow-pop-sm)] transition-all lg:rounded-2xl lg:border-[2.5px] ${className}`}
    >
      {children}
    </button>
  );
}

export default function DeskSurface({
  items,
  starCount,
  personaName,
  onItemClick,
}: DeskSurfaceProps) {
  const bySlot = (slot: DeskPlacedItem['slot']) =>
    items.filter((i) => i.slot === slot).sort((a, b) => a.sort - b.sort);

  const honors = bySlot('honor');
  const jar = bySlot('jar')[0];
  const tickets = bySlot('tickets').filter((t) => t.id !== 'ticket-empty');
  const ticketPlaceholder = items.find((i) => i.id === 'ticket-empty');
  const mentors = bySlot('mentor');
  const scattered = bySlot('star_scatter');
  const jarStars = layoutJarStars(Math.min(starCount, 12), 'desk');

  return (
    <div
      className="relative w-full mx-auto rounded-[var(--radius-hepai)] border-[2.5px] border-ink bg-cream-deep shadow-[var(--shadow-pop-sm)] overflow-hidden
        max-w-[560px] h-[240px]
        sm:max-w-[640px] sm:h-[280px]
        md:max-w-[760px] md:h-[340px]
        lg:max-w-[960px] lg:h-[400px]
        xl:max-w-[1100px] xl:h-[440px]"
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, #d97706 0px, #fbbf24 2px, #d97706 4px)',
        }}
      />

      <div className="absolute inset-3 md:inset-4 lg:inset-5 border-2 border-amber-900/20 bg-amber-50/90 rounded-sm" />

      {/* 显示器贴画 */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[4%] w-[32%] flex flex-col items-center"
        title={personaName ?? '面具'}
      >
        <div className="rounded-xl lg:rounded-2xl border-2 border-ink bg-inverse-surface p-1 lg:p-1.5 shadow-[2px_2px_0_#1b2838] w-full">
          <div className="aspect-[16/10] flex items-center justify-center relative">
            <MonitorSticker
              size={36}
              className="opacity-90 md:hidden"
            />
            <MonitorSticker
              size={52}
              className="opacity-90 hidden md:block lg:hidden"
            />
            <MonitorSticker
              size={60}
              className="opacity-90 hidden lg:block"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <MaskSticker size={26} className="md:hidden" />
              <MaskSticker size={34} className="hidden md:block lg:hidden" />
              <MaskSticker size={40} className="hidden lg:block" />
            </div>
          </div>
        </div>
      </div>

      {/* 键盘贴画 */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-[7%] w-[44%] lg:w-[48%] h-[13%] lg:h-[15%] rounded-2xl border border-outline-variant/40 bg-slate-200 shadow-neo-sm flex items-center justify-center gap-0.5 lg:gap-1 px-1 lg:px-1.5"
        aria-hidden
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-[58%] bg-white border border-slate-400 rounded-[1px]"
          />
        ))}
      </div>

      {/* 荣誉区 */}
      <div className={`absolute ${SLOT_STYLE.honor.className} z-10`}>
        <div className="mb-1 drop-shadow-sm scale-90 md:scale-100 lg:scale-110 origin-top-left">
          {zoneStickerForSlot('honor')}
        </div>
        <div className="flex flex-wrap gap-1.5 lg:gap-2">
          {honors.map((item) => (
            <div key={item.id} className="scale-95 md:scale-100 lg:scale-110 origin-top-left">
              <DeskStickerButton
                item={item}
                onClick={() => onItemClick?.(item)}
                className="p-1 lg:p-1.5"
              >
                {itemStickerForKind(item.kind)}
              </DeskStickerButton>
            </div>
          ))}
        </div>
      </div>

      {/* 星星瓶 */}
      {jar && (
        <div className={`absolute ${SLOT_STYLE.jar.className} z-10`}>
          <div className="flex items-center gap-1 mb-1 scale-90 md:scale-100 lg:scale-110 origin-top-right">
            {zoneStickerForSlot('jar')}
            {starCount > 0 && (
              <span
                className="text-[9px] lg:text-[11px] font-medium bg-amber-300 border border-outline-variant/40 px-1.5 py-0.5 lg:px-2 tabular-nums"
                title={`${starCount} 颗星`}
              >
                ×{starCount}
              </span>
            )}
          </div>
          <DeskStickerButton
            item={jar}
            onClick={() => onItemClick?.(jar)}
            className="p-2 lg:p-3 w-full"
          >
            <div className="h-[48px] md:h-[56px] lg:h-[72px] relative mx-auto max-w-[72px] md:max-w-[88px] lg:max-w-[110px] pointer-events-none scale-90 md:scale-100 origin-center">
              <FlashStarJar stars={jarStars} size="sm" className="mx-auto md:scale-110 lg:scale-125" />
            </div>
          </DeskStickerButton>
        </div>
      )}

      {/* 搭子券 / 餐券奖励 */}
      <div className={`absolute ${SLOT_STYLE.tickets.className} z-10`}>
        <div className="mb-1 flex items-center justify-end gap-1 scale-90 md:scale-100 lg:scale-110 origin-top-right">
          {zoneStickerForSlot('tickets')}
          {tickets.length > 0 && (
            <span
              className="text-[9px] lg:text-[11px] font-bold bg-primary-container text-on-primary-container border border-ink/20 px-1.5 py-0.5 lg:px-2 tabular-nums"
              title={`${tickets.length} 张已收集`}
            >
              ×{tickets.length}
            </span>
          )}
        </div>
        <div
          className={`flex flex-wrap gap-1.5 lg:gap-2 justify-end max-h-[88px] md:max-h-[110px] lg:max-h-[150px] overflow-y-auto pr-0.5 ${
            tickets.length > 3 ? 'md:max-h-[120px] lg:max-h-[170px]' : ''
          }`}
        >
          {tickets.length > 0 ? (
            tickets.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <DeskStickerButton
                  item={item}
                  onClick={() => onItemClick?.(item)}
                  className={`p-1.5 lg:p-2 scale-95 md:scale-100 lg:scale-110 origin-top-right ${
                    tickets.length > 4 ? 'md:scale-95 lg:scale-100' : ''
                  }`}
                >
                  {itemStickerForKind(item.kind, item.reward_variant)}
                </DeskStickerButton>
              </motion.div>
            ))
          ) : (
            ticketPlaceholder && (
              <DeskStickerButton
                item={ticketPlaceholder}
                onClick={() => onItemClick?.(ticketPlaceholder)}
                className="p-1.5 opacity-70"
              >
                {itemStickerForKind('buddy_ticket', 'ticket')}
              </DeskStickerButton>
            )
          )}
        </div>
      </div>

      {/* 导师礼 */}
      <div className={`absolute ${SLOT_STYLE.mentor.className} z-10`}>
        <div className="mb-1 scale-90 md:scale-100 lg:scale-110 origin-bottom-left">
          {zoneStickerForSlot('mentor')}
        </div>
        <div className="flex flex-wrap gap-1.5 lg:gap-2">
          {mentors.map((item) => (
            <div key={item.id} className="scale-95 md:scale-100 lg:scale-110 origin-bottom-left">
              <DeskStickerButton
                item={item}
                onClick={() => onItemClick?.(item)}
                className="p-1 lg:p-1.5"
              >
                {itemStickerForKind(item.kind)}
              </DeskStickerButton>
            </div>
          ))}
        </div>
      </div>

      {/* 散落星星 */}
      {scattered.length > 0 && (
        <div className={`absolute ${SLOT_STYLE.star_scatter.className} z-10`}>
          <div className="flex flex-wrap gap-1.5 lg:gap-2 justify-center">
            {scattered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="scale-95 md:scale-100 lg:scale-110 origin-center">
                  <DeskStickerButton
                    item={item}
                    onClick={() => onItemClick?.(item)}
                    className="p-1 lg:p-1.5"
                  >
                    {itemStickerForKind('star_jar')}
                  </DeskStickerButton>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
