/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Shield, Gift } from 'lucide-react';
import { hepaiApi } from '../api/hepaiApi';
import type { EmployeeProfileDto, QuizQuestionDto } from '../api/types';
import { usePrototype } from '../context/PrototypeContext';

interface BlindBoxViewProps {
 onComplete: () => void | Promise<void>;
}

export default function BlindBoxView({ onComplete }: BlindBoxViewProps) {
 const { completeOnboarding, persona, onboardingDone, resetOnboarding } =
 usePrototype();
 const [retakeMode, setRetakeMode] = useState(false);
 const [questions, setQuestions] = useState<QuizQuestionDto[]>([]);
 const [loadError, setLoadError] = useState<string | null>(null);
 const [step, setStep] = useState(0);
 const [answers, setAnswers] = useState<{ question_id: string; answer_value: string }[]>([]);
 const [isRevealing, setIsRevealing] = useState(false);
 const [revealedPersona, setRevealedPersona] = useState(persona);
 const [revealedEmployee, setRevealedEmployee] =
 useState<EmployeeProfileDto | null>(null);
 const [submitting, setSubmitting] = useState(false);

 useEffect(() => {
 hepaiApi
 .getQuizOnboarding()
 .then((res) => setQuestions(res.questions))
 .catch((e) =>
 setLoadError(e instanceof Error ? e.message : '题目加载失败'),
 );
 }, []);

 const upsertAnswer = (
 list: { question_id: string; answer_value: string }[],
 questionId: string,
 value: string,
 ) => {
 const idx = list.findIndex((a) => a.question_id === questionId);
 if (idx >= 0) {
 const next = [...list];
 next[idx] = { question_id: questionId, answer_value: value };
 return next;
 }
 return [...list, { question_id: questionId, answer_value: value }];
 };

 const answersInOrder = (
 list: { question_id: string; answer_value: string }[],
 ) =>
 questions
 .map((q) => list.find((a) => a.question_id === q.id))
 .filter((a): a is { question_id: string; answer_value: string } =>
 Boolean(a),
 );

 const goToStep = (index: number) => {
 if (index < 0 || index >= questions.length || submitting) return;
 setStep(index);
 setLoadError(null);
 };

 const handleAnswer = async (value: string) => {
 const q = questions[step];
 if (!q) return;
 const newAnswers = upsertAnswer(answers, q.id, value);
 setAnswers(newAnswers);

 if (step < questions.length - 1) {
 setStep(step + 1);
 return;
 }

 const ordered = answersInOrder(newAnswers);
 if (ordered.length < questions.length) {
 const firstMissing = questions.findIndex(
 (question) => !newAnswers.some((a) => a.question_id === question.id),
 );
 if (firstMissing >= 0) {
 setStep(firstMissing);
 setLoadError('还有题目未作答，请完成全部 8 题后再生成面具');
 }
 return;
 }

 setSubmitting(true);
 setLoadError(null);
 try {
 const { persona: generated, employee } = await completeOnboarding(ordered);
 setRevealedPersona(generated);
 setRevealedEmployee(employee ?? null);
 setIsRevealing(true);
 } catch (e) {
 setLoadError(e instanceof Error ? e.message : '提交失败');
 } finally {
 setSubmitting(false);
 }
 };

 const revealed = revealedPersona ?? persona;

 if (isRevealing && revealed) {
 return (
 <div className="flex flex-col items-center justify-center py-8 text-center px-2">
 <motion.div
 initial={{ scale: 0.8, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 className="w-48 h-48 bg-inverse-surface rounded-xl border border-outline-variant/50 flex items-center justify-center relative overflow-hidden mb-6"
 >
 <motion.div
 animate={{
 rotate: [0, -5, 5, -5, 5, 0],
 scale: [1, 1.05, 1, 1.05, 1],
 }}
 transition={{ repeat: Infinity, duration: 2 }}
 className="z-10"
 >
 <Gift className="w-24 h-24 text-primary drop-shadow-lg" />
 </motion.div>
 <div className="absolute inset-0 bg-primary/20" />
 </motion.div>

        <h2 className="text-2xl font-semibold text-slate-800 mb-2">
 你的入职面具
 </h2>
 {revealedEmployee && (
 <p className="text-xs font-sans text-slate-500 mb-2">
 {revealedEmployee.dept} · 工号 {revealedEmployee.employee_no} ·{' '}
 {revealedEmployee.nickname ?? revealedEmployee.display_title}
 </p>
 )}
 <p className="text-lg font-medium text-primary mb-3">{revealed.role}</p>
 <div className="flex flex-wrap justify-center gap-2 mb-4 max-w-xs">
 {revealed.tags.map((tag) => (
 <span
 key={tag}
 className="px-2 py-1 bg-white text-[10px] font-medium rounded-xl border border-outline-variant/40"
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
 onClick={() => void onComplete()}
 className="neo-button-primary px-8 py-4 flex items-center gap-3 group"
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

 if (onboardingDone && !retakeMode) {
 return (
 <div className="max-w-md mx-auto py-12 text-center space-y-6">
 <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-xl border border-outline-variant/40 flex items-center justify-center">
 <Gift size={32} className="text-emerald-700" />
 </div>
        <h2 className="ding-title text-xl text-slate-900">你已完成入职人格测试</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          重新答题将<strong className="font-medium text-slate-800">保留姓名与人格面具</strong>，仅根据最新 8 题倾向刷新<strong className="font-medium text-slate-800">社交标签</strong>。
        </p>
 <button
 type="button"
 onClick={async () => {
 await resetOnboarding();
 setRetakeMode(true);
 setStep(0);
 setAnswers([]);
 setIsRevealing(false);
 setRevealedPersona(null);
 setRevealedEmployee(null);
 }}
 className="neo-button-primary w-full py-3 font-medium"
 >
 重新做人格测试（8 题）
 </button>
 <button
 type="button"
 onClick={() => void onComplete()}
 className="neo-button w-full py-3 text-sm"
 >
 进入安全屋
 </button>
 </div>
 );
 }

 if (loadError && questions.length === 0) {
 return (
 <p className="text-center text-rose-600 text-sm py-8 font-sans">{loadError}</p>
 );
 }

 if (questions.length === 0) {
 return (
 <p className="text-center text-slate-500 text-sm py-8 font-sans">加载题目中…</p>
 );
 }

 const currentQuestion = questions[step];
 const currentAnswer = answers.find((a) => a.question_id === currentQuestion.id)
 ?.answer_value;

 return (
 <div className="max-w-full mx-auto py-4">
 <div className="flex items-center justify-between mb-6 border-b border-outline-variant/30 pb-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-inverse-surface flex items-center justify-center text-white">
 <Shield size={20} />
 </div>
 <div>
 <h3 className="text-xs font-medium text-slate-800">
 入职人格测试
 </h3>
 <p className="text-[10px] font-sans text-slate-500">
 第 {step + 1} / {questions.length} 题 · 完成后解锁面具
 </p>
 </div>
 </div>
 <div
 className="flex gap-1.5"
 role="tablist"
 aria-label="题目导航"
 >
 {questions.map((q, i) => {
 const answered = answers.some((a) => a.question_id === q.id);
 return (
 <button
 key={q.id}
 type="button"
 role="tab"
 aria-selected={i === step}
 aria-label={`第 ${i + 1} 题${answered ? '，已作答' : ''}`}
 title={`第 ${i + 1} 题`}
 disabled={submitting}
 onClick={() => goToStep(i)}
 className={`h-3 w-6 border border-outline-variant/40 transition-all min-w-[24px] ${
 i === step
 ? 'bg-primary'
 : answered
 ? 'bg-indigo-200 hover:bg-indigo-300'
 : 'bg-surface-container hover:bg-slate-200'
 } disabled:opacity-50`}
 />
 );
 })}
 </div>
 </div>

 <AnimatePresence mode="wait">
 <motion.div
 key={step}
 initial={{ x: 20, opacity: 0 }}
 animate={{ x: 0, opacity: 1 }}
 exit={{ x: -20, opacity: 0 }}
          className="ding-panel p-6 rounded-xl"
 >
 <span className="text-[10px] font-sans bg-amber-100 border border-amber-300 px-2 py-0.5 font-bold text-amber-800">
 Q-{String(step + 1).padStart(2, '0')}
 </span>

 <h2 className="text-xl font-medium text-slate-900 my-6 leading-tight">
 {currentQuestion.text}
 </h2>

 <div className="space-y-3">
 {currentQuestion.options.map((option, i) => (
 <button
 key={i}
 type="button"
 disabled={submitting}
 onClick={() => handleAnswer(option.value)}
                className={`w-full p-4 text-left rounded-xl border border-outline-variant/40 transition-all group flex items-center justify-between min-h-[44px] disabled:opacity-50 ${
 currentAnswer === option.value
 ? 'bg-primary-container ring-2 ring-indigo-400'
 : 'bg-white hover:bg-slate-50'
 }`}
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
 <p className="mt-4 text-rose-600 text-xs font-sans text-center">{loadError}</p>
 )}

 <div className="mt-8 p-4 bg-inverse-surface text-on-inverse-surface rounded-xl border border-outline-variant/40">
 <div>
 <p className="text-[10px] font-medium text-primary">
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
