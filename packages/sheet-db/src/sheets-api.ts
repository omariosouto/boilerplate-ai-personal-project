/** Minimal Google Sheets REST client. Every call uses the signed-in user's access token. */
const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

export const SETTINGS_TAB = 'Settings';

export class SheetsApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

async function request<T>(accessToken: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new SheetsApiError(body?.error?.message ?? `Sheets API error (${response.status})`, response.status);
  }
  return (await response.json()) as T;
}

/** Spreadsheet title + tab names, in the order they appear in Google Sheets. */
export async function getSpreadsheetInfo(accessToken: string, spreadsheetId: string) {
  const data = await request<{ properties: { title: string }; sheets?: { properties: { title: string } }[] }>(
    accessToken,
    `${spreadsheetId}?fields=properties.title,sheets.properties.title`
  );
  return { title: data.properties.title, tabs: (data.sheets ?? []).map((sheet) => sheet.properties.title) };
}

/** A1 notation helpers: column 0 → "A", 25 → "Z", 26 → "AA". Tab names are quoted ('My tab'!A1). */
export function columnLetter(index: number): string {
  let letter = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letter = String.fromCharCode(65 + ((n - 1) % 26)) + letter;
  }
  return letter;
}

function quoteTab(tab: string) {
  return `'${tab.replace(/'/g, "''")}'`;
}

/** Reads every used cell of a tab as rows of strings (formatted values, as shown in Google Sheets). */
export async function readTab(accessToken: string, spreadsheetId: string, tab: string) {
  const data = await request<{ values?: string[][] }>(
    accessToken,
    `${spreadsheetId}/values/${encodeURIComponent(quoteTab(tab))}`
  );
  return data.values ?? [];
}

/** Reads several tabs in one request (`values:batchGet`), keyed by tab name. */
export async function readTabs(accessToken: string, spreadsheetId: string, tabs: string[]) {
  if (tabs.length === 0) return {};
  const ranges = tabs.map((tab) => `ranges=${encodeURIComponent(quoteTab(tab))}`).join('&');
  const data = await request<{ valueRanges?: { values?: string[][] }[] }>(
    accessToken,
    `${spreadsheetId}/values:batchGet?${ranges}`
  );
  return Object.fromEntries(tabs.map((tab, index) => [tab, data.valueRanges?.[index]?.values ?? []]));
}

/** Writes one cell, parsed like typing it in Google Sheets (numbers, dates and formulas included). */
export async function writeCell(
  accessToken: string,
  spreadsheetId: string,
  tab: string,
  row: number,
  column: number,
  value: string
) {
  const range = encodeURIComponent(`${quoteTab(tab)}!${columnLetter(column)}${row + 1}`);
  await request(accessToken, `${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    body: JSON.stringify({ values: [[value]] }),
  });
}

/** Reads the `Settings` tab (A:B, header in row 1) as `{ key: value }`. */
export async function readSettings(accessToken: string, spreadsheetId: string) {
  const data = await request<{ values?: string[][] }>(
    accessToken,
    `${spreadsheetId}/values/${encodeURIComponent(`${SETTINGS_TAB}!A2:B`)}`
  );
  const settings: Record<string, string> = {};
  for (const [key, value = ''] of data.values ?? []) {
    if (key) settings[key] = value;
  }
  return settings;
}

/** Updates the row for `key` in the `Settings` tab, or appends one when the key doesn't exist yet. */
export async function writeSetting(accessToken: string, spreadsheetId: string, key: string, value: string) {
  const data = await request<{ values?: string[][] }>(
    accessToken,
    `${spreadsheetId}/values/${encodeURIComponent(`${SETTINGS_TAB}!A2:A`)}`
  );
  const index = (data.values ?? []).findIndex(([cell]) => cell === key);

  if (index >= 0) {
    const range = encodeURIComponent(`${SETTINGS_TAB}!B${index + 2}`);
    await request(accessToken, `${spreadsheetId}/values/${range}?valueInputOption=RAW`, {
      method: 'PUT',
      body: JSON.stringify({ values: [[value]] }),
    });
  } else {
    const range = encodeURIComponent(`${SETTINGS_TAB}!A:B`);
    await request(accessToken, `${spreadsheetId}/values/${range}:append?valueInputOption=RAW`, {
      method: 'POST',
      body: JSON.stringify({ values: [[key, value]] }),
    });
  }
}
