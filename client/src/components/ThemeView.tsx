import React from 'react';
import {PropsWithChildren} from 'react';
import {StyleProp, View, ViewStyle} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {useColorScheme} from '../hooks/useColorScheme';

function ThemeView({
  children,
  style,
}: PropsWithChildren<{style?: StyleProp<ViewStyle>}>) {
  const colorScheme = useColorScheme();
  return (
    <View
      style={[
        {
          backgroundColor: {light: Colors.White, dark: Colors.black}[
            colorScheme
          ],
        },
        style,
      ]}>
      {children}
    </View>
  );
}

export default ThemeView;
