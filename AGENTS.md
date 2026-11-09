# AGENTS.md

Instructions for AI agents (Claude Code, Codex, Cursor, etc.) working in this repository.

## About the project

A public boilerplate for building projects with AI, based on Mario Souto's workflow.

## Structure

npm workspaces monorepo:

```
app/                        # Expo app (iOS, Android, web) — Expo Router, routes in app/src/app/
packages/ui/                # @repo/ui — shared base components and design tokens
packages/state-management/  # @repo/state-management — async state and URL query state
packages/hotkeys/           # @repo/hotkeys — keyboard shortcuts
packages/auth/              # @repo/auth — Google sign-in
packages/sheet-db/          # @repo/sheet-db — the user's Google Sheet as the app database
packages/on-device-ai/      # @repo/on-device-ai — on-device LLM (Chrome's Prompt API / Gemini Nano)
packages/generative-ui/     # @repo/generative-ui — AI answers rendered as components (json-render)
```

```bash
npm install              # install everything from the repo root
npm run app              # start the Expo dev server (also app:ios, app:android, app:web)
npm run typecheck        # typecheck all workspaces
npm run lint             # lint all workspaces
```

## Conventions

- **Base components live in `@repo/ui`.** Buttons, inputs, cards, dialogs and other building blocks go in `packages/ui/`, never inside `app/`. The app imports them from `@repo/ui`. `app/src/components/` is only for app-specific compositions.
- **`@repo/ui` mirrors shadcn/ui.** Every base component keeps the public API of its shadcn/ui counterpart: same exports, props, variants, defaults and state names. Follow the `native-from-shadcn` skill.
- **Icons come from `lucide-react-native`**, the same icon set shadcn/ui uses on the web.
- **Design tokens live in `packages/ui/src/theme.ts`**, named after shadcn/ui tokens (`primary`, `primaryForeground`, `destructive`, `border`…). Don't hardcode colors in components.
- **Third-party libraries are used through proxy packages**, never imported directly (ESLint blocks it in `app/`). Need something a proxy doesn't export yet? Add it to the proxy.
- **State goes through `@repo/state-management`.** `StateManagementProvider` is mounted once in the root layout.
  - `@repo/state-management/async-state` — server state: fetching, caching, mutations. Proxy for [TanStack Query](https://tanstack.com/query/latest).
  - `@repo/state-management/persisted-state` — `usePersistedState(key, default)`: state that survives reloads on this device. Web: `localStorage`. Native: same contract, in memory for now. Never touch `localStorage` directly (ESLint blocks it).
  - `@repo/state-management/query-state` — state that lives in the URL (filters, tabs, pagination). Proxy for [nuqs](https://nuqs.dev), with a custom Expo Router adapter so it works on web and native.
- **Keyboard shortcuts go through `@repo/hotkeys`**, a proxy for [TanStack Hotkeys](https://tanstack.com/hotkeys/latest). `HotkeysProvider` is mounted in the root layout. The native implementation is a no-op for now, so register hotkeys without platform checks.
- **Auth goes through `@repo/auth`** (`AuthProvider` in the root layout, `useAuth()` in screens). Web: Google Identity Services, 100% client-side, session in `sessionStorage`. Native: same contract, not implemented yet. Client IDs come from `app/.env.local` (see `app/.env.example`).
- **Data lives in the user's own Google Sheet, through `@repo/sheet-db`.** The user pastes the link (saved per device with `usePersistedState`), then grants access with the Google Picker. The app asks only for `drive.file`, so it can read/write that one spreadsheet and nothing else in the user's Drive. Never request broader scopes like `spreadsheets` or `drive`. Config lives in the `Settings` tab (`key | value`); e.g. `theme` (`light`/`dark`) drives the app's color scheme via `AppThemeProvider` → `ColorSchemeProvider` from `@repo/ui`.
- **AI runs on the user's device, through `@repo/on-device-ai`.** Web: Chrome's built-in Prompt API (Gemini Nano, Chrome 148+ desktop) — no server, no API key, data never leaves the device. Native: same contract, reports `unavailable` for now. Always handle `availability` (unsupported browsers, first-run model download). The model is small: compute numbers in code and let it only choose what to show; constrain its output with `responseConstraint` (JSON Schema).
- **AI-generated UI goes through `@repo/generative-ui`**, a proxy for [json-render](https://json-render.dev) (React Native renderer, so it runs on web and native). Define a catalog + registry; the model's answer becomes a spec that `Renderer` draws. The sheet chat (`app/src/components/sheet-chat*.tsx`) is the reference example.
- **Web API first, native follows the same contract.** When a library only works on the web, its proxy package defines the public API in `contract.ts` (taken from the web library), implements it in `index.web.ts`, and implements the same contract for iOS/Android in `index.ts`. Callers never branch on platform. A native implementation may start as a no-op, but it must keep the contract so it can be filled in later without touching callers. `packages/hotkeys/` is the reference example; `@repo/ui` applies the same idea to shadcn/ui.

## Expo

The app in `app/` is an Expo / React Native application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

### Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `app/package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

### Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

Run these from `app/`.

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

### Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `app/src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `app/src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

### Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

### Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app/app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Skills

Skills live in `.agents/skills/` (the source of truth, in an agent-agnostic format).
For agents that read from a different folder, such as Claude Code (`.claude/skills/`), there are symlinks pointing to `.agents/skills/`.

Skills are installed via [skills.sh](https://skills.sh) and tracked in `skills-lock.json`. To restore them after cloning:

```bash
npx skills experimental_install
```

To add a new skill:

```bash
npx skills add <owner>/<repo> --skill <name> -a universal claude-code -y
```
