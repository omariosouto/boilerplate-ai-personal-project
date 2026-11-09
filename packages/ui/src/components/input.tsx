/**
 * Native counterpart of shadcn/ui <Input>.
 * API: identical (`type`, `disabled`, `aria-invalid`, `value`, `placeholder`…), except:
 * - `onChange` → `onChangeText` (TextInput props); `type` maps to keyboard/secure entry
 * - `disabled` → `editable={false}` under the hood
 * - no `file` type
 */
import { useState } from 'react';
import { Platform, StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { useTheme } from '../hooks/use-theme';
import { Radius, Spacing } from '../theme';

export type InputType = 'text' | 'email' | 'password' | 'url' | 'number' | 'tel' | 'search';

export type InputProps = Omit<TextInputProps, 'editable'> & {
  type?: InputType;
  disabled?: boolean;
  'aria-invalid'?: boolean;
};

const typeProps: Record<InputType, TextInputProps> = {
  text: {},
  email: { keyboardType: 'email-address', autoCapitalize: 'none', autoComplete: 'email' },
  password: { secureTextEntry: true, autoCapitalize: 'none', autoComplete: 'password' },
  url: { keyboardType: 'url', autoCapitalize: 'none', autoCorrect: false },
  number: { keyboardType: 'numeric' },
  tel: { keyboardType: 'phone-pad', autoComplete: 'tel' },
  search: { returnKeyType: 'search' },
};

export function Input({
  type = 'text',
  disabled,
  'aria-invalid': invalid,
  style,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const ringColor = invalid ? theme.destructive : theme.ring;

  return (
    <TextInput
      {...typeProps[type]}
      editable={!disabled}
      aria-invalid={invalid}
      placeholderTextColor={theme.mutedForeground}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        styles.base,
        { borderColor: invalid ? theme.destructive : theme.input, color: theme.text },
        focused && { borderColor: ringColor, boxShadow: `0 0 0 3px ${ringColor}40` },
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    height: 36,
    width: '100%',
    minWidth: 0,
    borderWidth: 1,
    borderRadius: Radius.md,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: Spacing.one,
    fontSize: Platform.select({ web: 14, default: 16 }),
    outlineWidth: 0,
  },
  disabled: {
    opacity: 0.5,
  },
});
