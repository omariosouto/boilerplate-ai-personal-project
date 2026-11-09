/**
 * Async state (server state: fetching, caching, mutations).
 * Proxy for TanStack Query — https://tanstack.com/query/latest
 *
 * The app imports from `@repo/state-management/async-state`, never from `@tanstack/react-query`,
 * so the underlying library can be swapped or configured in one place.
 */
export {
  QueryClient,
  queryOptions,
  infiniteQueryOptions,
  mutationOptions,
  skipToken,
  useInfiniteQuery,
  useIsFetching,
  useIsMutating,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
  type QueryKey,
  type UseInfiniteQueryOptions,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

export { AsyncStateProvider, createAsyncStateClient } from './provider';
