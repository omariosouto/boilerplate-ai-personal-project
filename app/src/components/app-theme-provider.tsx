import { useSheetDb } from '@repo/sheet-db';
import { usePersistedState } from '@repo/state-management/persisted-state';
import { ColorSchemeProvider, type ColorScheme } from '@repo/ui';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { parseGoogleSheetUrl } from '@/utils/google-sheets';

const pickerApiKey = process.env.EXPO_PUBLIC_GOOGLE_PICKER_API_KEY ?? '';
const projectNumber = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_PROJECT_NUMBER ?? '';

type AppTheme = {
  colorScheme: ColorScheme;
  /** Switches immediately, saves on this device, and to the Sheet DB `theme` setting when connected. */
  setColorScheme: (colorScheme: ColorScheme) => Promise<void>;
  /** Whether the choice is also saved to the user's Google Sheet. */
  isSyncedWithSheet: boolean;
};

const AppThemeContext = createContext<AppTheme | null>(null);

function toColorScheme(value: string | undefined): ColorScheme | null {
  return value === 'dark' || value === 'light' ? value : null;
}

/**
 * The app's color scheme. Source of truth, in order:
 * 1. a change the user just made (until the sheet confirms it)
 * 2. the `theme` setting in the user's Sheet DB
 * 3. the last choice on this device (also avoids a flash before the sheet loads)
 * 4. light
 */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [sheetUrl] = usePersistedState('sheet-db-url', '');
  const [localTheme, setLocalTheme] = usePersistedState<ColorScheme>('theme', 'light');
  const [pendingTheme, setPendingTheme] = useState<ColorScheme | null>(null);

  const spreadsheetId = parseGoogleSheetUrl(sheetUrl)?.spreadsheetId ?? null;
  const { status, settings, setSetting } = useSheetDb({ spreadsheetId, pickerApiKey, projectNumber });
  const isSyncedWithSheet = status === 'connected';

  const colorScheme = pendingTheme ?? toColorScheme(settings?.theme) ?? localTheme;

  const setColorScheme = useCallback(
    async (next: ColorScheme) => {
      setPendingTheme(next);
      setLocalTheme(next);
      try {
        if (isSyncedWithSheet) await setSetting('theme', next);
      } finally {
        setPendingTheme(null);
      }
    },
    [isSyncedWithSheet, setSetting, setLocalTheme]
  );

  const value = useMemo(
    () => ({ colorScheme, setColorScheme, isSyncedWithSheet }),
    [colorScheme, setColorScheme, isSyncedWithSheet]
  );

  return (
    <AppThemeContext.Provider value={value}>
      <ColorSchemeProvider colorScheme={colorScheme}>{children}</ColorSchemeProvider>
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) throw new Error('useAppTheme must be used inside <AppThemeProvider>');
  return context;
}
