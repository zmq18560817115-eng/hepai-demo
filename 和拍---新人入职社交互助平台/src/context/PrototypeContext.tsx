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
import { hepaiApi, personaDtoToUserPersona } from '../api/hepaiApi';
import { inferDominantFromPersonaName } from '../utils/employeeProfile';
import { USE_MOCK_API } from '../api/config';
import {
  AUTH_USER_CHANGED_EVENT,
  getCurrentUserId,
  userScopedStorageKey,
} from '../api/sessionScope';
import type {
  EmployeeProfileDto,
  QuizSubmitAnswer,
  WorkplaceResponse,
} from '../api/types';
import { UserPersona, UserType } from '../types';
import * as mock from '../api/mock';

/** 能量条本地缓存（按 userId 隔离） */
const ENERGY_STORAGE_KEY = 'hepai_energy_v1';

interface PrototypeContextValue {
  onboardingDone: boolean;
  persona: UserPersona | null;
  dominantType: string | null;
  energyLevel: number;
  apiLoading: boolean;
  apiError: string | null;
  completeOnboarding: (answers: QuizSubmitAnswer[]) => Promise<{
    persona: UserPersona;
    employee?: EmployeeProfileDto;
  }>;
  setEnergyLevel: (level: number) => void;
  resetOnboarding: () => Promise<void>;
  refreshFromServer: () => Promise<void>;
  sessionReady: boolean;
  hydrateFromWorkplace: (wp: WorkplaceResponse) => void;
}

const PrototypeContext = createContext<PrototypeContextValue | null>(null);

function loadStoredEnergy(userId: string | null): number {
  if (!userId) return 75;
  try {
    const v = localStorage.getItem(
      userScopedStorageKey(ENERGY_STORAGE_KEY, userId),
    );
    return v ? Number(v) : 75;
  } catch {
    return 75;
  }
}

