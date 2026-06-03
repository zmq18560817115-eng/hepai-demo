/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 钉钉 H5 微应用运行时：检测 dd 环境并尝试免登（需后端配置 AppKey/AppSecret）
 */

import { hepaiApi } from '../api/hepaiApi';

declare global {
  interface Window {
    dd?: {
      ready: (fn: () => void) => void;
      runtime?: {
        permission?: {
          requestAuthCode: (opts: {
            corpId: string;
            onSuccess: (res: { code: string }) => void;
            onFail: (err: unknown) => void;
          }) => void;
        };
      };
    };
  }
}

const DD_JS =
  'https://g.alicdn.com/dingding/dingtalk-jsapi/3.0.25/dingtalk.open.js';

export function isDingTalkUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /DingTalk/i.test(navigator.userAgent);
}

export function isDingTalkEmbedMode(): boolean {
  return import.meta.env.VITE_DINGTALK_EMBED === 'true';
}

function loadDingTalkScript(): Promise<void> {
  if (window.dd) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = DD_JS;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('钉钉 JSAPI 加载失败'));
    document.head.appendChild(s);
  });
}

/** 在真钉钉内尝试 auth_code 免登；失败则静默，用户可手工工号登录 */
export async function tryDingTalkSilentLogin(): Promise<boolean> {
  if (!isDingTalkEmbedMode() && !isDingTalkUserAgent()) return false;

  try {
    await loadDingTalkScript();
    const base = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
    const cfg = await fetch(`${base}/dingtalk/pilot-config`).then((r) =>
      r.json(),
    );
    const data = cfg?.data ?? cfg;
    if (!data?.oauth_configured || !data?.corp_id) return false;

    const code = await new Promise<string | null>((resolve) => {
      window.dd?.ready(() => {
        window.dd?.runtime?.permission?.requestAuthCode({
          corpId: data.corp_id,
          onSuccess: (res) => resolve(res.code),
          onFail: () => resolve(null),
        });
      });
      setTimeout(() => resolve(null), 8000);
    });
    if (!code) return false;

    await hepaiApi.loginDingtalk(code);
    return true;
  } catch {
    return false;
  }
}
