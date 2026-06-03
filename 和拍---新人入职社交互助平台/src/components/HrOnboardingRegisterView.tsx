/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * HR · 待入职员工录入
 */

import React, { useCallback, useEffect, useState } from 'react';
import { UserPlus, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { hepaiApi } from '../api/hepaiApi';
import { HR_COMPANY_DEPARTMENTS } from '../constants/hrDepartments';
import type { HrPendingNewcomerItem, HrRegisterNewcomerResponse } from '../api/types';

export default function HrOnboardingRegisterView() {
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [dept, setDept] = useState<string>(HR_COMPANY_DEPARTMENTS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<HrRegisterNewcomerResponse | null>(
    null,
  );
  const [list, setList] = useState<HrPendingNewcomerItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await hepaiApi.getHrPendingNewcomers();
      setList(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : '列表加载失败');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await hepaiApi.registerHrNewcomer({
        username: username.trim(),
        nickname: nickname.trim(),
        dept,
      });
      setLastCreated(res);
      setMessage(res.message ?? `已创建 ${res.username}`);
      setUsername('');
      setNickname('');
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : '录入失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <UserPlus size={22} className="text-primary" />
          待入职员工录入
        </h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          录入后自动写入数据库。新人使用工号 + 默认密码{' '}
          <code className="bg-slate-100 px-1 rounded">123456</code>{' '}
          登录：首次进入将收到入职礼包并完成 8 题人格测试以获得标签与属性；测试完成后自动成为老员工，再次登录无需重复测试。
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-outline-variant/40 p-6 shadow-neo space-y-5"
      >
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="hr-reg-username"
              className="text-[10px] font-medium uppercase text-slate-500 tracking-widest block mb-2"
            >
              工号
            </label>
            <input
              id="hr-reg-username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toUpperCase())}
              placeholder="例如 E00009"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/40 text-sm font-mono"
              required
            />
          </div>
          <div>
            <label
              htmlFor="hr-reg-nickname"
              className="text-[10px] font-medium uppercase text-slate-500 tracking-widest block mb-2"
            >
              姓名
            </label>
            <input
              id="hr-reg-nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="员工姓名"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/40 text-sm"
              required
            />
          </div>
          <div>
            <label
              htmlFor="hr-reg-dept"
              className="text-[10px] font-medium uppercase text-slate-500 tracking-widest block mb-2"
            >
              部门
            </label>
            <select
              id="hr-reg-dept"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/40 text-sm bg-white"
            >
              {HR_COMPANY_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
        {message && (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg flex items-start gap-2">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            {message}
          </p>
        )}

        {lastCreated && (
          <div className="text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
            <p>
              工号 <strong>{lastCreated.username}</strong> · 姓名{' '}
              {lastCreated.nickname} · {lastCreated.dept}
            </p>
            <p>
              初始密码 <strong>{lastCreated.default_password}</strong> · 状态：待首次登录
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="neo-button-primary px-6 py-3 text-sm font-medium disabled:opacity-50"
        >
          {submitting ? '写入数据库…' : '确认录入并加入数据库'}
        </button>
      </form>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">新人账号一览</h3>
          <button
            type="button"
            onClick={() => void loadList()}
            className="neo-button text-[10px] flex items-center gap-1 px-3 py-1.5"
          >
            <RefreshCw size={12} />
            刷新
          </button>
        </div>

        {loadingList ? (
          <p className="text-sm text-slate-400 animate-pulse">加载中…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-outline-variant/30">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-4 py-3">工号</th>
                  <th className="px-4 py-3">昵称</th>
                  <th className="px-4 py-3">部门</th>
                  <th className="px-4 py-3">人格头型</th>
                  <th className="px-4 py-3">状态</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-slate-100 hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{row.username}</td>
                    <td className="px-4 py-3">{row.nickname}</td>
                    <td className="px-4 py-3 text-slate-600">{row.dept}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {row.onboarding_completed && row.dominant_type
                        ? row.dominant_type
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full ${
                          row.onboarding_completed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {row.onboarding_completed ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <Clock size={12} />
                        )}
                        {row.status_label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-8">暂无新人数据</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
