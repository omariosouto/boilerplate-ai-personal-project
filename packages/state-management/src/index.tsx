import type { ReactNode } from 'react';

import { AsyncStateProvider } from './async-state/provider';
import { QueryStateProvider } from './query-state/expo-router-adapter';

/**
 * Mounts every state-management provider in the right order. Use once, in the root layout.
 * Each concern is imported from its own entry point:
 * - `@repo/state-management/async-state`  → TanStack Query
 * - `@repo/state-management/query-state`  → nuqs
 */
export function StateManagementProvider({ children }: { children: ReactNode }) {
  return (
    <AsyncStateProvider>
      <QueryStateProvider>{children}</QueryStateProvider>
    </AsyncStateProvider>
  );
}
