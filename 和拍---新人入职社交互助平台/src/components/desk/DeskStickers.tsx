/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 工位桌面贴画（无文字标签，hover 显示说明）
 */

import React from 'react';
import type { DeskItemKind, DeskRewardVariant } from '../../api/types';

type StickerProps = { size?: number; className?: string };

/** 区域角标贴画 */
export function ZoneHonorSticker({ size = 28, className = '' }: StickerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <circle cx="16" cy="16" r="14" fill="#fef3c7" stroke="#0f172a" strokeWidth="2" />
      <path
        d="M16 6 L19 13 L26 14 L21 19 L22 26 L16 22 L10 26 L11 19 L6 14 L13 13 Z"
        fill="#fbbf24"
        stroke="#0f172a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ZoneJarSticker({ size = 28, className = '' }: StickerProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <ellipse cx="16" cy="10" rx="10" ry="4" fill="#e0f2fe" stroke="#0f172a" strokeWidth="1.5" />
      <path
        d="M8 12 L24 12 L26 24 Q16 28 6 24 Z"
        fill="rgba(224,242,254,0.9)"
        stroke="#0f172a"
        strokeWidth="2"
      />
      <polygon
        points="14,18 16,14 18,18 17,22 15,22"
        fill="#fde047"
        stroke="#0f172a"
        strokeWidth="1"
      />
    </svg>
  );
}

export function ZoneTicketSticker({ size = 28, className = '' }: StickerProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        d="M6 10 H26 V22 H6 Z M6 14 H4 V18 H6"
        fill="#fce7f3"
        stroke="#0f172a"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="16" r="3" fill="#ec4899" stroke="#0f172a" strokeWidth="1.5" />
    </svg>
  );
}

export function ZoneMentorSticker({ size = 28, className = '' }: StickerProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="8" y="14" width="16" height="12" fill="#d1fae5" stroke="#0f172a" strokeWidth="2" />
      <path d="M8 14 L16 8 L24 14" fill="#6ee7b7" stroke="#0f172a" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 8 V6" stroke="#0f172a" strokeWidth="2" />
      <circle cx="16" cy="5" r="2" fill="#f472b6" stroke="#0f172a" strokeWidth="1" />
    </svg>
  );
}

export function MonitorSticker({ size = 40, className = '' }: StickerProps) {
  return (
    <svg width={size} height={size * 0.65} viewBox="0 0 48 32" className={className} aria-hidden>
      <rect x="4" y="4" width="40" height="22" rx="1" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
      <rect x="8" y="8" width="32" height="14" fill="#312e81" />
      <rect x="18" y="28" width="12" height="3" fill="#64748b" stroke="#0f172a" strokeWidth="1" />
    </svg>
  );
}

export function MaskSticker({ size = 32, className = '' }: StickerProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <ellipse cx="16" cy="18" rx="11" ry="9" fill="#c7d2fe" stroke="#0f172a" strokeWidth="2" />
      <ellipse cx="12" cy="16" rx="2" ry="3" fill="#0f172a" />
      <ellipse cx="20" cy="16" rx="2" ry="3" fill="#0f172a" />
      <path d="M12 22 Q16 25 20 22" fill="none" stroke="#0f172a" strokeWidth="1.5" />
    </svg>
  );
}

function HonorItemSticker({ size = 40 }: StickerProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden>
      <rect x="2" y="2" width="32" height="32" fill="#fff" stroke="#0f172a" strokeWidth="2" />
      <circle cx="18" cy="14" r="8" fill="#fef3c7" stroke="#0f172a" strokeWidth="1.5" />
      <path
        d="M18 8 L20 13 L25 13 L21 16 L22 21 L18 18 L14 21 L15 16 L11 13 L16 13 Z"
        fill="#f59e0b"
        stroke="#0f172a"
        strokeWidth="1"
      />
      <rect x="8" y="24" width="20" height="4" rx="1" fill="#e2e8f0" />
    </svg>
  );
}

function TicketItemSticker({ size = 44 }: StickerProps) {
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 40 22" aria-hidden>
      <path
        d="M2 4 H38 V18 H2 Z M2 9 H0 V13 H2 M38 9 H40 V13 H38"
        fill="#fdf2f8"
        stroke="#0f172a"
        strokeWidth="2"
      />
      <circle cx="30" cy="11" r="4" fill="#f472b6" stroke="#0f172a" strokeWidth="1.5" />
    </svg>
  );
}

function GiftItemSticker({ size = 40 }: StickerProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden>
      <rect x="6" y="16" width="24" height="16" fill="#bbf7d0" stroke="#0f172a" strokeWidth="2" />
      <path d="M6 16 L18 8 L30 16" fill="#4ade80" stroke="#0f172a" strokeWidth="2" />
      <rect x="16" y="8" width="4" height="24" fill="#f472b6" stroke="#0f172a" strokeWidth="1.5" />
    </svg>
  );
}

function StarScatterSticker({ size = 36 }: StickerProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <polygon
        points="16,4 19,12 28,12 21,17 24,26 16,21 8,26 11,17 4,12 13,12"
        fill="#fde047"
        stroke="#0f172a"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BadgeItemSticker({ size = 40 }: StickerProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden>
      <circle cx="18" cy="18" r="14" fill="#dbeafe" stroke="#0f172a" strokeWidth="2" />
      <path
        d="M18 8 L20 15 L27 16 L22 20 L24 27 L18 23 L12 27 L14 20 L9 16 L16 15 Z"
        fill="#38bdf8"
        stroke="#0f172a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PerkItemSticker({ size = 40 }: StickerProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden>
      <rect x="4" y="10" width="28" height="18" rx="2" fill="#ffedd5" stroke="#0f172a" strokeWidth="2" />
      <text x="18" y="23" textAnchor="middle" fill="#ea580c" style={{ fontSize: 10, fontWeight: 900 }}>
        惠
      </text>
    </svg>
  );
}

export function itemStickerForKind(
  kind: DeskItemKind,
  variant?: DeskRewardVariant,
) {
  switch (kind) {
    case 'honor':
      return <HonorItemSticker />;
    case 'buddy_ticket':
      if (variant === 'badge') return <BadgeItemSticker />;
      if (variant === 'perk') return <PerkItemSticker />;
      return <TicketItemSticker />;
    case 'mentor_reward':
      return <GiftItemSticker />;
    case 'star_jar':
    default:
      return <StarScatterSticker />;
  }
}

export function zoneStickerForSlot(
  slot: 'honor' | 'jar' | 'tickets' | 'mentor',
) {
  switch (slot) {
    case 'honor':
      return <ZoneHonorSticker />;
    case 'jar':
      return <ZoneJarSticker />;
    case 'tickets':
      return <ZoneTicketSticker />;
    case 'mentor':
      return <ZoneMentorSticker />;
  }
}
