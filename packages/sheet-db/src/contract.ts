/**
 * Public API of `@repo/sheet-db`: a Google Sheet, chosen by the user, used as the app's database.
 *
 * Access model: the app only ever touches the ONE spreadsheet the user linked. It asks for the
 * `drive.file` scope and the user confirms that file in the Google Picker; Google then grants access
 * to that file only (no access to the rest of the user's Drive).
 *
 * Expected layout: a `Settings` tab with `key | value` in columns A:B (row 1 is the header).
 *
 * - `index.web.ts` → Google Picker + Sheets REST API
 * - `index.ts`     → native (iOS/Android)
 */
export type SheetDbStatus =
  /** Access not checked yet. */
  | 'checking'
  /** The user hasn't granted access to this spreadsheet yet: call `connect()`. */
  | 'needs-access'
  | 'connected';

export type SheetDbSettings = Record<string, string>;

export type SheetDbOptions = {
  /** The spreadsheet id the user linked, or null when there is no link yet. */
  spreadsheetId: string | null;
  /** API key restricted to the Google Picker API. */
  pickerApiKey: string;
  /** Google Cloud project number (the Picker's app id). */
  projectNumber: string;
};

export type SheetDb = {
  status: SheetDbStatus;
  /** Spreadsheet title, once connected. */
  title: string | null;
  /** Tab names, in Google Sheets order. */
  tabs: string[];
  /** Opens the Google Picker on the linked spreadsheet so the user grants access to it. */
  connect: () => Promise<void>;
  settings: SheetDbSettings | undefined;
  isLoadingSettings: boolean;
  error: Error | null;
  setSetting: (key: string, value: string) => Promise<void>;
};

export type SheetTab = {
  /** Every used cell, row by row (row 0 = spreadsheet row 1). Rows can have different lengths. */
  rows: string[][];
  isLoading: boolean;
  error: Error | null;
  /** Writes one cell (0-based row/column) as if typed in Google Sheets. */
  setCell: (row: number, column: number, value: string) => Promise<void>;
};

export type SheetTabOptions = {
  spreadsheetId: string | null;
  tab: string | null;
};

export type SheetTabs = {
  /** Every used cell of each tab, keyed by tab name (same shape as `SheetTab['rows']`). */
  data: Record<string, string[][]>;
  isLoading: boolean;
  error: Error | null;
};

export type SheetTabsOptions = {
  spreadsheetId: string | null;
  tabs: string[];
};

export type SheetDbContract = {
  useSheetDb: (options: SheetDbOptions) => SheetDb;
  /** Reads/writes any tab of the connected spreadsheet. Use after `useSheetDb` reports `connected`. */
  useSheetTab: (options: SheetTabOptions) => SheetTab;
  /** Reads several tabs at once (read-only), e.g. to summarize the whole spreadsheet. */
  useSheetTabs: (options: SheetTabsOptions) => SheetTabs;
};
