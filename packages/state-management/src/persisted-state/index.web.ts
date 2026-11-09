/**
 * Persisted state, web implementation: `localStorage`, synced across tabs via the `storage` event.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type { PersistedState, PersistedStateContract } from './contract';

const PREFIX = 'repo:';

function read<T>(storageKey: string): T | undefined {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw === null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

export function usePersistedState<T>(key: string, defaultValue: T): PersistedState<T> {
  const storageKey = PREFIX + key;
  const defaultRef = useRef(defaultValue);
  const [value, setValueState] = useState<T>(defaultValue);

  useEffect(() => {
    setValueState(read<T>(storageKey) ?? defaultRef.current);

    function onStorage(event: StorageEvent) {
      if (event.key === storageKey) setValueState(read<T>(storageKey) ?? defaultRef.current);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [storageKey]);

  const setValue = useCallback(
    (next: T) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      setValueState(next);
    },
    [storageKey]
  );

  const remove = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setValueState(defaultRef.current);
  }, [storageKey]);

  return [value, setValue, remove];
}

const persistedState = { usePersistedState } satisfies PersistedStateContract;

export default persistedState;
export type { PersistedState } from './contract';
