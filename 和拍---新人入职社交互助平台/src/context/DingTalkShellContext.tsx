/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext } from 'react';
import type { UserType } from '../types';

type DingTalkShellContextValue = {
  embedded: boolean;
  exitPlugin: () => void;
  entryRole: UserType | null;
  setEntryRole: (role: UserType | null) => void;
};

const DingTalkShellContext = createContext<DingTalkShellContextValue>({
  embedded: false,
  exitPlugin: () => {},
  entryRole: null,
  setEntryRole: () => {},
});

export function DingTalkShellProvider({
  embedded,
  exitPlugin,
  entryRole,
  setEntryRole,
  children,
}: {
  embedded: boolean;
  exitPlugin: () => void;
  entryRole: UserType | null;
  setEntryRole: (role: UserType | null) => void;
  children: React.ReactNode;
}) {
  return (
    <DingTalkShellContext.Provider
      value={{ embedded, exitPlugin, entryRole, setEntryRole }}
    >
      {children}
    </DingTalkShellContext.Provider>
  );
}

export function useDingTalkShell() {
  return useContext(DingTalkShellContext);
}
