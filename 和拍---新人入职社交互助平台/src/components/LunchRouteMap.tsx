/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 午餐碰头 · 可交互平面路线图（简体中文）
 */

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { LunchRoadmapStep } from '../api/types';

type LunchRouteMapProps = {
  meetingPoint?: string;
  steps?: LunchRoadmapStep[];
  matchCode?: string;
};

function parseSeatLabel(meetingPoint?: string): string {
  if (!meetingPoint) return 'A15';
  const m = meetingPoint.match(/[A-Z]\d{1,3}/i);
  return m ? m[0].toUpperCase() : 'A15';
}

const DEFAULT_HINTS: Record<number, { title: string; hint: string }> = {
  1: {
    title: '从工位出发',
    hint: '收起电脑后前往 A 座，沿园区主通道向东步行约 3 分钟。',
  },
  2: {
    title: '进入 A 座大堂',
    hint: '在一层入口核对「园区食堂」导视，穿过大堂前往电梯厅。',
  },
  3: {
    title: '上行至 3 楼',
    hint: '乘坐电梯或走楼梯至 3F，出梯后跟随「休闲就餐区」指示牌。',
  },
  4: {
    title: '到达集合点',
    hint: '在指定座位附近等待，见到相同碰头暗号的搭子后入座交流。',
  },
};

