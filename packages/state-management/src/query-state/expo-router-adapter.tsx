import { router, useGlobalSearchParams, usePathname } from 'expo-router';
import {
  unstable_createAdapterProvider as createAdapterProvider,
  renderQueryString,
  type unstable_AdapterInterface as AdapterInterface,
  type unstable_UpdateUrlFunction as UpdateUrlFunction,
} from 'nuqs/adapters/custom';
import { useMemo } from 'react';

/**
 * nuqs adapter for Expo Router.
 * Reads the current route's search params and writes updates back with `router.push` / `router.replace`.
 *
 * Note: Expo Router merges dynamic segment params (e.g. `[id]`) into the global search params,
 * so avoid naming a query state key after a route segment.
 */
function useExpoRouterAdapter(): AdapterInterface {
  const params = useGlobalSearchParams();
  const pathname = usePathname();

  const searchParams = useMemo(() => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) value.forEach((v) => search.append(key, v));
      else if (value !== undefined) search.set(key, value);
    }
    return search;
  }, [params]);

  const updateUrl: UpdateUrlFunction = (search, options) => {
    const href = `${pathname}${renderQueryString(search)}`;
    if (options.history === 'push') router.push(href as never);
    else router.replace(href as never);
  };

  return { searchParams, pathname, updateUrl };
}

export const QueryStateProvider = createAdapterProvider(useExpoRouterAdapter);
