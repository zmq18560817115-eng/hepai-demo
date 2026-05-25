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
import { USE_MOCK_API } from '../api/config';
import type { QuizSubmitAnswer, WorkplaceResponse } from '../api/types';
import { UserPersona, UserType } from '../types';
import * as mock from '../api/mock';

const STORAGE_KEY = 'hepai_prototype_v1';

interface StoredState {
  onboardingDone: boolean;
  persona: UserPersona | null;
  energyLevel: number;
}

interface PrototypeContextValue {
  onboardingDone: boolean;
  persona: UserPersona | null;
  energyLevel: number;
  apiLoading: boolean;
  apiError: string | null;
  completeOnboarding: (answers: QuizSubmitAnswer[]) => Promise<UserPersona>;
  setEnergyLevel: (level: number) => void;
  resetOnboarding: () => void;
  refreshFromServer: () => Promise<void>;
  hydrateFromWorkplace: (wp: WorkplaceResponse) => void;
}

const PrototypeContext = createContext<PrototypeContextValue | null>(null);

function loadStored(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { onboardingDone: false, persona: null, energyLevel: 75 };
    }
    return JSON.parse(raw) as StoredState;
  } catch {
    return { onboardingDone: false, persona: null, energyLevel: 75 };
  }
}

function persist(state: StoredState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function PrototypeProvider({ children }: { children: React.ReactNode }) {
  const [onboardingDone, setOnboardingDone] = useState(
    () => loadStored().onboardingDone,
  );
  const [persona, setPersona] = useState<UserPersona | null>(
    () => loadStored().persona,
  );
  const [energyLevel, setEnergyLevelState] = useState(
    () => loadStored().energyLevel,
  );
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    persist({ onboardingDone, persona, energyLevel });
  }, [onboardingDone, persona, energyLevel]);

  const hydrateFromWorkplace = useCallback((wp: WorkplaceResponse) => {
    setPersona(personaDtoToUserPersona(wp.persona, wp.mood.energy_level));
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
      }
    } catch (e) {
      setApiError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setApiLoading(false);
    }
  }, [hydrateFromWorkplace]);

  useEffect(() => {
    refreshFromServer();
  }, [refreshFromServer]);

  const completeOnboarding = useCallback(async (answers: QuizSubmitAnswer[]) => {
    const res = await hepaiApi.submitQuiz(answers);
    const generated = personaDtoToUserPersona(res.persona);
    setPersona(generated);
    setEnergyLevelState(generated.moodScore);
    setOnboardingDone(true);
    return generated;
  }, []);

  const setEnergyLevel = useCallback((level: number) => {
    setEnergyLevelState(Math.min(100, Math.max(0, level)));
  }, []);

  const resetOnboarding = useCallback(() => {
    setOnboardingDone(false);
    setPersona(null);
    setEnergyLevelState(75);
    localStorage.removeItem(STORAGE_KEY);
    mock.mockReset();
    hepaiApi.logout();
  }, []);

  const value = useMemo(
    () => ({
      onboardingDone,
      persona,
      energyLevel,
      apiLoading,
      apiError,
      completeOnboarding,
      setEnergyLevel,
      resetOnboarding,
      refreshFromServer,
      hydrateFromWorkplace,
    }),
    [
      onboardingDone,
      persona,
      energyLevel,
      apiLoading,
      apiError,
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
