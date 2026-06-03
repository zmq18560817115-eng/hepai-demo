/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 午餐碰头 · 可点击附近商家（简体中文）
 */

import React, { useState } from 'react';
import { Check, Copy, MapPinned } from 'lucide-react';
import type { LunchMerchant } from '../api/types';

type LunchNearbyMerchantsProps = {
  merchants: LunchMerchant[];
  matchCode?: string;
  meetingPoint?: string;
};

export default function LunchNearbyMerchants({
  merchants,
  matchCode,
  meetingPoint,
}: LunchNearbyMerchantsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    merchants[0]?.id ?? null,
  );
  const [copied, setCopied] = useState(false);

  const selected = merchants.find((m) => m.id === selectedId) ?? merchants[0];

  const needsCode = selected?.perk.includes('暗号');

  const handleCopyCode = async () => {
    if (!matchCode) return;
    try {
      await navigator.clipboard.writeText(matchCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (merchants.length === 0) {
    return (
      <p className="text-[10px] text-slate-400 text-center py-4">暂无推荐商家</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {merchants.map((m) => {
          const active = m.id === selectedId;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedId(m.id)}
              aria-pressed={active}
              className={`text-left p-3 rounded-2xl border border-outline-variant/40 transition-all min-h-[44px] ${
                active
                  ? 'bg-primary text-white shadow-neo'
                  : 'bg-primary-container text-slate-900 hover:bg-indigo-100 shadow-neo'
              }`}
            >
              <p className="text-xs font-medium">{m.name}</p>
              <p
                className={`text-[10px] font-mono mt-0.5 ${
                  active ? 'text-on-primary' : 'text-slate-500'
                }`}
              >
                {m.category} · 步行约 {m.distance_m} 米
              </p>
              <p
                className={`text-[10px] font-bold mt-1 ${
                  active ? 'text-on-primary' : 'text-indigo-700'
                }`}
              >
                {m.perk}
              </p>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="p-4 rounded-2xl border border-outline-variant/40 bg-white shadow-neo space-y-3">
          <div className="flex items-start gap-2">
            <MapPinned
              size={18}
              className="text-primary shrink-0 mt-0.5"
              strokeWidth={2.5}
            />
            <div>
              <p className="text-xs font-medium text-slate-900">
                已选：{selected.name}
              </p>
              <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                建议先前往集合点
                {meetingPoint ? `（${meetingPoint}）` : ''}
                与搭子碰头，再步行约 {selected.distance_m} 米到该店用餐。
              </p>
            </div>
          </div>

          <div className="p-2.5 bg-primary-container border border-primary-container">
            <p className="text-[10px] font-medium text-indigo-900">到店优惠</p>
            <p className="text-[10px] text-indigo-800 mt-0.5">{selected.perk}</p>
          </div>

          {needsCode && matchCode && (
            <button
              type="button"
              onClick={() => void handleCopyCode()}
              className="neo-button w-full py-2.5 text-[10px] font-medium flex items-center justify-center gap-2 min-h-[44px]"
            >
              {copied ? (
                <>
                  <Check size={14} />
                  已复制暗号
                </>
              ) : (
                <>
                  <Copy size={14} />
                  复制碰头暗号 {matchCode}
                </>
              )}
            </button>
          )}

          {!needsCode && (
            <p className="text-[10px] text-slate-500 text-center">
              向店员说明「和拍午餐搭子」即可享优惠
            </p>
          )}
        </div>
      )}
    </div>
  );
}
