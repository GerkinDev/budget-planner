import {
  ImageStyle,
  StyleSheet,
  TextStyle,
  ViewStyle,
  useColorScheme as _useColorScheme,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';

export const useColorScheme = () => _useColorScheme() ?? 'dark';

const themeBackgrounds = StyleSheet.create({
  dark: {
    backgroundColor: Colors.darker,
  },
  light: {
    backgroundColor: Colors.lighter,
  },
});
export const useThemeBg = () => themeBackgrounds[useColorScheme()];
export const buildThemeStylesheet = <
  T extends {
    dark: Record<string, ViewStyle | TextStyle | ImageStyle>;
    light: Record<string, ViewStyle | TextStyle | ImageStyle>;
  },
>(
  styles: T,
): (() => T[keyof T]) => {
  const stylesheet = Object.fromEntries(
    Object.entries(styles).map(([key, value]) => [
      key,
      StyleSheet.create(value),
    ]),
  ) as T;
  return () => stylesheet[useColorScheme()];
};
