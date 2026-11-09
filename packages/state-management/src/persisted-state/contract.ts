/**
 * Public API of `@repo/state-management/persisted-state`: state that survives reloads, per device.
 * - `index.web.ts` → `localStorage` (synced across tabs)
 * - `index.ts`     → native (iOS/Android)
 *
 * Values are JSON-serialized. The first render always returns `defaultValue` (storage is read after
 * mount), so server and client render the same markup.
 */
export type PersistedState<T> = readonly [value: T, setValue: (value: T) => void, remove: () => void];

export type PersistedStateContract = {
  usePersistedState: <T>(key: string, defaultValue: T) => PersistedState<T>;
};
