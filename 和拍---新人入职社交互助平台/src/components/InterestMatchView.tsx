/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Puzzle,
  CheckCircle2,
  Lock,
  Route,
  Store,
  RotateCcw,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { hepaiApi } from '../api/hepaiApi';
import type { LunchStatusResponse, LunchVenue } from '../api/types';
import { usePrototype } from '../context/PrototypeContext';
import LunchRouteMap from './LunchRouteMap';
import LunchNearbyMerchants from './LunchNearbyMerchants';
import SceneVenuePicker from './SceneVenuePicker';

interface InterestMatchViewProps {
  onBack: () => void;
}

type UiPhase = 'idle' | 'matching' | 'success' | 'navigate';

function toUiPhase(res: LunchStatusResponse): UiPhase {
  if (res.status === 'pending') return 'matching';
  if (res.status === 'matched') {
    return res.confirmed ? 'navigate' : 'success';
  }
  return 'idle';
}

export default function InterestMatchView({ onBack }: InterestMatchViewProps) {
  const { persona } = usePrototype();
  const [myInterests, setMyInterests] = useState<string[]>([]);
  const [venues, setVenues] = useState<LunchVenue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState('spot-interest');
  const [phase, setPhase] = useState<UiPhase>('idle');
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
      setPhase(toUiPhase(res));
      if (
        res.status === 'matched' ||
        res.status === 'cancelled' ||
        res.confirmed
      ) {
        stopPolling();
      }
    },
    [stopPolling],
  );

  const refreshStatus = useCallback(async () => {
    const res = await hepaiApi.getInterestStatus();
    applyStatus(res);
    return res;
  }, [applyStatus]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [venues, status, workplace] = await Promise.all([
          hepaiApi.getInterestVenues(),
          hepaiApi.getInterestStatus(),
          hepaiApi.getWorkplace().catch(() => null),
        ]);
        if (cancelled) return;
        setMyInterests(workplace?.employee?.interests ?? []);
        setVenues(venues.venues);
        const defaultId = venues.default_venue_id ?? venues.venues[0]?.id;
        if (defaultId) setSelectedVenueId(defaultId);
        if (status.venue_id) setSelectedVenueId(status.venue_id);
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

  const selectedVenue =
    venues.find((v) => v.id === selectedVenueId) ?? venues[0];

  const startMatch = async (venueId?: string) => {
    const vId = venueId ?? selectedVenueId;
    if (!vId) {
      setError('请先选择附近场景');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await hepaiApi.postInterestMatch(vId);
      setPhase('matching');
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
      await hepaiApi.deleteInterestMatch();
      stopPolling();
      setMatchDetail(null);
      setPhase('idle');
    } catch (e) {
      setError(e instanceof Error ? e.message : '取消失败');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmNavigate = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await hepaiApi.confirmInterestMatch();
      applyStatus(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : '确认失败');
    } finally {
      setSubmitting(false);
    }
  };

  const backToMatchResult = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await hepaiApi.backInterestMatch();
      applyStatus(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : '返回失败');
    } finally {
      setSubmitting(false);
    }
  };

  const rematchBuddy = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await hepaiApi.deleteInterestMatch();
      stopPolling();
      setMatchDetail(null);
      setPhase('idle');
    } catch (e) {
      setError(e instanceof Error ? e.message : '重新匹配失败');
    } finally {
      setSubmitting(false);
    }
  };

  const matchingTags =
    matchDetail?.matching_tags?.length
      ? matchDetail.matching_tags
      : myInterests.length > 0
        ? myInterests
        : persona?.hiddenPreferences ?? [];

  const matchCode = matchDetail?.match_code ?? '—';
  const meetingPoint = matchDetail?.meeting_point ?? '待通知';
  const partner = matchDetail?.partner_persona;

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
        className="mb-4 flex items-center gap-2 text-slate-500 hover:text-success font-bold transition-colors min-h-[44px]"
      >
        <ArrowLeft size={18} />
        返回蹭饭地图
      </button>

      {error && (
        <p className="mb-4 text-rose-600 text-xs font-mono text-center">{error}</p>
      )}

      <div className="bg-white rounded-2xl border border-outline-variant/40 shadow-neo-lg overflow-hidden">
        {venues.length > 0 && (
          <SceneVenuePicker
            theme="emerald"
            venues={venues}
            selectedId={selectedVenueId}
            disabled={submitting || phase !== 'idle'}
            onSelect={(v) => {
              setSelectedVenueId(v.id);
              void startMatch(v.id);
            }}
          />
        )}

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-success tracking-wide">
                兴趣匹配
              </label>
              <h2 className="text-2xl font-medium text-slate-900 tracking-tight">
                兴趣拼图寻宝
              </h2>
              <p className="text-slate-500 text-[10px] font-mono">
                {selectedVenue
                  ? `已选场景：${selectedVenue.name}`
                  : '请选择附近场景'}
                {selectedVenue?.waiting_count
                  ? ` · ${selectedVenue.waiting_count} 人也在等`
                  : ''}
              </p>
              <p className="text-slate-400 text-[10px] font-mono">
                爱好辅助：
                {matchingTags.slice(0, 3).join(' · ') || '完成盲盒后生成'}
              </p>
            </div>
            <div className="w-16 h-16 bg-success rounded-2xl border border-outline-variant/40 flex items-center justify-center text-white shadow-neo">
              <Puzzle size={32} strokeWidth={3} />
            </div>
          </div>

          {phase === 'idle' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <button
                  type="button"
                  onClick={() => void startMatch()}
                  disabled={submitting || !selectedVenueId}
                  className="p-4 rounded-2xl border border-outline-variant/40 bg-white flex items-center gap-4 shadow-neo w-full text-left hover:bg-success-container/60 transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  <Heart size={20} strokeWidth={3} className="text-success" />
                  <div className="flex-1">
                    <h4 className="text-xs font-medium">寻求兴趣搭子</h4>
                    <p className="text-[10px] font-mono text-slate-400">
                      {submitting
                        ? '匹配提交中…'
                        : '同场景匹配 · 共同爱好辅助'}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" strokeWidth={3} />
                </button>
              </div>
            </div>
          )}

          {phase === 'matching' && (
            <div className="flex flex-col items-center py-10">
              <div className="w-24 h-24 relative mb-6">
                <motion.div
                  className="absolute inset-0 border-8 border-emerald-600 border-t-slate-100"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-slate-900">
                  <Puzzle size={40} strokeWidth={3} />
                </div>
              </div>
              <h3 className="text-xl font-medium text-slate-800">匹配中…</h3>
              <p className="text-slate-500 font-mono text-[10px] font-bold mt-2">
                {matchDetail?.venue_name
                  ? `场景：${matchDetail.venue_name}`
                  : selectedVenue?.name ?? '匹配中'}
              </p>
              <p className="text-slate-400 font-mono text-[10px] mt-1">
                {matchingTags.length > 0
                  ? matchingTags.join(' · ')
                  : '等待同场景搭子'}
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

          {phase === 'success' && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6"
            >
              <div className="p-6 bg-success rounded-2xl border-2 border-outline-variant/50 text-center space-y-4 shadow-neo-lg">
                <CheckCircle2
                  size={48}
                  className="text-emerald-400 mx-auto"
                  strokeWidth={3}
                />
                <h3 className="text-2xl font-medium text-white">匹配成功</h3>
                <div className="bg-inverse-surface p-4 border-2 border-success inline-block shadow-neo">
                  <div className="text-[10px] font-medium text-emerald-400 mb-1">
                    碰头暗号
                  </div>
                  <div className="text-4xl font-mono font-medium text-white">{matchCode}</div>
                </div>
                <p className="text-[11px] font-bold text-emerald-100 leading-relaxed">
                  请到 <span className="bg-white text-success px-1">{meetingPoint}</span>{' '}
                  寻找同暗号的小伙伴
                </p>
                {partner && (
                  <div className="text-left bg-success-container0/40 border border-emerald-300 p-3 space-y-1">
                    <p className="text-[10px] text-emerald-200 font-mono">
                      对方面具：{partner.name}
                    </p>
                    {partner.affinity_label && (
                      <p className="text-[10px] text-white font-bold">
                        {partner.affinity_label}
                        {partner.common_tags && partner.common_tags.length > 0
                          ? ` · 共同爱好 ${partner.common_tags.join('、')}`
                          : ''}
                      </p>
                    )}
                    <p className="text-[9px] text-emerald-200 font-mono">
                      爱好：{partner.tags.slice(0, 3).join(' · ')}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void confirmNavigate()}
                    className="neo-button-primary flex-1 py-3 text-xs min-h-[44px] disabled:opacity-50"
                  >
                    {submitting ? '生成路线…' : '确认前往'}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void rematchBuddy()}
                    className="neo-button flex-1 py-3 text-xs min-h-[44px] disabled:opacity-50"
                  >
                    重新匹配搭子
                  </button>
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={cancelMatch}
                  className="w-full text-[10px] font-mono text-slate-400 underline py-1"
                >
                  取消本次匹配
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'navigate' && matchDetail && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="p-4 bg-inverse-surface border-2 border-success text-center shadow-neo">
                <p className="text-[10px] font-medium text-emerald-400 mb-1">
                  碰头暗号
                </p>
                <p className="text-3xl font-mono font-medium text-white tracking-widest">
                  {matchCode}
                </p>
                <p className="text-[10px] text-emerald-200 mt-2 font-mono">
                  {meetingPoint}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Route size={18} className="text-success" strokeWidth={3} />
                  <h3 className="text-sm font-medium text-slate-900">
                    前往路线图
                  </h3>
                </div>
                <p className="text-[10px] text-slate-500 mb-2">
                  点击地图节点或下方站点查看指引，可逐步前往集合点
                </p>
                <LunchRouteMap
                  meetingPoint={meetingPoint}
                  steps={matchDetail.roadmap}
                  matchCode={matchCode}
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Store size={18} className="text-success" strokeWidth={3} />
                  <h3 className="text-sm font-medium text-slate-900">
                    附近活动与店铺
                  </h3>
                </div>
                <p className="text-[10px] text-slate-500 mb-2">
                  点击商家卡片查看到店说明与优惠
                </p>
                <LunchNearbyMerchants
                  merchants={matchDetail.nearby_merchants ?? []}
                  matchCode={matchCode}
                  meetingPoint={meetingPoint}
                />
              </div>

              {partner && (
                <p className="text-[10px] text-center text-slate-500 font-mono">
                  对方面具 {partner.name} · {partner.affinity_label ?? '已匹配'}
                </p>
              )}

              <div className="p-3 border-2 border-dashed border-slate-300 bg-slate-50 space-y-2">
                <p className="text-[10px] text-slate-500 text-center">
                  想换一位搭子或先查看匹配结果？
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void backToMatchResult()}
                    className="neo-button flex-1 py-3 text-xs min-h-[44px] flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <ArrowLeft size={16} />
                    返回匹配结果
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void rematchBuddy()}
                    className="neo-button-primary flex-1 py-3 text-xs min-h-[44px] flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RotateCcw size={16} />
                    重新匹配搭子
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={onBack}
                className="w-full py-2.5 text-[10px] font-bold text-slate-500 hover:text-success min-h-[44px]"
              >
                已记住路线，返回蹭饭地图
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-inverse-surface text-on-inverse-surface rounded-2xl border border-outline-variant/40 flex items-start gap-3 shadow-neo">
        <Heart size={20} className="text-emerald-400 shrink-0" />
        <p className="text-[10px] text-slate-300 leading-relaxed">
          兴趣搭子与饭搭子共用场景队列：先按你想去的场景匹配，爱好标签用于辅助推荐；碰头仍仅展示面具称号。
        </p>
      </div>
    </div>
  );
}
