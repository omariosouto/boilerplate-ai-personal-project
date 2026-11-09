import { columnLetter, useSheetTab } from '@repo/sheet-db';
import { Button, Input, useTheme } from '@repo/ui';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

const COLUMN_WIDTH = 140;
const ROW_HEADER_WIDTH = 44;
const ROW_HEIGHT = 32;
const MIN_COLUMNS = 4;
const MIN_ROWS = 8;

type CellPosition = { row: number; column: number };

/** A local, editable view of the linked Google Sheet: tabs at the bottom, A/B/C… and 1/2/3… headers. */
export function SheetGrid({ spreadsheetId, tabs }: { spreadsheetId: string; tabs: string[] }) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const tab = activeTab && tabs.includes(activeTab) ? activeTab : (tabs[0] ?? null);
  const { rows, isLoading, error, setCell } = useSheetTab({ spreadsheetId, tab });

  const [editing, setEditing] = useState<CellPosition | null>(null);
  const [draft, setDraft] = useState('');
  // Values just written, shown until the refetch from Google Sheets lands.
  const [pending, setPending] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const committing = useRef(false);

  const columnCount = Math.max(MIN_COLUMNS, ...rows.map((row) => row.length + 1));
  const rowCount = Math.max(MIN_ROWS, rows.length + 2);

  const key = (row: number, column: number) => `${tab}:${row}:${column}`;
  const valueAt = (row: number, column: number) => pending[key(row, column)] ?? rows[row]?.[column] ?? '';

  function startEditing(position: CellPosition) {
    setEditing(position);
    setDraft(valueAt(position.row, position.column));
    setSaveError(null);
  }

  async function commit() {
    if (!editing || committing.current) return;
    committing.current = true;
    const { row, column } = editing;
    const value = draft;
    setEditing(null);

    if (value !== valueAt(row, column)) {
      setPending((current) => ({ ...current, [key(row, column)]: value }));
      try {
        await setCell(row, column, value);
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : 'Could not save the cell.');
      } finally {
        setPending(({ [key(row, column)]: _, ...rest }) => rest);
      }
    }
    committing.current = false;
  }

  const lines = { borderColor: theme.border };
  const header = [styles.header, lines, { backgroundColor: theme.backgroundElement }];

  return (
    <View style={styles.container}>
      <View style={[styles.grid, lines, { backgroundColor: theme.background }]}>
        <ScrollView horizontal>
          <View>
            <View style={styles.row}>
              <View style={[header, styles.rowHeader]} />
              {Array.from({ length: columnCount }, (_, column) => (
                <View key={column} style={[header, styles.cell]}>
                  <Text style={[styles.headerText, { color: theme.textSecondary }]}>{columnLetter(column)}</Text>
                </View>
              ))}
            </View>

            {Array.from({ length: rowCount }, (_, row) => (
              <View key={row} style={styles.row}>
                <View style={[header, styles.rowHeader]}>
                  <Text style={[styles.headerText, { color: theme.textSecondary }]}>{row + 1}</Text>
                </View>
                {Array.from({ length: columnCount }, (_, column) => {
                  const isEditing = editing?.row === row && editing.column === column;
                  return (
                    <View key={column} style={[styles.cell, lines, isEditing && { borderColor: theme.ring, borderWidth: 2 }]}>
                      {isEditing ? (
                        <Input
                          autoFocus
                          value={draft}
                          onChangeText={setDraft}
                          onSubmitEditing={commit}
                          onBlur={commit}
                          onKeyPress={(e) => e.nativeEvent.key === 'Escape' && setEditing(null)}
                          style={styles.cellInput}
                        />
                      ) : (
                        <Pressable style={styles.cellPressable} onPress={() => startEditing({ row, column })}>
                          <Text numberOfLines={1} style={[styles.cellText, { color: theme.text }]}>
                            {valueAt(row, column)}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.tabs}>
        {tabs.map((name) => (
          <Button key={name} size="sm" variant={name === tab ? 'secondary' : 'ghost'} onPress={() => setActiveTab(name)}>
            {name}
          </Button>
        ))}
        {isLoading && (
          <ThemedText type="small" themeColor="textSecondary">
            Loading…
          </ThemedText>
        )}
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Click a cell to edit · Enter to save · Esc to cancel. Changes go straight to Google Sheets.
      </ThemedText>
      {(saveError ?? error?.message) && (
        <ThemedText type="small" style={{ color: theme.destructive }}>
          {saveError ?? error?.message}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  grid: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  header: {
    height: ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowHeader: {
    width: ROW_HEADER_WIDTH,
  },
  headerText: {
    fontSize: 12,
    fontWeight: 500,
  },
  cell: {
    width: COLUMN_WIDTH,
    height: ROW_HEIGHT,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cellPressable: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  cellText: {
    fontSize: 14,
  },
  cellInput: {
    height: '100%',
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: Spacing.two - 2,
    boxShadow: 'none',
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
