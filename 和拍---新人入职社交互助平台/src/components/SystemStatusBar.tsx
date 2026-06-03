/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Database, Monitor, Server, Wifi, WifiOff } from 'lucide-react';
import { hepaiApi } from '../api/hepaiApi';
import { USE_MOCK_API, API_BASE_URL } from '../api/config';
import type { SystemStatusResponse } from '../api/types';

const FRONTEND_URL = 'http://127.0.0.1:3000';
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export default function SystemStatusBar() {
  const [status, setStatus] = useState<SystemStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hepaiApi
      .getSystemStatus()
      .then(setStatus)
      .catch((e) =>
        setError(e instanceof Error ? e.message : '状态加载失败'),
      );
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-inverse-surface/80">
      <span className="flex items-center gap-1 text-accent-container" title="前端开发服务">
        <Monitor size={12} />
        前端 {FRONTEND_URL.replace('http://', '')}
      </span>

      {USE_MOCK_API ? (
        <span className="flex items-center gap-1 text-tertiary" title="当前为 Mock 数据">
          <WifiOff size={12} />
          后端未接 · Mock 演示
        </span>
      ) : (
        <span
          className={`flex items-center gap-1 ${error ? 'text-red-300' : 'text-emerald-300'}`}
          title="后端 API + SQLite"
        >
          {error ? <WifiOff size={12} /> : <Server size={12} />}
          后端 {BACKEND_ORIGIN.replace('http://', '')}
          {error ? ' · 未连接' : ' · 已连接'}
        </span>
      )}

      {status && !error && (
        <>
          <span className="flex items-center gap-1 text-on-surface-variant">
            <Database size={12} />
            SQLite · {status.database.tables.quiz_questions} 题
          </span>
          <span className="flex items-center gap-1">
            <Wifi size={12} className="text-primary" />
            {status.user.nickname} · 面具 {status.user.persona_name ?? '—'} ·{' '}
            {status.user.energy_level}%
          </span>
        </>
      )}

      {error && !USE_MOCK_API && (
        <span className="text-error max-w-md truncate" title={error}>
          {error} — 请在 hepai-server 目录执行 npm run dev
        </span>
      )}

      {error && USE_MOCK_API && (
        <span className="text-on-surface-variant">Mock 模式可忽略后端</span>
      )}

      {!status && !error && (
        <span className="text-on-surface-variant">正在检测后端…</span>
      )}
    </div>
  );
}
