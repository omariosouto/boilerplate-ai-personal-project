/**
 * On-device AI, web implementation: Chrome's built-in Prompt API (Gemini Nano).
 * Docs: https://developer.chrome.com/docs/ai/prompt-api
 *
 * The app imports from `@repo/on-device-ai`, never touches `LanguageModel` directly.
 */
import { useQuery, useQueryClient } from '@repo/state-management/async-state';
import { useCallback, useState } from 'react';

import type { OnDeviceAi, OnDeviceAiAvailability, OnDeviceAiContract, OnDeviceAiPromptOptions } from './contract';

/** The slice of the Prompt API this package uses (not in TypeScript's DOM lib yet). */
type LanguageModelSession = {
  prompt: (input: string, options?: { responseConstraint?: object; signal?: AbortSignal }) => Promise<string>;
  destroy: () => void;
};

type LanguageModelStatic = {
  availability: (options: typeof MODEL_OPTIONS) => Promise<Exclude<OnDeviceAiAvailability, 'checking'>>;
  create: (
    options: typeof MODEL_OPTIONS & {
      initialPrompts: { role: 'system'; content: string }[];
      signal?: AbortSignal;
      monitor?: (monitor: EventTarget) => void;
    }
  ) => Promise<LanguageModelSession>;
};

// Gemini Nano supports en/es/ja/de/fr; the app talks to it in English.
const MODEL_OPTIONS = {
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
};

const AVAILABILITY_KEY = ['on-device-ai', 'availability'];

function languageModel(): LanguageModelStatic | null {
  return (globalThis as { LanguageModel?: LanguageModelStatic }).LanguageModel ?? null;
}

export function useOnDeviceAi(): OnDeviceAi {
  const queryClient = useQueryClient();
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  const availability = useQuery({
    queryKey: AVAILABILITY_KEY,
    queryFn: async (): Promise<OnDeviceAiAvailability> => {
      const model = languageModel();
      if (!model) return 'unavailable';
      return model.availability(MODEL_OPTIONS).catch(() => 'unavailable' as const);
    },
    staleTime: Infinity,
  });

  const prompt = useCallback(
    async (input: string, { system, responseConstraint, signal }: OnDeviceAiPromptOptions) => {
      const model = languageModel();
      if (!model) throw new Error('On-device AI is not available in this browser.');

      const session = await model.create({
        ...MODEL_OPTIONS,
        initialPrompts: [{ role: 'system', content: system }],
        signal,
        monitor: (monitor) => {
          monitor.addEventListener('downloadprogress', (event) => {
            setDownloadProgress((event as Event & { loaded: number }).loaded);
          });
        },
      });
      setDownloadProgress(null);
      // The model may have just been downloaded: re-check so the UI stops showing the download state.
      void queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEY });

      try {
        return await session.prompt(input, { responseConstraint, signal });
      } finally {
        session.destroy();
      }
    },
    [queryClient]
  );

  return {
    availability: downloadProgress !== null ? 'downloading' : (availability.data ?? 'checking'),
    downloadProgress,
    prompt,
  };
}

const onDeviceAi = { useOnDeviceAi } satisfies OnDeviceAiContract;

export default onDeviceAi;
export type { OnDeviceAi, OnDeviceAiAvailability, OnDeviceAiPromptOptions } from './contract';
