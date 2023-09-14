import {
  ImageStyle,
  StyleProp,
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
  T extends Record<string, ViewStyle | TextStyle | ImageStyle>,
>(styles: {
  dark: T;
  light: T;
}) => {
  const stylesheet = StyleSheet.create(styles);
  return () => stylesheet[useColorScheme()];
};
