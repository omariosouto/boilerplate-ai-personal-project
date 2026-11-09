/**
 * Sheet DB, web implementation: Google Picker (grants `drive.file` access to the linked file only)
 * + Google Sheets REST API, cached with `@repo/state-management/async-state`.
 */
import { useAuth } from '@repo/auth';
import { useMutation, useQuery, useQueryClient } from '@repo/state-management/async-state';
import { useCallback } from 'react';

import type { SheetDb, SheetDbContract, SheetDbOptions, SheetDbStatus, SheetTab, SheetTabOptions } from './contract';
import { pickSpreadsheet } from './picker';
import { getSpreadsheetInfo, readSettings, readTab, SheetsApiError, writeCell, writeSetting } from './sheets-api';

const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export function useSheetDb({ spreadsheetId, pickerApiKey, projectNumber }: SheetDbOptions): SheetDb {
  const { accessToken, grantedScopes, authorize } = useAuth();
  const queryClient = useQueryClient();
  const hasScope = grantedScopes.includes(DRIVE_FILE_SCOPE);
  const enabled = Boolean(spreadsheetId && accessToken && hasScope);

  // 403/404 = the user hasn't confirmed this file in the Picker yet (or it doesn't exist).
  const access = useQuery({
    queryKey: ['sheet-db', spreadsheetId, 'info'],
    queryFn: async () => {
      try {
        return await getSpreadsheetInfo(accessToken!, spreadsheetId!);
      } catch (error) {
        if (error instanceof SheetsApiError && (error.status === 403 || error.status === 404)) return null;
        throw error;
      }
    },
    enabled,
    retry: false,
  });

  const connected = Boolean(access.data);

  const settings = useQuery({
    queryKey: ['sheet-db', spreadsheetId, 'settings'],
    queryFn: () => readSettings(accessToken!, spreadsheetId!),
    enabled: enabled && connected,
  });

  const mutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      writeSetting(accessToken!, spreadsheetId!, key, value),
    // Any write can change any view of the sheet (a Settings edit is also a tab edit), so refetch all.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sheet-db', spreadsheetId] }),
  });

  const connect = useCallback(async () => {
    if (!spreadsheetId) throw new Error('Save the spreadsheet link first.');
    const token = await authorize([DRIVE_FILE_SCOPE]);
    await pickSpreadsheet({ fileId: spreadsheetId, accessToken: token, apiKey: pickerApiKey, appId: projectNumber });
    await queryClient.invalidateQueries({ queryKey: ['sheet-db', spreadsheetId] });
  }, [spreadsheetId, authorize, pickerApiKey, projectNumber, queryClient]);

  const setSetting = useCallback(
    async (key: string, value: string) => {
      await mutation.mutateAsync({ key, value });
    },
    [mutation]
  );

  let status: SheetDbStatus = 'needs-access';
  if (enabled && access.isPending) status = 'checking';
  else if (connected) status = 'connected';

  return {
    status,
    title: access.data?.title ?? null,
    tabs: access.data?.tabs ?? [],
    connect,
    settings: settings.data,
    isLoadingSettings: settings.isPending && settings.fetchStatus !== 'idle',
    error: access.error ?? settings.error ?? mutation.error ?? null,
    setSetting,
  };
}

export function useSheetTab({ spreadsheetId, tab }: SheetTabOptions): SheetTab {
  const { accessToken, grantedScopes } = useAuth();
  const queryClient = useQueryClient();
  const enabled = Boolean(spreadsheetId && tab && accessToken && grantedScopes.includes(DRIVE_FILE_SCOPE));

  const query = useQuery({
    queryKey: ['sheet-db', spreadsheetId, 'tab', tab],
    queryFn: () => readTab(accessToken!, spreadsheetId!, tab!),
    enabled,
  });

  const mutation = useMutation({
    mutationFn: ({ row, column, value }: { row: number; column: number; value: string }) =>
      writeCell(accessToken!, spreadsheetId!, tab!, row, column, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sheet-db', spreadsheetId] }),
  });

  const setCell = useCallback(
    async (row: number, column: number, value: string) => {
      await mutation.mutateAsync({ row, column, value });
    },
    [mutation]
  );

  return {
    rows: query.data ?? [],
    isLoading: query.isPending && query.fetchStatus !== 'idle',
    error: query.error ?? mutation.error ?? null,
    setCell,
  };
}

const sheetDb = { useSheetDb, useSheetTab } satisfies SheetDbContract;

export default sheetDb;
export type { SheetDb, SheetDbSettings, SheetDbStatus, SheetTab } from './contract';
export { columnLetter } from './sheets-api';
