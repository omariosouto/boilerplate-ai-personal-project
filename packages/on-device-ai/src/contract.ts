/**
 * Public API of `@repo/on-device-ai`: a language model that runs on the user's device — no server,
 * no API key, and the prompt (e.g. the user's spreadsheet data) never leaves the machine.
 *
 * - `index.web.ts` → Chrome's built-in Prompt API (Gemini Nano), Chrome 148+ on desktop.
 * - `index.ts`     → native (iOS/Android): unavailable for now.
 *
 * Every implementation reports `availability`, so callers show a fallback without platform checks.
 */
export type OnDeviceAiAvailability =
  /** Still asking the browser. */
  | 'checking'
  /** This browser/device can't run the model (other browsers, mobile, not enough disk/GPU…). */
  | 'unavailable'
  /** Supported, but the model must be downloaded first — the first `prompt` triggers it. */
  | 'downloadable'
  | 'downloading'
  | 'available';

export type OnDeviceAiPromptOptions = {
  /** System prompt for this request. */
  system: string;
  /** JSON Schema the answer must follow (the model is constrained to it, so `JSON.parse` is safe). */
  responseConstraint?: Record<string, unknown>;
  signal?: AbortSignal;
};

export type OnDeviceAi = {
  availability: OnDeviceAiAvailability;
  /** Model download progress (0–1) while `availability` is `downloading`, otherwise null. */
  downloadProgress: number | null;
  /**
   * Sends one stateless prompt and resolves to the full answer. Downloads the model first when
   * needed, so call it from a user action (a click/submit), which the browser requires.
   */
  prompt: (input: string, options: OnDeviceAiPromptOptions) => Promise<string>;
};

export type OnDeviceAiContract = {
  useOnDeviceAi: () => OnDeviceAi;
};
