---
name: native-from-shadcn
description: Create or modify a React Native / Expo UI component by mirroring the public API of its shadcn/ui counterpart, so web and native components share the same props, variants, composition and naming. Use whenever building, scaffolding, or refactoring a component for the native (iOS/Android/Expo) side of the project — buttons, inputs, cards, dialogs, sheets, selects, tabs, toasts, etc. — or when the user asks for a "native version" of a web component. Not for web components (use the shadcn skill) or for screens/navigation (use expo-router).
---

# Native from shadcn

Native components in this project share their **public API** with shadcn/ui. A developer who knows `<Button variant="outline" size="sm">` on the web writes the same thing on native. The **implementation** is native; only the API is borrowed.

## Where components live

Base components go in `packages/ui/src/components/<name>.tsx` (the `@repo/ui` package), one file per shadcn component, kebab-case like shadcn (`button.tsx`, `alert-dialog.tsx`). Export each one from `packages/ui/src/index.ts`. Never put a base component inside `app/`; the app imports it from `@repo/ui`. Tokens come from `packages/ui/src/theme.ts` and are read with `useTheme()`.

## Process

### 1. Find the shadcn counterpart

Before writing code, identify the closest shadcn/ui component.

- Load the `shadcn` skill for project context and component docs.
- Read the source of the reference component, e.g. `npx shadcn@latest view <component>`, or the copy in the web app's `components/ui/` if one exists. Read the code itself, not just the docs: the props, `cva` variants and sub-components live in the source.
- If the web app already has a customized version of the component, that version is the reference, not upstream shadcn.

If there is no counterpart, say so and go to step 5.

### 2. Extract the API contract

Write down, before implementing:

- **Exports and composition**: every sub-component and its name (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`).
- **Props**: names, types and defaults.
- **Variants**: every `variant` / `size` value, with the same names and default.
- **State API**: controlled/uncontrolled pairs exactly as shadcn names them (`open` / `defaultOpen` / `onOpenChange`, `value` / `defaultValue` / `onValueChange`, `checked` / `onCheckedChange`).
- **Escape hatches**: `className` (if the project styles with NativeWind) or `style`, `asChild` if the component supports it.

### 3. Translate only what the platform forces

Keep everything from step 2 unless the platform makes it impossible. Allowed translations:

| Web | Native |
| --- | --- |
| `onClick` | `onPress` |
| `disabled` on `<button>` | `disabled` on `Pressable` (same name) |
| `:hover` styles | dropped, or mapped to pressed state |
| `:focus-visible` ring | focus state only where a keyboard/TV is relevant |
| HTML element props (`<div>` attrs) | the matching RN component props (`ViewProps`, `TextProps`, `PressableProps`) |
| Portals (`Dialog`, `Popover`) | native modal / sheet presentation |

Anything else that changes is a deliberate deviation and must be documented (step 6).

### 4. Implement natively

Pick the implementation in this order:

1. **`@expo/ui`** when it has the control (sheets, pickers, switches, sliders, menus, grouped forms). Load the `expo-ui` skill. Wrap it so the outside API is the shadcn one.
2. **Existing components in `@repo/ui`**, composing them instead of duplicating.
3. **React Native core + Reanimated / Gesture Handler** for everything else. Load `expo-native-ui`, plus `expo-animation` or `animate-expo` for motion.

Style with `StyleSheet` and the tokens in `packages/ui/src/theme.ts` (`Colors`, `Spacing`, `Radius`). Don't introduce a new styling solution for one component. If shadcn uses a token the theme doesn't have yet (`muted`, `ring`, `popover`…), add it to both light and dark with the shadcn name.

### 5. No counterpart in shadcn

Still follow shadcn conventions: compound sub-components with the parent's name as prefix, `variant` / `size` with `default` as the default value, controlled/uncontrolled state with the `value` / `defaultValue` / `onValueChange` pattern, and `className` or `style` passthrough.

### 6. Document the mapping

At the top of the component file, add a short header:

```ts
/**
 * Native counterpart of shadcn/ui <Dialog>.
 * API: identical, except:
 * - `onClick` → `onPress` on DialogTrigger
 * - DialogContent renders as a native form sheet on iOS
 */
```

If nothing deviates, write `API: identical.`

## Checklist

- [ ] Reference shadcn component identified and its source read
- [ ] Same exports, sub-component names, props, variants and defaults
- [ ] Controlled/uncontrolled state names match shadcn
- [ ] Only platform-forced translations applied
- [ ] Implemented with `@expo/ui` where available
- [ ] Lives in `packages/ui/src/components/` and is exported from `@repo/ui`
- [ ] Uses the theme tokens, no hardcoded colors
- [ ] Header comment documents the mapping and any deviations
