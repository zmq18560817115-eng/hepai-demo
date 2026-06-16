/**
 * 和拍 · 统一入口：三门身份选择（玻璃拟态）
 * 用于钉钉外壳主内容区 / 插件内嵌
 */
import React from 'react';
import { BarChart3, Sparkles, UserRound, Users } from 'lucide-react';
import type { UserType } from '../types';

const ROLES: {
  id: UserType;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  cardBg: string;
  iconBg: string;
  hoverRing: string;
}[] = [
  {
    id: 'newcomer',
    title: '局外新人',
    subtitle: '入职0-30天',
    icon: <UserRound size={20} strokeWidth={2.25} />,
    cardBg: 'bg-[#eef4ff] hover:bg-[#e6efff]',
    iconBg: 'bg-[#1677ff]',
    hoverRing: 'hover:ring-[#1677ff]/25',
  },
  {
    id: 'mentor',
    title: '资深导师',
    subtitle: '带教经验1年以上',
    icon: <Users size={20} strokeWidth={2.25} />,
    cardBg: 'bg-[#ecfbf6] hover:bg-[#e3f9f1]',
    iconBg: 'bg-[#13c2a3]',
    hoverRing: 'hover:ring-[#13c2a3]/25',
  },
  {
    id: 'hr',
    title: '行政/HR',
    subtitle: '流程/业务赋能',
    icon: <BarChart3 size={20} strokeWidth={2.25} />,
    cardBg: 'bg-[#f3efff] hover:bg-[#ece6ff]',
    iconBg: 'bg-[#722ed1]',
    hoverRing: 'hover:ring-[#722ed1]/25',
  },
];

interface EntryRoleSelectViewProps {
  onSelect: (role: UserType) => void;
  loading?: boolean;
  /** 嵌入钉钉外壳主内容区（保留左侧导航） */
  embedded?: boolean;
}

function GlassBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -top-24 -left-16 w-[420px] h-[420px] rounded-full bg-[#1677ff]/35 blur-[90px]" />
      <div className="absolute -top-20 right-0 w-[380px] h-[380px] rounded-full bg-[#ff7a45]/30 blur-[90px]" />
      <div className="absolute bottom-0 left-1/3 w-[320px] h-[320px] rounded-full bg-[#722ed1]/15 blur-[100px]" />
    </div>
  );
}

export default function EntryRoleSelectView({
  onSelect,
  loading,
  embedded = false,
}: EntryRoleSelectViewProps) {
  return (
    <div
      className={
        embedded
          ? 'relative h-full w-full flex flex-col items-center justify-center overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 bg-gradient-to-br from-[#eef4ff] via-[#f8f9fc] to-[#fff5f0]'
          : 'relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 sm:px-6 bg-gradient-to-br from-[#eef4ff] via-[#f8f9fc] to-[#fff5f0]'
      }
    >
      <GlassBackground />

      <div
        className={`relative z-10 w-full max-w-4xl rounded-[28px] border border-white/60 bg-white/55 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.12)] ${
          embedded ? 'px-6 py-8 sm:px-10 sm:py-10' : 'px-8 py-10 sm:px-12 sm:py-12'
        }`}
      >
        <div className="text-center mb-8 sm:mb-10">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#1677ff] text-white flex items-center justify-center shadow-lg shadow-[#1677ff]/25">
            <UserRound size={22} strokeWidth={2.25} />
          </div>
          <h1 className="mt-5 text-xl sm:text-2xl font-bold text-[#171a1d] tracking-tight">
            和拍·新人入职社交互助平台
          </h1>
          <p className="text-sm text-[#646a73] mt-2 flex items-center justify-center gap-1.5">
            <Sparkles size={15} className="text-[#1677ff] shrink-0" />
            第一个真的，2个人的专属陪伴
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              disabled={loading}
              onClick={() => onSelect(role.id)}
              className={`group flex flex-col items-center text-center px-4 py-6 rounded-2xl border border-white/70 shadow-sm transition-all disabled:opacity-50 min-h-[152px] ring-0 hover:ring-4 hover:-translate-y-0.5 hover:shadow-md ${role.cardBg} ${role.hoverRing}`}
            >
              <div
                className={`w-12 h-12 rounded-xl ${role.iconBg} text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform`}
              >
                {role.icon}
              </div>
              <p className="text-[15px] leading-snug font-semibold text-[#171a1d] mt-4">
                {role.title}
              </p>
              <p className="text-xs text-[#646a73] mt-1.5 leading-relaxed">
                {role.subtitle}
              </p>
            </button>
          ))}
        </div>

        {loading && (
          <p className="text-center text-[#646a73] text-sm mt-6">
            正在进入…
          </p>
        )}
      </div>
    </div>
  );
}
