import { Switch, useTheme } from '@repo/ui';
import { Moon, Sun } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/components/app-theme-provider';
import { Spacing } from '@/constants/theme';

/** ☀︎ [switch] ☾ — the active side is highlighted. */
export function ThemeToggle() {
  const theme = useTheme();
  const { colorScheme, setColorScheme, isSyncedWithSheet } = useAppTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.container}>
      <Sun size={16} color={isDark ? theme.mutedForeground : theme.text} aria-hidden />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setColorScheme(checked ? 'dark' : 'light')}
        aria-label={`Dark mode${isSyncedWithSheet ? ' (saved to your sheet)' : ''}`}
      />
      <Moon size={16} color={isDark ? theme.text : theme.mutedForeground} aria-hidden />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
