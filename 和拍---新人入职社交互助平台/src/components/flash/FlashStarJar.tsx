/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

export interface JarStar {
  id: string;
  x: number;
  y: number;
  rotate: number;
  scale: number;
}

/** 根据 id 生成稳定布局，避免星星重叠 */
export function layoutJarStars(count: number, seedPrefix = ''): JarStar[] {
  const stars: JarStar[] = [];
  const max = Math.min(count, 18);
  for (let i = 0; i < max; i += 1) {
    const hash = (seedPrefix + i).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    stars.push({
      id: `${seedPrefix}-${i}`,
      x: 12 + (hash % 56),
      y: 28 + ((hash * 7) % 42),
      rotate: (hash * 13) % 360,
      scale: 0.65 + (hash % 5) * 0.08,
    });
  }
  return stars;
}

function OrigamiStar({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      aria-hidden
    >
      <polygon
        points="12,2 15,9 22,9 16.5,14 18.5,22 12,17.5 5.5,22 7.5,14 2,9 9,9"
        fill="#fde047"
        stroke="#0f172a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <polygon
        points="12,6 13.5,10 17.5,10 14.5,12.5 15.5,17 12,14.5 8.5,17 9.5,12.5 6.5,10 10.5,10"
        fill="#fef08a"
        stroke="none"
      />
    </svg>
  );
}

interface FlashStarJarProps {
  stars: JarStar[];
  size?: 'sm' | 'lg';
  className?: string;
}

export default function FlashStarJar({
  stars,
  size = 'lg',
  className = '',
}: FlashStarJarProps) {
  const dim = size === 'lg' ? 'w-48 h-56' : 'w-28 h-32';

  return (
    <div className={`relative ${dim} ${className}`}>
      <svg
        viewBox="0 0 100 120"
        className="w-full h-full drop-shadow-md"
        aria-hidden
      >
        <defs>
          <clipPath id="jar-inner">
            <path d="M28 38 L72 38 L78 95 Q50 108 22 95 Z" />
          </clipPath>
        </defs>
        <ellipse cx="50" cy="34" rx="26" ry="8" fill="#e0f2fe" stroke="#0f172a" strokeWidth="2" />
        <path
          d="M28 38 L72 38 L78 95 Q50 108 22 95 Z"
          fill="rgba(224,242,254,0.55)"
          stroke="#0f172a"
          strokeWidth="2.5"
        />
        <path
          d="M32 42 L68 42 L73 92 Q50 102 27 92 Z"
          fill="rgba(255,255,255,0.35)"
          stroke="none"
        />
        <ellipse cx="50" cy="96" rx="22" ry="5" fill="rgba(15,23,42,0.08)" />
      </svg>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ clipPath: 'polygon(28% 32%, 72% 32%, 78% 79%, 50% 90%, 22% 79%)' }}
      >
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              transform: `rotate(${s.rotate}deg) scale(${s.scale})`,
            }}
          >
            <OrigamiStar className="w-5 h-5" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FlyingStar({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div className={className} style={style}>
      <OrigamiStar className="w-10 h-10 drop-shadow-neo" />
    </motion.div>
  );
}
