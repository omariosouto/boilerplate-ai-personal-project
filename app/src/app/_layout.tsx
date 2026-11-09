import { AuthProvider } from '@repo/auth';
import { HotkeysProvider } from '@repo/hotkeys';
import { StateManagementProvider } from '@repo/state-management';
import { useColorScheme } from '@repo/ui';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';

import { AppThemeProvider } from '@/components/app-theme-provider';

const googleClientIds = {
  web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
};

export default function RootLayout() {
  return (
    <AuthProvider googleClientIds={googleClientIds}>
      <StateManagementProvider>
        <HotkeysProvider>
          <AppThemeProvider>
            <Navigation />
          </AppThemeProvider>
        </HotkeysProvider>
      </StateManagementProvider>
    </AuthProvider>
  );
}

function Navigation() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
