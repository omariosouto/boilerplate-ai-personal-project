export type GoogleSheetRef = {
  spreadsheetId: string;
  /** Tab id from `#gid=…`, when the link points to a specific tab. */
  gid?: string;
};

/**
 * Extracts the spreadsheet id from a Google Sheets link, e.g.
 * https://docs.google.com/spreadsheets/d/<spreadsheetId>/edit?gid=0#gid=0
 */
export function parseGoogleSheetUrl(url: string): GoogleSheetRef | null {
  const match = url.trim().match(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/);
  if (!match) return null;
  const gid = url.match(/[#?&]gid=(\d+)/)?.[1];
  return { spreadsheetId: match[1], gid };
}
