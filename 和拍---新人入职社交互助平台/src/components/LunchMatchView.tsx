/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  MapPin,
  Users,
  Puzzle,
  CheckCircle2,
  Search,
  Lock,
} from 'lucide-react';
import { hepaiApi } from '../api/hepaiApi';
import type { LunchStatusResponse } from '../api/types';
import { usePrototype } from '../context/PrototypeContext';

interface LunchMatchViewProps {
  onBack: () => void;
}

type UiStatus = 'idle' | 'matching' | 'success';

function toUiStatus(api: LunchStatusResponse['status']): UiStatus {
  if (api === 'pending') return 'matching';
  if (api === 'matched') return 'success';
  return 'idle';
}

export default function LunchMatchView({ onBack }: LunchMatchViewProps) {
  const { persona } = usePrototype();
  const [venueName, setVenueName] = useState('园区食堂 · 3F 休闲区');
  const [activeCount, setActiveCount] = useState(0);
  const [defaultVenueId, setDefaultVenueId] = useState<string | undefined>();
  const [matchStatus, setMatchStatus] = useState<UiStatus>('idle');
  const [matchDetail, setMatchDetail] = useState<LunchStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const applyStatus = useCallback(
    (res: LunchStatusResponse) => {
      setMatchDetail(res);
      setMatchStatus(toUiStatus(res.status));
      if (res.status === 'matched' || res.status === 'cancelled') {
        stopPolling();
      }
    },
    [stopPolling],
  );

  const refreshStatus = useCallback(async () => {
    const res = await hepaiApi.getLunchStatus();
    applyStatus(res);
    return res;
  }, [applyStatus]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [venues, status] = await Promise.all([
          hepaiApi.getLunchVenues(),
          hepaiApi.getLunchStatus(),
        ]);
        if (cancelled) return;
        const v = venues.venues[0];
        if (v) {
          setVenueName(v.name);
          setActiveCount(v.active_buddies_count);
        }
        setDefaultVenueId(venues.default_venue_id);
        applyStatus(status);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '加载失败');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [applyStatus, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(() => {
      refreshStatus().catch(() => {});
    }, 2000);
  }, [refreshStatus, stopPolling]);

  const startMatch = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await hepaiApi.postLunchMatch(defaultVenueId);
      setMatchStatus('matching');
      startPolling();
      await refreshStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : '发起匹配失败');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelMatch = async () => {
    setSubmitting(true);
    try {
      await hepaiApi.deleteLunchMatch();
      stopPolling();
      setMatchDetail(null);
      setMatchStatus('idle');
    } catch (e) {
      setError(e instanceof Error ? e.message : '取消失败');
    } finally {
      setSubmitting(false);
    }
  };

  const matchingTags =
    matchDetail?.matching_tags ??
    persona?.tags ??
    [];

  const matchCode = matchDetail?.match_code ?? '—';
  const meetingPoint = matchDetail?.meeting_point ?? '待通知';

  if (loading) {
    return (
      <p className="text-center text-slate-500 text-sm py-12 font-mono">加载中…</p>
    );
  }

  return (
    <div className="max-w-full mx-auto py-2">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors min-h-[44px]"
      >
        <ArrowLeft size={18} />
        返回安全屋
      </button>

      {error && (
        <p className="mb-4 text-rose-600 text-xs font-mono text-center">{error}</p>
      )}

      <div className="bg-white border-2 border-slate-900 shadow-neo-lg overflow-hidden">
        <div className="h-36 bg-indigo-50 relative overflow-hidden flex items-center justify-center border-b-2 border-slate-900">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="relative z-10 bg-white border-2 border-slate-900 px-6 py-3 flex items-center gap-3 shadow-neo">
            <MapPin className="text-indigo-600" strokeWidth={3} />
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                {venueName}
              </h4>
              <p className="text-[10px] text-slate-400 font-mono font-bold uppercase">
                在线 {activeCount} 人
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                午餐匹配
              </label>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                午餐拼图寻宝
              </h2>
              {persona && (
                <p className="text-slate-500 text-[10px] font-mono">
                  将按面具标签匹配：{persona.tags.slice(0, 2).join(' · ')}
                </p>
              )}
            </div>
            <div className="w-16 h-16 bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-white shadow-neo">
              <Puzzle size={32} strokeWidth={3} />
            </div>
          </div>

          {matchStatus === 'idle' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 border-2 border-slate-900 bg-white flex items-center gap-4 shadow-neo">
                  <Users size={20} strokeWidth={3} />
                  <div>
                    <h4 className="text-xs font-black uppercase">寻求搭子</h4>
                    <p className="text-[10px] font-mono text-slate-400">按面具标签匹配</p>
                  </div>
                </div>
                <div className="p-4 border-2 border-slate-900 bg-indigo-50 flex items-center gap-4 shadow-neo">
                  <Lock size={20} strokeWidth={3} />
                  <div>
                    <h4 className="text-xs font-black uppercase">完全匿名</h4>
                    <p className="text-[10px] font-mono text-indigo-600">仅展示虚拟称号</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={startMatch}
                className="neo-button-primary w-full py-4 flex items-center justify-center gap-3 min-h-[44px] disabled:opacity-50"
              >
                <Search size={22} strokeWidth={3} />
                {submitting ? '提交中…' : '一键派发盲盒碎片'}
              </button>
            </div>
          )}

          {matchStatus === 'matching' && (
            <div className="flex flex-col items-center py-10">
              <div className="w-24 h-24 relative mb-6">
                <motion.div
                  className="absolute inset-0 border-8 border-indigo-600 border-t-slate-100"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-slate-900">
                  <Puzzle size={40} strokeWidth={3} />
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase">匹配中…</h3>
              <p className="text-slate-500 font-mono text-[10px] font-bold mt-2">
                匹配标签：{matchingTags.join(' · ') || '默认'}
              </p>
              <button
                type="button"
                onClick={cancelMatch}
                disabled={submitting}
                className="mt-6 text-[10px] font-mono text-slate-400 underline"
              >
                取消匹配
              </button>
            </div>
          )}

          {matchStatus === 'success' && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6"
            >
              <div className="p-6 bg-indigo-600 border-4 border-slate-900 text-center space-y-4 shadow-neo-lg">
                <CheckCircle2
                  size={48}
                  className="text-emerald-400 mx-auto"
                  strokeWidth={3}
                />
                <h3 className="text-2xl font-black text-white uppercase">匹配成功</h3>
                <div className="bg-slate-900 p-4 border-2 border-indigo-400 inline-block shadow-neo">
                  <div className="text-[10px] font-black text-indigo-400 uppercase mb-1">
                    碰头暗号
                  </div>
                  <div className="text-4xl font-mono font-black text-white">{matchCode}</div>
                </div>
                <p className="text-[11px] font-bold text-indigo-100 leading-relaxed">
                  请到 <span className="bg-white text-indigo-600 px-1">{meetingPoint}</span>{' '}
                  寻找同暗号的小伙伴
                </p>
                {matchDetail?.partner_persona && (
                  <p className="text-[10px] text-indigo-200 font-mono">
                    对方面具：{matchDetail.partner_persona.name}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="neo-button-primary flex-1 py-3 text-xs min-h-[44px]"
                >
                  确认前往
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={cancelMatch}
                  className="neo-button flex-1 py-3 text-xs min-h-[44px]"
                >
                  暂时放弃
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-slate-900 text-white border-2 border-slate-900 flex items-start gap-3 shadow-neo">
        <Lock size={20} className="text-indigo-400 shrink-0" />
        <p className="text-[10px] text-slate-300 leading-relaxed">
          见面前双方仅可见虚拟面具称号；线下确认投缘后可申请解锁花名。
        </p>
      </div>
    </div>
  );
}
