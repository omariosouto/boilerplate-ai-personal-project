import { createContext, useContext, type ReactNode } from 'react';

export type ColorScheme = 'light' | 'dark';

const ColorSchemeContext = createContext<ColorScheme>('light');

/**
 * Sets the color scheme for everything below it. Without a provider, light mode is the default on
 * every platform, regardless of the system setting.
 */
export function ColorSchemeProvider({ colorScheme, children }: { colorScheme: ColorScheme; children: ReactNode }) {
  return <ColorSchemeContext.Provider value={colorScheme}>{children}</ColorSchemeContext.Provider>;
}

export function useColorScheme(): ColorScheme {
  return useContext(ColorSchemeContext);
}
