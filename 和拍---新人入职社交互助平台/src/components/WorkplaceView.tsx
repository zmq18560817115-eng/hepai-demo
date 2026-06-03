/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Coffee,
  ChevronRight,
  MessageCircle,
  ExternalLink,
  LayoutGrid,
} from 'lucide-react';
import { hepaiApi } from '../api/hepaiApi';
import type { MentorDto } from '../api/types';
import { usePrototype } from '../context/PrototypeContext';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import PersonaAvatar from './PersonaAvatar';
import FlashStarEntryCard from './FlashStarEntryCard';
import { energyBarAccentHex, pickEncouragement } from '../utils/energyPersona';

const DEFAULT_AVATAR =
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4';

interface WorkplaceViewProps {
  onNavigateToMatch: () => void;
  onNavigateToMentors: () => void;
  onNavigateToFlashStar: () => void;
  onNavigateToMyDesk: () => void;
  onOpenMentorChat: (mentor: MentorDto) => void;
}

export default function WorkplaceView({
  onNavigateToMatch,
  onNavigateToMentors,
  onNavigateToFlashStar,
  onNavigateToMyDesk,
  onOpenMentorChat,
}: WorkplaceViewProps) {
  const {
    persona,
    dominantType,
    energyLevel,
    setEnergyLevel,
    onboardingDone,
    hydrateFromWorkplace,
  } = usePrototype();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState('程序员小智');
  const [employeeDept, setEmployeeDept] = useState<string | null>(null);
  const [employeeTitle, setEmployeeTitle] = useState<string | null>(null);
  const [daysLeft, setDaysLeft] = useState(30);
  const [mentors, setMentors] = useState<MentorDto[]>([]);
  const [activeBuddies, setActiveBuddies] = useState(0);
  const [encouragement, setEncouragement] = useState<string | null>(null);
  const prevEnergyRef = useRef(energyLevel);
  const dismissEncouragementRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const showEncouragement = useCallback((level: number) => {
    const { message } = pickEncouragement(level, prevEnergyRef.current);
    prevEnergyRef.current = level;
    setEncouragement(message);
    if (dismissEncouragementRef.current) {
      clearTimeout(dismissEncouragementRef.current);
    }
    dismissEncouragementRef.current = setTimeout(
      () => setEncouragement(null),
      4500,
    );
  }, []);

  const loadWorkplace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const wp = await hepaiApi.getWorkplace();
      hydrateFromWorkplace(wp);
      setNickname(wp.user.nickname);
      setEmployeeDept(wp.employee?.dept ?? null);
      setEmployeeTitle(wp.employee?.display_title ?? null);
      setDaysLeft(wp.user.onboarding_days_left);
      setMentors(wp.mentors);
      setActiveBuddies(wp.lunch.active_buddies_count);
      prevEnergyRef.current = wp.mood.energy_level;
      const { message } = pickEncouragement(wp.mood.energy_level);
      setEncouragement(message);
      dismissEncouragementRef.current = setTimeout(
        () => setEncouragement(null),
        4500,
      );
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
    return () => {
      if (dismissEncouragementRef.current) {
        clearTimeout(dismissEncouragementRef.current);
      }
    };
  }, [onboardingDone, loadWorkplace]);

  const debouncedPatchEnergy = useDebouncedCallback((level: number) => {
    hepaiApi.patchMoodEnergy(level).catch(() => {});
  }, 500);

  const handleEnergyChange = (level: number) => {
    setEnergyLevel(level);
    debouncedPatchEnergy(level);
  };

  const handleEnergyCommit = (level: number) => {
    showEncouragement(level);
  };

  if (!onboardingDone) {
    return (
      <p className="text-center text-slate-500 text-sm py-12 font-sans">
        请先完成入职盲盒
      </p>
    );
  }

  if (loading) {
    return (
      <p className="text-center text-slate-500 text-sm py-12 font-sans">
        正在同步你的安全屋…
      </p>
    );
  }

  if (error && !persona) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-rose-600 text-sm font-sans">{error}</p>
        <button type="button" onClick={loadWorkplace} className="neo-button text-xs">
          重试
        </button>
      </div>
    );
  }

  if (!persona) {
    return (
      <p className="text-center text-slate-500 text-sm py-12 font-sans">
        暂无面具数据
      </p>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto w-full">
      {error && (
        <p className="text-rose-600 text-[10px] font-sans text-center">{error}</p>
      )}

      <div className="ding-panel p-4 sm:p-5">
        <p className="ding-subtitle mb-3">
          我的人物设定
        </p>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center sm:items-start">
          <PersonaAvatar
            energyLevel={energyLevel}
            dominantType={dominantType}
            personaName={persona?.role}
            className="shrink-0 scale-90 sm:scale-100"
          />

          <div className="text-center sm:text-left space-y-2 flex-1 min-w-0 w-full">
          <h2 className="text-lg sm:text-xl font-bold text-on-surface tracking-tight flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            {nickname}
            <span className="text-xs font-sans bg-amber-100 border border-amber-300 px-2 py-0.5 font-semibold text-amber-800 rounded-lg">
              #NEWBIE_D{daysLeft}
            </span>
          </h2>
          {employeeDept && (
            <p className="text-[10px] font-sans text-slate-500">
              {employeeDept}
              {employeeTitle ? ` · ${employeeTitle}` : ''}
            </p>
          )}
          <div className="space-y-2">
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 items-center">
              <span className="text-[10px] font-sans text-slate-400 shrink-0">
                人格面具
              </span>
              <span className="px-2 py-1 bg-primary text-white text-xs font-medium rounded-lg border border-transparent">
                {persona.role}
              </span>
            </div>
            {persona.tags.length > 0 && (
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 items-center">
                <span className="text-[10px] font-sans text-slate-400 shrink-0 w-full sm:w-auto text-center sm:text-left">
                  社交标签（随答题更新）
                </span>
                {persona.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-white text-slate-700 text-xs font-medium rounded-lg border border-outline-variant/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <p className="text-on-surface-variant text-xs sm:text-sm font-medium leading-relaxed italic">
            「{persona.motto}」
          </p>
          </div>
        </div>

        <div className="w-full pt-3 mt-3 border-t border-outline-variant/70 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-slate-500 tracking-widest flex items-center gap-1">
              <Heart size={12} className="text-rose-500" fill="currentColor" />
              情绪能量
            </span>
            <span className="text-base font-bold text-primary tabular-nums">
              {energyLevel}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={energyLevel}
            onChange={(e) => handleEnergyChange(Number(e.target.value))}
            onMouseUp={(e) =>
              handleEnergyCommit(Number((e.target as HTMLInputElement).value))
            }
            onTouchEnd={(e) =>
              handleEnergyCommit(Number((e.target as HTMLInputElement).value))
            }
            className="w-full h-2 cursor-pointer"
            style={{ accentColor: energyBarAccentHex(energyLevel) }}
            aria-label="情绪能量"
          />
        </div>

        <AnimatePresence>
          {encouragement && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4 }}
              className="w-full text-center text-xs font-medium text-indigo-900 bg-primary-container border border-primary-container px-3 py-2.5 leading-relaxed"
            >
              {encouragement}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <div className="ding-panel p-3.5 sm:p-4 relative overflow-hidden bg-primary-container/30 flex flex-col min-h-0">
          <LayoutGrid
            className="absolute -top-1 -right-1 text-primary/20"
            size={40}
            strokeWidth={2}
          />
          <div className="relative z-10 flex flex-col gap-2">
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <LayoutGrid size={16} strokeWidth={2.5} className="text-primary shrink-0" />
              我的工位
            </h3>
            <p className="text-on-surface-variant text-[10px] font-sans leading-snug">
              贴画桌面
            </p>
            <button
              type="button"
              onClick={onNavigateToMyDesk}
              className="neo-button-primary w-full py-2 text-xs flex items-center justify-center gap-1.5 min-h-[40px] mt-1"
            >
              进入
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>
        </div>

        <div className="ding-panel p-3.5 sm:p-4 relative overflow-hidden flex flex-col min-h-0">
          <Coffee className="absolute -top-1 -right-1 text-accent/30" size={40} />
          <div className="relative z-10 flex flex-col gap-2">
            <h3 className="text-sm font-bold">午餐拼图</h3>
            <p className="text-on-surface-variant text-[10px] font-sans leading-snug">
              {activeBuddies} 人匹配中
            </p>
            <button
              type="button"
              onClick={onNavigateToMatch}
              className="neo-button-primary w-full py-2 text-xs flex items-center justify-center gap-1.5 min-h-[40px] mt-1"
            >
              求配子
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      <div className="ding-panel p-6">
        <div className="flex justify-between items-center mb-4 border-b-2 border-slate-100 pb-3">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <MessageCircle size={20} strokeWidth={3} />
            带教导师
          </h3>
          <button
            type="button"
            onClick={onNavigateToMentors}
            className="text-[10px] font-medium text-primary flex items-center gap-1 min-h-[44px]"
          >
            全部 <ExternalLink size={12} />
          </button>
        </div>
        <div className="space-y-3">
          {mentors.slice(0, 2).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onOpenMentorChat(m)}
              className="w-full p-3 rounded-xl border border-outline-variant/40 flex items-center gap-3 text-left hover:bg-primary-container hover:shadow-sm transition-all"
            >
              <img
                src={m.avatar_url ?? DEFAULT_AVATAR}
                alt=""
                className="w-10 h-10 rounded-xl border border-outline-variant/40"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{m.name}</p>
                <p className="text-[10px] font-sans text-slate-500 truncate">{m.role}</p>
              </div>
              <span
                className={`text-[8px] font-medium px-1 border border-outline-variant/40 ${
                  m.status === 'available' ? 'bg-emerald-400' : 'bg-rose-500 text-white'
                }`}
              >
                {m.status}
              </span>
            </button>
          ))}
          {mentors.length === 0 && (
            <p className="text-[10px] text-slate-400 font-sans">带教老师还没就位，HR 正在配置</p>
          )}
        </div>
      </div>

      <FlashStarEntryCard onEnter={onNavigateToFlashStar} />
    </div>
  );
}
