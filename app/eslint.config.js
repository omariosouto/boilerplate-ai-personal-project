// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // Browser storage is only used through @repo/state-management/persisted-state (and @repo/auth).
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: 'Use usePersistedState from @repo/state-management/persisted-state instead.' },
        { name: 'sessionStorage', message: 'Use @repo/auth or @repo/state-management instead.' },
      ],
      // State libraries are only used through the @repo/state-management proxies.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@tanstack/react-query', message: 'Import from @repo/state-management/async-state instead.' },
            { name: 'nuqs', message: 'Import from @repo/state-management/query-state instead.' },
            { name: '@tanstack/react-hotkeys', message: 'Import from @repo/hotkeys instead.' },
          ],
          patterns: [
            { group: ['nuqs/*'], message: 'Import from @repo/state-management/query-state instead.' },
          ],
        },
      ],
    },
  },
]);
