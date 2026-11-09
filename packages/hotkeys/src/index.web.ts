/**
 * Hotkeys (keyboard shortcuts), web implementation.
 * Proxy for TanStack Hotkeys — https://tanstack.com/hotkeys/latest
 *
 * The app imports from `@repo/hotkeys`, never from `@tanstack/react-hotkeys`.
 */
import { HotkeysProvider, useHotkey, useHotkeys, useKeyHold } from '@tanstack/react-hotkeys';

import type { HotkeysContract } from './contract';

const hotkeys = { HotkeysProvider, useHotkey, useHotkeys, useKeyHold } satisfies HotkeysContract;

export default hotkeys;
export { HotkeysProvider, useHotkey, useHotkeys, useKeyHold };
