/**
 * Native counterpart of shadcn/ui <Label>.
 * API: identical (`children`, `style` instead of `className`), except:
 * - `htmlFor` → `nativeID` on the label + `aria-labelledby` on the input
 * - `disabled` prop replaces the `peer-disabled` / `group-data-[disabled]` selectors
 */
import { StyleSheet, Text, type TextProps } from 'react-native';

import { useTheme } from '../hooks/use-theme';

export type LabelProps = TextProps & {
  disabled?: boolean;
};

export function Label({ disabled, style, ...props }: LabelProps) {
  const theme = useTheme();

  return (
    <Text
      style={[styles.base, { color: theme.text }, disabled && styles.disabled, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: 14,
    lineHeight: 14,
    fontWeight: 500,
    userSelect: 'none',
  },
  disabled: {
    opacity: 0.5,
  },
});
