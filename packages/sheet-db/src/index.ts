/**
 * Sheet DB, native implementation (iOS/Android).
 * Follows the same contract as the web implementation (see `contract.ts` and `index.web.ts`).
 *
 * The Google Picker is web-only and native sign-in isn't implemented yet, so the sheet is never
 * connected and `connect`/`setSetting` reject with a clear error.
 *
 * TODO: once native sign-in exists, grant access to the linked file (e.g. via a web-based Picker
 * flow) and reuse `sheets-api.ts`, which is plain `fetch` and works on every platform.
 */
import type { SheetDbContract } from './contract';

const notAvailable = () => Promise.reject(new Error('Sheet DB is not available on this platform yet.'));

export const useSheetDb: SheetDbContract['useSheetDb'] = () => ({
  status: 'needs-access',
  title: null,
  tabs: [],
  connect: notAvailable,
  settings: undefined,
  isLoadingSettings: false,
  error: null,
  setSetting: notAvailable,
});

export const useSheetTab: SheetDbContract['useSheetTab'] = () => ({
  rows: [],
  isLoading: false,
  error: null,
  setCell: notAvailable,
});

export const useSheetTabs: SheetDbContract['useSheetTabs'] = () => ({
  data: {},
  isLoading: false,
  error: null,
});

const sheetDb = { useSheetDb, useSheetTab, useSheetTabs } satisfies SheetDbContract;

export default sheetDb;
export type { SheetDb, SheetDbSettings, SheetDbStatus, SheetTab, SheetTabs } from './contract';
export { columnLetter } from './sheets-api';
