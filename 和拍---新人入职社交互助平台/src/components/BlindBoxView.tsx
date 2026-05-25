/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Sparkles, Shield, Gift } from 'lucide-react';
import { hepaiApi } from '../api/hepaiApi';
import type { QuizQuestionDto } from '../api/types';
import { usePrototype } from '../context/PrototypeContext';

interface BlindBoxViewProps {
  onComplete: () => void;
}

export default function BlindBoxView({ onComplete }: BlindBoxViewProps) {
  const { completeOnboarding, persona } = usePrototype();
  const [questions, setQuestions] = useState<QuizQuestionDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<{ question_id: string; answer_value: string }[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedPersona, setRevealedPersona] = useState(persona);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    hepaiApi
      .getQuizOnboarding()
      .then((res) => setQuestions(res.questions))
      .catch((e) =>
        setLoadError(e instanceof Error ? e.message : '题目加载失败'),
      );
  }, []);

  const handleAnswer = async (value: string) => {
    const q = questions[step];
    if (!q) return;
    const newAnswers = [
      ...answers,
      { question_id: q.id, answer_value: value },
    ];
    setAnswers(newAnswers);
    if (step < questions.length - 1) {
      setStep(step + 1);
      return;
    }
    setSubmitting(true);
    try {
      const generated = await completeOnboarding(newAnswers);
      setRevealedPersona(generated);
      setIsRevealing(true);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const revealed = revealedPersona ?? persona;

  if (loadError && questions.length === 0) {
    return (
      <p className="text-center text-rose-600 text-sm py-8 font-mono">{loadError}</p>
    );
  }

  if (questions.length === 0) {
    return (
      <p className="text-center text-slate-500 text-sm py-8 font-mono">加载题目中…</p>
    );
  }

  if (isRevealing && revealed) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center px-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-48 h-48 bg-slate-900 border-4 border-slate-900 shadow-neo-lg flex items-center justify-center relative overflow-hidden mb-6"
        >
          <motion.div
            animate={{
              rotate: [0, -5, 5, -5, 5, 0],
              scale: [1, 1.05, 1, 1.05, 1],
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="z-10"
          >
            <Gift className="w-24 h-24 text-indigo-400 drop-shadow-lg" />
          </motion.div>
          <div className="absolute inset-0 bg-indigo-600/20" />
        </motion.div>

        <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tighter italic">
          你的入职面具
        </h2>
        <p className="text-lg font-black text-indigo-600 mb-3">{revealed.role}</p>
        <div className="flex flex-wrap justify-center gap-2 mb-4 max-w-xs">
          {revealed.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-white text-[10px] font-black border-2 border-slate-900 shadow-neo uppercase"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="text-slate-600 text-sm italic max-w-sm mb-8 px-4">
          「{revealed.motto}」
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onComplete}
          className="neo-button-primary bg-slate-900 text-white px-8 py-4 flex items-center gap-3 group"
        >
          进入安全屋
          <ChevronRight
            className="group-hover:translate-x-1 transition-transform"
            strokeWidth={3}
          />
        </motion.button>
      </div>
    );
  }

  const currentQuestion = questions[step];

  return (
    <div className="max-w-full mx-auto py-4">
      <div className="flex items-center justify-between mb-6 border-b-2 border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 flex items-center justify-center text-white">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">
              入职人格测试
            </h3>
            <p className="text-[10px] font-mono text-slate-500 uppercase">
              第 {step + 1} / {questions.length} 题 · 完成后解锁面具
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-3 w-6 border border-slate-900 transition-all ${
                i === step ? 'bg-indigo-600 shadow-neo' : 'bg-slate-100'
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          className="bg-white border-2 border-slate-900 p-6 shadow-neo-lg"
        >
          <span className="text-[10px] font-mono bg-amber-100 border border-amber-300 px-2 py-0.5 font-bold uppercase text-amber-800">
            Q-{String(step + 1).padStart(2, '0')}
          </span>

          <h2 className="text-xl font-black text-slate-900 my-6 leading-tight">
            {currentQuestion.text}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, i) => (
              <button
                key={i}
                type="button"
                disabled={submitting}
                onClick={() => handleAnswer(option.value)}
                className="w-full p-4 text-left border-2 border-slate-900 bg-white hover:bg-slate-50 shadow-neo active:shadow-none transition-all group flex items-center justify-between min-h-[44px] disabled:opacity-50"
              >
                <span className="font-bold text-slate-800 text-sm">{option.text}</span>
                <ChevronRight
                  size={18}
                  className="text-slate-400 group-hover:text-slate-900"
                  strokeWidth={3}
                />
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {loadError && (
        <p className="mt-4 text-rose-600 text-xs font-mono text-center">{loadError}</p>
      )}

      <div className="mt-8 p-4 bg-slate-900 text-white border-2 border-slate-900 flex items-start gap-3 shadow-neo">
        <Sparkles className="text-indigo-400 shrink-0" size={20} />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
            隐私承诺
          </p>
          <p className="text-[11px] leading-relaxed mt-1">
            共 {questions.length || 8} 道题，无对错之分。完成后将生成你的「人格面具」（名称、标签、格言），前 30 天对外仅展示面具，真实性格受保护。
          </p>
        </div>
      </div>
    </div>
  );
}
