/**
 * Auth, web implementation: Google sign-in 100% client-side with Google Identity Services.
 * https://developers.google.com/identity/oauth2/web/guides/use-token-model
 *
 * The OAuth token popup works with any button (no Google-rendered button needed). The session
 * (access token + profile) lives in `sessionStorage`, so it ends when the tab closes or the token expires (~1h).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { AuthContextValue, AuthContract, AuthProviderProps, AuthStatus, AuthUser } from './contract';

const GSI_SRC = 'https://accounts.google.com/gsi/client';
const BASE_SCOPES = ['openid', 'email', 'profile'];
const STORAGE_KEY = 'repo-auth:session';

type Session = {
  accessToken: string;
  expiresAt: number;
  scopes: string[];
  user: AuthUser;
};

type TokenResponse = {
  access_token: string;
  expires_in: number | string;
  scope: string;
  error?: string;
  error_description?: string;
};

type GoogleAccounts = {
  oauth2: {
    initTokenClient: (config: {
      client_id: string;
      scope: string;
      include_granted_scopes?: boolean;
      login_hint?: string;
      callback: (response: TokenResponse) => void;
      error_callback?: (error: { type: string; message?: string }) => void;
    }) => { requestAccessToken: () => void };
    revoke: (accessToken: string, done?: () => void) => void;
  };
};

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

let gsiPromise: Promise<GoogleAccounts> | null = null;

function loadGoogleIdentityServices() {
  gsiPromise ??= new Promise<GoogleAccounts>((resolve, reject) => {
    if (window.google?.accounts) return resolve(window.google.accounts);
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => (window.google ? resolve(window.google.accounts) : reject(new Error('Google Identity Services failed to load')));
    script.onerror = () => {
      gsiPromise = null;
      reject(new Error('Google Identity Services failed to load'));
    };
    document.head.appendChild(script);
  });
  return gsiPromise;
}

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (session.expiresAt > Date.now() && Array.isArray(session.scopes)) return session;
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
  return null;
}

function writeSession(session: Session | null) {
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function requestAccessToken(accounts: GoogleAccounts, clientId: string, scopes: string[], loginHint?: string) {
  return new Promise<TokenResponse>((resolve, reject) => {
    const client = accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: scopes.join(' '),
      include_granted_scopes: true,
      login_hint: loginHint,
      callback: (response) =>
        response.error ? reject(new Error(response.error_description ?? response.error)) : resolve(response),
      error_callback: (error) => reject(new Error(error.message ?? error.type)),
    });
    client.requestAccessToken();
  });
}

async function fetchProfile(accessToken: string): Promise<AuthUser> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Failed to load Google profile (${response.status})`);
  const info = (await response.json()) as { sub: string; email: string; name: string; picture?: string };
  return { id: info.sub, email: info.email, name: info.name, picture: info.picture };
}

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthProvider({ googleClientIds, children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  // sessionStorage only exists in the browser: restore after hydration, and preload the GIS script.
  useEffect(() => {
    const restored = readSession();
    setSession(restored);
    setStatus(restored ? 'signed-in' : 'signed-out');
    loadGoogleIdentityServices().catch(() => {});
  }, []);

  const clear = useCallback(() => {
    writeSession(null);
    setSession(null);
    setStatus('signed-out');
  }, []);

  // Sign out locally when the access token expires.
  useEffect(() => {
    if (!session) return;
    const timeout = setTimeout(clear, session.expiresAt - Date.now());
    return () => clearTimeout(timeout);
  }, [session, clear]);

  const signIn = useCallback(async () => {
    const accounts = await loadGoogleIdentityServices();
    const token = await requestAccessToken(accounts, googleClientIds.web, BASE_SCOPES);
    const user = await fetchProfile(token.access_token);
    const next: Session = {
      accessToken: token.access_token,
      expiresAt: Date.now() + Number(token.expires_in) * 1000,
      scopes: token.scope.split(' '),
      user,
    };
    writeSession(next);
    setSession(next);
    setStatus('signed-in');
  }, [googleClientIds.web]);

  const authorize = useCallback(
    async (scopes: string[]) => {
      if (!session) throw new Error('Sign in before requesting extra permissions.');
      const missing = scopes.filter((scope) => !session.scopes.includes(scope));
      if (missing.length === 0) return session.accessToken;

      const accounts = await loadGoogleIdentityServices();
      const token = await requestAccessToken(
        accounts,
        googleClientIds.web,
        [...new Set([...session.scopes, ...scopes])],
        session.user.email
      );
      const granted = token.scope.split(' ');
      const denied = scopes.filter((scope) => !granted.includes(scope));
      if (denied.length > 0) throw new Error(`Permission not granted: ${denied.join(', ')}`);

      const next: Session = {
        ...session,
        accessToken: token.access_token,
        expiresAt: Date.now() + Number(token.expires_in) * 1000,
        scopes: granted,
      };
      writeSession(next);
      setSession(next);
      return next.accessToken;
    },
    [session, googleClientIds.web]
  );

  const signOut = useCallback(() => {
    if (session) window.google?.accounts.oauth2.revoke(session.accessToken);
    clear();
  }, [session, clear]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      expiresAt: session?.expiresAt ?? null,
      grantedScopes: session?.scopes ?? [],
      signIn,
      authorize,
      signOut,
    }),
    [status, session, signIn, authorize, signOut]
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
