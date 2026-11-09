import { useAuth } from '@repo/auth';
import { Button, useTheme } from '@repo/ui';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SheetDbForm } from '@/components/sheet-db-form';
import { ThemedText } from '@/components/themed-text';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemedView } from '@/components/themed-view';
import { useCountdown } from '@/hooks/use-countdown';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function WelcomeScreen() {
  const { status, user, expiresAt, signIn, signOut } = useAuth();
  const timeLeft = useCountdown(expiresAt);
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function handleSignIn() {
    setError(null);
    setIsSigningIn(true);
    try {
      await signIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed.');
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.hero}>
          <ThemedText type="title" style={styles.center}>
            {user ? `Hi, ${user.name.split(' ')[0]}` : 'Welcome'}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.center}>
            {user ? user.email : 'Sign in to get started.'}
          </ThemedText>
          <ThemeToggle />
          {error && (
            <ThemedText type="small" style={[styles.center, { color: theme.destructive }]}>
              {error}
            </ThemedText>
          )}
        </ThemedView>

        {status === 'signed-in' && <SheetDbForm />}

        {status === 'signed-in' ? (
          <Button variant="outline" size="lg" style={styles.button} onPress={signOut}>
            {timeLeft ? `Sign out · ${timeLeft}` : 'Sign out'}
          </Button>
        ) : (
          <Button
            size="lg"
            style={styles.button}
            disabled={status === 'loading' || isSigningIn}
            onPress={handleSignIn}>
            {isSigningIn ? 'Signing in…' : 'Sign in with Google'}
          </Button>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  center: {
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
  },
});
