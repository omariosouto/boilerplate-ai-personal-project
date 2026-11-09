/**
 * Native counterpart of shadcn/ui <Button>.
 * API: identical (`variant`, `size`, same values and defaults; `buttonVariants` export), except:
 * - `onClick` → `onPress` (Pressable props)
 * - hover styles → pressed state
 * - `asChild` is not supported
 * - `buttonVariants()` returns style objects instead of class names
 */
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../hooks/use-theme';
import { Colors, Radius, Spacing } from '../theme';

type Theme = (typeof Colors)['light' | 'dark'];

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export function buttonVariants(
  theme: Theme,
  { variant = 'default', size = 'default' }: { variant?: ButtonVariant; size?: ButtonSize } = {}
) {
  const variants: Record<ButtonVariant, { container: ViewStyle; pressed: ViewStyle; text: TextStyle }> = {
    default: {
      container: { backgroundColor: theme.primary },
      pressed: { opacity: 0.9 },
      text: { color: theme.primaryForeground },
    },
    destructive: {
      container: { backgroundColor: theme.destructive },
      pressed: { opacity: 0.9 },
      text: { color: theme.destructiveForeground },
    },
    outline: {
      container: { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.input },
      pressed: { backgroundColor: theme.accent },
      text: { color: theme.text },
    },
    secondary: {
      container: { backgroundColor: theme.secondary },
      pressed: { opacity: 0.8 },
      text: { color: theme.secondaryForeground },
    },
    ghost: {
      container: {},
      pressed: { backgroundColor: theme.accent },
      text: { color: theme.text },
    },
    link: {
      container: {},
      pressed: {},
      text: { color: theme.primary, textDecorationLine: 'underline' },
    },
  };

  return { ...variants[variant], size: sizes[size], sizeText: size === 'xs' ? styles.textXs : null };
}

export function Button({
  variant = 'default',
  size = 'default',
  disabled,
  style,
  children,
  ...props
}: ButtonProps) {
  const theme = useTheme();
  const v = buttonVariants(theme, { variant, size });

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        v.size,
        v.container,
        pressed && v.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...props}>
      {typeof children === 'string' ? (
        <Text style={[styles.text, v.sizeText, v.text]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const sizes = StyleSheet.create({
  default: { height: 36, paddingHorizontal: Spacing.three },
  xs: { height: 24, paddingHorizontal: Spacing.two, gap: Spacing.one },
  sm: { height: 32, paddingHorizontal: 12, gap: 6 },
  lg: { height: 40, paddingHorizontal: Spacing.four },
  icon: { width: 36, height: 36 },
  'icon-xs': { width: 24, height: 24 },
  'icon-sm': { width: 32, height: 32 },
  'icon-lg': { width: 40, height: 40 },
});

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  textXs: {
    fontSize: 12,
    lineHeight: 16,
  },
  disabled: {
    opacity: 0.5,
  },
});
