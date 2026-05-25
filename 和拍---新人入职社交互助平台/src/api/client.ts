/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { API_BASE_URL, TOKEN_STORAGE_KEY } from './config';
import type { ApiEnvelope } from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAccessToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    if (!res.ok) {
      throw new ApiError(res.statusText, res.status);
    }
  }

  if (!body) {
    throw new ApiError('响应解析失败', res.status);
  }

  if (!res.ok || body.code !== 0) {
    throw new ApiError(body.message ?? '请求失败', res.status, body.code);
  }

  return body.data;
}
