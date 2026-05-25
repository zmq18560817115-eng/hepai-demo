/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  Users,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  FileText,
  Search,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { hepaiApi } from '../api/hepaiApi';
import type { HrAlert, HrDashboardStats, HrMoodTrendPoint } from '../api/types';

export default function HRDashboard() {
  const [stats, setStats] = useState<HrDashboardStats | null>(null);
  const [trend, setTrend] = useState<HrMoodTrendPoint[]>([]);
  const [alerts, setAlerts] = useState<HrAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [interventionMsg, setInterventionMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, t, a] = await Promise.all([
        hepaiApi.getHrDashboardStats(4),
        hepaiApi.getHrMoodTrends(),
        hepaiApi.getHrAlerts(10),
      ]);
      setStats(s);
      setTrend(t.points);
      setAlerts(a.alerts);
    } catch (e) {
      setError(e instanceof Error ? e.message : '看板加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleIntervention = async () => {
    if (alerts.length === 0) return;
    setSubmitting(true);
    setInterventionMsg(null);
    try {
      const res = await hepaiApi.postHrInterventions(alerts.map((a) => a.id));
      setInterventionMsg(`已推送 ${res.sent} 条关怀提示`);
    } catch (e) {
      setInterventionMsg(e instanceof Error ? e.message : '推送失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <p className="text-center text-slate-500 text-sm py-12 font-mono">加载 HR 看板…</p>
    );
  }

  if (error && !stats) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-rose-600 text-sm font-mono">{error}</p>
        <button type="button" onClick={load} className="neo-button text-xs">
          重试
        </button>
      </div>
    );
  }

  const batches = stats?.batches ?? [];
  const filteredAlerts = searchQ.trim()
    ? alerts.filter(
        (a) =>
          a.user_alias.includes(searchQ) ||
          a.dept.includes(searchQ) ||
          a.reason.includes(searchQ),
      )
    : alerts;

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b-4 border-slate-900 pb-4 space-y-3">
        <div>
          <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
            HR 看板
          </label>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
            数智管理
          </h2>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="搜索化名 / 部门"
              className="w-full pl-8 pr-2 py-2 bg-white border-2 border-slate-900 text-[10px] font-bold"
            />
          </div>
          <button
            type="button"
            className="neo-button text-[9px] shrink-0 opacity-60"
            title="二期：导出报表"
          >
            <FileText size={14} />
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            title="整体融入指数"
            value={String(stats.integration_index)}
            trend={stats.integration_trend}
            icon={<TrendingUp />}
            color="indigo"
          />
          <KpiCard
            title="待关注新人"
            value={String(stats.newcomers_at_risk)}
            trend={stats.newcomers_at_risk_trend}
            icon={<AlertCircle />}
            color="amber"
          />
          <KpiCard
            title="导师活跃度"
            value={`${Math.round(stats.mentor_activity_rate * 100)}%`}
            trend={stats.mentor_activity_trend}
            icon={<Users />}
            color="emerald"
          />
          <KpiCard
            title="午餐配对成功率"
            value={`${Math.round(stats.lunch_match_success_rate * 100)}%`}
            trend={stats.lunch_match_success_trend}
            icon={<Target />}
            color="purple"
          />
        </div>
      )}

      <div className="bg-white p-4 border-2 border-slate-900 shadow-neo-lg">
        <h3 className="text-xs font-black uppercase mb-4 flex items-center gap-2">
          <BarChart3 className="text-indigo-600" size={16} />
          批次融入指数
        </h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={batches}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} />
              <YAxis tick={{ fontSize: 9 }} width={28} />
              <Tooltip />
              <Bar dataKey="active" fill="#4f46e5" name="活跃度" barSize={20} />
              <Bar dataKey="risk" fill="#ef4444" name="风险" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 border-2 border-slate-900 shadow-neo-lg">
        <h3 className="text-xs font-black uppercase mb-4 flex items-center gap-2">
          <TrendingUp className="text-pink-500" size={16} />
          情绪值波动
        </h3>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="time" tick={{ fontSize: 9 }} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip />
              <Area
                type="stepAfter"
                dataKey="score"
                stroke="#ec4899"
                strokeWidth={3}
                fill="url(#colorScore)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-amber-500 p-6 text-white border-4 border-slate-900 shadow-neo-lg">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle size={24} />
          <h3 className="text-lg font-black uppercase">实时干预</h3>
        </div>

        <div className="space-y-3">
          {filteredAlerts.map((a) => (
            <RiskAlertCard
              key={a.id}
              user={a.user_alias}
              reason={a.reason}
              dept={a.dept}
            />
          ))}
          {filteredAlerts.length === 0 && (
            <p className="text-xs font-mono opacity-80">暂无匹配的风险条目</p>
          )}
        </div>

        <button
          type="button"
          disabled={submitting || alerts.length === 0}
          onClick={handleIntervention}
          className="neo-button mt-6 bg-white text-slate-900 w-full py-3 text-xs disabled:opacity-50"
        >
          {submitting ? '推送中…' : '推送关怀提示至 HRBP'}
        </button>
        {interventionMsg && (
          <p className="mt-2 text-[10px] font-mono text-center">{interventionMsg}</p>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  trend,
  icon,
  color,
}: {
  title: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-600 text-white',
    amber: 'bg-amber-100 text-amber-800',
    emerald: 'bg-emerald-400 text-slate-900',
    purple: 'bg-purple-100 text-purple-800',
  };
  const up = trend.startsWith('+') || (trend.startsWith('-') === false && !trend.startsWith('-'));

  return (
    <div className="bg-white p-4 border-2 border-slate-900 shadow-neo space-y-3">
      <div className="flex items-center justify-between">
        <div
          className={`w-10 h-10 border-2 border-slate-900 flex items-center justify-center ${colorClasses[color]}`}
        >
          {React.cloneElement(icon as React.ReactElement, { strokeWidth: 3, size: 18 })}
        </div>
        <span
          className={`text-[9px] font-black font-mono px-1 border border-slate-900 flex items-center ${
            up ? 'bg-emerald-100' : 'bg-rose-100'
          }`}
        >
          {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </span>
      </div>
      <div>
        <h4 className="text-slate-500 text-[9px] font-black uppercase">{title}</h4>
        <div className="text-2xl font-black text-slate-900">{value}</div>
      </div>
    </div>
  );
}

const RiskAlertCard: React.FC<{
  user: string;
  reason: string;
  dept: string;
}> = ({ user, reason, dept }) => (
    <div className="bg-white/10 border-2 border-white/30 p-4">
      <div className="flex justify-between items-start mb-2 gap-2">
        <h4 className="font-black text-sm uppercase">{user}</h4>
        <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 font-mono shrink-0">
          {dept}
        </span>
      </div>
      <p className="text-white text-[10px] leading-relaxed font-mono opacity-90">{reason}</p>
    </div>
);
