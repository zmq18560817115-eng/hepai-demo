/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** 默认 true：后端未就绪时继续用本地 mock */
export const USE_MOCK_API =
  import.meta.env.VITE_USE_MOCK_API !== 'false';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1';

export const TOKEN_STORAGE_KEY = 'hepai_access_token';
