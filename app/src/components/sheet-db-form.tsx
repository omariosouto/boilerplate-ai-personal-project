import { usePersistedState } from '@repo/state-management/persisted-state';
import { Button, Input, Label, useTheme } from '@repo/ui';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SheetDbConnection } from '@/components/sheet-db-connection';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { parseGoogleSheetUrl } from '@/utils/google-sheets';

/** Lets the user point the app at their own Google Sheet ("Sheet DB"). Saved per device. */
export function SheetDbForm() {
  const theme = useTheme();
  const [savedUrl, setSavedUrl, removeSavedUrl] = usePersistedState('sheet-db-url', '');
  // `null` = not edited: the field shows the saved value (which loads from storage after mount).
  const [edited, setEdited] = useState<string | null>(null);
  const draft = edited ?? savedUrl;

  function save() {
    setSavedUrl(draft.trim());
    setEdited(null);
  }

  function clear() {
    removeSavedUrl();
    setEdited(null);
  }

  const parsed = parseGoogleSheetUrl(draft);
  const savedSheet = parseGoogleSheetUrl(savedUrl);
  const isInvalid = draft.trim() !== '' && !parsed;
  const isDirty = draft.trim() !== savedUrl;

  return (
    <View style={styles.container}>
      <Label nativeID="sheet-db-label">Sheet DB</Label>
      <Input
        type="url"
        aria-labelledby="sheet-db-label"
        aria-invalid={isInvalid}
        placeholder="https://docs.google.com/spreadsheets/d/…"
        value={draft}
        onChangeText={setEdited}
        onSubmitEditing={() => parsed && isDirty && save()}
      />
      <ThemedText type="small" style={{ color: isInvalid ? theme.destructive : theme.mutedForeground }}>
        {isInvalid
          ? 'Paste a Google Sheets link (docs.google.com/spreadsheets/d/…).'
          : savedUrl && !isDirty
            ? `Saved on this device · ${savedSheet?.spreadsheetId}`
            : 'The link to the spreadsheet this app will use as its database.'}
      </ThemedText>
      <View style={styles.actions}>
        <Button size="sm" disabled={!parsed || !isDirty} onPress={save}>
          Save
        </Button>
        {savedUrl !== '' && (
          <Button size="sm" variant="ghost" onPress={clear}>
            Clear
          </Button>
        )}
      </View>
      {savedSheet && !isDirty && <SheetDbConnection spreadsheetId={savedSheet.spreadsheetId} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
