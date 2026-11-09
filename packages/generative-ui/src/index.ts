/**
 * Generative UI: an AI answers with a JSON spec of components (a catalog you define), and this
 * renders it. Proxy for json-render — https://json-render.dev
 *
 * Uses the React Native renderer, which runs on iOS, Android and the web (react-native-web), so a
 * single catalog/registry works on every platform — no `contract.ts` split needed.
 *
 * The app imports from `@repo/generative-ui`, never from `@json-render/*` directly. Catalog prop
 * schemas are zod schemas, re-exported here as `z`.
 */
export { defineCatalog, validateSpec, type Spec, type UIElement } from '@json-render/core';
export { defineRegistry, JSONUIProvider, Renderer, type Components } from '@json-render/react-native';
export { schema } from '@json-render/react-native/schema';
export { z } from 'zod';
