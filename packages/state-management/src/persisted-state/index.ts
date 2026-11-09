/**
 * Persisted state, native implementation (iOS/Android).
 * Follows the same contract as the web implementation (see `contract.ts` and `index.web.ts`).
 *
 * For now values live in memory for the app session (shared between components, lost on restart).
 *
 * TODO: persist to device storage (e.g. expo-sqlite kv-store or AsyncStorage), keeping the same API.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type { PersistedState, PersistedStateContract } from './contract';

const memory = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

export function usePersistedState<T>(key: string, defaultValue: T): PersistedState<T> {
  const defaultRef = useRef(defaultValue);
  const [value, setValueState] = useState<T>(() => (memory.has(key) ? (memory.get(key) as T) : defaultValue));

  useEffect(() => {
    const listener = () => setValueState(memory.has(key) ? (memory.get(key) as T) : defaultRef.current);
    const set = listeners.get(key) ?? new Set();
    set.add(listener);
    listeners.set(key, set);
    return () => {
      set.delete(listener);
    };
  }, [key]);

  const setValue = useCallback(
    (next: T) => {
      memory.set(key, next);
      notify(key);
    },
    [key]
  );

  const remove = useCallback(() => {
    memory.delete(key);
    notify(key);
  }, [key]);

  return [value, setValue, remove];
}

const persistedState = { usePersistedState } satisfies PersistedStateContract;

export default persistedState;
export type { PersistedState } from './contract';
