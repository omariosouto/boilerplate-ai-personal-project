/**
 * Design tokens shared by every app in the monorepo.
 * Token names follow shadcn/ui so web and native components speak the same language.
 */

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    // shadcn/ui tokens (neutral base), same names as the web theme
    primary: '#171717',
    primaryForeground: '#FAFAFA',
    secondary: '#F5F5F5',
    secondaryForeground: '#171717',
    accent: '#F5F5F5',
    accentForeground: '#171717',
    destructive: '#E7000B',
    destructiveForeground: '#FFFFFF',
    border: '#E5E5E5',
    input: '#E5E5E5',
    ring: '#A1A1A1',
    mutedForeground: '#737373',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    primary: '#E5E5E5',
    primaryForeground: '#171717',
    secondary: '#262626',
    secondaryForeground: '#FAFAFA',
    accent: '#262626',
    accentForeground: '#FAFAFA',
    destructive: '#FF6467',
    destructiveForeground: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.1)',
    input: 'rgba(255, 255, 255, 0.15)',
    ring: '#737373',
    mutedForeground: '#A1A1A1',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 6,
  md: 8,
  lg: 10,
} as const;
