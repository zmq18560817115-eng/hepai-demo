/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Heart,
  Coffee,
  Zap,
  TrendingDown,
  ChevronRight,
  Plus,
  MessageCircle,
  Clock,
  ExternalLink,
  Bot,
} from 'lucide-react';
import { hepaiApi } from '../api/hepaiApi';
import type { MentorDto } from '../api/types';
import { usePrototype } from '../context/PrototypeContext';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';

const DEFAULT_AVATAR =
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4';

interface WorkplaceViewProps {
  onNavigateToMatch: () => void;
  onNavigateToMentors: () => void;
  onNavigateToAiHr?: () => void;
}

export default function WorkplaceView({
  onNavigateToMatch,
  onNavigateToMentors,
  onNavigateToAiHr,
}: WorkplaceViewProps) {
  const {
    persona,
    energyLevel,
    setEnergyLevel,
    onboardingDone,
    hydrateFromWorkplace,
  } = usePrototype();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState('程序员小智');
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);
  const [daysLeft, setDaysLeft] = useState(30);
  const [mentors, setMentors] = useState<MentorDto[]>([]);
  const [activeBuddies, setActiveBuddies] = useState(0);
  const [flashLog, setFlashLog] = useState('');
  const [savingFlash, setSavingFlash] = useState(false);
  const [flashSaved, setFlashSaved] = useState(false);

  const loadWorkplace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const wp = await hepaiApi.getWorkplace();
      hydrateFromWorkplace(wp);
      setNickname(wp.user.nickname);
      setAvatarUrl(wp.user.avatar_url ?? DEFAULT_AVATAR);
      setDaysLeft(wp.user.onboarding_days_left);
      setMentors(wp.mentors);
      setActiveBuddies(wp.lunch.active_buddies_count);
      if (wp.mood.log_text) setFlashLog(wp.mood.log_text);
    } catch (e) {
      setError(e instanceof Error ? e.message : '安全屋加载失败');
    } finally {
      setLoading(false);
    }
  }, [hydrateFromWorkplace]);

  useEffect(() => {
    if (onboardingDone) {
      loadWorkplace();
    } else {
      setLoading(false);
    }
  }, [onboardingDone, loadWorkplace]);

  const debouncedPatchEnergy = useDebouncedCallback((level: number) => {
    hepaiApi.patchMoodEnergy(level).catch(() => {});
  }, 500);

  const handleEnergyChange = (level: number) => {
    setEnergyLevel(level);
    debouncedPatchEnergy(level);
  };

  const handleSaveFlash = async () => {
    setSavingFlash(true);
    setFlashSaved(false);
    try {
      await hepaiApi.postMood({
        energy_level: energyLevel,
        log_text: flashLog.trim() || undefined,
      });
      setFlashSaved(true);
      setTimeout(() => setFlashSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSavingFlash(false);
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
        正在同步你的安全屋…
      </p>
    );
  }

  if (error && !persona) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-rose-600 text-sm font-mono">{error}</p>
        <button type="button" onClick={loadWorkplace} className="neo-button text-xs">
          重试
        </button>
      </div>
    );
  }

  if (!persona) {
    return (
      <p className="text-center text-slate-500 text-sm py-12 font-mono">
        暂无面具数据
      </p>
    );
  }

  const lowEnergy = energyLevel < 50;

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-rose-600 text-[10px] font-mono text-center">{error}</p>
      )}

      <div className="neo-card p-6 flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 bg-indigo-50 flex items-center justify-center border-4 border-slate-900 shadow-neo overflow-hidden">
            <img src={avatarUrl} alt="Avatar" className="w-20 h-20" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-white">
            <Zap size={14} fill="currentColor" />
          </div>
        </div>

        <div className="text-center space-y-3 w-full">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2 flex-wrap">
            {nickname}
            <span className="text-[10px] font-mono bg-amber-100 border border-amber-300 px-2 py-0.5 font-bold uppercase text-amber-800">
              #NEWBIE_D{daysLeft}
            </span>
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-black border-2 border-slate-900 shadow-neo uppercase">
              {persona.role}
            </span>
            {persona.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-white text-slate-800 text-[10px] font-black border-2 border-slate-900 shadow-neo uppercase"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-slate-600 text-sm font-medium leading-relaxed italic px-2">
            「{persona.motto}」
          </p>
          <div className="flex items-center justify-center gap-2 text-slate-400 font-mono text-[10px] font-bold uppercase">
            <Clock size={12} strokeWidth={3} />
            <span>面具已同步</span>
          </div>
        </div>
      </div>

      <div className="bg-indigo-600 p-6 text-white border-4 border-slate-900 shadow-neo-lg">
        <div className="flex justify-between items-start mb-4">
          <Heart className="text-white" fill="currentColor" size={24} />
          <span className="text-[10px] font-mono font-black uppercase bg-slate-900 px-2">
            情绪能量
          </span>
        </div>
        <div className="text-5xl font-black italic">{energyLevel}%</div>
        {lowEnergy && (
          <p className="text-[10px] font-bold uppercase mt-2 flex items-center gap-1 text-amber-200">
            <TrendingDown size={14} />
            可以试试约个饭搭子，不必硬撑
          </p>
        )}
        <input
          type="range"
          min={0}
          max={100}
          value={energyLevel}
          onChange={(e) => handleEnergyChange(Number(e.target.value))}
          className="w-full mt-4 accent-emerald-400"
          aria-label="情绪能量"
        />
        <div className="w-full bg-slate-900 border-2 border-slate-900 h-3 mt-2">
          <motion.div
            className="bg-emerald-400 h-full"
            animate={{ width: `${energyLevel}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="neo-card p-6 relative overflow-hidden">
        <Coffee className="absolute -top-2 -right-2 text-amber-200" size={64} />
        <div className="relative z-10 space-y-4">
          <h3 className="text-xl font-black uppercase">午餐拼图寻宝</h3>
          <p className="text-slate-500 text-xs font-mono">
            当前 {activeBuddies} 人正在匹配 · 轻量社交
          </p>
          <button
            type="button"
            onClick={onNavigateToMatch}
            className="neo-button-primary w-full py-3 text-sm flex items-center justify-center gap-2 min-h-[44px]"
          >
            一键求配子
            <ChevronRight size={18} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="neo-card p-6">
        <div className="flex justify-between items-center mb-4 border-b-2 border-slate-100 pb-3">
          <h3 className="text-lg font-black flex items-center gap-2 uppercase">
            <MessageCircle size={20} strokeWidth={3} />
            带教导师
          </h3>
          <button
            type="button"
            onClick={onNavigateToMentors}
            className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1 min-h-[44px]"
          >
            全部 <ExternalLink size={12} />
          </button>
        </div>
        <div className="space-y-3">
          {mentors.slice(0, 2).map((m) => (
            <div
              key={m.id}
              className="p-3 border-2 border-slate-900 flex items-center gap-3"
            >
              <img
                src={m.avatar_url ?? DEFAULT_AVATAR}
                alt=""
                className="w-10 h-10 border-2 border-slate-900"
              />
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm uppercase truncate">{m.name}</p>
                <p className="text-[10px] font-mono text-slate-500 truncate">{m.role}</p>
              </div>
              <span
                className={`text-[8px] font-black px-1 border border-slate-900 uppercase ${
                  m.status === 'available' ? 'bg-emerald-400' : 'bg-rose-500 text-white'
                }`}
              >
                {m.status}
              </span>
            </div>
          ))}
          {mentors.length === 0 && (
            <p className="text-[10px] text-slate-400 font-mono">带教老师还没就位，HR 正在配置</p>
          )}
        </div>
      </div>

      {onNavigateToAiHr && (
        <div className="neo-card p-6 bg-gradient-to-r from-indigo-50 to-white border-2 border-indigo-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Bot className="text-indigo-600 shrink-0" size={28} />
              <div>
                <h3 className="text-lg font-black text-slate-900">企业 AI HR 助手</h3>
                <p className="text-xs text-slate-500 mt-1">
                  入职适应、情绪减压、导师沟通 — 7×24 智能问答，对话记录已入库
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onNavigateToAiHr}
              className="neo-button-primary shrink-0 px-6 py-3 text-sm"
            >
              开始对话
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-900 p-6 text-white border-4 border-slate-900">
        <h3 className="text-lg font-black uppercase mb-2">记录今日闪光</h3>
        <textarea
          value={flashLog}
          onChange={(e) => setFlashLog(e.target.value)}
          placeholder="今天有什么小成就？"
          className="w-full p-3 text-slate-900 text-sm border-2 border-slate-900 mb-3 min-h-[80px]"
        />
        <button
          type="button"
          disabled={savingFlash}
          className="neo-button bg-white text-slate-900 flex items-center gap-2 w-full justify-center min-h-[44px] disabled:opacity-50"
          onClick={handleSaveFlash}
        >
          <Plus size={18} strokeWidth={3} />
          {savingFlash ? '保存中…' : flashSaved ? '已保存 ✓' : '保存闪光'}
        </button>
      </div>
    </div>
  );
}
