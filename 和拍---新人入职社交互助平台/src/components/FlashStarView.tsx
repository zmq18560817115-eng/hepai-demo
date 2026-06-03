/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 闪光星罐：记录高光 → 折纸星星动画 → 投入玻璃罐
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, Star } from 'lucide-react';
import { hepaiApi } from '../api/hepaiApi';
import type { FlashJarItem } from '../api/types';
import { usePrototype } from '../context/PrototypeContext';
import { useAuthSessionScope } from '../hooks/useAuthSessionScope';
import FlashStarJar, { FlyingStar, layoutJarStars } from './flash/FlashStarJar';

interface FlashStarViewProps {
  onBack: () => void;
}

type Phase = 'write' | 'fold' | 'fly' | 'done';

export default function FlashStarView({ onBack }: FlashStarViewProps) {
  const { energyLevel } = usePrototype();
  const { sessionEpoch } = useAuthSessionScope();
  const [items, setItems] = useState<FlashJarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [lastWritten, setLastWritten] = useState('');
  const [phase, setPhase] = useState<Phase>('write');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const jarStars = useMemo(
    () => layoutJarStars(items.length, 'jar'),
    [items.length],
  );

  const loadJar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await hepaiApi.getFlashJar();
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : '星罐加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setItems([]);
    setText('');
    setPhase('write');
    setLastWritten('');
    setError(null);
    void loadJar();
  }, [sessionEpoch, loadJar]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('写一句今天的高光小事吧');
      return;
    }
    setSaving(true);
    setError(null);
    setLastWritten(trimmed);
    try {
      const saved = await hepaiApi.postMood({
        energy_level: energyLevel,
        log_text: trimmed,
      });
      setPhase('fold');
      window.setTimeout(() => setPhase('fly'), 1100);
      window.setTimeout(() => {
        setItems((prev) => [
          {
            id: saved.id,
            log_text: trimmed,
            energy_level: energyLevel,
            created_at: saved.created_at,
          },
          ...prev,
        ]);
        setText('');
        setPhase('done');
        setSaving(false);
      }, 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
      setSaving(false);
      setPhase('write');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <button
        type="button"
        onClick={onBack}
        className="neo-button text-[10px] font-medium flex items-center gap-1 px-3 py-2"
      >
        <ArrowLeft size={14} />
        返回安全屋
      </button>

      <header className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 text-primary">
          <Sparkles size={20} strokeWidth={2.5} />
          <h1 className="text-2xl font-medium text-slate-900 tracking-tight">
            闪光星罐
          </h1>
        </div>
        <p className="text-xs font-mono text-slate-500 max-w-xs mx-auto">
          记下一件高光小事，它会变成折纸星星，落进你的玻璃罐
        </p>
      </header>

      <div className="neo-card p-6 flex flex-col items-center gap-4 bg-gradient-to-b from-indigo-50/80 to-white">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
          我的星罐 · {items.length} 颗
        </p>
        {loading ? (
          <p className="text-sm font-mono text-slate-400 py-16">加载星罐…</p>
        ) : (
          <div className="relative w-48 h-56">
            <FlashStarJar stars={jarStars} size="lg" />
            <AnimatePresence>
              {phase === 'fly' && (
                <motion.div
                  className="absolute left-1/2 top-0 z-20 pointer-events-none"
                  initial={{ x: -20, y: -100, scale: 0.5, opacity: 0 }}
                  animate={{ x: -20, y: 40, scale: 1, opacity: 1 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                >
                  <FlyingStar />
                </motion.div>
              )}
              {phase === 'fly' && (
                <motion.div
                  className="absolute left-1/2 top-0 z-30 pointer-events-none"
                  initial={{ x: -20, y: 40, scale: 1, opacity: 1 }}
                  animate={{ x: -16, y: 88, scale: 0.45, opacity: 0.85 }}
                  transition={{ duration: 0.85, delay: 0.5, ease: 'easeIn' }}
                >
                  <FlyingStar />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {phase === 'write' && (
          <motion.div
            key="write"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="neo-card p-6 space-y-4 border-2 border-amber-300 bg-amber-50/50"
          >
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Star className="text-amber-500" size={20} fill="currentColor" />
              记录今日高光
            </h2>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="例如：第一次在会上说出了自己的方案…"
              className="w-full min-h-[120px] p-4 text-sm rounded-2xl border border-outline-variant/40 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              disabled={saving}
            />
            {error && (
              <p className="text-xs font-mono text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2">
                {error}
              </p>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSubmit()}
              className="neo-button-primary w-full py-3 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles size={18} />
              {saving ? '折纸中…' : '折成星星 · 投入星罐'}
            </button>
          </motion.div>
        )}

        {phase === 'fold' && (
          <motion.div
            key="fold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="neo-card p-8 text-center rounded-2xl border border-outline-variant/40"
          >
            <motion.p
              className="text-sm font-medium text-slate-700 leading-relaxed mb-6 px-2"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 0.15, opacity: 0 }}
              transition={{ duration: 0.85 }}
            >
              「{lastWritten}」
            </motion.p>
            <motion.div
              initial={{ scale: 0, rotate: -160 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.65, delay: 0.3, type: 'spring', stiffness: 200 }}
              className="flex justify-center"
            >
              <FlyingStar />
            </motion.div>
            <p className="text-[10px] font-mono text-slate-400 mt-4">正在折纸…</p>
          </motion.div>
        )}

        {phase === 'fly' && (
          <motion.p
            key="fly-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm font-mono text-slate-500"
          >
            星星飞向星罐…
          </motion.p>
        )}

        {phase === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="neo-card p-6 text-center space-y-4 border-2 border-emerald-300 bg-success-container/60"
          >
            <p className="text-sm font-medium text-emerald-800">
              星星已落罐 ✦ 又积攒了一点光
            </p>
            <p className="text-xs text-slate-600 italic">「{lastWritten}」</p>
            <button
              type="button"
              onClick={() => setPhase('write')}
              className="neo-button text-xs font-medium w-full py-2"
            >
              再记录一颗
            </button>
            <button
              type="button"
              onClick={onBack}
              className="text-[10px] font-mono text-slate-500 underline w-full"
            >
              回到安全屋
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length > 0 && phase === 'write' && (
        <div className="neo-card p-4">
          <h3 className="text-[10px] font-medium text-slate-400 uppercase mb-3">
            罐中微光
          </h3>
          <ul className="space-y-2 max-h-32 overflow-y-auto">
            {items.slice(0, 5).map((item) => (
              <li
                key={item.id}
                className="text-xs text-slate-600 border-l-2 border-amber-400 pl-2 font-medium"
              >
                {item.log_text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