export default function LunchRouteMap({
  meetingPoint,
  steps = [],
  matchCode,
}: LunchRouteMapProps) {
  const seat = parseSeatLabel(meetingPoint);
  const [activeStep, setActiveStep] = useState(1);

  const stepHints = useMemo(() => {
    const map = { ...DEFAULT_HINTS };
    for (const s of steps) {
      map[s.step] = { title: s.title, hint: s.detail };
    }
    if (map[4]) {
      map[4] = {
        title: map[4].title,
        hint: meetingPoint
          ? `${map[4].hint}（${meetingPoint}）`
          : map[4].hint,
      };
    }
    return map;
  }, [steps, meetingPoint]);

  const nodes = [
    { id: 1, label: '工位', sub: '出发', x: 56, y: 168 },
    { id: 2, label: 'A 座', sub: '1 楼大堂', x: 168, y: 168 },
    { id: 3, label: '3 楼', sub: '休闲区', x: 280, y: 96 },
    { id: 4, label: seat, sub: '集合点', x: 392, y: 96, dest: true },
  ];

  const pathD =
    'M 96 168 L 152 168 L 152 120 L 248 120 L 248 96 L 336 96';

  const current = stepHints[activeStep] ?? DEFAULT_HINTS[activeStep];

  const selectStep = (id: number) => setActiveStep(id);

  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-primary-container/80 shadow-neo overflow-hidden">
      <div className="px-3 py-2 border-b border-outline-variant/30 bg-white flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium text-slate-900 tracking-wide">
          园区食堂 · 平面示意
        </span>
        <span className="text-[9px] font-mono text-primary font-bold truncate max-w-[55%] text-right">
          {meetingPoint ?? '3 楼休闲区'}
        </span>
      </div>

      <svg
        viewBox="0 0 448 220"
        className="w-full h-auto block touch-none"
        role="application"
        aria-label="可点击的前往集合点路线图"
      >
        <defs>
          <pattern
            id="lunch-grid"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 16 0 L 0 0 0 16"
              fill="none"
              stroke="#c7d2fe"
              strokeWidth="0.5"
              opacity="0.6"
            />
          </pattern>
          <marker
            id="lunch-arrow"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="#ff5e4d" />
          </marker>
        </defs>

        <rect width="448" height="220" fill="url(#lunch-grid)" />

        <rect
          x="24"
          y="24"
          width="400"
          height="172"
          fill="#fff"
          stroke="#0f172a"
          strokeWidth="2"
        />
        <text
          x="44"
          y="48"
          fill="#94a3b8"
          style={{ fontSize: 9, fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}
        >
          A 座 · 园区食堂
        </text>

        <rect
          x="40"
          y="140"
          width="200"
          height="44"
          fill={activeStep >= 2 ? '#e0e7ff' : '#f8fafc'}
          stroke="#0f172a"
          strokeWidth="2"
        />
        <text x="52" y="166" fill="#312e81" style={{ fontSize: 10, fontWeight: 800 }}>
          1 楼 · 入口大堂
        </text>

        <rect
          x="240"
          y="56"
          width="168"
          height="88"
          fill={activeStep >= 3 ? '#eef2ff' : '#f8fafc'}
          stroke="#0f172a"
          strokeWidth="2"
        />
        <text x="252" y="78" fill="#312e81" style={{ fontSize: 10, fontWeight: 800 }}>
          3 楼 · 休闲就餐区
        </text>

        <rect
          x="258"
          y="108"
          width="88"
          height="22"
          fill="#fff"
          stroke="#0f172a"
          strokeWidth="1.5"
        />
        <text x="266" y="123" fill="#4f46e5" style={{ fontSize: 8, fontWeight: 700 }}>
          休闲就餐区 →
        </text>

        <path
          d={pathD}
          fill="none"
          stroke="#a5b4fc"
          strokeWidth="10"
          strokeLinecap="square"
        />
        <path
          d={pathD}
          fill="none"
          stroke="#ff5e4d"
          strokeWidth="3"
          strokeDasharray="8 6"
          strokeLinecap="square"
          markerEnd="url(#lunch-arrow)"
          opacity={1}
        />

        <g transform="translate(200, 128)">
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={i * 6}
              y={20 - i * 5}
              width={14}
              height={4}
              fill="#94a3b8"
              stroke="#0f172a"
              strokeWidth="1"
            />
          ))}
          <text x={0} y={38} fill="#64748b" style={{ fontSize: 7, fontWeight: 700 }}>
            上行
          </text>
        </g>

        {nodes.map((n) => {
          const selected = activeStep === n.id;
          const isDest = n.dest;
          const dotR = isDest ? 26 : selected ? 10 : 7;
          return (
            <g
              key={n.id}
              className="cursor-pointer"
              onClick={() => selectStep(n.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectStep(n.id);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`${n.label} · ${n.sub}`}
              aria-pressed={selected}
            >
              {selected && isDest && (
                <circle cx={n.x} cy={n.y} r={34} fill="#ff5e4d" opacity="0.12" />
              )}
              <circle
                cx={n.x}
                cy={n.y}
                r={isDest ? 34 : 18}
                fill="transparent"
              />
              {isDest ? (
                <>
                  <rect
                    x={n.x - 32}
                    y={n.y - 32}
                    width={64}
                    height={64}
                    rx={12}
                    fill={selected ? '#ff5e4d' : '#fff'}
                    stroke="#1b2838"
                    strokeWidth={selected ? 3 : 2}
                  />
                  <text
                    x={n.x}
                    y={n.y + 6}
                    textAnchor="middle"
                    fill={selected ? '#fff' : '#1b2838'}
                    style={{ fontSize: 14, fontWeight: 800 }}
                    pointerEvents="none"
                  >
                    {n.label}
                  </text>
                </>
              ) : (
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={dotR}
                  fill={selected ? '#ff5e4d' : '#fff'}
                  stroke="#1b2838"
                  strokeWidth={selected ? 2.5 : 2}
                />
              )}
              <text
                x={n.x}
                y={n.y + (isDest ? 44 : 22)}
                textAnchor="middle"
                fill="#1b2838"
                style={{ fontSize: 9, fontWeight: 700 }}
                pointerEvents="none"
              >
                {n.label}
              </text>
              <text
                x={n.x}
                y={n.y + (isDest ? 56 : 34)}
                textAnchor="middle"
                fill="#5c6b7a"
                style={{ fontSize: 8, fontWeight: 600 }}
                pointerEvents="none"
              >
                {n.sub}
              </text>
              {n.id === 1 && (
                <text
                  x={n.x}
                  y={n.y - 14}
                  textAnchor="middle"
                  fill={selected ? '#ff5e4d' : '#1b2838'}
                  style={{ fontSize: 8, fontWeight: 700 }}
                  pointerEvents="none"
                >
                  你在这
                </text>
              )}
            </g>
          );
        })}

        <polygon
          points="392,56 396,64 404,64 398,70 400,78 392,74 384,78 386,70 380,64 388,64"
          fill="#fbbf24"
          stroke="#0f172a"
          strokeWidth="1"
        />
      </svg>

      {/* 可点击站点模块 */}
      <div className="flex flex-wrap gap-2 px-3 py-2 border-t border-outline-variant/30 bg-white">
        {nodes.map((n) => {
          const selected = activeStep === n.id;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => selectStep(n.id)}
              aria-pressed={selected}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold rounded-full border-2 border-ink transition-all min-h-[36px] ${
                selected
                  ? 'bg-primary text-on-primary shadow-[2px_2px_0_#1b2838]'
                  : 'bg-surface text-on-surface hover:bg-primary-container'
              }`}
            >
              {n.label}
              <span className="text-on-surface-variant font-normal">· {n.sub}</span>
            </button>
          );
        })}
      </div>

      {/* 当前站点说明 */}
      <div className="px-3 py-3 border-t border-outline-variant/30 bg-white space-y-2">
        <div className="flex items-start gap-2">
          <span
            className="shrink-0 w-2 h-2 mt-1.5 rounded-full bg-primary"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-900">{current?.title}</p>
            <p className="text-[10px] text-slate-600 leading-relaxed mt-1">
              {current?.hint}
            </p>
          </div>
        </div>
        {activeStep === 4 && matchCode && (
          <p className="text-[10px] font-mono text-indigo-700 bg-primary-container border border-primary-container px-2 py-1.5">
            碰头暗号：<span className="font-medium">{matchCode}</span>，请向搭子出示
          </p>
        )}
        <div className="flex gap-2">
          {activeStep > 1 && (
            <button
              type="button"
              onClick={() => setActiveStep((s) => Math.max(1, s - 1))}
              className="neo-button flex-1 py-2 text-[10px] font-medium flex items-center justify-center gap-1 min-h-[40px]"
            >
              <ChevronLeft size={14} />
              上一步
            </button>
          )}
          {activeStep < 4 && (
            <button
              type="button"
              onClick={() => setActiveStep((s) => Math.min(4, s + 1))}
              className="neo-button-primary flex-1 py-2 text-[10px] font-medium flex items-center justify-center gap-1 min-h-[40px]"
            >
              下一步
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
