/**
 * Query state (state stored in the URL search params: filters, tabs, pagination…).
 * Proxy for nuqs — https://nuqs.dev
 *
 * Works on web and native: `QueryStateProvider` plugs nuqs into Expo Router, so on web the state
 * lives in the browser URL and on native in the route params (deep-linkable on both).
 *
 * The app imports from `@repo/state-management/query-state`, never from `nuqs`.
 */
export {
  createParser,
  createSerializer,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsFloat,
  parseAsInteger,
  parseAsIsoDate,
  parseAsIsoDateTime,
  parseAsJson,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringEnum,
  parseAsStringLiteral,
  parseAsTimestamp,
  useQueryState,
  useQueryStates,
  type Options as QueryStateOptions,
  type Parser,
} from 'nuqs';

export { QueryStateProvider } from './expo-router-adapter';
