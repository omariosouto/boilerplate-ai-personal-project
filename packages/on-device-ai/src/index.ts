/**
 * On-device AI, native implementation (iOS/Android).
 * Follows the same contract as the web implementation (see `contract.ts` and `index.web.ts`).
 *
 * There's no built-in model wired up on native yet, so it always reports `unavailable` and
 * `prompt` rejects — callers already handle that state for unsupported browsers.
 *
 * TODO: plug in an on-device model (e.g. Apple Foundation Models on iOS, Gemini Nano via AICore on
 * Android) behind the same contract.
 */
import type { OnDeviceAiContract } from './contract';

export const useOnDeviceAi: OnDeviceAiContract['useOnDeviceAi'] = () => ({
  availability: 'unavailable',
  downloadProgress: null,
  prompt: () => Promise.reject(new Error('On-device AI is not available on this platform yet.')),
});

const onDeviceAi = { useOnDeviceAi } satisfies OnDeviceAiContract;

export default onDeviceAi;
export type { OnDeviceAi, OnDeviceAiAvailability, OnDeviceAiPromptOptions } from './contract';
