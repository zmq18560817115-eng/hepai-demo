/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getAccessToken } from '../api/client';
import { hepaiApi } from '../api/hepaiApi';
import {
  AUTH_USER_CHANGED_EVENT,
  bindAuthUser,
  clearAuthSession,
  getSessionEpoch,
} from '../api/sessionScope';

interface AuthSessionContextValue {
  userId: string | null;
  sessionEpoch: number;
  sessionReady: boolean;
  syncSessionFromServer: () => Promise<string | null>;
  clearSession: () => void;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionEpoch, setSessionEpoch] = useState(0);
  const [sessionReady, setSessionReady] = useState(false);

  const applyEpoch = useCallback(() => {
    setSessionEpoch(getSessionEpoch());
  }, []);

  const syncSessionFromServer = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      clearAuthSession();
      setUserId(null);
      applyEpoch();
      return null;
    }
    try {
      const me = await hepaiApi.getUsersMe();
      bindAuthUser(me.id);
      setUserId(me.id);
      applyEpoch();
      return me.id;
    } catch {
      clearAuthSession();
      setUserId(null);
      applyEpoch();
      return null;
    }
  }, [applyEpoch]);

  const clearSession = useCallback(() => {
    clearAuthSession();
    setUserId(null);
    applyEpoch();
  }, [applyEpoch]);

  useEffect(() => {
    const onChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ userId: string | null }>).detail;
      setUserId(detail?.userId ?? null);
      applyEpoch();
    };
    window.addEventListener(AUTH_USER_CHANGED_EVENT, onChanged);
    return () =>
      window.removeEventListener(AUTH_USER_CHANGED_EVENT, onChanged);
  }, [applyEpoch]);

  useEffect(() => {
    void (async () => {
      await syncSessionFromServer();
      setSessionReady(true);
    })();
  }, [syncSessionFromServer]);

  const value = useMemo(
    () => ({
      userId,
      sessionEpoch,
      sessionReady,
      syncSessionFromServer,
      clearSession,
    }),
    [userId, sessionEpoch, sessionReady, syncSessionFromServer, clearSession],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }
  return ctx;
}
