/**
 * Public API of `@repo/hotkeys`, taken from TanStack Hotkeys (the web implementation).
 *
 * Every platform implementation must satisfy this contract:
 * - `index.web.ts` → TanStack Hotkeys (DOM keyboard events)
 * - `index.ts`     → native (iOS/Android)
 *
 * Callers write the web API once and it runs everywhere. When the native side gains a real
 * implementation (e.g. hardware keyboards on iPad/Android), it plugs in here with the same signatures.
 */
import type * as TanStack from '@tanstack/react-hotkeys';
import type { ReactNode } from 'react';

export type HotkeysContract = {
  HotkeysProvider: (props: { children: ReactNode }) => ReactNode;
  useHotkey: typeof TanStack.useHotkey;
  useHotkeys: typeof TanStack.useHotkeys;
  useKeyHold: typeof TanStack.useKeyHold;
};
