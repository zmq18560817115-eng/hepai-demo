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
import {
  HR_COMPANY_DEPARTMENTS,
  resolveHrDepartment,
} from '../constants/hrDepartments';
import type {
  HrAlert,
  HrDashboardStats,
  HrMoodTrendPoint,
  HrNewcomerSearchItem,
} from '../api/types';

export default function HRDashboard() {
  const [stats, setStats] = useState<HrDashboardStats | null>(null);
  const [trend, setTrend] = useState<HrMoodTrendPoint[]>([]);
  const [alerts, setAlerts] = useState<HrAlert[]>([]);
  const [searchItems, setSearchItems] = useState<HrNewcomerSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [searchSummary, setSearchSummary] = useState<string | null>(null);
  const [interventionMsg, setInterventionMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** 仅当选中五大部门时才按部门聚合 KPI，避免按人名搜索误筛看板 */
  const deptScope = resolveHrDepartment(appliedQuery) ?? undefined;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, t, a] = await Promise.all([
        hepaiApi.getHrDashboardStats(4, deptScope),
        hepaiApi.getHrMoodTrends({ dept: deptScope }),
        hepaiApi.getHrAlerts(20, deptScope),
      ]);
      setStats(s);
      setTrend(t.points);
      setAlerts(a.alerts);
    } catch (e) {
      setError(e instanceof Error ? e.message : '看板加载失败');
    } finally {
      setLoading(false);
    }
  }, [deptScope]);

  useEffect(() => {
    load();
  }, [load]);

  const runSearch = async (query: string) => {
    const q = query.trim();
    setAppliedQuery(q);
    setSearching(true);
    setSearchSummary(null);
    try {
      const [searchRes, alertRes] = await Promise.all([
        hepaiApi.searchHrNewcomers(q),
        hepaiApi.getHrAlerts(20, q || undefined),
      ]);
      setSearchItems(searchRes.items);
      setAlerts(alertRes.alerts);
      if (q) {
        setSearchSummary(
          `搜索「${q}」：新人 ${searchRes.total} 人 · 风险告警 ${alertRes.total ?? alertRes.alerts.length} 条`,
        );
      } else {
        setSearchSummary(null);
        setSearchItems([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '搜索失败');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = () => {
    void runSearch(searchInput);
  };

  const selectDepartment = (dept: string) => {
    setSearchInput(dept);
    void runSearch(dept);
  };

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
      <p className="text-center text-slate-500 text-sm py-12 font-sans">加载 HR 看板…</p>
    );
  }

  if (error && !stats) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-rose-600 text-sm font-sans">{error}</p>
        <button type="button" onClick={load} className="neo-button text-xs">
          重试
        </button>
      </div>
    );
  }

  const batches = stats?.batches ?? [];

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-outline-variant/30 pb-4 space-y-3">
        <div>
          <label className="ding-subtitle text-primary">
            HR 看板
          </label>
          <h2 className="text-3xl font-semibold text-slate-800 tracking-tight">
            数智管理
          </h2>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={16}
              strokeWidth={2.5}
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit();
              }}
              placeholder="搜索五大部门 / 新人化名"
              className="ding-input w-full pl-9 pr-2 text-sm font-medium"
            />
          </div>
          <button
            type="button"
            onClick={handleSearchSubmit}
            disabled={searching}
            className="neo-button-primary shrink-0 px-4 flex items-center justify-center min-w-[48px] disabled:opacity-50"
            title="搜索"
            aria-label="搜索"
          >
            <Search size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {HR_COMPANY_DEPARTMENTS.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => selectDepartment(dept)}
              className={`text-xs font-medium px-2 py-1 rounded-xl border border-outline-variant/40 transition-all ${
                appliedQuery === dept
                  ? 'bg-primary text-white border-transparent'
                  : 'bg-white text-slate-600 hover:bg-primary-container'
              }`}
            >
              {dept}
            </button>
          ))}
          {appliedQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                void runSearch('');
              }}
              className="text-[10px] font-sans text-slate-400 underline"
            >
              清除筛选
            </button>
          )}
        </div>

        {searchSummary && (
          <p className="text-[10px] font-sans text-indigo-700 bg-primary-container border border-primary-container px-3 py-2">
            {searchSummary}
          </p>
        )}
      </div>

      {appliedQuery && searchItems.length > 0 && (
        <div className="ding-panel p-4 rounded-xl">
          <h3 className="text-xs font-medium mb-3 flex items-center gap-2">
            <Users className="text-primary" size={16} />
            部门新人检索结果
          </h3>
          <ul className="space-y-2">
            {searchItems.map((item) => (
              <li
                key={item.id}
                className="flex justify-between items-center gap-2 text-[10px] border-b border-slate-100 pb-2 last:border-0"
              >
                <span className="font-medium text-slate-800">{item.alias_name}</span>
                <span className="font-sans text-slate-500">{item.dept}</span>
                <span className="text-slate-400">{item.persona_name}</span>
                <span
                  className={`font-sans px-1 ${
                    item.risk !== 'normal' ? 'text-rose-600' : 'text-success'
                  }`}
                >
                  能量 {item.energy_level}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {stats && (
        <div className="space-y-2">
          {stats.scope_dept && (
            <p className="text-[10px] font-sans text-indigo-700 bg-primary-container border border-primary-container px-3 py-2">
              当前数据范围：{stats.scope_dept}
              {stats.newcomer_count != null ? ` · 新人 ${stats.newcomer_count} 人` : ''}
            </p>
          )}
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
        </div>
      )}

      <div className="ding-panel p-4 rounded-xl">
        <h3 className="text-xs font-medium mb-4 flex items-center gap-2">
          <BarChart3 className="text-primary" size={16} />
          {stats?.scope_dept ? `${stats.scope_dept} · 批次融入` : '批次融入指数'}
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

      <div className="ding-panel p-4 rounded-xl">
        <h3 className="text-xs font-medium mb-4 flex items-center gap-2">
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

      <div className="bg-amber-500 p-6 text-white rounded-xl border border-outline-variant/50 shadow-neo">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle size={24} />
          <h3 className="text-lg font-medium">实时干预</h3>
        </div>

        <div className="space-y-3">
          {alerts.map((a) => (
            <RiskAlertCard
              key={a.id}
              user={a.user_alias}
              reason={a.reason}
              dept={a.dept}
            />
          ))}
          {alerts.length === 0 && (
            <p className="text-xs font-sans opacity-80">
              {appliedQuery
                ? `「${appliedQuery}」暂无匹配的风险条目`
                : '暂无风险条目'}
            </p>
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
          <p className="mt-2 text-[10px] font-sans text-center">{interventionMsg}</p>
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
    indigo: 'bg-primary text-white',
    amber: 'bg-amber-100 text-amber-800',
    emerald: 'bg-emerald-400 text-slate-900',
    purple: 'bg-purple-100 text-purple-800',
  };
  const up = trend.startsWith('+') || (trend.startsWith('-') === false && !trend.startsWith('-'));

  return (
    <div className="bg-white p-4 rounded-xl border border-outline-variant/40 shadow-neo space-y-3">
      <div className="flex items-center justify-between">
        <div
          className={`w-10 h-10 rounded-xl border border-outline-variant/40 flex items-center justify-center ${colorClasses[color]}`}
        >
          {React.cloneElement(icon as React.ReactElement, { strokeWidth: 3, size: 18 })}
        </div>
        <span
          className={`text-[9px] font-medium font-sans px-1 border border-outline-variant/40 flex items-center ${
            up ? 'bg-emerald-100' : 'bg-rose-100'
          }`}
        >
          {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </span>
      </div>
      <div>
        <h4 className="text-slate-500 text-[9px] font-medium">{title}</h4>
        <div className="text-2xl font-medium text-slate-900">{value}</div>
      </div>
    </div>
  );
}

const RiskAlertCard: React.FC<{
  user: string;
  reason: string;
  dept: string;
}> = ({ user, reason, dept }) => (
  <div className="bg-white/10 border border-white/30 p-4">
    <div className="flex justify-between items-start mb-2 gap-2">
      <h4 className="font-medium text-sm">{user}</h4>
      <span className="text-[9px] bg-inverse-surface px-1.5 py-0.5 font-sans shrink-0">
        {dept}
      </span>
    </div>
    <p className="text-white text-[10px] leading-relaxed font-sans opacity-90">{reason}</p>
  </div>
);