export function PrototypeProvider({ children }: { children: React.ReactNode }) {
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [persona, setPersona] = useState<UserPersona | null>(null);
  const [dominantType, setDominantType] = useState<string | null>(null);
  const [energyLevel, setEnergyLevelState] = useState(() =>
    loadStoredEnergy(getCurrentUserId()),
  );
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    localStorage.removeItem('hepai_prototype_v1');
    const uid = getCurrentUserId();
    if (uid) {
      localStorage.setItem(
        userScopedStorageKey(ENERGY_STORAGE_KEY, uid),
        String(energyLevel),
      );
    }
  }, [energyLevel]);

  const clearClientUserState = useCallback(() => {
    setPersona(null);
    setDominantType(null);
    setOnboardingDone(false);
    setApiError(null);
    setEnergyLevelState(loadStoredEnergy(getCurrentUserId()));
  }, []);

  const hydrateFromWorkplace = useCallback((wp: WorkplaceResponse) => {
    const generated = personaDtoToUserPersona(wp.persona, wp.mood.energy_level);
    if (wp.employee?.traits?.length) {
      generated.hiddenPreferences = wp.employee.traits;
    } else if (wp.employee?.interests?.length) {
      generated.hiddenPreferences = wp.employee.interests;
    }
    setPersona(generated);
    setDominantType(
      wp.employee?.dominant_type ?? inferDominantFromPersonaName(wp.persona.name),
    );
    setEnergyLevelState(wp.mood.energy_level);
    setOnboardingDone(true);
  }, []);

  const refreshFromServer = useCallback(async () => {
    setApiLoading(true);
    setApiError(null);
    try {
      const status = await hepaiApi.getOnboardingStatus();
      setOnboardingDone(status.completed);
      if (status.completed) {
        const wp = await hepaiApi.getWorkplace();
        hydrateFromWorkplace(wp);
      } else {
        try {
          const p = await hepaiApi.getPersonaMe();
          const generated = personaDtoToUserPersona(p);
          setPersona(generated);
          setDominantType(inferDominantFromPersonaName(p.name));
        } catch {
          setPersona(null);
          setDominantType(null);
        }
        setOnboardingDone(false);
      }
    } catch (e) {
      setApiError(e instanceof Error ? e.message : '加载失败');
      setOnboardingDone(false);
      setPersona(null);
      setDominantType(null);
    } finally {
      setApiLoading(false);
      setSessionReady(true);
    }
  }, [hydrateFromWorkplace]);

  useEffect(() => {
    const onAuthChanged = () => {
      clearClientUserState();
      setSessionReady(false);
      void refreshFromServer();
    };
    window.addEventListener(AUTH_USER_CHANGED_EVENT, onAuthChanged);
    return () =>
      window.removeEventListener(AUTH_USER_CHANGED_EVENT, onAuthChanged);
  }, [clearClientUserState, refreshFromServer]);

  const completeOnboarding = useCallback(async (answers: QuizSubmitAnswer[]) => {
    const res = await hepaiApi.submitQuiz(answers);
    const generated = personaDtoToUserPersona(
      res.persona,
      res.employee?.energy_level,
    );
    if (res.employee?.interests?.length) {
      generated.hiddenPreferences = res.employee.interests;
    } else if (res.employee?.traits?.length) {
      generated.hiddenPreferences = res.employee.traits;
    }
    setPersona(generated);
    setDominantType(
      res.employee?.dominant_type ??
        inferDominantFromPersonaName(res.persona.name),
    );
    setEnergyLevelState(res.employee?.energy_level ?? generated.moodScore);
    setOnboardingDone(true);
    return { persona: generated, employee: res.employee };
  }, []);

  const setEnergyLevel = useCallback((level: number) => {
    setEnergyLevelState(Math.min(100, Math.max(0, level)));
  }, []);

  const resetOnboarding = useCallback(async () => {
    setApiLoading(true);
    try {
      const lockedPersona = persona;
      const lockedDominant = dominantType;
      if (!USE_MOCK_API) {
        await hepaiApi.resetOnboarding();
      } else {
        mock.mockReset();
      }
      setOnboardingDone(false);
      if (lockedPersona) {
        setPersona(lockedPersona);
        setDominantType(lockedDominant);
      } else {
        try {
          const p = await hepaiApi.getPersonaMe();
          const generated = personaDtoToUserPersona(p);
          setPersona(generated);
          setDominantType(inferDominantFromPersonaName(p.name));
        } catch {
          setPersona(null);
          setDominantType(null);
        }
      }
    } catch (e) {
      setApiError(e instanceof Error ? e.message : '重置失败');
    } finally {
      setApiLoading(false);
    }
  }, [persona, dominantType]);

  const value = useMemo(
    () => ({
      onboardingDone,
      persona,
      dominantType,
      energyLevel,
      apiLoading,
      apiError,
      sessionReady,
      completeOnboarding,
      setEnergyLevel,
      resetOnboarding,
      refreshFromServer,
      hydrateFromWorkplace,
    }),
    [
      onboardingDone,
      persona,
      dominantType,
      energyLevel,
      apiLoading,
      apiError,
      sessionReady,
      completeOnboarding,
      setEnergyLevel,
      resetOnboarding,
      refreshFromServer,
      hydrateFromWorkplace,
    ],
  );

  return (
    <PrototypeContext.Provider value={value}>
      {children}
    </PrototypeContext.Provider>
  );
}

export function usePrototype() {
  const ctx = useContext(PrototypeContext);
  if (!ctx) {
    throw new Error('usePrototype must be used within PrototypeProvider');
  }
  return ctx;
}

export function defaultViewForRole(
  role: UserType,
  onboardingDone: boolean,
): import('../types').AppView {
  if (role === 'hr') return 'hr';
  if (role === 'mentor') return 'mentor_hub';
  if (!onboardingDone) return 'blindbox';
  return 'workplace';
}
