/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';

const PALETTE = ['#1677ff', '#ff5e4d', '#0d9488', '#8b5cf6', '#f59e0b', '#ec4899'];

function initialsFromName(name: string): string {
  const cleaned = name.replace(/\s+/g, '').replace(/老师|经理/g, '');
  if (/[\u4e00-\u9fa5]/.test(cleaned)) {
    if (cleaned.length >= 2) return cleaned.slice(-2);
    return cleaned.slice(0, 1);
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function avatarUrlForName(name: string, seed = 0): string {
  const bg = PALETTE[seed % PALETTE.length].replace('#', '');
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name,
  )}&background=${bg}&color=ffffff&size=128&bold=true&format=png`;
}

type MemberAvatarProps = {
  name: string;
  seed?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ring?: boolean;
};

const SIZE_CLASS = {
  sm: 'w-10 h-10 text-xs rounded-lg',
  md: 'w-14 h-14 text-sm rounded-xl',
  lg: 'w-16 h-16 text-base rounded-xl',
};

export default function MemberAvatar({
  name,
  seed = 0,
  size = 'md',
  className = '',
  ring = false,
}: MemberAvatarProps) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => avatarUrlForName(name, seed), [name, seed]);
  const initials = initialsFromName(name);
  const bg = PALETTE[seed % PALETTE.length];

  const ringClass = ring
    ? 'ring-2 ring-white border-2 border-[#1b2838]'
    : 'border-2 border-[#1b2838]';

  if (failed) {
    return (
      <div
        className={`${SIZE_CLASS[size]} ${ringClass} shrink-0 flex items-center justify-center font-bold text-white ${className}`}
        style={{ backgroundColor: bg }}
        title={name}
        aria-hidden
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      title={name}
      onError={() => setFailed(true)}
      className={`${SIZE_CLASS[size]} ${ringClass} shrink-0 object-cover bg-[#f5f6f8] ${className}`}
    />
  );
}
