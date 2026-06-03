/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 钉钉插件 · 企业新人首次接入和拍的一次性体验标记
 */

const STORAGE_KEY = 'hepai_plugin_first_run_v1';

export function hasCompletedPluginFirstRun(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markPluginFirstRunComplete(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

/** 演示用：重新体验首次接入流程 */
export function resetPluginFirstRun(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
