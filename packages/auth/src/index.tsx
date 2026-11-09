/**
 * Auth, native implementation (iOS/Android).
 * Follows the same contract as the web implementation (see `contract.ts` and `index.web.tsx`).
 *
 * Google Identity Services is browser-only. For now the user is always signed out and `signIn`
 * rejects with a clear error, so screens can be built against the same API on every platform.
 *
 * TODO: implement with native Google Sign-In (needs the iOS/Android OAuth clients and a development
 * build), storing the session in expo-secure-store.
 */
import { createContext, useContext, useMemo } from 'react';

import type { AuthContextValue, AuthContract, AuthProviderProps } from './contract';

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthProvider({ children }: AuthProviderProps) {
  const value = useMemo<AuthContextValue>(
    () => ({
      status: 'signed-out',
      user: null,
      accessToken: null,
      expiresAt: null,
      grantedScopes: [],
      signIn: () => Promise.reject(new Error('Google sign-in is not available on this platform yet.')),
      authorize: () => Promise.reject(new Error('Google sign-in is not available on this platform yet.')),
      signOut: () => {},
    }),
    []
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

const auth = { AuthProvider, useAuth } satisfies AuthContract;

export default auth;
export { AuthProvider, useAuth };
export type { AuthContextValue, AuthStatus, AuthUser, GoogleClientIds } from './contract';
