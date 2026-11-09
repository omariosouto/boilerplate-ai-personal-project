/**
 * Facts about the linked spreadsheet, computed in code — never by the model. A small on-device
 * model is bad at counting, so the chat hands it these numbers and its components read them back
 * from here, which keeps every number on screen exact.
 *
 * Row 1 of each tab is treated as the header; data rows are the non-empty rows below it.
 */
export type TabFacts = {
  name: string;
  /** Header cells (row 1); a blank header becomes its position, e.g. "Column 3". */
  columns: string[];
  /** Data rows below the header, skipping rows where every cell is empty. */
  rows: string[][];
};

export type SheetFacts = {
  tabs: TabFacts[];
};

function isBlank(row: string[]) {
  return row.every((cell) => cell.trim() === '');
}

export function computeSheetFacts(data: Record<string, string[][]>): SheetFacts {
  return {
    tabs: Object.entries(data).map(([name, values]) => {
      const [header = [], ...body] = values;
      const width = Math.max(header.length, ...body.map((row) => row.length));
      const columns = Array.from({ length: width }, (_, index) => header[index]?.trim() || `Column ${index + 1}`);
      return { name, columns, rows: body.filter((row) => !isBlank(row)) };
    }),
  };
}

export function findTab(facts: SheetFacts, name: string | undefined) {
  return facts.tabs.find((tab) => tab.name === name) ?? null;
}

/** How many times each value appears in a column (blank cells count as "(empty)"), most frequent first. */
export function valueCounts(tab: TabFacts, column: string, limit = 8): { label: string; value: number }[] {
  const index = tab.columns.indexOf(column);
  if (index === -1) return [];
  const counts = new Map<string, number>();
  for (const row of tab.rows) {
    const value = row[index]?.trim() || '(empty)';
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, limit);
}

/** Data rows per tab, for a "rows per tab" chart. */
export function rowsPerTab(facts: SheetFacts): { label: string; value: number }[] {
  return facts.tabs.map((tab) => ({ label: tab.name, value: tab.rows.length }));
}

/**
 * The plain-text summary sent to the model: tab names, exact row counts, columns and a few sample
 * rows. Kept short — the on-device model has a small context window.
 */
export function describeSheetFacts(facts: SheetFacts, sampleRows = 3): string {
  return facts.tabs
    .map((tab) => {
      const sample = tab.rows
        .slice(0, sampleRows)
        .map((row) => `  - ${tab.columns.map((column, index) => `${column}: ${row[index] ?? ''}`).join('; ')}`)
        .join('\n');
      return [
        `Tab "${tab.name}": ${tab.rows.length} data rows (not counting the header).`,
        `  Columns: ${tab.columns.join(', ') || '(none)'}`,
        sample && `  Sample rows:\n${sample}`,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');
}
