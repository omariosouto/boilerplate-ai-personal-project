import { useSheetDb } from '@repo/sheet-db';
import { Button, useTheme } from '@repo/ui';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { SheetChat } from '@/components/sheet-chat';
import { SheetGrid } from '@/components/sheet-grid';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';

const pickerApiKey = process.env.EXPO_PUBLIC_GOOGLE_PICKER_API_KEY ?? '';
const projectNumber = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_PROJECT_NUMBER ?? '';

/** Grants access to the linked spreadsheet, shows its tabs and the floating sheet chat. */
export function SheetDbConnection({ spreadsheetId }: { spreadsheetId: string }) {
  const theme = useTheme();
  const sheetDb = useSheetDb({ spreadsheetId, pickerApiKey, projectNumber });
  const [actionError, setActionError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setActionError(null);
    setIsBusy(true);
    try {
      await action();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setIsBusy(false);
    }
  }

  const error = actionError ?? sheetDb.error?.message;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {sheetDb.status === 'checking' && <ThemedText type="small">Checking access…</ThemedText>}

      {sheetDb.status === 'needs-access' && (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Allow this app to read and write this spreadsheet only. Google will ask you to confirm the file.
          </ThemedText>
          <Button size="sm" disabled={isBusy} onPress={() => run(sheetDb.connect)}>
            {isBusy ? 'Connecting…' : 'Connect sheet'}
          </Button>
        </>
      )}

      {sheetDb.status === 'connected' && (
        <>
          <ThemedText type="smallBold">Connected · {sheetDb.title}</ThemedText>
          <SheetGrid spreadsheetId={spreadsheetId} tabs={sheetDb.tabs} />
          <SheetChat spreadsheetId={spreadsheetId} tabs={sheetDb.tabs} />
        </>
      )}

      {error && (
        <ThemedText type="small" style={{ color: theme.destructive }}>
          {error}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
});
