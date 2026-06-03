/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 园区板块地图 · 仅展示点位与地点名称
 */

import React, { useId, useMemo } from 'react';
import type { LunchVenue } from '../api/types';

type MapTheme = 'indigo' | 'emerald';

type SceneVenuePickerProps = {
  venues: LunchVenue[];
  selectedId: string;
  onSelect: (venue: LunchVenue) => void;
  disabled?: boolean;
  theme?: MapTheme;
};

type MapPoint = {
  x: number;
  y: number;
  nameX: number;
  nameY: number;
  textAnchor: 'start' | 'middle' | 'end';
};

const VENUE_MAP_POINTS: Record<string, MapPoint> = {
  'venue-1': { x: 128, y: 78, nameX: 128, nameY: 58, textAnchor: 'middle' },
  'venue-2': { x: 128, y: 148, nameX: 52, nameY: 152, textAnchor: 'end' },
  'spot-book': { x: 108, y: 218, nameX: 108, nameY: 238, textAnchor: 'middle' },
  'spot-interest': { x: 168, y: 118, nameX: 168, nameY: 138, textAnchor: 'middle' },
  'spot-lawn': { x: 248, y: 208, nameX: 248, nameY: 188, textAnchor: 'middle' },
  'spot-activity': { x: 318, y: 138, nameX: 318, nameY: 158, textAnchor: 'middle' },
  'spot-coffee': { x: 348, y: 78, nameX: 348, nameY: 58, textAnchor: 'middle' },
  'spot-gym': { x: 358, y: 218, nameX: 358, nameY: 238, textAnchor: 'middle' },
};

const FALLBACK_RING: MapPoint[] = [
  { x: 88, y: 88, nameX: 88, nameY: 68, textAnchor: 'middle' },
  { x: 392, y: 88, nameX: 392, nameY: 68, textAnchor: 'middle' },
  { x: 88, y: 212, nameX: 88, nameY: 232, textAnchor: 'middle' },
  { x: 392, y: 212, nameX: 392, nameY: 232, textAnchor: 'middle' },
];

const THEME_ACCENT: Record<MapTheme, string> = {
  indigo: '#ff5e4d',
  emerald: '#059669',
};

function resolvePoint(venueId: string, index: number): MapPoint {
  return VENUE_MAP_POINTS[venueId] ?? FALLBACK_RING[index % FALLBACK_RING.length];
}

/** 估算标签宽度，用于选中高亮框 */
function estimateLabelBox(
  name: string,
  anchor: MapPoint['textAnchor'],
  x: number,
  y: number,
) {
  const w = Math.min(200, Math.max(88, name.length * 11 + 20));
  const h = 22;
  let left = x - w / 2;
  if (anchor === 'start') left = x - 4;
  if (anchor === 'end') left = x - w + 4;
  const top = y - 14;
  return { x: left, y: top, w, h };
}

export default function SceneVenuePicker({
  venues,
  selectedId,
  onSelect,
  disabled,
  theme = 'indigo',
}: SceneVenuePickerProps) {
  const uid = useId().replace(/:/g, '');
  const accent = THEME_ACCENT[theme];

  const points = useMemo(
    () => venues.map((v, i) => ({ venue: v, point: resolvePoint(v.id, i) })),
    [venues],
  );

  return (
    <div className="border-b border-outline-variant/30 p-3 sm:p-4 bg-[#faf6f0]">
      <p className="mb-2 text-center text-xs font-bold text-slate-600 tracking-wide">
        点击地图上的地点开始匹配
      </p>
      <div className="rounded-2xl border-2 border-[#1b2838] bg-white overflow-hidden shadow-neo-sm">
        <svg
          viewBox="0 0 480 280"
          className="w-full h-[min(78vw,400px)] min-h-[300px] sm:min-h-[360px] block"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="园区地图，点击地点名称或点位进行匹配"
        >
          <defs>
            <pattern
              id={`scene-grid-${uid}`}
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="0.75"
              />
            </pattern>
          </defs>

          <rect width="480" height="280" fill={`url(#scene-grid-${uid})`} />
          <rect
            x="16"
            y="16"
            width="448"
            height="248"
            fill="#f8fafc"
            stroke="#94a3b8"
            strokeWidth="2"
            rx="4"
          />

          <rect
            x="40"
            y="40"
            width="168"
            height="200"
            fill="#fff"
            stroke="#64748b"
            strokeWidth="2"
            rx="3"
          />
          <rect
            x="272"
            y="40"
            width="168"
            height="118"
            fill="#fff"
            stroke="#64748b"
            strokeWidth="2"
            rx="3"
          />
          <rect
            x="272"
            y="168"
            width="168"
            height="72"
            fill="#fff"
            stroke="#64748b"
            strokeWidth="2"
            rx="3"
          />

          <text
            x="124"
            y="34"
            textAnchor="middle"
            fill="#64748b"
            style={{ fontSize: 11, fontWeight: 700 }}
          >
            A 座
          </text>
          <text
            x="356"
            y="34"
            textAnchor="middle"
            fill="#64748b"
            style={{ fontSize: 11, fontWeight: 700 }}
          >
            B / C 座
          </text>

          {points.map(({ venue, point }) => {
            const active = venue.id === selectedId;
            const labelBox = estimateLabelBox(
              venue.name,
              point.textAnchor,
              point.nameX,
              point.nameY,
            );

            return (
              <g
                key={venue.id}
                className={disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                style={{ opacity: disabled ? 0.5 : 1 }}
                onClick={() => !disabled && onSelect(venue)}
                onKeyDown={(e) => {
                  if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelect(venue);
                  }
                }}
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-label={`${venue.name}，点击匹配`}
                aria-pressed={active}
              >
                <circle cx={point.x} cy={point.y} r={32} fill="transparent" />

                {active && (
                  <rect
                    x={labelBox.x - 6}
                    y={labelBox.y - 6}
                    width={labelBox.w + 12}
                    height={labelBox.h + 28}
                    rx={10}
                    fill="#ffe8e4"
                    stroke={accent}
                    strokeWidth={3}
                  />
                )}

                <circle
                  cx={point.x}
                  cy={point.y}
                  r={active ? 10 : 8}
                  fill={active ? accent : '#fff'}
                  stroke="#1b2838"
                  strokeWidth={active ? 3 : 2.5}
                />
                <text
                  x={point.nameX}
                  y={point.nameY}
                  textAnchor={point.textAnchor}
                  fill={active ? accent : '#1e293b'}
                  stroke="#fff"
                  strokeWidth={4}
                  paintOrder="stroke"
                  pointerEvents="none"
                  style={{ fontSize: 12, fontWeight: active ? 900 : 800 }}
                >
                  {venue.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
