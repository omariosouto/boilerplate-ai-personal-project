import { defineCatalog, defineRegistry, schema, z, type Components } from '@repo/generative-ui';
import { useTheme } from '@repo/ui';
import { createContext, useContext, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { findTab, rowsPerTab, valueCounts, type SheetFacts } from '@/utils/sheet-facts';

/**
 * The components the sheet chat can answer with (json-render catalog + registry). Specs only name
 * a tab/column; every number is read from `SheetFactsContext`, so the model can't get it wrong.
 * Specs are built by `answerToSpec` (`@/utils/sheet-answer`).
 */
export const sheetChatCatalog = defineCatalog(schema, {
  components: {
    Answer: { props: z.object({}), slots: ['default'], description: 'Stacks the answer parts.' },
    Message: { props: z.object({ text: z.string() }), slots: [], description: 'The answer text.' },
    Stat: {
      props: z.object({ label: z.string(), tab: z.string() }),
      slots: [],
      description: 'The number of data rows of a tab.',
    },
    BarChart: {
      props: z.object({ title: z.string(), tab: z.string().nullable(), column: z.string().nullable() }),
      slots: [],
      description: 'Rows per tab (no tab/column), or how often each value appears in a column.',
    },
    Table: {
      props: z.object({ tab: z.string(), limit: z.number() }),
      slots: [],
      description: 'The first rows of a tab.',
    },
  },
  actions: {},
});

export const SheetFactsContext = createContext<SheetFacts>({ tabs: [] });

export const { registry: sheetChatRegistry } = defineRegistry(sheetChatCatalog, {
  components: {
    Answer: ({ children }) => <View style={styles.answer}>{children}</View>,
    Message: ({ props }) => <ThemedText type="small">{props.text}</ThemedText>,
    Stat: ({ props }) => <StatView {...props} />,
    BarChart: ({ props }) => <BarChartView {...props} />,
    Table: ({ props }) => <TableView {...props} />,
  } as Components<typeof sheetChatCatalog>,
});

function Panel({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.panel, { borderColor: theme.border }]}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {children}
    </View>
  );
}

function StatView({ label, tab }: { label: string; tab: string }) {
  const facts = useContext(SheetFactsContext);
  const rows = findTab(facts, tab)?.rows.length ?? 0;
  return (
    <Panel title={label}>
      <ThemedText type="subtitle">{rows.toLocaleString()}</ThemedText>
    </Panel>
  );
}

function BarChartView({ title, tab, column }: { title: string; tab: string | null; column: string | null }) {
  const theme = useTheme();
  const facts = useContext(SheetFactsContext);
  const target = findTab(facts, tab ?? undefined);
  const bars = target && column ? valueCounts(target, column) : rowsPerTab(facts);
  const max = Math.max(1, ...bars.map((bar) => bar.value));

  return (
    <Panel title={title}>
      {bars.length === 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          No data to chart.
        </ThemedText>
      )}
      {bars.map((bar) => (
        <View key={bar.label} style={styles.barRow}>
          <ThemedText type="small" numberOfLines={1} style={styles.barLabel}>
            {bar.label}
          </ThemedText>
          <View style={[styles.barTrack, { backgroundColor: theme.backgroundSelected }]}>
            <View
              style={[styles.barFill, { width: `${(bar.value / max) * 100}%`, backgroundColor: theme.primary }]}
            />
          </View>
          <ThemedText type="smallBold" style={styles.barValue}>
            {bar.value}
          </ThemedText>
        </View>
      ))}
    </Panel>
  );
}

function TableView({ tab, limit }: { tab: string; limit: number }) {
  const theme = useTheme();
  const facts = useContext(SheetFactsContext);
  const target = findTab(facts, tab);
  if (!target) return null;
  const rows = target.rows.slice(0, limit);

  return (
    <Panel title={`${target.name} · first ${rows.length} of ${target.rows.length} rows`}>
      <ScrollView horizontal>
        <View>
          {[target.columns, ...rows].map((row, rowIndex) => (
            <View
              key={rowIndex}
              style={[styles.tableRow, rowIndex > 0 && { borderTopColor: theme.border, borderTopWidth: 1 }]}>
              {target.columns.map((_, columnIndex) => (
                <ThemedText
                  key={columnIndex}
                  type={rowIndex === 0 ? 'smallBold' : 'small'}
                  numberOfLines={1}
                  style={styles.tableCell}>
                  {row[columnIndex] ?? ''}
                </ThemedText>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </Panel>
  );
}

const styles = StyleSheet.create({
  answer: { gap: Spacing.two },
  panel: { gap: Spacing.two, padding: Spacing.two, borderWidth: 1, borderRadius: Radius.md },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  barLabel: { width: 96 },
  barTrack: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  barValue: { minWidth: 28, textAlign: 'right' },
  tableRow: { flexDirection: 'row', paddingVertical: Spacing.one },
  tableCell: { width: 110, paddingRight: Spacing.two },
});
