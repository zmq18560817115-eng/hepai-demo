/**
 * 登录用户切换：隔离前端缓存，避免 A 用户看到 B 用户的高光/对话
 */

export const AUTH_USER_CHANGED_EVENT = 'hepai:auth-user-changed';

const LAST_USER_KEY = 'hepai_last_user_id';

let sessionEpoch = 0;
let currentUserId: string | null = null;

export function getSessionEpoch(): number {
  return sessionEpoch;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

function readLastUserId(): string | null {
  try {
    return localStorage.getItem(LAST_USER_KEY);
  } catch {
    return null;
  }
}

function writeLastUserId(userId: string | null) {
  try {
    if (userId) localStorage.setItem(LAST_USER_KEY, userId);
    else localStorage.removeItem(LAST_USER_KEY);
  } catch {
    /* ignore */
  }
}

export function userScopedStorageKey(base: string, userId: string): string {
  return `${base}_${userId}`;
}

/** 绑定当前登录用户；与上次不同时递增 sessionEpoch 并派发事件 */
export function bindAuthUser(userId: string | null): number {
  const prev = currentUserId ?? readLastUserId();
  const next = userId?.trim() || null;

  if (prev !== next) {
    sessionEpoch += 1;
    writeLastUserId(next);
    window.dispatchEvent(
      new CustomEvent(AUTH_USER_CHANGED_EVENT, {
        detail: { userId: next, previousUserId: prev, epoch: sessionEpoch },
      }),
    );
  }

  currentUserId = next;
  return sessionEpoch;
}

export function clearAuthSession(): void {
  bindAuthUser(null);
}
