import { View, type ViewProps, type ViewStyle } from 'react-native';

import { useThemeColor } from '@/presentation/theme/hooks/useThemeColor';

export type ThemedViewProps = Omit<ViewProps, 'pointerEvents'> & {
  lightColor?: string;
  darkColor?: string;
  pointerEvents?: ViewStyle['pointerEvents'];
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  pointerEvents,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'background'
  );

  // Mover pointerEvents al estilo si está presente como prop
  // Esto previene el warning de deprecación en react-native-web
  const viewStyle: ViewStyle[] = [{ backgroundColor }];
  if (style) {
    viewStyle.push(style);
  }
  if (pointerEvents) {
    viewStyle.push({ pointerEvents });
  }

  return <View style={viewStyle} {...otherProps} />;
}
