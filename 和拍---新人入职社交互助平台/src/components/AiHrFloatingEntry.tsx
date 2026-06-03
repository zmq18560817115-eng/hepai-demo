/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 右侧悬浮 AI HR 形象入口，点击进入对话页。
 */

import React from 'react';
import { motion } from 'motion/react';
import { Bot, MessageCircle } from 'lucide-react';

interface AiHrFloatingEntryProps {
  onClick: () => void;
  active?: boolean;
}

export default function AiHrFloatingEntry({
  onClick,
  active = false,
}: AiHrFloatingEntryProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: -4 }}
      aria-label="打开企业 AI HR 助手"
      title="企业 AI HR 助手 · 7×24 智能问答"
      className={`fixed right-0 top-[42%] z-40 flex flex-col items-center gap-1.5 py-4 pl-4 pr-3 rounded-l-[var(--radius-hepai)] border-[2.5px] border-r-0 border-ink shadow-[var(--shadow-pop)] transition-all ${
        active
          ? 'bg-tertiary text-on-primary'
          : 'bg-surface text-on-surface hover:bg-tertiary-container'
      }`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-ink ${
          active ? 'bg-surface text-tertiary' : 'bg-tertiary-container text-tertiary'
        }`}
      >
        <Bot size={22} strokeWidth={2.5} aria-hidden />
      </span>
      <span className="text-[10px] font-medium leading-tight text-center [writing-mode:vertical-rl] tracking-widest">
        AI HR
      </span>
      <span className="text-[9px] font-mono opacity-80 [writing-mode:vertical-rl]">
        助手
      </span>
      {!active && (
        <MessageCircle
          size={14}
          className="text-primary mt-0.5"
          strokeWidth={2.5}
          aria-hidden
        />
      )}
    </motion.button>
  );
}
