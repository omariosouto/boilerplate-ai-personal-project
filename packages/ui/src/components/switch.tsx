/**
 * Native counterpart of shadcn/ui <Switch>.
 * API: identical (`checked`, `defaultChecked`, `onCheckedChange`, `disabled`, `size`), except:
 * - `className` → `style`
 * - focus ring only on web (keyboard focus)
 */
import { useState } from 'react';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

import { useColorScheme } from '../hooks/use-color-scheme';
import { useTheme } from '../hooks/use-theme';

export type SwitchSize = 'default' | 'sm';

export type SwitchProps = Omit<PressableProps, 'children' | 'style' | 'onPress'> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: SwitchSize;
  style?: StyleProp<ViewStyle>;
};

// h-[1.15rem] w-8 / thumb size-4  ·  h-3.5 w-6 / thumb size-3
const sizes = {
  default: { width: 32, height: 18.4, thumb: 16 },
  sm: { width: 24, height: 14, thumb: 12 },
} as const;

export function Switch({
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  size = 'default',
  disabled,
  style,
  ...props
}: SwitchProps) {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const [uncontrolled, setUncontrolled] = useState(defaultChecked);
  const checked = checkedProp ?? uncontrolled;
  const { width, height, thumb } = sizes[size];

  // translate-x-[calc(100%-2px)], ease-out like a CSS transition
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(checked ? thumb - 2 : 0, { duration: 150, easing: Easing.out(Easing.quad) }) },
    ],
  }));

  return (
    <Pressable
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onPress={() => {
        if (checkedProp === undefined) setUncontrolled(!checked);
        onCheckedChange?.(!checked);
      }}
      style={[
        styles.root,
        { width, height, backgroundColor: checked ? theme.primary : theme.input },
        disabled && styles.disabled,
        style,
      ]}
      {...props}>
      <Animated.View
        style={[
          styles.thumb,
          {
            width: thumb,
            height: thumb,
            backgroundColor: isDark ? (checked ? theme.primaryForeground : theme.text) : theme.background,
          },
          thumbStyle,
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  thumb: {
    borderRadius: 999,
  },
  disabled: {
    opacity: 0.5,
  },
});
