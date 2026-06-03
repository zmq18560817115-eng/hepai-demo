/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 新人 / 导师 / HR 工号密码登录页
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Lock, LogIn, User } from 'lucide-react';
import { hepaiApi } from '../api/hepaiApi';
import { useDingTalkShell } from '../context/DingTalkShellContext';
import type { LoginResponse } from '../api/types';

interface PortalLoginViewProps {
  portalRole: 'newcomer' | 'mentor' | 'hr';
  onSuccess: (res: LoginResponse) => void;
  onBack: () => void;
}

const PORTAL_META: Record<
  'newcomer' | 'mentor' | 'hr',
  { title: string; demoId: string; demoPwd: string; accent: string }
> = {
  newcomer: {
    title: '新人入职登录',
    demoId: 'E00001',
    demoPwd: '123456',
    accent: 'bg-primary',
  },
  mentor: {
    title: '导师工作台登录',
    demoId: 'M00001',
    demoPwd: '123456',
    accent: 'bg-success',
  },
  hr: {
    title: 'HR 数智看板登录',
    demoId: 'HR0001',
    demoPwd: '123456',
    accent: 'bg-rose-600',
  },
};

export default function PortalLoginView({
  portalRole,
  onSuccess,
  onBack,
}: PortalLoginViewProps) {
  const { embedded } = useDingTalkShell();
  const meta = PORTAL_META[portalRole];
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = username.trim();
    const pwd = password;
    if (!id || !pwd) {
      setError('请输入工号和密码');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await hepaiApi.loginPortal(id, pwd, portalRole);
      onSuccess(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setUsername(meta.demoId);
    setPassword(meta.demoPwd);
    setError(null);
  };

  const roleLabel =
    portalRole === 'newcomer' ? '新人端' : portalRole === 'mentor' ? '导师端' : 'HR 端';

  return (
    <div
      className={`bg-surface-container flex flex-col ${
        embedded ? 'h-full min-h-0 overflow-y-auto' : 'min-h-screen'
      }`}
    >
      <header className="border-b border-outline-variant/30 bg-white px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="neo-button text-[10px] font-medium flex items-center gap-1 px-3 py-2"
        >
          <ArrowLeft size={14} />
          返回身份选择
        </button>
        <p className="text-[10px] font-mono text-slate-400 uppercase">
          和拍 · {roleLabel}
        </p>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl border border-outline-variant/40 shadow-neo-lg p-8"
        >
          <div
            className={`w-14 h-14 mb-6 flex items-center justify-center text-white rounded-2xl border border-outline-variant/40 ${meta.accent}`}
          >
            <Lock size={28} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-medium text-slate-900">{meta.title}</h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {portalRole === 'newcomer'
              ? '首次接入将收到入职大礼包；已完成盲盒的老员工正常进入安全屋。'
              : '使用人事系统分配的工号与密码登录。'}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="portal-username"
                className="text-[10px] font-medium uppercase text-slate-500 tracking-widest flex items-center gap-1 mb-2"
              >
                <User size={12} />
                工号
              </label>
              <input
                id="portal-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={portalRole === 'newcomer' ? '例如 E00001' : '例如 M00001'}
                className="w-full px-4 py-3 rounded-2xl border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label
                htmlFor="portal-password"
                className="text-[10px] font-medium uppercase text-slate-500 tracking-widest flex items-center gap-1 mb-2"
              >
                <Lock size={12} />
                密码
              </label>
              <input
                id="portal-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="默认 123456"
                className="w-full px-4 py-3 rounded-2xl border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {error && (
              <p className="text-xs font-mono text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="neo-button-primary w-full py-3 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn size={18} />
              {loading ? '登录中…' : '登录'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[10px] font-mono text-slate-400 mb-2">演示账号（SQLite）</p>
            <button
              type="button"
              onClick={fillDemo}
              className="text-xs font-bold text-primary hover:underline"
            >
              填入演示：工号 {meta.demoId} / 密码 {meta.demoPwd}
            </button>
            {portalRole === 'newcomer' && (
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                演示账号：E00001（首次，有大礼包）· E00002–E00008（老员工，密码均为 123456）
              </p>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
