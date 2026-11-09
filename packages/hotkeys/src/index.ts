/**
 * Hotkeys (keyboard shortcuts), native implementation (iOS/Android).
 * Follows the same contract as the web implementation (see `contract.ts` and `index.web.ts`).
 *
 * TanStack Hotkeys relies on DOM keyboard events, which don't exist on native.
 * For now every hook is a no-op, so components register hotkeys without platform checks.
 *
 * TODO: implement with hardware keyboard events (iPad, Android tablets/ChromeOS), keeping the
 * same hotkey strings (`Mod+K`, `Escape`…) and callback semantics as the web version.
 */
import type { HotkeysContract } from './contract';

const HotkeysProvider: HotkeysContract['HotkeysProvider'] = ({ children }) => children;
const useHotkey: HotkeysContract['useHotkey'] = () => {};
const useHotkeys: HotkeysContract['useHotkeys'] = () => {};
const useKeyHold: HotkeysContract['useKeyHold'] = () => false;

const hotkeys = { HotkeysProvider, useHotkey, useHotkeys, useKeyHold } satisfies HotkeysContract;

export default hotkeys;
export { HotkeysProvider, useHotkey, useHotkeys, useKeyHold };
