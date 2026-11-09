import { parseGoogleSheetUrl } from './google-sheets';

// Run with: npx tsx app/src/utils/google-sheets.test.ts
const cases: [string, ReturnType<typeof parseGoogleSheetUrl>][] = [
  [
    'https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789-_AbCdE/edit?gid=123456789#gid=123456789',
    { spreadsheetId: '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789-_AbCdE', gid: '123456789' },
  ],
  [
    '  https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789-_AbCdE/edit  ',
    { spreadsheetId: '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789-_AbCdE', gid: undefined },
  ],
  ['https://docs.google.com/document/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789-_AbCdE/edit', null],
  ['https://evil.com/?u=https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789-_AbCdE', null],
  ['not a url', null],
];

for (const [input, expected] of cases) {
  const actual = parseGoogleSheetUrl(input);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`parseGoogleSheetUrl(${JSON.stringify(input)}) = ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  }
}
console.log(`ok - ${cases.length} cases`);
