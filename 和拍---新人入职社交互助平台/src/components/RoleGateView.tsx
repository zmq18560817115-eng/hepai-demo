/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, Sparkles, UserRound, Users } from 'lucide-react';
import type { UserType } from '../types';
import { useDingTalkShell } from '../context/DingTalkShellContext';

interface RoleGateViewProps {
  loading?: boolean;
  onSelect: (role: UserType) => void;
}

const ROLES: {
  id: UserType;
  title: string;
  desc: string;
  icon: React.ReactNode;
  cardBg: string;
  iconBg: string;
  shadow: string;
}[] = [
  {
    id: 'newcomer',
    title: '我是新人',
    desc: '入职社交互助',
    icon: <UserRound size={34} strokeWidth={2.5} />,
    cardBg: 'bg-primary-container',
    iconBg: 'bg-primary text-on-primary',
    shadow: 'shadow-[var(--shadow-pop-coral)]',
  },
  {
    id: 'mentor',
    title: '我是导师',
    desc: '带教管理工作台',
    icon: <Users size={34} strokeWidth={2.5} />,
    cardBg: 'bg-secondary-container',
    iconBg: 'bg-secondary text-on-primary',
    shadow: 'shadow-[var(--shadow-pop-teal)]',
  },
  {
    id: 'hr',
    title: '我是 HR',
    desc: '数智运营看板',
    icon: <BarChart3 size={34} strokeWidth={2.5} />,
    cardBg: 'bg-tertiary-container',
    iconBg: 'bg-tertiary text-on-primary',
    shadow: 'shadow-[5px_5px_0_#8b5cf6]',
  },
];

export default function RoleGateView({ loading, onSelect }: RoleGateViewProps) {
  const { embedded } = useDingTalkShell();

  return (
    <div
      className={`flex flex-col ${
        embedded ? 'h-full min-h-0 overflow-y-auto' : 'min-h-screen'
      }`}
    >
      <header
        className={`bg-surface border-b-[3px] border-ink px-6 text-center relative overflow-hidden ${
          embedded ? 'py-6' : 'py-10'
        }`}
      >
        <div className="hepai-stripe-coral absolute top-0 left-0 right-0 h-1.5" aria-hidden />
        <div className="w-16 h-16 mx-auto bg-primary border-[2.5px] border-ink rounded-2xl flex items-center justify-center text-on-primary text-2xl font-bold shadow-[var(--shadow-pop)] -rotate-6 mb-5">
          和
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
          和拍 · 新人入职社交互助平台
        </h1>
        <p className="text-sm text-on-surface-variant mt-2 flex items-center justify-center gap-1.5 font-medium">
          <Sparkles size={16} className="text-primary" />
          选一个身份，进入你的专属模块
        </p>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl w-full">
          {ROLES.map((r, i) => (
            <motion.button
              key={r.id}
              type="button"
              disabled={loading}
              initial={{ opacity: 0, y: 20, rotate: i === 1 ? 1 : i === 2 ? -1 : 0 }}
              animate={{ opacity: 1, y: 0, rotate: i === 1 ? 1 : i === 2 ? -1 : 0 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 260 }}
              onClick={() => onSelect(r.id)}
              className={`text-left p-6 ${r.cardBg} border-[2.5px] border-ink rounded-[var(--radius-hepai)] ${r.shadow} hover:-translate-y-1 hover:shadow-[var(--shadow-pop-lg)] transition-all disabled:opacity-50 group`}
            >
              <div
                className={`w-14 h-14 ${r.iconBg} border-2 border-ink rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
              >
                {r.icon}
              </div>
              <h2 className="text-lg font-bold text-on-surface">{r.title}</h2>
              <p className="text-sm text-on-surface-variant mt-1 font-medium">{r.desc}</p>
            </motion.button>
          ))}
        </div>
      </main>

      {loading && (
        <p className="text-center text-on-surface-variant text-sm pb-10 font-medium">
          正在登录并连接数据库…
        </p>
      )}
    </div>
  );
}
