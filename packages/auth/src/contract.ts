/**
 * Public API of `@repo/auth`. Every platform implementation must satisfy this contract:
 * - `index.web.tsx` → Google Identity Services (OAuth token popup), session kept in `sessionStorage`
 * - `index.tsx`     → native (iOS/Android)
 */
import type { ReactNode } from 'react';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in';

export type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  /** Google access token, for calling Google APIs or sending to your backend for verification. */
  accessToken: string | null;
  /** When the session ends (ms since epoch). The user is signed out automatically at that moment. */
  expiresAt: number | null;
  /** OAuth scopes the current access token carries. */
  grantedScopes: string[];
  signIn: () => Promise<void>;
  /**
   * Incremental authorization: asks the signed-in user for extra scopes (e.g. `drive.file`) only when a
   * feature needs them. Resolves with the new access token, which carries the old and new scopes.
   */
  authorize: (scopes: string[]) => Promise<string>;
  signOut: () => void;
};

export type GoogleClientIds = {
  web: string;
  ios?: string;
  android?: string;
};

export type AuthProviderProps = {
  googleClientIds: GoogleClientIds;
  children: ReactNode;
};

export type AuthContract = {
  AuthProvider: (props: AuthProviderProps) => ReactNode;
  useAuth: () => AuthContextValue;
};
